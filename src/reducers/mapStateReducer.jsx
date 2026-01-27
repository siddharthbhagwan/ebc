import {
  loadPreferences,
  saveUnitPreference,
  saveLegendPreference,
} from "../utils/cookies";

// Load saved preferences from cookies
const savedPreferences = loadPreferences();

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
  showLegend: savedPreferences.showLegend, // Loaded from cookies, defaults to true
  showInfo: false,
  unit: savedPreferences.unit, // Loaded from cookies, defaults to "km"
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
    case "TOGGLE_UNIT": {
      const newUnit = state.unit === "km" ? "mi" : "km";
      saveUnitPreference(newUnit);
      return {
        ...state,
        unit: newUnit,
      };
    }
    case "TOGGLE_LEGEND": {
      const newShowLegend = !state.showLegend;
      saveLegendPreference(newShowLegend);
      return {
        ...state,
        showLegend: newShowLegend,
      };
    }
    case "TOGGLE_INFO":
      return {
        ...state,
        showInfo: !state.showInfo,
      };

    default:
      return state;
  }
};
