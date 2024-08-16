import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import { isDesktop, isMobile, useMobileOrientation } from "react-device-detect";
import "../resources/css/dashboard.css";

const Dashboard = (props) => {
  const {
    peakAlt = null,
    startAlt = null,
    endAlt = null,
    distance,
    time,
    // icon,
  } = props;

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();
  const position = isDesktop ? "bottomright" : "topright";

  const day = (
    <>
      {/* Day */}
      <span className="desc" style={{ fontWeight: "bold" }}>
        Day {props.day}
      </span>
    </>
  );

  return (
    <Control position={position}>
      <div className={"dashboard"}>
        {!isLandscape ? (
          <>
            <span style={{ fontSize: 13, textAlign: "left" }}>
              EBC 3 Pass Trek, Nepal{" "}
            </span>
          </>
        ) : null}

        {!isMobile ? <br /> : null}
        <div
          className={"dashboardDetails container"}
          style={{
            fontSize: isMobile ? 14 : 17,
            justifyContent: isPlace ? "center" : "space-evenly",
            alignItems: "center",
            width: isDesktop ? 330 : isLandscape ? "100vw" : 280,
          }}
        >
          {isLandscape ? (
            <>
              {/* Day */}
              {/* {day} */}
            </>
          ) : null}

          {!isPlace && distance && time ? (
            <span
              className={!isPlace ? "" : "column-30"}
              style={{
                flexDirection: isMobile ? "row" : "column",
                display: "contents",
              }}
            >
              {/* Time */}
              <span className="item">{distance.split("/")[1]}</span>
              <span className="item">{time}</span>
            </span>
          ) : null}

          {/* Place */}
          <span style={{ textAlign: "center" }} className="item">
            {props.name}
          </span>
          {/* Alt Details */}
          {!isPlace ? (
            <span className="">
              {startAlt ? `${startAlt} ft` : ""}
              {peakAlt ? ` - ${peakAlt} ft` : ""}
              {endAlt ? ` - ${endAlt} ft` : ""}
            </span>
          ) : null}
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
