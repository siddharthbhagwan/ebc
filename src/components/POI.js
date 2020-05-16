import React from "react";
import * as L from "leaflet";
import { connect } from "react-redux";
import "../resources/css/dashboard.css";
import { getMarkers } from "../utils/markers";
import { mapDispatchToProps } from "../utils/utils.js";
import { Marker, withLeaflet, Tooltip } from "react-leaflet";

const POI = (props) => {
	const { map } = props.leaflet;
	const {
		markerZoom,
		zoomDuration,
		paddingTopLeft,
		paddingBottomRight,
		dispatchLayerDetails,
	} = props;

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
				>
					<Tooltip
						permanent={true}
						className={"tooltipLabel"}
						direction={markerPoint.properties.direction}
						offset={markerPoint.properties.offset || [0, 0]}
					>
						<div>
							{markerPoint.properties.name}
							<br />
							<span>Day {markerPoint.properties.day}</span>
						</div>
					</Tooltip>
				</Marker>
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
