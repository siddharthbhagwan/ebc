export const mapDispatchToProps = (dispatch) => ({
	dispatchLayerDetails: (layerDetails) => {
		dispatch({
			payload: { layerDetails },
			type: "UPDATE_LAYER_DETAILS",
		});
	},
});
