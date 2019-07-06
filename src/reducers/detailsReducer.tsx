const initialState = {
  day: "0",
  name: "Fly from Kathmandu to Lukla",
  time: "0h 00m",
  distance: "0 mi / 0 km",
  start_alt: "0",
  end_alt: "0",
  peak_alt: ""
};

export const detailsReducer = (state = initialState, action: any) => {
  console.log(action);
  switch (action.type) {
    case "UPDATE_LAYER_DETAILS":
      return {
        ...state,
        day: action.payload.layerDetails.day,
        distance: action.payload.layerDetails.distance,
        name: action.payload.layerDetails.name,
        time: action.payload.layerDetails.time,
        start_alt: action.payload.layerDetails.start_alt,
        end_alt: action.payload.layerDetails.end_alt,
        peak_alt: action.payload.layerDetails.peak_alt
      };

    default:
      return state;
  }
};
