/**
 * Route Reducer Tests
 * Tests for route state management including Day 0 initial state
 */

import { routeReducer } from "./routeReducer";

describe("routeReducer", () => {
  describe("Initial State", () => {
    it("should have day '0' as initial state (landing page)", () => {
      const state = routeReducer(undefined, { type: "@@INIT" });
      expect(state.day).toBe("0");
    });

    it("should have trek name as initial name", () => {
      const state = routeReducer(undefined, { type: "@@INIT" });
      expect(state.name).toBe("Everest Base Camp 3 Pass Trek");
    });

    it("should have empty metrics in initial state", () => {
      const state = routeReducer(undefined, { type: "@@INIT" });
      expect(state.time).toBe("");
      expect(state.distance).toBe("");
      expect(state.startAlt).toBe("");
      expect(state.endAlt).toBe("");
      expect(state.peakAlt).toBe("");
      expect(state.total_climb).toBe("");
      expect(state.descent).toBe("");
    });

    it("should have empty icon in initial state", () => {
      const state = routeReducer(undefined, { type: "@@INIT" });
      expect(state.icon).toBe("");
    });
  });

  describe("UPDATE_LAYER_DETAILS Action", () => {
    it("should update all route properties", () => {
      const action = {
        type: "UPDATE_LAYER_DETAILS",
        payload: {
          layerDetails: {
            day: "1",
            icon: "tent.svg",
            name: "Lukla - Phakding",
            time: "3h 30m",
            distance: "4.66 mi / 7.5 km",
            startAlt: "9,373",
            endAlt: "8,563",
            peakAlt: "",
            total_climb: "500",
            descent: "814",
          },
        },
      };

      const state = routeReducer(undefined, action);
      expect(state.day).toBe("1");
      expect(state.name).toBe("Lukla - Phakding");
      expect(state.time).toBe("3h 30m");
      expect(state.distance).toBe("4.66 mi / 7.5 km");
      expect(state.startAlt).toBe("9,373");
      expect(state.endAlt).toBe("8,563");
      expect(state.peakAlt).toBe("");
      expect(state.total_climb).toBe("500");
      expect(state.descent).toBe("814");
      expect(state.icon).toBe("tent.svg");
    });

    it("should update from Day 0 to Day 1", () => {
      const initialState = routeReducer(undefined, { type: "@@INIT" });
      expect(initialState.day).toBe("0");

      const action = {
        type: "UPDATE_LAYER_DETAILS",
        payload: {
          layerDetails: {
            day: "1",
            icon: "tent.svg",
            name: "Lukla - Phakding",
            time: "3h 30m",
            distance: "4.66 mi / 7.5 km",
            startAlt: "9,373",
            endAlt: "8,563",
            peakAlt: "",
            total_climb: "500",
            descent: "814",
          },
        },
      };

      const state = routeReducer(initialState, action);
      expect(state.day).toBe("1");
      expect(state.name).toBe("Lukla - Phakding");
    });

    it("should update to Day 0 (overview) from another day", () => {
      const prevState = {
        day: "5",
        icon: "tent.svg",
        name: "Some Trek",
        time: "5h",
        distance: "10 mi / 16 km",
        startAlt: "10,000",
        endAlt: "12,000",
        peakAlt: "",
        total_climb: "2000",
        descent: "0",
      };

      const action = {
        type: "UPDATE_LAYER_DETAILS",
        payload: {
          layerDetails: {
            day: "0",
            icon: "",
            name: "Everest Base Camp 3 Pass Trek",
            time: "",
            distance: "",
            startAlt: "",
            endAlt: "",
            peakAlt: "",
            total_climb: "",
            descent: "",
          },
        },
      };

      const state = routeReducer(prevState, action);
      expect(state.day).toBe("0");
      expect(state.name).toBe("Everest Base Camp 3 Pass Trek");
      expect(state.time).toBe("");
      expect(state.distance).toBe("");
    });

    it("should handle rest day data", () => {
      const action = {
        type: "UPDATE_LAYER_DETAILS",
        payload: {
          layerDetails: {
            day: "3",
            icon: "",
            name: "Namche Bazaar Acclimatization",
            time: "Rest Day",
            distance: "0 mi / 0 km",
            startAlt: "11,286",
            endAlt: "11,286",
            peakAlt: "",
            total_climb: "0",
            descent: "0",
          },
        },
      };

      const state = routeReducer(undefined, action);
      expect(state.time).toBe("Rest Day");
      expect(state.total_climb).toBe("0");
      expect(state.descent).toBe("0");
    });

    it("should handle pass day with peak altitude", () => {
      const action = {
        type: "UPDATE_LAYER_DETAILS",
        payload: {
          layerDetails: {
            day: "8",
            icon: "pass.svg",
            name: "Chhukung - Kongma La - Lobuche",
            time: "8h",
            distance: "6.5 mi / 10.5 km",
            startAlt: "15,535",
            endAlt: "16,109",
            peakAlt: "18,159",
            total_climb: "2,624",
            descent: "2,050",
          },
        },
      };

      const state = routeReducer(undefined, action);
      expect(state.peakAlt).toBe("18,159");
    });
  });

  describe("Unknown Actions", () => {
    it("should return current state for unknown actions", () => {
      const currentState = {
        day: "5",
        icon: "",
        name: "Test Route",
        time: "4h",
        distance: "8 km",
        startAlt: "10,000",
        endAlt: "12,000",
        peakAlt: "",
        total_climb: "1000",
        descent: "500",
      };

      const state = routeReducer(currentState, { type: "UNKNOWN_ACTION" });
      expect(state).toEqual(currentState);
    });
  });
});
