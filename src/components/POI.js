import React from "react";
import * as L from "leaflet";
import { Marker, withLeaflet } from "react-leaflet";
import { getMarkers } from "../utils/markers";
import { connect } from "react-redux";
import { mapDispatchToProps } from "../utils/utils.js";

const POI = (props) => {
	const {
		markerZoom,
		zoomDuration,
		paddingTopLeft,
		paddingBottomRight,
		dispatchLayerDetails,
	} = props;
	const { map } = props.leaflet;

	const addPOIs = () => {
		const markerData = getMarkers();
		const arr = [];
		markerData.forEach((markerPoint) => {
			arr.push(
				<Marker
					position={markerPoint.point}
					style={markerPoint.properties}
					key={markerPoint.point.toString()}
					onclick={clickHandler}
					onmouseover={mouseoverHandler}
					icon={L.icon({
						iconUrl: markerPoint.icon,
						iconSize: markerPoint.size,
					})}
					properties={markerPoint.properties}
				/>
			);
		});
		return arr;
	};

	const clickHandler = (e) => {
		map.flyTo(
			e.latlng,
			markerZoom,
			{
				paddingTopLeft,
				paddingBottomRight,
			},
			{ duration: zoomDuration }
		);
	};

	const mouseoverHandler = (e) =>
		dispatchLayerDetails(e.target.options.properties);

	return addPOIs();
};

const mapStateToProps = (state) => ({
	markerZoom: state.mapState.markerZoom,
	zoomDuration: state.mapState.zoomDuration,
	paddingTopLeft: state.mapState.paddingTopLeft,
	paddingBottomRight: state.mapState.paddingBottomRight,
});

export default connect(mapStateToProps, mapDispatchToProps)(withLeaflet(POI));
