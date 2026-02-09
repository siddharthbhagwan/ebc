/**
 * Height Gradient Utility Tests
 * Tests for elevation-based color mapping and gradient segment creation
 */

import {
  getColorForElevation,
  getFeatureColor,
  getFeatureStyle,
  createGradientSegments,
  GRADIENT_COLORS,
} from "./heightGradient";

describe("Height Gradient Constants", () => {
  it("should have 22 gradient colors", () => {
    expect(GRADIENT_COLORS).toHaveLength(22);
  });

  it("should start with green (low elevation)", () => {
    expect(GRADIENT_COLORS[0]).toBe("#4caf50");
  });

  it("should end with deep maroon (high elevation)", () => {
    expect(GRADIENT_COLORS[GRADIENT_COLORS.length - 1]).toBe("#5e0000");
  });
});

describe("getColorForElevation", () => {
  it("should return green for low elevations (~2600m)", () => {
    const color = getColorForElevation(2600);
    expect(color).toBe(GRADIENT_COLORS[0]); // #4caf50
  });

  it("should return deep maroon for high elevations (~5500m)", () => {
    const color = getColorForElevation(5500);
    expect(color).toBe(GRADIENT_COLORS[GRADIENT_COLORS.length - 1]); // #5e0000
  });

  it("should return a mid-range color for mid elevations (~4050m)", () => {
    const color = getColorForElevation(4050);
    expect(GRADIENT_COLORS).toContain(color);
    // ~4050m is roughly in the middle of the range
    const index = GRADIENT_COLORS.indexOf(color);
    expect(index).toBeGreaterThan(3);
    expect(index).toBeLessThan(18);
  });

  it("should clamp below-minimum elevations to the lowest color", () => {
    const color = getColorForElevation(1000);
    expect(color).toBe(GRADIENT_COLORS[0]);
  });

  it("should clamp above-maximum elevations to the highest color", () => {
    const color = getColorForElevation(8000);
    expect(color).toBe(GRADIENT_COLORS[GRADIENT_COLORS.length - 1]);
  });

  it("should return consistent colors for the same elevation", () => {
    const color1 = getColorForElevation(3500);
    const color2 = getColorForElevation(3500);
    expect(color1).toBe(color2);
  });

  it("should return progressively warmer colors as elevation increases", () => {
    const colorLow = getColorForElevation(2800);
    const colorMid = getColorForElevation(4000);
    const colorHigh = getColorForElevation(5200);

    const indexLow = GRADIENT_COLORS.indexOf(colorLow);
    const indexMid = GRADIENT_COLORS.indexOf(colorMid);
    const indexHigh = GRADIENT_COLORS.indexOf(colorHigh);

    expect(indexLow).toBeLessThan(indexMid);
    expect(indexMid).toBeLessThan(indexHigh);
  });
});

describe("getFeatureColor", () => {
  it("should return default blue for null feature", () => {
    expect(getFeatureColor(null)).toBe("#0033ff");
  });

  it("should return default blue for feature with no geometry", () => {
    expect(getFeatureColor({ type: "Feature" })).toBe("#0033ff");
  });

  it("should return default blue for feature with empty coordinates", () => {
    expect(
      getFeatureColor({
        type: "Feature",
        geometry: { type: "MultiLineString", coordinates: [] },
      })
    ).toBe("#0033ff");
  });

  it("should return a valid gradient color for a feature with elevation data", () => {
    const feature = {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [86.73, 27.69, 2860],
            [86.74, 27.70, 2900],
            [86.75, 27.71, 2850],
          ],
        ],
      },
    };
    const color = getFeatureColor(feature);
    expect(GRADIENT_COLORS).toContain(color);
  });

  it("should calculate average elevation for color", () => {
    // Feature with uniform elevation of ~4050m (middle of range)
    const feature = {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [86.73, 27.69, 4050],
            [86.74, 27.70, 4050],
            [86.75, 27.71, 4050],
          ],
        ],
      },
    };
    const color = getFeatureColor(feature);
    const index = GRADIENT_COLORS.indexOf(color);
    // Mid-range elevation should give a mid-range index
    expect(index).toBeGreaterThan(3);
    expect(index).toBeLessThan(18);
  });
});

describe("getFeatureStyle", () => {
  it("should return style object with color, weight, opacity", () => {
    const feature = {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [86.73, 27.69, 3000],
            [86.74, 27.70, 3100],
          ],
        ],
      },
    };
    const style = getFeatureStyle(feature);
    expect(style).toHaveProperty("color");
    expect(style).toHaveProperty("weight", 3);
    expect(style).toHaveProperty("opacity", 0.8);
    expect(style).toHaveProperty("lineCap", "round");
    expect(style).toHaveProperty("lineJoin", "round");
  });

  it("should return default blue style for null feature", () => {
    const style = getFeatureStyle(null);
    expect(style.color).toBe("#0033ff");
  });
});

describe("createGradientSegments", () => {
  it("should return empty array for empty coordinates", () => {
    expect(createGradientSegments([])).toEqual([]);
  });

  it("should create segments from MultiLineString coordinates", () => {
    const coordinates = [
      [
        [86.73, 27.69, 2600],
        [86.74, 27.70, 2600],
        [86.75, 27.71, 5500],
        [86.76, 27.72, 5500],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    expect(segments.length).toBeGreaterThan(0);
  });

  it("should create a single segment for uniform elevation", () => {
    const coordinates = [
      [
        [86.73, 27.69, 3000],
        [86.74, 27.70, 3000],
        [86.75, 27.71, 3000],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    expect(segments).toHaveLength(1);
    expect(segments[0].latlngs).toHaveLength(3);
    expect(segments[0].color).toBeDefined();
  });

  it("should have each segment with latlngs and color properties", () => {
    const coordinates = [
      [
        [86.73, 27.69, 2600],
        [86.74, 27.70, 4000],
        [86.75, 27.71, 5500],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    segments.forEach((segment) => {
      expect(segment).toHaveProperty("latlngs");
      expect(segment).toHaveProperty("color");
      expect(Array.isArray(segment.latlngs)).toBe(true);
      expect(segment.latlngs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should convert [lon, lat] coordinates to [lat, lon] in segments", () => {
    const coordinates = [
      [
        [86.73, 27.69, 3000],
        [86.74, 27.70, 3000],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    // First coordinate should be [lat, lon] = [27.69, 86.73]
    expect(segments[0].latlngs[0]).toEqual([27.69, 86.73]);
    expect(segments[0].latlngs[1]).toEqual([27.70, 86.74]);
  });

  it("should maintain continuity between segments (shared endpoint)", () => {
    // Large elevation jump to force different colors/segments
    const coordinates = [
      [
        [86.73, 27.69, 2600],
        [86.74, 27.70, 5500],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    if (segments.length > 1) {
      // Last point of segment N should equal first point of segment N+1
      for (let i = 0; i < segments.length - 1; i++) {
        const lastOfCurrent = segments[i].latlngs[segments[i].latlngs.length - 1];
        const firstOfNext = segments[i + 1].latlngs[0];
        expect(lastOfCurrent).toEqual(firstOfNext);
      }
    }
  });

  it("should handle multiple linestrings in MultiLineString", () => {
    const coordinates = [
      [
        [86.73, 27.69, 3000],
        [86.74, 27.70, 3000],
      ],
      [
        [86.75, 27.71, 4000],
        [86.76, 27.72, 4000],
      ],
    ];
    const segments = createGradientSegments(coordinates);
    expect(segments.length).toBeGreaterThanOrEqual(2);
  });
});
