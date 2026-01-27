import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";

import "../resources/css/dashboard.css";

// Constants
const ZOOM_MOBILE = 10.4;
const ZOOM_LANDSCAPE = 10.3;
const BASE_OFFSET = 0.024;
const DESKTOP_OFFSET = 0.008;

// Memoized helper to calculate center offset
const calculateCenterOffset = (center, offset) => {
  const lat = Array.isArray(center) ? center[0] : center.lat;
  const lng = Array.isArray(center) ? center[1] : center.lng;
  return [lat - offset, lng];
};

// Memoized title font size calculator
const getTitleFontSize = (name, isDesktopView) => {
  if (isDesktopView) {
    if (name.length > 30) return "15px";
    if (name.length > 22) return "16px";
    return "19px";
  } else {
    if (name.length > 30) return "11px";
    if (name.length > 25) return "12px";
    if (name.length > 20) return "13.5px";
    return "15.5px";
  }
};

// Memoized bounds calculator
const getFeatureBounds = (input, dayOverride = null, isDesktopView = true) => {
  if (!input) return null;

  const targetDayId =
    dayOverride ||
    (input.features?.[0]?.properties?.day) ||
    (input.properties?.day);

  try {
    const layer = L.geoJSON(input);
    const bounds = layer.getBounds();
    if (bounds.isValid()) return bounds;
  } catch (e) {
    console.warn("Could not calculate bounds using L.geoJSON:", e);
  }

  if (targetDayId && preCalculatedBounds[targetDayId]) {
    const mode = isDesktopView ? "desktop" : "mobile";
    const pBounds = preCalculatedBounds[targetDayId][mode];
    if (pBounds) return L.latLngBounds(pBounds);
  }

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
      coords.forEach((line) => line.forEach((c) => allLatlngs.push([c[1], c[0]])));
    }
  });

  return allLatlngs.length > 0 ? L.latLngBounds(allLatlngs) : null;
};

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
    showLegend,
  } = props;
  const { map } = props.leaflet;

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [lastZoomedDay, setLastZoomedDay] = useState(null);

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();

  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  // Memoized padding values
  const effectivePaddingTopLeft = useMemo(() => 
    isDesktop ? [120, showLegend ? 180 : 120] : [40, 110],
    [isDesktop, showLegend]
  );

  const effectivePaddingBottomRight = useMemo(() => 
    isDesktop ? [650, 180] : [40, 190],
    [isDesktop]
  );

  // Memoized legend offset calculation
  const currentOffset = useMemo(() => {
    const legendOffset = showLegend ? 0.004 : 0;
    return isDesktop ? DESKTOP_OFFSET : BASE_OFFSET + legendOffset;
  }, [isDesktop, showLegend]);

  // Memoized icon sizes
  const iconSizes = useMemo(() => ({
    baseWidth: isDesktop ? 34 : 25,
    height: isDesktop ? 36 : 26,
    navArrow: isDesktop ? "33px" : "31px",
    toolIcon: isDesktop ? "29px" : "27px",
    maxIcon: isDesktop ? "24px" : "18px",
  }), [isDesktop]);

  // Memoized formatAlt function
  const formatAlt = useCallback((alt) => {
    if (!alt) return "";
    const val = parseInt(alt.toString().replace(/,/g, ""));
    if (isNaN(val)) return alt;
    return unit === "km" 
      ? `${Math.round(val * 0.3048).toLocaleString()}m`
      : `${val.toLocaleString()}ft`;
  }, [unit]);

  // Memoized displayDistance function
  const displayDistance = useCallback(() => {
    if (!distance) return "";
    const parts = distance.split("/");
    if (parts.length < 2) return distance;
    return unit === "km" ? parts[1].trim() : parts[0].trim();
  }, [distance, unit]);

  // Memoized title font size
  const titleFontSize = useMemo(() => 
    getTitleFontSize(props.name || "", isDesktop),
    [props.name, isDesktop]
  );

  // Memoized routes data (cached)
  const routes = useMemo(() => getDayWiseDataG(), []);

  const resetZoom = useCallback(() => {
    if (!map) return;

    setTimeout(() => {
      map.invalidateSize();

      if (isSingleDayView && day) {
        // Switch to overview
        setSingleDayView(false);
        const initialCenter = calculateCenterOffset(center, currentOffset);
        map.flyTo(initialCenter, derivedZoom, { duration: 1 });
      } else if (!isSingleDayView && day) {
        // Switch to single day view and zoom to the current day
        setSingleDayView(true);
        const targetDay = routes[day];
        if (targetDay) {
          const bounds = getFeatureBounds(targetDay, day, isDesktop);
          if (bounds) {
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: 1,
            });
          }
        }
      } else {
        // Overview mode with no specific day, reset to initial world center
        const initialCenter = calculateCenterOffset(center, currentOffset);
        map.flyTo(initialCenter, derivedZoom, { duration: 1 });
      }
    }, 10);
  }, [map, isSingleDayView, day, setSingleDayView, center, currentOffset, derivedZoom, routes, effectivePaddingTopLeft, effectivePaddingBottomRight]);

  // Target button: Toggle between overview and Day 1
  const toggleTargetView = useCallback(() => {
    if (!map) return;

    setTimeout(() => {
      if (isSingleDayView) {
        // Switch to overview
        setSingleDayView(false);
        if (routes?.["1"]) {
          dispatchLayerDetails(routes["1"].features[0].properties);
        }
        const initialCenter = calculateCenterOffset(center, currentOffset);
        map.flyTo(initialCenter, derivedZoom, { duration: 1.25 });
      } else {
        // Switch to highlighted route or Day 1
        const targetDayKey = lastZoomedDay || "1";
        console.log(`Target button: Switching to day ${targetDayKey} (lastZoomedDay: ${lastZoomedDay})`);
        setSingleDayView(true);
        const targetDay = routes[targetDayKey];
        if (targetDay) {
          dispatchLayerDetails(targetDay.features[0].properties);
          const bounds = getFeatureBounds(targetDay, targetDayKey, isDesktop);
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
  }, [map, isSingleDayView, setSingleDayView, routes, dispatchLayerDetails, center, currentOffset, derivedZoom, lastZoomedDay, isDesktop, effectivePaddingTopLeft, effectivePaddingBottomRight]);

  // Track map state for icon highlights (zoom and center)
  // const [isAtInitialState, setIsAtInitialState] = useState(true);

  useEffect(() => {
    if (!map) return;

    const checkState = () => {
      // State checking removed as isAtInitialState was unused
    };

    map.on("zoomend moveend", checkState);
    checkState();
    return () => map.off("zoomend moveend", checkState);
  }, [map, isSingleDayView, day, center, derivedZoom, showLegend]);

  // Re-apply bounds when padding-affecting states change or view mode changes
  useEffect(() => {
    if (isSingleDayView && day && routes[day]) {
      const bounds = getFeatureBounds(routes[day], day, isDesktop);
      if (bounds) {
        const timer = setTimeout(() => {
          map.invalidateSize();
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: 0.8,
          });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [
    showLegend,
    isSingleDayView,
    day,
    isLandscape,
    map,
    isToolsOpen,
    effectivePaddingTopLeft,
    effectivePaddingBottomRight,
  ]);

  // Adjust overview center when legend visibility changes on mobile
  useEffect(() => {
    if (!isSingleDayView && !isDesktop) {
      const newCenter = calculateCenterOffset(center, currentOffset);
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.flyTo(newCenter, derivedZoom, { duration: 0.8 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showLegend, isSingleDayView, center, derivedZoom, map]);

  const handleNavigation = useCallback((direction) => {
    const targetFeature = direction === "next" ? nextDay() : prevDay();
    setIsToolsOpen(false);

    if (targetFeature && map.getZoom() > 11.3) {
      const targetDayCollection = targetFeature.properties?.day
        ? routes[targetFeature.properties.day]
        : targetFeature;

      const bounds = getFeatureBounds(targetDayCollection, targetFeature.properties?.day, isDesktop);

      if (bounds) {
        map.flyToBounds(bounds, {
          paddingTopLeft: effectivePaddingTopLeft,
          paddingBottomRight: effectivePaddingBottomRight,
          duration: props.zoomDuration,
        });
      }
    }
  }, [nextDay, prevDay, map, routes, effectivePaddingTopLeft, effectivePaddingBottomRight, props.zoomDuration]);

  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);

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
      const baseOffset = 0.024;
      const legendOffset = showLegend ? 0.004 : 0;
      const currentOffset = isDesktop ? 0.008 : baseOffset + legendOffset;
      const initialCenter = [center[0] - currentOffset, center[1]];

      // Remove Day 0 logic (Default page is now Day 1)
      if (routes && routes["1"]) {
        dispatchLayerDetails(routes["1"].features[0].properties);
      }
      map.flyTo(initialCenter, derivedZoom, { duration: 1.25 });
    } else {
      // Switch TO "Single Select"
      setSingleDayView(true);

      // Deciding which day to zoom into: last zoomed day, OR current day, OR default to Day 1
      let targetDayKey = day;
      if (!day) {
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
        // No previous zoom state, zoom into the current day's route (or Day 1 if needed)
        const routes = getDayWiseDataG();
        const targetDayKey = day;
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

  // Memoized ControlIcons component
  const ControlIcons = useMemo(() => (
    <div className={`control-icons-grid control-icons-grid--${isDesktop ? 'desktop' : 'mobile'}`}>
      <div className="control-icons-column">
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleTargetView();
          }}
          className={`icon control-icon-button control-icon-button--top control-icon-button--${isDesktop ? 'desktop' : 'mobile'} ${isSingleDayView ? "active" : ""}`}
        >
          <img
            src={locationIcon}
            className={`control-icon-image control-icon-image--${isDesktop ? 'desktop' : 'mobile'}`}
            alt="Reset"
          />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsToolsOpen((prev) => !prev);
          }}
          className={`icon control-icon-button control-icon-button--bottom control-icon-button--${isDesktop ? 'desktop' : 'mobile'}`}
        >
          <img
            src={toolsIcon}
            className={`control-icon-image control-icon-image--${isDesktop ? 'desktop' : 'mobile'}`}
            alt="Tools"
          />
        </div>
      </div>
    </div>
  ), [isDesktop, isSingleDayView, toggleTargetView]);

  return (
    <Control position="bottomright">
      <div className={`dashboard-container dashboard-container--${isDesktop ? 'desktop' : 'mobile'}`}>
        {/* Top Section: Main content row */}
        <div className="dashboard-top-section">
          {/* Left Arrow Slab */}
          <div
            onClick={(e) => { e.stopPropagation(); handleNavigation("prev"); }}
            className="navigation-slab"
          >
            <img
              src={arrowIcon}
              width={iconSizes.navArrow}
              className="navigation-icon"
              alt="Previous"
            />
          </div>

          <div className="dashboard-main-content">
            {/* Top Content (Metrics or Tools) */}
            <div className="dashboard-view-wrapper">
              {isToolsOpen ? (
                /* Tools View */
                <div className="tools-view">
                  <div className="tools-panel-row">
                    <div className="tools-panel-icons">
                      <div onClick={(e) => { e.stopPropagation(); toggleLegend(); }} className="tool-icon-button">
                        <img
                          src={legendIcon}
                          width={iconSizes.toolIcon}
                          alt="Toggle Legend"
                          className="tool-icon-image"
                        />
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); toggleInfo(); }} className="tool-icon-button">
                        <img
                          src={infoIcon}
                          width={iconSizes.toolIcon}
                          alt="Toggle Info"
                          className="tool-icon-image"
                        />
                      </div>

                      {/* Unit Toggle Switch */}
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleUnit(); }}
                        className={`unit-toggle-container unit-toggle-container--${isDesktop ? 'desktop' : 'mobile'}`}
                      >
                        <div
                          className={`unit-toggle-indicator unit-toggle-indicator--${isDesktop ? 'desktop' : 'mobile'}`}
                          style={{ left: unit === "km" ? "2px" : `calc(100% - ${isDesktop ? "29px" : "26px"})` }}
                        >
                          {unit.toUpperCase()}
                        </div>
                        <div className={`unit-toggle-labels unit-toggle-labels--${isDesktop ? 'desktop' : 'mobile'}`}>
                          <span>KM</span>
                          <span>MI</span>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <div onClick={(e) => { e.stopPropagation(); setIsToolsOpen(false); }} className="close-button-wrapper">
                      <div className={`close-button close-button--${isDesktop ? 'desktop' : 'mobile'}`}>✕</div>
                    </div>
                  </div>

                  {/* Branding Strip */}
                  <div className={`branding-strip branding-strip--${isDesktop ? 'desktop' : 'mobile'}`}>
                    <div className={`branding-title branding-title--${isDesktop ? 'desktop' : 'mobile'}`}>
                      Everest Base Camp 3 Pass Trek, Nepal
                    </div>
                    {props.attribution && (
                      <div
                        className={`branding-attribution branding-attribution--${isDesktop ? 'desktop' : 'mobile'}`}
                        dangerouslySetInnerHTML={{ __html: props.attribution }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Central Content (Metrics) */
                <div className={`metrics-content metrics-content--${isDesktop ? 'desktop' : 'mobile'}`}>
                  {/* Middle Content (Data Rows) */}
                  <div className={`metrics-inner metrics-inner--${isDesktop ? 'desktop' : 'mobile'}`}>
                    {/* Stats Container: Name, Elevation, Altitude */}
                    <div className={`stats-container stats-container--${isDesktop ? 'desktop' : 'mobile'}`}>
                      {/* Name */}
                      <div
                        className="trek-name"
                        style={{ fontSize: titleFontSize }}
                        title={props.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSingleDayView) {
                            toggleViewMode();
                          } else {
                            const targetDay = routes[day];
                            if (targetDay?.features[0]) {
                              const bounds = getFeatureBounds(targetDay, day, isDesktop);
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
                        {props.name}
                      </div>
                      {/* Elevation and Altitude */}
                      <div className="elevation-wrapper">
                        <div className={`elevation-stats-row elevation-stats-row--${isDesktop ? 'desktop' : 'mobile'}`}>
                          <span className={`elevation-gain elevation-gain--${isDesktop ? 'desktop' : 'mobile'}`}>
                            ▲{total_climb ? formatAlt(total_climb) : "0"}
                          </span>
                          <span className={`elevation-descent elevation-descent--${isDesktop ? 'desktop' : 'mobile'}`}>
                            ▼{descent ? formatAlt(descent) : "0"}
                          </span>
                        </div>
                        <div className={`altitude-display altitude-display--${isDesktop ? 'desktop' : 'mobile'}`}>
                          {startAlt ? formatAlt(startAlt) : ""}
                        </div>
                      </div>
                    </div>

                      {/* Desktop Only Divider */}
                      {isDesktop && <div className="stats-divider" />}

                      {/* Day, Distance, Time - Desktop */}
                      {isDesktop && (
                        <div className="metrics-bottom-row">
                          {/* Day indicator */}
                          <div className="day-indicator">
                            <span className="day-label-desktop">DAY</span>
                            <span className="day-value-desktop">{props.day}</span>
                          </div>

                          {/* Distance and Time */}
                          {!isPlace && distance && time && (
                            <div className="distance-time-container">
                              {distance !== "0 mi / 0 km" && (
                                <div className="metric-item">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13 18l6-6-6-6M5 12h14" />
                                  </svg>
                                  <span className="metric-value-desktop">{displayDistance()}</span>
                                </div>
                              )}
                              {distance !== "0 mi / 0 km" && (
                                <div className="metric-item">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span className="time-value-desktop">
                                    {time}
                                    <span className="time-asterisk">*</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              )}
            </div>

            {/* Mobile Metrics Row */}
            {!isDesktop && !isToolsOpen && (
              <div className="mobile-metrics-row">
                {/* Day indicator */}
                <div className="day-indicator-mobile">
                  <span className="day-label-mobile">DAY</span>
                  <span className="day-value-mobile">{props.day}</span>
                </div>

                {/* Distance and Time, if present */}
                {!isPlace && distance && time && distance !== "0 mi / 0 km" && (
                  <>
                    <div className="metric-item-mobile">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="3">
                        <path d="M13 18l6-6-6-6M5 12h14" />
                      </svg>
                      <span className="metric-value-mobile">{displayDistance()}</span>
                    </div>
                    <div className="metric-item-mobile">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#95a5a6" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="metric-value-mobile">{time}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Toolbar and Next Arrow */}
          <div className="right-side-container">
            {/* Toolbar Area */}
            {!isToolsOpen && (
              <div className="toolbar-area">
                {ControlIcons}
              </div>
            )}

            {/* Right Arrow Slab */}
            <div
              onClick={(e) => { e.stopPropagation(); handleNavigation("next"); }}
              className="navigation-slab"
            >
              <img
                src={arrowIcon}
                width={iconSizes.navArrow}
                className="navigation-icon arrow-icon-rotated"
                alt="Next"
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
