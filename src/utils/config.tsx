import { IMapProps } from "../interfaces/interfaces";

const getDefaultMapState = (): IMapProps => {
  return {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    center: [27.840457443855108, 86.76420972837559],
    zoom: 11.4,
    zoomSnap: 0.1,
    hoverColor: "#1EBBD7",
    markerZoom: 16,
    style: { height: "100vh", width: "100%" },
    zoomDuration: 0.5,
    topLeftPadding: [0, 50],
    bottomRightPadding: [0, 150]
  };
};

const getDefaultDayDetails = () => {
  return {
    day: "0",
    name: "Fly from Kathmandu to Lukla",
    time: "0h 00m",
    distance: "0 mi / 0 km",
    start_alt: "0",
    end_alt: "0",
    peak_alt: ""
  };
};

export { getDefaultDayDetails, getDefaultMapState };
