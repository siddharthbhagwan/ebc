import React, { useMemo } from "react";
import { GeoJSON, withLeaflet, Marker } from "react-leaflet";
import L from "leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";
import { connect } from "react-redux";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import { mapDispatchToProps } from "../utils/utils";
import {
  createGradientSegments,
  getColorForElevation,
} from "../utils/heightGradient";
import tentIcon from "../resources/images/tent.svg";
import airportIcon from "../resources/images/airport.svg";

const GeoJsonRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    zoomDuration,
    dispatchLayerDetails,
    currentDay,
    zoom: reduxZoom,
    isSingleDayView,
    setSingleDayView,
    showLegend,
  } = props;

  // Get landscape orientation for mobile
  const { isLandscape = false } = useMobileOrientation();

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
      return [650, 180];
    }
    // Mobile: landscape needs less bottom padding due to shorter dashboard
    return isLandscape ? [60, 120] : [40, 150];
  }, [isLandscape]);

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
            segments: createGradientSegments(feature.geometry.coordinates),
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

  // On acclimatization days (Rest Days), hide all routes when zoomed in
  if (isZoomedIn && isCurrentDayRestDay) {
    return null;
  }

  const routeLayers = [];
  const highlightedLayers = [];

  Object.entries(memoizedRoutes).forEach(([day, features]) => {
    features.forEach((featureData, featIdx) => {
      const { geometry, properties, segments } = featureData;

      // Handle Point features (Rest Days or specialized markers)
      // Note: We hide these here because they are already rendered by POI.js
      // as part of the markers.jsx data set. This prevents "double" icons
      // and double ripples on rest days like Gorak Shep.
      if (geometry.type === "Point") {
        // Show rest day circular border if zoomed in AND it's the current rest day,
        // OR if zoomed out AND it's selected (for Rest Days)
        const isSelectedPoint = properties.day === currentDay;
        const shouldShowBorder = isZoomedIn ? isSelectedPoint : isSelectedPoint;

        if (!shouldShowBorder) {
          return;
        }

        // Validate coordinates
        if (!geometry.coordinates || geometry.coordinates.length < 2 || isNaN(geometry.coordinates[0]) || isNaN(geometry.coordinates[1])) {
          return;
        }

        const pointLatlng = [geometry.coordinates[1], geometry.coordinates[0]];
        const elevation = geometry.coordinates[2];
        const color = getColorForElevation(elevation);

        routeLayers.push(
          <Marker
            key={"rest-day-" + properties.day + "-" + featIdx}
            position={pointLatlng}
            interactive={properties.day !== "20"}
            icon={L.divIcon({
              className: "rest-day-border-only",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              html: `<div class="rest-day-circle" style="border-color: ${color};">
                      ${
                        properties.day === "20"
                          ? `<img src="${airportIcon}" style="width: 14px; height: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />`
                          : `<img src="${tentIcon}" style="width: 14px; height: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />`
                      }
                     </div>`,
              shadowUrl: null,
            })}
            onmouseover={() => {
              if (properties.day !== "20") {
                dispatchLayerDetails(properties);
              }
            }}
            onclick={() => {
              if (properties.day !== "20") {
                dispatchLayerDetails(properties);
                setSingleDayView(true);
                // Zoom to the point
                const offset = 0.005;
                const bounds = L.latLngBounds(
                  [pointLatlng[0] - offset, pointLatlng[1] - offset],
                  [pointLatlng[0] + offset, pointLatlng[1] + offset],
                );
                map.flyToBounds(bounds, {
                  paddingTopLeft: effectivePaddingTopLeft,
                  paddingBottomRight: effectivePaddingBottomRight,
                  duration: zoomDuration,
                });
              }
            }}
          />,
        );
        return;
      }

      if (geometry.type !== "MultiLineString" || !segments) {
        return;
      }

      // When zoomed in, only show the currently highlighted route
      if (isZoomedIn && properties.day !== currentDay) {
        return;
      }

      const isHighlighted =
        properties.day === currentDay && !isCurrentDayRestDay;

      const clickHandler = () => {
        if (properties.day === "20") return;
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

      // In Zoomed In view, we only want to show the current day's route clearly.
      // Filter out other routes unless we are in overview.
      const isOtherDayInZoom = isZoomedIn && properties.day !== currentDay;

      // Skip rendering other days in zoom view to keep it clean, or keep them with minimal opacity
      if (isOtherDayInZoom) {
        return; // For now, just hide other days in zoom view
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

        // PASS 1: The "Depth" (Deep, wide shadow)
        highlightedLayers.push(
          <GeoJSON
            key={`depth-${day}-${featIdx}-${isZoomedIn}-${reduxZoom}-${showLegend}`}
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

        // PASS 2: The "Inner Shadow" (Slightly darker version of the path color) - REMOVED per user request
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

        // PASS 2: The "Glass Tube" (Semi-transparent Body)
        highlightedLayers.push(
          <GeoJSON
            key={`outer-${day}-${featIdx}-${isZoomedIn}-${reduxZoom}-${showLegend}`}
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

        // PASS 3: The "Sunlight" (Thin, offset-feeling white highlight)
        highlightedLayers.push(
          <GeoJSON
            key={`inner-${day}-${featIdx}-${isZoomedIn}-${reduxZoom}-${showLegend}`}
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
          // Increase weight and opacity for the focused route in Single Day view
          // User requested a "thick" plain line for zoomed in view
          let weight = isZoomedIn ? (isDesktop ? 8 : 7) : 1.8;
          if (isDesktop && !isZoomedIn) {
            weight *= 1.15;
          }

          // Convert segment.latlngs to GeoJSON LineString
          const segmentGeoJSON = {
            type: "LineString",
            coordinates: segment.latlngs.map((ll) => [ll[1], ll[0]]),
          };

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
                reduxZoom +
                "-" +
                showLegend
              }
              data={segmentGeoJSON}
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
            reduxZoom +
            "-" +
            showLegend
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
  zoom: state.mapState.zoom,
  derivedZoom: state.mapState.zoom, // Will be overridden by MapContainer
  isSingleDayView: state.mapState.isSingleDayView,
  showLegend: state.mapState.showLegend,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(GeoJsonRoutes));
