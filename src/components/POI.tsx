import React from "react";
import * as L from "leaflet";
import { MapControl, Marker, withLeaflet } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { Dispatch } from "redux";
import { connect } from "react-redux";

class POI extends MapControl<any, any> {
  public createLeafletElement(props: any) {}

  public addPOIs = () => {
    const markerData = getMarkers();
    const arr: any = [];
    markerData.forEach((markerPoint: any) => {
      arr.push(
        <Marker
          position={markerPoint.point}
          style={markerPoint.properties}
          key={markerPoint.point.toString()}
          onclick={this.clickhandler}
          onmouseover={this.mouseoverHandler}
          icon={L.icon({
            iconUrl: markerPoint.icon,
            iconSize: markerPoint.size
          })}
          properties={markerPoint.properties}
        />
      );
    });
    return arr;
  };

  public clickhandler = (e: any) => {
    const { map } = this.props.leaflet;
    map.flyTo(
      e.latlng,
      this.props.markerZoom,
      {
        paddingTopLeft: this.props.topLeftPadding,
        paddingBottomRight: this.props.bottomRightPadding
      },
      { duration: this.props.zoomDuration }
    );
  };

  public mouseoverHandler = (e: any) =>
    this.props.dispatchLayerDetails(e.target.options.properties);

  componentDidMount() {
    this.addPOIs();
  }

  render() {
    return this.addPOIs();
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
  markerZoom: state.mapState.markerZoom
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(POI));
