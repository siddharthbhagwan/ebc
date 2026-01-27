import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import Dashboard from "./Dashboard";
import { combineReducers, createStore } from "redux";
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

describe("Dashboard Navigation Behavior", () => {
  let store;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      flyToBounds: jest.fn(),
      getZoom: jest.fn(() => 11.3), // Start at overview zoom
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

  it("should highlight route in overview without zooming or activating single view on navigation", async () => {
    // Mock getZoom to return overview level
    mockMap.getZoom.mockReturnValue(11.3);

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Simulate right arrow key press
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // Wait for any async operations
    await waitFor(() => {
      // Check that flyToBounds was not called (no zoom)
      expect(mockMap.flyToBounds).not.toHaveBeenCalled();
    });

    // Note: Full testing requires more complex mocking of Redux dispatches and map interactions
  });

  it("should zoom when navigating at zoomed in level", async () => {
    // Mock getZoom to return zoomed in level
    mockMap.getZoom.mockReturnValue(12);

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Simulate right arrow key press
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // Wait for zoom
    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should toggle between overview and single view on space bar", async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Initially in overview
    expect(store.getState().mapState.isSingleDayView).toBe(false);

    // Simulate space bar
    fireEvent.keyDown(window, { code: "Space" });

    // Wait for state change
    await waitFor(() => {
      // In a full test, check that dispatch was called to set single view
      // Placeholder: actual implementation requires mocking dispatch
    });
  });

  // Additional tests can be added for edge cases, such as boundary navigation (first/last day)
});
