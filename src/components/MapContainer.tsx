import React from "react";
import * as L from "leaflet";
import Legend from "./Legend";
import { Map, TileLayer } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { getDayWiseDataG } from "../utils/geoJson";
import { getDayWiseDataP } from "../utils/polylines";
import * as Data from "../utils/data";
import decodePolyline from "decode-google-map-polyline";
import resetIcon from "../resources/images/map.svg";
import "leaflet-easybutton";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  public constructor(props: any) {
    super(props);
    this.state = {
      dashboard: null,
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
    this.plotMarkers = this.plotMarkers.bind(this);
    this.addDashboard = this.addDashboard.bind(this);
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
      }).addTo((this.leafletMap as any).leafletElement);
      marker.feature = markerPoint.properties;
      marker
        .on("click", function(e: any) {
          (that.leafletMap as any).leafletElement.flyTo(e.latlng, 16, {
            duration: 0.5
          });
          that.state.dashboard.update(e.target.feature);
        })
        .on("mouseover", function(e: any) {
          that.state.dashboard.update(e.target.feature);
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
            that.state.dashboard.update(e.layer.feature.properties);
          })
          .on("mouseout", function(e: any) {
            const hovered = e.target;
            hovered.setStyle({ color });
          })
          .on("click", function(e: any) {
            (that.leafletMap as any).leafletElement.flyToBounds(
              e.target.getBounds(),
              { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] },
              { duration: 0.5 }
            );
          });
        (this.leafletMap as any).leafletElement.addLayer(layer);
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
          that.state.dashboard.update(e.layer.feature.properties);
        })
        .on("mouseout", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color });
        })
        .on("click", function(e: any) {
          (that.leafletMap as any).leafletElement.flyToBounds(
            e.target.getBounds(),
            { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] },
            { duration: 0.5 }
          );
        });
      (this.leafletMap as any).leafletElement.addLayer(geoJsonLayer);
    });
  };

  public addDashboard = () => {
    const that = this;

    // @ts-ignore
    const dashboard = L.control({ position: "topright" });

    dashboard.onAdd = function() {
      this._div = L.DomUtil.create("div", "dashboard");
      this.update();
      return this._div;
    };

    dashboard.update = function(dayProps: any = that.state.dayProps) {
      this._div.innerHTML = Data.getDashboardHtml(dayProps);
    };

    dashboard.addTo((this.leafletMap as any).leafletElement);
    this.setState({ dashboard });
  };

  addResetButton = () => {
    L.easyButton(`<img src="${resetIcon}" width="15px">`, function(btn, map) {
      map.flyTo([27.840457443855108, 86.76420972837559], 11.4, {
        duration: 0.5
      });
    }).addTo((this.leafletMap as any).leafletElement);
  };

  componentDidMount() {
    this.addDashboard();
    this.plotMarkers();
    this.plotGeoJsonRoutes();
    this.plotPolylineRoutes();
    this.addResetButton();
  }

  render() {
    return (
      <Map
        center={[27.840457443855108, 86.76420972837559]}
        zoomSnap={0.1}
        zoom={11.4}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef => ((this.leafletMap as any) = mapRef)}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Legend mapHandle={this.leafletMap as any} />
      </Map>
    );
  }
}

export default MapContainer;
