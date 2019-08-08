import React from "react";
import * as L from "leaflet";
import { GeoJSON } from "react-leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import decodePolyline from "decode-google-map-polyline";
import { Dispatch } from "redux";
import { connect } from "react-redux";

class GeoJsonRoutes extends React.Component<any, any> {
  public constructor(props: any) {
    super(props);
    this.clickhandler = this.clickhandler.bind(this);
    this.mouseoutHandler = this.mouseoutHandler.bind(this);
    this.mouseoverHandler = this.mouseoverHandler.bind(this);
    this.addGeoJsonRoutes = this.addGeoJsonRoutes.bind(this);
  }

  public addGeoJsonRoutes = () => {
    const that = this;
    const arr: any = [];
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      arr.push(
        <GeoJSON
          data={route}
          style={route.features[0].properties}
          key={route.features[0].properties.day}
          onclick={this.clickhandler}
          onmouseout={this.mouseoutHandler}
          onmouseover={this.mouseoverHandler}
        />
      );
    });
    return arr;
  };

  public clickhandler = (e: any) => {
    e.target._map.flyToBounds(
      e.target.getBounds(),
      {
        paddingTopLeft: this.props.topLeftPadding,
        paddingBottomRight: this.props.bottomRightPadding
      },
      { duration: this.props.zoomDuration }
    );
  };

  public mouseoverHandler = (e: any) => {
    e.target.setStyle({ color: this.props.hoverColor });
    this.props.dispatchLayerDetails(e.layer.feature.properties);
  };

  public mouseoutHandler = (e: any) =>
    e.target.setStyle({ color: e.layer.feature.properties.color });

  componentDidMount() {
    this.addGeoJsonRoutes();
  }

  render() {
    return this.addGeoJsonRoutes();
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    dispatchLayerDetails: (layerDetails: any) => {
      dispatch({
        payload: { layerDetails },
        type: "UPDATE_LAYER_DETAILS"
      });
    }
  };
};

export default connect(
  null,
  mapDispatchToProps
)(GeoJsonRoutes);
