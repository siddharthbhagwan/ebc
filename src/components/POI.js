import React, { useState, useEffect, useCallback, useRef } from "react";
import * as L from "leaflet";
import { connect } from "react-redux";
import ReactGA from "react-ga4";
import { isDesktop } from "react-device-detect";
import "../resources/css/dashboard.css";
import { getMarkers } from "../utils/markers";
import { mapDispatchToProps } from "../utils/utils";
import { Marker, withLeaflet, Tooltip } from "react-leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { getColorForElevation } from "../utils/heightGradient";
import tentIcon from "../resources/images/tent.svg";
import ebcIcon from "../resources/images/ebc.svg";
import airportIcon from "../resources/images/airport.svg";
import passIcon from "../resources/images/pass.svg";
import summitIcon from "../resources/images/summit.svg";

const ZOOM_MOBILE = 10.7;

// Collision detection helper - checks if two rectangles overlap
const rectsOverlap = (rect1, rect2, padding = 4) => {
  if (!rect1 || !rect2) return false;
  return !(
    rect1.right + padding < rect2.left - padding ||
    rect1.left - padding > rect2.right + padding ||
    rect1.bottom + padding < rect2.top - padding ||
    rect1.top - padding > rect2.bottom + padding
  );
};

const POI = (props) => {
  const { map } = props.leaflet;
  const {
    markerZoom,
    dispatchLayerDetails,
    zoom,
    unit,
    currentDay,
    isSingleDayView,
    setSingleDayView,
    showLegend,
  } = props;

  const derivedZoom = isDesktop ? zoom : ZOOM_MOBILE;
  
  // Initialize currentZoom with the correct value for the device
  const [currentZoom, setCurrentZoom] = useState(map ? map.getZoom() : derivedZoom);
  const collisionCheckRef = useRef(null);

  // Listen for zoom changes - track actual zoom level for detail control
  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
    };

    map.on("zoom", handleZoom);
    map.on("zoomend", handleZoom);

    return () => {
      map.off("zoom", handleZoom);
      map.off("zoomend", handleZoom);
    };
  }, [map]);

  // Collision detection - hide overlapping labels, EBC always visible
  const checkLabelCollisions = useCallback(() => {
    if (!map) return;
    
    const tooltips = document.querySelectorAll('.leaflet-tooltip.tooltipLabel');
    if (!tooltips.length) return;
    
    // Build array of tooltip data with bounding rects
    const tooltipData = [];
    tooltips.forEach((tooltip) => {
      const rect = tooltip.getBoundingClientRect();
      // Skip if tooltip is not visible or has no size
      if (rect.width === 0 || rect.height === 0) return;
      
      const nameElement = tooltip.querySelector('div > div > span');
      const name = nameElement ? nameElement.textContent : '';
      
      // EBC gets highest priority (1), everything else equal priority (2)
      const priority = (name === 'Everest Base Camp' || name === 'EBC') ? 1 : 2;
      
      tooltipData.push({
        element: tooltip,
        rect,
        priority,
        name,
      });
    });
    
    // Sort by priority (EBC first), then by order in DOM
    tooltipData.sort((a, b) => a.priority - b.priority);
    
    // Track visible label rectangles
    const visibleRects = [];
    
    tooltipData.forEach((data) => {
      // Check for collision with already-visible labels
      let hasCollision = false;
      for (const visibleRect of visibleRects) {
        if (rectsOverlap(data.rect, visibleRect)) {
          hasCollision = true;
          break;
        }
      }
      
      if (hasCollision) {
        // Hide this label
        data.element.style.opacity = '0';
        data.element.style.pointerEvents = 'none';
      } else {
        // Show this label
        visibleRects.push(data.rect);
        data.element.style.opacity = '1';
        data.element.style.pointerEvents = 'auto';
      }
    });
  }, [map]);

  // Run collision detection on zoom/move/resize
  useEffect(() => {
    if (!map) return;
    
    const runCollisionCheck = () => {
      if (collisionCheckRef.current) {
        clearTimeout(collisionCheckRef.current);
      }
      collisionCheckRef.current = setTimeout(() => {
        checkLabelCollisions();
      }, 150);
    };
    
    // Initial check after render
    const initialCheck = setTimeout(() => {
      checkLabelCollisions();
    }, 400);
    
    map.on('zoomend', runCollisionCheck);
    map.on('moveend', runCollisionCheck);
    map.on('resize', runCollisionCheck);
    window.addEventListener('resize', runCollisionCheck);
    
    return () => {
      clearTimeout(initialCheck);
      if (collisionCheckRef.current) {
        clearTimeout(collisionCheckRef.current);
      }
      map.off('zoomend', runCollisionCheck);
      map.off('moveend', runCollisionCheck);
      map.off('resize', runCollisionCheck);
      window.removeEventListener('resize', runCollisionCheck);
    };
  }, [map, checkLabelCollisions]);

  // Re-run collision detection when view mode or day changes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkLabelCollisions();
    }, 400);
    return () => clearTimeout(timer);
  }, [isSingleDayView, currentDay, checkLabelCollisions]);

  const isZoomedIn = currentZoom > derivedZoom + 0.5;

  // Format altitude based on unit
  const formatAltitude = (altFt) => {
    if (!altFt) return "";
    const numericAlt = parseInt(altFt.replace(/,/g, ""), 10);
    if (unit === "km") {
      // Convert feet to meters
      const meters = Math.round(numericAlt * 0.3048);
      return `${meters.toLocaleString()} m`;
    } else {
      // Keep as feet
      return `${numericAlt.toLocaleString()} ft`;
    }
  };

  const addPOIs = () => {
    const markerData = getMarkers();
    const routesData = getDayWiseDataG();
    const currentRoute = routesData[currentDay];
    const isCurrentDayRestDay =
      currentRoute &&
      currentRoute.features &&
      currentRoute.features[0] &&
      currentRoute.features[0].properties.time === "Rest Day";

    // Determine destination coordinate of current day to identify "end of day" house
    const getDestinationCoord = (route) => {
      if (!route || !route.features || !route.features.length) return null;
      // Get the last feature in the collection to ensure we find the actual daily destination
      const feature = route.features[route.features.length - 1];
      const coords = feature.geometry.coordinates;
      if (feature.geometry.type === "MultiLineString") {
        const lastLine = coords[coords.length - 1];
        return lastLine[lastLine.length - 1];
      } else if (feature.geometry.type === "Point") {
        return coords;
      } else {
        return coords[coords.length - 1];
      }
    };

    // Determine start coordinate of current day to identify "start of day" house
    const getStartCoord = (route) => {
      if (!route || !route.features || !route.features.length) return null;
      // Get the first feature to find the starts
      const feature = route.features[0];
      const coords = feature.geometry.coordinates;
      if (feature.geometry.type === "MultiLineString") {
        const firstLine = coords[0];
        return firstLine[0];
      } else if (feature.geometry.type === "Point") {
        return coords;
      } else {
        return coords[0];
      }
    };

    const destCoord = getDestinationCoord(currentRoute);
    const startCoord = getStartCoord(currentRoute);

    const arr = [];
    markerData.forEach((markerPoint) => {
      const isHouse = markerPoint.icon === tentIcon;
      const isEBC = markerPoint.icon === ebcIcon;
      const isAirport = markerPoint.icon === airportIcon;
      const isPass = markerPoint.icon === passIcon;
      const isSummit = markerPoint.icon === summitIcon;

      // Check if this marker is at the destination coordinate
      // Precision threshold: 0.0015 (~150m) to avoid multiple highlights in villages like Namche
      const isDest =
        destCoord &&
        Math.abs(markerPoint.point[0] - destCoord[1]) < 0.005 &&
        Math.abs(markerPoint.point[1] - destCoord[0]) < 0.005;

      // Check if this marker is at the start coordinate
      const isStart =
        startCoord &&
        Math.abs(markerPoint.point[0] - startCoord[1]) < 0.005 &&
        Math.abs(markerPoint.point[1] - startCoord[0]) < 0.005;

      // Check if this marker matches the current day
      const currentDayStr = String(currentDay);
      const isDayMatch = markerPoint.properties.day
        .split(/[,&]/)
        .map((d) => d.trim())
        .includes(currentDayStr);

      // On acclimatization days (Rest Days), only show the destination house
      if (isZoomedIn && isCurrentDayRestDay) {
        if (!isDest || !isHouse) {
          return;
        }
      }

      // Snap to route coordinates if it's the start or end of the current day
      let snappedPoint = markerPoint.point;
      if (isZoomedIn) {
        if (isDest && destCoord) {
          snappedPoint = [destCoord[1], destCoord[0]];
        } else if (isStart && startCoord) {
          snappedPoint = [startCoord[1], startCoord[0]];
        }
      }

      // Determine circle logic:
      // In Single Day View, Circle only the destination and airports.
      // In Overview, only circle airports (not houses to avoid duplication).
      const shouldCircle = !isSingleDayView
        ? isAirport
        : isDest || isAirport;
      
      // Houses always get white background circles for visibility, but not pulsating circles
      const shouldHaveWhiteCircle = isHouse;

      // Altitude-based border color
      const altFt = parseInt(
        (markerPoint.properties.startAlt || "0").replace(/,/g, ""),
        10,
      );
      const altM = altFt * 0.3048;
      const borderColor = getColorForElevation(altM);

      const rippleClass =
        isCurrentDayRestDay && isDayMatch && isHouse ? "rest-day-ripple" : "";

      let icon;
      if (shouldCircle) {
        // Destination Circle Wrapper
        // Decrease circle size by 1px for non-rest days, iconSize remains same
        const wrapSize = isHouse
          ? isCurrentDayRestDay
            ? isDesktop
              ? 17
              : 17
            : isDesktop
              ? 16
              : 16
          : isAirport
            ? isDesktop
              ? 20
              : 19
            : markerPoint.size[0] + (isDesktop ? 5 : 4);
        const imgSize = isHouse
          ? isDesktop
            ? 9
            : 10
          : isAirport
            ? isDesktop
              ? 15
              : 14
            : markerPoint.size[0];

        let imgClass = "";
        if (isEBC) imgClass = "ebc-marker-icon";
        if (isPass) imgClass = "flag-marker-icon";
        if (isSummit) imgClass = "summit-marker-icon";

        let imgStyle = `width: ${imgSize}px; height: ${imgSize}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
        if (isSummit) {
          imgStyle = `width: ${imgSize * 0.8}px; height: ${imgSize * 0.8}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
        }

        const pulseClass = isSingleDayView ? "pulsating-circle" : "";

        // Create larger tap target on mobile for better accessibility
        const tapTargetSize = !isDesktop ? Math.max(wrapSize + 20, 44) : wrapSize;

        icon = L.divIcon({
          className: "dest-circle-wrapper",
          iconSize: [tapTargetSize, tapTargetSize],
          iconAnchor: [tapTargetSize / 2, tapTargetSize / 2],
          html: `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
                  <div class="rest-day-circle ${pulseClass} ${rippleClass}" style="border-color: ${borderColor}; border-width: 1.5px; width: ${wrapSize}px; height: ${wrapSize}px; position: relative;">
                    <img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />
                  </div>
                 </div>`,
          shadowUrl: null,
        });
      } else if (shouldHaveWhiteCircle && !shouldCircle) {
        // Houses without pulsating circles, but with white background for visibility
        const wrapSize = isDesktop ? 16 : 16;
        const imgSize = isDesktop ? 9 : 10;
        
        // Altitude-based border color
        const altFt = parseInt(
          (markerPoint.properties.startAlt || "0").replace(/,/g, ""),
          10,
        );
        const altM = altFt * 0.3048;
        const borderColor = getColorForElevation(altM);

        // Create larger tap target on mobile for better accessibility
        const tapTargetSize = !isDesktop ? Math.max(wrapSize + 20, 44) : wrapSize;

        icon = L.divIcon({
          className: "house-white-circle-wrapper",
          iconSize: [tapTargetSize, tapTargetSize],
          iconAnchor: [tapTargetSize / 2, tapTargetSize / 2],
          html: `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
                  <div class="rest-day-circle" style="border-color: ${borderColor}; border-width: 1.5px; width: ${wrapSize}px; height: ${wrapSize}px; position: relative;">
                    <img src="${markerPoint.icon}" style="width: ${imgSize}px; height: ${imgSize}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />
                  </div>
                 </div>`,
          shadowUrl: null,
        });
      } else {
        // Standard icons WITHOUT circles
        let imgClass = "";
        if (isEBC) imgClass = "ebc-marker-icon";
        if (isPass) imgClass = "flag-marker-icon";
        if (isSummit) imgClass = "summit-marker-icon";

        let imgStyle = "width: 100%; height: 100%;";
        if (isSummit) {
          imgStyle = "width: 80%; height: 80%; margin: 10%;";
        }

        // Feature: Underscore/Underline for Starting House in Zoomed View
        // Only show if it's the start, it's zoomed in, and not already circled (which would be dest)
        const showUnderscore = isStart && isZoomedIn && !shouldCircle;

        let adjustedSize = markerPoint.size;
        if (!isDesktop && isHouse) {
          adjustedSize = [adjustedSize[0] - 1, adjustedSize[1] - 1];
        }

        // Create larger tap target on mobile for better accessibility
        const tapTargetSize = !isDesktop
          ? [Math.max(adjustedSize[0] + 20, 44), Math.max(adjustedSize[1] + 20, 44)]
          : adjustedSize;

        icon = L.divIcon({
          className: "standard-poi-wrapper",
          iconSize: tapTargetSize,
          iconAnchor: [tapTargetSize[0] / 2, tapTargetSize[1] / 2],
          html: `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
               <div style="width: ${adjustedSize[0]}px; height: ${adjustedSize[1]}px; position: relative;">
                 <img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />
                 ${
                   showUnderscore
                     ? `<div style="position: absolute; bottom: -7px; width: 140%; height: 3.5px; background: #000; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`
                     : ""
                 }
               </div>
            </div>`,
          shadowUrl: null,
        });
      }

      arr.push(
        <Marker
          position={snappedPoint}
          style={markerPoint.properties}
          key={snappedPoint.toString() + markerPoint.properties.day}
          onclick={clickHandler}
          ondblclick={clickHandler}
          onmouseover={mouseoverHandler}
          icon={icon}
          properties={markerPoint.properties}
          keyboard={false} // Disable keyboard focus to prevent overlap with throb effect
        >
          {(() => {
            // In single day view on desktop, show all POIs but with different styling:
            // - Current day POIs: full details (name, day, altitude) in larger font
            // - Other POIs: just name in smaller font
            // In overview, show all labels (collision detection will hide overlapping ones)
            const isCurrentDayPOI = isDayMatch || isDest || isStart;
            const isOtherDayInSingleView = isSingleDayView && isDesktop && !isCurrentDayPOI;
            
            return (
              <Tooltip
                permanent={true}
                className={"tooltipLabel"}
                direction={markerPoint.properties.direction}
                onclick={clickHandler}
              >
                <div
                  style={{
                    fontSize: isOtherDayInSingleView ? "9px" : (isZoomedIn ? "14px" : "11px"),
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    const syntheticEvent = {
                      target: {
                        options: {
                          properties: markerPoint.properties,
                        },
                      },
                      latlng: snappedPoint,
                    };
                    clickHandler(syntheticEvent);
                  }}
                >
                  {isOtherDayInSingleView ? (
                    // Other day POIs in single view: just name, smaller but readable
                    <div style={{ fontWeight: "500", opacity: 0.85 }}>
                      {markerPoint.properties.name}
                    </div>
                  ) : (
                    // Current day POIs or overview: full details
                    <>
                      <div style={{ fontWeight: isZoomedIn ? "600" : "normal", display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span>{markerPoint.properties.name}</span>
                        <span style={{ fontSize: "0.75em", fontWeight: "normal", opacity: 0.6 }}>
                          D{isSingleDayView ? currentDay : markerPoint.properties.day}
                        </span>
                      </div>
                      {markerPoint.properties.startAlt && (
                        <div
                          style={{
                            fontSize: "0.9em",
                            opacity: 0.8,
                            marginTop: "2px",
                          }}
                        >
                          {formatAltitude(markerPoint.properties.startAlt)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Tooltip>
            );
          })()}
        </Marker>,
      );
    });
    return arr;
  };

  const clickHandler = (e) => {
    const markerProps = e.target.options.properties;
    const markerDays = (markerProps.day || "")
      .split(/[,&]/)
      .map((d) => d.trim())
      .filter((d) => d !== "");

    // Determine marker type for tracking
    const getMarkerType = (props) => {
      if (props.name?.toLowerCase().includes("base camp") || props.name === "EBC") return "Base Camp";
      if (props.name?.toLowerCase().includes("pass")) return "Pass";
      if (props.name?.toLowerCase().includes("peak") || props.name === "Gokyo Ri" || props.name === "Kala Patthar") return "Summit";
      if (props.name === "Lukla") return "Airport";
      return "Camp";
    };

    // Logic: Identify which single numeric day to switch to.
    // If the marker has multiple days, and our current day is NOT one of them,
    // or our current day is a composite string, pick the first day from the marker.
    let targetDay = currentDay;
    const currentDayStr = String(currentDay);

    if (
      !markerDays.includes(currentDayStr) ||
      currentDayStr.includes(",") ||
      currentDayStr.includes("&")
    ) {
      targetDay = markerDays[0] || currentDay;
    }

    // Track marker click
    ReactGA.event({
      category: "POI",
      action: "Click Marker",
      label: `${markerProps.name} (${getMarkerType(markerProps)}) - Day ${targetDay} - from Day ${currentDay} - ${isDesktop ? "Desktop" : "Mobile"}`,
    });

    // Crucial: Update the payload to use the single numeric targetDay
    // instead of the composite string "2, 3, 19 & 20"
    const updatedProps = { ...markerProps, day: String(targetDay) };
    dispatchLayerDetails(updatedProps);

    // Toggle behavior: if already in single day view on mobile, toggle back to overview
    if (!isDesktop && isSingleDayView && markerDays.includes(currentDayStr)) {
      setSingleDayView(false); // Toggle back to overview
      return; // Skip zoom logic
    }

    setSingleDayView(true); // Switch to Single Day View on selection

    // Recalculate bounds based on the full day's route collection
    const routesData = getDayWiseDataG();
    const targetRoute = routesData[targetDay];

    const effectivePaddingTopLeft = isDesktop
      ? [120, showLegend ? 180 : 120]
      : [40, 110];

    const effectivePaddingBottomRight = isDesktop ? [650, 180] : [40, 190];

    if (targetRoute) {
      // Create bounds from only LineString/MultiLineString features (route points),
      // not Point features (POI icons) to ensure bounding box matches route only
      const routeOnlyFeatures = {
        ...targetRoute,
        features: targetRoute.features.filter(f => 
          f.geometry.type === 'MultiLineString' || f.geometry.type === 'LineString'
        )
      };
      
      if (routeOnlyFeatures.features.length > 0) {
        const layer = L.geoJSON(routeOnlyFeatures);
        const bounds = layer.getBounds();

        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: props.zoomDuration,
          });
          return;
        }
      }
    }

    // Fallback to marker position if route bounds aren't available
    map.flyToBounds(L.latLngBounds(e.latlng, e.latlng), {
      paddingTopLeft: effectivePaddingTopLeft,
      paddingBottomRight: effectivePaddingBottomRight,
      maxZoom: markerZoom,
      duration: props.zoomDuration,
    });
  };

  const mouseoverHandler = (e) => {
    // In single day view on desktop, disable hover to prevent day switching
    // User must click the button to exit single day view
    if (isSingleDayView && isDesktop) {
      return;
    }

    const markerProps = e.target.options.properties;
    const markerDays = (markerProps.day || "")
      .split(/[,&]/)
      .map((d) => d.trim())
      .filter((d) => d !== "");

    let targetDay = currentDay;
    const currentDayStr = String(currentDay);

    if (
      !markerDays.includes(currentDayStr) ||
      currentDayStr.includes(",") ||
      currentDayStr.includes("&")
    ) {
      targetDay = markerDays[0] || currentDay;
    }

    // Fetch route data for the target day to get full properties including descent, total_climb, etc.
    const routesData = getDayWiseDataG();
    const routeForDay = routesData[targetDay];
    const routeProps = routeForDay?.features?.[0]?.properties || {};

    // Merge route properties with marker properties, prioritizing marker props for name and altitude
    const updatedProps = { 
      ...routeProps,
      ...markerProps, 
      day: String(targetDay) 
    };
    dispatchLayerDetails(updatedProps);
  };

  return addPOIs();
};

const mapStateToProps = (state) => ({
  markerZoom: state.mapState.markerZoom,
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  zoom: state.mapState.zoom,
  unit: state.mapState.unit,
  currentDay: state.route.day,
  isSingleDayView: state.mapState.isSingleDayView,
  showLegend: state.mapState.showLegend,
});

export default connect(mapStateToProps, mapDispatchToProps)(withLeaflet(POI));
