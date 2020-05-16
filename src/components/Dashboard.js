import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import "../resources/css/dashboard.css";

const Dashboard = (props) => {
	const { peak_alt, start_alt, end_alt, distance, time } = props;

	const getStartAlt = (start_alt) => (start_alt ? `${start_alt} ft` : "");
	const getPeakAlt = (peak_alt) => (peak_alt ? ` - ${peak_alt} ft` : "");
	const getEndAlt = (end_alt) => (end_alt ? ` - ${end_alt} ft` : "");
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
						{getStartAlt(start_alt)}
						{getPeakAlt(peak_alt)}
						{getEndAlt(end_alt)}
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
	end_alt: state.route.end_alt,
	distance: state.route.distance,
	peak_alt: state.route.peak_alt,
	start_alt: state.route.start_alt,
});

export default connect(mapStateToProps)(withLeaflet(Dashboard));
