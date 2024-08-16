import React from "react";
import { withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
import legendIcon from "../resources/images/legend.svg";
import locationIcon from "../resources/images/location.svg";
import Control from "react-leaflet-control";
import { useMobileOrientation, isDesktop } from "react-device-detect";
import "leaflet-easybutton";

const ZOOM_MOBILE = 10.7;
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

  const resetZoom = () => map.flyTo(center, derivedZoom, { duration: 0.5 });

  const toggleLegend = () => setLegend((legend) => !legend);

  const mapButton = (
    <img
      width={"34px"}
      src={locationIcon}
      className={"icon"}
      onClick={resetZoom}
    />
  );

  const legendButton = (
    <img
      width={"34px"}
      src={legendIcon}
      className={"icon"}
      onClick={toggleLegend}
    />
  );

  return (
    <Control position="topleft">
      <div style={{ marginBottom: 3, backgroundColor: "white" }}>
        {mapButton}
      </div>
      <div style={{ backgroundColor: "white" }}>{legendButton}</div>
    </Control>
  );
};

const mapStateToProps = (state) => ({
  zoom: state.mapState.zoom,
  center: state.mapState.center,
});

export default connect(mapStateToProps)(withLeaflet(Reset));
