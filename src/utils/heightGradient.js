/**
 * Height Gradient Color Utility
 * Simple elevation-based color assignment
 */

export const GRADIENT_COLORS = [
  "#1a4d00",
  "#226600",
  "#2a7f00",
  "#339900",
  "#44aa11",
  "#55bb22",
  "#66cc33",
  "#77dd44",
  "#88ee55",
  "#dd9922",
  "#ffaa44",
  "#ffaa33",
  "#ff9922",
  "#ff8811",
  "#ff7700",
  "#ff6600",
  "#ff5511",
  "#ff4422",
  "#ff3333",
  "#ee2211",
  "#dd1111",
  "#cc1111",
  "#bb1111",
  "#991111",
  "#771111",
  "#661111",
];

const getColorFromNormalized = (normalizedElevation) => {
  const clipped = Math.max(0, Math.min(1, normalizedElevation));
  const colorIndex = Math.round(clipped * (GRADIENT_COLORS.length - 1));
  const color = GRADIENT_COLORS[colorIndex];
  return color;
};

/**
 * Extract all elevations from a coordinate array
 * Handles both [lon, lat, elev] and [lat, lon] formats
 * Also handles MultiLineString format: [[[lon, lat, elev], ...], ...]
 */
const getElevationsFromCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  const elevations = [];

  // Handle MultiLineString: coordinates is [[linestring], [linestring], ...]
  // where each linestring is [[lon, lat, elev], [lon, lat, elev], ...]
  for (let lineString of coordinates) {
    if (Array.isArray(lineString)) {
      for (let coord of lineString) {
        if (Array.isArray(coord)) {
          // If it has 3 elements, assume third is elevation
          if (coord.length >= 3) {
            const elevation = coord[2];
            if (typeof elevation === "number") {
              elevations.push(elevation);
            }
          }
        }
      }
    }
  }

  return elevations.length > 0 ? elevations : null;
};

/**
 * Get average elevation color for a feature
 */
export const getFeatureColor = (feature) => {
  if (!feature || !feature.geometry) {
    return "#0033ff"; // Default blue for no data
  }

  const { coordinates } = feature.geometry;

  if (!coordinates || coordinates.length === 0) {
    return "#0033ff";
  }

  // Extract elevations - pass full coordinates array since getElevationsFromCoordinates handles MultiLineString
  const elevations = getElevationsFromCoordinates(coordinates);

  if (!elevations) {
    // No elevation data - return default blue
    return "#0033ff";
  }

  // Calculate average elevation
  const avgElevation =
    elevations.reduce((a, b) => a + b, 0) / elevations.length;

  // For Everest Base Camp trek, elevations range from ~2600m to ~5500m
  // Use actual data range for normalization
  const MIN_REFERENCE = 2600;
  const MAX_REFERENCE = 5500;
  const normalized =
    (avgElevation - MIN_REFERENCE) / (MAX_REFERENCE - MIN_REFERENCE);

  const color = getColorFromNormalized(normalized);
  return color;
};

/**
 * Get full style object for a feature
 */
export const getFeatureStyle = (feature) => {
  const color = getFeatureColor(feature);

  return {
    color: color,
    weight: 3,
    opacity: 0.8,
    lineCap: "round",
    lineJoin: "round",
  };
};

/**
 * Get color for a single elevation value
 * Used for per-segment coloring
 */
export const getColorForElevation = (elevation) => {
  const MIN_REFERENCE = 2600;
  const MAX_REFERENCE = 5500;
  const normalized =
    (elevation - MIN_REFERENCE) / (MAX_REFERENCE - MIN_REFERENCE);
  return getColorFromNormalized(normalized);
};

/**
 * Create polyline segments from coordinates, each colored by elevation
 * Returns array of {latlngs, color} objects
 */
export const createGradientSegments = (coordinates) => {
  const segments = [];

  // Handle MultiLineString format: [[[lon, lat, elev], ...], ...]
  for (let lineString of coordinates) {
    if (Array.isArray(lineString)) {
      // Process consecutive pairs of points to create segments
      for (let i = 0; i < lineString.length - 1; i++) {
        const currentCoord = lineString[i];
        const nextCoord = lineString[i + 1];

        // Extract coordinates - GeoJSON format is [lon, lat, elev], convert to [lat, lon] for Leaflet
        const currentLatlng = [currentCoord[1], currentCoord[0]]; // [lat, lon]
        const nextLatlng = [nextCoord[1], nextCoord[0]]; // [lat, lon]

        // Get elevation of current point
        const elevation = currentCoord[2];
        const color = getColorForElevation(elevation);

        segments.push({
          latlngs: [currentLatlng, nextLatlng],
          color: color,
        });
      }
    }
  }

  return segments;
};

const heightGradient = {
  getFeatureColor,
  getFeatureStyle,
  getColorForElevation,
  createGradientSegments,
  GRADIENT_COLORS,
};

export default heightGradient;
