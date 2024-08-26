import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import { isDesktop, isMobile, useMobileOrientation } from "react-device-detect";
import arrowIcon from "../resources/images/leftArrow.svg";

import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";

const Dashboard = (props) => {
  const {
    dispatchLayerDetails,
    peakAlt = null,
    startAlt = null,
    endAlt = null,
    distance,
    time,
    day,
    // icon,
  } = props;

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();
  const position = isDesktop ? "bottomright" : "topright";

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  const NextArrow = (
    <img
      src={arrowIcon}
      width={"30px"}
      className="rightIcon navIcon"
      onClick={() => nextDay()}
    />
  );

  const PrevArrow = (
    <span onClick={() => prevDay()} className="navIcon">
      <img src={arrowIcon} width={"30px"} />
    </span>
  );

  const NavigationLine = (
    <div className="dashboardHeader">
      {PrevArrow}
      {/* Base Camp */}
      EBC 3 Pass Trek, Nepal
      <span className="desc" style={{ fontWeight: "bold" }}>
        Day {props.day}
      </span>
      {NextArrow}
    </div>
  );

  return (
    <Control position={position}>
      <div className={"dashboard"}>
        {isMobile && !isLandscape ? NavigationLine : null}

        <div
          className={"dashboardDetails container"}
          style={{
            fontSize: isMobile ? 15 : 17,
            justifyContent:
              isPlace && !isLandscape
                ? "center"
                : isMobile && isLandscape
                ? "space-between"
                : "space-evenly",
            alignItems: "center",
            padding: 10,
            width: isDesktop ? 360 : isLandscape ? "110vw" : 280,
          }}
        >
          {isMobile && isLandscape ? (
            <>
              {PrevArrow}
              <span className="desc" style={{ fontWeight: "bold" }}>
                Day {props.day}
              </span>
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

          {isMobile && isLandscape ? NextArrow : null}
        </div>

        {isDesktop ? NavigationLine : null}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(Dashboard));
