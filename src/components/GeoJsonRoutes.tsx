import React from "react";
import { MapControl, GeoJSON, withLeaflet } from "react-leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { Dispatch } from "redux";
import { connect } from "react-redux";

class GeoJsonRoutes extends MapControl<any, any> {
  public createLeafletElement(props: any) {}

  public addGeoJsonRoutes = () => {
    const geoJsonArr: any = [];
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      geoJsonArr.push(
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
    return geoJsonArr;
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

const mapStateToProps = (state: any) => ({
  hoverColor: state.mapState.hoverColor,
  zoomDuration: state.mapState.zoomDuration,
  topLeftPadding: state.mapState.topLeftPadding,
  bottomRightPadding: state.mapState.bottomRightPadding
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(GeoJsonRoutes));
