import React, { useState, useEffect } from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import L from "leaflet";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import Control from "react-leaflet-control";
import arrowIcon from "../resources/images/leftArrow.svg";
import locationIcon from "../resources/images/location.svg";
import toolsIcon from "../resources/images/settings.svg";
import legendIcon from "../resources/images/legend.svg";
import infoIcon from "../resources/images/info.svg";

import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";
import { createGradientSegments } from "../utils/heightGradient";
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";

import "../resources/css/dashboard.css";

const ZOOM_MOBILE = 10.4;
const ZOOM_LANDSCAPE = 10.3;

const Dashboard = (props) => {
  const {
    dispatchLayerDetails,
    toggleLegend,
    toggleInfo,
    toggleUnit,
    unit = "km",
    peakAlt = null,
    startAlt = null,
    endAlt = null,
    total_climb = null,
    descent = null,
    distance,
    time,
    day,
    center,
    zoom,
    paddingTopLeft,
    paddingBottomRight,
    isSingleDayView,
    setSingleDayView,
    showLegend,
  } = props;
  const { map } = props.leaflet;

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [lastZoomedDay, setLastZoomedDay] = useState(null);
  const [lastZoomedState, setLastZoomedState] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(map ? map.getZoom() : zoom);

  useEffect(() => {
    if (!map) return;
    const handleZoom = () => setCurrentZoom(map.getZoom());
    map.on("zoomend", handleZoom);
    return () => map.off("zoomend", handleZoom);
  }, [map]);

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();

  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  const getFeatureBounds = (input, dayOverride = null) => {
    if (!input) return null;

    // 1. Prioritize pre-calculated bounds (artistically tuned for better padding/framing)
    // Extract day ID from input properties if not provided
    const targetDayId =
      dayOverride ||
      (input.features &&
        input.features[0] &&
        input.features[0].properties &&
        input.features[0].properties.day) ||
      (input.properties && input.properties.day);

    try {
      // 1. Prioritize Dynamic calculation from GeoJSON geometry (Tighter fit)
      const layer = L.geoJSON(input);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        return bounds;
      }
    } catch (e) {
      console.warn("Could not calculate bounds using L.geoJSON:", e);
    }

    // 2. Fallback: pre-calculated bounds (if dynamic fails)
    if (targetDayId && preCalculatedBounds[targetDayId]) {
      const mode = isDesktop ? "desktop" : "mobile";
      const pBounds = preCalculatedBounds[targetDayId][mode];
      if (pBounds) {
        return L.latLngBounds(pBounds);
      }
    }

    // 3. Last resort fallback for raw coordinate arrays
    const features = input.features || (Array.isArray(input) ? input : [input]);
    const allLatlngs = [];

    features.forEach((feature) => {
      if (!feature.geometry) return;
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === "Point") {
        allLatlngs.push([coords[1], coords[0]]);
      } else if (feature.geometry.type === "LineString") {
        coords.forEach((c) => allLatlngs.push([c[1], c[0]]));
      } else if (feature.geometry.type === "MultiLineString") {
        coords.forEach((line) => {
          line.forEach((c) => allLatlngs.push([c[1], c[0]]));
        });
      }
    });

    if (allLatlngs.length > 0) {
      return L.latLngBounds(allLatlngs);
    }

    return null;
  };

  // Adjust padding for mobile and desktop to account for UI elements
  // TopLeft: [left, top], BottomRight: [right, bottom]
  const effectivePaddingTopLeft = isDesktop
    ? [120, showLegend ? 180 : 120]
    : [40, 110];

  const effectivePaddingBottomRight = isDesktop ? [650, 180] : [40, 190];

  const resetZoom = () => {
    if (!map) return;

    // Use a slight timeout to ensure no conflicts with current interactions
    setTimeout(() => {
      map.invalidateSize();

      if (isSingleDayView && day && day !== "0") {
        const routes = getDayWiseDataG();
        const targetDay = routes[day];

        if (targetDay) {
          const bounds = getFeatureBounds(targetDay, day);
          if (bounds) {
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: 1,
            });
          }
        }
      } else {
        // Overview mode: Reset to initial world center
        const mobileOffset = 0.024;
        const desktopOffset = 0.008;
        const currentOffset = isDesktop ? desktopOffset : mobileOffset;

        // Safety check for center
        const lat = Array.isArray(center) ? center[0] : center.lat;
        const lng = Array.isArray(center) ? center[1] : center.lng;

        const initialCenter = [lat - currentOffset, lng];
        map.flyTo(initialCenter, derivedZoom, { duration: 1 });
      }
    }, 10);
  };

  // Target button: Toggle between overview and Day 1
  const toggleTargetView = () => {
    if (!map) return;

    setTimeout(() => {
      if (isSingleDayView) {
        // Switch to overview
        setSingleDayView(false);
        const routes = getDayWiseDataG();
        if (routes && routes["0"]) {
          dispatchLayerDetails(routes["0"].features[0].properties);
        }
        const mobileOffset = 0.024;
        const desktopOffset = 0.008;
        const currentOffset = isDesktop ? desktopOffset : mobileOffset;
        const lat = Array.isArray(center) ? center[0] : center.lat;
        const lng = Array.isArray(center) ? center[1] : center.lng;
        const initialCenter = [lat - currentOffset, lng];
        map.flyTo(initialCenter, derivedZoom, { duration: 1.25 });
      } else {
        // Switch to Day 1
        setSingleDayView(true);
        const routes = getDayWiseDataG();
        const targetDay = routes["1"];
        if (targetDay) {
          dispatchLayerDetails(targetDay.features[0].properties);
          const bounds = getFeatureBounds(targetDay, "1");
          if (bounds) {
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: 1,
            });
          }
        }
      }
    }, 10);
  };

  // Track map state for icon highlights (zoom and center)
  const [isAtInitialState, setIsAtInitialState] = useState(true);

  useEffect(() => {
    if (!map) return;

    const checkState = () => {
      const currentMapZoom = map.getZoom();
      const currentMapCenter = map.getCenter();

      if (isSingleDayView && day && day !== "0") {
        // In day view, check if zoom matches roughly (could be more complex but zoom is a good proxy)
        setIsAtInitialState(
          Math.abs(
            currentMapZoom -
              map.getBoundsZoom(getFeatureBounds(getDayWiseDataG()[day], day)),
          ) < 0.2,
        );
      } else {
        const mobileOffset = 0.024;
        const desktopOffset = 0.008;
        const currentOffset = isDesktop ? desktopOffset : mobileOffset;

        const lat = Array.isArray(center) ? center[0] : center.lat;
        const lng = Array.isArray(center) ? center[1] : center.lng;
        const targetLat = lat - currentOffset;

        const isZoomed = Math.abs(currentMapZoom - derivedZoom) > 0.1;
        const isPanned =
          Math.abs(currentMapCenter.lat - targetLat) > 0.002 ||
          Math.abs(currentMapCenter.lng - lng) > 0.002;

        setIsAtInitialState(!isZoomed && !isPanned);
      }
    };

    map.on("zoomend moveend", checkState);
    checkState(); // initial check
    return () => map.off("zoomend moveend", checkState);
  }, [map, isSingleDayView, day, center, derivedZoom, isDesktop]);

  // Re-apply bounds when padding-affecting states change or view mode changes
  useEffect(() => {
    if (isSingleDayView && day && day !== "0") {
      const routes = getDayWiseDataG();
      const targetDay = routes[day];
      if (targetDay) {
        const bounds = getFeatureBounds(targetDay, day);
        if (bounds) {
          // Use a small timeout to ensure state/DOM stability
          const timer = setTimeout(() => {
            map.invalidateSize(); // Ensure map knows its current size
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: 0.8, // Slightly faster for auto-adjustment
            });
          }, 150);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [
    showLegend,
    isSingleDayView,
    day,
    isDesktop,
    isLandscape,
    map,
    isToolsOpen,
  ]);

  const handleNavigation = (direction) => {
    const targetFeature = direction === "next" ? nextDay() : prevDay();

    // Auto-reset tools when navigating
    setIsToolsOpen(false);

    if (isSingleDayView && targetFeature) {
      // Find the whole day collection to get full bounds
      const routes = getDayWiseDataG();
      const targetDayCollection = targetFeature.properties?.day
        ? routes[targetFeature.properties.day]
        : targetFeature;

      const bounds = getFeatureBounds(
        targetDayCollection,
        targetFeature.properties?.day,
      );

      if (bounds) {
        map.flyToBounds(bounds, {
          paddingTopLeft: effectivePaddingTopLeft,
          paddingBottomRight: effectivePaddingBottomRight,
          duration: props.zoomDuration,
        });

        // Save the zoomed state
        setLastZoomedState({
          day: targetFeature.properties.day,
          bounds: bounds,
        });
      }
    }
  };

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault(); // Prevent default map scrolling
        handleNavigation("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); // Prevent default map scrolling
        handleNavigation("prev");
      } else if (e.code === "Space") {
        e.preventDefault();
        resetZoom();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        zoomIn();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, map, isSingleDayView]); // dependencies to ensure handleNavigation has latest context

  // Initial setup - do not auto-zoom to Day 1 on load
  useEffect(() => {}, []);

  const toggleViewMode = () => {
    const routes = getDayWiseDataG();

    if (isSingleDayView) {
      // Switch TO "View All"
      setLastZoomedDay(day);
      setSingleDayView(false);

      // Zoom out to the exact initial center
      const mobileOffset = 0.024;
      const desktopOffset = 0.008;
      const currentOffset = isDesktop ? desktopOffset : mobileOffset;
      const initialCenter = [center[0] - currentOffset, center[1]];

      // Reset to Day 0 (Default page)
      if (routes && routes["0"]) {
        dispatchLayerDetails(routes["0"].features[0].properties);
      }
      map.flyTo(initialCenter, derivedZoom, { duration: 1.25 });
    } else {
      // Switch TO "Single Select"
      setSingleDayView(true);

      // Deciding which day to zoom into: last zoomed day, OR current day, OR default to Day 1
      let targetDayKey = day;
      if (day === "0" || !day) {
        targetDayKey = lastZoomedDay || "1";
      }

      const targetDay = routes[targetDayKey];

      if (targetDay) {
        // Use the properties of the first feature for the dashboard data
        if (targetDay.features && targetDay.features[0]) {
          dispatchLayerDetails(targetDay.features[0].properties);
        }

        const bounds = getFeatureBounds(targetDay, targetDayKey);
        if (bounds) {
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: props.zoomDuration,
          });
        }
      } else {
        // No previous zoom state, zoom into the current day's route (or Day 1 if on Day 0)
        const routes = getDayWiseDataG();
        const targetDayKey = day === "0" ? "1" : day;
        const targetDay = routes[targetDayKey];

        if (targetDay && targetDay.features[0]) {
          const feature = targetDay.features[0];
          dispatchLayerDetails(feature.properties);

          const bounds = getFeatureBounds(feature);
          if (bounds) {
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: props.zoomDuration,
            });
          }
        }
      }
    }
  };

  const getTitleFontSize = (name) => {
    if (isDesktop) {
      if (name.length > 30) return "13px";
      if (name.length > 22) return "14.5px";
      return "17.5px";
    } else {
      if (name.length > 30) return "11px";
      if (name.length > 25) return "12px";
      if (name.length > 20) return "13.5px";
      return "15.5px";
    }
  };

  const iconBaseWidth = isDesktop ? 34 : 25;
  const iconHeight = isDesktop ? 36 : 26;

  const ControlIcons = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${iconBaseWidth}px`,
        gap: "2px",
        padding: "0 2px",
      }}
    >
      {/* Reset & Tools */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleTargetView();
          }}
          className={`icon ${isSingleDayView ? "active" : ""}`}
          style={{
            padding: isDesktop ? "6px" : "4px",
            background: "white",
            borderRadius: "4px 4px 0 0",
            height: `${iconHeight}px`,
            boxSizing: "border-box",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={locationIcon}
            style={{ width: "100%", height: "auto" }}
            alt="Reset"
          />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsToolsOpen((prev) => !prev);
          }}
          className="icon"
          style={{
            padding: isDesktop ? "6px" : "4px",
            background: "white",
            borderRadius: "0 0 4px 4px",
            height: `${iconHeight}px`,
            boxSizing: "border-box",
            cursor: "pointer",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={toolsIcon}
            style={{ width: "100%", height: "auto" }}
            alt="Tools"
          />
        </div>
      </div>
    </div>
  );

  const displayDistance = () => {
    if (!distance) return "";
    const parts = distance.split("/");
    if (parts.length < 2) return distance;
    return unit === "km" ? parts[1].trim() : parts[0].trim();
  };

  const formatAlt = (alt) => {
    if (!alt) return "";
    const val = parseInt(alt.toString().replace(/,/g, ""));
    if (isNaN(val)) return alt;
    if (unit === "km") {
      return `${Math.round(val * 0.3048).toLocaleString()}m`;
    }
    return `${val.toLocaleString()}ft`;
  };

  return (
    <Control position="bottomright">
      <div
        className="dashboard-container"
        style={{
          width: isDesktop ? "600px" : "100vw",
          height: isDesktop ? "160px" : "132px",
          paddingBottom: isDesktop ? "0" : "env(safe-area-inset-bottom)",
        }}
      >
        {/* Top Section: Main content row */}
        <div
          className="dashboard-top-section"
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Left Arrow Slab */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNavigation("prev");
            }}
            className="navigation-slab"
            style={{ flexShrink: 0 }}
          >
            <img
              src={arrowIcon}
              width={isDesktop ? "33px" : "31px"}
              className="navigation-icon"
              alt="Previous"
            />
          </div>

          <div
            className="dashboard-main-content"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              minWidth: 0,
            }}
          >
            {/* Top Content (Metrics or Tools) */}
            <div
              className="dashboard-view-wrapper"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              {isToolsOpen ? (
                /* Tools View */
                <div className="tools-view">
                  <div className="tools-row">
                    <div className="tools-icons-container">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLegend();
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <img
                          src={legendIcon}
                          width={isDesktop ? "29px" : "27px"}
                          alt="Toggle Legend"
                          style={{
                            padding: "4px",
                            background: "#f9f9f9",
                            borderRadius: "4px",
                            border: "none",
                          }}
                        />
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInfo();
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <img
                          src={infoIcon}
                          width={isDesktop ? "29px" : "27px"}
                          alt="Toggle Info"
                          style={{
                            padding: "4px",
                            background: "#f9f9f9",
                            borderRadius: "4px",
                            border: "none",
                          }}
                        />
                      </div>

                      {/* Unit Toggle Switch */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUnit();
                        }}
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          background: "#f0f0f0",
                          borderRadius: "15px",
                          padding: "2px",
                          cursor: "pointer",
                          height: isDesktop ? "25px" : "24px",
                          width: isDesktop ? "65px" : "62px",
                          position: "relative",
                          border: "1px solid #ddd",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left:
                              unit === "km"
                                ? "2px"
                                : "calc(100% - " +
                                  (isDesktop ? "29px" : "26px") +
                                  ")",
                            width: isDesktop ? "27px" : "24px",
                            height: "100%",
                            background: "#3498db",
                            borderRadius: "15px",
                            transition: "all 0.2s ease",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                            fontSize: isDesktop ? "11px" : "10px",
                            fontWeight: "bold",
                            top: "0",
                          }}
                        >
                          {unit.toUpperCase()}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0 6px",
                            fontSize: isDesktop ? "10px" : "9px",
                            fontWeight: "bold",
                            color: "#95a5a6",
                            pointerEvents: "none",
                          }}
                        >
                          <span>KM</span>
                          <span>MI</span>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsToolsOpen(false);
                      }}
                      style={{
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: isDesktop ? "25px" : "23px",
                          height: isDesktop ? "25px" : "23px",
                          borderRadius: "50%",
                          background: "#f5f5f5",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#7f8c8d",
                          fontWeight: "bold",
                          fontSize: isDesktop ? "18px" : "15px",
                          border: "none",
                        }}
                      >
                        ✕
                      </div>
                    </div>
                  </div>

                  {/* Branding Strip (ONLY visible in Toolbar mode) */}
                  <div
                    style={{
                      height: isDesktop ? "44px" : "40px",
                      borderTop: "1px solid #f0f0f0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      background: "white",
                      gap: isDesktop ? "4px" : "3px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isDesktop ? "11px" : "10px",
                        color: "#7f8c8d",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "1.2px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Everest Base Camp 3 Pass Trek, Nepal
                    </div>
                    {props.attribution && (
                      <div
                        style={{
                          fontSize: isDesktop ? "9.5px" : "8.5px",
                          color: "#95a5a6",
                          letterSpacing: "0.2px",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: props.attribution,
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Central Content (Metrics) */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: isDesktop ? "8px 25px" : "8px 8px",
                    minWidth: 0,
                    justifyContent: "center",
                    alignItems: "center", // Center horizontally within the flex:1 space
                    background: "white",
                  }}
                >
                  {/* Middle Content (Data Rows) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      width: "100%",
                      maxWidth: isDesktop ? "100%" : "280px", // Limit width on mobile to ensure centering doesn't get squashed
                      gap: isDesktop ? "8px" : "6px",
                      height: "100%",
                    }}
                  >
                    {/* Trek Name */}
                    <div
                      style={{
                        cursor: "pointer",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: isDesktop ? "24px" : "auto",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSingleDayView) {
                          toggleViewMode();
                        } else {
                          const routes = getDayWiseDataG();
                          const targetDay = routes[day];
                          if (targetDay && targetDay.features[0]) {
                            const bounds = getFeatureBounds(targetDay, day);
                            if (bounds) {
                              map.flyToBounds(bounds, {
                                paddingTopLeft: effectivePaddingTopLeft,
                                paddingBottomRight: effectivePaddingBottomRight,
                                duration: props.zoomDuration,
                              });
                            }
                          }
                        }
                      }}
                    >
                      <div
                        title={props.name}
                        style={{
                          fontWeight: "750",
                          fontSize: getTitleFontSize(props.name),
                          color: "#2c3e50",
                          textAlign: "center",
                          lineHeight: "1.1",
                        }}
                      >
                        {props.name}
                      </div>
                    </div>

                    {/* Desktop Only Divider */}
                    {isDesktop && (
                      <div
                        style={{
                          height: "1px",
                          background: "#eee",
                          width: "100%",
                        }}
                      />
                    )}

                    {/* Stats Container (Elevation / Metrics) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: isDesktop ? "column" : "row",
                        gap: isDesktop ? "8px" : "12px",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Elevation Stats - Row 2 */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: isDesktop ? "100%" : "auto",
                          minHeight: isDesktop ? "20px" : "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isDesktop ? "12px" : "6px",
                            width: isDesktop ? "100%" : "auto",
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: isDesktop ? "14px" : "12px",
                              color: "#2c3e50",
                              fontWeight: "bold",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {day === "3" || day === "11" ? (
                              formatAlt(startAlt)
                            ) : (
                              <>
                                {startAlt ? formatAlt(startAlt) : ""}
                                {peakAlt
                                  ? `${isDesktop ? " → " : " ⇢ "}${formatAlt(peakAlt)}`
                                  : ""}
                                {endAlt
                                  ? `${isDesktop ? " → " : " ⇢ "}${formatAlt(endAlt)}`
                                  : ""}
                              </>
                            )}
                          </div>

                          {!isPlace &&
                            distance !== "0 mi / 0 km" &&
                            (total_climb || descent) && (
                              <div
                                style={{
                                  fontSize: isDesktop ? "15px" : "15px",
                                  marginTop: "2px",
                                  display: "flex",
                                  gap: isDesktop ? "10px" : "4px",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {total_climb && (
                                  <span
                                    style={{
                                      color: "#27ae60",
                                      fontWeight: "900",
                                      fontSize: isDesktop ? "13.5px" : "11px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "1px",
                                    }}
                                  >
                                    ▲{formatAlt(total_climb)}
                                  </span>
                                )}
                                {descent && (
                                  <span
                                    style={{
                                      color: "#c0392b",
                                      fontWeight: "900",
                                      fontSize: isDesktop ? "13.5px" : "11px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "1px",
                                    }}
                                  >
                                    ▼{formatAlt(descent)}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Desktop Only Divider */}
                      {isDesktop && (
                        <div
                          style={{
                            height: "1px",
                            background: "#eee",
                            width: "100%",
                          }}
                        />
                      )}

                      {/* Day, Distance, Time - Row 3 Moved for Mobile Visibility */}
                      {isDesktop && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            minHeight: "22px",
                            gap: "0",
                          }}
                        >
                          {/* Day indicator */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: "700",
                                color: "#7f8c8d",
                              }}
                            >
                              DAY
                            </span>
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "900",
                                color: "#2c3e50",
                                lineHeight: "1",
                              }}
                            >
                              {props.day}
                            </span>
                          </div>

                          {/* Distance and Time */}
                          {!isPlace && distance && time && (
                            <div
                              style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                              }}
                            >
                              {distance !== "0 mi / 0 km" && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "2px",
                                    alignItems: "center",
                                  }}
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#95a5a6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M13 18l6-6-6-6M5 12h14" />
                                  </svg>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#2c3e50",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {displayDistance()}
                                  </span>
                                </div>
                              )}
                              {distance !== "0 mi / 0 km" && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "2px",
                                    alignItems: "center",
                                  }}
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#95a5a6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      color: "#2c3e50",
                                      fontWeight: "700",
                                      display: "inline-flex",
                                      alignItems: "baseline",
                                    }}
                                  >
                                    {time}
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        marginLeft: "1px",
                                        alignSelf: "flex-start",
                                        position: "relative",
                                        top: "-1px",
                                      }}
                                    >
                                      *
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NEW Fixed Metrics Row for Mobile */}
            {!isDesktop && (
              <div
                style={{
                  height: "28px",
                  background: "#fdfdfd",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "15px",
                  padding: "0 10px",
                  flexShrink: 0,
                }}
              >
                {/* Day indicator */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: "700",
                      color: "#95a5a6",
                    }}
                  >
                    DAY
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "900",
                      color: "#34495e",
                    }}
                  >
                    {props.day}
                  </span>
                </div>

                {!isPlace && distance && time && distance !== "0 mi / 0 km" && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#95a5a6"
                        strokeWidth="3"
                      >
                        <path d="M13 18l6-6-6-6M5 12h14" />
                      </svg>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#34495e",
                        }}
                      >
                        {displayDistance()}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#95a5a6"
                        strokeWidth="3"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#34495e",
                        }}
                      >
                        {time}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Toolbar and Next Arrow (Slab) */}
          <div
            style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}
          >
            {/* Toolbar Area */}
            {!isToolsOpen && (
              <div
                style={{
                  padding: "0 2px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  background: "white",
                }}
              >
                {ControlIcons}
              </div>
            )}

            {/* Right Arrow Slab */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNavigation("next");
              }}
              className="navigation-slab"
            >
              <img
                src={arrowIcon}
                width={isDesktop ? "33px" : "31px"}
                className="navigation-icon"
                alt="Next"
                style={{ transform: "rotate(180deg)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </Control>
  );
};

const mapStateToProps = (state) => ({
  day: state.route.day,
  name: state.route.name,
  time: state.route.time,
  icon: state.route.icon,
  unit: state.mapState.unit,
  endAlt: state.route.endAlt,
  peakAlt: state.route.peakAlt,
  startAlt: state.route.startAlt,
  distance: state.route.distance,
  total_climb: state.route.total_climb,
  descent: state.route.descent,
  zoom: state.mapState.zoom,
  center: state.mapState.center,
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  isSingleDayView: state.mapState.isSingleDayView,
  showLegend: state.mapState.showLegend,
  attribution: state.mapState.attribution,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(Dashboard));
