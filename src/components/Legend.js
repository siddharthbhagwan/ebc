import React from "react";
import { withLeaflet } from "react-leaflet";
import Control from "react-leaflet-control";
import ebcIcon from "../resources/images/ebc.svg";
import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import passIcon from "../resources/images/pass.svg";
import "../resources/css/legend.css";

const Legend = () => (
	<Control position={"bottomright"}>
		<div className={"legend"}>
			<img src={ebcIcon} width="20px" /> Everest Base Camp <br />
			<img src={summitIcon} width="20px" /> Summit <br />
			<img src={passIcon} width="20px" /> Pass <br />
			<img src={tentIcon} width="15px" /> Lodging
		</div>
	</Control>
);

export default withLeaflet(Legend);
