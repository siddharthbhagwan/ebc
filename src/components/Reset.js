import React from 'react';
import { withLeaflet } from 'react-leaflet';
import { connect } from 'react-redux';
import resetIcon from '../resources/images/map.svg';
import legendIcon from '../resources/images/legend.svg';
import 'leaflet-easybutton';
import Control from 'react-leaflet-control';

const Reset = (props) => {
	const { center, zoom, setLegend } = props;
	const { map } = props.leaflet;

	const resetZoom = () => map.flyTo(center, zoom, { duration: 0.5 });

	const toggleLegend = () => setLegend((legend) => !legend);

	const mapButton = (
		<img
			width={'30px'}
			src={resetIcon}
			className={'icon'}
			onClick={resetZoom}
		/>
	);

	const legendButton = (
		<img
			width={'30px'}
			src={legendIcon}
			className={'icon'}
			onClick={toggleLegend}
		/>
	);

	return (
		<Control position="topleft">
			<div style={{ marginBottom: 3, backgroundColor: 'white' }}>
				{mapButton}
			</div>
			<div style={{ backgroundColor: 'white' }}>{legendButton}</div>
		</Control>
	);
};

const mapStateToProps = (state) => ({
	zoom: state.mapState.zoom,
	center: state.mapState.center,
});

export default connect(mapStateToProps)(withLeaflet(Reset));
