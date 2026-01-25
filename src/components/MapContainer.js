import React from "react";
import { Map, TileLayer } from "react-leaflet";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import Info from "./Info";
import POI from "./POI";
import { isDesktop } from "react-device-detect";

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url, attribution } = props;

  // Use a southern offset to clear space for the dashboard at the bottom
  const mobileOffset = 0.022;
  const desktopOffset = 0.008;
  const currentOffset = isDesktop ? desktopOffset : mobileOffset;
  const initialCenter = [center[0] - currentOffset, center[1]];

  // Calculate the derived zoom for mobile/landscape
  const ZOOM_MOBILE = 10.7;
  const derivedZoom = isDesktop ? zoom : ZOOM_MOBILE;
  const initialZoom = derivedZoom; // Start zoomed out as requested

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <Map
        center={initialCenter}
        zoomSnap={zoomSnap}
        zoomDelta={zoomSnap}
        zoom={initialZoom}
        style={style}
        zoomControl={false}
        attributionControl={false}
        keyboard={false}
        preferCanvas={true}
      >
        <TileLayer url={url} attribution={attribution} />
        <POI />
        <Dashboard />
        <GeoJsonRoutes derivedZoom={derivedZoom} />
      </Map>
      <Legend />
      <Info />
    </div>
  );
};

const mapStateToProps = (state) => ({
  url: state.mapState.url,
  zoom: state.mapState.zoom,
  style: state.mapState.style,
  center: state.mapState.center,
  zoomSnap: state.mapState.zoomSnap,
  hoverColor: state.mapState.hoverColor,
  markerZoom: state.mapState.markerZoom,
  attribution: state.mapState.attribution,
  zoomDuration: state.mapState.zoomDuration,
  topLeftPadding: state.mapState.topLeftPadding,
  bottomRightPadding: state.mapState.bottomRightPadding,
  showLegend: state.mapState.showLegend,
  showInfo: state.mapState.showInfo,
});

export default connect(mapStateToProps)(MapContainer);
