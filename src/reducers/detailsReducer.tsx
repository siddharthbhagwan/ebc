const initialState = { day: "" };

export const detailsReducer = (state = initialState, action: any) => {
  console.log(action);
  switch (action.type) {
    case "UPDATE_LAYER_DETAILS":
      return {
        ...state,
        day: action.payload.layerDetails.day
      };

    default:
      return state;
  }
};
