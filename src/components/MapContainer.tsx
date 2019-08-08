import React from "react";
import * as L from "leaflet";
import Dashboard from "./Dashboard";
import Legend from "./Legend";
import Polylines from "./Polylines";
import Reset from "./Reset";
import { Map, TileLayer, DivOverlay, Polyline, GeoJSON } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { getDayWiseDataG } from "../utils/geoJson";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";
import { IDay, IMapProps, IMarker } from "../interfaces/interfaces";
import { getDefaultDayDetails, getDefaultMapState } from "../utils/config";

interface IState {
  map: IMapProps;
  dayProps: IDay;
}

class MapContainer extends React.Component<any, IState> {
  // public mapRef: any;

  public constructor(props: any) {
    super(props);
    this.state = {
      map: getDefaultMapState(),
      dayProps: getDefaultDayDetails()
    };
    // this.mapRef = React.createRef();
    this.addPolylines = this.addPolylines.bind(this);
    this.polylineMouseoverHandler = this.polylineMouseoverHandler.bind(this);
    // this.plotMarkers = this.plotMarkers.bind(this);
    // this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    // this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
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

  // public plotGeoJsonRoutes = () => {
  //   const that = this;
  //   const lookup = this.state.map;
  //   const routes = getDayWiseDataG();
  //   Object.values(routes).forEach((route: any) => {
  //     const color = route.features[0].properties.color || "#3288FF";
  //     const geoJsonLayer = L.geoJSON(route, { style: { color } })
  //       .on("mouseover", (e: any) => {
  //         e.target.setStyle({ color: lookup.hoverColor });
  //         that.setState({ dayProps: e.layer.feature.properties });
  //       })
  //       .on("mouseout", e => e.target.setStyle({ color }))
  //       .on("click", e => {
  //         that.mapRef.current.leafletElement.flyToBounds(
  //           e.target.getBounds(),
  //           {
  //             paddingTopLeft: lookup.topLeftPadding,
  //             paddingBottomRight: lookup.bottomRightPadding
  //           },
  //           { duration: lookup.zoomDuration }
  //         );
  //       });
  //     this.mapRef.current.leafletElement.addLayer(geoJsonLayer);
  //   });
  // };

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
            onmouseover={this.polylineMouseoverHandler}
          />
        );
      }
    });
    return arr;
  };

  public polylineMouseoverHandler = (e: any) => {
    const lookup = this.state.map;
    e.target.setStyle({ color: lookup.hoverColor });
    this.setState({ dayProps: e.layer.feature.properties });
  };

  componentDidMount() {
    // this.plotMarkers();
    // this.plotGeoJsonRoutes();
    // this.plotPolylineRoutes();
    this.addPolylines();
  }

  render() {
    return (
      <Map
        center={this.state.map.center}
        zoomSnap={this.state.map.zoomSnap}
        zoom={this.state.map.zoom}
        style={this.state.map.style}
        // ref={this.mapRef}
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
        <Legend mapHandle={this.mapRef} />
        <Dashboard mapHandle={this.mapRef} day={this.state.dayProps} /> */}
        <Polylines
          hoverColor={this.state.map.hoverColor}
          zoomDuration={this.state.map.zoomDuration}
          topLeftPadding={this.state.map.topLeftPadding}
          bottomRightPadding={this.state.map.bottomRightPadding}
        />
      </Map>
    );
  }
}

export default MapContainer;
