import React from "react";
import ReactGA from "react-ga4";
import MapContainer from "./components/MapContainer";

class App extends React.Component {
  render() {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <MapContainer />
      </div>
    );
  }
}

export default App;
