import React from "react";
import { connect } from "react-redux";
import { isDesktop } from "react-device-detect";
import "../resources/css/dashboard.css";
import { mapDispatchToProps } from "../utils/utils";

const Info = (props) => {
  const { showInfo, toggleInfo } = props;

  return (
    <>
      {showInfo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          {/* Backdrop Blur - Full screen blur */}
          <div
            onClick={toggleInfo}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Info Content Box - Actual card that stays clear */}
          <div
            style={{
              position: "relative",
              background: "white",
              borderRadius: "12px",
              boxShadow: "none",
              width: isDesktop ? "450px" : "85vw",
              maxHeight: "90vh",
              overflowY: "auto",
              zIndex: 1,
              padding: "30px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Close Button Cross */}
            <div
              onClick={toggleInfo}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                cursor: "pointer",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#95a5a6",
                fontSize: "20px",
                fontWeight: "300",
                zIndex: 2,
              }}
            >
              ✕
            </div>

            <div
              style={{
                marginTop: "35px", // Added space below the closing ✕
                fontSize: isDesktop ? "17px" : "15px",
                lineHeight: "1.7",
                textAlign: "left",
                color: "#2c3e50",
                fontWeight: "400",
              }}
            >
              This is a map-blog for the Everest Base 3 Pass Trek my friend{" "}
              <a
                href="https://x.com/binnyjohnk"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#3498db",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Johann
              </a>{" "}
              and I undertook in May 2016. - Sid
              <br />
              <br />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "10px",
                }}
              >
                <a
                  href="https://twitter.com/siddhartha_b"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    color: "#34495e",
                    fontSize: "14px",
                    fontWeight: "600",
                    padding: "8px 16px",
                    background: "#f8f9fa",
                    borderRadius: "20px",
                    border: "1px solid #eee",
                  }}
                >
                  Say Hi on
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  showInfo: state.mapState.showInfo,
});

export default connect(mapStateToProps, mapDispatchToProps)(Info);
