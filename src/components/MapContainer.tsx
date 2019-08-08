import React from "react";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import POI from "./POI";
import Polylines from "./Polylines";
// import Reset from "./Reset";
import { Map, TileLayer, DivOverlay } from "react-leaflet";
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

  // public plotMarkers = () => {
  //   const that = this;
  //   const lookup = this.state.map;
  //   const markerData = getMarkers();

  //   markerData.forEach((markerPoint: IMarker) => {
  //     const marker = L.marker(markerPoint.point, {
  //       icon: L.icon({
  //         iconUrl: markerPoint.icon,
  //         iconSize: markerPoint.size
  //       })
  //     })
  //       .on("mouseover", e => that.setState({ dayProps: e.target.feature }))
  //       .on("click", (e: any) => {
  //         that.mapRef.current.leafletElement.flyTo(
  //           e.latlng,
  //           lookup.markerZoom,
  //           { duration: lookup.zoomDuration }
  //         );
  //         that.setState({ dayProps: e.target.feature });
  //       });

  //     // @ts-ignore
  //     marker.feature = markerPoint.properties;
  //     this.mapRef.current.leafletElement.addLayer(marker);
  //   });
  // };

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
        {/* <Reset
          mapHandle={this.mapRef}
          center={this.state.map.center}
          zoom={this.state.map.zoom}
        />
         */}
        <Dashboard />
        <Legend />
        <Polylines
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
