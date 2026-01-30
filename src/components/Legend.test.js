import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore, combineReducers } from "redux";

// Mock react-device-detect BEFORE components import
jest.mock("react-device-detect", () => ({
  isDesktop: true,
  isMobile: false,
  useMobileOrientation: () => ({ isLandscape: false }),
}));

import Legend from "./Legend";
import { routeReducer } from "../reducers/routeReducer";
import { mapStateReducer } from "../reducers/mapStateReducer";

function renderWithRedux(
  ui,
  {
    initialState,
    store = createStore(
      combineReducers({ route: routeReducer, mapState: mapStateReducer }),
      initialState
    ),
  } = {}
) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe("Legend Component", () => {
  test("renders with reduced summit and pass icon sizes on desktop", () => {
    const initialState = {
      mapState: {
        showLegend: true
      }
    };
    
    const { container } = renderWithRedux(<Legend />, { initialState });
    
    const summitIcon = container.querySelector(".summit-marker-icon");
    const passIcon = container.querySelector(".flag-marker-icon");
    
    // On desktop (mocked as true), summit should be 9px and pass should be 10px
    expect(summitIcon).toHaveAttribute("width", "9px");
    expect(passIcon).toHaveAttribute("width", "10px");
  });

  test("does not render when showLegend is false", () => {
    const initialState = {
      mapState: {
        showLegend: false
      }
    };
    
    const { container } = renderWithRedux(<Legend />, { initialState });
    
    // Legend should not render
    const legendElement = container.querySelector(".legend");
    expect(legendElement).toBeNull();
  });
});
