import React, { useState, useEffect } from "react";
import * as L from "leaflet";
import { connect } from "react-redux";
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

const POI = (props) => {
  const { map } = props.leaflet;
  const {
    markerZoom,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
    zoom,
    unit,
    currentDay,
    isSingleDayView,
    setSingleDayView,
    showLegend,
  } = props;

  const [currentZoom, setCurrentZoom] = useState(map ? map.getZoom() : zoom);

  const derivedZoom = isDesktop ? zoom : ZOOM_MOBILE;

  // Listen for zoom changes
  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      const newZoom = map.getZoom();
      const wasZoomedIn = currentZoom > derivedZoom + 0.5;
      const isNowZoomedIn = newZoom > derivedZoom + 0.5;

      if (wasZoomedIn !== isNowZoomedIn) {
        setCurrentZoom(newZoom);
      }
    };

    map.on("zoom", handleZoom);

    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map, currentZoom, derivedZoom]);

  const isZoomedIn = currentZoom > derivedZoom + 0.5;

  // Check if a marker's day matches the current day
  const isDayRelevant = (markerDay) => {
    if (!isZoomedIn || currentDay === "0") return true; // Show all when zoomed out or on Day 0

    // Handle multi-day markers like "2 & 3", "10, 11 & 12"
    const days = markerDay.split(/[,&]/).map((d) => parseInt(d.trim(), 10));
    const curr = parseInt(currentDay, 10);

    // A marker is relevant if it's the arrival point of the current day (curr)
    // OR the starting point (arrival point of the previous day, curr - 1)
    return days.includes(curr) || days.includes(curr - 1);
  };

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

      // Filter out markers that aren't relevant to the current day when zoomed in
      // We keep: dest, matches day, start of route, or Airports.
      // Houses are only kept if they belong to the current day (start or dest).
      if (isZoomedIn && !isDayMatch && !isDest && !isStart && !isAirport) {
        return;
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

      // On acclimatization days (Rest Days), only show the circled house
      if (isZoomedIn && isCurrentDayRestDay) {
        if (!isDest || !isHouse) {
          return;
        }
      }

      // Determine circle logic:
      // In Overview, circle all Houses & Airports.
      // In Single Day View, Circle only the destination and airports.
      const shouldCircle = !isSingleDayView
        ? isHouse || isAirport
        : isDest || isAirport;

      // Altitude-based border color
      const altFt = parseInt(
        (markerPoint.properties.startAlt || "0").replace(/,/g, ""),
        10,
      );
      const altM = altFt * 0.3048;
      const borderColor = getColorForElevation(altM);

      const pulseClass = isDest ? "pulsating-circle" : "";
      const rippleClass =
        isCurrentDayRestDay && isDayMatch && isHouse ? "rest-day-ripple" : "";
      const isActive = pulseClass !== "" || rippleClass !== "";
      const isPulsatingOnly = pulseClass !== "" && rippleClass === "";

      let icon;
      if (shouldCircle) {
        // Destination Circle Wrapper
        // Decrease circle size by 1px for non-rest days, iconSize remains same
        const wrapSize = isHouse
          ? isCurrentDayRestDay
            ? isDesktop
              ? 19
              : 18
            : isDesktop
              ? 18
              : 17
          : isAirport
            ? isDesktop
              ? 21
              : 20
            : markerPoint.size[0] + (isDesktop ? 5 : 4);
        const imgSize = isHouse
          ? isDesktop
            ? 11
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
          imgStyle = `width: ${imgSize * 0.9}px; height: ${imgSize * 0.9}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
        }

        const pulseClass = isSingleDayView ? "pulsating-circle" : "";

        icon = L.divIcon({
          className: "dest-circle-wrapper",
          iconSize: [wrapSize, wrapSize],
          iconAnchor: [wrapSize / 2, wrapSize / 2],
          html: `<div class="rest-day-circle ${pulseClass} ${rippleClass}" style="border-color: ${borderColor}; border-width: 1.5px; width: 100%; height: 100%;">
                  <img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />
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
          imgStyle = "width: 90%; height: 90%; margin: 5%;";
        }

        // Feature: Underscore/Underline for Starting House in Zoomed View
        // Only show if it's the start, it's zoomed in, and not already circled (which would be dest)
        const showUnderscore = isStart && isZoomedIn && !shouldCircle;

        let adjustedSize = markerPoint.size;
        if (!isDesktop && isHouse) {
          adjustedSize = [adjustedSize[0] - 1, adjustedSize[1] - 1];
        }

        icon = L.divIcon({
          className: "standard-poi-wrapper",
          iconSize: adjustedSize,
          iconAnchor: [adjustedSize[0] / 2, adjustedSize[1] / 2],
          html: `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; position: relative;">
               <img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />
               ${
                 showUnderscore
                   ? `<div style="position: absolute; bottom: -7px; width: 140%; height: 3.5px; background: #000; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`
                   : ""
               }
            </div>`,
          shadowUrl: null,
        });
      }

      // Tooltip visibility: Permanent in Overview mode OR if it belongs to current day/start/dest
      // This ensures names are always visible in Overview and for relevant POIs in Zoomed view
      const isTooltipPermanent =
        !isSingleDayView || isDayMatch || isDest || isStart;

      arr.push(
        <Marker
          position={snappedPoint}
          style={markerPoint.properties}
          key={snappedPoint.toString() + markerPoint.properties.day}
          onclick={clickHandler}
          onmouseover={mouseoverHandler}
          icon={icon}
          properties={markerPoint.properties}
          keyboard={false} // Disable keyboard focus to prevent overlap with throb effect
        >
          {isTooltipPermanent && (
            <Tooltip
              permanent={true}
              className={"tooltipLabel"}
              direction={markerPoint.properties.direction}
              // offset={markerPoint.properties.offset || [0, 0]}
            >
              <div style={{ fontSize: isZoomedIn ? "14px" : "11px" }}>
                <div style={{ fontWeight: isZoomedIn ? "600" : "normal" }}>
                  {markerPoint.properties.name}
                </div>
                {isZoomedIn && markerPoint.properties.startAlt && (
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
              </div>
            </Tooltip>
          )}
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

    // Crucial: Update the payload to use the single numeric targetDay
    // instead of the composite string "2, 3, 19 & 20"
    const updatedProps = { ...markerProps, day: String(targetDay) };
    dispatchLayerDetails(updatedProps);
    setSingleDayView(true); // Switch to Single Day View on selection

    // Recalculate bounds based on the full day's route collection
    const routesData = getDayWiseDataG();
    const targetRoute = routesData[targetDay];
    
    const effectivePaddingTopLeft = isDesktop
      ? [120, showLegend ? 180 : 120]
      : [40, 110];

    const effectivePaddingBottomRight = isDesktop ? [650, 180] : [40, 190];

    if (targetRoute) {
      // Create bounds from all features in the day
      const layer = L.geoJSON(targetRoute);
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

    // Fallback to marker position if route bounds aren't available
    map.flyToBounds(L.latLngBounds(e.latlng, e.latlng), {
      paddingTopLeft: effectivePaddingTopLeft,
      paddingBottomRight: effectivePaddingBottomRight,
      maxZoom: markerZoom,
      duration: props.zoomDuration,
    });
  };

  const mouseoverHandler = (e) => {
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

    const updatedProps = { ...markerProps, day: String(targetDay) };
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
