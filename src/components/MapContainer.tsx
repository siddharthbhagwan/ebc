import React from "react";
import * as L from "leaflet";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import { Map, TileLayer } from "react-leaflet";
import { getDayWiseData } from "../utils/config";
import decodePolyline from "decode-google-map-polyline";

class MapContainer extends React.Component<any, any> {
  public leafletMap = null;

  componentDidMount() {
    const that = this;
    const days = [1, 2, 4, 5, 6, 9, 12, 14];
    days.forEach(day => {
      const daywiseData = getDayWiseData(day.toString());
      if (daywiseData) {
        const decodedData = decodePolyline(daywiseData);
        const polyLine = L.polyline(decodedData).toGeoJSON();
        polyLine.properties.day = day;
        const layer = new L.GeoJSON(polyLine);
        (this.leafletMap as any).leafletElement.addLayer(layer);
        layer.on("mouseover", function(e: any) {
          that.props.dispatchLayerDetails(e.layer.feature.properties);
        });
      }
      // (this.leafletMap as any).leafletElement.fitBounds(polyLine.getBounds());
    });
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
