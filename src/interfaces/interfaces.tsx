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

export interface IMapProps {
  url: string;
  attribution: string;
  center: [number, number];
  zoom: number;
  zoomSnap: number;
  hoverColor: string;
  markerZoom: number;
  style: { height: string; width: string };
  zoomDuration: number;
  topLeftPadding: [number, number];
  bottomRightPadding: [number, number];
}
