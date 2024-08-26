import React, { useEffect } from "react";
import * as L from "leaflet";
import { GeoJSON, withLeaflet } from "react-leaflet";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";
import { connect } from "react-redux";

const routes = getDayWiseDataP();
const DAYS = Object.keys(routes);

const PolylineRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    day,
    hoverColor,
    zoomDuration,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
  } = props;

  useEffect(() => {
    // zoom into new route
    // if (routes[day]) {
    //   const decodedData = decodePolyline(routes[day].route);
    //   const bounds = L.latLngBounds(
    //     decodedData.map(({ lat, lng }) => L.latLng(lat, lng))
    //   );
    //   map.setView(bounds.getCenter(), 13.7);
    // }
  }, [day]);

  const polylineArr = [];

  const clickhandler = (e) => {
    map.flyToBounds(
      e.target.getBounds(),
      { paddingTopLeft, paddingBottomRight },
      { duration: zoomDuration }
    );
  };

  const mouseoverHandler = (e) => {
    e.target.setStyle({ color: hoverColor, weight: 4 });
    dispatchLayerDetails(e.layer.feature.properties);
  };

  const mouseoutHandler = (e) => {
    e.target.setStyle({ color: e.layer.feature.properties.color, weight: 3 });
  };

  const getStyle = (style) => {
    const updatedStyle = { ...style };
    if (day === style.day) updatedStyle.color = hoverColor;
    return updatedStyle;
  };

  Object.keys(routes).forEach((route) => {
    if (routes[route]) {
      const decodedData = decodePolyline(routes[route].route);
      const polyLine = L.polyline(decodedData).toGeoJSON();
      const style = routes[route].properties;

      polylineArr.push(
        <GeoJSON
          data={polyLine}
          style={() => getStyle(style)}
          key={polyLine.properties.day}
          onclick={clickhandler}
        />
      );
    }
  });

  return polylineArr;
};

const mapDispatchToProps = (dispatch) => ({
  dispatchLayerDetails: (layerDetails) => {
    dispatch({
      payload: { layerDetails },
      type: "UPDATE_LAYER_DETAILS",
    });
  },
});

const mapStateToProps = (state) => ({
  day: state.route.day,
  hoverColor: state.mapState.hoverColor,
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(PolylineRoutes));
