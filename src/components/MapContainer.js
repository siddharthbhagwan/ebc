import React, { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Map } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import Info from "./Info";
import POI from "./POI";
import { isDesktop, useMobileOrientation } from "react-device-detect";

// three.js only loads when 3D is shown.
const Terrain3D = lazy(() => import("./Terrain3D"));

// Webpack rewrites MapLibre's import.meta.url to a file:// path, so the
// default worker URL is empty and vector tiles never paint (background only).
// start/build copy dist/maplibre-gl-worker.mjs here. .js is still loaded as a
// module worker; only .cjs is treated as classic.
setWorkerUrl(`${process.env.PUBLIC_URL}/maplibre-gl-worker.js`);

// Half the previous zoom-out again: 0.8 levels under the desktop overview (11.2).
// Mobile overview is 10.5, so this floor stays reachable. Box is half the last one.
const NEPAL_BOUNDS = [
  [27.23, 85.64],
  [28.45, 87.89],
];
const MIN_ZOOM = 10.4;

// Hide place, road, and water names that ship in the basemap tiles.
// Icon-only symbols stay. The trek's own marker labels are Leaflet tooltips, not these layers.
const hideBasemapTextLabels = (glMap) => {
  if (!glMap || !glMap.getStyle()) return;
  const layers = glMap.getStyle().layers || [];
  layers.forEach((layer) => {
    if (layer.type !== "symbol") return;
    const layout = layer.layout || {};
    if (layout["text-field"] == null) return;
    if (!glMap.getLayer(layer.id)) return;
    glMap.setLayoutProperty(layer.id, "visibility", "none");
  });
};

const TerrainToggle = ({ is3D, onChange }) => {
  const ref = useRef(null);
  const [place, setPlace] = useState({ right: 12, height: 22 });

  useLayoutEffect(() => {
    let host = null;
    let hostRight = null;
    const align = () => {
      const legend = document.querySelector(".legend");
      const self = ref.current;
      if (!legend || !self) return;
      host = legend.parentElement;
      const box = legend.getBoundingClientRect();
      const gap = 8;
      const inset = 10;
      const width = self.offsetWidth;
      const fullBleed = host && host.style.left === "0px";
      if (!fullBleed && host) {
        if (hostRight == null) hostRight = host.style.right;
        host.style.right = `${width + gap + inset}px`;
      }
      setPlace({
        right: inset,
        height: Math.max(22, Math.round(box.height)),
      });
    };
    align();
    const observer = new MutationObserver(align);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", align);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", align);
      if (host && hostRight != null) host.style.right = hostRight;
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        right: place.right,
        height: place.height,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "0 4px",
        boxSizing: "border-box",
        background: "transparent",
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: Math.max(18, place.height - 6),
          padding: 2,
          borderRadius: 999,
          background: "#e6ebf2",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 2,
            bottom: 2,
            left: is3D ? "50%" : 2,
            width: "calc(50% - 2px)",
            borderRadius: 999,
            background: "#2563eb",
            transition: "left 0.18s ease",
          }}
        />
        {[
          { id: false, label: "2D" },
          { id: true, label: "3D" },
        ].map((mode) => {
          const active = is3D === mode.id;
          return (
            <button
              key={mode.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(mode.id)}
              style={{
                position: "relative",
                zIndex: 1,
                border: "none",
                background: "transparent",
                color: active ? "#fff" : "#4a5568",
                borderRadius: 999,
                padding: "1px 10px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                lineHeight: 1.2,
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url } = props;
  const { isLandscape = false } = useMobileOrientation();
  const [leafletMap, setLeafletMap] = useState(null);
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    if (!leafletMap || !url) return undefined;
    const layer = maplibreGL({ style: url }).addTo(leafletMap);
    const glMap = layer.getMaplibreMap();
    const onStyle = () => hideBasemapTextLabels(glMap);
    glMap.on("load", onStyle);
    glMap.on("style.load", onStyle);
    if (glMap.isStyleLoaded && glMap.isStyleLoaded()) onStyle();
    return () => {
      glMap.off("load", onStyle);
      glMap.off("style.load", onStyle);
      leafletMap.removeLayer(layer);
    };
  }, [leafletMap, url]);

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
        minZoom={MIN_ZOOM}
        maxBounds={NEPAL_BOUNDS}
        maxBoundsViscosity={1}
        style={style}
        zoomControl={false}
        attributionControl={false}
        keyboard={false}
        preferCanvas={true}
      >
        <POI />
        <GeoJsonRoutes derivedZoom={derivedZoom} />
      </Map>
      {is3D && (
        <Suspense fallback={null}>
          <Terrain3D />
        </Suspense>
      )}
      <TerrainToggle is3D={is3D} onChange={setIs3D} />
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
