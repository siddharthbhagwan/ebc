import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import airportIcon from "../resources/images/airport.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";

// Pre-calculated label visibility priorities and conflict groups
// Based on geographic proximity - when labels would overlap at lower zoom levels
// Priority: 1 = always show, 2 = show at medium zoom, 3 = show at higher zoom, 4 = only when zoomed in
// Conflict groups: labels in same group may overlap - lower priority hides first

const markers = [
  {
    // Phakding
    point: [27.74018, 86.71263],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "1",
      icon: tentIcon,
      name: "Phakding",
      startAlt: "8,563",
      direction: "right",
      background: "white",
      labelPriority: 3,
      conflictGroup: "lower-trail",
    },
  },
  {
    // Namche Bazaar
    point: [27.80695, 86.71371],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "2, 3 & 19",
      icon: tentIcon,
      name: "Namche Bazaar",
      startAlt: "11,286",
      direction: "right",
      labelPriority: 2,
      conflictGroup: "namche-area",
    },
  },
  {
    // Tengboche
    point: [27.83606, 86.76477],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "4",
      icon: tentIcon,
      name: "Tengboche",
      startAlt: "12,644",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "mid-trail",
    },
  },
  {
    // Dingboche
    point: [27.89264, 86.8304],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "5",
      icon: tentIcon,
      name: "Dingboche",
      startAlt: "14,470",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "dingboche-chhukung",
    },
  },
  {
    // Chhukung
    point: [27.9045, 86.8713],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "6 & 7",
      icon: tentIcon,
      name: "Chhukung",
      startAlt: "15,535",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "dingboche-chhukung",
    },
  },
  {
    // Lobuche
    point: [27.948426, 86.810534],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "8, 9 & 12",
      icon: tentIcon,
      name: "Lobuche",
      startAlt: "16,210",
      direction: "right",
      labelPriority: 2,
      conflictGroup: "ebc-area",
    },
  },
  {
    // Gorak Shep
    point: [27.98094, 86.82939],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "10 & 11",
      icon: tentIcon,
      name: "Gorak Shep",
      startAlt: "16,942",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "ebc-area",
    },
  },
  {
    // Dzongla
    point: [27.93929, 86.77398],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "13",
      icon: tentIcon,
      name: "Dzongla",
      startAlt: "15,850",
      direction: "bottom",
      labelPriority: 3,
      conflictGroup: "cho-la-area",
    },
  },
  {
    // Thangnak
    point: [27.94088, 86.72055],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "14",
      icon: tentIcon,
      name: "Thangnak",
      startAlt: "15,420",
      direction: "bottom",
      labelPriority: 3,
      conflictGroup: "gokyo-area",
    },
  },
  {
    // Gokyo
    point: [27.95417, 86.69377],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "15, 16 & 17",
      icon: tentIcon,
      name: "Gokyo",
      startAlt: "15,720",
      direction: "bottom",
      labelPriority: 3,
      conflictGroup: "gokyo-area",
    },
  },
  {
    // Marlung
    point: [27.88825, 86.63783],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "18",
      icon: tentIcon,
      name: "Marlung",
      startAlt: "13,566",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "renjo-area",
    },
  },
  {
    // Chhukung Ri
    point: [27.925527275065452, 86.87898159027101],
    icon: summitIcon,
    size: [24, 24],
    properties: {
      day: "7",
      color: "red",
      icon: summitIcon,
      name: "Chhukung Ri",
      startAlt: "18,058",
      direction: "right",
      labelPriority: 3,
      conflictGroup: "dingboche-chhukung",
    },
  },
  {
    // EBC
    point: [28.004240016938017, 86.85706000015217],
    icon: ebcIcon,
    size: [24, 24],
    properties: {
      day: "10",
      icon: ebcIcon,
      name: "Everest Base Camp",
      startAlt: "17,600",
      direction: "right",
      labelPriority: 1,
      conflictGroup: "ebc-area",
    },
  },
  {
    // Kala Patthar
    point: [27.9957, 86.8285],
    icon: summitIcon,
    size: [24, 24],
    properties: {
      day: "12",
      icon: summitIcon,
      name: "Kala Patthar",
      startAlt: "18,519",
      direction: "auto",
      labelPriority: 2,
      conflictGroup: "ebc-area",
    },
  },
  {
    // Gokyo Ri
    point: [27.962148839539353, 86.68291701535055],
    icon: summitIcon,
    size: [24, 24],
    properties: {
      day: "16",
      icon: summitIcon,
      name: "Gokyo Ri",
      startAlt: "17,989",
      direction: "top",
      labelPriority: 2,
      conflictGroup: "gokyo-area",
    },
  },
  {
    // Kongma La
    point: [27.92990551745897, 86.83660816488556],
    icon: passIcon,
    size: [24, 24],
    properties: {
      day: "8",
      icon: passIcon,
      name: "Kongma La",
      startAlt: "18,058",
      direction: "bottom",
      labelPriority: 3,
      conflictGroup: "dingboche-chhukung",
    },
  },
  {
    // Cho La
    point: [27.96211, 86.75169],
    icon: passIcon,
    size: [24, 24],
    properties: {
      day: "14",
      icon: passIcon,
      name: "Cho La",
      startAlt: "17,625",
      direction: "top",
      labelPriority: 2,
      conflictGroup: "cho-la-area",
    },
  },
  {
    // Renjo La
    point: [27.9473697, 86.6584966],
    icon: passIcon,
    size: [24, 24],
    properties: {
      day: "18",
      icon: passIcon,
      name: "Renjo La",
      startAlt: "17,680",
      direction: "left",
      labelPriority: 2,
      conflictGroup: "renjo-area",
    },
  },
  {
    // Airport
    point: [27.68725044382488, 86.73143742664253],
    icon: airportIcon,
    size: [12, 12],
    properties: {
      day: "0 & 20",
      icon: airportIcon,
      name: "Lukla",
      startAlt: "9,383",
      direction: "auto",
      labelPriority: 2,
      conflictGroup: "lower-trail",
    },
  },
];

// Pre-calculated zoom thresholds for label visibility
// Values are added to baseZoom - negative means show even when zoomed out
const LABEL_ZOOM_THRESHOLDS = {
  1: -Infinity, // Always show (EBC)
  2: -0.5,      // Show at base zoom and slightly zoomed out (major landmarks, passes, summits)
  3: 0,         // Show at base zoom (secondary camps)
  4: 0.5,       // Show when slightly zoomed in (minor camps)
};

const getMarkers = () => markers;
const getLabelZoomThresholds = () => LABEL_ZOOM_THRESHOLDS;

export { getMarkers, getLabelZoomThresholds };
