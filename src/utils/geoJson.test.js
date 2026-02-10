/**
 * GeoJSON Data Tests
 * Tests for the structure and integrity of trek route data
 */

import { getDayWiseDataG } from "./geoJson";

describe("GeoJSON Route Data", () => {
  const routes = getDayWiseDataG();

  describe("Data Structure", () => {
    it("should have 21 days (Day 0 through Day 20)", () => {
      const days = Object.keys(routes).map(Number).sort((a, b) => a - b);
      expect(days).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    });

    it("should have a FeatureCollection for each day", () => {
      Object.values(routes).forEach((route) => {
        expect(route).toHaveProperty("features");
        expect(Array.isArray(route.features)).toBe(true);
        expect(route.features.length).toBeGreaterThan(0);
      });
    });

    it("should have properties on the first feature of each day", () => {
      Object.values(routes).forEach((route) => {
        const feature = route.features[0];
        expect(feature).toHaveProperty("properties");
        expect(feature.properties).toHaveProperty("day");
        expect(feature.properties).toHaveProperty("name");
      });
    });
  });

  describe("Day 0 - Overview", () => {
    const day0 = routes[0];

    it("should exist", () => {
      expect(day0).toBeDefined();
    });

    it("should have day property '0'", () => {
      expect(day0.features[0].properties.day).toBe("0");
    });

    it("should have the full trek name", () => {
      expect(day0.features[0].properties.name).toBe("Everest Base Camp 3 Pass Trek");
    });

    it("should have isOverview flag set to true", () => {
      expect(day0.features[0].properties.isOverview).toBe(true);
    });

    it("should have empty metrics (no distance, time, altitude)", () => {
      const props = day0.features[0].properties;
      expect(props.distance).toBe("");
      expect(props.time).toBe("");
      expect(props.startAlt).toBe("");
      expect(props.endAlt).toBe("");
      expect(props.peakAlt).toBe("");
      expect(props.total_climb).toBe("");
      expect(props.descent).toBe("");
    });

    it("should have Point geometry (not a route line)", () => {
      expect(day0.features[0].geometry.type).toBe("Point");
    });

    it("should have center coordinates at the overview center", () => {
      const coords = day0.features[0].geometry.coordinates;
      expect(coords.length).toBeGreaterThanOrEqual(2);
      // Should be in the Everest region
      expect(coords[0]).toBeCloseTo(86.764, 1); // longitude
      expect(coords[1]).toBeCloseTo(27.840, 1); // latitude
    });
  });

  describe("Rest Days", () => {
    const restDays = [3, 9, 11, 17];

    restDays.forEach((dayNum) => {
      it(`Day ${dayNum} should be a rest day`, () => {
        const props = routes[dayNum].features[0].properties;
        expect(props.time).toBe("Rest Day");
      });

      it(`Day ${dayNum} should have zero distance`, () => {
        const props = routes[dayNum].features[0].properties;
        expect(props.distance).toBe("0 mi / 0 km");
      });

      it(`Day ${dayNum} should have zero climb and descent`, () => {
        const props = routes[dayNum].features[0].properties;
        expect(props.total_climb).toBe("0");
        expect(props.descent).toBe("0");
      });

      it(`Day ${dayNum} should have same start and end altitude`, () => {
        const props = routes[dayNum].features[0].properties;
        expect(props.startAlt).toBe(props.endAlt);
      });

      it(`Day ${dayNum} should have Point geometry (rendered by POI.js, not GeoJsonRoutes)`, () => {
        // ARCHITECTURE NOTE: Rest day Point features are for metadata only.
        // Visual markers are rendered by POI.js from markers.jsx.
        // GeoJsonRoutes.js skips Point features to prevent duplicate markers.
        const feature = routes[dayNum].features[0];
        expect(feature.geometry.type).toBe("Point");
      });
    });
  });

  describe("Point Feature Architecture", () => {
    // CRITICAL: This test documents an important architectural rule
    // Point features in geoJson.js are used for route metadata ONLY.
    // POI.js (using markers.jsx) is the sole renderer of all map markers.
    // GeoJsonRoutes.js must skip Point features to prevent duplicate markers.

    it("should have Point geometry for Day 0 (overview center, not rendered by GeoJsonRoutes)", () => {
      expect(routes[0].features[0].geometry.type).toBe("Point");
    });

    it("should have Point geometry for all rest days (metadata only)", () => {
      [3, 9, 11, 17].forEach((dayNum) => {
        expect(routes[dayNum].features[0].geometry.type).toBe("Point");
      });
    });

    it("should have MultiLineString geometry for all active trek days", () => {
      const activeDays = [1, 2, 4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 18, 19, 20];
      activeDays.forEach((dayNum) => {
        expect(routes[dayNum].features[0].geometry.type).toBe("MultiLineString");
      });
    });
  });

  describe("Day 17 - Gokyo Chill Day", () => {
    it("should be named 'Gokyo Chill Day'", () => {
      const props = routes[17].features[0].properties;
      expect(props.name).toBe("Gokyo Chill Day");
    });
  });

  describe("Active Trek Days", () => {
    const activeDays = [1, 2, 4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 18, 19, 20];

    activeDays.forEach((dayNum) => {
      it(`Day ${dayNum} should have route geometry (MultiLineString)`, () => {
        const feature = routes[dayNum].features[0];
        expect(feature.geometry.type).toBe("MultiLineString");
      });

      it(`Day ${dayNum} should have non-empty distance`, () => {
        const props = routes[dayNum].features[0].properties;
        expect(props.distance).toBeTruthy();
        expect(props.distance).not.toBe("0 mi / 0 km");
      });

      it(`Day ${dayNum} should have coordinates with elevation data`, () => {
        const coords = routes[dayNum].features[0].geometry.coordinates;
        expect(coords.length).toBeGreaterThan(0);
        // Each linestring should have points with [lon, lat, elevation]
        expect(coords[0].length).toBeGreaterThan(0);
        expect(coords[0][0].length).toBe(3);
      });
    });
  });

  describe("Day Continuity", () => {
    it("should have day strings matching their key index", () => {
      Object.entries(routes).forEach(([key, route]) => {
        const dayProp = route.features[0].properties.day;
        expect(dayProp).toBe(key);
      });
    });
  });
});
