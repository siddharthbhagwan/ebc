// Set global L before any imports
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    remove: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  icon: jest.fn(),
  control: {
    attribution: jest.fn(() => ({
      addTo: jest.fn(),
    })),
  },
  latLngBounds: jest.fn(() => ({
    isValid: jest.fn(() => true),
  })),
  geoJSON: jest.fn(() => ({
    getBounds: jest.fn(() => ({
      isValid: jest.fn(() => true),
    })),
  })),
  extend: jest.fn((obj) => obj),
  Class: {
    extend: jest.fn((obj) => obj),
  },
};

// Mock leaflet using doMock to ensure it's hoisted
jest.doMock("leaflet", () => global.L);

// Mock react-device-detect
jest.mock("react-device-detect", () => ({
  useMobileOrientation: () => ({
    isLandscape: false,
    isPortrait: true,
  }),
  isDesktop: true,
  isMobile: false,
  isTablet: false,
}));

// Set up window object before any imports
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
  requestAnimationFrame: jest.fn(),
  cancelAnimationFrame: jest.fn(),
  document: {
    createElement: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};

global.document = global.window.document;

// Add missing Web APIs
global.TextDecoder = require("util").TextDecoder;
global.TextEncoder = require("util").TextEncoder;
global.ReadableStream = require("stream").Readable;
global.MessagePort = class MessagePort {};

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock react-leaflet-control
jest.mock("react-leaflet-control", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="leaflet-control">{children}</div>
  ),
}));

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div />,
  withLeaflet: (WrappedComponent) => {
    const WithLeafletComponent = (props) => (
      <WrappedComponent
        {...props}
        leaflet={{
          map: {
            flyToBounds: jest.fn(),
            getZoom: () => 12,
            getCenter: jest.fn(() => ({ lat: 27.9881, lng: 86.925 })),
            getBoundsZoom: jest.fn(() => 12),
            zoomIn: jest.fn(),
            zoomOut: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            invalidateSize: jest.fn(),
            flyTo: jest.fn(),
          },
        }}
      />
    );
    WithLeafletComponent.displayName = `withLeaflet(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithLeafletComponent;
  },
}));
