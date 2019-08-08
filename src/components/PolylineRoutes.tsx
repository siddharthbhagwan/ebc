import React from "react";
import * as L from "leaflet";
import { MapControl, GeoJSON, withLeaflet } from "react-leaflet";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";
import { Dispatch } from "redux";
import { connect } from "react-redux";

class PolylineRoutes extends MapControl<any, any> {
  public createLeafletElement(props: any) {}

  public addPolylines = () => {
    const routes = getDayWiseDataP();
    const polylineArr: any = [];
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day].route);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = routes[day].properties;
        polylineArr.push(
          <GeoJSON
            data={polyLine}
            style={polyLine.properties}
            key={polyLine.properties.day}
            onclick={this.clickhandler}
            onmouseout={this.mouseoutHandler}
            onmouseover={this.mouseoverHandler}
          />
        );
      }
    });
    return polylineArr;
  };

  public clickhandler = (e: any) => {
    const { map } = this.props.leaflet;
    map.flyToBounds(
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
    this.addPolylines();
  }

  render() {
    return this.addPolylines();
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

const mapStateToProps = (state: any) => ({
  hoverColor: state.mapState.hoverColor,
  zoomDuration: state.mapState.zoomDuration,
  topLeftPadding: state.mapState.topLeftPadding,
  bottomRightPadding: state.mapState.bottomRightPadding
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(PolylineRoutes));
