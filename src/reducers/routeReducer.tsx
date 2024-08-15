const initialState = {
  icon: "",
  day: "0",
  name: "Kathmandu - Lukla",
  time: "0h 00m",
  distance: "0 mi / 0 km",
  startAlt: "0",
  endAlt: "0",
  peakAlt: "0",
};

export const routeReducer = (state = initialState, action: any) => {
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
      };

    default:
      return state;
  }
};
