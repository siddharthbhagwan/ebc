import { LatLngExpression } from "leaflet";

export interface IMarker {
  point: LatLngExpression;
  icon: string;
  size: [number, number];
  properties?: {
    day: String;
    name: String;
    start_alt: String;
  };
}

export interface IDay {
  day: string;
  name: string;
  time: string;
  distance: string;
  start_alt: string;
  end_alt: string;
  peak_alt: string;
}
