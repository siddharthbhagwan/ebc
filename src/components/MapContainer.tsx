import React from "react";
import * as L from "leaflet";
import { Map, TileLayer } from "react-leaflet";
import * as Data from "../utils/data";
import decodePolyline from "decode-google-map-polyline";
import "leaflet-easybutton";
import resetIcon from "../resources/images/map.svg";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  public constructor(props: any) {
    super(props);
    this.state = { dashboard: null };
    this.addLegend = this.addLegend.bind(this);
    this.plotMarkers = this.plotMarkers.bind(this);
    this.addDashboard = this.addDashboard.bind(this);
    this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
  }

  public plotMarkers = () => {
    const that = this;
    const markerData = Data.getMarkers();
    markerData.forEach((markerPoint: any) => {
      const marker = L.marker(markerPoint.point, {
        icon: L.icon({
          iconUrl: markerPoint.icon,
          iconSize: markerPoint.size
        })
      }).addTo((this.leafletMap as any).leafletElement);
      marker.feature = markerPoint.properties;
      marker.on("click", function(e: any) {
        (that.leafletMap as any).leafletElement.flyTo(e.latlng, 16, {
          duration: 0.5
        });
        that.state.dashboard.update(e.target.feature);
      });
    });
  };

  public plotPolylineRoutes = () => {
    const that = this;
    const routes = Data.getDayWiseDataP();
    const properties: any = Data.getPolyLineProperties();
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day]);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties = properties[day];
        const color = polyLine.properties.color || "#3288FF";
        const layer = new L.GeoJSON(polyLine, { style: { color } });
        (this.leafletMap as any).leafletElement.addLayer(layer);
        layer
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
            (that.leafletMap as any).leafletElement.fitBounds(
              e.target.getBounds(),
              { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] }
            );
          });
      }
    });
  };

  public plotGeoJsonRoutes = () => {
    const that = this;
    const routes = Data.getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      const color = route.features[0].properties.color || "#3288FF";
      const geoJsonLayer = L.geoJSON(route, { style: { color } });
      (this.leafletMap as any).leafletElement.addLayer(geoJsonLayer);
      geoJsonLayer
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
          (that.leafletMap as any).leafletElement.fitBounds(
            e.target.getBounds(),
            { paddingTopLeft: [0, 50], paddingBottomRight: [0, 150] }
          );
        });
    });
  };

  public addLegend = () => {
    // @ts-ignore
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function() {
      this._div = L.DomUtil.create("div", "legend");
      this._div.innerHTML = Data.getLegendHtml();
      return this._div;
    };

    legend.addTo((this.leafletMap as any).leafletElement);
  };

  public addDashboard = () => {
    // @ts-ignore
    const dashboard = L.control({ position: "topright" });

    dashboard.onAdd = function() {
      this._div = L.DomUtil.create("div", "dashboard");
      this.update();
      return this._div;
    };

    dashboard.update = function(
      props: any = {
        day: "0",
        name: "Fly from Kathmandu to Lukla",
        time: "0h 00m",
        distance: "0 mi / 0 km",
        start_alt: "0",
        end_alt: "0",
        peak_alt: ""
      }
    ) {
      this._div.innerHTML = Data.getDashboardHtml(props);
    };

    dashboard.addTo((this.leafletMap as any).leafletElement);
    this.setState({ dashboard });
  };

  addResetButton = () => {
    L.easyButton(`<img src="${resetIcon}" width="15px">`, function(btn, map) {
      map.flyTo([27.833588687119132, 86.76737845989464], 11.4, {
        duration: 0.5
      });
    }).addTo((this.leafletMap as any).leafletElement);
  };

  componentDidMount() {
    this.addLegend();
    this.addDashboard();
    this.plotMarkers();
    this.plotGeoJsonRoutes();
    this.plotPolylineRoutes();
    this.addResetButton();
  }

  render() {
    return (
      <Map
        center={[27.833588687119132, 86.76737845989464]}
        zoomSnap={0.1}
        zoom={11.4}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef => ((this.leafletMap as any) = mapRef)}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      </Map>
    );
  }
}

export default MapContainer;
