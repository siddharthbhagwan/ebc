import React from "react";
import MapContainer from "./components/MapContainer";
import Details from "./components/Details";
import "./App.css";

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Details />
        <MapContainer />
      </div>
    );
  }
}

export default App;
