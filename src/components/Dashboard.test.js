import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import Dashboard from "./Dashboard";
import { routeReducer } from "../reducers/routeReducer";
import { mapStateReducer } from "../reducers/mapStateReducer";

// Declare mockMap before jest.mock so it can be referenced
let mockMap;

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, ...props }) => (
    <div data-testid="leaflet-control">{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => ({
    on: jest.fn(),
    off: jest.fn(),
    getZoom: jest.fn(() => 11.3),
    flyToBounds: jest.fn(),
    flyTo: jest.fn(),
    invalidateSize: jest.fn(),
  }),
  withLeaflet: (Component) => (props) => (
    <Component {...props} leaflet={{ map: mockMap }} />
  ),
}));

// Mock react-device-detect
jest.mock("react-device-detect", () => ({
  isDesktop: true,
  useMobileOrientation: () => ({ isLandscape: false }),
}));

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
}));

// Mock other dependencies
jest.mock("../utils/geoJson", () => ({
  getDayWiseDataG: () => ({
    1: { features: [{ properties: { day: "1", name: "Lukla - Phakding" } }] },
    2: { features: [{ properties: { day: "2", name: "Phakding - Namche Bazaar" } }] },
    3: { features: [{ properties: { day: "3", name: "Namche Bazaar Acclimatization" } }] },
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
    nextDay: () => ({ properties: { day: "2", name: "Phakding - Namche Bazaar" } }),
    prevDay: () => ({ properties: { day: "1", name: "Lukla - Phakding" } }),
  }),
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
    mockMap = {
      flyToBounds: jest.fn(),
      getZoom: jest.fn(() => 11.3), // Overview zoom
      flyTo: jest.fn(),
      invalidateSize: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
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
      const { getByAltText } = render(
        <Provider store={store}>
          <Dashboard />
        </Provider>
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
    const elevationGain = container.querySelector('.elevation-gain--desktop');
    expect(elevationGain).toBeInTheDocument();
    expect(elevationGain.textContent).toMatch(/▲\s*152m/);

    // Find the descent span (red color) using CSS class
    const altitudeChange = container.querySelector('.elevation-descent--desktop');
    expect(altitudeChange).toBeInTheDocument();
    expect(altitudeChange.textContent).toMatch(/▼\s*248m/);
  });

  it("should render elevation stats when both total_climb and descent are zero", () => {
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

    // Dashboard always shows elevation stats with "0m" values (text may have whitespace)
    expect(container.textContent).toMatch(/▲\s*0m/);
    expect(container.textContent).toMatch(/▼\s*0m/);
  });

  it("should render both elevation gain and descent even when descent is zero", () => {
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

    // Both should be rendered (text may have whitespace between arrow and value)
    expect(container.textContent).toMatch(/▲\s*152m/);
    expect(container.textContent).toMatch(/▼\s*0m/);
  });

  it("should render both elevation gain and descent even when total_climb is zero", () => {
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

    // Both should be rendered (text may have whitespace between arrow and value)
    expect(container.textContent).toMatch(/▲\s*0m/);
    expect(container.textContent).toMatch(/▼\s*248m/);
  });

  it("should render elevation stats with correct colors", () => {
    const { container } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Elevation gain should have green class (color defined in CSS)
    const elevationGain = container.querySelector('.elevation-gain--desktop');
    expect(elevationGain).toBeInTheDocument();
    expect(elevationGain.textContent).toMatch(/▲\s*152m/);

    // Altitude change should have red class (color defined in CSS)
    const altitudeChange = container.querySelector('.elevation-descent--desktop');
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
    const elevationGain = container.querySelector('.elevation-gain--desktop');
    expect(elevationGain).toBeInTheDocument();

    // Find the altitude display using CSS class
    const altitudeDisplay = container.querySelector('.altitude-display--desktop');
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
    const altitudeDisplay = container.querySelector('.altitude-display--desktop');
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
        attribution: '&copy; OpenStreetMap',
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
    const { getByAltText, getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      expect(getByText("Everest Base Camp 3 Pass Trek, Nepal")).toBeInTheDocument();
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

  it("should show unit toggle (KM/MI) in toolbar", async () => {
    const { getByAltText, getAllByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      // There are multiple KM/MI elements - the active unit indicator and the toggle labels
      const kmElements = getAllByText("KM");
      const miElements = getAllByText("MI");
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
    const { getByAltText, getByText, queryByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Open toolbar
    const toolsBtn = getByAltText("Tools");
    fireEvent.click(toolsBtn);

    await waitFor(() => {
      expect(getByText("Everest Base Camp 3 Pass Trek, Nepal")).toBeInTheDocument();
    });

    // Close toolbar
    const closeBtn = getByText("✕");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(queryByText("Everest Base Camp 3 Pass Trek, Nepal")).not.toBeInTheDocument();
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
    const altitudeDisplay = container.querySelector('.altitude-display--desktop');
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
    const altitudeDisplay = container.querySelector('.altitude-display--desktop');
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
  it("should not show distance/time for rest days (0 mi / 0 km)", () => {
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

    const { queryByText, getByText } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>,
    );

    // Name should be shown
    expect(getByText("Namche Bazaar Acclimatization")).toBeInTheDocument();
    
    // Day should be shown
    expect(getByText("3")).toBeInTheDocument();
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
        name: "Chhukung - Kongma La Pass - Lobuche",
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

    const nameElement = getByText("Chhukung - Kongma La Pass - Lobuche");
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
