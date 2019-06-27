import React from "react";
import * as L from "leaflet";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import { getStretch1 } from "./utils/data";
import "./App.css";

class App extends React.Component<any, any> {
  public leafletMap = null;

  componentDidMount() {
    const s1 = getStretch1();
    const layer = L.polyline(s1);
    (this.leafletMap as any).leafletElement.addLayer(layer);
    (this.leafletMap as any).leafletElement.fitBounds(layer.getBounds());
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
