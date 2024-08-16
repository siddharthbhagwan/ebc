import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import "../resources/css/dashboard.css";

const Dashboard = (props) => {
  const { peakAlt, startAlt, endAlt, distance, time, icon } = props;

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
    <Control position={"bottomright"}>
      <div className={"dashboard"}>
        <h5>EBC 3 Pass Trek, Nepal</h5>
        <br />
        <div className={"dashboardDetails"}>
          <div>
            <span>
              <img src={icon} width={"25px"} />{" "}
            </span>
            <span>Day {props.day}</span>
          </div>
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
  icon: state.route.icon,
  endAlt: state.route.endAlt,
  peakAlt: state.route.peakAlt,
  startAlt: state.route.startAlt,
  distance: state.route.distance,
});

export default connect(mapStateToProps)(withLeaflet(Dashboard));
