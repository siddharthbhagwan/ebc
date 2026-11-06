import { getDayWiseDataG } from "./geoJson";

// Same window Terrain3D squares into the slab. Direction in this box matches
// the 3D camera, because both axes are meters.
const AREA = { south: 27.62, north: 28.09, west: 86.6, east: 86.92 };

const squareBounds = () => {
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
  };
};

// +x east, +z south. Same orientation as Terrain3D.toWorld.
const toSlab = (lng, lat, area) => [
  (lng - area.west) / (area.east - area.west),
  (area.north - lat) / (area.north - area.south),
];

// Azimuth that looks along the route. 0 looks north.
// The axis is the line's principal direction, signed from the start toward the end
// (toward the farthest point when the day doubles back). Null when there is no direction.
export const routeCameraAzimuth = (points) => {
  const n = points.length;
  if (n < 2) return null;
  let mx = 0;
  let mz = 0;
  for (let i = 0; i < n; i += 1) {
    mx += points[i][0];
    mz += points[i][1];
  }
  mx /= n;
  mz /= n;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = points[i][0] - mx;
    const dz = points[i][1] - mz;
    sxx += dx * dx;
    szz += dz * dz;
    sxz += dx * dz;
  }
  if (sxx + szz < 1e-8) return null;
  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  let lookX = Math.cos(theta);
  let lookZ = Math.sin(theta);
  let signX = points[n - 1][0] - points[0][0];
  let signZ = points[n - 1][1] - points[0][1];
  if (signX * signX + signZ * signZ < 1e-8) {
    let best = 0;
    for (let i = 1; i < n; i += 1) {
      const dx = points[i][0] - points[0][0];
      const dz = points[i][1] - points[0][1];
      const d = dx * dx + dz * dz;
      if (d > best) {
        best = d;
        signX = dx;
        signZ = dz;
      }
    }
  }
  if (lookX * signX + lookZ * signZ < 0) {
    lookX = -lookX;
    lookZ = -lookZ;
  }
  return Math.atan2(-lookX, -lookZ);
};

// MapLibre bearing: degrees clockwise from north for the direction that is up.
// Travel west means west is up (bearing -90).
export const mapBearingFromAzimuth = (azimuth) => {
  const deg = (Math.atan2(-Math.sin(azimuth), Math.cos(azimuth)) * 180) / Math.PI;
  return ((deg + 540) % 360) - 180;
};

const isRestDay = (routes, day) => {
  const features = routes[day] && routes[day].features;
  return Boolean(features && features[0] && features[0].properties.time === "Rest Day");
};

const lineCoords = (routes, day) => {
  const line = [];
  ((routes[day] || {}).features || []).forEach((feature) => {
    const g = feature.geometry || {};
    if (g.type === "MultiLineString") g.coordinates.forEach((part) => line.push(...part));
    else if (g.type === "LineString") line.push(...g.coordinates);
  });
  return line;
};

// Shared by the 3D camera and the 2D map. Null for overview, rest days, and points.
export const dayTravel = (dayKey) => {
  if (dayKey == null || dayKey === "0" || dayKey === 0) return null;
  const routes = getDayWiseDataG();
  const key = String(dayKey);
  if (isRestDay(routes, key)) return null;
  const line = lineCoords(routes, key);
  if (line.length < 2) return null;
  const area = squareBounds();
  const azimuth = routeCameraAzimuth(line.map(([lng, lat]) => toSlab(lng, lat, area)));
  if (azimuth == null) return null;
  return { azimuth, bearing: mapBearingFromAzimuth(azimuth) };
};
