import { isDesktop, isMobile, useMobileOrientation } from "react-device-detect";

const CENTER_DESKTOP = 27.840457443855108;
const CENTER_MOBILE = 27.875457443855108;
const x = isMobile ? CENTER_MOBILE : CENTER_DESKTOP;

const initialState = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution: '<a href="http://osm.org/copyright">OpenStreetMap</a>',
  center: [x, 86.76420972837559],
  zoom: 11.4,
  zoomSnap: 0.1,
  hoverColor: "#1EBBD7",
  markerZoom: 10.7,
  style: { height: "100vh", width: "100%" },
  zoomDuration: 0.5,
  paddingTopLeft: [50, 70],
  paddingBottomRight: [30, 0],
};

export const mapStateReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "UPDATE_ZOOMs":
      return {
        ...state,
        zoom: action.payload.mapState.zoom,
      };

    default:
      return state;
  }
};
