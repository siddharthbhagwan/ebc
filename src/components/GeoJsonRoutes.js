import React from "react";
import { Polyline, withLeaflet } from "react-leaflet";
import L from "leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { connect } from "react-redux";
import { mapDispatchToProps } from "../utils/utils.js";
import { createGradientSegments } from "../utils/heightGradient";

const GeoJsonRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    zoomDuration,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
  } = props;

  const polylineArr = [];
  const routes = getDayWiseDataG();

  if (!routes) {
    return null;
  }

  Object.values(routes).forEach((route) => {
    if (!route || !route.features || !route.features[0]) {
      return;
    }

    const feature = route.features[0];
    if (
      !feature ||
      !feature.geometry ||
      feature.geometry.type !== "MultiLineString"
    ) {
      return;
    }

    const { geometry, properties } = feature;
    const segments = createGradientSegments(geometry.coordinates);

    segments.forEach((segment, segIdx) => {
      polylineArr.push(
        <Polyline
          key={properties.day + "-" + segIdx}
          positions={segment.latlngs}
          color={segment.color}
          weight={3}
          opacity={0.8}
          lineCap="round"
          lineJoin="round"
          onmouseover={() => {
            dispatchLayerDetails(properties);
          }}
          onclick={() => {
            dispatchLayerDetails(properties);
            const allSegments = createGradientSegments(geometry.coordinates);
            const allLatlngs = allSegments.flatMap((s) => s.latlngs);
            if (allLatlngs.length > 0) {
              const bounds = L.latLngBounds(allLatlngs);
              map.flyToBounds(bounds, {
                paddingTopLeft,
                paddingBottomRight,
                duration: zoomDuration,
              });
            }
          }}
        />,
      );
    });
  });

  return polylineArr;
};

const mapStateToProps = (state) => ({
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withLeaflet(GeoJsonRoutes));
