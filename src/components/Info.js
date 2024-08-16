import React, { useState } from "react";
import { withLeaflet } from "react-leaflet";
import Control from "react-leaflet-control";
import InfoIconSvg from "../resources/images/info.svg";
import "../resources/css/dashboard.css";

const Info = () => {
  const [hidden, setHidden] = useState(true);
  const toggleInfo = () => setHidden(!hidden);

  return (
    <>
      <Control position={"bottomleft"} className={"icon infoIcon"}>
        <div>
          <img src={InfoIconSvg} width="18px" onClick={toggleInfo} />
        </div>
      </Control>

      {!hidden && (
        <Control
          position={"topleft"}
          className={"dashboard infoDashboard leafletLeft-center"}
        >
          <div className={"infoSection"}>
            Hello! This is map-blog of the Everest Base 3 Pass Trek I undertook
            in May 2016. Thanks for checking it out.
            <br />
            <a href="https://x.com/siddhartha_b" target="_blank">
              @siddhartha_b
            </a>
          </div>
          <br />
          <div>
            <button onClick={toggleInfo} className={"okButton"}>
              <span>Ok</span>
            </button>
          </div>
        </Control>
      )}
    </>
  );
};

export default withLeaflet(Info);
