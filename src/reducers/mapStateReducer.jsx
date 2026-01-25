const initialState = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> | <a href="https://leafletjs.com/">Leaflet</a>',
  center: [27.840457443855108, 86.76420972837559],
  zoom: 11.3,
  zoomSnap: 0.1,
  hoverColor: "#1EBBD7",
  markerZoom: 14.5,
  style: { height: "100%", width: "100%" },
  zoomDuration: 1.25,
  paddingTopLeft: [50, 110],
  paddingBottomRight: [50, 50],
  showLegend: true, // Visible by default
  showInfo: false,
  unit: "km",
  isSingleDayView: false,
};

export const mapStateReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_SINGLE_DAY_VIEW":
      return {
        ...state,
        isSingleDayView: action.payload,
      };
    case "UPDATE_ZOOMs":
      return {
        ...state,
        zoom: action.payload.mapState.zoom,
      };
    case "TOGGLE_UNIT":
      return {
        ...state,
        unit: state.unit === "km" ? "mi" : "km",
      };
    case "TOGGLE_LEGEND":
      return {
        ...state,
        showLegend: !state.showLegend,
      };
    case "TOGGLE_INFO":
      return {
        ...state,
        showInfo: !state.showInfo,
      };

    default:
      return state;
  }
};
