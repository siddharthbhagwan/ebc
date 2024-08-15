import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import { isMobile } from "react-device-detect";
import "../resources/css/dashboard.css";

const Dashboard = (props) => {
  const {
    peakAlt = null,
    startAlt = null,
    endAlt = null,
    distance,
    time,
    icon,
  } = props;

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const position = isMobile ? "topright" : "bottomright";

  return (
    <Control position={position}>
      <div className={"dashboard"}>
        <span style={{ fontSize: 13, textAlign: "left" }}>
          EBC 3 Pass Trek, Nepal{" "}
        </span>

        {/* Day */}
        <span className="desc" style={{ fontWeight: "bold" }}>
          Day {props.day}
        </span>

        {!isMobile ? <br /> : null}
        <div
          className={"dashboardDetails container"}
          style={{
            fontSize: isMobile ? 15 : 17,
            justifyContent: isPlace ? "center" : "space-evenly",
            maxWidth: isMobile ? "320px" : "auto",
            alignItems: "center",
          }}
        >
          {!isPlace && distance && time ? (
            <div
              className={!isPlace ? "" : "column-30"}
              style={{
                flexDirection: isMobile ? "row" : "column",
                display: "flex",
              }}
            >
              {/* Time */}
              <div className="item">{distance.split("/")[1]}</div>
              <div className="item">{time}</div>
            </div>
          ) : null}

          <div
            className="column"
            style={{
              justifyContent: isPlace ? "center" : "space-evenly",
            }}
          >
            {/* Place */}
            <div style={{ textAlign: "center" }} className="item">
              {props.name}
            </div>
            {/* Alt Details */}
            {!isPlace ? (
              <div className="">
                {startAlt ? `${startAlt} ft` : ""}
                {peakAlt ? ` - ${peakAlt} ft` : ""}
                {endAlt ? ` - ${endAlt} ft` : ""}
              </div>
            ) : null}
          </div>
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
