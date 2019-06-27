import React from "react";
import * as L from "leaflet";
import { Map, TileLayer } from "react-leaflet";
import { getDayWiseData } from "./utils/config";
import decodePolyline from "decode-google-map-polyline";
import "./App.css";

class App extends React.Component<any, any> {
  public leafletMap = null;

  componentDidMount() {
    const days = [1, 2, 4, 5, 6, 9, 12, 14];
    days.forEach(day => {
      const day1 = getDayWiseData(day.toString());
      if (day) {
        const polyLine = L.polyline(decodePolyline(day1));
        (this.leafletMap as any).leafletElement.addLayer(polyLine);
      }
      // (this.leafletMap as any).leafletElement.fitBounds(polyLine.getBounds());
    });
  }

  render() {
    return (
      <div className="App">
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
      </div>
    );
  }
}

export default App;
