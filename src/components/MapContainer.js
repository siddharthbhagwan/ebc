import React, { useState } from "react";
import { Map, TileLayer } from "react-leaflet";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import POI from "./POI";
import Info from "./Info";
import Reset from "./Reset";
import { isDesktop } from "react-device-detect";

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url, attribution } = props;
  const [showLegend, setLegend] = useState(Boolean(isDesktop));

  return (
    <Map
      center={center}
      zoomSnap={zoomSnap}
      zoom={isDesktop ? zoom : 10.7}
      style={style}
    >
      <TileLayer url={url} attribution={attribution} />
      <Reset setLegend={setLegend} />
      <POI />
      <Info />
      {showLegend ? <Legend /> : null}
      <Dashboard />
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
  markerZoom: state.mapState.markerZoom,
  attribution: state.mapState.attribution,
  zoomDuration: state.mapState.zoomDuration,
  topLeftPadding: state.mapState.topLeftPadding,
  bottomRightPadding: state.mapState.bottomRightPadding,
});

export default connect(mapStateToProps)(MapContainer);
