import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import ReactGA from "react-ga4";
import { isDesktop } from "react-device-detect";
import * as THREE from "three";
import Delaunator from "delaunator";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { getDayWiseDataG } from "../utils/geoJson";
import { getMarkers } from "../utils/markers";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";
import { createGradientSegments, getColorForElevation } from "../utils/heightGradient";
import { mapDispatchToProps } from "../utils/utils";
import { dayTravel } from "../utils/routeBearing";

// ---- Look knobs -------------------------------------------------------------
// Terrain window (squared in meters around its center when built).
const AREA = { south: 27.62, north: 28.09, west: 86.6, east: 86.92 };
const DEM_ZOOM = 11;
const GRID_CELLS = 14; // cells per side; fewer = bigger facets
const JITTER = 0.42; // interior vertex jitter, fraction of a cell
const SMOOTHING = 0.35; // average elevation over this fraction of a cell; 0 = point samples
const EXAGGERATION = 1.6; // vertical scale vs true scale
const HEIGHT_STEP = 0.25; // quantize surface heights (world units), 0 = off
const SLAB_WIDTH = 100; // world units
const SLAB_THICKNESS = 6; // below the lowest terrain point

const COLORS = {
  top: "#d2ecf8",
  side: "#a9cde0",
  sideGlow: "#6f9fbb", // emissive lift so walls stay soft blue, not slate
  disc: "#ffffff",
  shadow: "rgba(64, 104, 132, 0.38)",
  glow: "rgba(255, 176, 96, 0.30)",
  background: "linear-gradient(180deg, #e4f2f8 0%, #cfe6f1 55%, #b9dbea 100%)",
};

const LIGHT = {
  hemiSky: "#d4ebf7",
  hemiGround: "#5d9cc4",
  hemiIntensity: 1.8,
  sunColor: "#ffffff",
  sunIntensity: 1.3,
  sunDirection: [-0.9, 1.25, 0.45], // upper left
};

const CAMERA = {
  fov: 28,
  azimuth: -0.42, // radians, 0 = looking north from the south
  elevation: 36, // degrees above the horizon
  minElevation: 22,
  maxElevation: 78,
  fit: 1.1, // >1 pulls back
  minZoom: 0.55,
  maxZoom: 1.6,
  dayPadding: 14, // world units around a day's bounds
  minDayFrame: 0.32, // closest day framing, fraction of the overview distance
  easeMs: 900,
};

// Walking days only. The old floor (0.32) and 14-unit pad left short routes
// small in the frame. 0.14 is about 2.3x closer when that floor was binding.
const WALK_FRAME = {
  padding: 6,
  minFrame: 0.14,
};

// Line widths are screen pixels, matching the 2D weights.
const ROUTE = {
  lift: 0.3,
  width: 2,
  activeWidth: 6,
  singleDayWidth: 7.5,
  opacity: 0.65,
  hitWidth: 2.6, // world units, invisible tap target like 2D's weight 25
};

const DISC = {
  radius: 0.625, // half the previous white circle
  ring: 0.15,
  lift: 0.2,
};

// Dev-only shape previews: ?terrain=N. No param (and production) keeps the grid above.
const REQUESTED_TERRAIN =
  process.env.NODE_ENV !== "production"
    ? Number(new URLSearchParams(window.location.search).get("terrain")) || 0
    : 0;
const RASTER = 160; // DEM samples per side used to pick TIN vertices
const PEAKED = {
  kind: "peaks",
  peaks: 26,
  peakSpacing: 6, // world units between auto-picked summits
  feet: 5, // low vertices ringed around each summit
  footRadius: 6,
  cameraElevation: 44,
  fit: 1.22,
  stops: true, // lodges become vertices, so valleys sit where the trek does
  routeSpacing: 6,
  valleyCells: 6,
  valleySpacing: 4,
  border: 12,
};
const TERRAIN_OPTIONS = {
  1: { ...PEAKED, exaggeration: 3.0, routeSpacing: 9 }, // peak TIN
  2: { kind: "error", triangles: 220, border: 8, exaggeration: 2.0, cameraElevation: 44, fit: 1.22 }, // error-driven TIN
  3: { ...PEAKED, exaggeration: 2.6, shape: 1.7, valleyClamp: 0.1, topo: true }, // topo pyramids
  4: { ...PEAKED, exaggeration: 2.6, shape: 1.7, valleyClamp: 0.1 }, // lifted peaks
  5: {
    ...PEAKED,
    peaks: 14,
    peakSpacing: 8,
    footRadius: 8,
    stops: false,
    routeSpacing: 0,
    valleyCells: 4,
    valleySpacing: 8,
    border: 6,
    feet: 4,
    exaggeration: 3.0,
    shape: 1.4,
    valleyClamp: 0.08,
  }, // bold low-poly
  // Second batch: different visual languages rather than mesh variations.
  6: {
    kind: "terrace",
    look: "wood",
    grid: 140,
    blur: 1.4, // world units; smooths the DEM so each sheet has a clean outline
    step: 200,
    exaggeration: 2.0,
    cameraElevation: 40,
    fit: 1.15,
  },
  7: {
    ...PEAKED,
    look: "paper",
    named: false,
    peaks: 8,
    peakSpacing: 10,
    feet: 3,
    footRadius: 9,
    stops: false,
    routeSpacing: 0,
    valleyCells: 2,
    valleySpacing: 10,
    border: 4,
    exaggeration: 2.4,
    shape: 1.3,
    valleyClamp: 0.06,
    cameraElevation: 40,
  },
  8: { kind: "hex", look: "hex", across: 38, gap: 0.92, baseHeight: 0.6, exaggeration: 2.0, cameraElevation: 42, fit: 1.18 },
  9: {
    kind: "ridges",
    look: "ridges",
    rows: 72,
    samples: 220,
    lineWidth: 1.3,
    exaggeration: 2.6,
    cameraAzimuth: 0, // face the rows straight on
    cameraElevation: 27,
    fit: 1.05,
  },
  10: { kind: "satellite", look: "satellite", grid: 110, imageryZoom: 12, exaggeration: 1.5, cameraElevation: 38, fit: 1.12 },
  // Variants of 10: same imagery and mesh code, different knobs.
  11: { kind: "satellite", look: "satCrisp", grid: 150, smooth: 0.35, imageryZoom: 13, exaggeration: 2.2, cameraElevation: 40, fit: 1.18 },
  12: { kind: "satellite", look: "satPainted", grid: 80, smooth: 0.9, imageryZoom: 12, exaggeration: 1.4, cameraElevation: 38, fit: 1.12 },
  13: { kind: "satellite", look: "satSnow", grid: 120, smooth: 0.5, imageryZoom: 12, exaggeration: 1.8, cameraElevation: 36, fit: 1.12 },
  14: { kind: "satellite", look: "satGolden", grid: 120, smooth: 0.5, imageryZoom: 12, exaggeration: 1.7, cameraElevation: 36, fit: 1.12 },
  15: { kind: "satellite", look: "satDiorama", grid: 110, smooth: 0.5, imageryZoom: 12, exaggeration: 1.5, cameraElevation: 42, fit: 1.25 },
};
// Major summits inside the slab, [lat, lng]; snapped to the DEM top nearby.
const NAMED_SUMMITS = [
  [27.9881, 86.925], // Everest
  [27.9617, 86.9333], // Lhotse
  [27.9675, 86.8867], // Nuptse
  [28.015, 86.8281], // Pumori
  [27.8617, 86.8614], // Ama Dablam
  [27.9225, 86.9358], // Island Peak
  [27.7867, 86.7889], // Thamserku
  [27.7964, 86.8136], // Kangtega
  [27.8975, 86.7856], // Taboche
  [27.9183, 86.7672], // Cholatse
  [27.9586, 86.7372], // Arakam Tse
  [27.8183, 86.9033], // Baruntse side ridge
];

const ICE_LOOK = {
  top: COLORS.top,
  side: COLORS.side,
  sideGlow: COLORS.sideGlow,
  background: COLORS.background,
  light: LIGHT,
};
const TOPO_LOOK = {
  side: "#c9b48a",
  sideGlow: "#6b5a3c",
  frame: "#efe4c6",
  frameWidth: 3,
  frameHeight: 1.2,
  contourStep: 100, // meters of real elevation
  contour: "#3b2f1c",
  contourOpacity: 0.32,
  // Normalized real elevation to color: blue valleys, green slopes, ochre tops.
  elevationStops: [
    [0, "#3f7f99"],
    [0.07, "#5b8f88"],
    [0.16, "#6f8d4f"],
    [0.38, "#7f8a47"],
    [0.55, "#b9853f"],
    [0.8, "#d29a52"],
    [1, "#e8c48a"],
  ],
  background: "linear-gradient(180deg, #24525f 0%, #1c4451 60%, #173a46 100%)",
  light: {
    hemiSky: "#fff6e8",
    hemiGround: "#40584f",
    hemiIntensity: 1.4,
    sunColor: "#fff1dc",
    sunIntensity: 2.2,
    sunDirection: [-0.9, 1.1, 0.5],
  },
};
const LOOKS = {
  // Stacked plywood and card sheets, one tone per 200 m layer.
  wood: {
    layers: ["#c99a63", "#efe3c8", "#b98a55", "#f3e9d3"],
    baseTone: "#8a6440",
    route: { width: 3, activeWidth: 6.5, singleDayWidth: 7.5, opacity: 0.95, lift: 0.8 },
    disc: { lift: 0.9 },
    background: "linear-gradient(180deg, #f2ede4 0%, #e3dccf 100%)",
    light: {
      hemiSky: "#fffaf0",
      hemiGround: "#8d7a62",
      hemiIntensity: 1.6,
      sunColor: "#fff4e2",
      sunIntensity: 1.9,
      sunDirection: [-0.9, 1.3, 0.55],
    },
  },
  // Matte white paper with a single soft cast shadow.
  paper: {
    top: "#f6f4ef",
    side: "#e6e2da",
    sideGlow: "#000000",
    background: "#ecebe6",
    shadows: true,
    shadowPlane: false,
    light: {
      hemiSky: "#ffffff",
      hemiGround: "#b8b2a6",
      hemiIntensity: 1.25,
      sunColor: "#ffffff",
      sunIntensity: 2.6,
      sunDirection: [-1.0, 0.62, 0.3], // low sun for long fold shadows
    },
    route: { width: 1.6, activeWidth: 4, singleDayWidth: 5, opacity: 0.85 },
    disc: { radius: 0.9, ring: 0.18 },
  },
  // Data-viz hexagonal prisms, cool low to warm high.
  hex: {
    ramp: [
      [0, "#1f3b6f"],
      [0.22, "#2f7fb5"],
      [0.45, "#4fb6a3"],
      [0.65, "#e8d27a"],
      [0.82, "#ee8f4f"],
      [1, "#f7f1e8"],
    ],
    background: "#eef0f3",
    route: { width: 2.8, activeWidth: 7, singleDayWidth: 8, opacity: 0.9 },
    light: {
      hemiSky: "#ffffff",
      hemiGround: "#7d8796",
      hemiIntensity: 1.5,
      sunColor: "#ffffff",
      sunIntensity: 1.7,
      sunDirection: [-0.8, 1.3, 0.6],
    },
  },
  // "Unknown Pleasures" style profiles; curtains share the background color to hide lines behind.
  ridges: {
    background: "#0b1428",
    curtain: "#0b1428",
    ridge: "#e8e4d8",
    shadowPlane: false,
    routesOnTop: true,
    route: { width: 2.4, activeWidth: 6, singleDayWidth: 7, opacity: 0.9 },
    disc: { radius: 0.85, ring: 0.25, onTop: true },
    light: LIGHT,
  },
  // Real imagery on a smooth mesh with a tilt-shift miniature look.
  satellite: {
    side: "#5b4a3a",
    sideGlow: "#2a2018",
    background: "linear-gradient(180deg, #e9ecef 0%, #d6dbe0 100%)",
    canvasFilter: "saturate(1.35) contrast(1.12)",
    tiltShift: true,
    credit: "Imagery: Esri",
    light: {
      hemiSky: "#ffffff",
      hemiGround: "#6b5c4c",
      hemiIntensity: 1.7,
      sunColor: "#fff6ea",
      sunIntensity: 1.6,
      sunDirection: [-0.9, 1.2, 0.5],
    },
  },
};
const SATELLITE_LOOK = LOOKS.satellite;
Object.assign(LOOKS, {
  satCrisp: {
    ...SATELLITE_LOOK,
    canvasFilter: "saturate(1.3) contrast(1.18)",
    tiltShift: false,
  },
  satPainted: {
    ...SATELLITE_LOOK,
    imageryGrade: { blur: 1.6, posterize: 7, desaturate: 0.35, pastel: 0.12 },
    canvasFilter: "saturate(0.85) contrast(0.95) brightness(1.04)",
    tiltShift: { height: "30%", blur: 2 },
    background: "linear-gradient(180deg, #f1eee9 0%, #e2ddd5 100%)",
    side: "#8a7a68",
  },
  satSnow: {
    ...SATELLITE_LOOK,
    imageryGrade: { snowLift: 0.55, cool: 0.18 },
    canvasFilter: "saturate(1.1) contrast(1.28)",
    haze: { color: "#dfe8f0", near: 0.95, far: 1.55 }, // fractions of camera distance
    background: "linear-gradient(180deg, #eef4f8 0%, #d3dfe9 100%)",
    side: "#4c5560",
    sideGlow: "#1c232b",
    light: { ...SATELLITE_LOOK.light, hemiSky: "#eaf3ff", hemiGround: "#3a4654", hemiIntensity: 1.2, sunIntensity: 2.1 },
  },
  satGolden: {
    ...SATELLITE_LOOK,
    imageryGrade: { hillshade: { azimuth: 255, altitude: 18, strength: 0.6, zFactor: 2 } },
    canvasFilter: "sepia(0.22) saturate(1.35) contrast(1.1)",
    shadows: true,
    background: "linear-gradient(180deg, #f6e7d2 0%, #e6cfae 100%)",
    side: "#6b4a2e",
    sideGlow: "#2e1d10",
    light: {
      hemiSky: "#ffe2bd",
      hemiGround: "#4a3423",
      hemiIntensity: 1.0,
      sunColor: "#ffc78a",
      sunIntensity: 2.8,
      sunDirection: [-1.0, 0.42, 0.32], // low sun from the west, same as the hillshade
    },
  },
  satDiorama: {
    ...SATELLITE_LOOK,
    strata: ["#7a5a3e", "#8f6c4c", "#6a4c33", "#a07c58", "#5e432d"],
    canvasFilter: "saturate(1.4) contrast(1.15)",
    tiltShift: { height: "40%", blur: 6 },
    background: "linear-gradient(180deg, #f4efe7 0%, #ddd2c2 100%)",
  },
});

// Option 11 with calmer slopes: 11's config and look verbatim, plus one slope knob each.
const SLOPE_SMOOTH = {
  sigma: 14, // Gaussian sigma in mesh cells for the smoothed DEM
  ridgeStart: 200, // convexity (m) where the original height starts to win
  ridgeFull: 500, // convexity (m) where the original height fully wins
};
// Paper-fold peaks: map sheet valleys with tall, broad pyramids at the main summits, [lat, lng].
const FOLD_SUMMITS = [
  ...NAMED_SUMMITS,
  [27.7167, 86.8], // Kusum Kanguru
  [27.7833, 86.6333], // Kongde Ri
  [27.9653, 86.7853], // Lobuche East
  [27.8667, 86.6], // Teng Kangpoche
];
const FOLD_MAIN = [
  [27.9881, 86.925], // Everest
  [27.9617, 86.9333], // Lhotse
  [27.8617, 86.8614], // Ama Dablam
  [27.9183, 86.7672], // Cholatse
  [27.7867, 86.7889], // Thamserku
  [27.7833, 86.6333], // Kongde Ri
  [28.015, 86.8281], // Pumori
  [27.7964, 86.8136], // Kangtega
];
const FOLD = {
  faceSlope: 60, // degrees of each face in world space at 2.2x; sets how broad a base is
  ring: 5, // base vertices around each apex
  floorKeep: 0.3, // valley floors keep this share of their height above the lowest point
  floorRadius: 5, // mesh cells; local minimum used as the valley floor
  shoulderDist: 16, // world units; neighboring summits closer than this get a ridge col
  routeSpacing: 4,
  fillSpacing: 9,
};
Object.assign(TERRAIN_OPTIONS, {
  16: { ...TERRAIN_OPTIONS[11], slopeSmooth: SLOPE_SMOOTH }, // ridge-preserving smoothing
  17: { ...TERRAIN_OPTIONS[11], slopeSmooth: SLOPE_SMOOTH, look: "satCrispSoftFaces" }, // plus slope-masked imagery blur
  18: { ...TERRAIN_OPTIONS[11], decimate: { triangles: 800, summits: 40 } }, // greedy TIN seeded with 11's summits
  19: { ...TERRAIN_OPTIONS[11], fold: { ...FOLD, summits: FOLD_SUMMITS, autoPeaks: 6 } }, // paper-fold peaks
  20: { ...TERRAIN_OPTIONS[11], fold: { ...FOLD, summits: FOLD_MAIN, autoPeaks: 0, snow: { start: 5600, full: 7200, opacity: 0.85 } } },
  // Sol geometry study. Every visual knob is inherited verbatim from option 11.
  21: { ...TERRAIN_OPTIONS[11], sol: { kind: "layered-six-face", valleySigma: 18, valleyGrid: 8, faces: 6, minProminence: 900, slope: 62 } },
  // Continuous animated terrain. Grid sizes yield 2n² connected triangles.
  22: { ...TERRAIN_OPTIONS[11], kind: "stylized", look: "celRange", stylized: { divisions: 20, sigma: 12, rangeSigma: 350, style: "cel", smoothShading: true } },
  23: { ...TERRAIN_OPTIONS[11], kind: "stylized", look: "softAnimated", stylized: { divisions: 16, sigma: 14, rangeSigma: 375, style: "soft", smoothShading: true } },
  24: { ...TERRAIN_OPTIONS[11], kind: "stylized", look: "graphicLowPoly", stylized: { divisions: 21, sigma: 11, rangeSigma: 350, style: "graphic", laplacian: 0.24 } },
  25: { ...TERRAIN_OPTIONS[11], kind: "stylized", look: "illustratedRelief", stylized: { divisions: 19, sigma: 13, rangeSigma: 375, style: "relief", smoothShading: true, ridgeAngle: 28 } },
  // Style 1 shape: a few broad soft cones. Style 5 color: lime valley, tan to brown slopes, white tips.
  26: {
    ...TERRAIN_OPTIONS[11],
    kind: "stylized",
    look: "softCone",
    cameraElevation: 42,
    fit: 1.2,
    stylized: {
      divisions: 32,
      sigma: 14,
      rangeSigma: 700,
      laplacian: 0.08,
      sheet: 0.28, // keep a low valley sheet so the cones can stand up
      valleyMeters: 4000,
      style: "miniature",
      smoothShading: true,
      coneRadius: 4.5,
      conePower: 1.75,
      meterStops: [2600, 3600, 4400, 5200, 6000, 6600, 7200, 8000],
    },
  },
  // Whole map at the sharper ridge from preview 47. Color is still 24's, and not final.
  48: {
    ...TERRAIN_OPTIONS[11],
    kind: "stylized",
    look: "mapGold",
    grid: 280,
    exaggeration: 2.6,
    cameraElevation: 36,
    fit: 1.1,
    stylized: {
      relief: true,
      style: "mapGold",
      smoothShading: true,
      meterStops: [2800, 3500, 4200, 5200, 6800, 7600],
    },
  },
});
LOOKS.satCrispSoftFaces = {
  ...LOOKS.satCrisp,
  imageryGrade: { slopeBlur: { blur: 16, slopeStart: 14, slopeFull: 28 } }, // blur in texture px, slopes in degrees
};
Object.assign(LOOKS, {
  celRange: {
    side: "#49633a",
    sideGlow: "#25351f",
    background: "#dcebd7",
    light: { hemiSky: "#f6fff1", hemiGround: "#58734b", hemiIntensity: 1.65, sunColor: "#fffbe0", sunIntensity: 1.5, sunDirection: [-0.9, 1.25, 0.45] },
  },
  softAnimated: {
    side: "#71856d",
    sideGlow: "#465947",
    background: "#e8f0e5",
    haze: { color: "#dfe9e0", near: 1.05, far: 1.72 },
    light: { hemiSky: "#fbfff8", hemiGround: "#829681", hemiIntensity: 2.0, sunColor: "#fff8dd", sunIntensity: 0.85, sunDirection: [-0.8, 1.3, 0.5] },
  },
  graphicLowPoly: {
    side: "#435534",
    sideGlow: "#25301f",
    background: "#d8e7cf",
    light: { hemiSky: "#ffffff", hemiGround: "#607255", hemiIntensity: 2.05, sunColor: "#fff7d8", sunIntensity: 0.7, sunDirection: [-0.9, 1.2, 0.45] },
  },
  illustratedRelief: {
    side: "#526459",
    sideGlow: "#2f3b35",
    background: "linear-gradient(180deg, #edf4ef 0%, #d5e4dc 100%)",
    haze: { color: "#dce7e1", near: 1.12, far: 1.8 },
    light: { hemiSky: "#fbfffc", hemiGround: "#64776e", hemiIntensity: 1.7, sunColor: "#fffbe9", sunIntensity: 1.05, sunDirection: [-0.9, 1.25, 0.45] },
  },
  softCone: {
    side: "#8a6240",
    sideGlow: "#3e2918",
    background: "#f6f7f4",
    light: {
      hemiSky: "#fffdf8",
      hemiGround: "#8fa06a",
      hemiIntensity: 1.9,
      sunColor: "#fff4e0",
      sunIntensity: 1.25,
      sunDirection: [-0.8, 1.4, 0.35],
    },
  },
  mapGold: {
    side: "#14331c",
    sideGlow: "#0c2414",
    background: "#f3f6f2",
    light: {
      hemiSky: "#fffdf8",
      hemiGround: "#6d8a48",
      hemiIntensity: 1.7,
      sunColor: "#fff6e4",
      sunIntensity: 1.35,
      sunDirection: [-0.85, 1.3, 0.4],
    },
  },
});

// Unknown or unfinished ?terrain values fall back to option 11, never to the blank default.
const TERRAIN_OPTION = TERRAIN_OPTIONS[REQUESTED_TERRAIN]
  ? REQUESTED_TERRAIN
  : REQUESTED_TERRAIN
  ? 11
  : 11;
const ACTIVE_OPTION = TERRAIN_OPTIONS[TERRAIN_OPTION] || {};
const LOOK = LOOKS[ACTIVE_OPTION.look] || (ACTIVE_OPTION.topo ? TOPO_LOOK : ICE_LOOK);
const ROUTE_STYLE = { ...ROUTE, ...(LOOK.route || {}) };
const DISC_STYLE = { ...DISC, ...(LOOK.disc || {}) };
const TILT = LOOK.tiltShift === true ? { height: "36%", blur: 4 } : LOOK.tiltShift;
// -----------------------------------------------------------------------------

const TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const TILE = 256;

const lngToPx = (lng, z) => ((lng + 180) / 360) * TILE * 2 ** z;
const latToPx = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * 2 ** z;
};

const squareArea = () => {
  const lat = (AREA.south + AREA.north) / 2;
  const lng = (AREA.west + AREA.east) / 2;
  const kmLat = (AREA.north - AREA.south) * 111.32;
  const kmLng = (AREA.east - AREA.west) * 111.32 * Math.cos((lat * Math.PI) / 180);
  const km = Math.max(kmLat, kmLng);
  const halfLat = km / 111.32 / 2;
  const halfLng = km / (111.32 * Math.cos((lat * Math.PI) / 180)) / 2;
  return {
    south: lat - halfLat,
    north: lat + halfLat,
    west: lng - halfLng,
    east: lng + halfLng,
    metersPerUnit: (km * 1000) / SLAB_WIDTH,
  };
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Stitches terrarium tiles for the area and returns an elevation(lng, lat) sampler.
const loadElevation = async (area) => {
  const z = DEM_ZOOM;
  const x0 = Math.floor(lngToPx(area.west, z) / TILE);
  const x1 = Math.floor(lngToPx(area.east, z) / TILE);
  const y0 = Math.floor(latToPx(area.north, z) / TILE);
  const y1 = Math.floor(latToPx(area.south, z) / TILE);
  const cols = x1 - x0 + 1;
  const rows = y1 - y0 + 1;
  const canvas = document.createElement("canvas");
  canvas.width = cols * TILE;
  canvas.height = rows * TILE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const jobs = [];
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      jobs.push(
        loadImage(`${TERRARIUM}/${z}/${tx}/${ty}.png`).then((img) =>
          ctx.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE),
        ),
      );
    }
  }
  await Promise.all(jobs);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const at = (px, py) => {
    const x = Math.min(width - 1, Math.max(0, px));
    const y = Math.min(height - 1, Math.max(0, py));
    const i = (y * width + x) * 4;
    return data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
  };
  return (lng, lat) => {
    const px = lngToPx(lng, z) - x0 * TILE;
    const py = latToPx(lat, z) - y0 * TILE;
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const fx = px - ix;
    const fy = py - iy;
    const top = at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx;
    const bottom = at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
};

// Deterministic jitter so the facets do not reshuffle on every mount.
const seededRandom = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// Fine elevation raster over the slab, used to pick TIN vertices and measure error.
const buildRaster = (area, elevation) => {
  const n = RASTER;
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const toLngLat = (x, zz) => [
    area.west + ((x + half) / SLAB_WIDTH) * (area.east - area.west),
    area.north - ((zz + half) / SLAB_WIDTH) * (area.north - area.south),
  ];
  const data = new Float32Array(n * n);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const e = elevation(...toLngLat(-half + (i + 0.5) * cell, -half + (j + 0.5) * cell));
      data[j * n + i] = e;
      min = Math.min(min, e);
      max = Math.max(max, e);
    }
  }
  const at = (i, j) => data[Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))];
  return {
    n,
    cell,
    data,
    min,
    max,
    at,
    xOf: (i) => -half + (i + 0.5) * cell,
    zOf: (j) => -half + (j + 0.5) * cell,
    indexOf: (v) => Math.floor((v + half) / cell),
    elevAt: (x, zz) => elevation(...toLngLat(x, zz)),
  };
};

const pointSet = () => {
  const points = [];
  const add = (x, zz, e, minDist = 0) => {
    const half = SLAB_WIDTH / 2;
    const onBorder = Math.abs(Math.abs(x) - half) < 1e-6 || Math.abs(Math.abs(zz) - half) < 1e-6;
    if (!onBorder && (Math.abs(x) > half - 1 || Math.abs(zz) > half - 1)) return false;
    if (minDist && points.some((p) => (p.x - x) ** 2 + (p.z - zz) ** 2 < minDist * minDist)) {
      return false;
    }
    points.push({ x, z: zz, e });
    return true;
  };
  return { points, add };
};

const addBorder = (set, raster, count) => {
  const half = SLAB_WIDTH / 2;
  for (let k = 0; k < count; k += 1) {
    const t = -half + (k / count) * SLAB_WIDTH;
    [
      [t, -half],
      [half, t],
      [-t, half],
      [-half, -t],
    ].forEach(([x, zz]) => set.add(x, zz, raster.elevAt(x, zz)));
  }
};

// Summits: local maxima ranked by how far they rise above their surroundings.
const findPeaks = (raster, count, minSep) => {
  const { n, at } = raster;
  const r = 5;
  const candidates = [];
  for (let j = r; j < n - r; j += 1) {
    for (let i = r; i < n - r; i += 1) {
      const e = at(i, j);
      let isMax = true;
      for (let dj = -r; dj <= r && isMax; dj += 1) {
        for (let di = -r; di <= r; di += 1) {
          if ((di || dj) && at(i + di, j + dj) > e) {
            isMax = false;
            break;
          }
        }
      }
      if (!isMax) continue;
      let ring = 0;
      for (let k = 0; k < 16; k += 1) {
        const a = (k / 16) * Math.PI * 2;
        ring += at(Math.round(i + Math.cos(a) * r * 2.5), Math.round(j + Math.sin(a) * r * 2.5));
      }
      candidates.push({ x: raster.xOf(i), z: raster.zOf(j), e, relief: e - ring / 16 });
    }
  }
  candidates.sort((a, b) => b.relief - a.relief);
  const picked = [];
  candidates.forEach((c) => {
    if (picked.length >= count) return;
    if (picked.some((p) => (p.x - c.x) ** 2 + (p.z - c.z) ** 2 < minSep * minSep)) return;
    picked.push(c);
  });
  return picked;
};

// Moves a named summit onto the highest raster cell nearby, so the apex is the real top.
const snapToMax = (raster, x, zz, radius = 4) => {
  const ci = raster.indexOf(x);
  const cj = raster.indexOf(zz);
  let best = { x, z: zz, e: -Infinity };
  for (let dj = -radius; dj <= radius; dj += 1) {
    for (let di = -radius; di <= radius; di += 1) {
      const e = raster.at(ci + di, cj + dj);
      if (e > best.e) best = { x: raster.xOf(ci + di), z: raster.zOf(cj + dj), e };
    }
  }
  return best;
};

// Peak-anchored TIN: summits, passes, stops, route and valley floors, then Delaunay.
const peakPoints = (raster, toWorld, option) => {
  const set = pointSet();
  addBorder(set, raster, option.border);
  const apexes = [];
  (option.named === false ? [] : NAMED_SUMMITS).forEach(([lat, lng]) => {
    const [x, zz] = toWorld(lng, lat);
    if (Math.abs(x) > SLAB_WIDTH / 2 - 2 || Math.abs(zz) > SLAB_WIDTH / 2 - 2) return;
    const top = snapToMax(raster, x, zz);
    if (set.add(top.x, top.z, top.e, 2)) apexes.push(top);
  });
  findPeaks(raster, option.peaks, option.peakSpacing).forEach((p) => {
    if (set.add(p.x, p.z, p.e, option.peakSpacing * 0.8)) apexes.push(p);
  });
  // A ring of low feet around each apex, so every summit stands as its own pyramid.
  apexes.forEach((apex, k) => {
    const nearest = Math.min(
      ...apexes.filter((o) => o !== apex).map((o) => Math.hypot(o.x - apex.x, o.z - apex.z)),
    );
    const radius = Math.min(option.footRadius, Math.max(2.5, nearest * 0.5));
    for (let f = 0; f < option.feet; f += 1) {
      const a = ((f + (k % 2) * 0.5) / option.feet) * Math.PI * 2;
      const fi = raster.indexOf(apex.x + Math.cos(a) * radius);
      const fj = raster.indexOf(apex.z + Math.sin(a) * radius);
      let low = null;
      for (let dj = -2; dj <= 2; dj += 1) {
        for (let di = -2; di <= 2; di += 1) {
          const e = raster.at(fi + di, fj + dj);
          if (!low || e < low.e) low = { x: raster.xOf(fi + di), z: raster.zOf(fj + dj), e };
        }
      }
      if (low.e < apex.e) set.add(low.x, low.z, low.e, 1.8);
    }
  });
  getMarkers().forEach((marker) => {
    const isPass = /\bLa$/.test(marker.properties.name);
    if (!isPass && !option.stops) return;
    const [x, zz] = toWorld(marker.point[1], marker.point[0]);
    set.add(x, zz, raster.elevAt(x, zz), 3);
  });
  if (option.routeSpacing) {
    const routes = getDayWiseDataG();
    Object.values(routes).forEach((route) =>
      (route.features || []).forEach((feature) => {
        if (!feature.geometry || feature.geometry.type !== "MultiLineString") return;
        feature.geometry.coordinates.forEach((part) =>
          part.forEach(([lng, lat]) => {
            const [x, zz] = toWorld(lng, lat);
            set.add(x, zz, raster.elevAt(x, zz), option.routeSpacing);
          }),
        );
      }),
    );
  }
  const m = option.valleyCells;
  const span = raster.n / m;
  for (let cj = 0; cj < m; cj += 1) {
    for (let ci = 0; ci < m; ci += 1) {
      let best = null;
      for (let j = Math.floor(cj * span); j < Math.floor((cj + 1) * span); j += 1) {
        for (let i = Math.floor(ci * span); i < Math.floor((ci + 1) * span); i += 1) {
          const e = raster.at(i, j);
          if (!best || e < best.e) best = { x: raster.xOf(i), z: raster.zOf(j), e };
        }
      }
      set.add(best.x, best.z, best.e, option.valleySpacing);
    }
  }
  return set.points;
};

// Error-driven TIN: keep inserting the raster point the current mesh misses by the most.
const errorPoints = (raster, option) => {
  const set = pointSet();
  addBorder(set, raster, option.border);
  const { n, at } = raster;
  for (let guard = 0; guard < 400; guard += 1) {
    const { triangles } = Delaunator.from(set.points, (p) => p.x, (p) => p.z);
    if (triangles.length / 3 >= option.triangles) break;
    let best = null;
    for (let t = 0; t < triangles.length; t += 3) {
      const p = set.points[triangles[t]];
      const q = set.points[triangles[t + 1]];
      const r = set.points[triangles[t + 2]];
      const det = (q.z - r.z) * (p.x - r.x) + (r.x - q.x) * (p.z - r.z);
      if (Math.abs(det) < 1e-9) continue;
      const i0 = Math.max(0, raster.indexOf(Math.min(p.x, q.x, r.x)));
      const i1 = Math.min(n - 1, raster.indexOf(Math.max(p.x, q.x, r.x)));
      const j0 = Math.max(0, raster.indexOf(Math.min(p.z, q.z, r.z)));
      const j1 = Math.min(n - 1, raster.indexOf(Math.max(p.z, q.z, r.z)));
      for (let j = j0; j <= j1; j += 1) {
        const zz = raster.zOf(j);
        for (let i = i0; i <= i1; i += 1) {
          const x = raster.xOf(i);
          const l1 = ((q.z - r.z) * (x - r.x) + (r.x - q.x) * (zz - r.z)) / det;
          const l2 = ((r.z - p.z) * (x - r.x) + (p.x - r.x) * (zz - r.z)) / det;
          const l3 = 1 - l1 - l2;
          if (l1 < 0 || l2 < 0 || l3 < 0) continue;
          const err = Math.abs(at(i, j) - (l1 * p.e + l2 * q.e + l3 * r.e));
          if (!best || err > best.err) best = { x, z: zz, e: at(i, j), err };
        }
      }
    }
    if (!best || best.err < 15 || !set.add(best.x, best.z, best.e)) break;
  }
  return set.points;
};

const finalizeTerrain = (verts, triangles, toWorld) => {
  const half = SLAB_WIDTH / 2;
  triangles.forEach((t) => {
    const [p, q, r] = t;
    const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
    if (ny < 0) {
      t[1] = r;
      t[2] = q;
    }
  });

  const top = [];
  triangles.forEach((t) => t.forEach((v) => top.push(v[0], v[1], v[2])));

  const base = -SLAB_THICKNESS;
  const side = [];
  const wall = (p, q) => {
    side.push(p[0], p[1], p[2], p[0], base, p[2], q[0], q[1], q[2]);
    side.push(q[0], q[1], q[2], p[0], base, p[2], q[0], base, q[2]);
  };
  const edge = (test, order) => {
    const pts = verts.filter(test).sort(order);
    for (let k = 0; k < pts.length - 1; k += 1) wall(pts[k], pts[k + 1]);
  };
  const on = (a, b) => Math.abs(a - b) < 1e-6;
  edge((v) => on(v[2], -half), (a, b) => b[0] - a[0]); // north
  edge((v) => on(v[2], half), (a, b) => a[0] - b[0]); // south
  edge((v) => on(v[0], -half), (a, b) => a[2] - b[2]); // west
  edge((v) => on(v[0], half), (a, b) => b[2] - a[2]); // east
  side.push(-half, base, -half, half, base, -half, -half, base, half);
  side.push(half, base, -half, half, base, half, -half, base, half);

  // Bucket triangles so surface lookups stay cheap for any triangulation.
  const B = 24;
  const bucketSize = SLAB_WIDTH / B;
  const buckets = Array.from({ length: B * B }, () => []);
  const bucketOf = (v) => Math.min(B - 1, Math.max(0, Math.floor((v + half) / bucketSize)));
  triangles.forEach((t) => {
    const xs = t.map((v) => v[0]);
    const zs = t.map((v) => v[2]);
    for (let j = bucketOf(Math.min(...zs)); j <= bucketOf(Math.max(...zs)); j += 1) {
      for (let i = bucketOf(Math.min(...xs)); i <= bucketOf(Math.max(...xs)); i += 1) {
        buckets[j * B + i].push(t);
      }
    }
  });

  // Height and facet normal of the mesh at (x, z).
  const surfaceAt = (x, zz) => {
    const list = buckets[bucketOf(zz) * B + bucketOf(x)];
    let highest = null;
    for (let k = 0; k < list.length; k += 1) {
      const [p, q, r] = list[k];
      const det = (q[2] - r[2]) * (p[0] - r[0]) + (r[0] - q[0]) * (p[2] - r[2]);
      if (Math.abs(det) < 1e-9) continue;
      const l1 = ((q[2] - r[2]) * (x - r[0]) + (r[0] - q[0]) * (zz - r[2])) / det;
      const l2 = ((r[2] - p[2]) * (x - r[0]) + (p[0] - r[0]) * (zz - r[2])) / det;
      const l3 = 1 - l1 - l2;
      if (l1 >= -1e-6 && l2 >= -1e-6 && l3 >= -1e-6) {
        const y = l1 * p[1] + l2 * q[1] + l3 * r[1];
        if (highest && y <= highest.y) continue;
        const normal = new THREE.Vector3(...q.slice(0, 3))
          .sub(new THREE.Vector3(...p.slice(0, 3)))
          .cross(new THREE.Vector3(...r.slice(0, 3)).sub(new THREE.Vector3(...p.slice(0, 3))))
          .normalize();
        if (normal.y < 0) normal.negate();
        highest = { y, normal };
      }
    }
    return highest || { y: 0, normal: new THREE.Vector3(0, 1, 0) };
  };

  return { top, side, surfaceAt, toWorld, triangles };
};

const buildGrid = (area, elevation, toLngLat) => {
  const n = GRID_CELLS;
  const cell = SLAB_WIDTH / n;
  const half = SLAB_WIDTH / 2;
  const rand = seededRandom(42);
  const verts = [];
  let minElev = Infinity;
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      const interior = i > 0 && i < n && j > 0 && j < n;
      const x = -half + i * cell + (interior ? (rand() - 0.5) * 2 * JITTER * cell : 0);
      const zz = -half + j * cell + (interior ? (rand() - 0.5) * 2 * JITTER * cell : 0);
      let elev = 0;
      const reach = (SMOOTHING * cell) / 2;
      for (let sj = -1; sj <= 1; sj += 1) {
        for (let si = -1; si <= 1; si += 1) {
          const [lng, lat] = toLngLat(x + si * reach, zz + sj * reach);
          elev += elevation(lng, lat) / 9;
        }
      }
      minElev = Math.min(minElev, elev);
      verts.push([x, elev, zz, elev]);
    }
  }
  const scale = EXAGGERATION / area.metersPerUnit;
  verts.forEach((v) => {
    const y = (v[1] - minElev) * scale;
    v[1] = HEIGHT_STEP ? Math.round(y / HEIGHT_STEP) * HEIGHT_STEP : y;
  });

  const idx = (i, j) => j * (n + 1) + i;
  const triangles = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = verts[idx(i, j)];
      const b = verts[idx(i + 1, j)];
      const c = verts[idx(i, j + 1)];
      const d = verts[idx(i + 1, j + 1)];
      // Split along the diagonal that follows the ridge, so crests stay sharp.
      if (Math.abs(a[1] - d[1]) < Math.abs(b[1] - c[1])) {
        triangles.push([a, c, d], [a, d, b]);
      } else {
        triangles.push([a, c, b], [b, c, d]);
      }
    }
  }
  return { verts, triangles };
};

const buildTin = (area, elevation, option, toWorld) => {
  const raster = buildRaster(area, elevation);
  const points = option.kind === "error" ? errorPoints(raster, option) : peakPoints(raster, toWorld, option);
  const range = raster.max - raster.min;
  const height = (e) => {
    let h = Math.max(0, (e - raster.min) / range);
    if (option.shape) h = Math.max(0, (h - option.valleyClamp) / (1 - option.valleyClamp)) ** option.shape;
    return (h * range * option.exaggeration) / area.metersPerUnit;
  };
  const verts = points.map((p) => [p.x, height(p.e), p.z, p.e]);
  const { triangles: ids } = Delaunator.from(points, (p) => p.x, (p) => p.z);
  const triangles = [];
  for (let t = 0; t < ids.length; t += 3) {
    triangles.push([verts[ids[t]], verts[ids[t + 1]], verts[ids[t + 2]]]);
  }
  return { verts, triangles, minElev: raster.min, maxElev: raster.max };
};

const ESRI_IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

// Stitches Esri World Imagery tiles for the area into one canvas.
const loadImagery = async (area, z) => {
  const x0 = Math.floor(lngToPx(area.west, z) / TILE);
  const x1 = Math.floor(lngToPx(area.east, z) / TILE);
  const y0 = Math.floor(latToPx(area.north, z) / TILE);
  const y1 = Math.floor(latToPx(area.south, z) / TILE);
  const canvas = document.createElement("canvas");
  canvas.width = (x1 - x0 + 1) * TILE;
  canvas.height = (y1 - y0 + 1) * TILE;
  const ctx = canvas.getContext("2d");
  const jobs = [];
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      jobs.push(
        loadImage(`${ESRI_IMAGERY}/${z}/${ty}/${tx}`).then((img) =>
          ctx.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE),
        ),
      );
    }
  }
  await Promise.all(jobs);
  return { canvas, z, x0, y0 };
};

const up = () => new THREE.Vector3(0, 1, 0);

const rampColor = (stops, h, out) => {
  let k = 1;
  while (k < stops.length - 1 && h > stops[k][0]) k += 1;
  const [t0, c0] = stops[k - 1];
  const [t1, c1] = stops[k];
  return out.copy(c0).lerp(c1, Math.min(1, Math.max(0, (h - t0) / (t1 - t0))));
};

// DEM on a regular grid with vertices exactly on the slab edges.
const sampleGrid = (elevation, toLngLat, n, blur = 0) => {
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const E = new Float32Array((n + 1) * (n + 1));
  let min = Infinity;
  let max = -Infinity;
  const sample = (x, zz) => {
    if (!blur) return elevation(...toLngLat(x, zz));
    let sum = 0;
    for (let sj = -1; sj <= 1; sj += 1) {
      for (let si = -1; si <= 1; si += 1) {
        sum += elevation(...toLngLat(x + si * blur, zz + sj * blur));
      }
    }
    return sum / 9;
  };
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      const e = sample(-half + i * cell, -half + j * cell);
      E[j * (n + 1) + i] = e;
      min = Math.min(min, e);
      max = Math.max(max, e);
    }
  }
  const at = (i, j) => E[j * (n + 1) + i];
  // Same diagonal split as the meshes built from this grid.
  const elevAt = (x, zz) => {
    const u = Math.min(n - 1e-6, Math.max(0, (x + half) / cell));
    const v = Math.min(n - 1e-6, Math.max(0, (zz + half) / cell));
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = u - i;
    const fv = v - j;
    const a = at(i, j);
    const b = at(i + 1, j);
    const c = at(i, j + 1);
    const d = at(i + 1, j + 1);
    return fv >= fu ? a + fu * (d - c) + fv * (c - a) : a + fu * (b - a) + fv * (d - b);
  };
  return { n, cell, half, min, max, at, elevAt };
};

// Option 6: flat plates every `step` meters with vertical risers, like a laser-cut model.
const buildTerrace = (area, elevation, option, toWorld, toLngLat) => {
  const g = sampleGrid(elevation, toLngLat, option.grid, option.blur);
  const { n, cell, half, min } = g;
  const step = option.step;
  const scale = option.exaggeration / area.metersPerUnit;
  const levelOf = (e) => Math.max(0, Math.floor((e - min) / step));
  const yOf = (k) => k * step * scale;
  const tones = LOOK.layers.map((hex) => new THREE.Color(hex));
  const edgeTones = tones.map((c) => c.clone().multiplyScalar(0.8));
  const baseTone = new THREE.Color(LOOK.baseTone);

  const positions = [];
  const colors = [];
  const push = (x, y, zz, color) => {
    positions.push(x, y, zz);
    colors.push(color.r, color.g, color.b);
  };
  const quad = (p, q, y0, y1, color, out = push) => {
    out(p.x, y0, p.z, color);
    out(p.x, y1, p.z, color);
    out(q.x, y1, q.z, color);
    out(p.x, y0, p.z, color);
    out(q.x, y1, q.z, color);
    out(q.x, y0, q.z, color);
  };
  const lerp = (p, q, level) => {
    const t = (level - p.e) / (q.e - p.e);
    return { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t, e: level };
  };
  const clip = (poly, level, keepAbove) => {
    const out = [];
    for (let k = 0; k < poly.length; k += 1) {
      const p = poly[k];
      const q = poly[(k + 1) % poly.length];
      const pin = keepAbove ? p.e >= level : p.e < level;
      const qin = keepAbove ? q.e >= level : q.e < level;
      if (pin) out.push(p);
      if (pin !== qin) out.push(lerp(p, q, level));
    }
    return out;
  };
  const triangle = (a, b, c) => {
    const k0 = levelOf(Math.min(a.e, b.e, c.e));
    const k1 = levelOf(Math.max(a.e, b.e, c.e));
    for (let k = k0; k <= k1; k += 1) {
      let poly = [a, b, c];
      if (k > k0) poly = clip(poly, min + k * step, true);
      if (k < k1) poly = clip(poly, min + (k + 1) * step, false);
      const y = yOf(k);
      const color = tones[k % tones.length];
      for (let t = 1; t < poly.length - 1; t += 1) {
        push(poly[0].x, y, poly[0].z, color);
        push(poly[t].x, y, poly[t].z, color);
        push(poly[t + 1].x, y, poly[t + 1].z, color);
      }
    }
    for (let k = k0 + 1; k <= k1; k += 1) {
      const level = min + k * step;
      const cuts = [];
      [
        [a, b],
        [b, c],
        [c, a],
      ].forEach(([p, q]) => {
        if ((p.e - level) * (q.e - level) < 0) cuts.push(lerp(p, q, level));
      });
      if (cuts.length === 2) quad(cuts[0], cuts[1], yOf(k - 1), yOf(k), edgeTones[k % edgeTones.length]);
    }
  };
  const vertex = (i, j) => ({ x: -half + i * cell, z: -half + j * cell, e: g.at(i, j) });
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = vertex(i, j);
      const b = vertex(i + 1, j);
      const c = vertex(i, j + 1);
      const d = vertex(i + 1, j + 1);
      triangle(a, c, d);
      triangle(a, d, b);
    }
  }

  // Slab edges show every stacked sheet.
  const sidePositions = [];
  const sideColors = [];
  const sidePush = (x, y, zz, color) => {
    sidePositions.push(x, y, zz);
    sideColors.push(color.r, color.g, color.b);
  };
  const edge = (pts) => {
    for (let k = 0; k < pts.length - 1; k += 1) {
      const p = pts[k];
      const q = pts[k + 1];
      const ts = [0, 1];
      const lo = Math.min(p.e, q.e);
      const hi = Math.max(p.e, q.e);
      for (let level = min + Math.ceil((lo - min) / step) * step; level < hi; level += step) {
        ts.push((level - p.e) / (q.e - p.e));
      }
      ts.sort((s, t) => s - t);
      for (let s = 0; s < ts.length - 1; s += 1) {
        const at = (t) => ({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t });
        const P = at(ts[s]);
        const Q = at(ts[s + 1]);
        const level = levelOf(p.e + (q.e - p.e) * ((ts[s] + ts[s + 1]) / 2));
        quad(P, Q, -SLAB_THICKNESS, 0, baseTone, sidePush);
        for (let l = 1; l <= level; l += 1) {
          quad(P, Q, yOf(l - 1), yOf(l), edgeTones[l % edgeTones.length], sidePush);
        }
      }
    }
  };
  const row = (fn) => Array.from({ length: n + 1 }, (_, k) => fn(k));
  edge(row((k) => vertex(k, 0)));
  edge(row((k) => vertex(k, n)));
  edge(row((k) => vertex(0, k)));
  edge(row((k) => vertex(n, k)));

  const meshOf = (pos, col) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geometry.computeVertexNormals();
    return new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    );
  };
  const plates = meshOf(positions, colors);
  return {
    meshes: [plates, meshOf(sidePositions, sideColors)],
    pickMesh: plates,
    surfaceAt: (x, zz) => ({ y: yOf(levelOf(g.elevAt(x, zz))), normal: up() }),
    toWorld,
    minElev: min,
    maxElev: g.max,
    pointCount: (n + 1) * (n + 1),
    faceCount: positions.length / 9,
  };
};

// Option 8: hexagonal prisms extruded to the mean elevation under each hex.
const buildHex = (area, elevation, option, toWorld, toLngLat) => {
  const half = SLAB_WIDTH / 2;
  const w = SLAB_WIDTH / option.across;
  const r = w / Math.sqrt(3);
  const rowStep = 1.5 * r;
  const cells = [];
  for (let j = 0; ; j += 1) {
    const zz = -half + r + j * rowStep;
    if (zz > half - r * 0.5) break;
    const offset = (j % 2) * (w / 2);
    for (let i = 0; ; i += 1) {
      const x = -half + w / 2 + offset + i * w;
      if (x > half - w * 0.3) break;
      let e = elevation(...toLngLat(x, zz));
      for (let k = 0; k < 6; k += 1) {
        const a = (k / 6) * Math.PI * 2;
        e += elevation(...toLngLat(x + Math.cos(a) * r * 0.55, zz + Math.sin(a) * r * 0.55));
      }
      cells.push({ i, j, x, z: zz, e: e / 7 });
    }
  }
  const min = Math.min(...cells.map((c) => c.e));
  const max = Math.max(...cells.map((c) => c.e));
  const scale = option.exaggeration / area.metersPerUnit;
  const base = -SLAB_THICKNESS;
  const geometry = new THREE.CylinderGeometry(r * option.gap, r * option.gap, 1, 6);
  geometry.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshLambertMaterial({ flatShading: true }),
    cells.length,
  );
  const stops = LOOK.ramp.map(([t, hex]) => [t, new THREE.Color(hex)]);
  const color = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const lookup = new Map();
  cells.forEach((cellData, k) => {
    cellData.top = (cellData.e - min) * scale + option.baseHeight;
    matrix.makeScale(1, cellData.top - base, 1).setPosition(cellData.x, base, cellData.z);
    mesh.setMatrixAt(k, matrix);
    mesh.setColorAt(k, rampColor(stops, (cellData.e - min) / (max - min), color));
    lookup.set(`${cellData.j}:${cellData.i}`, cellData);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();

  const surfaceAt = (x, zz) => {
    const j0 = Math.round((zz - (-half + r)) / rowStep);
    let best = null;
    for (let j = j0 - 1; j <= j0 + 1; j += 1) {
      const offset = (((j % 2) + 2) % 2) * (w / 2);
      const i0 = Math.round((x - (-half + w / 2 + offset)) / w);
      for (let i = i0 - 1; i <= i0 + 1; i += 1) {
        const c = lookup.get(`${j}:${i}`);
        if (!c) continue;
        const d = (c.x - x) ** 2 + (c.z - zz) ** 2;
        if (!best || d < best.d) best = { d, c };
      }
    }
    return { y: best ? best.c.top : 0, normal: up() };
  };
  return {
    meshes: [mesh],
    pickMesh: mesh,
    surfaceAt,
    toWorld,
    minElev: min,
    maxElev: max,
    pointCount: cells.length,
    faceCount: cells.length * 8,
  };
};

// Option 9: stacked elevation profiles; each row's curtain hides the rows behind it.
const buildRidges = (area, elevation, option, toWorld, toLngLat) => {
  const g = sampleGrid(elevation, toLngLat, 200);
  const half = SLAB_WIDTH / 2;
  const scale = option.exaggeration / area.metersPerUnit;
  const heightAt = (x, zz) => (g.elevAt(x, zz) - g.min) * scale;
  const linePositions = [];
  const curtain = [];
  const floor = -1;
  for (let row = 0; row < option.rows; row += 1) {
    const zz = -half + ((row + 0.5) / option.rows) * SLAB_WIDTH;
    const cz = zz - 0.08;
    let prev = null;
    for (let k = 0; k <= option.samples; k += 1) {
      const x = -half + (k / option.samples) * SLAB_WIDTH;
      const y = heightAt(x, zz);
      if (prev) {
        linePositions.push(prev.x, prev.y, zz, x, y, zz);
        curtain.push(prev.x, floor, cz, prev.x, prev.y, cz, x, y, cz);
        curtain.push(prev.x, floor, cz, x, y, cz, x, floor, cz);
      }
      prev = { x, y };
    }
  }
  const lineGeometry = new LineSegmentsGeometry();
  lineGeometry.setPositions(linePositions);
  const lineMaterial = new LineMaterial({ color: LOOK.ridge, linewidth: option.lineWidth });
  const curtainGeometry = new THREE.BufferGeometry();
  curtainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(curtain, 3));
  const curtainMesh = new THREE.Mesh(
    curtainGeometry,
    new THREE.MeshBasicMaterial({ color: LOOK.curtain, side: THREE.DoubleSide }),
  );
  return {
    meshes: [curtainMesh, new LineSegments2(lineGeometry, lineMaterial)],
    pickMesh: null,
    lineMaterials: [lineMaterial],
    surfaceAt: (x, zz) => ({ y: heightAt(x, zz), normal: up() }),
    toWorld,
    minElev: g.min,
    maxElev: g.max,
    pointCount: option.rows * (option.samples + 1),
    faceCount: curtain.length / 9,
  };
};

// Option 11's regular grid; heights come straight from E.
const gridSurface = (E, n) => {
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const verts = [];
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) verts.push([-half + i * cell, 0, -half + j * cell, E[j * (n + 1) + i]]);
  }
  const index = [];
  const idx = (i, j) => j * (n + 1) + i;
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = idx(i, j);
      const b = idx(i + 1, j);
      const c = idx(i, j + 1);
      const d = idx(i + 1, j + 1);
      index.push(a, c, d, a, d, b);
    }
  }
  return { verts, index };
};

const gaussianGrid = (E, size, sigma) => {
  const radius = Math.ceil(sigma * 3);
  const kernel = [];
  for (let k = -radius; k <= radius; k += 1) kernel.push(Math.exp(-(k * k) / (2 * sigma * sigma)));
  const pass = (src, horizontal) => {
    const out = new Float32Array(src.length);
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        let sum = 0;
        let weight = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const ii = horizontal ? i + k : i;
          const jj = horizontal ? j : j + k;
          if (ii < 0 || jj < 0 || ii >= size || jj >= size) continue;
          const w = kernel[k + radius];
          sum += src[jj * size + ii] * w;
          weight += w;
        }
        out[j * size + i] = sum / weight;
      }
    }
    return out;
  };
  return pass(pass(E, true), false);
};

// Separable bilateral blur removes small gullies without washing major ridges
// across their elevation boundary.
const bilateralGrid = (E, size, sigma, rangeSigma) => {
  const radius = Math.ceil(sigma * 2.5);
  const spatial = Array.from({ length: radius * 2 + 1 }, (_, k) => {
    const d = k - radius;
    return Math.exp(-(d * d) / (2 * sigma * sigma));
  });
  const pass = (src, horizontal) => {
    const out = new Float32Array(src.length);
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        const center = src[j * size + i];
        let sum = 0;
        let weight = 0;
        for (let d = -radius; d <= radius; d += 1) {
          const ii = horizontal ? i + d : i;
          const jj = horizontal ? j : j + d;
          if (ii < 0 || jj < 0 || ii >= size || jj >= size) continue;
          const value = src[jj * size + ii];
          const delta = value - center;
          const w = spatial[d + radius] * Math.exp(-(delta * delta) / (2 * rangeSigma * rangeSigma));
          sum += value * w;
          weight += w;
        }
        out[j * size + i] = sum / weight;
      }
    }
    return out;
  };
  return pass(pass(E, true), false);
};

// Smooth the open slopes, keep peaks, ridgelines and passes at their original heights.
const ridgePreservingSmooth = (E, size, cfg) => {
  const S = gaussianGrid(E, size, cfg.sigma);
  const at = (i, j) => E[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  const k = 2;
  let W = new Float32Array(E.length);
  const isMax = new Uint8Array(E.length);
  for (let j = 0; j < size; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const e = at(i, j);
      // Convexity across the strongest direction: high on crests and across passes.
      const ridge = Math.max(
        e - (at(i - k, j) + at(i + k, j)) / 2,
        e - (at(i, j - k) + at(i, j + k)) / 2,
        e - (at(i - k, j - k) + at(i + k, j + k)) / 2,
        e - (at(i - k, j + k) + at(i + k, j - k)) / 2,
      );
      const t = Math.min(1, Math.max(0, (ridge - cfg.ridgeStart) / (cfg.ridgeFull - cfg.ridgeStart)));
      W[j * size + i] = t * t * (3 - 2 * t);
      // Only prominent summits are pinned; minor bumps on slopes would become needles.
      let top = e - S[j * size + i] >= cfg.ridgeStart;
      for (let dj = -2; dj <= 2 && top; dj += 1) {
        for (let di = -2; di <= 2; di += 1) {
          if ((di || dj) && at(i + di, j + dj) > e) {
            top = false;
            break;
          }
        }
      }
      isMax[j * size + i] = top ? 1 : 0;
    }
  }
  W = gaussianGrid(W, size, 1.5);
  // A short cone of original height around each pinned summit keeps it a peak, not a spike.
  for (let p = 0; p < E.length; p += 1) {
    if (!isMax[p]) continue;
    const pi = p % size;
    const pj = Math.floor(p / size);
    for (let dj = -3; dj <= 3; dj += 1) {
      for (let di = -3; di <= 3; di += 1) {
        const i = pi + di;
        const j = pj + dj;
        if (i < 0 || j < 0 || i >= size || j >= size) continue;
        const q = j * size + i;
        W[q] = Math.max(W[q], 1 - Math.hypot(di, dj) / 3.5);
      }
    }
  }
  const out = new Float32Array(E.length);
  for (let p = 0; p < E.length; p += 1) {
    const w = isMax[p] ? 1 : W[p];
    out[p] = w * E[p] + (1 - w) * S[p];
  }
  return out;
};

// Greedy TIN of option 11's grid: seeded with 11's summit vertices at their exact
// heights, then the worst-fit grid point is added until the triangle budget is met.
const tinSurface = (E, n, cfg, toWorld) => {
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const size = n + 1;
  const at = (i, j) => E[j * size + i];
  const pts = [];
  const taken = new Set();
  const add = (i, j) => {
    const key = j * size + i;
    if (taken.has(key)) return false;
    taken.add(key);
    pts.push({ i, j, x: -half + i * cell, z: -half + j * cell, e: at(i, j) });
    return true;
  };
  for (let k = 0; k <= n; k += 10) {
    const m = Math.min(k, n);
    add(m, 0);
    add(m, n);
    add(0, m);
    add(n, m);
  }
  add(n, n);
  NAMED_SUMMITS.forEach(([lat, lng]) => {
    const [x, zz] = toWorld(lng, lat);
    const ci = Math.round((x + half) / cell);
    const cj = Math.round((zz + half) / cell);
    if (ci < 4 || cj < 4 || ci > n - 4 || cj > n - 4) return;
    let best = null;
    for (let dj = -4; dj <= 4; dj += 1) {
      for (let di = -4; di <= 4; di += 1) {
        if (!best || at(ci + di, cj + dj) > at(best[0], best[1])) best = [ci + di, cj + dj];
      }
    }
    add(best[0], best[1]);
  });
  const maxima = [];
  for (let j = 3; j < size - 3; j += 1) {
    for (let i = 3; i < size - 3; i += 1) {
      const e = at(i, j);
      let top = true;
      for (let dj = -3; dj <= 3 && top; dj += 1) {
        for (let di = -3; di <= 3; di += 1) {
          if ((di || dj) && at(i + di, j + dj) > e) {
            top = false;
            break;
          }
        }
      }
      if (top) maxima.push([i, j, e]);
    }
  }
  maxima.sort((a, b) => b[2] - a[2]);
  maxima.slice(0, cfg.summits).forEach(([i, j]) => add(i, j));

  let triangles = Delaunator.from(pts, (p) => p.i, (p) => p.j).triangles;
  for (let guard = 0; guard < 2000 && triangles.length / 3 < cfg.triangles; guard += 1) {
    let worst = null;
    for (let t = 0; t < triangles.length; t += 3) {
      const p = pts[triangles[t]];
      const q = pts[triangles[t + 1]];
      const r = pts[triangles[t + 2]];
      const det = (q.j - r.j) * (p.i - r.i) + (r.i - q.i) * (p.j - r.j);
      if (Math.abs(det) < 1e-9) continue;
      for (let j = Math.min(p.j, q.j, r.j); j <= Math.max(p.j, q.j, r.j); j += 1) {
        for (let i = Math.min(p.i, q.i, r.i); i <= Math.max(p.i, q.i, r.i); i += 1) {
          const l1 = ((q.j - r.j) * (i - r.i) + (r.i - q.i) * (j - r.j)) / det;
          const l2 = ((r.j - p.j) * (i - r.i) + (p.i - r.i) * (j - r.j)) / det;
          const l3 = 1 - l1 - l2;
          if (l1 < 0 || l2 < 0 || l3 < 0) continue;
          const err = Math.abs(at(i, j) - (l1 * p.e + l2 * q.e + l3 * r.e));
          if (!worst || err > worst[2]) worst = [i, j, err];
        }
      }
    }
    if (!worst || !add(worst[0], worst[1])) break;
    triangles = Delaunator.from(pts, (p) => p.i, (p) => p.j).triangles;
  }

  const verts = pts.map((p) => [p.x, 0, p.z, p.e]);
  const index = Array.from(triangles);
  for (let t = 0; t < index.length; t += 3) {
    const p = verts[index[t]];
    const q = verts[index[t + 1]];
    const r = verts[index[t + 2]];
    const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
    if (ny < 0) [index[t + 1], index[t + 2]] = [index[t + 2], index[t + 1]];
  }
  return { verts, index };
};

// A connected coarse terrain sheet derived from option 11's DEM. Major summits
// restore a broad 3x3 neighborhood after smoothing, avoiding both lost height and
// single-vertex needles.
// Preview 47's ridges, on the whole map. Same mountain count as 24, just less round.
const RELIEF_PEAKS = [
  [27.9881, 86.925],
  [27.9617, 86.9333],
  [27.9675, 86.8867],
  [28.015, 86.8281],
  [27.8617, 86.8614],
  [27.8975, 86.7856],
  [27.9183, 86.7672],
  [27.7867, 86.7889],
  [27.7964, 86.8136],
];

const reliefSurface = (E, n, toWorld) => {
  const size = n + 1;
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const px = size / 658;
  const blur = (src, sigma) => gaussianGrid(src, size, Math.max(0.65, sigma * px));
  const base = blur(E, 8);
  const far = blur(base, 12);
  const near = blur(base, 4.5);
  const weight = new Float32Array(size * size);
  const crown = Math.max(2.2, 10 * px);
  RELIEF_PEAKS.forEach(([lat, lng]) => {
    const [x, z] = toWorld(lng, lat);
    const ci = Math.round((x + half) / cell);
    const cj = Math.round((z + half) / cell);
    let bi = ci;
    let bj = cj;
    let best = -Infinity;
    for (let dj = -6; dj <= 6; dj += 1) {
      for (let di = -6; di <= 6; di += 1) {
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i >= size || j >= size) continue;
        const e = base[j * size + i];
        if (e > best) {
          best = e;
          bi = i;
          bj = j;
        }
      }
    }
    const reach = Math.ceil(crown * 4);
    for (let dj = -reach; dj <= reach; dj += 1) {
      for (let di = -reach; di <= reach; di += 1) {
        const i = bi + di;
        const j = bj + dj;
        if (i < 0 || j < 0 || i >= size || j >= size) continue;
        const w = Math.exp(-(di * di + dj * dj) / (2 * crown * crown));
        const q = j * size + i;
        if (w > weight[q]) weight[q] = w;
      }
    }
  });
  const fused = new Float32Array(size * size);
  for (let p = 0; p < fused.length; p += 1) fused[p] = far[p] * (1 - weight[p]) + near[p] * weight[p];
  const broad = blur(fused, 3.2);
  const steep = new Float32Array(size * size);
  for (let p = 0; p < steep.length; p += 1) steep[p] = fused[p] + 2.8 * (fused[p] - broad[p]);
  const out = steep;
  const verts = [];
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      verts.push([-half + i * cell, 0, -half + j * cell, out[j * size + i]]);
    }
  }
  const index = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const a = j * size + i;
      const b = a + 1;
      const c = a + size;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  return { verts, index };
};

const stylizedSurface = (E, n, cfg, toWorld) => {
  if (cfg.relief) return reliefSurface(E, n, toWorld);
  const size = n + 1;
  const half = SLAB_WIDTH / 2;
  const smooth = bilateralGrid(E, size, cfg.sigma, cfg.rangeSigma);
  const sourceAt = (source, i, j) =>
    source[Math.min(n, Math.max(0, j)) * size + Math.min(n, Math.max(0, i))];
  const sample = (source, x, z) => {
    const u = ((x + half) / SLAB_WIDTH) * n;
    const v = ((z + half) / SLAB_WIDTH) * n;
    const i = Math.min(n - 1, Math.max(0, Math.floor(u)));
    const j = Math.min(n - 1, Math.max(0, Math.floor(v)));
    const fx = u - i;
    const fz = v - j;
    const a = sourceAt(source, i, j) * (1 - fx) + sourceAt(source, i + 1, j) * fx;
    const b = sourceAt(source, i, j + 1) * (1 - fx) + sourceAt(source, i + 1, j + 1) * fx;
    return a * (1 - fz) + b * fz;
  };
  const divisions = cfg.divisions;
  const verts = [];
  for (let j = 0; j <= divisions; j += 1) {
    for (let i = 0; i <= divisions; i += 1) {
      const x = -half + (i / divisions) * SLAB_WIDTH;
      const z = -half + (j / divisions) * SLAB_WIDTH;
      verts.push([x, 0, z, sample(smooth, x, z)]);
    }
  }
  const outIndex = (i, j) => j * (divisions + 1) + i;
  if (cfg.laplacian) {
    const heights = verts.map((v) => v[3]);
    for (let j = 1; j < divisions; j += 1) {
      for (let i = 1; i < divisions; i += 1) {
        const k = outIndex(i, j);
        const average =
          (heights[outIndex(i - 1, j)] +
            heights[outIndex(i + 1, j)] +
            heights[outIndex(i, j - 1)] +
            heights[outIndex(i, j + 1)]) /
          4;
        verts[k][3] += (average - verts[k][3]) * cfg.laplacian;
      }
    }
  }
  if (cfg.sheet != null) {
    const floor = cfg.valleyMeters;
    verts.forEach((v) => {
      if (v[3] > floor) v[3] = floor + (v[3] - floor) * cfg.sheet;
    });
  }
  const sourceCell = SLAB_WIDTH / n;
  FOLD_MAIN.forEach(([lat, lng]) => {
    const [sx, sz] = toWorld(lng, lat);
    const ci = Math.round(((sx + half) / SLAB_WIDTH) * n);
    const cj = Math.round(((sz + half) / SLAB_WIDTH) * n);
    let peak = { e: -Infinity, x: sx, z: sz };
    const searchRadius = Math.ceil(1.5 / sourceCell);
    for (let dj = -searchRadius; dj <= searchRadius; dj += 1) {
      for (let di = -searchRadius; di <= searchRadius; di += 1) {
        if (Math.hypot(di, dj) * sourceCell > 1.5) continue;
        const e = sourceAt(E, ci + di, cj + dj);
        if (e > peak.e) peak = { e, x: -half + (ci + di) * sourceCell, z: -half + (cj + dj) * sourceCell };
      }
    }
    const oi = Math.min(divisions - 1, Math.max(1, Math.round(((peak.x + half) / SLAB_WIDTH) * divisions)));
    const oj = Math.min(divisions - 1, Math.max(1, Math.round(((peak.z + half) / SLAB_WIDTH) * divisions)));
    if (cfg.coneRadius) {
      // Broad cone: full summit height at the center, eased back to the smooth sheet.
      const radius = cfg.coneRadius;
      const power = cfg.conePower || 1.5;
      for (let dj = -radius; dj <= radius; dj += 1) {
        for (let di = -radius; di <= radius; di += 1) {
          const dist = Math.hypot(di, dj);
          if (dist > radius) continue;
          const ii = oi + di;
          const jj = oj + dj;
          if (ii < 0 || jj < 0 || ii > divisions || jj > divisions) continue;
          const falloff = Math.cos((dist / radius) * Math.PI * 0.5) ** power;
          const v = verts[outIndex(ii, jj)];
          v[3] = Math.max(v[3], v[3] + (peak.e - v[3]) * falloff);
        }
      }
    } else {
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let di = -1; di <= 1; di += 1) {
          const v = verts[outIndex(oi + di, oj + dj)];
          const falloff = 1 - Math.hypot(di, dj) / 2;
          const original = sample(E, v[0], v[2]);
          v[3] = Math.max(v[3], v[3] + (original - v[3]) * falloff);
        }
      }
      const apex = verts[outIndex(oi, oj)];
      apex[0] = peak.x;
      apex[2] = peak.z;
      apex[3] = peak.e;
    }
  });
  const index = [];
  for (let j = 0; j < divisions; j += 1) {
    for (let i = 0; i < divisions; i += 1) {
      const a = outIndex(i, j);
      const b = outIndex(i + 1, j);
      const c = outIndex(i, j + 1);
      const d = outIndex(i + 1, j + 1);
      if ((i + j) % 2) index.push(a, c, b, b, c, d);
      else index.push(a, c, d, a, d, b);
    }
  }
  return { verts, index };
};

// Paper-fold peaks: a near-flat map sheet in the valleys with tall pyramids at the main
// summits. Each apex is 11's exact summit vertex; a ring of floor points at a radius set
// by the face slope gives it a broad base, and cols join neighboring summits into massifs.
const foldSurface = (E, n, cfg, toWorld, scale) => {
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const size = n + 1;
  const clampIdx = (v) => Math.min(n, Math.max(0, v));
  const at = (i, j) => E[clampIdx(j) * size + clampIdx(i)];
  const idxOf = (v) => Math.round((v + half) / cell);
  const eAt = (x, zz) => at(idxOf(x), idxOf(zz));
  let vmin = Infinity;
  E.forEach((e) => {
    vmin = Math.min(vmin, e);
  });
  const flatten = (e) => vmin + (e - vmin) * cfg.floorKeep;
  const floorAt = (x, zz) => {
    const ci = idxOf(x);
    const cj = idxOf(zz);
    let low = Infinity;
    for (let dj = -cfg.floorRadius; dj <= cfg.floorRadius; dj += 1) {
      for (let di = -cfg.floorRadius; di <= cfg.floorRadius; di += 1) low = Math.min(low, at(ci + di, cj + dj));
    }
    return flatten(low);
  };
  const inside = (x, zz) => Math.abs(x) <= half - 0.5 && Math.abs(zz) <= half - 0.5;
  const pts = [];
  const add = (x, zz, e, minDist = 0) => {
    if (minDist && pts.some((p) => (p.x - x) ** 2 + (p.z - zz) ** 2 < minDist * minDist)) return null;
    const p = { x, z: zz, e };
    pts.push(p);
    return p;
  };

  // Summits: the highest option 11 vertex within 1.5 world units, so heights match 11 exactly.
  const apexes = [];
  const addApex = (i, j) => {
    const x = -half + i * cell;
    const zz = -half + j * cell;
    if (!inside(x, zz) || apexes.some((a) => (a.x - x) ** 2 + (a.z - zz) ** 2 < 9)) return;
    const p = add(x, zz, at(i, j));
    if (p) apexes.push(p);
  };
  cfg.summits.forEach(([lat, lng]) => {
    const [x, zz] = toWorld(lng, lat);
    const ci = idxOf(x);
    const cj = idxOf(zz);
    const r = Math.ceil(1.5 / cell);
    let best = null;
    for (let dj = -r; dj <= r; dj += 1) {
      for (let di = -r; di <= r; di += 1) {
        if ((di * cell) ** 2 + (dj * cell) ** 2 > 2.25) continue;
        if (!best || at(ci + di, cj + dj) > at(best[0], best[1])) best = [ci + di, cj + dj];
      }
    }
    addApex(best[0], best[1]);
  });
  if (cfg.autoPeaks) {
    const maxima = [];
    for (let j = 6; j < size - 6; j += 1) {
      for (let i = 6; i < size - 6; i += 1) {
        const e = at(i, j);
        let top = true;
        for (let dj = -6; dj <= 6 && top; dj += 1) {
          for (let di = -6; di <= 6; di += 1) {
            if ((di || dj) && at(i + di, j + dj) > e) {
              top = false;
              break;
            }
          }
        }
        if (top) maxima.push([i, j, e]);
      }
    }
    maxima.sort((a, b) => b[2] - a[2]);
    let added = 0;
    maxima.forEach(([i, j]) => {
      if (added >= cfg.autoPeaks) return;
      const x = -half + i * cell;
      const zz = -half + j * cell;
      if (apexes.some((a) => (a.x - x) ** 2 + (a.z - zz) ** 2 < 100)) return;
      addApex(i, j);
      added += 1;
    });
  }
  const tanSlope = Math.tan((cfg.faceSlope * Math.PI) / 180);
  apexes.forEach((a) => {
    a.radius = Math.max(4, ((a.e - floorAt(a.x, a.z)) * scale) / tanSlope);
  });

  // Cols between neighboring summits, at the lowest real elevation on the line between them.
  apexes.forEach((a, ai) => {
    apexes.slice(ai + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d > cfg.shoulderDist) return;
      let col = null;
      for (let t = 0.2; t <= 0.8; t += 0.05) {
        const x = a.x + (b.x - a.x) * t;
        const zz = a.z + (b.z - a.z) * t;
        const e = eAt(x, zz);
        if (!col || e < col.e) col = { x, z: zz, e };
      }
      if (col && inside(col.x, col.z)) add(col.x, col.z, col.e, 2);
    });
  });

  // Passes and Kala Patthar keep their real heights so the trek climbs onto faces there.
  getMarkers().forEach((marker) => {
    const name = marker.properties.name;
    if (!/\bLa$/.test(name) && name !== "Kala Patthar") return;
    const [x, zz] = toWorld(marker.point[1], marker.point[0]);
    if (inside(x, zz)) add(x, zz, eAt(x, zz), 1.5);
  });

  const nearApex = (x, zz, share) => apexes.some((a) => Math.hypot(a.x - x, a.z - zz) < a.radius * share);
  // Broad bases: a ring of valley-floor points around every apex.
  apexes.forEach((a, k) => {
    for (let r = 0; r < cfg.ring; r += 1) {
      const ang = ((r + (k % 2) * 0.5) / cfg.ring) * Math.PI * 2;
      const x = Math.min(half, Math.max(-half, a.x + Math.cos(ang) * a.radius));
      const zz = Math.min(half, Math.max(-half, a.z + Math.sin(ang) * a.radius));
      if (apexes.some((o) => o !== a && Math.hypot(o.x - x, o.z - zz) < o.radius * 0.6)) continue;
      add(x, zz, floorAt(x, zz), 2.5);
    }
  });
  // The trek's valleys lie on the flat sheet.
  Object.values(getDayWiseDataG()).forEach((route) =>
    (route.features || []).forEach((feature) => {
      if (!feature.geometry || feature.geometry.type !== "MultiLineString") return;
      feature.geometry.coordinates.forEach((part) =>
        part.forEach(([lng, lat]) => {
          const [x, zz] = toWorld(lng, lat);
          if (!inside(x, zz) || nearApex(x, zz, 0.35)) return;
          add(x, zz, floorAt(x, zz), cfg.routeSpacing);
        }),
      );
    }),
  );
  // Fill the open ground and the slab border with sheet points.
  for (let zz = -half; zz <= half + 1e-6; zz += cfg.fillSpacing) {
    for (let x = -half; x <= half + 1e-6; x += cfg.fillSpacing) {
      const onBorder = Math.abs(Math.abs(x) - half) < 1e-6 || Math.abs(Math.abs(zz) - half) < 1e-6;
      if (!onBorder && nearApex(x, zz, 0.9)) continue;
      add(x, zz, floorAt(x, zz), onBorder ? 0 : 3);
    }
  }
  [-half, half].forEach((x) => [-half, half].forEach((zz) => add(x, zz, floorAt(x, zz), 0.01)));

  const triangles = Delaunator.from(pts, (p) => p.x, (p) => p.z).triangles;
  const verts = pts.map((p) => [p.x, 0, p.z, p.e]);
  const index = Array.from(triangles);
  for (let t = 0; t < index.length; t += 3) {
    const p = verts[index[t]];
    const q = verts[index[t + 1]];
    const r = verts[index[t + 2]];
    const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
    if (ny < 0) [index[t + 1], index[t + 2]] = [index[t + 2], index[t + 1]];
  }
  return { verts, index };
};

// Options 21-25: deliberately sparse paper-mountain constructions over simple valleys.
// Each builder emits explicit planar faces. Overlapping faces are resolved by surfaceAt's
// highest-envelope lookup, so routes, discs and picking use the exact visible surface.
const solSurface = (E, n, cfg, toWorld, scale) => {
  const half = SLAB_WIDTH / 2;
  const size = n + 1;
  const cell = SLAB_WIDTH / n;
  const clamp = (v) => Math.min(n, Math.max(0, v));
  const at = (i, j, source = E) => source[clamp(j) * size + clamp(i)];
  const ij = (v) => Math.round((v + half) / cell);
  const eAt = (x, z, source = E) => at(ij(x), ij(z), source);
  let min = Infinity;
  E.forEach((e) => {
    min = Math.min(min, e);
  });
  const triangles = [];
  const addTri = (a, b, c) => triangles.push([a, b, c]);
  const point = (x, z, e) => ({ x, z, e });
  const flatSheet = () => {
    const a = point(-half, -half, min);
    const b = point(half, -half, min);
    const c = point(-half, half, min);
    const d = point(half, half, min);
    addTri(a, c, d);
    addTri(a, d, b);
  };
  const gridSheet = (divisions, source, compress = 1) => {
    const p = (i, j) => {
      const x = -half + (i / divisions) * SLAB_WIDTH;
      const z = -half + (j / divisions) * SLAB_WIDTH;
      const e = min + (eAt(x, z, source) - min) * compress;
      return point(x, z, e);
    };
    for (let j = 0; j < divisions; j += 1) {
      for (let i = 0; i < divisions; i += 1) {
        const a = p(i, j);
        const b = p(i + 1, j);
        const c = p(i, j + 1);
        const d = p(i + 1, j + 1);
        if (Math.abs(a.e - d.e) <= Math.abs(b.e - c.e)) {
          addTri(a, c, d);
          addTri(a, d, b);
        } else {
          addTri(a, c, b);
          addTri(b, c, d);
        }
      }
    }
  };
  const snap = ([lat, lng], radius = 1.5) => {
    const [wx, wz] = toWorld(lng, lat);
    const ci = ij(wx);
    const cj = ij(wz);
    const r = Math.ceil(radius / cell);
    let best = null;
    for (let dj = -r; dj <= r; dj += 1) {
      for (let di = -r; di <= r; di += 1) {
        const i = clamp(ci + di);
        const j = clamp(cj + dj);
        const candidate = { x: -half + i * cell, z: -half + j * cell, e: at(i, j), i, j };
        if (Math.hypot(candidate.x - wx, candidate.z - wz) > radius) continue;
        if (!best || candidate.e > best.e) best = candidate;
      }
    }
    return best;
  };
  const relief = (p, radius = 12) => {
    const r = Math.ceil(radius / cell);
    let floor = Infinity;
    for (let dj = -r; dj <= r; dj += 1) {
      for (let di = -r; di <= r; di += 1) {
        if (Math.hypot(di, dj) <= r) floor = Math.min(floor, at(p.i + di, p.j + dj));
      }
    }
    return p.e - floor;
  };
  const localPeaks = (minProminence, separation, limit) => {
    const candidates = [];
    const step = Math.max(2, Math.round(separation / cell / 2));
    for (let j = step; j < n - step; j += 1) {
      for (let i = step; i < n - step; i += 1) {
        const e = at(i, j);
        let top = true;
        for (let dj = -step; dj <= step && top; dj += 1) {
          for (let di = -step; di <= step; di += 1) {
            if ((di || dj) && at(i + di, j + dj) > e) {
              top = false;
              break;
            }
          }
        }
        if (!top) continue;
        const p = { x: -half + i * cell, z: -half + j * cell, e, i, j };
        p.prominence = relief(p, Math.max(10, separation));
        if (p.prominence >= minProminence) candidates.push(p);
      }
    }
    candidates.sort((a, b) => b.prominence - a.prominence);
    const picked = [];
    candidates.forEach((p) => {
      if (picked.length >= limit || picked.some((q) => Math.hypot(p.x - q.x, p.z - q.z) < separation)) return;
      picked.push(p);
    });
    return picked;
  };
  const fan = (apex, radius, faces, baseAt = () => min, orientation = 0, anisotropy = 1) => {
    const ring = [];
    for (let k = 0; k < faces; k += 1) {
      const a = orientation + (k / faces) * Math.PI * 2;
      const rx = radius * anisotropy;
      const rz = radius / anisotropy;
      const x = apex.x + Math.cos(a) * rx;
      const z = apex.z + Math.sin(a) * rz;
      if (Math.abs(x) > half || Math.abs(z) > half) return false;
      ring.push(point(x, z, baseAt(x, z)));
    }
    const top = point(apex.x, apex.z, apex.e);
    for (let k = 0; k < faces; k += 1) addTri(top, ring[k], ring[(k + 1) % faces]);
    return true;
  };
  const valleyBlur = gaussianGrid(E, size, cfg.valleySigma || cfg.smoothSigma || cfg.segmentSigma || 4);
  let peaks = [];

  if (cfg.kind === "layered-six-face") {
    gridSheet(cfg.valleyGrid, valleyBlur, 0.18);
    peaks = FOLD_MAIN.map((s) => snap(s))
      .filter(Boolean)
      .map((p) => ({ ...p, prominence: relief(p, 14) }))
      .filter((p) => p.prominence >= cfg.minProminence)
      .sort((a, b) => b.prominence - a.prominence);
    const accepted = [];
    peaks.forEach((p) => {
      const floor = min + (eAt(p.x, p.z, valleyBlur) - min) * 0.18;
      p.radius = Math.max(8, ((p.e - floor) * scale) / Math.tan((cfg.slope * Math.PI) / 180));
      if (Math.abs(p.x) + p.radius > half || Math.abs(p.z) + p.radius > half) return;
      if (accepted.some((q) => Math.hypot(p.x - q.x, p.z - q.z) < 0.62 * (p.radius + q.radius))) return;
      if (fan(p, p.radius, cfg.faces, (x, z) => min + (eAt(x, z, valleyBlur) - min) * 0.18, accepted.length * 0.31)) accepted.push(p);
    });
    peaks = accepted;
  } else if (cfg.kind === "watershed-fans") {
    flatSheet();
    const candidates = localPeaks(cfg.minProminence, 7, cfg.maxMassifs);
    peaks = [];
    candidates.forEach((p, k) => {
      const radius = Math.min(16, Math.max(7, ((p.e - min) * scale) / Math.tan((56 * Math.PI) / 180)));
      if (fan(p, radius, cfg.faces, () => min, k * 0.23, 0.85 + (k % 3) * 0.12)) peaks.push(p);
    });
  } else if (cfg.kind === "paper-fold-tin") {
    gridSheet(7, valleyBlur, 0.08);
    const candidates = localPeaks(cfg.minProminence, cfg.separation, cfg.maxPeaks);
    peaks = [];
    candidates.forEach((p, k) => {
      const innerRadius = Math.min(10, Math.max(6, (900 * scale) / Math.tan((52 * Math.PI) / 180)));
      const outerRadius = Math.min(18, Math.max(innerRadius * 1.65, ((p.e - min) * scale) / Math.tan((52 * Math.PI) / 180)));
      if (Math.abs(p.x) + outerRadius > half || Math.abs(p.z) + outerRadius > half) return;
      const inner = [];
      const outer = [];
      const orientation = k * 0.41;
      for (let f = 0; f < cfg.faces; f += 1) {
        const a = orientation + (f / cfg.faces) * Math.PI * 2;
        inner.push(point(p.x + Math.cos(a) * innerRadius, p.z + Math.sin(a) * innerRadius, Math.max(min, p.e - 900)));
        outer.push(point(p.x + Math.cos(a) * outerRadius, p.z + Math.sin(a) * outerRadius, min));
      }
      const apex = point(p.x, p.z, p.e);
      for (let f = 0; f < cfg.faces; f += 1) {
        const next = (f + 1) % cfg.faces;
        addTri(apex, inner[f], inner[next]);
        addTri(inner[f], outer[f], outer[next]);
        addTri(inner[f], outer[next], inner[next]);
      }
      peaks.push(p);
    });
  } else if (cfg.kind === "max-envelope") {
    flatSheet();
    const named = FOLD_MAIN.map((s) => snap(s)).filter(Boolean);
    const automatic = localPeaks(cfg.minProminence, cfg.separation, cfg.maxPeaks);
    [...named, ...automatic]
      .sort((a, b) => b.e - a.e)
      .forEach((p) => {
        if (peaks.length >= cfg.maxPeaks || peaks.some((q) => Math.hypot(p.x - q.x, p.z - q.z) < cfg.separation)) return;
        const radius = Math.max(7, ((p.e - min) * scale) / Math.tan((cfg.slope * Math.PI) / 180));
        if (Math.abs(p.x) + radius > half || Math.abs(p.z) + radius > half) return;
        p.radius = radius;
        peaks.push(p);
      });
    peaks.forEach((p, k) => fan(p, p.radius, cfg.faces, () => min, (p.x + p.z) * 0.07, 0.8 + ((k * 37) % 46) / 100));
  } else {
    flatSheet();
    // Six authored groups based on the real named summits. Every listed apex retains
    // option 11's exact sampled height; the small graph is explicit, never Delaunay.
    const groups = [
      [NAMED_SUMMITS[0], NAMED_SUMMITS[1], NAMED_SUMMITS[2]],
      [NAMED_SUMMITS[3]],
      [NAMED_SUMMITS[8], NAMED_SUMMITS[9]],
      [NAMED_SUMMITS[4]],
      [NAMED_SUMMITS[6], NAMED_SUMMITS[7]],
      [FOLD_MAIN[5]],
    ];
    groups.forEach((group, gi) => {
      const groupPeaks = group.map((s) => snap(s)).filter(Boolean);
      groupPeaks.forEach((p, pi) => {
        const radius = Math.min(15, Math.max(11, ((p.e - min) * scale) / Math.tan((52 * Math.PI) / 180)));
        if (fan(p, radius, cfg.faces, () => min, gi * 0.37 + pi * 0.18, 0.9 + (gi % 3) * 0.08)) peaks.push(p);
      });
    });
  }

  const verts = [];
  const index = [];
  triangles.forEach((tri) =>
    tri.forEach((p) => {
      index.push(verts.length);
      verts.push([p.x, 0, p.z, p.e]);
    }),
  );
  return { verts, index, massifCount: peaks.length };
};

// Highest mesh vertex near Everest and Lhotse, to check heights against option 11.
const summitHeights = (verts, toWorld) =>
  [
    ["Everest", 27.9881, 86.925],
    ["Lhotse", 27.9617, 86.9333],
  ].map(([name, lat, lng]) => {
    const [x, zz] = toWorld(lng, lat);
    let best = null;
    verts.forEach((v) => {
      if ((v[0] - x) ** 2 + (v[2] - zz) ** 2 > 2.25) return;
      if (!best || v[3] > best[3]) best = v;
    });
    return { name, meters: best ? Math.round(best[3] * 10) / 10 : null, y: best ? Math.round(best[1] * 1000) / 1000 : null };
  });

// Color grades baked into the stitched imagery for the option 10 variants.
const gradeImagery = (imagery, elevation, grade) => {
  const { canvas, z, x0, y0 } = imagery;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (grade.blur) {
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext("2d").drawImage(canvas, 0, 0);
    ctx.filter = `blur(${grade.blur}px)`;
    ctx.drawImage(copy, 0, 0);
    ctx.filter = "none";
  }
  if (grade.posterize || grade.desaturate || grade.pastel || grade.snowLift || grade.cool) {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = image.data;
    const levels = grade.posterize ? grade.posterize - 1 : 0;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] / 255;
      let g = d[i + 1] / 255;
      let b = d[i + 2] / 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      if (grade.desaturate) {
        r += (l - r) * grade.desaturate;
        g += (l - g) * grade.desaturate;
        b += (l - b) * grade.desaturate;
      }
      if (grade.pastel) {
        r += (1 - r) * grade.pastel;
        g += (1 - g) * grade.pastel;
        b += (1 - b) * grade.pastel;
      }
      if (grade.snowLift) {
        const t = Math.min(1, Math.max(0, (l - 0.42) / 0.3));
        const k = t * t * (3 - 2 * t) * grade.snowLift;
        r += (1 - r) * k;
        g += (1 - g) * k;
        b += (1 - b) * k;
      }
      if (grade.cool) {
        r *= 1 - grade.cool * 0.5;
        b += (1 - b) * grade.cool * 0.5;
      }
      if (levels) {
        r = Math.round(r * levels) / levels;
        g = Math.round(g * levels) / levels;
        b = Math.round(b * levels) / levels;
      }
      d[i] = r * 255;
      d[i + 1] = g * 255;
      d[i + 2] = b * 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  if (grade.slopeBlur) {
    // Blur only steep open faces; ridges, valley floors, glaciers and flats stay sharp.
    const { blur, slopeStart, slopeFull } = grade.slopeBlur;
    const S = 512;
    const world = TILE * 2 ** z;
    const E = new Float32Array(S * S);
    for (let j = 0; j < S; j += 1) {
      const Y = y0 * TILE + ((j + 0.5) / S) * canvas.height;
      const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * Y) / world))) * 180) / Math.PI;
      for (let i = 0; i < S; i += 1) {
        const X = x0 * TILE + ((i + 0.5) / S) * canvas.width;
        E[j * S + i] = elevation((X / world) * 360 - 180, lat);
      }
    }
    const midLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y0 * TILE + canvas.height / 2)) / world))) * 180) / Math.PI;
    const metersPerPx = ((156543.03 * Math.cos((midLat * Math.PI) / 180)) / 2 ** z) * (canvas.width / S);
    const at = (i, j) => E[Math.min(S - 1, Math.max(0, j)) * S + Math.min(S - 1, Math.max(0, i))];
    const smooth = (a, b, v) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const mask = document.createElement("canvas");
    mask.width = S;
    mask.height = S;
    const mctx = mask.getContext("2d");
    const data = mctx.createImageData(S, S);
    for (let j = 0; j < S; j += 1) {
      for (let i = 0; i < S; i += 1) {
        const dx = (at(i + 1, j) - at(i - 1, j)) / (2 * metersPerPx);
        const dy = (at(i, j + 1) - at(i, j - 1)) / (2 * metersPerPx);
        const slope = (Math.atan(Math.hypot(dx, dy)) * 180) / Math.PI;
        const e = at(i, j);
        const conv = Math.max(
          e - (at(i - 3, j) + at(i + 3, j)) / 2,
          e - (at(i, j - 3) + at(i, j + 3)) / 2,
        );
        const concave = Math.max(
          (at(i - 3, j) + at(i + 3, j)) / 2 - e,
          (at(i, j - 3) + at(i, j + 3)) / 2 - e,
        );
        const a = smooth(slopeStart, slopeFull, slope) * (1 - smooth(30, 100, conv)) * (1 - smooth(30, 100, concave));
        const k = (j * S + i) * 4;
        data.data[k + 3] = Math.round(a * 255);
      }
    }
    mctx.putImageData(data, 0, 0);
    const soft = document.createElement("canvas");
    soft.width = canvas.width;
    soft.height = canvas.height;
    const sctx = soft.getContext("2d");
    sctx.filter = `blur(${blur}px)`;
    sctx.drawImage(canvas, 0, 0);
    sctx.filter = "none";
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(soft, 0, 0);
  }
  if (grade.hillshade) {
    // DEM hillshade multiplied onto the photo, lit from the same low sun as the scene.
    const { azimuth, altitude, strength, zFactor } = grade.hillshade;
    const S = 512;
    const world = TILE * 2 ** z;
    const E = new Float32Array(S * S);
    for (let j = 0; j < S; j += 1) {
      const Y = y0 * TILE + ((j + 0.5) / S) * canvas.height;
      const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * Y) / world))) * 180) / Math.PI;
      for (let i = 0; i < S; i += 1) {
        const X = x0 * TILE + ((i + 0.5) / S) * canvas.width;
        E[j * S + i] = elevation((X / world) * 360 - 180, lat);
      }
    }
    const midLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y0 * TILE + canvas.height / 2)) / world))) * 180) / Math.PI;
    const metersPerPx = ((156543.03 * Math.cos((midLat * Math.PI) / 180)) / 2 ** z) * (canvas.width / S);
    const az = (azimuth * Math.PI) / 180;
    const alt = (altitude * Math.PI) / 180;
    const L = [Math.sin(az) * Math.cos(alt), -Math.cos(az) * Math.cos(alt), Math.sin(alt)];
    const shade = document.createElement("canvas");
    shade.width = S;
    shade.height = S;
    const sctx = shade.getContext("2d");
    const out = sctx.createImageData(S, S);
    const at = (i, j) => E[Math.min(S - 1, Math.max(0, j)) * S + Math.min(S - 1, Math.max(0, i))];
    for (let j = 0; j < S; j += 1) {
      for (let i = 0; i < S; i += 1) {
        const dx = ((at(i + 1, j) - at(i - 1, j)) / (2 * metersPerPx)) * zFactor;
        const dy = ((at(i, j + 1) - at(i, j - 1)) / (2 * metersPerPx)) * zFactor;
        const len = Math.hypot(dx, dy, 1);
        const lit = Math.max(0, (-dx * L[0] - dy * L[1] + L[2]) / len);
        const v = Math.round(255 * (1 - strength * (1 - Math.min(1, lit * 1.6))));
        const k = (j * S + i) * 4;
        out.data[k] = v;
        out.data[k + 1] = v;
        out.data[k + 2] = v;
        out.data[k + 3] = 255;
      }
    }
    sctx.putImageData(out, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(shade, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }
};

const styledColor = (style, height, slope, light) => {
  if (style === "cel") {
    const colors = ["#315f36", "#78ad3f", "#b0cc54", "#6d7b72", "#f3f1e6"];
    const band = height > 0.82 ? 4 : height > 0.65 ? 3 : height > 0.25 ? 2 : height > 0.1 ? 1 : 0;
    return new THREE.Color(colors[band]);
  }
  if (style === "graphic") {
    const colors = ["#668c48", "#93ad53", "#747d72", "#f2efe2"];
    const band = height > 0.78 ? 3 : height > 0.6 ? 2 : height > 0.22 ? 1 : 0;
    return new THREE.Color(colors[band]);
  }
  const ramps = {
    soft: { stops: [0, 0.48, 0.75, 0.82, 1], colors: ["#6d9b65", "#a6bf78", "#89948d", "#f0eee1", "#faf9f2"] },
    relief: { stops: [0, 0.58, 0.78, 0.84, 1], colors: ["#568654", "#8cab68", "#69787b", "#f0eee4", "#faf9f3"] },
    // Style 5: bright valley, tan then brown slopes, white only at the tips.
    miniature: {
      stops: [0, 0.16, 0.34, 0.52, 0.7, 0.84, 0.93, 1],
      colors: ["#7ec83c", "#b6d24e", "#e0c06a", "#c49255", "#8d6842", "#6a503c", "#f0ebe3", "#f7f5f1"],
    },
    mapGold: {
      stops: [0, 0.2, 0.4, 0.6, 0.8, 1],
      colors: ["#14331c", "#6a9a52", "#c4aa6e", "#d2b67e", "#f2f5f3", "#f8faf8"],
    },
  };
  const { stops, colors } = ramps[style];
  let k = 1;
  while (k < stops.length - 1 && height > stops[k]) k += 1;
  const color = new THREE.Color(colors[k - 1]).lerp(
    new THREE.Color(colors[k]),
    Math.min(1, Math.max(0, (height - stops[k - 1]) / (stops[k] - stops[k - 1]))),
  );
  return color.offsetHSL(0, style === "soft" ? -0.035 : 0, (light - 0.55) * 0.035);
};

// Map a real elevation onto 0..1 using the style's meter stops.
const meterToUnit = (meters, stops) => {
  if (meters <= stops[0]) return 0;
  const last = stops.length - 1;
  if (meters >= stops[last]) return 1;
  let i = 1;
  while (i < last && meters > stops[i]) i += 1;
  return (i - 1 + (meters - stops[i - 1]) / (stops[i] - stops[i - 1])) / last;
};

const stylizedMeshes = (verts, index, terrain, option) => {
  const positions = verts.flatMap((v) => v.slice(0, 3));
  const lightDirection = new THREE.Vector3(-0.9, 1.25, 0.45).normalize();
  const maxY = Math.max(...verts.map((v) => v[1])) || 1;
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const colors = [];
  const tone = (v) =>
    styledColor(
      option.stylized.style,
      option.stylized.meterStops ? meterToUnit(v[3], option.stylized.meterStops) : v[1] / maxY,
      0,
      0.55,
    );
  if (option.stylized.smoothShading) {
    verts.forEach((v) => {
      const color = tone(v);
      colors.push(color.r, color.g, color.b);
    });
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  } else {
    const facePositions = [];
    const faceColors = [];
    for (let t = 0; t < index.length; t += 3) {
      const tri = [verts[index[t]], verts[index[t + 1]], verts[index[t + 2]]];
      const a = new THREE.Vector3(...tri[0].slice(0, 3));
      const b = new THREE.Vector3(...tri[1].slice(0, 3));
      const c = new THREE.Vector3(...tri[2].slice(0, 3));
      const normal = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      if (normal.y < 0) normal.negate();
      const height = tri.reduce((sum, v) => sum + v[1], 0) / 3 / maxY;
      const color = styledColor(option.stylized.style, height, 1 - normal.y, Math.max(0, normal.dot(lightDirection)));
      tri.forEach((v) => {
        facePositions.push(v[0], v[1], v[2]);
        faceColors.push(color.r, color.g, color.b);
      });
    }
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(facePositions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(faceColors, 3));
    geometry.computeVertexNormals();
  }
  const top = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: !option.stylized.smoothShading }),
  );
  const side = new THREE.Mesh(
    flatGeometry(terrain.side),
    new THREE.MeshLambertMaterial({ color: LOOK.side, emissive: LOOK.sideGlow, emissiveIntensity: 0.35, flatShading: true }),
  );
  return { meshes: [top, side], pickMesh: top };
};

// Option 10: Esri imagery draped on a smooth medium-detail mesh.
const buildSatellite = (area, elevation, option, toWorld, toLngLat, imagery) => {
  const n = option.grid;
  const half = SLAB_WIDTH / 2;
  const cell = SLAB_WIDTH / n;
  const scale = option.exaggeration / area.metersPerUnit;
  // Option 11's surface sampler: light 3x3 averaging at a fixed world reach.
  const reach = cell * (option.smooth ?? 0.5);
  const sampleE = (x, zz) => {
    let e = 0;
    for (let sj = -1; sj <= 1; sj += 1) {
      for (let si = -1; si <= 1; si += 1) {
        e += elevation(...toLngLat(x + si * reach, zz + sj * reach)) / 9;
      }
    }
    return e;
  };
  let E = new Float32Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) E[j * (n + 1) + i] = sampleE(-half + i * cell, -half + j * cell);
  }
  let min = Infinity;
  let max = -Infinity;
  E.forEach((e) => {
    min = Math.min(min, e);
    max = Math.max(max, e);
  });
  if (option.slopeSmooth) E = ridgePreservingSmooth(E, n + 1, option.slopeSmooth);
  let surface;
  if (option.stylized) surface = stylizedSurface(E, n, option.stylized, toWorld);
  else if (option.sol) surface = solSurface(E, n, option.sol, toWorld, scale);
  else if (option.fold) surface = foldSurface(E, n, option.fold, toWorld, scale);
  else if (option.decimate) surface = tinSurface(E, n, option.decimate, toWorld);
  else surface = gridSurface(E, n);
  const { verts, index } = surface;
  const positions = [];
  const uvs = [];
  const imageInfo = imagery || {};
  const { canvas, z, x0, y0 } = imageInfo;
  verts.forEach((v) => {
    v[1] = (v[3] - min) * scale;
    positions.push(v[0], v[1], v[2]);
    if (canvas) {
      const [lng, lat] = toLngLat(v[0], v[2]);
      uvs.push(
        (lngToPx(lng, z) - x0 * TILE) / canvas.width,
        1 - (latToPx(lat, z) - y0 * TILE) / canvas.height,
      );
    }
  });
  const triangles = [];
  for (let t = 0; t < index.length; t += 3) {
    triangles.push([verts[index[t]], verts[index[t + 1]], verts[index[t + 2]]]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (uvs.length) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const terrain = finalizeTerrain(verts, triangles, toWorld);
  if (option.stylized) {
    const styled = stylizedMeshes(verts, index, terrain, option);
    return {
      ...terrain,
      ...styled,
      minElev: min,
      maxElev: max,
      pointCount: verts.length,
      faceCount: triangles.length,
      peaks: summitHeights(verts, toWorld),
    };
  }
  if (LOOK.imageryGrade) gradeImagery(imagery, elevation, LOOK.imageryGrade);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0,
      flatShading: Boolean(option.fold || option.sol),
    }),
  );
  const extras = [];
  if (option.fold && option.fold.snow) {
    // White tips: a transparent overlay whose alpha rises with real elevation.
    const { start, full, opacity } = option.fold.snow;
    const rgba = [];
    verts.forEach((v) => {
      const t = Math.min(1, Math.max(0, (v[3] - start) / (full - start)));
      rgba.push(1, 1, 1, t * t * (3 - 2 * t) * opacity);
    });
    const snowGeometry = geometry.clone();
    snowGeometry.setAttribute("color", new THREE.Float32BufferAttribute(rgba, 4));
    extras.push(
      new THREE.Mesh(
        snowGeometry,
        new THREE.MeshLambertMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          flatShading: true,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      ),
    );
  }
  const sideGeometry = flatGeometry(terrain.side);
  let sideMaterial = new THREE.MeshLambertMaterial({
    color: LOOK.side,
    emissive: LOOK.sideGlow,
    emissiveIntensity: 0.4,
  });
  if (LOOK.strata) {
    // Layered rock: a striped texture mapped by height up the cut walls.
    const top = Math.max(...verts.map((v) => v[1])) + SLAB_THICKNESS;
    const pos = sideGeometry.getAttribute("position");
    const sideUvs = [];
    for (let k = 0; k < pos.count; k += 1) {
      sideUvs.push((pos.getX(k) + pos.getZ(k)) / SLAB_WIDTH, (pos.getY(k) + SLAB_THICKNESS) / top);
    }
    sideGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(sideUvs, 2));
    const strip = document.createElement("canvas");
    strip.width = 4;
    strip.height = 256;
    const sctx = strip.getContext("2d");
    let y = 0;
    for (let band = 0; y < strip.height; band += 1) {
      const h = 6 + ((band * 37) % 11);
      sctx.fillStyle = LOOK.strata[band % LOOK.strata.length];
      sctx.fillRect(0, strip.height - y - h, strip.width, h);
      y += h;
    }
    const strataTexture = new THREE.CanvasTexture(strip);
    strataTexture.colorSpace = THREE.SRGBColorSpace;
    sideMaterial = new THREE.MeshLambertMaterial({ map: strataTexture, emissive: "#2a1d12", emissiveIntensity: 0.35 });
  }
  const side = new THREE.Mesh(sideGeometry, sideMaterial);
  return {
    ...terrain,
    meshes: [mesh, side, ...extras],
    pickMesh: mesh,
    minElev: min,
    maxElev: max,
    pointCount: verts.length,
    faceCount: triangles.length,
    massifCount: surface.massifCount,
    peaks: summitHeights(verts, toWorld),
  };
};

const CUSTOM_BUILDERS = {
  terrace: buildTerrace,
  hex: buildHex,
  ridges: buildRidges,
  satellite: buildSatellite,
  stylized: buildSatellite,
};

const buildTerrain = (area, elevation, imagery) => {
  const half = SLAB_WIDTH / 2;
  const toLngLat = (x, zz) => [
    area.west + ((x + half) / SLAB_WIDTH) * (area.east - area.west),
    area.north - ((zz + half) / SLAB_WIDTH) * (area.north - area.south),
  ];
  const toWorld = (lng, lat) => [
    ((lng - area.west) / (area.east - area.west)) * SLAB_WIDTH - half,
    ((area.north - lat) / (area.north - area.south)) * SLAB_WIDTH - half,
  ];
  const option = TERRAIN_OPTIONS[TERRAIN_OPTION];
  const custom = option && CUSTOM_BUILDERS[option.kind];
  if (custom) return custom(area, elevation, option, toWorld, toLngLat, imagery);
  const mesh = option ? buildTin(area, elevation, option, toWorld) : buildGrid(area, elevation, toLngLat);
  const terrain = finalizeTerrain(mesh.verts, mesh.triangles, toWorld);
  const elevs = mesh.verts.map((v) => v[3]);
  terrain.minElev = Math.min(...elevs);
  terrain.maxElev = Math.max(...elevs);
  terrain.pointCount = mesh.verts.length;
  return terrain;
};

// Thin iso-elevation lines across every facet, like a laser-cut topo model.
const contourGeometry = (terrain, step) => {
  const positions = [];
  const cut = (a, b, level) => {
    const t = (level - a[3]) / (b[3] - a[3]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 0.04, a[2] + (b[2] - a[2]) * t];
  };
  terrain.triangles.forEach((tri) => {
    const es = tri.map((v) => v[3]);
    const lo = Math.ceil(Math.min(...es) / step) * step;
    const hi = Math.max(...es);
    for (let level = lo; level < hi; level += step) {
      const hits = [];
      for (let k = 0; k < 3; k += 1) {
        const a = tri[k];
        const b = tri[(k + 1) % 3];
        if ((a[3] - level) * (b[3] - level) < 0) hits.push(cut(a, b, level));
      }
      if (hits.length === 2) positions.push(...hits[0], ...hits[1]);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
};

const topoColors = (terrain) => {
  const stops = LOOK.elevationStops.map(([t, hex]) => [t, new THREE.Color(hex)]);
  const range = terrain.maxElev - terrain.minElev || 1;
  const color = new THREE.Color();
  const colors = [];
  terrain.triangles.forEach((tri) =>
    tri.forEach((v) => {
      const h = (v[3] - terrain.minElev) / range;
      let k = 1;
      while (k < stops.length - 1 && h > stops[k][0]) k += 1;
      const [t0, c0] = stops[k - 1];
      const [t1, c1] = stops[k];
      color.copy(c0).lerp(c1, Math.min(1, Math.max(0, (h - t0) / (t1 - t0))));
      colors.push(color.r, color.g, color.b);
    }),
  );
  return colors;
};

// Cream tray around the slab, open in the middle.
const frameGeometry = () => {
  const half = SLAB_WIDTH / 2;
  const outer = half + LOOK.frameWidth;
  const shape = new THREE.Shape();
  shape.moveTo(-outer, -outer);
  shape.lineTo(outer, -outer);
  shape.lineTo(outer, outer);
  shape.lineTo(-outer, outer);
  shape.lineTo(-outer, -outer);
  const hole = new THREE.Path();
  hole.moveTo(-half, -half);
  hole.lineTo(-half, half);
  hole.lineTo(half, half);
  hole.lineTo(half, -half);
  hole.lineTo(-half, -half);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB_THICKNESS + LOOK.frameHeight,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -SLAB_THICKNESS, 0);
  return geometry;
};

const flatGeometry = (positions) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
};

const shadowTexture = () => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const shade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  shade.addColorStop(0, COLORS.shadow);
  shade.addColorStop(1, "rgba(64, 104, 132, 0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);
  const glow = ctx.createRadialGradient(size * 0.58, size * 0.6, 0, size * 0.58, size * 0.6, size * 0.28);
  glow.addColorStop(0, COLORS.glow);
  glow.addColorStop(1, "rgba(255, 176, 96, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const isRestDay = (routes, day) => {
  const features = routes[day] && routes[day].features;
  return Boolean(features && features[0] && features[0].properties.time === "Rest Day");
};

// Same hue as the marker, lifted so the ring reads on satellite imagery.
const brightRestColor = (hex) => {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s + 0.42), Math.min(0.72, hsl.l + 0.3));
  return color;
};

// Flat strip along the route, never drawn, only raycast for hover and click.
const hitRibbon = (points) => {
  const positions = [];
  const w = ROUTE.hitWidth / 2;
  for (let k = 0; k < points.length - 1; k += 1) {
    const [x0, y0, z0] = points[k];
    const [x1, y1, z1] = points[k + 1];
    const len = Math.hypot(x1 - x0, z1 - z0) || 1;
    const px = (-(z1 - z0) / len) * w;
    const pz = ((x1 - x0) / len) * w;
    positions.push(x0 + px, y0, z0 + pz, x0 - px, y0, z0 - pz, x1 + px, y1, z1 + pz);
    positions.push(x1 + px, y1, z1 + pz, x0 - px, y0, z0 - pz, x1 - px, y1, z1 - pz);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
};

// One fat line per route feature, colored per segment with the 2D elevation gradient.
const addRoutes = (scene, terrain) => {
  const lines = [];
  const hits = [];
  const hitMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const routes = getDayWiseDataG();
  Object.entries(routes).forEach(([day, route]) => {
    (route.features || []).forEach((feature) => {
      if (!feature.geometry || feature.geometry.type !== "MultiLineString") return;
      const lift = (lng, lat) => {
        const [x, zz] = terrain.toWorld(lng, lat);
        return [x, terrain.surfaceAt(x, zz).y + ROUTE_STYLE.lift, zz];
      };
      const resample = ([lng0, lat0], [lng1, lat1]) => {
        const [x0, z0] = terrain.toWorld(lng0, lat0);
        const [x1, z1] = terrain.toWorld(lng1, lat1);
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.6));
        return Array.from({ length: steps + 1 }, (_, k) => {
          const t = k / steps;
          return lift(lng0 + (lng1 - lng0) * t, lat0 + (lat1 - lat0) * t);
        });
      };
      const positions = [];
      const colors = [];
      const color = new THREE.Color();
      createGradientSegments(feature.geometry.coordinates).forEach((segment) => {
        color.set(segment.color);
        for (let k = 0; k < segment.latlngs.length - 1; k += 1) {
          const [lat0, lng0] = segment.latlngs[k];
          const [lat1, lng1] = segment.latlngs[k + 1];
          const samples = resample([lng0, lat0], [lng1, lat1]);
          for (let s = 0; s < samples.length - 1; s += 1) {
            positions.push(...samples[s], ...samples[s + 1]);
            colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
          }
        }
      });
      if (!positions.length) return;
      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(positions);
      geometry.setColors(colors);
      const material = new LineMaterial({
        vertexColors: true,
        linewidth: ROUTE_STYLE.width,
        transparent: true,
        opacity: ROUTE_STYLE.opacity,
        depthTest: !LOOK.routesOnTop,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const line = new LineSegments2(geometry, material);
      line.userData.day = day;
      scene.add(line);
      lines.push(line);

      feature.geometry.coordinates.forEach((part) => {
        const points = [];
        for (let k = 0; k < part.length - 1; k += 1) {
          const samples = resample(part[k], part[k + 1]);
          points.push(...(k ? samples.slice(1) : samples));
        }
        if (points.length < 2) return;
        const hit = new THREE.Mesh(
          hitRibbon(points),
          hitMaterial,
        );
        hit.userData = { day, properties: feature.properties };
        hits.push(hit);
      });
    });
  });
  return { lines, hits };
};

// Flat white discs with an altitude-colored ring, like the 2D lodge circles.
const addDiscs = (scene, terrain) => {
  const group = new THREE.Group();
  const fill = new THREE.CircleGeometry(DISC_STYLE.radius, 32);
  const ring = new THREE.RingGeometry(DISC_STYLE.radius, DISC_STYLE.radius + DISC_STYLE.ring, 32);
  const onTop = Boolean(DISC_STYLE.onTop);
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.disc,
    depthTest: !onTop,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });
  const up = new THREE.Vector3(0, 0, 1);
  getMarkers().forEach((marker) => {
    const [lat, lng] = marker.point;
    const altFt = parseInt((marker.properties.startAlt || "0").replace(/,/g, ""), 10);
    const [x, zz] = terrain.toWorld(lng, lat);
    const { y, normal } = terrain.surfaceAt(x, zz);
    const disc = new THREE.Group();
    disc.add(
      new THREE.Mesh(fill, fillMaterial),
      new THREE.Mesh(
        ring,
        new THREE.MeshBasicMaterial({
          color: getColorForElevation(altFt * 0.3048),
          depthTest: !onTop,
          polygonOffset: true,
          polygonOffsetFactor: -6,
          polygonOffsetUnits: -6,
        }),
      ),
    );
    // Lean only partly into steep facets so discs stay readable as flat circles.
    const lean = normal.clone().add(new THREE.Vector3(0, 1.5, 0)).normalize();
    disc.quaternion.setFromUnitVectors(up, lean);
    disc.position.set(x, y, zz).addScaledVector(normal, DISC_STYLE.lift + 0.25);
    disc.userData.lat = lat;
    disc.userData.lng = lng;
    disc.userData.color = getColorForElevation(altFt * 0.3048);
    group.add(disc);
  });
  if (onTop) {
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.renderOrder = 5;
      object.material.transparent = true;
    });
  }
  scene.add(group);
  return group;
};

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const lerpAngle = (from, to, t) => {
  let delta = to - from;
  if (delta > Math.PI) delta -= Math.PI * 2;
  else if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
};

// Thin ring at 4.2x the stay radius. It scales out to 1.35, half the previous max of 2.7.
// The stay disc is unchanged. Only the pulse's farthest reach is halved.
const PULSE_BAND = 0.3;
const PULSE_MAX_SCALE = 1.35;

const Terrain3D = (props) => {
  const { day, isSingleDayView } = props;
  const mountRef = useRef(null);
  const propsRef = useRef(props);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState("loading");
  propsRef.current = props;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
      setStatus("unsupported");
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    if (LOOK.canvasFilter) renderer.domElement.style.filter = LOOK.canvasFilter;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 1, 2000);
    if (LOOK.haze) scene.fog = new THREE.Fog(LOOK.haze.color, 1, 2);
    const light = LOOK.light;
    scene.add(new THREE.HemisphereLight(light.hemiSky, light.hemiGround, light.hemiIntensity));
    const sun = new THREE.DirectionalLight(light.sunColor, light.sunIntensity);
    sun.position.set(...light.sunDirection).multiplyScalar(100);
    scene.add(sun);

    const overviewTarget = new THREE.Vector3(0, -SLAB_THICKNESS / 2, 0);
    const view = {
      azimuth: ACTIVE_OPTION.cameraAzimuth ?? CAMERA.azimuth,
      elevation:
        (TERRAIN_OPTIONS[TERRAIN_OPTION] || {}).cameraElevation || CAMERA.elevation,
      zoom: 1, // user wheel zoom, relative to the framed distance
      frame: 1, // framed distance as a fraction of the overview distance
      fitDistance: 300,
      target: overviewTarget.clone(),
    };
    // Azimuth used when a day has no travel direction (overview and rest days).
    let overviewAzimuth = view.azimuth;
    let aimedAtRoute = false;
    let ease = null;
    let terrain = null;
    let terrainMesh = null;
    let routeLines = [];
    let routeHits = [];
    let discs = null;
    let pulse = null;
    const lineMaterials = [];

    let frame = null;
    const render = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (ease) {
          const t = Math.min(1, (performance.now() - ease.start) / CAMERA.easeMs);
          const k = easeInOut(t);
          view.target.lerpVectors(ease.fromTarget, ease.toTarget, k);
          view.frame = ease.fromFrame + (ease.toFrame - ease.fromFrame) * k;
          view.azimuth = lerpAngle(ease.fromAzimuth, ease.toAzimuth, k);
          if (t < 1) render();
          else ease = null;
        }
        const el = (view.elevation * Math.PI) / 180;
        const dist = view.fitDistance * view.frame * view.zoom;
        camera.position.set(
          view.target.x + dist * Math.cos(el) * Math.sin(view.azimuth),
          view.target.y + dist * Math.sin(el),
          view.target.z + dist * Math.cos(el) * Math.cos(view.azimuth),
        );
        camera.lookAt(view.target);
        if (scene.fog) {
          scene.fog.near = dist * LOOK.haze.near;
          scene.fog.far = dist * LOOK.haze.far;
        }
        if (discs) {
          const s = Math.min(1.6, Math.max(0.2, view.frame * view.zoom));
          discs.children.forEach((disc) => {
            disc.scale.setScalar(s);
            const stay = disc.userData.stayScale || 1;
            disc.children.forEach((child) => {
              if (child.userData.pulse) return;
              child.scale.setScalar(stay);
            });
          });
        }
        if (pulse) {
          const t = (performance.now() % 2800) / 2800;
          pulse.scale.setScalar(1 + t * (PULSE_MAX_SCALE - 1));
          pulse.material.opacity = 0.95 * (1 - t);
        }
        renderer.render(scene, camera);
        if (ease || pulse) render();
      });
    };

    const frameTo = (target, frameRatio, animate, azimuth) => {
      view.zoom = 1;
      const nextAzimuth = azimuth == null ? view.azimuth : azimuth;
      if (!animate) {
        ease = null;
        view.target.copy(target);
        view.frame = frameRatio;
        view.azimuth = nextAzimuth;
      } else {
        ease = {
          start: performance.now(),
          fromTarget: view.target.clone(),
          toTarget: target.clone(),
          fromFrame: view.frame,
          toFrame: frameRatio,
          fromAzimuth: view.azimuth,
          toAzimuth: nextAzimuth,
        };
      }
      render();
    };

    // Remember the overview azimuth the first time a walking day takes over the camera.
    const engageRouteAim = (azimuth) => {
      if (azimuth == null) return releaseRouteAim();
      if (!aimedAtRoute) {
        overviewAzimuth = ease ? ease.toAzimuth : view.azimuth;
        aimedAtRoute = true;
      }
      return azimuth;
    };

    const releaseRouteAim = () => {
      if (!aimedAtRoute) return undefined;
      aimedAtRoute = false;
      return overviewAzimuth;
    };

    // Frames the day's route in single-day view, the whole slab otherwise.
    // A walking day aims the camera along the route. Overview and rest days do not.
    const frameDay = (dayKey, single, animate) => {
      if (!terrain) return;
      if (!single || !dayKey || dayKey === "0") {
        frameTo(overviewTarget, 1, animate, releaseRouteAim());
        return;
      }
      const routes = getDayWiseDataG();
      const features = (routes[dayKey] || {}).features || [];
      const line = [];
      features.forEach((feature) => {
        const g = feature.geometry || {};
        if (g.type === "MultiLineString") g.coordinates.forEach((part) => line.push(...part));
        else if (g.type === "LineString") line.push(...g.coordinates);
      });
      const stored = preCalculatedBounds[dayKey];
      let bounds = stored && (isDesktop ? stored.desktop : stored.mobile);
      if (!bounds) {
        const coords = line.slice();
        features.forEach((feature) => {
          const g = feature.geometry || {};
          if (g.type === "Point") coords.push(g.coordinates);
        });
        if (!coords.length) return;
        const lats = coords.map((c) => c[1]);
        const lngs = coords.map((c) => c[0]);
        bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
      }
      const [xa, za] = terrain.toWorld(bounds[0][1], bounds[0][0]);
      const [xb, zb] = terrain.toWorld(bounds[1][1], bounds[1][0]);
      const cx = (xa + xb) / 2;
      const cz = (za + zb) / 2;
      const travel = dayTravel(dayKey);
      const padding = travel ? WALK_FRAME.padding : CAMERA.dayPadding;
      const minFrame = travel ? WALK_FRAME.minFrame : CAMERA.minDayFrame;
      const span = Math.max(Math.abs(xb - xa), Math.abs(zb - za)) + padding;
      const ratio = Math.min(1, Math.max(minFrame, span / SLAB_WIDTH));
      const azimuth = travel ? engageRouteAim(travel.azimuth) : releaseRouteAim();
      frameTo(new THREE.Vector3(cx, terrain.surfaceAt(cx, cz).y, cz), ratio, animate, azimuth);
    };

    const restyleRoutes = (dayKey, single) => {
      const restDay = isRestDay(getDayWiseDataG(), dayKey);
      routeLines.forEach((line) => {
        const active = line.userData.day === dayKey && !restDay;
        line.visible = single && !restDay ? active : true;
        line.material.linewidth = active
          ? single
            ? ROUTE_STYLE.singleDayWidth
            : ROUTE_STYLE.activeWidth
          : ROUTE_STYLE.width;
        line.material.opacity = line.userData.day === dayKey ? 1 : ROUTE_STYLE.opacity;
        line.renderOrder = active ? 2 : 1;
      });
      if (pulse) {
        if (pulse.parent) pulse.parent.remove(pulse);
        pulse.geometry.dispose();
        pulse.material.dispose();
        pulse = null;
      }
      if (discs) {
        discs.children.forEach((item) => {
          item.userData.stayScale = 1;
        });
      }
      if (restDay && discs) {
        const feature = getDayWiseDataG()[dayKey].features[0];
        const [lng, lat] = feature.geometry.coordinates;
        const disc = discs.children.find(
          (item) => Math.abs(item.userData.lat - lat) < 0.005 && Math.abs(item.userData.lng - lng) < 0.005,
        );
        if (disc) {
          // Stay-place circle only. 3x the normal disc, so radius is 1.875.
          const restRadius = DISC_STYLE.radius * 3;
          const pulseOuter = restRadius * 4.2;
          disc.userData.stayScale = 3;
          pulse = new THREE.Mesh(
            new THREE.RingGeometry(pulseOuter - PULSE_BAND, pulseOuter, 96),
            new THREE.MeshBasicMaterial({
              color: brightRestColor(disc.userData.color),
              transparent: true,
              opacity: 0.95,
              depthTest: false,
              depthWrite: false,
              toneMapped: false,
              side: THREE.DoubleSide,
            }),
          );
          pulse.userData.pulse = true;
          pulse.position.z = 0.45;
          pulse.renderOrder = 8;
          disc.add(pulse);
        }
      }
      render();
    };

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const halfV = ((CAMERA.fov / 2) * Math.PI) / 180;
      const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
      const radius = SLAB_WIDTH * 0.62;
      view.fitDistance =
        (radius / Math.tan(Math.min(halfV, halfH))) *
        ((TERRAIN_OPTIONS[TERRAIN_OPTION] || {}).fit || CAMERA.fit);
      camera.updateProjectionMatrix();
      lineMaterials.forEach((material) => material.resolution.set(width, height));
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    // Returns the route hit under the pointer, ignoring routes hidden behind terrain.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickRoute = (clientX, clientY) => {
      if (!terrain) return null;
      const { day: current, isSingleDayView: single } = propsRef.current;
      const candidates = routeHits.filter(
        (hit) => hit.userData.day !== "20" && (!single || hit.userData.day === current),
      );
      if (!candidates.length) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const ground = terrainMesh && raycaster.intersectObject(terrainMesh, false)[0];
      const route = raycaster.intersectObjects(candidates, false)[0];
      if (!route) return null;
      if (ground && route.distance > ground.distance + 1.5) return null;
      return route.object.userData.properties;
    };

    const selectRoute = (properties) => {
      const {
        day: currentDay,
        isSingleDayView: single,
        dispatchLayerDetails,
        setSingleDayView,
      } = propsRef.current;
      if (properties.day === "20") return;
      ReactGA.event({
        category: "Route",
        action: "Click Route Line",
        label: `Day ${properties.day} - ${properties.name || "Route"} - from Day ${currentDay} - ${isDesktop ? "Desktop" : "Mobile"}`,
      });
      dispatchLayerDetails(properties);
      if (!isDesktop && single && properties.day === currentDay) {
        setSingleDayView(false);
        return;
      }
      setSingleDayView(true);
    };

    const canvas = renderer.domElement;
    let drag = null;
    let hoverPending = null;
    const hover = (clientX, clientY) => {
      const properties = pickRoute(clientX, clientY);
      canvas.style.cursor = properties ? "pointer" : "";
      if (!properties) return;
      const { day: current, isSingleDayView: single, dispatchLayerDetails } = propsRef.current;
      if (single && isDesktop) return;
      if (properties.day !== current) dispatchLayerDetails(properties);
    };
    const onDown = (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag) {
        if (e.pointerType !== "mouse" || hoverPending) return;
        hoverPending = requestAnimationFrame(() => {
          hoverPending = null;
          hover(e.clientX, e.clientY);
        });
        return;
      }
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      view.azimuth -= dx * 0.005;
      if (!aimedAtRoute) overviewAzimuth = view.azimuth;
      view.elevation = Math.min(
        CAMERA.maxElevation,
        Math.max(CAMERA.minElevation, view.elevation + dy * 0.25),
      );
      drag.x = e.clientX;
      drag.y = e.clientY;
      render();
    };
    const onUp = (e) => {
      const wasClick = drag && drag.moved < 6;
      drag = null;
      if (!wasClick) return;
      const properties = pickRoute(e.clientX, e.clientY);
      if (properties) selectRoute(properties);
    };
    const onCancel = () => {
      drag = null;
    };
    const onLeave = () => {
      canvas.style.cursor = "";
    };
    const onWheel = (e) => {
      e.preventDefault();
      view.zoom = Math.min(
        CAMERA.maxZoom,
        Math.max(CAMERA.minZoom, view.zoom * Math.exp(e.deltaY * 0.001)),
      );
      render();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let cancelled = false;
    const area = squareArea();
    const imageryZoom = ACTIVE_OPTION.kind === "satellite" ? ACTIVE_OPTION.imageryZoom : 0;
    Promise.all([loadElevation(area), imageryZoom ? loadImagery(area, imageryZoom) : null])
      .then(([elevation, imagery]) => {
        if (cancelled) return;
        terrain = buildTerrain(area, elevation, imagery);
        if (terrain.meshes) {
          scene.add(...terrain.meshes);
          terrainMesh = terrain.pickMesh;
          if (LOOK.shadows) {
            terrain.meshes.forEach((m) => {
              m.castShadow = true;
              m.receiveShadow = true;
            });
          }
          (terrain.lineMaterials || []).forEach((material) => lineMaterials.push(material));
        } else {
          const topGeometry = flatGeometry(terrain.top);
          if (LOOK.elevationStops) {
            topGeometry.setAttribute(
              "color",
              new THREE.Float32BufferAttribute(topoColors(terrain), 3),
            );
          }
          terrainMesh = new THREE.Mesh(
            topGeometry,
            new THREE.MeshLambertMaterial(
              LOOK.elevationStops
                ? { vertexColors: true, flatShading: true }
                : { color: LOOK.top, flatShading: true },
            ),
          );
          const sideMesh = new THREE.Mesh(
            flatGeometry(terrain.side),
            new THREE.MeshLambertMaterial({
              color: LOOK.side,
              emissive: LOOK.sideGlow,
              emissiveIntensity: 0.45,
              flatShading: true,
            }),
          );
          scene.add(terrainMesh, sideMesh);
          if (LOOK.shadows) {
            terrainMesh.castShadow = true;
            terrainMesh.receiveShadow = true;
            sideMesh.castShadow = true;
          }
        }
        if (LOOK.contourStep) {
          scene.add(
            new THREE.LineSegments(
              contourGeometry(terrain, LOOK.contourStep),
              new THREE.LineBasicMaterial({
                color: LOOK.contour,
                transparent: true,
                opacity: LOOK.contourOpacity,
              }),
            ),
          );
        }
        if (LOOK.frame) {
          scene.add(
            new THREE.Mesh(frameGeometry(), new THREE.MeshLambertMaterial({ color: LOOK.frame })),
          );
        }
        if (LOOK.shadows) {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          sun.castShadow = true;
          sun.shadow.mapSize.set(2048, 2048);
          sun.shadow.bias = -0.0004;
          sun.shadow.normalBias = 0.3;
          Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 400 });
          sun.shadow.camera.updateProjectionMatrix();
          const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(SLAB_WIDTH * 4, SLAB_WIDTH * 4),
            new THREE.ShadowMaterial({ opacity: 0.28 }),
          );
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -SLAB_THICKNESS - 0.02;
          ground.receiveShadow = true;
          scene.add(ground);
        }
        mount.dataset.points = terrain.pointCount;
        mount.dataset.triangles = terrain.faceCount || terrain.triangles.length;
        if (terrain.massifCount != null) mount.dataset.massifs = terrain.massifCount;
        if (terrain.peaks) mount.dataset.peaks = JSON.stringify(terrain.peaks);
        if (LOOK.shadowPlane !== false) {
          const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(SLAB_WIDTH * 1.9, SLAB_WIDTH * 1.9),
            new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
          );
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = -SLAB_THICKNESS - 14;
          scene.add(shadow);
        }
        const routes = addRoutes(scene, terrain);
        routeLines = routes.lines;
        routeHits = routes.hits;
        routeLines.forEach((line) => lineMaterials.push(line.material));
        discs = addDiscs(scene, terrain);
        resize();
        sceneRef.current = { frameDay, restyleRoutes };
        const { day: current, isSingleDayView: single } = propsRef.current;
        restyleRoutes(current, single);
        frameDay(current, single, false);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      sceneRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      if (hoverPending) cancelAnimationFrame(hoverPending);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
      const dispose = (object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      };
      scene.traverse(dispose);
      routeHits.forEach(dispose);
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.restyleRoutes(day, isSingleDayView);
  }, [day, isSingleDayView]);

  const frameKey = isSingleDayView ? day : "overview";
  useEffect(() => {
    if (!sceneRef.current) return;
    const { day: current, isSingleDayView: single } = propsRef.current;
    sceneRef.current.frameDay(current, single, true);
  }, [frameKey]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1000,
        background: LOOK.background,
        overflow: "hidden",
      }}
    >
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      {LOOK.tiltShift &&
        ["top", "bottom"].map((edge) => (
          <div
            key={edge}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              [edge]: 0,
              height: TILT.height,
              pointerEvents: "none",
              backdropFilter: `blur(${TILT.blur}px)`,
              WebkitBackdropFilter: `blur(${TILT.blur}px)`,
              maskImage: `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, black 20%, transparent)`,
              WebkitMaskImage: `linear-gradient(to ${edge === "top" ? "bottom" : "top"}, black 20%, transparent)`,
            }}
          />
        ))}
      {LOOK.credit && (
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 8,
            fontSize: 10,
            color: "rgba(40, 40, 40, 0.7)",
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            pointerEvents: "none",
          }}
        >
          {LOOK.credit}
        </div>
      )}
      {status !== "ready" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            width: "100%",
            textAlign: "center",
            color: "#5f8aa3",
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 13,
          }}
        >
          {status === "loading" ? "Loading terrain" : "3D terrain unavailable"}
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  day: state.route.day,
  isSingleDayView: state.mapState.isSingleDayView,
});

export default connect(mapStateToProps, mapDispatchToProps)(Terrain3D);
