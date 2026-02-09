const initialState = {
  icon: "",
  day: "0",
  name: "Everest Base Camp 3 Pass Trek",
  time: "",
  distance: "",
  startAlt: "",
  endAlt: "",
  peakAlt: "",
  total_climb: "",
  descent: "",
};

export const routeReducer = (state = initialState, action) => {
  switch (action.type) {
    case "UPDATE_LAYER_DETAILS":
      return {
        ...state,
        day: action.payload.layerDetails.day,
        icon: action.payload.layerDetails.icon,
        name: action.payload.layerDetails.name,
        time: action.payload.layerDetails.time,
        endAlt: action.payload.layerDetails.endAlt,
        peakAlt: action.payload.layerDetails.peakAlt,
        startAlt: action.payload.layerDetails.startAlt,
        distance: action.payload.layerDetails.distance,
        total_climb: action.payload.layerDetails.total_climb,
        descent: action.payload.layerDetails.descent,
      };

    default:
      return state;
  }
};
