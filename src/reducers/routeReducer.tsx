const initialState = {
	day: "0",
	name: "Fly from Kathmandu to Lukla",
	time: "0h 00m",
	distance: "0 mi / 0 km",
	startAlt: "0",
	endAlt: "0",
	peakAlt: "",
};

export const routeReducer = (state = initialState, action: any) => {
	switch (action.type) {
		case "UPDATE_LAYER_DETAILS":
			return {
				...state,
				day: action.payload.layerDetails.day,
				distance: action.payload.layerDetails.distance,
				name: action.payload.layerDetails.name,
				time: action.payload.layerDetails.time,
				startAlt: action.payload.layerDetails.startAlt,
				endAlt: action.payload.layerDetails.endAlt,
				peakAlt: action.payload.layerDetails.peakAlt,
			};

		default:
			return state;
	}
};
