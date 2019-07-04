import React from "react";
import * as L from "leaflet";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Map, TileLayer } from "react-leaflet";
import {
  getDayWiseDataG,
  getDayWiseDataP,
  getHalts,
  getSummits
} from "../utils/data";
import decodePolyline from "decode-google-map-polyline";
import tentIcon from "../resources/images/tent.png";
import summitIcon from "../resources/images/summit.png";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  public constructor(props: any) {
    super(props);
    this.plotHalts = this.plotHalts.bind(this);
    this.plotSummits = this.plotSummits.bind(this);
    this.plotGeoJsonRoutes = this.plotGeoJsonRoutes.bind(this);
    this.plotPolylineRoutes = this.plotPolylineRoutes.bind(this);
  }

  public plotHalts = () => {
    const halts = getHalts();
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
    const summits = getSummits();
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
    const routes = getDayWiseDataP();
    Object.keys(routes).forEach((day: string) => {
      if (routes[day]) {
        const decodedData = decodePolyline(routes[day]);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties.day = day;
        const layer = new L.GeoJSON(polyLine);
        (this.leafletMap as any).leafletElement.addLayer(layer);
        layer.on("mouseover", function(e: any) {
          that.props.dispatchLayerDetails(e.layer.feature.properties);
        });
      }
    });
  };

  public plotGeoJsonRoutes = () => {
    const that = this;
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route: any) => {
      const geoJsonLayer = L.geoJSON(route);
      (this.leafletMap as any).leafletElement.addLayer(geoJsonLayer);
      geoJsonLayer.on("mouseover", function(e: any) {
        console.log(e);
        console.log(e.latlng);
        that.props.dispatchLayerDetails(e.layer.feature.properties);
      });
    });
  };

  componentDidMount() {
    this.plotHalts();
    this.plotSummits();
    this.plotGeoJsonRoutes();
    this.plotPolylineRoutes();
  }

  render() {
    return (
      <Map
        center={[27.933489, 86.713486]}
        zoom={11}
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
