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

const TerrainToggle = ({ is3D, onChange, showLegend }) => {
  const ref = useRef(null);
  const openHeight = useRef(0);
  const [place, setPlace] = useState({ right: 10, height: 0 });

  useLayoutEffect(() => {
    let host = null;
    let hostRight = null;
    let resizeObserver = null;

    const apply = (height) => {
      const self = ref.current;
      if (!self || !height) return;
      const legend = document.querySelector(".legend");
      const gap = 8;
      const inset = 10;
      if (legend) {
        host = legend.parentElement;
        const fullBleed = host && (host.style.left === "0px" || host.style.left === "0");
        if (!fullBleed && host) {
          if (hostRight == null) hostRight = host.style.right;
          const nextRight = `${self.offsetWidth + gap + inset}px`;
          if (host.style.right !== nextRight) host.style.right = nextRight;
        }
      }
      setPlace((prev) => (prev.right === inset && prev.height === height ? prev : { right: inset, height }));
    };

    const measure = () => {
      const legend = document.querySelector(".legend");
      if (legend) {
        const measured = Math.round(legend.getBoundingClientRect().height);
        if (measured > 0) openHeight.current = measured;
      }
      if (openHeight.current) apply(openHeight.current);
    };

    measure();
    const legend = document.querySelector(".legend");
    if (legend && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(legend);
    }
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", measure);
      if (host && hostRight != null) host.style.right = hostRight;
    };
  }, [showLegend]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        right: place.right,
        height: place.height || undefined,
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
          height: "100%",
          boxSizing: "border-box",
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
              tabIndex={-1}
              aria-pressed={active}
              onClick={(event) => {
                // Keyboard activation must not swap 2D and 3D. Only a pointer click does.
                if (event.detail === 0) return;
                onChange(mode.id);
              }}
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

// Survives a remount. The first visit opens in 3D. After that, Right/Left must not flip it.
let viewIs3D = true;

const keepMapFlat = (glMap) => {
  if (!glMap) return;
  if (glMap.keyboard) glMap.keyboard.disable();
  if (glMap.dragRotate) glMap.dragRotate.disable();
  if (glMap.touchPitch) glMap.touchPitch.disable();
  if (glMap.touchZoomRotate && glMap.touchZoomRotate.disableRotation) {
    glMap.touchZoomRotate.disableRotation();
  }
  if (typeof glMap.setMaxPitch === "function") glMap.setMaxPitch(0);
  if (typeof glMap.setPitch === "function") glMap.setPitch(0);
  if (typeof glMap.setBearing === "function") glMap.setBearing(0);
};

const MapContainer = (props) => {
  const { center, zoomSnap, zoom, style, url } = props;
  const { isLandscape = false } = useMobileOrientation();
  const [leafletMap, setLeafletMap] = useState(null);
  const [is3D, setIs3D] = useState(viewIs3D);
  const chooseView = (next) => {
    viewIs3D = next;
    setIs3D(next);
  };

  useEffect(() => {
    if (!leafletMap || !url) return undefined;
    const layer = maplibreGL({
      style: url,
      keyboard: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
    }).addTo(leafletMap);
    const glMap = layer.getMaplibreMap();
    const onStyle = () => {
      hideBasemapTextLabels(glMap);
      keepMapFlat(glMap);
    };
    glMap.on("load", onStyle);
    glMap.on("style.load", onStyle);
    keepMapFlat(glMap);
    if (glMap.isStyleLoaded && glMap.isStyleLoaded()) onStyle();
    return () => {
      glMap.off("load", onStyle);
      glMap.off("style.load", onStyle);
      keepMapFlat(glMap);
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

  useEffect(() => {
    if (is3D || !leafletMap) return;
    leafletMap.invalidateSize();
  }, [is3D, leafletMap]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        background: is3D ? "linear-gradient(180deg, #e9ecef 0%, #d6dbe0 100%)" : undefined,
      }}
    >
      <Map
        ref={(m) => { if (!leafletMap && m) setLeafletMap(m.leafletElement); }}
        center={initialCenter}
        zoomSnap={zoomSnap}
        zoomDelta={zoomSnap}
        zoom={initialZoom}
        minZoom={MIN_ZOOM}
        touchZoom={true}
        maxBounds={NEPAL_BOUNDS}
        maxBoundsViscosity={1}
        style={{ ...style, visibility: is3D ? "hidden" : "visible" }}
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
      <TerrainToggle is3D={is3D} onChange={chooseView} showLegend={props.showLegend} />
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
