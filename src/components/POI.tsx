import React from "react";
import * as L from "leaflet";
import { Marker } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { Dispatch } from "redux";
import { connect } from "react-redux";

class POI extends React.Component<any, any> {
  public constructor(props: any) {
    super(props);
    this.addPOIs = this.addPOIs.bind(this);
    this.mouseoutHandler = this.mouseoutHandler.bind(this);
    this.mouseoverHandler = this.mouseoverHandler.bind(this);
  }

  public addPOIs = () => {
    const markerData = getMarkers();
    const arr: any = [];
    markerData.forEach((markerPoint: any) => {
      console.log(markerPoint);
      arr.push(
        <Marker
          position={markerPoint.point}
          style={markerPoint.properties}
          key={markerPoint.point.toString()}
          onclick={this.clickhandler}
          onmouseout={this.mouseoutHandler}
          onmouseover={this.mouseoverHandler}
          icon={L.icon({
            iconUrl: markerPoint.icon,
            iconSize: markerPoint.size
          })}
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

export default connect(
  null,
  mapDispatchToProps
)(POI);
