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
  const { center, zoomSnap, zoom, style, url, attribution, showLegend, showInfo } = props;

  return (
    <Map
      center={center}
      zoomSnap={zoomSnap}
      zoom={isDesktop ? zoom : 10.7}
      style={style}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={url} attribution={attribution} />
      <POI />
      <Dashboard />
      <Legend showLegend={showLegend} />
      <Info showInfo={showInfo} />
      <GeoJsonRoutes />
    </Map>
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
