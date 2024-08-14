import React from "react";
import ReactGA from "react-ga4";
import MapContainer from "./components/MapContainer";

ReactGA.initialize("G-0D6NC98JBF", {
  gaOptions: {
    debug_mode: true,
  },
  gtagOptions: {
    debug_mode: true,
  },
});

const App = () => {
  return (
    <div>
      <MapContainer />
    </div>
  );
};

export default App;
