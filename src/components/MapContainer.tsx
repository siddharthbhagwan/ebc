import React from "react";
import * as L from "leaflet";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Map, TileLayer } from "react-leaflet";
import * as Data from "../utils/data";
import decodePolyline from "decode-google-map-polyline";

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
    const halts = Data.getHalts();
    halts.forEach((halt: any) => {
      L.marker(halt.point, {
        icon: L.icon({
          iconUrl: halt.icon,
          iconSize: [22, 22]
        })
      }).addTo((this.leafletMap as any).leafletElement);
    });
  };

  public plotSummits = () => {
    const summits = Data.getSummits();
    summits.forEach((summit: any) => {
      L.marker(summit.point, {
        icon: L.icon({
          iconUrl: summit.icon,
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
        const color = polyLine.properties.color || "#3288FF";
        const layer = new L.GeoJSON(polyLine, {
          style: { color }
        });
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
      const color = route.features[0].properties.color || "#3288FF";
      const geoJsonLayer = L.geoJSON(route, {
        style: { color }
      });
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
          (that.leafletMap as any).leafletElement.fitBounds(
            geoJsonLayer.getBounds()
          );
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
