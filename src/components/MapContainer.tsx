import React from "react";
import * as L from "leaflet";
import Dashboard from "./Dashboard";
import Legend from "./Legend";
import Reset from "./Reset";
import { Map, TileLayer } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { getDayWiseDataG } from "../utils/geoJson";
import { getDayWiseDataP } from "../utils/polylines";
import decodePolyline from "decode-google-map-polyline";

class MapContainer extends React.Component<any, any> {
  public mapRef: any;

  public constructor(props: any) {
    super(props);
    this.state = {
      map: {
        center: [27.840457443855108, 86.76420972837559],
        zoom: 11.4,
        zoomSnap: 0.1
      },
      dayProps: {
        day: "0",
        name: "Fly from Kathmandu to Lukla",
        time: "0h 00m",
        distance: "0 mi / 0 km",
        start_alt: "0",
        end_alt: "0",
        peak_alt: ""
      }
    };
    this.mapRef = React.createRef();
    this.plotMarkers = this.plotMarkers.bind(this);
    this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
  }

  public plotMarkers = () => {
    const that = this;
    const markerData = getMarkers();
    markerData.forEach((markerPoint: any) => {
      const marker = L.marker(markerPoint.point, {
        icon: L.icon({
          iconUrl: markerPoint.icon,
          iconSize: markerPoint.size
        })
      }).addTo(this.mapRef.current.leafletElement);
      marker.feature = markerPoint.properties;
      marker
        .on("click", function(e: any) {
          that.mapRef.current.leafletElement.flyTo(e.latlng, 16, {
            duration: 0.5
          });
          that.setState({ dayProps: e.target.feature });
        })
        .on("mouseover", function(e: any) {
          that.setState({ dayProps: e.target.feature });
        });
    });
  };

  public plotPolylineRoutes = () => {
    const that = this;
    const routes = getDayWiseDataP();
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day].route);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = routes[day].properties;
        const color = polyLine.properties.color || "#3288FF";
        const layer = new L.GeoJSON(polyLine, { style: { color } })
          .on("mouseover", function(e: any) {
            const hovered = e.target;
            hovered.setStyle({ color: "#1EBBD7" });
            that.setState({ dayProps: e.layer.feature.properties });
          })
          .on("mouseout", function(e: any) {
            const hovered = e.target;
            hovered.setStyle({ color });
          })
          .on("click", function(e: any) {
            that.mapRef.current.leafletElement.flyToBounds(
              e.target.getBounds(),
              { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] },
              { duration: 0.5 }
            );
          });
        this.mapRef.current.leafletElement.addLayer(layer);
      }
    });
  };

  public plotGeoJsonRoutes = () => {
    const that = this;
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      const color = route.features[0].properties.color || "#3288FF";
      const geoJsonLayer = L.geoJSON(route, { style: { color } })
        .on("mouseover", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color: "#1EBBD7" });
          that.setState({ dayProps: e.layer.feature.properties });
        })
        .on("mouseout", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color });
        })
        .on("click", function(e: any) {
          that.mapRef.current.leafletElement.flyToBounds(
            e.target.getBounds(),
            { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] },
            { duration: 0.5 }
          );
        });
      this.mapRef.current.leafletElement.addLayer(geoJsonLayer);
    });
  };

  componentDidMount() {
    this.plotMarkers();
    this.plotGeoJsonRoutes();
    this.plotPolylineRoutes();
  }

  render() {
    return (
      <Map
        center={this.state.map.center}
        zoomSnap={this.state.map.zoomSnap}
        zoom={this.state.map.zoom}
        style={{ height: "100vh", width: "100%" }}
        ref={this.mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Reset
          mapHandle={this.mapRef}
          center={this.state.map.center}
          zoom={this.state.map.zoom}
        />
        <Legend mapHandle={this.mapRef} />
        <Dashboard mapHandle={this.mapRef} day={this.state.dayProps} />
      </Map>
    );
  }
}

export default MapContainer;
