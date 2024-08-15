import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import airportIcon from "../resources/images/airport.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";
import oneIcon from "../resources/images/1.svg";
import twoIcon from "../resources/images/2.svg";
import { IMarker } from "../interfaces/interfaces";

const markers: any[] = [
  {
    // Phakding
    point: [27.74004, 86.712555],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "1",
      icon: tentIcon,
      name: "Phakding",
      startAlt: "8,563",
      direction: "right",
      background: "white",
    },
  },
  {
    // Namche Bazaar
    point: [27.8069, 86.714],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "2 & 3",
      icon: tentIcon,
      name: "Namche Bazaar",
      startAlt: "11,286",
      direction: "right",
    },
  },
  {
    // Tengboche
    point: [27.8362, 86.7646],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "4",
      icon: tentIcon,
      name: "Tengboche",
      startAlt: "12,644",
      direction: "right",
    },
  },
  {
    // Dingboche
    point: [27.8923, 86.8314],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "5",
      icon: tentIcon,
      name: "Dingboche",
      startAlt: "14,470",
      direction: "right",
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
    },
  },
  {
    // Lobuche
    point: [27.9485, 86.8104],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "8 & 9",
      icon: tentIcon,
      name: "Lobuche",
      startAlt: "16,210",
      direction: "auto",
    },
  },
  {
    // Gorak Shep
    point: [27.9809, 86.8285],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "10, 11 & 12",
      icon: tentIcon,
      name: "Gorak Shep",
      startAlt: "16,942",
      direction: "right",
    },
  },
  {
    // Dzongla
    point: [27.9397, 86.7733],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "13",
      icon: tentIcon,
      name: "Dzongla",
      startAlt: "15,850",
      direction: "bottom",
    },
  },
  {
    // Thangnak
    point: [27.94058, 86.721246],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "14",
      icon: tentIcon,
      name: "Thangnak",
      startAlt: "15,420",
      direction: "bottom",
    },
  },
  {
    // Gokyo
    point: [27.9535, 86.6945],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "15, 16 & 17",
      icon: tentIcon,
      name: "Gokyo",
      startAlt: "15,720",
      direction: "bottom",
    },
  },
  {
    // Marlung
    point: [27.8877, 86.6365],
    icon: tentIcon,
    size: [10, 10],
    properties: {
      day: "19",
      icon: tentIcon,
      name: "Marlung",
      startAlt: "18,058",
      direction: "right",
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
      name: "Chhukung Ri Summit",
      startAlt: "18,058",
      direction: "right",
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
    },
  },
  {
    // Kala Patthar
    point: [27.995700274264355, 86.82849997210725],
    icon: summitIcon,
    size: [24, 24],
    properties: {
      day: "12",
      icon: summitIcon,
      name: "Kala Patthar Sumnmit",
      startAlt: "18,519",
      direction: "auto",
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
      name: "Gokyo Ri Summit",
      startAlt: "17,989",
      direction: "top",
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
      name: "Kongma La Pass",
      startAlt: "18,058",
      direction: "bottom",
    },
  },
  {
    // Cho La
    point: [27.962122, 86.751923],
    icon: passIcon,
    size: [24, 24],
    properties: {
      day: "14",
      icon: passIcon,
      name: "Cho La Pass",
      startAlt: "17,625",
      direction: "top",
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
      name: "Renjo La Pass",
      startAlt: "17,680",
      direction: "left",
    },
  },
  {
    // Airport
    point: [27.68725044382488, 86.73143742664253],
    icon: airportIcon,
    size: [22, 22],
    properties: {
      day: "0",
      icon: airportIcon,
      name: "Lukla",
      startAlt: "9,383",
      direction: "auto",
    },
  },
];
const getMarkers = () => markers;

export { getMarkers };
