export const mapDispatchToProps = (dispatch) => ({
	dispatchLayerDetails: (layerDetails) => {
		dispatch({
			payload: { layerDetails },
			type: "UPDATE_LAYER_DETAILS",
		});
	},
	toggleLegend: () => {
		dispatch({
			type: "TOGGLE_LEGEND",
		});
	},
	toggleInfo: () => {
		dispatch({
			type: "TOGGLE_INFO",
		});
	},
});
