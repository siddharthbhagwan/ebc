import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { connect } from "react-redux";
import ReactGA from "react-ga4";
import L from "leaflet";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import arrowIcon from "../resources/images/leftArrow.svg";
import locationIcon from "../resources/images/location.svg";
import toolsIcon from "../resources/images/settings.svg";
import legendIcon from "../resources/images/legend.svg";
import infoIcon from "../resources/images/info.svg";

import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";
import { calculateTrekStats, getPassInfo, getSummitInfo, getSortedPasses } from "../utils/trekStats";
import packageJson from "../../package.json";

import "../resources/css/dashboard.css";

// Constants
const ZOOM_MOBILE = 10.6;
const ZOOM_LANDSCAPE = 10.5;
const BASE_OFFSET = 0.024;
const DESKTOP_OFFSET = 0.008;

// Memoized helper to calculate center offset
const calculateCenterOffset = (center, offset) => {
  if (!center) return [27.840457443855108, 86.76420972837559];
  const lat = Array.isArray(center) ? center[0] : center.lat;
  const lng = Array.isArray(center) ? center[1] : center.lng;
  
  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return [27.840457443855108, 86.76420972837559];
  }
  
  return [lat - (offset || 0), lng];
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

// Optimized bounds calculator - prioritizes preCalculatedBounds for static data
const getFeatureBounds = (input, dayOverride = null, isDesktopView = true) => {
  if (!input) return null;

  const targetDayId =
    dayOverride ||
    input.features?.[0]?.properties?.day ||
    input.properties?.day;

  // Prioritize preCalculatedBounds since all route data is static
  if (targetDayId && preCalculatedBounds[targetDayId]) {
    const mode = isDesktopView ? "desktop" : "mobile";
    const pBounds = preCalculatedBounds[targetDayId][mode];
    if (pBounds && pBounds.length >= 2 && pBounds[0] && pBounds[1]) {
      return L.latLngBounds(pBounds);
    }
  }

  // Fallback: calculate bounds from GeoJSON (rarely needed)
  // Filter to only include route features (LineString/MultiLineString), not POI Points
  try {
    const routeOnlyInput = {
      ...input,
      features: (input.features || []).filter(f => 
        f.geometry?.type === 'MultiLineString' || f.geometry?.type === 'LineString'
      )
    };
    if (routeOnlyInput.features.length > 0) {
      const layer = L.geoJSON(routeOnlyInput);
      const bounds = layer.getBounds();
      if (bounds.isValid()) return bounds;
    }
  } catch (e) {
    // Silent fallback to manual calculation
  }

  const features = input.features || (Array.isArray(input) ? input : [input]);
  const allLatlngs = [];

  // Only include LineString and MultiLineString for bounds calculation, skip Points (POI icons)
  features.forEach((feature) => {
    if (!feature.geometry) return;
    const coords = feature.geometry.coordinates;

    if (feature.geometry.type === "LineString") {
      coords.forEach((c) => {
        if (Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])) {
          allLatlngs.push([c[1], c[0]]);
        }
      });
    } else if (feature.geometry.type === "MultiLineString") {
      coords.forEach((line) => {
        if (Array.isArray(line)) {
          line.forEach((c) => {
            if (Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])) {
              allLatlngs.push([c[1], c[0]]);
            }
          });
        }
      });
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
  const map = props.map;

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [lastZoomedDay, setLastZoomedDay] = useState(null);
  const [showTrekStats, setShowTrekStats] = useState(false);
  const [passSortOrder, setPassSortOrder] = useState('day');
  const isInitialMount = useRef(true);

  // Calculate trek statistics once
  const trekStats = useMemo(() => calculateTrekStats(), []);

  // Memoized routes data (cached) - moved up for altitude fallback
  const routes = useMemo(() => getDayWiseDataG(), []);

  // Get altitude from current day's route data as fallback
  const currentDayRoute = routes[day];
  const currentDayProps = currentDayRoute?.features?.[0]?.properties || {};
  
  // Use props if available, fallback to route data
  const effectiveStartAlt = startAlt || currentDayProps.startAlt || null;
  const effectiveEndAlt = endAlt || currentDayProps.endAlt || null;
  const effectivePeakAlt = peakAlt || currentDayProps.peakAlt || null;

  //  no altitude data
  const isPlace = effectiveStartAlt === "0" && effectiveEndAlt === "0";
  // Acclimatization / Rest days
  const isRestDay = time === "Rest Day";
  const { isLandscape = false } = useMobileOrientation();

  // Derived zoom based on device and orientation
  const derivedZoom = useMemo(() => {
    if (isDesktop) return zoom;
    return isLandscape ? ZOOM_LANDSCAPE : ZOOM_MOBILE;
  }, [isLandscape, zoom]);

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  // Memoized padding values - optimized for various screen sizes
  const effectivePaddingTopLeft = useMemo(() => {
    if (isDesktop) {
      return [120, showLegend ? 180 : 120];
    }
    // Mobile: adjust for landscape orientation
    return isLandscape
      ? [60, showLegend ? 100 : 60]
      : [40, showLegend ? 90 : 60];
  }, [showLegend, isLandscape]);

  const effectivePaddingBottomRight = useMemo(() => {
    if (isDesktop) {
      return [650, 180];
    }
    // Mobile: landscape needs less bottom padding due to shorter dashboard
    return isLandscape ? [60, 120] : [40, 150];
  }, [isLandscape]);

  // Memoized legend offset calculation
  const currentOffset = useMemo(() => {
    const legendOffset = showLegend ? 0.004 : 0;
    return isDesktop ? DESKTOP_OFFSET : BASE_OFFSET + legendOffset;
  }, [showLegend]);

  // Memoized icon sizes
  const iconSizes = useMemo(
    () => ({
      baseWidth: isDesktop ? 34 : 25,
      height: isDesktop ? 36 : 26,
      navArrow: isDesktop ? "33px" : "31px",
      toolIcon: isDesktop ? "29px" : "27px",
      maxIcon: isDesktop ? "24px" : "18px",
    }),
    [],
  );

  // Memoized formatAlt function
  const formatAlt = useCallback(
    (alt) => {
      if (!alt) return "";
      const val = parseInt(alt.toString().replace(/,/g, ""));
      if (isNaN(val)) return alt;
      return unit === "km"
        ? `${Math.round(val * 0.3048).toLocaleString()}m`
        : `${val.toLocaleString()}ft`;
    },
    [unit],
  );

  // Memoized displayDistance function
  const displayDistance = useCallback(() => {
    if (!distance) return "";
    const parts = distance.split("/");
    if (parts.length < 2) return distance;
    return unit === "km" ? parts[1].trim() : parts[0].trim();
  }, [distance, unit]);

  // Memoized title font size
  const titleFontSize = useMemo(
    () => getTitleFontSize(props.name || "", isDesktop),
    [props.name],
  );

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
  }, [
    map,
    isSingleDayView,
    day,
    setSingleDayView,
    center,
    currentOffset,
    derivedZoom,
    routes,
    effectivePaddingTopLeft,
    effectivePaddingBottomRight,
  ]);

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
        // Switch to highlighted route or most recently zoomed day
        // Priority: lastZoomedDay (if exists) > current highlighted day > Day 1
        const targetDayKey = lastZoomedDay || day || "1";
        console.log(
          `Target button: Switching to day ${targetDayKey} (current day: ${day}, lastZoomedDay: ${lastZoomedDay})`,
        );
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
  }, [
    map,
    isSingleDayView,
    setSingleDayView,
    routes,
    dispatchLayerDetails,
    center,
    currentOffset,
    derivedZoom,
    day,
    lastZoomedDay,
    effectivePaddingTopLeft,
    effectivePaddingBottomRight,
  ]);

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
    if (isSingleDayView && day && routes[day] && map) {
      const bounds = getFeatureBounds(routes[day], day, isDesktop);
      if (bounds) {
        // Skip animation on initial mount to prevent jitter
        if (isInitialMount.current) {
          map.invalidateSize();
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            animate: false,
          });
        } else {
          // Use requestAnimationFrame for smoother animation
          const frameId = requestAnimationFrame(() => {
            map.invalidateSize();
            map.flyToBounds(bounds, {
              paddingTopLeft: effectivePaddingTopLeft,
              paddingBottomRight: effectivePaddingBottomRight,
              duration: 0.6,
            });
          });
          return () => cancelAnimationFrame(frameId);
        }
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
    routes,
  ]);

  // Adjust overview center when legend visibility changes on mobile
  useEffect(() => {
    if (!isSingleDayView && !isDesktop && map) {
      const newCenter = calculateCenterOffset(center, currentOffset);
      // Skip animation on initial mount to prevent jitter
      if (isInitialMount.current) {
        isInitialMount.current = false;
        map.invalidateSize();
        map.setView(newCenter, derivedZoom, { animate: false });
      } else {
        // Use requestAnimationFrame for smoother animation without jitter
        const frameId = requestAnimationFrame(() => {
          map.invalidateSize();
          map.flyTo(newCenter, derivedZoom, { duration: 0.6 });
        });
        return () => cancelAnimationFrame(frameId);
      }
    } else if (isInitialMount.current) {
      // Mark as mounted even if conditions aren't met
      isInitialMount.current = false;
    }
  }, [showLegend, isSingleDayView, center, currentOffset, derivedZoom, map]);

  const handleToggleTools = useCallback(() => {
    setIsToolsOpen((prev) => {
      const newState = !prev;
      ReactGA.event({
        category: "UI",
        action: "Toggle Tools Panel",
        label: `${newState ? "Open" : "Close"} - Day ${props.day} - ${isDesktop ? "Desktop" : "Mobile"}`,
      });
      if (!newState) {
        setShowTrekStats(false);
        // Close About/Info panel when toolbar closes on mobile
        if (!isDesktop && props.showInfo) {
          toggleInfo();
        }
      }
      return newState;
    });
  }, [props.showInfo, props.day, toggleInfo]);

  const handleSortToggle = useCallback(() => {
    const nextOrder = passSortOrder === 'day' ? 'desc' : passSortOrder === 'desc' ? 'asc' : 'day';
    ReactGA.event({
      category: "UI",
      action: "Sort High Points",
      label: nextOrder,
    });
    setPassSortOrder(nextOrder);
  }, [passSortOrder]);

  const handleNavigation = useCallback(
    (direction) => {
      const fromDay = day;
      const targetFeature = direction === "next" ? nextDay() : prevDay();
      const toDay = targetFeature?.properties?.day || "unknown";
      ReactGA.event({
        category: "Navigation",
        action: direction === "next" ? "Next Day" : "Previous Day",
        label: `Day ${fromDay} → Day ${toDay} - ${isDesktop ? "Desktop" : "Mobile"}`,
      });
      setIsToolsOpen(false);
      setShowTrekStats(false);

      if (!map) return;

      if (targetFeature && map.getZoom() > 11.3) {
        const targetDayCollection = targetFeature.properties?.day
          ? routes[targetFeature.properties.day]
          : targetFeature;

        const bounds = getFeatureBounds(
          targetDayCollection,
          targetFeature.properties?.day,
          isDesktop,
        );

        if (bounds) {
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: props.zoomDuration,
          });
        }
      }
    },
    [
      nextDay,
      prevDay,
      map,
      routes,
      day,
      effectivePaddingTopLeft,
      effectivePaddingBottomRight,
      props.zoomDuration,
    ],
  );

  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault(); // Prevent default map scrolling
        ReactGA.event({ category: "Navigation", action: "Keyboard", label: "ArrowRight - Next Day" });
        handleNavigation("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault(); // Prevent default map scrolling
        ReactGA.event({ category: "Navigation", action: "Keyboard", label: "ArrowLeft - Previous Day" });
        handleNavigation("prev");
      } else if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        ReactGA.event({ category: "Navigation", action: "Keyboard", label: `${e.code === "Space" ? "Space" : "Enter"} - Reset Zoom` });
        resetZoom();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        ReactGA.event({ category: "Navigation", action: "Keyboard", label: "ArrowUp - Zoom Out" });
        zoomOut();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        ReactGA.event({ category: "Navigation", action: "Keyboard", label: "ArrowDown - Zoom In" });
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
    if (!map) return;
    const routes = getDayWiseDataG();

    if (isSingleDayView) {
      // Switch TO "View All"
      ReactGA.event({
        category: "UI",
        action: "Toggle View Mode",
        label: `View All - from Day ${day} - ${isDesktop ? "Desktop" : "Mobile"}`,
      });
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
      ReactGA.event({
        category: "UI",
        action: "Toggle View Mode",
        label: `Single Day - Day ${lastZoomedDay || day || "1"} - ${isDesktop ? "Desktop" : "Mobile"}`,
      });
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
  const ControlIcons = useMemo(
    () => (
      <div
        className={`control-icons-grid control-icons-grid--${isDesktop ? "desktop" : "mobile"}`}
      >
        <div className="control-icons-column">
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleTargetView();
            }}
            className={`icon control-icon-button control-icon-button--top control-icon-button--${isDesktop ? "desktop" : "mobile"} ${isSingleDayView ? "active" : ""}`}
          >
            <img
              src={locationIcon}
              className={`control-icon-image control-icon-image--${isDesktop ? "desktop" : "mobile"}`}
              alt="Reset"
            />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleToggleTools();
            }}
            className={`icon control-icon-button control-icon-button--bottom control-icon-button--${isDesktop ? "desktop" : "mobile"}`}
          >
            <img
              src={toolsIcon}
              className={`control-icon-image control-icon-image--${isDesktop ? "desktop" : "mobile"}`}
              alt="Tools"
            />
          </div>
        </div>
      </div>
    ),
    [isSingleDayView, toggleTargetView, handleToggleTools],
  );

  return (
    <>
      <div
        className={`dashboard-container dashboard-container--${isDesktop ? "desktop" : "mobile"}${showTrekStats ? " statistics-open" : ""}${props.showInfo ? " info-open" : ""}`}
      >
        {/* Top Section: Main content row */}
        <div className="dashboard-top-section">
          {/* Left Arrow Slab */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNavigation("prev");
            }}
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
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const willOpen = !showTrekStats;
                          ReactGA.event({
                            category: "UI",
                            action: "Toggle Stats",
                            label: `${willOpen ? "Show" : "Hide"} - ${isDesktop ? "Desktop" : "Mobile"}`,
                          });
                          // If opening stats and info is open, close info first
                          if (willOpen && props.showInfo) {
                            toggleInfo();
                          }
                          setShowTrekStats(willOpen);
                        }}
                        className="tool-icon-button"
                        title="Trek Stats"
                      >
                        <div 
                          className="tool-icon-image"
                          style={{ 
                            fontSize: isDesktop ? '18px' : '16px',
                            fontWeight: '700',
                            color: '#4a5568',
                            userSelect: 'none',
                            lineHeight: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: iconSizes.toolIcon,
                            height: iconSizes.toolIcon,
                            background: showTrekStats ? '#e3f2fd' : '#f9f9f9',
                            border: showTrekStats ? '1.5px solid #2563eb' : '1.5px solid #bdc3c7',
                            boxSizing: 'border-box'
                          }}
                        >
                          Σ
                        </div>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          ReactGA.event({
                            category: "UI",
                            action: "Toggle Legend",
                            label: `${showLegend ? "Hide" : "Show"} - ${isDesktop ? "Desktop" : "Mobile"}`,
                          });
                          toggleLegend();
                        }}
                        className="tool-icon-button"
                        title="Toggle Legend"
                      >
                        <img
                          src={legendIcon}
                          width={iconSizes.toolIcon}
                          alt="Toggle Legend"
                          className="tool-icon-image"
                          style={{
                            background: showLegend ? '#e3f2fd' : '#f9f9f9',
                            border: showLegend ? '1.5px solid #2563eb' : '1.5px solid #bdc3c7'
                          }}
                        />
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const willOpen = !props.showInfo;
                          ReactGA.event({
                            category: "UI",
                            action: "Toggle Info",
                            label: willOpen ? "Open" : "Close"
                          });
                          // If opening info and stats is open, close stats first
                          if (willOpen && showTrekStats) {
                            setShowTrekStats(false);
                          }
                          toggleInfo();
                        }}
                        className="tool-icon-button"
                        title="About This Trek"
                      >
                        <img
                          src={infoIcon}
                          width={iconSizes.toolIcon}
                          alt="Toggle Info"
                          className="tool-icon-image"
                          style={{
                            background: props.showInfo ? '#e3f2fd' : '#f9f9f9',
                            border: props.showInfo ? '1.5px solid #2563eb' : '1.5px solid #bdc3c7'
                          }}
                        />
                      </div>

                      {/* Unit Toggle Switch */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          ReactGA.event({
                            category: "UI",
                            action: "Toggle Unit",
                            label: `${unit === "km" ? "FT" : "M"} - ${isDesktop ? "Desktop" : "Mobile"}`,
                          });
                          toggleUnit();
                        }}
                        className={`unit-toggle-container unit-toggle-container--${isDesktop ? "desktop" : "mobile"}`}
                      >
                        <div
                          className={`unit-toggle-indicator unit-toggle-indicator--${isDesktop ? "desktop" : "mobile"}`}
                          style={{
                            left:
                              unit === "km"
                                ? "2px"
                                : `calc(100% - ${isDesktop ? "29px" : "26px"})`,
                          }}
                        >
                          {unit === "km" ? "M" : "FT"}
                        </div>
                        <div
                          className={`unit-toggle-labels unit-toggle-labels--${isDesktop ? "desktop" : "mobile"}`}
                        >
                          <span>M</span>
                          <span>FT</span>
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        ReactGA.event({
                          category: "UI",
                          action: "Close Tools Panel",
                          label: `Via X Button - Day ${props.day} - ${isDesktop ? "Desktop" : "Mobile"}`,
                        });
                        setIsToolsOpen(false);
                        setShowTrekStats(false);
                        // Close About/Info panel when toolbar closes on mobile
                        if (!isDesktop && props.showInfo) {
                          toggleInfo();
                        }
                      }}
                      className="close-button-wrapper"
                    >
                      <div
                        className={`close-button close-button--${isDesktop ? "desktop" : "mobile"}`}
                      >
                        ✕
                      </div>
                    </div>
                  </div>

                  {/* Branding Strip */}
                  <div
                    className={`branding-strip branding-strip--${isDesktop ? "desktop" : "mobile"}`}
                  >
                    <div
                      className={`branding-title branding-title--${isDesktop ? "desktop" : "mobile"}`}
                    >
                      Everest Base Camp 3 Trek, Nepal
                      {isDesktop && (
                        <span style={{ fontSize: "0.75em", opacity: 0.8, marginLeft: "8px" }}>
                          <span style={{ fontSize: "0.85em" }}>v</span>{packageJson.version}
                        </span>
                      )}
                    </div>
                    {!isDesktop && (
                      <div style={{ fontSize: "9px", color: "#7f8c8d", fontWeight: 700, letterSpacing: "0.8px" }}>
                        <span style={{ fontSize: "0.85em" }}>v</span>{packageJson.version}
                      </div>
                    )}
                    {props.attribution && (
                      <div
                        className={`branding-attribution branding-attribution--${isDesktop ? "desktop" : "mobile"}`}
                        dangerouslySetInnerHTML={{ __html: props.attribution }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Central Content (Metrics) */
                <div
                  className={`metrics-content metrics-content--${isDesktop ? "desktop" : "mobile"}`}
                >
                  {/* Middle Content (Data Rows) */}
                  <div
                    className={`metrics-inner metrics-inner--${isDesktop ? "desktop" : "mobile"}`}
                  >
                    {/* Stats Container: Name, Elevation, Altitude */}
                    <div
                      className={`stats-container stats-container--${isDesktop ? "desktop" : "mobile"}`}
                    >
                      {/* Name */}
                      <div
                        className="trek-name"
                        style={{ fontSize: titleFontSize }}
                        title={props.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          ReactGA.event({
                            category: "Navigation",
                            action: "Click Trek Name",
                            label: `Day ${day} - ${isSingleDayView ? "Re-center" : "Enter Single Day"} - ${isDesktop ? "Desktop" : "Mobile"}`,
                          });
                          if (!isSingleDayView) {
                            toggleViewMode();
                          } else {
                            const targetDay = routes[day];
                            if (targetDay?.features[0]) {
                              const bounds = getFeatureBounds(
                                targetDay,
                                day,
                                isDesktop,
                              );
                              if (bounds) {
                                map.flyToBounds(bounds, {
                                  paddingTopLeft: effectivePaddingTopLeft,
                                  paddingBottomRight:
                                    effectivePaddingBottomRight,
                                  duration: props.zoomDuration,
                                });
                              }
                            }
                          }
                        }}
                      >
                        {props.name}
                      </div>
                      {/* Elevation and Altitude - hide elevation gain/descent for rest days or if zero */}
                      <div className="elevation-wrapper">
                        {!isRestDay && (total_climb || descent) && (
                          <div
                            className={`elevation-stats-row elevation-stats-row--${isDesktop ? "desktop" : "mobile"}`}
                          >
                            {(() => {
                              const climbNum = parseInt(total_climb?.toString().replace(/,/g, "") || "0");
                              const descentNum = parseInt(descent?.toString().replace(/,/g, "") || "0");
                              
                              return (
                                <>
                                  {total_climb && total_climb !== "0" && (
                                    <span
                                      className={`elevation-gain elevation-gain--${isDesktop ? "desktop" : "mobile"}`}
                                      style={{ 
                                        fontSize: isDesktop 
                                          ? (climbNum >= descentNum ? "17px" : "14px") 
                                          : (climbNum >= descentNum ? "15px" : "12px") 
                                      }}
                                    >
                                      <span style={{ fontSize: '0.7em' }}>▲</span>{formatAlt(total_climb)}
                                    </span>
                                  )}
                                  {descent && descent !== "0" && (
                                    <span
                                      className={`elevation-descent elevation-descent--${isDesktop ? "desktop" : "mobile"}`}
                                      style={{ 
                                        fontSize: isDesktop 
                                          ? (descentNum >= climbNum ? "17px" : "14px") 
                                          : (descentNum >= climbNum ? "15px" : "12px") 
                                      }}
                                    >
                                      <span style={{ fontSize: '0.7em' }}>▼</span>{formatAlt(descent)}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <div
                          className={`altitude-display altitude-display--${isDesktop ? "desktop" : "mobile"}`}
                        >
                          {isRestDay ? (
                            // Rest day: show only single altitude
                            <span className="altitude-single">
                              {effectiveEndAlt ? formatAlt(effectiveEndAlt) : ""}
                            </span>
                          ) : (
                            // Normal day: show start → peak → end
                            <>
                              <span className="altitude-start">
                                {effectiveStartAlt ? formatAlt(effectiveStartAlt) : ""}
                              </span>
                              {effectivePeakAlt && (
                                <span className="altitude-peak">
                                  {" "}
                                  → {formatAlt(effectivePeakAlt)}
                                </span>
                              )}
                              <span className="altitude-end">
                                {" "}
                                → {effectiveEndAlt ? formatAlt(effectiveEndAlt) : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Day, Distance, Time - Desktop */}
                    {isDesktop && (
                      <div className={`metrics-bottom-row ${props.showInfo ? 'info-active' : ''}`}>
                        {/* Day indicator */}
                        <div className="day-indicator">
                          <span className="day-label-desktop">DAY</span>
                          <span className="day-value-desktop">{props.day}</span>
                          {getPassInfo(props.day) && (
                            <span
                              style={{
                                marginLeft: '8px',
                                padding: '0px 5px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#fff',
                                backgroundColor: getPassInfo(props.day).color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '15px'
                              }}
                            >
                              Pass
                            </span>
                          )}
                          {getSummitInfo(props.day) && (
                            <span
                              style={{
                                marginLeft: '8px',
                                padding: '0px 5px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#fff',
                                backgroundColor: getSummitInfo(props.day).color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '15px'
                              }}
                            >
                              Summit
                            </span>
                          )}
                        </div>

                        {/* Distance and Time */}
                        {!isPlace && distance && time && (
                          <div className="distance-time-container">
                            {distance !== "0 mi / 0 km" && (
                              <div className="metric-item">
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
                                <span className="metric-value-desktop">
                                  {displayDistance()}
                                </span>
                              </div>
                            )}
                            {distance !== "0 mi / 0 km" && (
                              <div className="metric-item">
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
                  {getPassInfo(props.day) && (
                    <span
                      style={{
                        marginLeft: '6px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        lineHeight: '1.1',
                        fontWeight: '700',
                        color: '#fff',
                        backgroundColor: getPassInfo(props.day).color,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      PASS
                    </span>
                  )}
                  {getSummitInfo(props.day) && (
                    <span
                      style={{
                        marginLeft: '6px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        lineHeight: '1.1',
                        fontWeight: '700',
                        color: '#fff',
                        backgroundColor: getSummitInfo(props.day).color,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      SUMMIT
                    </span>
                  )}
                </div>

                {/* Distance and Time, if present */}
                {!isPlace && distance && time && distance !== "0 mi / 0 km" && (
                  <div className="metrics-group-mobile">
                    <div className="metric-item-mobile">
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
                      <span className="metric-value-mobile">
                        {displayDistance()}
                      </span>
                    </div>
                    <div className="metric-item-mobile">
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
                      <span className="metric-value-mobile">
                        {time}
                        <span className="time-asterisk">*</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Toolbar and Next Arrow */}
          <div className="right-side-container">
            {/* Toolbar Area */}
            {(isDesktop || !isToolsOpen) && <div className="toolbar-area">{ControlIcons}</div>}

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
                width={iconSizes.navArrow}
                className="navigation-icon arrow-icon-rotated"
                alt="Next"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trek Statistics Overlay */}
      {showTrekStats && (
        <>
          <div
            className="statistics-backdrop"
            onClick={() => {
              ReactGA.event({
                category: "UI",
                action: "Close Stats Panel",
                label: `Via Backdrop - ${isDesktop ? "Desktop" : "Mobile"}`,
              });
              setShowTrekStats(false);
            }}
          />
          <div className={`statistics-card statistics-card--${isDesktop ? 'desktop' : 'mobile'}`}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none' }}>
              Trek Stats
            </h3>
            
            {/* Clickable section to toggle sorting - includes summary stats and the High Points header */}
            <div 
              className="clickable-sort-area" 
              onClick={handleSortToggle}
              style={{ cursor: 'pointer' }}
            >
              <div className="statistics-content">
                <div className="stat-row">
                  <span className="stat-label">Total Distance</span>
                  <span className="stat-value">
                    {unit === "km" ? `${trekStats.totalDistance} km` : `${(trekStats.totalDistance * 0.621371).toFixed(1)} mi`}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total Ascent</span>
                  <span className="stat-value" style={{ color: '#27ae60', fontWeight: '800' }}>
                    <span style={{ fontSize: '0.8em' }}>▲</span> {formatAlt(trekStats.totalClimb)}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total Descent</span>
                  <span className="stat-value" style={{ color: '#8c2419', fontWeight: '800' }}>
                    <span style={{ fontSize: '0.8em' }}>▼</span> {formatAlt(trekStats.totalDescent)}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Max Altitude</span>
                  <span className="stat-value" style={{ fontWeight: '800' }}>{formatAlt(trekStats.maxAltitude)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Days (Active/Rest)</span>
                  <span className="stat-value">{trekStats.activeDays}/{trekStats.restDays}</span>
                </div>
              </div>

              <div className="high-passes-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h4 
                  style={{ userSelect: 'none', margin: '15px 0 5px 0', textTransform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                  <span style={{ fontSize: isDesktop ? '1.1rem' : '1rem' }}>High Points</span>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    color: passSortOrder === 'day' ? '#a0aec0' : '#3182ce',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: passSortOrder === 'day' ? '#f7fafc' : '#ebf8ff',
                    border: passSortOrder === 'day' ? '1px solid #edf2f7' : '1px solid #bee3f8'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" />
                    </svg>
                  </div>
                </h4>
              </div>
            </div>

            <div className="high-passes-list">
              {getSortedPasses(passSortOrder).map((pass, index) => (
                <div key={index} className="stat-row">
                  <span className="stat-label">
                    {pass.name}
                    <span style={{ 
                      fontSize: '0.75em', 
                      color: '#7f8c8d', 
                      marginLeft: '6px',
                      fontWeight: '500'
                    }}>
                      Day {pass.day}
                    </span>
                  </span>
                  <span className="stat-value">{formatAlt(pass.altitude)}</span>
                </div>
              ))}
            </div>

            {/* Close instruction text - at bottom */}
            <div 
              onClick={() => {
                ReactGA.event({
                  category: "UI",
                  action: "Close Stats Panel",
                  label: `Via Tap Text - ${isDesktop ? "Desktop" : "Mobile"}`,
                });
                setShowTrekStats(false);
              }}
              style={{ 
                borderTop: '1px solid #edf2f7',
                marginTop: '12px',
                paddingTop: '8px',
                textAlign: 'center', 
                fontSize: '10px', 
                color: '#a0aec0', 
                fontWeight: '300',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Tap here to close
            </div>
          </div>
        </>
      )}
    </>
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
  showInfo: state.mapState.showInfo,
  attribution: state.mapState.attribution,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);
