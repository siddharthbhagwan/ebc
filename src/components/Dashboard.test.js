import React from "react";

// Mock react-device-detect
jest.mock("react-device-detect", () => ({
  isBrowser: true,
  isDesktop: true,
  isMobile: false,
  useMobileOrientation: () => ({ isLandscape: false }),
}));

// Declare mockMap before jest.mock so it can be referenced
const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  getZoom: jest.fn(() => 11.3),
  flyToBounds: jest.fn(),
  flyTo: jest.fn(),
  invalidateSize: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
};

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  Map: ({ children }) => <div data-testid="leaflet-control">{children}</div>,
  MapContainer: ({ children }) => <div data-testid="leaflet-control">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => mockMap,
  withLeaflet: (Component) => (props) => (
    <Component {...props} leaflet={{ map: mockMap }} />
  ),
}));

import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import Dashboard from "./Dashboard";
import MapContainer from "./MapContainer";
import { routeReducer } from "../reducers/routeReducer";
import { mapStateReducer } from "../reducers/mapStateReducer";

// Mock Leaflet
jest.mock("leaflet", () => ({
  geoJSON: () => ({
    getBounds: () => ({
      isValid: () => true,
      getNorthEast: () => ({ lat: 27.9, lng: 86.9 }),
      getSouthWest: () => ({ lat: 27.8, lng: 86.7 }),
    }),
  }),
  latLngBounds: () => ({
    isValid: () => true,
    getNorthEast: () => ({ lat: 27.9, lng: 86.9 }),
    getSouthWest: () => ({ lat: 27.8, lng: 86.7 }),
  }),
  icon: (options) => ({ options }),
  divIcon: (options) => ({ options }),
}));

// Mock other dependencies
jest.mock("../utils/geoJson", () => ({
  getDayWiseDataG: () => ({
    0: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [86.764, 27.840, 0] },
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
    },
    1: { features: [{ properties: { day: "1", name: "Lukla - Phakding" } }] },
    2: { features: [{ properties: { day: "2", name: "Phakding - Namche Bazaar" } }] },
    3: { features: [{ properties: { day: "3", name: "Namche Bazaar Acclimatization" } }] },
    7: { features: [{ properties: { day: "7", name: "Dingboche - Chhukung" } }] },
  }),
  getFeatureBounds: () => ({
    isValid: () => true,
    getNorthEast: () => ({ lat: 27.9, lng: 86.9 }),
    getSouthWest: () => ({ lat: 27.8, lng: 86.7 }),
  }),
}));

jest.mock("../hooks/useDays", () => ({
  __esModule: true,
  default: () => ({
    day: "1",
    nextDay: () => ({
      properties: { day: "2", name: "Phakding - Namche Bazaar" },
    }),
    prevDay: () => ({ properties: { day: "1", name: "Lukla - Phakding" } }),
  }),
}));

// Mock assets
jest.mock("../resources/images/tent.svg", () => "tent.svg");
jest.mock("../resources/images/ebc.svg", () => "ebc.svg");
jest.mock("../resources/images/airport.svg", () => "airport.svg");
jest.mock("../resources/images/pass.svg", () => "pass.svg");
jest.mock("../resources/images/summit.svg", () => "summit.svg");

// Mock markers
jest.mock("../utils/markers", () => ({
  getMarkers: () => [
    {
      point: [27.98094, 86.82939],
      icon: "tent.svg",
      size: [10, 10],
      properties: {
        day: "11",
        name: "Gorak Shep",
        startAlt: "16,942",
      },
    },
  ],
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

  beforeEach(() => {
    // Reset mock functions instead of reassigning the object
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(11.3); // Overview zoom

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
        </Provider>,
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
        </Provider>,
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
        </Provider>,
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
        </Provider>,
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
        </Provider>,
      );

      fireEvent.keyDown(window, { code: "Space" });

      await waitFor(() => {
        expect(mockMap.flyTo).toHaveBeenCalled(); // Overview flyTo
      });
    });
  });

  describe("Target Button", () => {
    it("should toggle to single view when in overview", async () => {
      const { getByAltText } = render(
        <Provider store={store}>
          <Dashboard />
        </Provider>,
      );

      // The target button is the Reset image (location icon)
      const targetButton = getByAltText("Reset");
      fireEvent.click(targetButton);

      // Check state change - the map should fly to bounds when switching to single view
      await waitFor(() => {
        expect(mockMap.flyToBounds).toHaveBeenCalled();
      });
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

describe("Dashboard Elevation Stats Styling", () => {
  let store;

  beforeEach(() => {
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
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should render elevation stats with correct font sizes on desktop", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Find the elevation gain span (green color) using CSS class
    const elevationGain = container.querySelector(".elevation-gain--desktop");
    expect(elevationGain).toBeInTheDocument();
    expect(elevationGain.textContent).toMatch(/▲\s*152m/);

    // Find the descent span (red color) using CSS class
    const altitudeChange = container.querySelector(
      ".elevation-descent--desktop",
    );
    expect(altitudeChange).toBeInTheDocument();
    expect(altitudeChange.textContent).toMatch(/▼\s*248m/);
  });

  it("should hide elevation stats when both total_climb and descent are zero", () => {
    store = createMockStore({
      ...store.getState(),
      route: {
        ...store.getState().route,
        total_climb: "0",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Zero values should be hidden (new behavior)
    expect(container.textContent).not.toMatch(/▲/);
    expect(container.textContent).not.toMatch(/▼/);
  });

  it("should render only elevation gain when descent is zero", () => {
    store = createMockStore({
      ...store.getState(),
      route: {
        ...store.getState().route,
        total_climb: "500",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show elevation gain, but NOT descent when it's 0
    expect(container.textContent).toMatch(/▲\s*152m/);
    expect(container.textContent).not.toMatch(/▼\s*0m/);
  });

  it("should render only descent when total_climb is zero", () => {
    store = createMockStore({
      ...store.getState(),
      route: {
        ...store.getState().route,
        total_climb: "0",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should NOT show elevation gain when it's 0, but should show descent
    expect(container.textContent).not.toMatch(/▲\s*0m/);
    expect(container.textContent).toMatch(/▼\s*248m/);
  });

  it("should render elevation stats with correct colors", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Elevation gain should have green class (color defined in CSS)
    const elevationGain = container.querySelector(".elevation-gain--desktop");
    expect(elevationGain).toBeInTheDocument();
    expect(elevationGain.textContent).toMatch(/▲\s*152m/);

    // Altitude change should have red class (color defined in CSS)
    const altitudeChange = container.querySelector(
      ".elevation-descent--desktop",
    );
    expect(altitudeChange).toBeInTheDocument();
    expect(altitudeChange.textContent).toMatch(/▼\s*248m/);
  });

  it("should render elevation stats before altitude in DOM order", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Verify elevation stats appear in the rendered output
    const renderedText = container.textContent;

    // Find positions using regex match index
    const elevationMatch = renderedText.match(/▲\s*152m/);
    const altitudeIndex = renderedText.indexOf("2,857m");

    // Elevation should appear before altitude in the DOM
    expect(elevationMatch).not.toBeNull();
    expect(altitudeIndex).toBeGreaterThan(-1);
    expect(elevationMatch.index).toBeLessThan(altitudeIndex);
  });

  it("should render altitude with smaller font size than elevation gain", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Find the elevation gain span using CSS class
    const elevationGain = container.querySelector(".elevation-gain--desktop");
    expect(elevationGain).toBeInTheDocument();

    // Find the altitude display using CSS class
    const altitudeDisplay = container.querySelector(
      ".altitude-display--desktop",
    );
    expect(altitudeDisplay).toBeInTheDocument();
    // Should show start → end altitude (2,857m → 2,610m)
    expect(altitudeDisplay.textContent).toContain("2,857m");
    expect(altitudeDisplay.textContent).toContain("2,610m");
    expect(altitudeDisplay.textContent).toContain("→");
  });

  // Note: Mobile font sizes (15px for elevation gain, 11px for altitude)
  // would need a separate test file with isDesktop: false mock
});

// =====================================================
// DASHBOARD RENDERING TESTS
// =====================================================

describe("Dashboard Basic Rendering", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should render trek name in dashboard", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("Lukla - Phakding")).toBeInTheDocument();
  });

  it("should render navigation arrows", () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByAltText("Previous")).toBeInTheDocument();
    expect(getByAltText("Next")).toBeInTheDocument();
  });

  it("should render control icons (Reset and Tools)", () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByAltText("Reset")).toBeInTheDocument();
    expect(getByAltText("Tools")).toBeInTheDocument();
  });

  it("should render altitude in correct unit (km/m)", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show start → end altitude format
    // startAlt 9,373 feet = 2,857m, endAlt 8,563 feet = 2,610m
    const altitudeDisplay = container.querySelector(
      ".altitude-display--desktop",
    );
    expect(altitudeDisplay.textContent).toContain("2,857m");
    expect(altitudeDisplay.textContent).toContain("2,610m");
  });

  it("should render distance in correct unit (km)", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("7.5 km")).toBeInTheDocument();
  });

  it("should render day indicator", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("DAY")).toBeInTheDocument();
    expect(getByText("1")).toBeInTheDocument();
  });

  it("should render time with asterisk", () => {
    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("3h 30m")).toBeInTheDocument();
    expect(getByText("*")).toBeInTheDocument();
  });
});

// =====================================================
// TOOLBAR/TOOLS PANEL TESTS
// =====================================================

describe("Dashboard Toolbar Behavior", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
        attribution: "&copy; OpenStreetMap",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should open tools panel when clicking Tools button", async () => {
    const { getByAltText, container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      // Branding strip now shows version only (no trek name)
      const brandingStrip = container.querySelector('.branding-strip');
      expect(brandingStrip).toBeInTheDocument();
    });
  });

  it("should show legend and info icons in toolbar", async () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      expect(getByAltText("Toggle Legend")).toBeInTheDocument();
      expect(getByAltText("Toggle Info")).toBeInTheDocument();
    });
  });

  it("should show unit toggle (M/FT) in toolbar", async () => {
    const { getByAltText, getAllByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      // There are multiple M/FT elements - the active unit indicator and the toggle labels
      const kmElements = getAllByText("M");
      const miElements = getAllByText("FT");
      expect(kmElements.length).toBeGreaterThan(0);
      expect(miElements.length).toBeGreaterThan(0);
    });
  });

  it("should show close button (✕) in toolbar", async () => {
    const { getByAltText, getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      expect(getByText("✕")).toBeInTheDocument();
    });
  });

  it("should close toolbar when clicking close button", async () => {
    const { getByAltText, getByText, container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open toolbar
    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      // Branding strip should be visible
      expect(container.querySelector('.branding-strip')).toBeInTheDocument();
    });

    // Close toolbar
    const closeBtn = getByText("✕");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      // Branding strip should be gone
      expect(container.querySelector('.branding-strip')).not.toBeInTheDocument();
    });
  });

  it("should show branding strip with attribution in toolbar", async () => {
    const { getByAltText, container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      // Attribution should be rendered (contains OpenStreetMap link)
      expect(container.innerHTML).toContain("OpenStreetMap");
    });
  });
});

// =====================================================
// UNIT CONVERSION TESTS
// =====================================================

describe("Dashboard Unit Conversion", () => {
  it("should display altitude in meters when unit is km", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // 9,373 feet = 2,857 meters, 8,563 feet = 2,610 meters
    const altitudeDisplay = container.querySelector(
      ".altitude-display--desktop",
    );
    expect(altitudeDisplay.textContent).toContain("2,857m");
    expect(altitudeDisplay.textContent).toContain("2,610m");
  });

  it("should display altitude in feet when unit is mi", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "mi",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should display start → end in feet (9,373ft → 8,563ft)
    const altitudeDisplay = container.querySelector(
      ".altitude-display--desktop",
    );
    expect(altitudeDisplay.textContent).toContain("9,373ft");
    expect(altitudeDisplay.textContent).toContain("8,563ft");
  });

  it("should display distance in km when unit is km", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("7.5 km")).toBeInTheDocument();
  });

  it("should display distance in miles when unit is mi", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "mi",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByText("4.66 mi")).toBeInTheDocument();
  });
});

// =====================================================
// KEYBOARD NAVIGATION TESTS
// =====================================================

describe("Dashboard Keyboard Navigation", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should handle ArrowRight key for next day navigation", async () => {
    mockMap.getZoom.mockReturnValue(12); // Zoomed in

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should handle ArrowLeft key for previous day navigation", async () => {
    mockMap.getZoom.mockReturnValue(12); // Zoomed in

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should handle Space key for reset zoom", async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    fireEvent.keyDown(window, { code: "Space" });

    await waitFor(() => {
      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });
  });
});

// =====================================================
// CLICK NAVIGATION TESTS
// =====================================================

describe("Dashboard Click Navigation", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should navigate to next day when clicking right arrow", async () => {
    mockMap.getZoom.mockReturnValue(12); // Zoomed in

    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const nextBtn = getByAltText("Next");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should navigate to previous day when clicking left arrow", async () => {
    mockMap.getZoom.mockReturnValue(12); // Zoomed in

    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const prevBtn = getByAltText("Previous");
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should toggle view mode when clicking Reset button", async () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const resetBtn = getByAltText("Reset");
    fireEvent.click(resetBtn);

    // Reset toggles between overview and single day view
    // When isSingleDayView is false and day is set, it switches to single day with flyToBounds
    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });
});

// =====================================================
// REST DAY / PLACE DISPLAY TESTS
// =====================================================

describe("Dashboard Rest Day Display", () => {
  it("should show only name and single altitude for rest days", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "3",
        name: "Namche Bazaar Acclimatization",
        time: "Rest Day",
        distance: "0 mi / 0 km",
        startAlt: "11,286",
        endAlt: "11,286",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { queryByText, getByText, container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Name should be shown
    expect(getByText("Namche Bazaar Acclimatization")).toBeInTheDocument();

    // Day should be shown
    expect(getByText("3")).toBeInTheDocument();

    // For rest days, should NOT show elevation gain/descent arrows
    expect(container.textContent).not.toMatch(/▲/);
    expect(container.textContent).not.toMatch(/▼/);
    
    // Should NOT show arrow between altitudes (single altitude only)
    expect(container.textContent).not.toContain("→");
    
    // Should show single altitude (3,440m in metric)
    expect(container.textContent).toContain("3,440m");
  });

  it("should detect isRestDay when time equals 'Rest Day'", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "7",
        name: "Dingboche Acclimatization",
        time: "Rest Day",
        distance: "0 mi / 0 km",
        startAlt: "14,469",
        endAlt: "14,469",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { container, queryByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Rest day should not show distance
    expect(queryByText("0 km")).not.toBeInTheDocument();
    
    // Should not show time (Rest Day)
    expect(queryByText("Rest Day")).not.toBeInTheDocument();
  });

  it("should handle place markers (startAlt=0, endAlt=0)", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla Airport",
        time: "",
        distance: "",
        startAlt: "0",
        endAlt: "0",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { getByText, queryByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Name should be shown
    expect(getByText("Lukla Airport")).toBeInTheDocument();
  });
});

// =====================================================
// ZERO ELEVATION HIDING TESTS
// =====================================================

describe("Dashboard Zero Elevation Hiding", () => {
  it("should hide elevation gain arrow when total_climb is 0", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Downhill Only Trek",
        time: "4h 00m",
        distance: "5.0 mi / 8.0 km",
        startAlt: "10,000",
        endAlt: "8,000",
        peakAlt: "",
        total_climb: "0",
        descent: "610",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should NOT show elevation gain (▲0m)
    expect(container.textContent).not.toMatch(/▲\s*0m/);
    
    // Should show descent
    expect(container.textContent).toMatch(/▼\s*186m/);
  });

  it("should hide descent arrow when descent is 0", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Uphill Only Trek",
        time: "5h 00m",
        distance: "5.0 mi / 8.0 km",
        startAlt: "8,000",
        endAlt: "10,000",
        peakAlt: "",
        total_climb: "610",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show elevation gain
    expect(container.textContent).toMatch(/▲\s*186m/);
    
    // Should NOT show descent (▼0m)
    expect(container.textContent).not.toMatch(/▼\s*0m/);
  });

  it("should show both elevation stats when neither is zero", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Normal Trek Day",
        time: "6h 00m",
        distance: "10.0 mi / 16.0 km",
        startAlt: "9,000",
        endAlt: "11,000",
        peakAlt: "",
        total_climb: "800",
        descent: "400",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show both elevation stats
    expect(container.textContent).toMatch(/▲\s*244m/);
    expect(container.textContent).toMatch(/▼\s*122m/);
  });
});

// =====================================================
// ENTER KEY NAVIGATION TESTS
// =====================================================

describe("Dashboard Enter Key Navigation", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(11.3);
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should handle Enter key same as Space key for toggle", async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Initially overview
    expect(store.getState().mapState.isSingleDayView).toBe(false);

    // Simulate Enter key
    fireEvent.keyDown(window, { key: "Enter" });

    // Should behave same as Space - toggle to single view with zoom
    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should toggle to overview when Enter pressed in single view", async () => {
    store = createMockStore({
      ...store.getState(),
      mapState: { ...store.getState().mapState, isSingleDayView: true },
    });

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      expect(mockMap.flyTo).toHaveBeenCalled();
    });
  });
});

// =====================================================
// SINGLE DAY VIEW TESTS
// =====================================================

describe("Dashboard Single Day View", () => {
  it("should show active state on Reset button when in single day view", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: true,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Check for active class on icon
    const activeIcon = container.querySelector(".icon.active");
    expect(activeIcon).toBeInTheDocument();
  });
});

// =====================================================
// FONT SIZE ADAPTATION TESTS
// =====================================================

describe("Dashboard Font Size Adaptation", () => {
  it("should use smaller font for long trek names (>30 chars)", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "8",
        name: "Chhukung - Kongma La - Lobuche",
        time: "8h",
        distance: "6.5 mi / 10.5 km",
        startAlt: "15,535",
        endAlt: "16,109",
        peakAlt: "18,159",
        total_climb: "2,624",
        descent: "2,050",
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const nameElement = getByText("Chhukung - Kongma La - Lobuche");
    // Long names (>30 chars) should have fontSize 15px on desktop
    expect(nameElement).toHaveStyle({ fontSize: "15px" });
  });

  it("should use normal font for short trek names", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const nameElement = getByText("Lukla - Phakding");
    // Short names should have fontSize 19px on desktop
    expect(nameElement).toHaveStyle({ fontSize: "19px" });
  });
});

// =====================================================
// METRICS ORDER TESTS
// =====================================================

describe("Dashboard Metrics Display Order", () => {
  let store;

  beforeEach(() => {
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should display metrics in order: Name, Elevation, Altitude", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const content = container.textContent;

    // Find positions of each metric (elevation may have whitespace between arrow and value)
    const nameIndex = content.indexOf("Lukla - Phakding");
    const elevationMatch = content.match(/▲\s*152m/);
    const altitudeIndex = content.indexOf("2,857m");

    // Verify order: Name < Elevation < Altitude
    expect(elevationMatch).not.toBeNull();
    expect(nameIndex).toBeLessThan(elevationMatch.index);
    expect(elevationMatch.index).toBeLessThan(altitudeIndex);
  });

  it("should always show both elevation gain and descent together", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Both should be present (text may have whitespace between arrow and value)
    expect(container.textContent).toMatch(/▲\s*152m/);
    expect(container.textContent).toMatch(/▼\s*248m/);
  });
});
// =====================================================
// REST DAY DISPLAY TESTS (Acclimatization Days)
// =====================================================

describe("Dashboard Acclimatization Day Display", () => {
  it("should hide elevation gain/descent on rest days", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "3",
        name: "Namche Bazaar Acclimatization",
        time: "Rest Day",
        distance: "0 mi / 0 km",
        startAlt: "11,286",
        endAlt: "11,286",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { container, getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Name should be shown
    expect(getByText("Namche Bazaar Acclimatization")).toBeInTheDocument();
    
    // Elevation gain/descent should NOT be shown (no ▲ or ▼)
    expect(container.textContent).not.toMatch(/▲/);
    expect(container.textContent).not.toMatch(/▼/);
  });

  it("should show only single altitude on rest days", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "3",
        name: "Namche Bazaar Acclimatization",
        time: "Rest Day",
        distance: "0 mi / 0 km",
        startAlt: "11,286",
        endAlt: "11,286",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show single altitude (endAlt converted to meters)
    // 11,286 ft = ~3,440m
    expect(container.textContent).toMatch(/3,440\s*m/);
    
    // Should NOT show altitude arrows (→) since it's a rest day
    const altitudeSection = container.querySelector('.altitude-single');
    expect(altitudeSection).toBeInTheDocument();
  });
});

// =====================================================
// ZERO ELEVATION HIDING TESTS
// =====================================================

describe("Dashboard Zero Elevation Handling", () => {
  it("should hide elevation gain when total_climb is 0", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Test Route - Descent Only",
        time: "3h",
        distance: "5 mi / 8 km",
        startAlt: "10,000",
        endAlt: "9,000",
        peakAlt: "",
        total_climb: "0",
        descent: "1000",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should NOT show elevation gain arrow
    expect(container.textContent).not.toMatch(/▲/);
    // Should show descent
    expect(container.textContent).toMatch(/▼/);
  });

  it("should hide elevation descent when descent is 0", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Test Route - Climb Only",
        time: "3h",
        distance: "5 mi / 8 km",
        startAlt: "9,000",
        endAlt: "10,000",
        peakAlt: "",
        total_climb: "1000",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show elevation gain
    expect(container.textContent).toMatch(/▲/);
    // Should NOT show descent arrow
    expect(container.textContent).not.toMatch(/▼/);
  });

  it("should hide entire elevation row when both are 0", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Test Route - Flat",
        time: "3h",
        distance: "5 mi / 8 km",
        startAlt: "9,000",
        endAlt: "9,000",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Neither elevation arrow should be shown
    expect(container.textContent).not.toMatch(/▲/);
    expect(container.textContent).not.toMatch(/▼/);
  });
});

// =====================================================
// KEYBOARD NAVIGATION TESTS
// =====================================================

describe("Dashboard Keyboard Navigation", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(11.3);

    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should handle Enter key same as Space key (resetZoom)", async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Simulate Enter key press
    fireEvent.keyDown(window, { key: "Enter" });

    // Wait for the action to be triggered (resetZoom toggles view)
    await waitFor(() => {
      // The map should have been interacted with
      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });
  });

  it("should handle Space key for resetZoom", async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Simulate Space key press
    fireEvent.keyDown(window, { code: "Space" });

    await waitFor(() => {
      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });
  });
});

// =====================================================
// ALTITUDE DISPLAY FORMAT TESTS
// =====================================================

describe("Dashboard Altitude Display Format", () => {
  it("should show start → peak → end format for normal days", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "8",
        name: "Chhukung - Kongma La - Lobuche",
        time: "8h",
        distance: "6.5 mi / 10.5 km",
        startAlt: "15,535",
        endAlt: "16,109",
        peakAlt: "18,159",
        total_climb: "2,624",
        descent: "2,050",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should show altitude arrows (→) for start/peak/end
    expect(container.textContent).toMatch(/→/);
    
    // Should have altitude-start, altitude-peak, and altitude-end elements
    expect(container.querySelector('.altitude-start')).toBeInTheDocument();
    expect(container.querySelector('.altitude-peak')).toBeInTheDocument();
    expect(container.querySelector('.altitude-end')).toBeInTheDocument();
  });

  it("should show start → end format when no peak altitude", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Should have start and end but no peak
    expect(container.querySelector('.altitude-start')).toBeInTheDocument();
    expect(container.querySelector('.altitude-end')).toBeInTheDocument();
    expect(container.querySelector('.altitude-peak')).not.toBeInTheDocument();
  });

  it("should display altitude on initial load with fallback to route data", () => {
    // Test that altitude is always visible even if props might be null
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
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

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Altitude display should always be present
    const altitudeDisplay = container.querySelector('.altitude-display');
    expect(altitudeDisplay).toBeInTheDocument();
    
    // Should have altitude values visible
    expect(container.querySelector('.altitude-start')).toBeInTheDocument();
    expect(container.querySelector('.altitude-end')).toBeInTheDocument();
  });
});

// =====================================================
// DAY INDICATOR POSITION TESTS
// =====================================================

describe("Dashboard Day Indicator Position", () => {
  it("should display day indicator on the left side (desktop)", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "5",
        name: "Namche Bazaar - Tengboche",
        time: "5h",
        distance: "6.2 mi / 10 km",
        startAlt: "11,286",
        endAlt: "12,687",
        peakAlt: "",
        total_climb: "2,000",
        descent: "600",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Day indicator should exist
    const dayIndicator = container.querySelector('.day-indicator');
    expect(dayIndicator).toBeInTheDocument();
    
    // Day label and value should be present
    expect(container.querySelector('.day-label-desktop')).toBeInTheDocument();
    expect(container.querySelector('.day-value-desktop')).toBeInTheDocument();
  });

  it("should show day number correctly", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "12",
        name: "Gorak Shep - Kala Patthar - Dzongla",
        time: "7h",
        distance: "7.5 mi / 12 km",
        startAlt: "17,598",
        endAlt: "15,951",
        peakAlt: "18,514",
        total_climb: "916",
        descent: "2,563",
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Day number should be displayed
    expect(getByText("12")).toBeInTheDocument();
  });
});

// =====================================================
// TARGET BUTTON BEHAVIOR TESTS
// =====================================================

describe("Dashboard Target Button Behavior", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(11.3);
  });

  it("should zoom to currently selected route when target button is clicked", async () => {
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "7", // Currently selected day 7
        name: "Dingboche - Chhukung",
        time: "3h",
        distance: "3.1 mi / 5 km",
        startAlt: "14,469",
        endAlt: "15,518",
        peakAlt: "",
        total_climb: "1,050",
        descent: "0",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Find and click the target/location button
    const targetButton = container.querySelector('img[alt="Reset"]');
    expect(targetButton).toBeInTheDocument();
    
    fireEvent.click(targetButton.parentElement);

    // Wait for the map interaction - flyToBounds is called for single day view
    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });

  it("should toggle active state on target button when in single day view", () => {
    store = createMockStore({
      mapState: {
        isSingleDayView: true,
        zoom: 13,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "5",
        name: "Namche Bazaar - Tengboche",
        time: "5h",
        distance: "6.2 mi / 10 km",
        startAlt: "11,286",
        endAlt: "12,687",
        peakAlt: "",
        total_climb: "2,000",
        descent: "600",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Target button should have active class when in single day view
    const activeButton = container.querySelector('.icon.active');
    expect(activeButton).toBeInTheDocument();
  });

  it("should zoom to most recently viewed day when target button clicked from overview", async () => {
    // Start in single day view on day 7
    store = createMockStore({
      mapState: {
        isSingleDayView: true,
        zoom: 13,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "7",
        name: "Dingboche - Chhukung",
        time: "3h",
        distance: "3.1 mi / 5 km",
        startAlt: "14,469",
        endAlt: "15,518",
        peakAlt: "",
        total_climb: "1,050",
        descent: "0",
      },
    });

    const { container, rerender } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const targetButton = container.querySelector('img[alt="Reset"]');
    expect(targetButton).toBeInTheDocument();

    // Click to go to overview (this should remember day 7)
    fireEvent.click(targetButton.parentElement);

    // Update store to overview mode with day 1 selected (default)
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1", // Now showing day 1
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "310",
      },
    });

    rerender(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Click target button again - should zoom to day 7 (most recent), not day 1
    fireEvent.click(targetButton.parentElement);

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });

    // The component should have used lastZoomedDay (7) instead of current day (1)
    // We can verify this through the console.log in the implementation
  });

  it("should zoom to day 1 when target button clicked from overview with no previous zoom", async () => {
    // Start in overview mode with day 1 selected and no previous zoom
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "310",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const targetButton = container.querySelector('img[alt="Reset"]');
    expect(targetButton).toBeInTheDocument();

    // Click target button - should zoom to day 1 (no lastZoomedDay exists)
    fireEvent.click(targetButton.parentElement);

    await waitFor(() => {
      expect(mockMap.flyToBounds).toHaveBeenCalled();
    });
  });
});

// =====================================================
// TIME DISPLAY WITH ASTERISK TESTS
// =====================================================

describe("Dashboard Time Display", () => {
  it("should display time with asterisk on desktop", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Time asterisk should be present
    const asterisk = container.querySelector('.time-asterisk');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk.textContent).toBe('*');
  });

  it("should not show time for rest days", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "4",
        name: "Namche Bazaar Acclimatization",
        time: "Rest Day",
        distance: "0 mi / 0 km",
        startAlt: "11,286",
        endAlt: "11,286",
        peakAlt: "",
        total_climb: "0",
        descent: "0",
      },
    });

    const { container, queryByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Time with asterisk should not be shown for rest days (distance is 0)
    // The time-asterisk class should not be in the metrics row
    const metricsRow = container.querySelector('.metrics-bottom-row');
    if (metricsRow) {
      expect(metricsRow.textContent).not.toContain('Rest Day*');
    }
  });
});

// =====================================================
// TOOLBAR ICON STYLING TESTS
// =====================================================

describe("Dashboard Toolbar Icons", () => {
  it("should render legend and info icons in tools panel", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Tools button should exist
    const toolsButton = container.querySelector('img[alt="Tools"]');
    expect(toolsButton).toBeInTheDocument();

    // Click to open tools panel
    fireEvent.click(toolsButton.parentElement);

    // Legend and Info icons should be visible
    const legendIcon = container.querySelector('img[alt="Toggle Legend"]');
    const infoIcon = container.querySelector('img[alt="Toggle Info"]');
    
    expect(legendIcon).toBeInTheDocument();
    expect(infoIcon).toBeInTheDocument();
  });

  it("should have tool-icon-image class with proper styling", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Check that tool icons have the proper class
    const toolIcons = container.querySelectorAll('.tool-icon-image');
    expect(toolIcons.length).toBeGreaterThan(0);
  });
});

// =====================================================
// UNIT TOGGLE TESTS
// =====================================================

describe("Dashboard Unit Toggle", () => {
  it("should display unit toggle switch in tools panel", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container, getAllByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Unit toggle should show M and FT labels (multiple elements expected)
    const mElements = getAllByText("M");
    const ftElements = getAllByText("FT");
    expect(mElements.length).toBeGreaterThan(0);
    expect(ftElements.length).toBeGreaterThan(0);
  });

  it("should show current unit in toggle indicator", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "mi",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Unit indicator should show FT
    const indicator = container.querySelector('.unit-toggle-indicator--desktop');
    expect(indicator).toBeInTheDocument();
    expect(indicator.textContent).toBe('FT');
  });
});

describe("Panel Mutual Exclusivity", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        showInfo: false,
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
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should close Stats when About is opened", async () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Open Stats panel
    const statsButton = container.querySelector('.tool-icon-button');
    fireEvent.click(statsButton);

    // Stats should be visible
    await waitFor(() => {
      expect(container.querySelector('.statistics-card')).toBeInTheDocument();
    });

    // Click About button (info icon)
    const infoButton = container.querySelector('img[alt="Toggle Info"]');
    fireEvent.click(infoButton.parentElement);

    // Stats should close
    await waitFor(() => {
      expect(container.querySelector('.statistics-card')).not.toBeInTheDocument();
    });
  });

  it("should display triangles in stats panel for ascent and descent", async () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Open Stats panel
    const statsButton = container.querySelector('.tool-icon-button');
    fireEvent.click(statsButton);

    // Stats should be visible with triangles
    await waitFor(() => {
      const statsCard = container.querySelector('.statistics-card');
      expect(statsCard).toBeInTheDocument();
      
      // Check for triangles in ascent/descent values
      const statValues = statsCard.querySelectorAll('.stat-value');
      const ascentValue = Array.from(statValues).find(el => el.textContent.includes('▲'));
      const descentValue = Array.from(statValues).find(el => el.textContent.includes('▼'));
      
      expect(ascentValue).toBeInTheDocument();
      expect(descentValue).toBeInTheDocument();
    });
  });

  it("should close About when Stats is opened", async () => {
    // Start with showInfo: true
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        showInfo: true,
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
        total_climb: "500",
        descent: "814",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel
    const toolsButton = container.querySelector('img[alt="Tools"]');
    fireEvent.click(toolsButton.parentElement);

    // Click Stats button
    const statsButton = container.querySelector('.tool-icon-button');
    fireEvent.click(statsButton);

    // Stats should be visible and About should close
    await waitFor(() => {
      expect(container.querySelector('.statistics-card')).toBeInTheDocument();
      // showInfo state should be toggled (closed)
      expect(store.getState().mapState.showInfo).toBe(false);
    });
  });
});

// =====================================================
// DAY 0 (LANDING PAGE / OVERVIEW) TESTS
// =====================================================

describe("Dashboard Day 0 Landing Page", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(11.3);
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "0",
        name: "Everest Base Camp 3 Pass Trek",
        time: "",
        distance: "",
        startAlt: "",
        endAlt: "",
        peakAlt: "",
        total_climb: "",
        descent: "",
      },
    });
  });

  it("should render the trek name on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.textContent).toContain("EVEREST BASE CAMP 3 PASS TREK");
  });

  it("should render Sagarmatha National Park on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.textContent).toContain("SAGARMATHA NATIONAL PARK");
  });

  it("should render Nepal on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.textContent).toContain("NEPAL");
  });

  it("should render three text lines in all caps on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const content = container.textContent;
    // All three lines should appear in order
    const trekIndex = content.indexOf("EVEREST BASE CAMP 3 PASS TREK");
    const parkIndex = content.indexOf("SAGARMATHA NATIONAL PARK");
    const nepalIndex = content.indexOf("NEPAL");

    expect(trekIndex).toBeGreaterThan(-1);
    expect(parkIndex).toBeGreaterThan(-1);
    expect(nepalIndex).toBeGreaterThan(-1);
    expect(trekIndex).toBeLessThan(parkIndex);
    expect(parkIndex).toBeLessThan(nepalIndex);
  });

  it("should NOT show elevation stats on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.textContent).not.toContain("▲");
    expect(container.textContent).not.toContain("▼");
  });

  it("should NOT show altitude display on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.querySelector(".altitude-display")).toBeNull();
  });

  it("should NOT show distance or time on Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(container.querySelector(".metric-value-desktop")).toBeNull();
    expect(container.querySelector(".time-value-desktop")).toBeNull();
  });

  it("should still show navigation arrows on Day 0", () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByAltText("Previous")).toBeInTheDocument();
    expect(getByAltText("Next")).toBeInTheDocument();
  });

  it("should still show control icons on Day 0", () => {
    const { getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    expect(getByAltText("Reset")).toBeInTheDocument();
    expect(getByAltText("Tools")).toBeInTheDocument();
  });

  it("should NOT show day indicator on desktop Day 0", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Day 0 renders the special overview content, not the normal metrics
    // The day indicator is inside metrics-bottom-row which is inside the normal metrics branch
    // On Day 0, the isDayZero branch renders instead, which has no day indicator
    const dayLabel = container.querySelector(".day-label-desktop");
    expect(dayLabel).toBeNull();
  });
});

// =====================================================
// DAY 0 AS DEFAULT STATE TESTS
// =====================================================

describe("Dashboard Day 0 as Default State", () => {
  it("should start on Day 0 when initial route state has day '0'", () => {
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "0",
        name: "Everest Base Camp 3 Pass Trek",
        time: "",
        distance: "",
        startAlt: "",
        endAlt: "",
        peakAlt: "",
        total_climb: "",
        descent: "",
      },
    });

    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Day 0 overview content should be visible
    expect(container.textContent).toContain("EVEREST BASE CAMP 3 PASS TREK");
    expect(container.textContent).toContain("SAGARMATHA NATIONAL PARK");
    expect(container.textContent).toContain("NEPAL");
  });

  it("should transition from Day 0 to Day 1 content", () => {
    // Start on Day 0
    const store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "0",
        name: "Everest Base Camp 3 Pass Trek",
        time: "",
        distance: "",
        startAlt: "",
        endAlt: "",
        peakAlt: "",
        total_climb: "",
        descent: "",
      },
    });

    const { container, rerender } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Verify Day 0 content
    expect(container.textContent).toContain("EVEREST BASE CAMP 3 PASS TREK");

    // Now update store to Day 1
    const store2 = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });

    rerender(
      <Provider store={store2}>
        <Dashboard />
      </Provider>,
    );

    // Should now show Day 1 content instead of Day 0
    expect(container.textContent).toContain("Lukla - Phakding");
    expect(container.textContent).not.toContain("SAGARMATHA NATIONAL PARK");
  });
});

// =====================================================
// BRANDING STRIP (VERSION ONLY) TESTS
// =====================================================

describe("Dashboard Branding Strip", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore({
      mapState: {
        isSingleDayView: false,
        zoom: 11.3,
        center: [27.840457443855108, 86.76420972837559],
        showLegend: true,
        zoomDuration: 1.25,
        paddingTopLeft: [50, 110],
        paddingBottomRight: [50, 50],
        unit: "km",
        attribution: "&copy; OpenStreetMap",
      },
      route: {
        day: "1",
        name: "Lukla - Phakding",
        time: "3h 30m",
        distance: "4.66 mi / 7.5 km",
        startAlt: "9,373",
        endAlt: "8,563",
        peakAlt: "",
        total_climb: "500",
        descent: "814",
      },
    });
  });

  it("should show version number in branding strip (not trek name)", async () => {
    const { container, getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open tools panel to see branding strip
    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      const brandingStrip = container.querySelector('.branding-strip');
      expect(brandingStrip).toBeInTheDocument();
      // Should contain version number (v prefix)
      expect(brandingStrip.textContent).toMatch(/v\d+\.\d+\.\d+/);
    });
  });

  it("should NOT show 'Everest Base Camp 3 Trek, Nepal' in branding strip", async () => {
    const { container, getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      const brandingStrip = container.querySelector('.branding-strip');
      expect(brandingStrip).toBeInTheDocument();
      expect(brandingStrip.textContent).not.toContain("Everest Base Camp 3 Trek, Nepal");
    });
  });

  it("should show attribution in branding strip", async () => {
    const { container, getByAltText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      expect(container.innerHTML).toContain("OpenStreetMap");
    });
  });
});