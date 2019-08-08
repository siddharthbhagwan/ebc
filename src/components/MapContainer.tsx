import React from "react";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import POI from "./POI";
import PolylineRoutes from "./PolylineRoutes";
import Reset from "./Reset";
import { Map, TileLayer } from "react-leaflet";
import { IDay, IMapProps, IMarker } from "../interfaces/interfaces";
import { getDefaultDayDetails, getDefaultMapState } from "../utils/config";

interface IState {
  map: IMapProps;
  dayProps: IDay;
}

class MapContainer extends React.Component<any, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      map: getDefaultMapState(),
      dayProps: getDefaultDayDetails()
    };
  }

  render() {
    return (
      <Map
        center={this.state.map.center}
        zoomSnap={this.state.map.zoomSnap}
        zoom={this.state.map.zoom}
        style={this.state.map.style}
      >
        <TileLayer
          url={this.state.map.url}
          attribution={this.state.map.attribution}
        />
        <Reset center={this.state.map.center} zoom={this.state.map.zoom} />
        <Dashboard />
        <Legend />
        <PolylineRoutes
          hoverColor={this.state.map.hoverColor}
          zoomDuration={this.state.map.zoomDuration}
          topLeftPadding={this.state.map.topLeftPadding}
          bottomRightPadding={this.state.map.bottomRightPadding}
        />
        <GeoJsonRoutes
          hoverColor={this.state.map.hoverColor}
          zoomDuration={this.state.map.zoomDuration}
          topLeftPadding={this.state.map.topLeftPadding}
          bottomRightPadding={this.state.map.bottomRightPadding}
        />
        <POI />
      </Map>
    );
  }
}

export default MapContainer;
