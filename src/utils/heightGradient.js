/**
 * Height Gradient Color Utility
 * Simple elevation-based color assignment
 */

// Artistically curated palette: Mid Green -> Dark Green -> Mustard -> Orange -> Deep Red
export const GRADIENT_COLORS = [
  "#4caf50", // Mid Green (Start - 2600m)
  "#43a047",
  "#388e3c",
  "#2e7d32",
  "#1b5e20", // Dark Forest Green
  "#33691e", // Olive Transition
  "#558b2f", // Light Olive
  "#827717", // Dark Mustard
  "#9e9d24", // Mustard Yellow
  "#afb42b",
  "#c0ca33", // Lime Yellow
  "#d4e157", // Bright Mustard/Lime
  "#fbc02d", // Gold
  "#ffc107", // Amber
  "#ffb300",
  "#ffa000",
  "#ff9100", // Highlight Orange
  "#ff6d00", // Vivid Orange
  "#e64a19", // Red-Orange
  "#c62828", // Intense Red
  "#8E0000", // Dark Maroon
  "#5e0000", // Deepest Maroon (High Altitude Peak)
];

/**
 * Get color based on normalized elevation (0-1)
 */
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
    if (Array.isArray(lineString) && lineString.length > 0) {
      let currentSegmentLatlngs = [];
      let currentSegmentColor = null;

      for (let i = 0; i < lineString.length; i++) {
        const coord = lineString[i];
        const latlng = [coord[1], coord[0]];
        const elevation = coord[2];
        const color = getColorForElevation(elevation);

        if (currentSegmentColor === null) {
          // First point of the lineString
          currentSegmentColor = color;
          currentSegmentLatlngs.push(latlng);
        } else if (color === currentSegmentColor) {
          // Same color, just add to current segment
          currentSegmentLatlngs.push(latlng);
        } else {
          // Color changed! Finish current segment and start new one
          // The new segment must start at the end of the previous one for continuity
          const lastLatlngOfPrev =
            currentSegmentLatlngs[currentSegmentLatlngs.length - 1];

          segments.push({
            latlngs: currentSegmentLatlngs,
            color: currentSegmentColor,
          });

          currentSegmentColor = color;
          currentSegmentLatlngs = [lastLatlngOfPrev, latlng];
        }
      }

      // Add the last segment
      if (currentSegmentLatlngs.length > 1) {
        segments.push({
          latlngs: currentSegmentLatlngs,
          color: currentSegmentColor,
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
