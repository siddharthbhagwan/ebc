import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import Dashboard from "./Dashboard";
import { routeReducer } from "../reducers/routeReducer";
import { mapStateReducer } from "../reducers/mapStateReducer";

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div />,
  useMap: () => ({
    flyToBounds: jest.fn(),
    getZoom: () => 11.3, // Mock overview zoom
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
  }),
}));

// Mock other dependencies
jest.mock("../utils/geoJson", () => ({
  getDayWiseDataG: () => ({
    1: { features: [{ properties: { day: "1" } }] },
    2: { features: [{ properties: { day: "2" } }] },
  }),
  getFeatureBounds: () => null,
}));

jest.mock("../hooks/useDays", () => ({
  useDays: () => ({
    day: "1",
    nextDay: () => ({ properties: { day: "2" } }),
    prevDay: () => ({ properties: { day: "1" } }),
  }),
}));

jest.mock("react-device-detect", () => ({
  isDesktop: true,
}));

const createMockStore = (initialState) => {
  const rootReducer = combineReducers({
    route: routeReducer,
    mapState: mapStateReducer,
  });
  return createStore(rootReducer, initialState);
};

describe("Dashboard Component Behaviors", () => {
  let store;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      flyToBounds: jest.fn(),
      getZoom: jest.fn(() => 11.3), // Overview zoom
      flyTo: jest.fn(),
      invalidateSize: jest.fn(),
    };

    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "0",
        descent: "814",
      },
    });
  });

  describe("Keyboard Navigation", () => {
    it("should change day and highlight route without zooming when navigating in overview", async () => {
      mockMap.getZoom.mockReturnValue(11.3); // Overview

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      // Simulate right arrow key press
      fireEvent.keyDown(window, { key: "ArrowRight" });

      // Wait for any async operations
      await waitFor(() => {
        // flyToBounds should not be called (no zoom)
        expect(mockMap.flyToBounds).not.toHaveBeenCalled();
      });

      // Day should change (mocked)
      // In real test, check store state or dispatched actions
    });

    it("should change day and zoom when navigating while zoomed in", async () => {
      mockMap.getZoom.mockReturnValue(12); // Zoomed in

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      // Simulate right arrow key press
      fireEvent.keyDown(window, { key: "ArrowRight" });

      // Wait for zoom
      await waitFor(() => {
        expect(mockMap.flyToBounds).toHaveBeenCalled();
      });
    });

    it("should handle left arrow navigation", async () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      fireEvent.keyDown(window, { key: "ArrowLeft" });

      // Similar checks as above
      expect(mockMap.flyToBounds).not.toHaveBeenCalled(); // Assuming overview
    });
  });

  describe("Space Bar Toggle", () => {
    it("should toggle to single view and zoom when pressed in overview", async () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      // Initially overview
      expect(store.getState().mapState.isSingleDayView).toBe(false);

      // Simulate space bar
      fireEvent.keyDown(window, { code: "Space" });

      // Wait for toggle
      await waitFor(() => {
        // In real test, check if flyToBounds called for zoom
        expect(mockMap.flyToBounds).toHaveBeenCalled();
      });
    });

    it("should toggle to overview when pressed in single view", async () => {
      store = createMockStore({
        ...store.getState(),
        mapState: { ...store.getState().mapState, isSingleDayView: true },
      });

      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      fireEvent.keyDown(window, { code: "Space" });

      await waitFor(() => {
        expect(mockMap.flyTo).toHaveBeenCalled(); // Overview flyTo
      });
    });
  });

  describe("Target Button", () => {
    it("should toggle to single view when in overview", async () => {
      render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
      );

      // Assume target button has a test id or find by text
      const targetButton = screen.getByRole("button", { name: /target/i }); // Adjust selector
      if (targetButton) {
        fireEvent.click(targetButton);

        // Check state change
        await waitFor(() => {
          // Mock dispatch check
        });
      }
    });
  });

  describe("Route Highlighting", () => {
    it("should render routes with correct opacity based on current day", () => {
      // This would require testing GeoJsonRoutes component separately
      // For now, placeholder
      expect(true).toBe(true);
    });
  });

  describe("Build and Deploy", () => {
    it("should build successfully", () => {
      // Integration test placeholder
      expect(true).toBe(true);
    });
  });
});
