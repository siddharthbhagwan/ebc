import React from "react";
import * as L from "leaflet";
import { GeoJSON, withLeaflet } from "react-leaflet";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";
import { connect } from "react-redux";

const TransparentPolylineRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    hoverColor,
    zoomDuration,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
  } = props;

  const addPolylines = () => {
    const routes = getDayWiseDataP();
    const polylineArr = [];
    Object.keys(routes).forEach((day) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day].route);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = routes[day].properties;
        polylineArr.push(
          <GeoJSON
            data={polyLine}
            style={{ color: "white", weight: 20, opacity: 0.35 }}
            key={polyLine.properties.day}
            onclick={clickhandler}
            onmouseout={mouseoutHandler}
            onmouseover={mouseoverHandler}
          />
        );
      }
    });
    return polylineArr;
  };

  const clickhandler = (e) => {
    map.flyToBounds(
      e.target.getBounds(),
      {
        paddingTopLeft,
        paddingBottomRight,
      },
      { duration: zoomDuration }
    );
  };

  const mouseoverHandler = (e) => {
    e.target.setStyle({ color: hoverColor, weight: 4 });
    dispatchLayerDetails(e.layer.feature.properties);
  };

  const mouseoutHandler = (e) => {
    e.target.setStyle({ color: e.layer.feature.properties.color, weight: 4 });
  };

  return addPolylines();
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
  hoverColor: state.mapState.hoverColor,
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(TransparentPolylineRoutes));
