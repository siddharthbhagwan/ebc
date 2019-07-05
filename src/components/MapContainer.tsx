import React from "react";
import * as L from "leaflet";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Map, TileLayer } from "react-leaflet";
import * as Data from "../utils/data";
import decodePolyline from "decode-google-map-polyline";
import tentIcon from "../resources/images/tent.png";
import summitIcon from "../resources/images/summit.png";
import airportIcon from "../resources/images/airport.png";
import passIcon from "../resources/images/pass.png";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  public constructor(props: any) {
    super(props);
    this.plotHalts = this.plotHalts.bind(this);
    this.plotPasses = this.plotPasses.bind(this);
    this.plotSummits = this.plotSummits.bind(this);
    this.plotMiscellaneous = this.plotMiscellaneous.bind(this);
    this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
  }

  public plotHalts = () => {
    const halts = Data.getHalts();
    halts.forEach((halt: any) => {
      L.marker(halt, {
        icon: L.icon({
          iconUrl: tentIcon,
          iconSize: [22, 22]
        })
      }).addTo((this.leafletMap as any).leafletElement);
    });
  };

  public plotSummits = () => {
    const summits = Data.getSummits();
    summits.forEach((summit: any) => {
      L.marker(summit, {
        icon: L.icon({
          iconUrl: summitIcon,
          iconSize: [22, 22]
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
        const layer = new L.GeoJSON(polyLine);
        (this.leafletMap as any).leafletElement.addLayer(layer);
        layer
          .on("mouseover", function(e: any) {
            const hovered = e.target;
            hovered.setStyle({ color: "#666" });
            that.props.dispatchLayerDetails(e.layer.feature.properties);
          })
          .on("mouseout", function(e: any) {
            const hovered = e.target;
            hovered.setStyle({ color: "#2c7dff" });
          })
          .on("click", function(e: any) {
            (that.leafletMap as any).leafletElement.fitBounds(
              layer.getBounds()
            );
          });
      }
    });
  };

  public plotGeoJsonRoutes = () => {
    const that = this;
    const routes = Data.getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      const geoJsonLayer = L.geoJSON(route);
      (this.leafletMap as any).leafletElement.addLayer(geoJsonLayer);
      geoJsonLayer
        .on("mouseover", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color: "#666" });
          that.props.dispatchLayerDetails(e.layer.feature.properties);
        })
        .on("mouseout", function(e: any) {
          const hovered = e.target;
          hovered.setStyle({ color: "#2c7dff" });
        })
        .on("click", function(e: any) {
          (that.leafletMap as any).leafletElement.fitBounds(
            geoJsonLayer.getBounds()
          );
        });
    });
  };

  public plotPasses = () => {
    const passes = Data.getPasses();
    passes.forEach((pass: any) => {
      L.marker(pass, {
        icon: L.icon({
          iconUrl: passIcon,
          iconSize: [22, 22]
        })
      }).addTo((this.leafletMap as any).leafletElement);
    });
  };

  public plotMiscellaneous = () => {
    const airport: any = Data.getAirport();
    L.marker(airport, {
      icon: L.icon({
        iconUrl: airportIcon,
        iconSize: [22, 22]
      })
    }).addTo((this.leafletMap as any).leafletElement);
  };

  componentDidMount() {
    this.plotHalts();
    this.plotPasses();
    this.plotSummits();
    this.plotMiscellaneous();
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
