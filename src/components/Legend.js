import React from "react";
import { connect } from "react-redux";
import { isDesktop } from "react-device-detect";
import { mapDispatchToProps } from "../utils/utils";

import ebcIcon from "../resources/images/ebc.svg";
import tentIcon from "../resources/images/tent.svg";
import "../resources/css/legend.css";

const Legend = (props) => {
  const { showLegend } = props;

  if (!showLegend) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, // Move to top
        right: isDesktop ? "10px" : "0",
        left: isDesktop ? "auto" : "0",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className={"legend mapLegend-mobile"}
        style={{
          width: isDesktop ? "auto" : "100%",
          margin: "0",
          borderRadius: isDesktop ? "0 0 8px 8px" : "0", // Rounded bottom corners
          boxSizing: "border-box",
          pointerEvents: "auto",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "none",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: isDesktop ? "1px 8px" : "0px 4px",
          gap: isDesktop ? "2px" : "1px",
          border: "none",
          borderTop: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="legendItem"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "1px 4px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <img
              src={ebcIcon}
              className="ebc-marker-icon"
              width={isDesktop ? "12px" : "11px"}
              alt="Base Camp"
            />
          </div>
          <span
            style={{ fontSize: "10px", fontWeight: "700", color: "#34495e" }}
          >
            Base Camp
          </span>
        </div>
        <div
          className="legendItem"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "1px 4px",
          }}
        >
          <span
            style={{
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '8px',
              lineHeight: '1.2',
              fontWeight: '700',
              color: '#fff',
              backgroundColor: '#C22848',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            SUMMIT
          </span>
          <span
            style={{ fontSize: "10px", fontWeight: "700", color: "#34495e" }}
          >
            Summit
          </span>
        </div>
        <div
          className="legendItem"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "1px 4px",
          }}
        >
          <span
            style={{
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '8px',
              lineHeight: '1.2',
              fontWeight: '700',
              color: '#fff',
              backgroundColor: '#C22848',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            PASS
          </span>
          <span
            style={{ fontSize: "10px", fontWeight: "700", color: "#34495e" }}
          >
            Pass
          </span>
        </div>
        <div
          className="legendItem"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "1px 4px",
          }}
        >
          <div
            style={{
              width: isDesktop ? "18px" : "12px",
              height: isDesktop ? "18px" : "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
              borderRadius: "4px",
              border: "1px solid #eee",
            }}
          >
            <img
              src={tentIcon}
              width={isDesktop ? "12px" : "11px"}
              alt="Lodging"
            />
          </div>
          <span
            style={{ fontSize: "10px", fontWeight: "700", color: "#34495e" }}
          >
            Lodging
          </span>
        </div>
        <div
          className="legendItem"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "2px 6px",
          }}
        >
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: "600",
              color: "#34495e",
              fontStyle: "italic",
              paddingLeft: "4px",
              borderLeft: "1px solid #eee",
              marginLeft: "4px",
            }}
          >
            <span style={{ fontSize: "8px", verticalAlign: "top" }}>*</span>{" "}
            YMMV
          </span>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  showLegend: state.mapState.showLegend,
});

export default connect(mapStateToProps, mapDispatchToProps)(Legend);
