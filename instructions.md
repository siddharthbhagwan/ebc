# Developer Instructions

## Specification Updates
- **Zoom Levels**:
  - Desktop Overview: `11.3`
  - Mobile Portrait Overview: `10.6` (Increased from 10.5)
  - Mobile Landscape Overview: `10.5` (Increased from 10.4)
- **UI Logic**:
  - **Rest Days**: Only the name and a single altitude value are displayed. Distance, time, and elevation gain/descent are hidden.
  - **Zero Values**: Elevation gain (▲) or descent (▼) metrics are hidden if their values are zero.
  - **Target Button**: Focuses on the currently selected route segment. Priority: Current selected day > Last zoomed day > Day 1.
  - **Keyboard**: Enter key behaves identically to the Space bar (toggles between overview and single day view).
  - **View Mode Decoupling**: Visuals for "Single Route View" (e.g., hiding the Tube highlight) are now strictly decoupled from manual zoom levels. Changing zoom via pinch/scroll will not change the view mode or hide/show the Tube logic.
  - **Engagement**: Singular route view is now explicitly engaged only via:
    - Tap or Double-tap on a route segment.
    - Tap or Double-tap on a POI marker.
    - Clicking the Target/Location button.
    - Keyboard toggles (Space/Enter).

## Test Coverage
- `src/components/Dashboard.test.js` has been updated with tests for all recent specification changes:
  - Rest day conditional rendering.
  - Zero value hiding for elevation.
  - Enter key navigation support.
  - Target button priority logic.
  - Toolbar icon styling and accessibility.
  - Metric display order (Name > Elevation > Altitude).

## Publishing
- Use `npm run deploy` (or `bun run deploy`) to build and push to GitHub Pages.
- Ensure all tests pass before deployment using `npm test`.
