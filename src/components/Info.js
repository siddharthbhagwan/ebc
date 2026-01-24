import React from "react";
import { withLeaflet } from "react-leaflet";
import Control from "react-leaflet-control";
import { connect } from "react-redux";
import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";

const Info = (props) => {
	const { showInfo, toggleInfo } = props;

	return (
		<>
			{showInfo && (
				<Control
					position={"topleft"}
					className={"dashboard infoDashboard leafletLeft-center"}
				>
					<div className={"infoSection"} style={{ padding: "15px", fontSize: "14px", lineHeight: "1.6" }}>
						Hey! This is a map-blog for the Everest Base 3 Pass Trek I undertook
						in May 2016.
						<br />
						Thanks for checking it out!
						<br />
						<br />
						Twitter: <a href="https://twitter.com/siddhartha_b" target="_blank" rel="noopener noreferrer">@siddhartha_b</a>
					</div>
					<div style={{ padding: "0 15px 15px 15px", textAlign: "center" }}>
						<div 
							onClick={toggleInfo} 
							style={{ 
								cursor: "pointer", 
								display: "inline-flex", 
								alignItems: "center", 
								justifyContent: "center",
								width: "32px",
								height: "32px",
								borderRadius: "50%",
								background: "#f5f5f5",
								border: "1px solid #eee",
								color: "#7f8c8d",
								fontSize: "18px",
								fontWeight: "bold"
							}}
						>
							✕
						</div>
					</div>
				</Control>
			)}
		</>
	);
};

const mapStateToProps = (state) => ({
	showInfo: state.mapState.showInfo,
});

export default connect(mapStateToProps, mapDispatchToProps)(withLeaflet(Info));
