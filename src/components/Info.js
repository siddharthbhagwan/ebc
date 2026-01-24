import React, { useState } from "react";
import { withLeaflet } from "react-leaflet";
import Control from "react-leaflet-control";
import { isDesktop } from "react-device-detect";
import InfoIconSvg from "../resources/images/info.svg";
import "../resources/css/dashboard.css";

const Info = () => {
	const [hidden, setHidden] = useState(true);
	const toggleInfo = () => setHidden(!hidden);

	return (
		<>
			<Control position={"topleft"} className={"icon infoIcon"}>
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
						Hey! This is map-blog for the Everest Base 3 Pass Trek I undertook
						in May 2016.
						<br />
						Thanks for checking it out!
					</div>
					<br />
					<div>
						<button onClick={toggleInfo}>
							<span className={"okButton"}>Ok</span>
						</button>
					</div>
				</Control>
			)}
		</>
	);
};

export default withLeaflet(Info);
