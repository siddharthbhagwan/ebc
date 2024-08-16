import React from "react";
import { withLeaflet } from "react-leaflet";
import { isMobile, isDesktop, useMobileOrientation } from "react-device-detect";
import Control from "react-leaflet-control";

import ebcIcon from "../resources/images/ebc.svg";
import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import passIcon from "../resources/images/pass.svg";
import "../resources/css/legend.css";

const DESKTOP_SIZE = "20px";
const MOBILE_SIZE = "15px";

const getSize = () => (isMobile ? MOBILE_SIZE : DESKTOP_SIZE);

const Legend = () => {
  const { isLandscape = false } = useMobileOrientation();

  return (
    <Control
      position={isDesktop || isLandscape ? "bottomright" : "topright"}
      style={{ marginTop: 0 }}
    >
      <div className={`legend ${isMobile ? "mapLegend-mobile" : ""}`}>
        <div className="legendItem">
          <img src={ebcIcon} width={MOBILE_SIZE} /> Base Camp
        </div>
        <div className="legendItem">
          <img src={summitIcon} width={getSize()} /> Summit <br />
        </div>
        <div className="legendItem">
          <img src={passIcon} width={getSize()} /> Pass
        </div>
        <div className="legendItem">
          <img src={tentIcon} width={MOBILE_SIZE} /> Lodging
        </div>
      </div>
    </Control>
  );
};

export default withLeaflet(Legend);
