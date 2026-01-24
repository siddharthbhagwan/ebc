import React, { useState } from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import Control from "react-leaflet-control";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import arrowIcon from "../resources/images/leftArrow.svg";
import locationIcon from "../resources/images/location.svg";
import toolsIcon from "../resources/images/map.svg";
import legendIcon from "../resources/images/legend.svg";
import infoIcon from "../resources/images/info.svg";

import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";
import useDays from "../hooks/useDays";

const ZOOM_MOBILE = 10.7;
const ZOOM_LANDSCAPE = 10;

const Dashboard = (props) => {
  const {
    dispatchLayerDetails,
    toggleLegend,
    toggleInfo,
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

  const [isToolsOpen, setIsToolsOpen] = useState(false);

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

  const resetZoom = () => {
    let targetCenter = center;
    if (!isDesktop) {
      // Move center south by an additional 20px for mobile layout
      const pixelCenter = map.project(center, derivedZoom);
      // Adding pixels to Y moves the view relative to the center (moves map content up, view center down)
      const newPixelCenter = [pixelCenter.x, pixelCenter.y + 20];
      targetCenter = map.unproject(newPixelCenter, derivedZoom);
    }
    map.flyTo(targetCenter, derivedZoom, { duration: 0.5 });
  };
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  const ControlIcons = (
    <div style={{ display: "grid", gridTemplateColumns: "26px 26px", gap: "2px", padding: "0 2px" }}>
      {/* Col 1: Zoom group */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <div 
          className="icon" 
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
          style={{ padding: "0", background: "white", borderRadius: "4px 4px 0 0", border: "1px solid #ddd", width: "100%", height: "28px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "16px", color: "#2c3e50" }}
        >+</div>
        <div 
          className="icon" 
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
          style={{ padding: "0", background: "white", borderRadius: "0 0 4px 4px", border: "1px solid #ddd", borderTop: "none", width: "100%", height: "28px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "16px", color: "#2c3e50" }}
        >-</div>
      </div>
      {/* Col 2: Reset & Tools */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <img
          src={locationIcon}
          width={"100%"}
          className="icon"
          onClick={(e) => { e.stopPropagation(); resetZoom(); }}
          alt="Reset"
          style={{ padding: "4px", background: "white", borderRadius: "4px 4px 0 0", border: "1px solid #ddd", height: "28px", boxSizing: "border-box", cursor: "pointer" }}
        />
        <img
          src={toolsIcon}
          width={"100%"}
          className="icon"
          onClick={(e) => { 
            e.stopPropagation(); 
            setIsToolsOpen(prev => !prev); 
          }}
          alt="Tools"
          style={{ padding: "4px", background: "white", borderRadius: "0 0 4px 4px", border: "1px solid #ddd", borderTop: "none", height: "28px", boxSizing: "border-box", cursor: "pointer" }}
        />
      </div>
    </div>
  );

  return (
    <Control position={position}>
      <div 
        className="dashboard" 
        style={{ 
          width: isDesktop ? "380px" : "100vw", 
          margin: isDesktop ? "0 10px 10px 10px" : "0",
          marginBottom: isDesktop ? "10px" : "env(safe-area-inset-bottom)",
          borderRadius: isDesktop ? "5px" : "0",
          height: "92px", 
          pointerEvents: "auto", 
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Top Section: Main content row */}
        <div style={{ display: "flex", flex: 1, width: "100%", alignItems: "stretch", overflow: "hidden" }}>
          {/* Left Arrow Slab */}
          <div 
            onClick={() => prevDay()}
            style={{ display: "flex", alignItems: "center", padding: "0 6px", borderRight: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e9e9e9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
          >
            <img
              src={arrowIcon}
              width={"24px"}
              className="leftIcon"
              alt="Previous"
              style={{ opacity: 0.8 }}
            />
          </div>

          {isToolsOpen ? (
            /* Tools View */
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", background: "#fff", position: "relative" }}>
              <div style={{ flex: 1, display: "flex", gap: "10px", alignItems: "center" }}>
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleLegend(); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "8px" }}
                >
                  <img
                    src={legendIcon}
                    width={"28px"}
                    alt="Toggle Legend"
                    style={{ padding: "4px", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #eee" }}
                  />
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleInfo(); }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "8px" }}
                >
                  <img
                    src={infoIcon}
                    width={"28px"}
                    alt="Toggle Info"
                    style={{ padding: "4px", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #eee" }}
                  />
                </div>
              </div>
              
              {/* Close Button */}
              <div 
                onClick={(e) => { e.stopPropagation(); setIsToolsOpen(false); }}
                style={{ cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center", color: "#7f8c8d", fontWeight: "bold", fontSize: "16px", border: "1px solid #eee" }}>✕</div>
              </div>
            </div>
          ) : (
            /* Central Content (Metrics) */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "5px 12px", minWidth: 0, justifyContent: "space-between", background: "white" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Trek Name (Top Line) */}
                <div style={{ width: "100%", overflow: "hidden", display: "flex" }}>
                  <div 
                    title={props.name}
                    style={{ fontWeight: "700", fontSize: "14px", color: "#2c3e50", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left", lineHeight: "1.1", flex: 1, minWidth: 0 }}
                  >
                    {props.name}
                  </div>
                </div>

                {/* Day & Elevations Row (Second Line) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "1px" }}>
                  <span style={{ fontWeight: "800", fontSize: "14px", color: "#34495e", flexShrink: 0 }}>Day {props.day}</span>
                  {!isPlace ? (
                    <div style={{ fontSize: "13px", color: "#2c3e50", fontWeight: "bold", letterSpacing: "0.05px", textAlign: "right" }}>
                      {startAlt ? `${startAlt}ft` : ""}
                      {peakAlt ? ` → ${peakAlt}ft` : ""}
                      {endAlt ? ` → ${endAlt}ft` : ""}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Stats Row (Bottom Section) */}
              {!isPlace && distance && time ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", borderTop: "1px solid #f2f2f2", paddingTop: "3px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase" }}>Dist</span>
                    <span style={{ fontSize: "12px", color: "#2c3e50", fontWeight: "700" }}>{distance.split("/")[1]}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", color: "#95a5a6", fontWeight: "700", textTransform: "uppercase" }}>Time</span>
                    <span style={{ fontSize: "12px", color: "#2c3e50", fontWeight: "700" }}>{time}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Right Side: Toolbar and Next Arrow (Slab) */}
          <div style={{ display: "flex", alignItems: "stretch" }}>
            {/* Toolbar Area */}
            <div 
              style={{ padding: "0 2px", borderLeft: "1px solid #eee", display: "flex", alignItems: "center", background: "white" }}
              onClick={(e) => e.stopPropagation()} // Prevent triggering parent or slab clicks
            >
              {ControlIcons}
            </div>

            {/* Right Arrow Slab */}
            <div 
              onClick={() => nextDay()}
              style={{ display: "flex", alignItems: "center", padding: "0 6px", borderLeft: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e9e9e9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
            >
              <img
                src={arrowIcon}
                width={"24px"}
                className="rightIcon"
                alt="Next"
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
        </div>

        {/* Static Branding Strip (Constant at the bottom) */}
        <div style={{ 
          height: "20px",
          background: "white", 
          borderTop: "1px solid #f2f2f2",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: "100%"
        }}>
          <div style={{ 
            fontSize: "9px", 
            color: "#bdc3c7", 
            fontWeight: "900", 
            textTransform: "uppercase", 
            letterSpacing: "1.5px" 
          }}>
            Everest Base Camp 3 Pass Trek, Nepal
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
