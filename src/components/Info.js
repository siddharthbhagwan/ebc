import React from "react";
import { connect } from "react-redux";
import "../resources/css/dashboard.css";
import "../resources/css/info.css";
import { mapDispatchToProps } from "../utils/utils";

const Info = (props) => {
  const { showInfo, toggleInfo } = props;

  return (
    <>
      {showInfo && (
        <div className="info-overlay">
          {/* Backdrop Blur - Full screen blur */}
          <div className="info-backdrop" onClick={toggleInfo} />

          {/* Info Content Box - Actual card that stays clear */}
          <div className="info-card">
            {/* Close Button Cross */}
            <div className="info-close-btn" onClick={toggleInfo}>
              ✕
            </div>

            <div className="info-content">
              This is a map-blog I designed and built using React and Leaflet to
              document the Everest Base Camp 3 Pass Trek my friend{" "}
              <a
                href="https://x.com/binnyjohnk"
                target="_blank"
                rel="noopener noreferrer"
                className="info-link"
              >
                Johann
              </a>{" "}
              and I undertook in May 2016.
              <br />
              Cheers, Sid
              <br />
              <br />
              <div className="info-social-container">
                <a
                  href="https://twitter.com/siddhartha_b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-social-button"
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
