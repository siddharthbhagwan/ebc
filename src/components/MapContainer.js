import React, { useState } from "react";
import { Map, TileLayer } from "react-leaflet";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import Info from "./Info";
import POI from "./POI";
import { isDesktop, useMobileOrientation } from "react-device-detect";

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url, attribution } = props;
  const { isLandscape = false } = useMobileOrientation();
  const [leafletMap, setLeafletMap] = useState(null);

  // Calculate offset based on device type and orientation
  // Mobile portrait needs more offset to clear the dashboard
  // Mobile landscape and desktop need less offset
  const mobileOffset = isLandscape ? 0.016 : 0.024;
  const desktopOffset = 0.008;
  const currentOffset = isDesktop ? desktopOffset : mobileOffset;
  
  // Robustly handle center whether it's [lat, lng] or {lat, lng}
  const lat = center && (Array.isArray(center) ? center[0] : center.lat);
  const lng = center && (Array.isArray(center) ? center[1] : center.lng);
  
  const initialCenter = (lat !== undefined && lng !== undefined) 
    ? [lat - currentOffset, lng] 
    : [27.840457443855108, 86.76420972837559]; // Fallback to a default center

  // Calculate zoom based on device type and orientation
  const ZOOM_MOBILE = 10.6;
  const ZOOM_LANDSCAPE = 10.5;
  const derivedZoom = isDesktop ? zoom : isLandscape ? ZOOM_LANDSCAPE : ZOOM_MOBILE;
  const initialZoom = derivedZoom;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <Map
        ref={(m) => { if (!leafletMap && m) setLeafletMap(m.leafletElement); }}
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
        <GeoJsonRoutes derivedZoom={derivedZoom} />
      </Map>
      <Dashboard map={leafletMap} />
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
