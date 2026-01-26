import React, { useEffect } from "react";
import ReactGA from "react-ga4";
import MapContainer from "./components/MapContainer";

ReactGA.initialize("G-0D6NC98JBF");

const App = () => {
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer />
    </div>
  );
};

export default App;
