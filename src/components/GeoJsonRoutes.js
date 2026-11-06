import React, { useMemo, useState, useEffect } from "react";
import { GeoJSON, withLeaflet } from "react-leaflet";
import L from "leaflet";
import ReactGA from "react-ga4";
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";
import { connect } from "react-redux";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import { mapDispatchToProps } from "../utils/utils";
import { createGradientSegments } from "../utils/heightGradient";

const GeoJsonRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    zoomDuration,
    dispatchLayerDetails,
    currentDay,
    isSingleDayView,
    setSingleDayView,
    showLegend,
  } = props;

  // Get landscape orientation for mobile
  const { isLandscape = false } = useMobileOrientation();

  // Dynamic padding based on viewport height for better small screen support
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized padding values - optimized for various screen sizes
  const effectivePaddingTopLeft = useMemo(() => {
    if (isDesktop) {
      return [120, showLegend ? 180 : 120];
    }
    // Mobile: adjust for landscape orientation
    return isLandscape ? [60, showLegend ? 100 : 60] : [40, showLegend ? 90 : 60];
  }, [showLegend, isLandscape]);

  const effectivePaddingBottomRight = useMemo(() => {
    if (isDesktop) {
      // Dynamic bottom padding based on screen size
      // For smaller screens (< 700px), use minimal padding
      // For normal screens, use proportional scaling
      if (viewportHeight < 700) {
        return [Math.max(200, Math.floor(viewportHeight * 0.25)), 180];
      }
      // Standard calculation for larger screens
      const dynamicBottom = Math.min(650, Math.max(300, Math.floor(viewportHeight * 0.45)));
      return [dynamicBottom, 180];
    }
    // Mobile: landscape needs less bottom padding due to shorter dashboard
    return isLandscape ? [60, 120] : [40, 150];
  }, [isLandscape, viewportHeight]);

  const routes = getDayWiseDataG();

  const currentDayRoute = routes[currentDay];
  const isCurrentDayRestDay =
    currentDayRoute &&
    currentDayRoute.features &&
    currentDayRoute.features[0] &&
    currentDayRoute.features[0].properties.time === "Rest Day";

  // Memoize segments for all routes once to avoid heavy recalculation on every state change
  const memoizedRoutes = useMemo(() => {
    if (!routes) return {};
    const result = {};
    Object.entries(routes).forEach(([day, route]) => {
      if (!route || !route.features) return;

      result[day] = route.features.map((feature) => {
        if (feature.geometry.type === "MultiLineString") {
          return {
            segments: createGradientSegments(feature.geometry.coordinates).map(
              (segment) => ({
                color: segment.color,
                geojson: {
                  type: "LineString",
                  coordinates: segment.latlngs.map((ll) => [ll[1], ll[0]]),
                },
              }),
            ),
            properties: feature.properties,
            geometry: feature.geometry,
          };
        } else {
          return {
            properties: feature.properties,
            geometry: feature.geometry,
          };
        }
      });
    });
    return result;
  }, [routes]);

  if (!routes) {
    return null;
  }

  const isZoomedIn = isSingleDayView;

  const routeLayers = [];
  const highlightedLayers = [];

  Object.entries(memoizedRoutes).forEach(([day, features]) => {
    features.forEach((featureData, featIdx) => {
      const { geometry, properties, segments } = featureData;

      // Skip Point features entirely - they are rest days (Day 3, 9, 11, 17) 
      // or the Day 0 overview marker. POI.js already renders all location markers
      // from markers.jsx with proper styling. Rendering Point features here
      // causes duplicate circles at rest day locations (e.g., Lobuche on Day 9).
      if (geometry.type === "Point") {
        return;
      }

      if (geometry.type !== "MultiLineString" || !segments) {
        return;
      }

      // When zoomed in on a walking day, only that day's line is shown.
      // A stay day has no line, so the other routes stay up. The map is never blank.
      if (isZoomedIn && !isCurrentDayRestDay && properties.day !== currentDay) {
        return;
      }

      const isHighlighted =
        properties.day === currentDay && !isCurrentDayRestDay;

      const clickHandler = () => {
        if (properties.day === "20") return;
        
        // Track route click
        ReactGA.event({
          category: "Route",
          action: "Click Route Line",
          label: `Day ${properties.day} - ${properties.name || "Route"} - from Day ${currentDay} - ${isDesktop ? "Desktop" : "Mobile"}`,
        });
        
        dispatchLayerDetails(properties);

        // Toggle behavior: if already in single day view on mobile and clicking current day, toggle back to overview
        if (!isDesktop && isSingleDayView && properties.day === currentDay) {
          setSingleDayView(false); // Toggle back to overview
          return; // Skip zoom logic
        }

        setSingleDayView(true); // Switch to Single Day View on selection

        // Use pre-calculated bounds or calculate on the fly
        let bounds;
        const stored = preCalculatedBounds[properties.day];
        if (stored) {
          const boundData = isDesktop ? stored.desktop : stored.mobile;
          if (boundData && boundData[0] && boundData[1]) {
            bounds = L.latLngBounds(boundData[0], boundData[1]);
          }
        } else {
          const allLatlngs = geometry.coordinates.flatMap((line) =>
            line.filter(coord => Array.isArray(coord) && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1]))
                .map((coord) => [coord[1], coord[0]]),
          );
          if (allLatlngs.length > 0) {
            bounds = L.latLngBounds(allLatlngs);
          }
        }

        if (bounds) {
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: zoomDuration,
          });
        }
      };

      // Only show the pronounced "Tube" highlight in the Overview view when a route is selected/hovered.
      // In Single Day view, we show the clean, raw gradient segments as requested.
      const isShowTube = !isZoomedIn && isHighlighted;

      // Walking-day zoom shows only that day. A rest day has no line, so the
      // other days stay. Their stroke is thinned below; opacity is unchanged.
      const isOtherDayInZoom =
        isZoomedIn && !isCurrentDayRestDay && properties.day !== currentDay;

      if (isOtherDayInZoom) {
        return;
      }

      if (isShowTube) {
        // Adjusted weights to make the "Tube" lines closer and more precise
        const outerWeight = isDesktop
          ? isZoomedIn
            ? 9.5
            : 8.5
          : isZoomedIn
            ? 8.5
            : 7.5;
        const innerWeight = isDesktop
          ? isZoomedIn
            ? 5.5
            : 5
          : isZoomedIn
            ? 5
            : 4.5;

        const highlightColor = segments[0]?.color || "#2c3e50";

        //  1: The "Depth" (Deep, wide shadow)
        highlightedLayers.push(
          <GeoJSON
            key={`depth-${day}-${featIdx}-${isZoomedIn}-${showLegend}`}
            data={geometry}
            className="pulsating-path"
            style={{
              color: "#000",
              weight: outerWeight + 6,
              opacity: 0.12,
              lineCap: "round",
              lineJoin: "round",
            }}
            smoothFactor={0}
            noClip={true}
            interactive={false}
          />,
        );

        //  2: The "Inner Shadow" (Slightly darker version of the path color) - REMOVED per user request
        // highlightedLayers.push(
        //   <GeoJSON
        //     key={`border-${day}-${featIdx}-${isZoomedIn}-${isDeepZoom}-${reduxZoom}-${showLegend}`}
        //     data={geometry}
        //     className="pulsating-path"
        //     style={{
        //       color: "#2c3e50", // Charcoal contrast
        //       weight: outerWeight + 1.5,
        //       opacity: 0.4,
        //       lineCap: "round",
        //       lineJoin: "round",
        //     }}
        //     smoothFactor={isZoomedIn ? 0 : 4}
        //     noClip={isZoomedIn}
        //     interactive={false}
        //   />,
        // );

        //  2: The "Glass Tube" (Semi-transparent Body)
        highlightedLayers.push(
          <GeoJSON
            key={`outer-${day}-${featIdx}-${isZoomedIn}-${showLegend}`}
            data={geometry}
            className="pulsating-path"
            style={{
              color: highlightColor,
              weight: outerWeight,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
            smoothFactor={0}
            noClip={true}
            interactive={properties.day !== "20"}
            onEachFeature={(feature, layer) => {
              layer.on({
                mouseover: () => {
                  // In single day view on desktop, disable hover to prevent day switching
                  if (isZoomedIn && isDesktop) return;
                  if (properties.day !== "20") {
                    dispatchLayerDetails(properties);
                  }
                },
                click: clickHandler,
                dblclick: clickHandler,
              });
            }}
          />,
        );

        //  3: The "Sunlight" (Thin, offset-feeling white highlight)
        highlightedLayers.push(
          <GeoJSON
            key={`inner-${day}-${featIdx}-${isZoomedIn}-${showLegend}`}
            data={geometry}
            className="pulsating-path"
            style={{
              color: "white",
              weight: innerWeight * 0.7,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
            smoothFactor={0}
            noClip={true}
            interactive={false}
          />,
        );
      } else {
        // Render standard gradient segments for background routes using GeoJSON
        segments.forEach((segment, segIdx) => {
          // Walking-day zoom uses the thick plain line. A rest-day zoom has no
          // line of its own, so the other days stay at the thin 3D route width
          // (ROUTE.width, about 2.4px). Opacity is left alone.
          const REST_DAY_ROUTE_WEIGHT = 2.4;
          let weight =
            isZoomedIn && isCurrentDayRestDay
              ? REST_DAY_ROUTE_WEIGHT
              : isZoomedIn
                ? isDesktop
                  ? 8
                  : 7
                : 1.8;
          if (isDesktop && !isZoomedIn) {
            weight *= 1.15;
          }

          routeLayers.push(
            <GeoJSON
              key={
                day +
                "-" +
                featIdx +
                "-" +
                segIdx +
                "-" +
                isZoomedIn +
                "-" +
                showLegend +
                "-" +
                isCurrentDayRestDay
              }
              data={segment.geojson}
              style={{
                color: segment.color,
                weight: weight,
                opacity: properties.day === currentDay ? 1 : 0.65,
                lineCap: "round",
                lineJoin: "round",
              }}
              smoothFactor={0}
              noClip={true}
              interactive={properties.day !== "20"}
              onEachFeature={(feature, layer) => {
                layer.on({
                  mouseover: () => {
                    // In single day view on desktop, disable hover to prevent day switching
                    if (isZoomedIn && isDesktop) return;
                    if (properties.day !== "20") {
                      dispatchLayerDetails(properties);
                    }
                  },
                  click: clickHandler,
                  dblclick: clickHandler,
                });
              }}
            />,
          );
        });
      }

      // Render invisible wider GeoJSON for easier clicking/tapping
      routeLayers.push(
        <GeoJSON
          key={
            "tap-target-" +
            day +
            "-" +
            featIdx +
            "-" +
            isZoomedIn +
            "-" +
            showLegend +
            "-" +
            isCurrentDayRestDay
          }
          data={geometry}
          style={{
            color: "transparent",
            weight: 25,
            opacity: 0,
          }}
          smoothFactor={0}
          noClip={true}
          interactive={properties.day !== "20"}
          onEachFeature={(feature, layer) => {
            layer.on({
              mouseover: () => {
                // In single day view on desktop, disable hover to prevent day switching
                if (isZoomedIn && isDesktop) return;
                if (properties.day !== "20") {
                  dispatchLayerDetails(properties);
                }
              },
              click: clickHandler,
              dblclick: clickHandler,
            });
          }}
        />,
      );
    });
  });

  return [...routeLayers, ...highlightedLayers];
};

const mapStateToProps = (state) => ({
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  currentDay: state.route.day,
  isSingleDayView: state.mapState.isSingleDayView,
  showLegend: state.mapState.showLegend,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(GeoJsonRoutes));
