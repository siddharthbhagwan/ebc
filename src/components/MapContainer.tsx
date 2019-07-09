import React from "react";
import * as L from "leaflet";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Map, TileLayer } from "react-leaflet";
import * as Data from "../utils/data";
import decodePolyline from "decode-google-map-polyline";
import "../resources/css/legend.css";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  public constructor(props: any) {
    super(props);
    this.addLegend = this.addLegend.bind(this);
    this.plotMarkers = this.plotMarkers.bind(this);
    this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
  }

  public plotMarkers = () => {
    const markers = Data.getMarkers();
    markers.forEach((marker: any) => {
      L.marker(marker.point, {
        icon: L.icon({
          iconUrl: marker.icon,
          iconSize: marker.size
        })
      }).addTo((this.leafletMap as any).leafletElement);
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
            that.props.dispatchLayerDetails(e.layer.feature.properties);
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
          that.props.dispatchLayerDetails(e.layer.feature.properties);
        })
        .on("mouseout", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color });
        })
        .on("click", function(e: any) {
          // e.target.efireEvent
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

  componentDidMount() {
    this.addLegend();
    this.plotMarkers();
    this.plotGeoJsonRoutes();
    this.plotPolylineRoutes();
  }

  render() {
    return (
      <Map
        center={[27.816795860382836, 86.76689146300015]}
        zoomSnap={0.1}
        zoom={11.1}
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatchLayerDetails: (layerDetails: any) => {
    dispatch({
      payload: { layerDetails },
      type: "UPDATE_LAYER_DETAILS"
    });
  }
});

export default connect(
  null,
  mapDispatchToProps
)(MapContainer);
