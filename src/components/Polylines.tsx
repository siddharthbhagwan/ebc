import React from "react";
import * as L from "leaflet";
import { GeoJSON } from "react-leaflet";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";

class MapContainer extends React.Component<any, any> {
  public constructor(props: any) {
    super(props);
    this.addPolylines = this.addPolylines.bind(this);
    this.mouseoutHandler = this.mouseoutHandler.bind(this);
    this.mouseoverHandler = this.mouseoverHandler.bind(this);
  }

  public addPolylines = () => {
    const routes = getDayWiseDataP();
    const arr: any = [];
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day].route);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = routes[day].properties;
        arr.push(
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
    // this.setState({ dayProps: e.layer.feature.properties });
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

export default MapContainer;
