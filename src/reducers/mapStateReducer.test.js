/**
 * Map State Reducer Tests
 * Tests for map state management including cookie-based preferences
 */

import { mapStateReducer } from "./mapStateReducer";

// Mock cookies module to control preferences
jest.mock("../utils/cookies", () => ({
  loadPreferences: () => ({ unit: "km", showLegend: true }),
  saveUnitPreference: jest.fn(),
  saveLegendPreference: jest.fn(),
}));

import { saveUnitPreference, saveLegendPreference } from "../utils/cookies";

describe("mapStateReducer", () => {
  describe("Initial State", () => {
    it("should have default center coordinates", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.center).toEqual([27.840457443855108, 86.76420972837559]);
    });

    it("should have default zoom level of 11.2", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.zoom).toBe(11.2);
    });

    it("should have isSingleDayView as false initially", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.isSingleDayView).toBe(false);
    });

    it("should have showInfo as false initially", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.showInfo).toBe(false);
    });

    it("should load unit preference from cookies (default km)", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.unit).toBe("km");
    });

    it("should load showLegend preference from cookies (default true)", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.showLegend).toBe(true);
    });

    it("should have map URL for CartoDB basemap", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.url).toContain("basemaps.cartocdn.com");
    });

    it("should have attribution with OpenStreetMap and Leaflet", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.attribution).toContain("OpenStreetMap");
      expect(state.attribution).toContain("Leaflet");
    });

    it("should have zoomDuration of 1.25", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.zoomDuration).toBe(1.25);
    });

    it("should have zoomSnap of 0.1", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.zoomSnap).toBe(0.1);
    });

    it("should have markerZoom of 14.5", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.markerZoom).toBe(14.5);
    });

    it("should have full-size style", () => {
      const state = mapStateReducer(undefined, { type: "@@INIT" });
      expect(state.style).toEqual({ height: "100%", width: "100%" });
    });
  });

  describe("SET_SINGLE_DAY_VIEW Action", () => {
    it("should set isSingleDayView to true", () => {
      const state = mapStateReducer(undefined, {
        type: "SET_SINGLE_DAY_VIEW",
        payload: true,
      });
      expect(state.isSingleDayView).toBe(true);
    });

    it("should set isSingleDayView to false", () => {
      const prevState = mapStateReducer(undefined, {
        type: "SET_SINGLE_DAY_VIEW",
        payload: true,
      });
      const state = mapStateReducer(prevState, {
        type: "SET_SINGLE_DAY_VIEW",
        payload: false,
      });
      expect(state.isSingleDayView).toBe(false);
    });

    it("should not change other state properties", () => {
      const prevState = mapStateReducer(undefined, { type: "@@INIT" });
      const state = mapStateReducer(prevState, {
        type: "SET_SINGLE_DAY_VIEW",
        payload: true,
      });
      expect(state.zoom).toBe(prevState.zoom);
      expect(state.center).toEqual(prevState.center);
      expect(state.showLegend).toBe(prevState.showLegend);
    });
  });

  describe("TOGGLE_UNIT Action", () => {
    it("should toggle from km to mi", () => {
      const state = mapStateReducer(undefined, { type: "TOGGLE_UNIT" });
      expect(state.unit).toBe("mi");
    });

    it("should toggle from mi back to km", () => {
      const prevState = mapStateReducer(undefined, { type: "TOGGLE_UNIT" });
      expect(prevState.unit).toBe("mi");
      const state = mapStateReducer(prevState, { type: "TOGGLE_UNIT" });
      expect(state.unit).toBe("km");
    });

    it("should save unit preference to cookie", () => {
      mapStateReducer(undefined, { type: "TOGGLE_UNIT" });
      expect(saveUnitPreference).toHaveBeenCalledWith("mi");
    });

    it("should not change other state properties", () => {
      const prevState = mapStateReducer(undefined, { type: "@@INIT" });
      const state = mapStateReducer(prevState, { type: "TOGGLE_UNIT" });
      expect(state.showLegend).toBe(prevState.showLegend);
      expect(state.isSingleDayView).toBe(prevState.isSingleDayView);
    });
  });

  describe("TOGGLE_LEGEND Action", () => {
    it("should toggle showLegend from true to false", () => {
      const state = mapStateReducer(undefined, { type: "TOGGLE_LEGEND" });
      expect(state.showLegend).toBe(false);
    });

    it("should toggle showLegend from false back to true", () => {
      const prevState = mapStateReducer(undefined, { type: "TOGGLE_LEGEND" });
      const state = mapStateReducer(prevState, { type: "TOGGLE_LEGEND" });
      expect(state.showLegend).toBe(true);
    });

    it("should save legend preference to cookie", () => {
      mapStateReducer(undefined, { type: "TOGGLE_LEGEND" });
      expect(saveLegendPreference).toHaveBeenCalledWith(false);
    });
  });

  describe("TOGGLE_INFO Action", () => {
    it("should toggle showInfo from false to true", () => {
      const state = mapStateReducer(undefined, { type: "TOGGLE_INFO" });
      expect(state.showInfo).toBe(true);
    });

    it("should toggle showInfo from true to false", () => {
      const prevState = mapStateReducer(undefined, { type: "TOGGLE_INFO" });
      const state = mapStateReducer(prevState, { type: "TOGGLE_INFO" });
      expect(state.showInfo).toBe(false);
    });

    it("should not save info preference to cookie (session-only)", () => {
      // showInfo is session-only, no cookie persistence
      const prevSaveUnit = saveUnitPreference.mock.calls.length;
      const prevSaveLegend = saveLegendPreference.mock.calls.length;
      mapStateReducer(undefined, { type: "TOGGLE_INFO" });
      // Neither cookie function should be called for TOGGLE_INFO
      expect(saveUnitPreference.mock.calls.length).toBe(prevSaveUnit);
      expect(saveLegendPreference.mock.calls.length).toBe(prevSaveLegend);
    });
  });

  describe("Unknown Actions", () => {
    it("should return current state for unknown actions", () => {
      const currentState = mapStateReducer(undefined, { type: "@@INIT" });
      const state = mapStateReducer(currentState, { type: "UNKNOWN_ACTION" });
      expect(state).toEqual(currentState);
    });
  });
});
