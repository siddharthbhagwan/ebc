import { getStretch1Data } from "./config";
import * as L from "leaflet";
import decodePolyline from "decode-google-map-polyline";

const getStretch1 = () => {
  const phase1 = getStretch1Data();
  return phase1.map(phase => decodePolyline(phase));
};

export { getStretch1 };
