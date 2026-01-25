const initialState = {
  icon: "",
  day: "1",
  name: "Lukla - Phakding",
  time: "3h 30m",
  distance: "4.66 mi / 7.5 km",
  startAlt: "9,373",
  endAlt: "8,563",
  peakAlt: "",
  total_climb: "0",
  descent: "814",
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
