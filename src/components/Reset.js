import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import resetIcon from "../resources/images/map.svg";
import "leaflet-easybutton";
import Control from "react-leaflet-control";

const Reset = (props) => {
	const { center, zoom } = props;
	const { map } = props.leaflet;

	const resetZoom = () =>
		map.flyTo(center, zoom, {
			duration: 0.5,
		});

	return (
		<Control position="topleft">
			<img
				width={"30px"}
				src={resetIcon}
				className={"icon"}
				onClick={resetZoom}
			/>
		</Control>
	);
};

const mapStateToProps = (state) => ({
	zoom: state.mapState.zoom,
	center: state.mapState.center,
});

export default connect(mapStateToProps)(withLeaflet(Reset));
