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
  const position = isMobile ? "bottomright" : "bottomright";

  const getDistance = () => {
    if (distance && time)
      return (
        <>
          <div className="item">{distance.split("/")[1]}</div>
          <div className="">{time}</div>
        </>
      );

    return "";
  };

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
            alignItems: "center",
          }}
        >
          {!isPlace ? (
            <div class={!isPlace ? "" : "column column-30"}>
              {/* Time */}
              <div className="item">{getDistance(props)}</div>
            </div>
          ) : null}

          <div class="column">
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
