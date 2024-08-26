import React, { useEffect } from "react";
import { GeoJSON, withLeaflet } from "react-leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { connect } from "react-redux";
import { mapDispatchToProps } from "../utils/utils.js";

const routes = getDayWiseDataG();

const GeoJsonRoutes = (props) => {
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
    //   console.log(routes[day]);
    //   const bbox = routes[day].features[0].geometry.bbox;
    //   map.fitBounds(bbox);
    // }
  }, [day]);

  const geoJsonArr = [];

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

  const mouseoutHandler = (e) =>
    e.target.setStyle({ color: e.layer.feature.properties.color, weight: 3 });

  const getStyle = (style) => {
    const updatedStyle = { ...style };
    if (day === style.day) {
      updatedStyle.color = hoverColor;
      updatedStyle.weight = 4;
    }
    return updatedStyle;
  };

  Object.values(routes).forEach((route) => {
    const style = route.features[0].properties;

    geoJsonArr.push(
      <GeoJSON
        data={route}
        style={() => getStyle(style)}
        key={route.features[0].properties.day}
        onclick={clickhandler}
      />
    );
  });

  return geoJsonArr;
};

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
)(withLeaflet(GeoJsonRoutes));
