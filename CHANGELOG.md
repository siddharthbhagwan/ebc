# Changelog

All notable changes to the EBC Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-27

### Added
- **Comprehensive Test Suite**: 46 tests covering all Dashboard behaviors
  - Navigation tests (arrow keys, click handlers)
  - Space bar toggle between overview and single day view
  - Target button functionality
  - Route highlighting based on current day
  - Unit conversion (km/miles) tests
  - Mobile vs desktop responsive behavior tests
  - Rest day and place display tests
  - Keyboard navigation tests
- **Test Infrastructure**: Added `setupTests.js` with proper mocks for Leaflet, react-leaflet, and react-device-detect
- **CSS Classes**: Extracted 50+ inline styles to reusable CSS classes in `dashboard.css`
  - `.elevation-stats-row`, `.elevation-gain`, `.elevation-loss`
  - `.altitude-stats-row`, `.altitude-start`, `.altitude-end`, `.altitude-peak`
  - `.metrics-content`, `.metrics-row`
  - `.unit-toggle-*` classes for unit switcher
  - `.control-icons-*` classes for toolbar buttons
  - `.navigation-slab`, `.navigation-icon` for arrow navigation
  - Desktop and mobile variants using BEM-like naming

### Changed
- **Dashboard Metrics Layout**: Reordered to show name, elevation, then altitude
- **Mobile Layout**: Left-aligned day indicator on mobile bottom line
- **Elevation Display**: Always show altitude and elevation on separate lines on mobile
- **Code Architecture**: 
  - Moved from inline styles to CSS classes (reduced Dashboard.js from ~1200 to ~700 lines)
  - Added `useMemo` for computed values (padding, offsets, icon sizes, routes data)
  - Added `useCallback` for event handlers (formatAlt, displayDistance, navigation handlers)
- **Route Highlighting**: "Tube" style route highlight with improved visibility
- **POI Display**: Always show all POI names; added Chhukung altitude to geoJson

### Removed
- **Day 0**: Removed Day 0 from trek data, dashboard navigation, and POI logic
- **Unused Variables**: Cleaned up unused imports and variables

### Fixed
- **JSX Errors**: Fixed multiple JSX fragment wrapping issues in mobile metrics
- **Mobile Toolbar**: Ensure metrics row is hidden when tools/toolbar is open (mutual exclusivity)
- **Linter Errors**: Resolved all ESLint warnings for unused variables and useEffect dependencies

## [0.1.0] - Initial Release

### Added
- Interactive map of Everest Base Camp trek route
- Day-by-day navigation with route visualization
- Elevation and altitude statistics display
- Points of Interest (POI) markers
- Legend toggle
- Mobile responsive design
- Unit conversion (metric/imperial)
