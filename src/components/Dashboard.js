import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import arrowIcon from "../resources/images/leftArrow.svg";
import locationIcon from "../resources/images/location.svg";

import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";

const ZOOM_MOBILE = 10.7;
const ZOOM_LANDSCAPE = 10;

const Dashboard = (props) => {
  const {
    dispatchLayerDetails,
    peakAlt = null,
    startAlt = null,
    endAlt = null,
    distance,
    time,
    day,
    center,
    zoom,
  } = props;
  const { map } = props.leaflet;

  //  no altitude data
  const isPlace = startAlt === "0" && endAlt === "0";
  const { isLandscape = false } = useMobileOrientation();
  const position = isDesktop ? "bottomright" : "bottomright";

  const { nextDay, prevDay } = useDays(day, dispatchLayerDetails);

  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const resetZoom = () => map.flyTo(center, derivedZoom, { duration: 0.5 });
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  const ControlIcons = (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", padding: "0 2px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <div 
          className="icon" 
          onClick={zoomIn} 
          style={{ padding: "0", background: "white", borderRadius: "4px 4px 0 0", border: "1px solid #ddd", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "16px", color: "#2c3e50" }}
        >+</div>
        <div 
          className="icon" 
          onClick={zoomOut} 
          style={{ padding: "0", background: "white", borderRadius: "0 0 4px 4px", border: "1px solid #ddd", borderTop: "none", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "16px", color: "#2c3e50" }}
        >-</div>
      </div>
      <img
        src={locationIcon}
        width={"24px"}
        className="icon"
        onClick={resetZoom}
        alt="Reset"
        style={{ padding: "4px", background: "white", borderRadius: "4px", border: "1px solid #ddd", height: "24px" }}
      />
    </div>
  );

  const NextArrow = (
    <span onClick={() => nextDay()} className="navIcon" style={{ display: "flex", alignItems: "center" }}>
      <img
        src={arrowIcon}
        width={"24px"}
        className="rightIcon"
        alt="Next"
      />
    </span>
  );

  const PrevArrow = (
    <span onClick={() => prevDay()} className="navIcon" style={{ display: "flex", alignItems: "center" }}>
      <img src={arrowIcon} width={"24px"} alt="Previous" />
    </span>
  );

  return (
    <Control position={position}>
      <div
        className={"dashboard"}
        style={{
          display: "flex",
          flexDirection: "column",
          width: isDesktop ? 360 : "100vw",
          height: isDesktop ? "100px" : "100px",
          margin: isDesktop ? "0" : "0 -10px -10px -10px",
          background: "white",
          zIndex: 1000,
          borderRadius: isDesktop ? "8px" : "0",
          boxShadow: isDesktop ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
          border: isDesktop ? "1px solid #ddd" : "none",
          borderTop: isDesktop ? "1px solid #ddd" : "1px solid #eee",
          boxSizing: "border-box",
          overflow: "hidden"
        }}
      >
        {/* Combined Main Row: Sidebar & Compact Content between Arrows */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "4px", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "32px", background: "#fcfcfc" }}>
            {ControlIcons}
          </div>
          
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", background: "white" }}>
            {PrevArrow}
            
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 15px", minWidth: 0 }}>
              {/* Trek Name (Top Line) */}
              <div style={{ width: "100%", overflow: "hidden", display: "flex" }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#2c3e50", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left", lineHeight: "1.2", flex: 1, minWidth: 0 }}>
                  {props.name}
                </div>
              </div>

              {/* Day & Elevations Row (Second Line) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "2px" }}>
                <span style={{ fontWeight: "800", fontSize: "13px", color: "#34495e", flexShrink: 0 }}>Day {props.day}</span>
                {!isPlace ? (
                  <div style={{ fontSize: "10px", color: "#7f8c8d", fontWeight: "500", letterSpacing: "0.2px", textAlign: "right" }}>
                    {startAlt ? `${startAlt}ft` : ""}
                    {peakAlt ? ` → ${peakAlt}ft` : ""}
                    {endAlt ? ` → ${endAlt}ft` : ""}
                  </div>
                ) : null}
              </div>

              {/* Stats Row */}
              {!isPlace && distance && time ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", borderTop: "1px solid #f0f0f0", paddingTop: "6px" }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "7px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase" }}>Dist</span>
                    <span style={{ fontSize: "10px", color: "#2c3e50", fontWeight: "600" }}>{distance.split("/")[1]}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "7px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase" }}>Time</span>
                    <span style={{ fontSize: "10px", color: "#2c3e50", fontWeight: "600" }}>{time}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {NextArrow}
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
  zoom: state.mapState.zoom,
  center: state.mapState.center,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(Dashboard));
