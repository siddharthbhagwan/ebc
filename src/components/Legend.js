import React from "react";
import { withLeaflet } from "react-leaflet";
import { isMobile, isDesktop } from "react-device-detect";
import Control from "react-leaflet-control";

import ebcIcon from "../resources/images/ebc.svg";
import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import passIcon from "../resources/images/pass.svg";
import "../resources/css/legend.css";

const DESKTOP_SIZE = "20px";
const MOBILE_SIZE = "15px";

const getSize = () => (isMobile ? MOBILE_SIZE : DESKTOP_SIZE);

const Legend = (props) => {
  const { showLegend } = props;
  const position = isDesktop ? "bottomright" : "bottomright";

  return (
    <Control position={position}>
      <div
        className={"legend mapLegend-mobile"}
        style={{
          display: showLegend ? "flex" : "none",
          width: isDesktop ? 360 : "100vw",
          margin: isDesktop ? "" : "0 -10px -10px -10px",
          borderRadius: isDesktop ? "" : 0,
          boxSizing: "border-box",
        }}
      >
        <div className="legendItem">
          <img src={ebcIcon} width={MOBILE_SIZE} alt="Base Camp" /> Base Camp
        </div>
        <div className="legendItem">
          <img src={summitIcon} width={getSize()} alt="Summit" /> Summit <br />
        </div>
        <div className="legendItem">
          <img src={passIcon} width={getSize()} alt="Pass" /> Pass
        </div>
        <div className="legendItem">
          <img src={tentIcon} width={MOBILE_SIZE} alt="Lodging" /> Lodging
        </div>
      </div>
    </Control>
  );
};

export default withLeaflet(Legend);
