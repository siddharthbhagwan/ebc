import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import airportIcon from "../resources/images/airport.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";
import { IMarker } from "../interfaces/interfaces";

const markers: IMarker[] = [
	{
		// Phakding
		point: [27.74004, 86.712555],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "1",
			name: "Phakding",
			startAlt: "8,563",
		},
	},
	{
		// Namche Bazaar
		point: [27.8069, 86.714],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "2 & 3",
			name: "Namche Bazaar",
			startAlt: "11,286",
		},
	},
	{
		// Tengboche
		point: [27.8362, 86.7646],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "4",
			name: "Tengboche",
			startAlt: "12,644",
		},
	},
	{
		// Dingboche
		point: [27.8923, 86.8314],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "5",
			name: "Dingboche",
			startAlt: "14,470",
		},
	},
	{
		// Chhukung
		point: [27.9045, 86.8713],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "6 & 7",
			name: "Chhukung",
			startAlt: "15,535",
		},
	},
	{
		// Lobuche
		point: [27.9485, 86.8104],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "8 & 9",
			name: "Lobuche",
			startAlt: "16,210",
		},
	},
	{
		// Gorak Shep
		point: [27.9809, 86.8285],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "10, 11 & 12",
			name: "Gorak Shep",
			startAlt: "16,942",
		},
	},
	{
		// Dzongla
		point: [27.9397, 86.7733],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "13",
			name: "Dzongla",
			startAlt: "15,850",
		},
	},
	{
		//Thangnak
		point: [27.94058, 86.721246],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "14",
			name: "Thangnak",
			startAlt: "15,420",
		},
	},
	{
		// Gokyo
		point: [27.9535, 86.6945],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "15, 16 & 17",
			name: "Gokyo",
			startAlt: "15,720",
		},
	},
	{
		// Marlung
		point: [27.8877, 86.6365],
		icon: tentIcon,
		size: [15, 15],
		properties: {
			day: "19",
			name: "Chhukung Ri Summit",
			startAlt: "18,058",
		},
	},
	{
		// Chhukung Ri
		point: [27.925527275065452, 86.87898159027101],
		icon: summitIcon,
		size: [24, 24],
		properties: {
			day: "7",
			name: "Chhukung Ri Summit",
			startAlt: "18,058",
		},
	},
	{
		// EBC
		point: [28.004240016938017, 86.85706000015217],
		icon: ebcIcon,
		size: [24, 24],
		properties: {
			day: "10",
			name: "Everest Base Camp",
			startAlt: "17,600",
		},
	},
	{
		// Kala Patthar
		point: [27.995700274264355, 86.82849997210725],
		icon: summitIcon,
		size: [24, 24],
		properties: {
			day: "12",
			name: "Kala Patthar Sumnmit",
			startAlt: "18,519",
		},
	},
	{
		// Gokyo Ri
		point: [27.962148839539353, 86.68291701535055],
		icon: summitIcon,
		size: [24, 24],
		properties: {
			day: "16",
			name: "Gokyo Ri Summit",
			startAlt: "17,989",
		},
	},
	{
		// Kongma La
		point: [27.92990551745897, 86.83660816488556],
		icon: passIcon,
		size: [24, 24],
		properties: {
			day: "8",
			name: "Kongma La Pass",
			startAlt: "18,058",
		},
	},
	{
		// Cho La
		point: [27.962122, 86.751923],
		icon: passIcon,
		size: [24, 24],
		properties: {
			day: "14",
			name: "Cho La Pass",
			startAlt: "17,625",
		},
	},
	{
		// Renjo La
		point: [27.9473697, 86.6584966],
		icon: passIcon,
		size: [24, 24],
		properties: {
			day: "18",
			name: "Renjo La Pass",
			startAlt: "17,680",
		},
	},
	{
		// Airport
		point: [27.68725044382488, 86.73143742664253],
		icon: airportIcon,
		size: [22, 22],
		properties: {
			day: "0",
			name: "Airport",
			startAlt: "9,383",
		},
	},
];
const getMarkers = () => markers;

export { getMarkers };
