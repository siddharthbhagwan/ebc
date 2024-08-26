import React, { useState, useEffect } from "react";
import { Map, TileLayer } from "react-leaflet";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import POI from "./POI";
import PolylineRoutes from "./PolylineRoutes";
import Info from "./Info";
import Reset from "./Reset";
import ReactGA from "react-ga4";
import TransparentPolylines from "./TransparentPolylines";
import TransparentGeoJson from "./TransparentGeoJson";
import { useMobileOrientation, isDesktop } from "react-device-detect";

const ZOOM_MOBILE = 10.7;
const ZOOM_LANDSCAPE = 10.2;

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url, attribution } = props;
  const [showLegend, setLegend] = useState(Boolean(isDesktop));
  const { isLandscape = false } = useMobileOrientation();

  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
    ? ZOOM_LANDSCAPE
    : ZOOM_MOBILE;

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  return (
    <Map center={center} zoomSnap={zoomSnap} zoom={derivedZoom} style={style}>
      <TileLayer url={url} attribution={attribution} />
      <Reset setLegend={setLegend} />
      <POI />
      {showLegend ? <Legend /> : null}
      <Dashboard />

      <GeoJsonRoutes />
      {/* <TransparentGeoJson /> */}

      <PolylineRoutes />
      {/* <TransparentPolylines /> */}

      <Info />
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
});

export default connect(mapStateToProps)(MapContainer);
