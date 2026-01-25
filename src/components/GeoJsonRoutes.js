import React, { useMemo } from "react";
import { Polyline, withLeaflet } from "react-leaflet";
import L from "leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { connect } from "react-redux";
import { isDesktop } from "react-device-detect";
import { mapDispatchToProps } from "../utils/utils";
import { createGradientSegments } from "../utils/heightGradient";

const GeoJsonRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    zoomDuration,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
    currentDay,
    isSingleDayView,
    setSingleDayView,
  } = props;

  // Adjust padding for mobile and desktop to account for the legend at the top and dashboard at the bottom
  const effectivePaddingTopLeft = [
    paddingTopLeft[0],
    isDesktop ? paddingTopLeft[1] + 30 : paddingTopLeft[1] + 60,
  ];

  const effectivePaddingBottomRight = isDesktop
    ? [paddingBottomRight[0] + 625, paddingBottomRight[1] + 160]
    : [paddingBottomRight[0], paddingBottomRight[1] + 130];

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

  const polylines = [];

  Object.entries(memoizedRoutes).forEach(([day, features]) => {
    features.forEach((featureData, featIdx) => {
      const { geometry, properties, segments } = featureData;

      if (geometry.type !== "MultiLineString" || !segments) {
        return;
      }

      // When zoomed in, only show the currently highlighted route
      if (isZoomedIn && properties.day !== currentDay) {
        return;
      }

      const clickHandler = () => {
        if (properties.day === "20") return;
        dispatchLayerDetails(properties);
        setSingleDayView(true); // Switch to Single Day View on selection
        const allLatlngs = geometry.coordinates.flatMap((line) =>
          line.map((coord) => [coord[1], coord[0]]),
        );
        if (allLatlngs.length > 0) {
          const bounds = L.latLngBounds(allLatlngs);
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: zoomDuration,
          });
        }
      };

      // Render gradient segments (visible part)
      segments.forEach((segment, segIdx) => {
        let weight = isZoomedIn ? 4 : 2;

        // Apply 20% increase for desktop default lines
        if (isDesktop) {
          weight *= 1.2;
        }

        // Highlight logic: Only when zoomed out
        const isHighlighted =
          !isZoomedIn &&
          properties.day === currentDay &&
          currentDay !== "0" &&
          !isCurrentDayRestDay;

        if (isHighlighted) {
          weight = isDesktop ? 8.4 : 7; // Maintain the 20% increase for active path too
        }

        polylines.push(
          <Polyline
            key={day + "-" + featIdx + "-" + segIdx}
            positions={segment.latlngs}
            color={segment.color}
            weight={weight}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
            smoothFactor={isZoomedIn ? 0 : isHighlighted ? 7 : 3}
            interactive={properties.day !== "20"}
            onmouseover={() => {
              if (properties.day !== "20") {
                dispatchLayerDetails(properties);
              }
            }}
            onclick={clickHandler}
          />,
        );
      });

      // Render invisible wider Polyline for easier clicking/tapping
      polylines.push(
        <Polyline
          key={"tap-target-" + day + "-" + featIdx}
          positions={geometry.coordinates.flatMap((line) =>
            line.map((coord) => [coord[1], coord[0]]),
          )}
          color="transparent"
          weight={25}
          opacity={0}
          interactive={properties.day !== "20"}
          onmouseover={() => {
            if (properties.day !== "20") {
              dispatchLayerDetails(properties);
            }
          }}
          onclick={clickHandler}
        />,
      );
    });
  });

  return polylines;
};

const mapStateToProps = (state) => ({
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  currentDay: state.route.day,
  zoom: state.mapState.zoom,
  derivedZoom: state.mapState.zoom, // Will be overridden by MapContainer
  isSingleDayView: state.mapState.isSingleDayView,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(GeoJsonRoutes));
