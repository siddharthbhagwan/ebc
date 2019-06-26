import React from "react";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <Map
        center={[27.933489, 86.713486]}
        zoom={11}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[-0.09, 51.505]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </Map>
    </div>
  );
};

export default App;
