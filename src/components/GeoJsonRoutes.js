import React from 'react';
import { GeoJSON, withLeaflet } from 'react-leaflet';
import { getDayWiseDataG } from '../utils/geoJson';
import { connect } from 'react-redux';
import { mapDispatchToProps } from '../utils/utils.js';

const GeoJsonRoutes = (props) => {
	const { map } = props.leaflet;
	const {
		hoverColor,
		zoomDuration,
		paddingTopLeft,
		paddingBottomRight,
		dispatchLayerDetails,
	} = props;

	const addGeoJsonRoutes = () => {
		const geoJsonArr = [];
		const routes = getDayWiseDataG();
		Object.values(routes).forEach((route) => {
			geoJsonArr.push(
				<GeoJSON
					data={route}
					style={route.features[0].properties}
					key={route.features[0].properties.day}
					onclick={clickhandler}
					onmouseout={mouseoutHandler}
					onmouseover={mouseoverHandler}
					onEachFeature={handleEachFeature}
				/>
			);
		});

		return geoJsonArr;
	};

	const handleEachFeature = (feature, layer) => {
		// console.log(feature, layer);
	};

	const clickhandler = (e) => {
		map.flyToBounds(
			e.target.getBounds(),
			{
				paddingTopLeft,
				paddingBottomRight,
			},
			{ duration: zoomDuration }
		);
	};

	const mouseoverHandler = (e) => {
		e.target.setStyle({ color: hoverColor, weight: 4 });
		dispatchLayerDetails(e.layer.feature.properties);
	};

	const mouseoutHandler = (e) =>
		e.target.setStyle({ color: e.layer.feature.properties.color, weight: 3 });

	return addGeoJsonRoutes();
};

const mapStateToProps = (state) => ({
	hoverColor: state.mapState.hoverColor,
	zoomDuration: state.mapState.zoomDuration,
	paddingTopLeft: state.mapState.paddingTopLeft,
	paddingBottomRight: state.mapState.paddingBottomRight,
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withLeaflet(GeoJsonRoutes));
