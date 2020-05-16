import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import "../resources/css/dashboard.css";

const Dashboard = (props) => {
	const { peakAlt, startAlt, endAlt, distance, time } = props;

	const getStartAlt = (startAlt) => (startAlt ? `${startAlt} ft` : "");
	const getPeakAlt = (peakAlt) => (peakAlt ? ` - ${peakAlt} ft` : "");
	const getEndAlt = (endAlt) => (endAlt ? ` - ${endAlt} ft` : "");
	const getTimeDist = (props) => {
		if (distance && time)
			return (
				<div>
					{distance}
					<br />
					{time}
				</div>
			);

		return "";
	};

	return (
		<Control position={"topright"}>
			<div className={"dashboard"}>
				<h5>EBC 3 Pass Trek, Nepal</h5>
				<br />
				<div class="dashboardDetails">
					<div>Day {props.day}</div>
					<br />
					<div>
						<span>{props.name}</span>
						<br />
						{getStartAlt(startAlt)}
						{getPeakAlt(peakAlt)}
						{getEndAlt(endAlt)}
						<br />
					</div>
					<br />
					{getTimeDist(props)}
				</div>
			</div>
		</Control>
	);
};

const mapStateToProps = (state) => ({
	day: state.route.day,
	name: state.route.name,
	time: state.route.time,
	endAlt: state.route.endAlt,
	distance: state.route.distance,
	peakAlt: state.route.peakAlt,
	startAlt: state.route.startAlt,
});

export default connect(mapStateToProps)(withLeaflet(Dashboard));
