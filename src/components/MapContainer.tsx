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
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution:
          '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        center: [27.840457443855108, 86.76420972837559],
        zoom: 11.4,
        zoomSnap: 0.1,
        hoverColor: "#1EBBD7",
        markerZoom: 16,
        style: { height: "100vh", width: "100%" },
        zoomDuration: 0.5,
        topLeftPadding: [0, 50],
        bottomRightPadding: [0, 150]
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
    const lookup = this.state.map;
    const markerData = getMarkers();

    markerData.forEach((markerPoint: any) => {
      const marker = L.marker(markerPoint.point, {
        icon: L.icon({
          iconUrl: markerPoint.icon,
          iconSize: markerPoint.size
        })
      })
        .on("mouseover", e => that.setState({ dayProps: e.target.feature }))
        .on("click", (e: any) => {
          that.mapRef.current.leafletElement.flyTo(
            e.latlng,
            lookup.markerZoom,
            { duration: lookup.zoomDuration }
          );
          that.setState({ dayProps: e.target.feature });
        });

      marker.feature = markerPoint.properties;
      this.mapRef.current.leafletElement.addLayer(marker);
    });
  };

  public plotPolylineRoutes = () => {
    const that = this;
    const lookup = this.state.map;
    const routes = getDayWiseDataP();
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day].route);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = routes[day].properties;
        const color = polyLine.properties.color || "#3288FF";
        const layer = new L.GeoJSON(polyLine, { style: { color } })
          .on("mouseover", (e: any) => {
            e.target.setStyle({ color: lookup.hoverColor });
            that.setState({ dayProps: e.layer.feature.properties });
          })
          .on("mouseout", e => e.target.setStyle({ color }))
          .on("click", e => {
            that.mapRef.current.leafletElement.flyToBounds(
              e.target.getBounds(),
              {
                paddingTopLeft: lookup.topLeftPadding,
                paddingBottomRight: lookup.bottomRightPadding
              },
              { duration: lookup.zoomDuration }
            );
          });
        this.mapRef.current.leafletElement.addLayer(layer);
      }
    });
  };

  public plotGeoJsonRoutes = () => {
    const that = this;
    const lookup = this.state.map;
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      const color = route.features[0].properties.color || "#3288FF";
      const geoJsonLayer = L.geoJSON(route, { style: { color } })
        .on("mouseover", (e: any) => {
          e.target.setStyle({ color: lookup.hoverColor });
          that.setState({ dayProps: e.layer.feature.properties });
        })
        .on("mouseout", e => e.target.setStyle({ color }))
        .on("click", e => {
          that.mapRef.current.leafletElement.flyToBounds(
            e.target.getBounds(),
            {
              paddingTopLeft: lookup.topLeftPadding,
              paddingBottomRight: lookup.bottomRightPadding
            },
            { duration: lookup.zoomDuration }
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
        style={this.state.map.style}
        ref={this.mapRef}
      >
        <TileLayer
          url={this.state.map.url}
          attribution={this.state.map.attribution}
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
