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

import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";
import { createGradientSegments } from "../utils/heightGradient";
import { getDayWiseDataG } from "../utils/geoJson";

const ZOOM_MOBILE = 10.7;
const ZOOM_LANDSCAPE = 10;

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
    isSingleDayView,
    setSingleDayView,
  } = props;
  const { map } = props.leaflet;

  const [isToolsOpen, setIsToolsOpen] = useState(false);

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  const handleNavigation = (direction) => {
    const targetFeature = direction === "next" ? nextDay() : prevDay();

    // Auto-reset tools when navigating
    setIsToolsOpen(false);

    if (isSingleDayView && targetFeature && targetFeature.geometry) {
      let bounds;

      if (targetFeature.bbox) {
        bounds = L.latLngBounds(
          [targetFeature.bbox[1], targetFeature.bbox[0]],
          [targetFeature.bbox[3], targetFeature.bbox[2]],
        );
      } else if (targetFeature.geometry.type === "Point") {
        const [lng, lat] = targetFeature.geometry.coordinates;
        // Create a 1km x 1km box around the point for zooming
        const offset = 0.005;
        bounds = L.latLngBounds(
          [lat - offset, lng - offset],
          [lat + offset, lng + offset],
        );
      } else {
        const allSegments = createGradientSegments(
          targetFeature.geometry.coordinates,
        );
        const allLatlngs = allSegments.flatMap((s) => s.latlngs);
        if (allLatlngs.length > 0) {
          bounds = L.latLngBounds(allLatlngs);
        }
      }

      if (bounds) {
        map.flyToBounds(bounds, {
          paddingTopLeft: effectivePaddingTopLeft,
          paddingBottomRight: effectivePaddingBottomRight,
          duration: props.zoomDuration,
        });
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault(); // Prevent default map scrolling
        handleNavigation("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); // Prevent default map scrolling
        handleNavigation("prev");
      } else if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        toggleViewMode();
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
  }, [day, map]); // dependencies to ensure handleNavigation has latest context

  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const effectivePaddingTopLeft = [
    props.paddingTopLeft[0],
    isDesktop ? props.paddingTopLeft[1] + 30 : props.paddingTopLeft[1] + 60,
  ];

  const effectivePaddingBottomRight = isDesktop
    ? [props.paddingBottomRight[0] + 525, props.paddingBottomRight[1] + 160]
    : [props.paddingBottomRight[0], props.paddingBottomRight[1] + 130];

  // Initial setup - do not auto-zoom to Day 1 on load
  useEffect(() => {}, []);

  const toggleViewMode = () => {
    if (isSingleDayView) {
      // Switch TO "View All"
      setSingleDayView(false);

      // Reset to Day 1 (Overview)
      const routes = getDayWiseDataG();
      if (routes && routes["1"]) {
        dispatchLayerDetails(routes["1"].features[0].properties);
      }

      // Zoom out to the exact initial center
      const mobileOffset = 0.022;
      const desktopOffset = 0.008;
      const currentOffset = isDesktop ? desktopOffset : mobileOffset;
      const initialCenter = [center[0] - currentOffset, center[1]];
      map.flyTo(initialCenter, derivedZoom, { duration: 1.25 });
    } else {
      // Switch TO "Single Select"
      setSingleDayView(true);

      // Zoom into the current day's route
      const routes = getDayWiseDataG();
      const targetDayKey = day;
      const targetDay = routes[targetDayKey];

      if (targetDay && targetDay.features[0]) {
        const feature = targetDay.features[0];
        dispatchLayerDetails(feature.properties);

        if (feature.geometry) {
          let bounds;
          if (feature.bbox) {
            bounds = L.latLngBounds(
              [feature.bbox[1], feature.bbox[0]],
              [feature.bbox[3], feature.bbox[2]],
            );
          } else if (feature.geometry.type === "Point") {
            const [lng, lat] = feature.geometry.coordinates;
            const offset = 0.005;
            bounds = L.latLngBounds(
              [lat - offset, lng - offset],
              [lat + offset, lng + offset],
            );
          } else {
            const allSegments = createGradientSegments(
              feature.geometry.coordinates,
            );
            const allLatlngs = allSegments.flatMap((s) => s.latlngs);
            if (allLatlngs.length > 0) {
              bounds = L.latLngBounds(allLatlngs);
            }
          }

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
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  const getTitleFontSize = (name) => {
    if (isDesktop) {
      if (name.length > 30) return "15px";
      if (name.length > 22) return "16.5px";
      return "18px";
    } else {
      if (name.length > 30) return "13px";
      if (name.length > 22) return "15px";
      return "17px";
    }
  };

  const iconBaseWidth = isDesktop ? 34 : 30;
  const iconHeight = isDesktop ? 36 : 31;

  const ControlIcons = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop
          ? `${iconBaseWidth}px ${iconBaseWidth}px`
          : `${iconBaseWidth}px`,
        gap: "2px",
        padding: "0 2px",
      }}
    >
      {/* Col 1: Zoom group */}
      {isDesktop && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div
            className="icon"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            style={{
              padding: "0",
              background: "white",
              borderRadius: "4px 4px 0 0",
              border: "1px solid #e2e8f0",
              width: "100%",
              height: `${iconHeight}px`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: isDesktop ? "20px" : "16px",
              color: "#2c3e50",
            }}
          >
            +
          </div>
          <div
            className="icon"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            style={{
              padding: "0",
              background: "white",
              borderRadius: "0 0 4px 4px",
              border: "1px solid #e2e8f0",
              borderTop: "none",
              width: "100%",
              height: `${iconHeight}px`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: isDesktop ? "20px" : "16px",
              color: "#2c3e50",
            }}
          >
            -
          </div>
        </div>
      )}
      {/* Col 2: Reset & Tools */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <img
          src={locationIcon}
          width={"100%"}
          className={`icon ${isSingleDayView ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleViewMode();
          }}
          alt="Toggle View"
          style={{
            padding: isDesktop ? "6px" : "4px",
            background: "white",
            borderRadius: "4px 4px 0 0",
            border: "1px solid #e2e8f0",
            height: `${iconHeight}px`,
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        />
        <img
          src={toolsIcon}
          width={"100%"}
          className="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsToolsOpen((prev) => !prev);
          }}
          alt="Tools"
          style={{
            padding: isDesktop ? "6px" : "4px",
            background: "white",
            borderRadius: "0 0 4px 4px",
            border: "1px solid #e2e8f0",
            borderTop: "none",
            height: `${iconHeight}px`,
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        />
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
        className="dashboard"
        style={{
          width: isDesktop ? "600px" : "100vw",
          margin: "0",
          borderRadius: isDesktop ? "12px" : "0",
          height: isDesktop ? "130px" : "108px",
          pointerEvents: "auto",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingBottom: isDesktop ? "0" : "env(safe-area-inset-bottom)",
          background: "white",
          boxSizing: "border-box",
          boxShadow: isDesktop
            ? "0 4px 20px rgba(0,0,0,0.1)"
            : "0 -1px 4px rgba(0,0,0,0.05)",
          border: isDesktop ? "1px solid #e2e8f0" : "1px solid #eee",
          borderBottom: "none",
          zIndex: 1000,
        }}
      >
        {/* Top Section: Main content row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            width: "100%",
            alignItems: "stretch",
            overflow: "hidden",
          }}
        >
          {/* Left Arrow Slab */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNavigation("prev");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isDesktop ? "60px" : "52px",
              border: "none",
              background: "#f5f5f5",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e9e9e9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f5f5")}
          >
            <img
              src={arrowIcon}
              width={isDesktop ? "33px" : "31px"}
              className="leftIcon"
              style={{ opacity: 0.8 }}
              alt="Previous"
            />
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "white",
              minWidth: 0,
            }}
          >
            {/* Top Content (Metrics or Tools) */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "stretch",
                overflow: "hidden",
              }}
            >
              {isToolsOpen ? (
                /* Tools View */
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 10px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
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
                            border: "1px solid #e2e8f0",
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
                            border: "1px solid #e2e8f0",
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
                      height: isDesktop ? "24px" : "20px",
                      borderTop: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isDesktop ? "11px" : "11px",
                        color: "#7f8c8d",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "1.2px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Everest Base Camp 3 Pass Trek, Nepal
                    </div>
                  </div>
                </div>
              ) : (
                /* Central Content (Metrics) */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: isDesktop ? "8px 25px" : "4px 10px",
                    minWidth: 0,
                    justifyContent: "center",
                    background: "white",
                  }}
                >
                  {/* Top Section (Above HR): Name on left, Stats on right */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: isDesktop ? "20px" : "12px",
                    }}
                  >
                    {/* Left Side: Trek Name */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSingleDayView) {
                          toggleViewMode();
                        } else {
                          // If already in single view, re-zoom to ensure focus
                          const routes = getDayWiseDataG();
                          const targetDayKey = day;
                          const targetDay = routes[targetDayKey];
                          if (targetDay && targetDay.features[0]) {
                            const feature = targetDay.features[0];
                            const allSegments = createGradientSegments(
                              feature.geometry.coordinates,
                            );
                            const allLatlngs = allSegments.flatMap(
                              (s) => s.latlngs,
                            );
                            if (allLatlngs.length > 0) {
                              map.flyToBounds(L.latLngBounds(allLatlngs), {
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
                          fontWeight: "700",
                          fontSize: getTitleFontSize(props.name),
                          color: "#2c3e50",
                          whiteSpace: "normal",
                          overflow: "visible",
                          textAlign: "left",
                          lineHeight: "1.15",
                          display: "block",
                        }}
                      >
                        {props.name}
                      </div>
                    </div>

                    {/* Right Side: Stats Block (Elevations Only) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        flexShrink: 0,
                        minWidth: "fit-content",
                        maxWidth: isDesktop ? "200px" : "150px",
                        justifyContent: "center",
                        alignSelf: "center",
                      }}
                    >
                      {/* Elevations Row */}
                      {!isPlace ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: isDesktop ? "15.5px" : "13px",
                              color: "#2c3e50",
                              fontWeight: "bold",
                              letterSpacing: "-0.2px",
                              textAlign: "right",
                              lineHeight: "1.2",
                              whiteSpace: "normal", // Allow wrapping if extremely narrow
                            }}
                          >
                            {distance === "0 mi / 0 km" ? (
                              formatAlt(startAlt)
                            ) : (
                              <>
                                {startAlt ? formatAlt(startAlt) : ""}
                                {peakAlt ? ` → ${formatAlt(peakAlt)}` : ""}
                                {endAlt ? ` → ${formatAlt(endAlt)}` : ""}
                              </>
                            )}
                          </div>
                          {distance !== "0 mi / 0 km" &&
                            (total_climb || descent) && (
                              <div
                                style={{
                                  fontSize: isDesktop ? "15px" : "13.5px",
                                  marginTop: "2px",
                                  display: "flex",
                                  gap: isDesktop ? "8px" : "4px",
                                  lineHeight: "1.1",
                                }}
                              >
                                {total_climb && (
                                  <span
                                    style={{
                                      color: "#27ae60",
                                      fontWeight: "900",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: isDesktop ? "10px" : "9px",
                                      }}
                                    >
                                      ▲
                                    </span>{" "}
                                    {formatAlt(total_climb)}
                                  </span>
                                )}
                                {descent && (
                                  <span
                                    style={{
                                      color: "#c0392b",
                                      fontWeight: "900",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: isDesktop ? "10px" : "9px",
                                      }}
                                    >
                                      ▼
                                    </span>{" "}
                                    {formatAlt(descent)}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats Row (Bottom Section - Below HR) */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      marginTop: isDesktop ? "12px" : "5px",
                      borderTop: "none",
                      paddingTop: "0px",
                    }}
                  >
                    {!isPlace && distance && time ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Day indicator on the bottom line */}
                        <div style={{ display: "flex" }}>
                          <span
                            style={{
                              fontWeight: "800",
                              fontSize: isDesktop ? "13px" : "11px",
                              color: "#34495e",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <svg
                              width={isDesktop ? "11" : "9.5"}
                              height={isDesktop ? "11" : "9.5"}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#7f8c8d"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ flexShrink: 0 }}
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              ></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            DAY {props.day}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: isDesktop ? "20px" : "8px",
                          }}
                        >
                          {distance !== "0 mi / 0 km" && (
                            <div
                              style={{
                                display: "flex",
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              <svg
                                width={isDesktop ? "14" : "12"}
                                height={isDesktop ? "14" : "12"}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#95a5a6"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ flexShrink: 0 }}
                              >
                                <path d="M13 18l6-6-6-6M5 12h14" />
                              </svg>
                              <span
                                style={{
                                  fontSize: isDesktop ? "16px" : "13.5px",
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
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              <svg
                                width={isDesktop ? "14" : "12"}
                                height={isDesktop ? "14" : "12"}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#95a5a6"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ flexShrink: 0 }}
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span
                                style={{
                                  fontSize: isDesktop ? "16px" : "13.5px",
                                  color: "#2c3e50",
                                  fontWeight: "700",
                                }}
                              >
                                {time}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Toolbar and Next Arrow (Slab) */}
          <div style={{ display: "flex", alignItems: "stretch" }}>
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
                onClick={(e) => e.stopPropagation()} // Prevent triggering parent or slab clicks
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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isDesktop ? "60px" : "52px",
                border: "none",
                background: "#f5f5f5",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#e9e9e9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f5f5f5")
              }
            >
              <img
                src={arrowIcon}
                width={isDesktop ? "33px" : "31px"}
                className="rightIcon"
                alt="Next"
                style={{ transform: "rotate(180deg)", opacity: 0.8 }}
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
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(Dashboard));
