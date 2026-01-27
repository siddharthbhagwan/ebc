import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import legendIcon from "../resources/images/legend.svg";
import locationIcon from "../resources/images/location.svg";
import Control from "react-leaflet-control";
import { useMobileOrientation, isDesktop } from "react-device-detect";
import "leaflet-easybutton";

const ZOOM_MOBILE = 10.4;
const ZOOM_LANDSCAPE = 10;

const Reset = (props) => {
  const { center, zoom, setLegend } = props;
  const { map } = props.leaflet;

  const { isLandscape = false } = useMobileOrientation();
  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const resetZoom = () => {
    const mobileOffset = 0.022;
    const desktopOffset = 0.008;
    const currentOffset = isDesktop ? desktopOffset : mobileOffset;
    const initialCenter = [center[0] - currentOffset, center[1]];
    map.flyTo(initialCenter, derivedZoom, { duration: 0.5 });
  };

  const toggleLegend = () => setLegend((legend) => !legend);

  const mapButton = (
    <img
      width={"34px"}
      src={locationIcon}
      className={"icon"}
      onClick={resetZoom}
      alt="Reset Zoom"
    />
  );

  const legendButton = (
    <img
      width={"34px"}
      src={legendIcon}
      className={"icon"}
      onClick={toggleLegend}
      alt="Toggle Legend"
    />
  );

  return (
    <>
      <Control position="topleft">
        <div style={{ backgroundColor: "white" }}>{mapButton}</div>
      </Control>
      <Control position="topright">
        <div style={{ backgroundColor: "white" }}>{legendButton}</div>
      </Control>
    </>
  );
};

const mapStateToProps = (state) => ({
  zoom: state.mapState.zoom,
  center: state.mapState.center,
});

export default connect(mapStateToProps)(withLeaflet(Reset));
