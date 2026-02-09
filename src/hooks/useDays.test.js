/**
 * useDays Hook Tests
 * Tests for day navigation including Day 0 wrapping behavior.
 * Uses a thin wrapper component to exercise the hook without
 * @testing-library/react-hooks (which is not installed).
 */

import React from "react";
import { render, act } from "@testing-library/react";
import useDays from "./useDays";

// Mock geoJson with days 0 through 20
jest.mock("../utils/geoJson", () => {
  const routes = {};
  // Day 0 - Overview
  routes[0] = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [86.764, 27.84, 0] },
        properties: {
          day: "0",
          name: "Everest Base Camp 3 Pass Trek",
          distance: "",
          time: "",
          startAlt: "",
          endAlt: "",
          peakAlt: "",
          total_climb: "",
          descent: "",
          isOverview: true,
        },
      },
    ],
  };
  // Days 1 through 20
  for (let i = 1; i <= 20; i++) {
    routes[i] = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "MultiLineString",
            coordinates: [[[86.73 + i * 0.01, 27.69, 2860 + i * 100]]],
          },
          properties: {
            day: String(i),
            name: `Route Day ${i}`,
            distance: `${i}.0 mi / ${(i * 1.6).toFixed(1)} km`,
            time: `${i}h`,
            startAlt: `${8000 + i * 500}`,
            endAlt: `${8500 + i * 500}`,
            peakAlt: "",
            total_climb: `${i * 100}`,
            descent: `${i * 50}`,
          },
        },
      ],
    };
  }
  return {
    getDayWiseDataG: () => routes,
  };
});

/**
 * Thin wrapper component that exposes useDays via a mutable ref object,
 * always pointing to the latest hook closures after each render.
 */
function HookWrapper({ hookRef, currentDay, dispatcher }) {
  const hook = useDays(currentDay, dispatcher);
  // Mutate the ref on every render so callers always see fresh closures
  hookRef.current = hook;
  return null;
}

/** Helper – renders the wrapper and returns the ref whose `.current` is { nextDay, prevDay }. */
const setup = (currentDay, dispatcher) => {
  const hookRef = { current: null };
  render(
    <HookWrapper hookRef={hookRef} currentDay={currentDay} dispatcher={dispatcher} />
  );
  return hookRef;
};

describe("useDays Hook", () => {
  let mockDispatcher;

  beforeEach(() => {
    mockDispatcher = jest.fn();
  });

  describe("Initialization", () => {
    it("should initialize at Day 1 index when starting on Day 1", () => {
      const ref = setup("1", mockDispatcher);
      expect(ref.current).toHaveProperty("nextDay");
      expect(ref.current).toHaveProperty("prevDay");
    });

    it("should initialize at Day 0 index when starting on Day 0", () => {
      const ref = setup("0", mockDispatcher);
      expect(ref.current).toHaveProperty("nextDay");
      expect(ref.current).toHaveProperty("prevDay");
    });

    it("should default to Day 1 index for invalid day", () => {
      const ref = setup("999", mockDispatcher);
      // Should still return valid navigation functions
      expect(typeof ref.current.nextDay).toBe("function");
      expect(typeof ref.current.prevDay).toBe("function");
    });
  });

  describe("nextDay Navigation", () => {
    it("should navigate from Day 0 to Day 1", () => {
      const ref = setup("0", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay();
      });

      expect(feature.properties.day).toBe("1");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "1" })
      );
    });

    it("should navigate from Day 1 to Day 2", () => {
      const ref = setup("1", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay();
      });

      expect(feature.properties.day).toBe("2");
    });

    it("should wrap from Day 20 to Day 0", () => {
      const ref = setup("20", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay();
      });

      expect(feature.properties.day).toBe("0");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "0" })
      );
    });
  });

  describe("prevDay Navigation", () => {
    it("should navigate from Day 1 to Day 0", () => {
      const ref = setup("1", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.prevDay();
      });

      expect(feature.properties.day).toBe("0");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "0" })
      );
    });

    it("should wrap from Day 0 to Day 20", () => {
      const ref = setup("0", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.prevDay();
      });

      expect(feature.properties.day).toBe("20");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "20" })
      );
    });

    it("should navigate from Day 5 to Day 4", () => {
      const ref = setup("5", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.prevDay();
      });

      expect(feature.properties.day).toBe("4");
    });
  });

  describe("Consecutive Navigation", () => {
    it("should navigate forward from Day 0 and dispatch Day 1", () => {
      const ref = setup("0", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay();
      });
      expect(feature.properties.day).toBe("1");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "1" })
      );
    });

    it("should navigate backward from Day 3 and dispatch Day 2", () => {
      const ref = setup("3", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.prevDay();
      });
      expect(feature.properties.day).toBe("2");
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({ day: "2" })
      );
    });

    it("should navigate forward from every day (0-20) to the next", () => {
      for (let day = 0; day <= 20; day++) {
        const dispatcher = jest.fn();
        const ref = setup(String(day), dispatcher);

        let feature;
        act(() => {
          feature = ref.current.nextDay();
        });

        const expectedDay = day === 20 ? "0" : String(day + 1);
        expect(feature.properties.day).toBe(expectedDay);
      }
    });

    it("should navigate backward from every day (0-20) to the previous", () => {
      for (let day = 0; day <= 20; day++) {
        const dispatcher = jest.fn();
        const ref = setup(String(day), dispatcher);

        let feature;
        act(() => {
          feature = ref.current.prevDay();
        });

        const expectedDay = day === 0 ? "20" : String(day - 1);
        expect(feature.properties.day).toBe(expectedDay);
      }
    });
  });

  describe("Dispatcher Calls", () => {
    it("should call dispatcher with feature properties on nextDay", () => {
      const ref = setup("1", mockDispatcher);

      act(() => {
        ref.current.nextDay();
      });

      expect(mockDispatcher).toHaveBeenCalledTimes(1);
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          day: "2",
          name: expect.any(String),
        })
      );
    });

    it("should call dispatcher with feature properties on prevDay", () => {
      const ref = setup("2", mockDispatcher);

      act(() => {
        ref.current.prevDay();
      });

      expect(mockDispatcher).toHaveBeenCalledTimes(1);
      expect(mockDispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          day: "1",
          name: expect.any(String),
        })
      );
    });

    it("should return the target feature from nextDay", () => {
      const ref = setup("1", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay();
      });

      expect(feature).toHaveProperty("properties");
      expect(feature.properties).toHaveProperty("day", "2");
    });

    it("should return the target feature from prevDay", () => {
      const ref = setup("2", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.prevDay();
      });

      expect(feature).toHaveProperty("properties");
      expect(feature.properties).toHaveProperty("day", "1");
    });
  });

  describe("Day 0 Special Properties", () => {
    it("should return isOverview property for Day 0", () => {
      const ref = setup("20", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay(); // Wrap to Day 0
      });

      expect(feature.properties.isOverview).toBe(true);
      expect(feature.properties.name).toBe("Everest Base Camp 3 Pass Trek");
    });

    it("should return empty metrics for Day 0", () => {
      const ref = setup("20", mockDispatcher);

      let feature;
      act(() => {
        feature = ref.current.nextDay(); // Wrap to Day 0
      });

      expect(feature.properties.distance).toBe("");
      expect(feature.properties.time).toBe("");
      expect(feature.properties.startAlt).toBe("");
      expect(feature.properties.endAlt).toBe("");
    });
  });
});
