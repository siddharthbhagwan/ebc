# Changelog

All notable changes to the EBC Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-29

### Added
- **Smart Altitude Display**: Altitudes now appear dynamically based on view mode and zoom level
  - Overview mode (not zoomed): Names only - prevents label crowding
  - Overview mode (zoomed in): Names + altitudes - complete view of all locations
  - Single day view: Names + altitudes always visible
  - Provides a clear view with all information visible when needed without overwhelming the map
- **Version Display**: Application version number now visible in toolbar title (smaller font, subtle styling)

### Fixed
- **Target Button Navigation**: Fixed stale closure bug where target button would zoom to Day 1 instead of the currently navigated day
  - Added 'day' to toggleTargetView dependency array
  - Target button now correctly respects arrow key navigation in overview mode
- **Page Load Jitter**: Eliminated jittery map adjustments on initial page load
  - Map bounds and center adjustments now skip animations on first render
  - Subsequent changes (like legend toggle) still animate smoothly
  - Uses `isInitialMount` ref to track initial vs. subsequent renders
- **Hover Tooltip Arrow Display**: Fixed incorrect arrow display when hovering over POI markers that shouldn't show elevation changes
  - Route properties now properly merged with marker data during hover events
  - Prevents arrows from appearing on markers where descent is "0" or unavailable

### Changed
- **POI Label Cleanup**: Simplified location names for better readability
  - Removed "Pass" suffix from passes: "Kongma La Pass" → "Kongma La"
  - Removed "Pass" suffix from passes: "Cho La Pass" → "Cho La"  
  - Removed "Pass" suffix from passes: "Renjo La Pass" → "Renjo La"
  - Removed "Summit" suffix from summits: "Chhukung Ri Summit" → "Chhukung Ri"
  - Removed "Summit" suffix from summits: "Kala Patthar Summit" → "Kala Patthar"
  - Removed "Summit" suffix from summits: "Gokyo Ri Summit" → "Gokyo Ri"
  - Renamed "Lukla Airport" to simply "Lukla"
- **Mobile Icon Sizing**: Reduced house icon circle by 1px on mobile for improved visual balance
  - Rest days: 18px → 17px
  - Non-rest days: 17px → 16px
- **Desktop Zoom Level**: Reduced initial desktop zoom from 11.3 to 11.2 for better overview perspective

## [1.2.0] - 2026-01-29

### Added
- **Enhanced POI Visibility**: All POI icons (camps, airports, summits, passes) now remain visible in both overview and single day view modes
- **Mobile Tap Target Enhancement**: Increased tap target size for POI markers to minimum 44px on mobile for better accessibility
- **Test Coverage**: Added comprehensive tests for POI behavior and target button functionality (85 tests total)

### Fixed
- **Target Button Priority**: Target button now correctly zooms to most recently viewed day instead of always defaulting to Day 1
  - Priority order: lastZoomedDay → currently highlighted day → Day 1
- **Ripple Effect**: Ripple animation now only appears on the destination house during rest days (not on all matching houses)
- **Legend Toggle Animation**: Eliminated jittery/vibrating screen effect when toggling legend visibility
  - Replaced 150ms setTimeout with requestAnimationFrame for browser-synced smooth animations
  - Fixed missing dependencies causing multiple recalculations
  - Reduced animation duration from 0.8s to 0.6s for snappier response

### Changed
- **POI Rendering Logic**: Removed filtering that hid POI markers when zoomed in; now only route paths are filtered in single day view
- **Animation Performance**: Improved map adjustment animations using requestAnimationFrame for 60fps smooth transitions

## [1.1.0] - 2026-01-27

### Added
- **GA4 Event Tracking**: Detailed engagement tracking for route selection, tool usage, and social links
- **Marker Engagement**: Added double-tap support for segments and markers on mobile to enter single day view
- **Cookie Persistence**: Map preferences (`ebc_unit`, `ebc_show_legend`) now persist across browser sessions

### Fixed
- **Duplicate Ripple Icon**: Fixed an issue where rest day locations (like Gorak Shep) showed two overlapping ripple icons
- **Engagement Logic**: Decoupled visual "Tube" highlight from manual zoom levels
- **Altitude Display**: Corrected altitude label format to show "start → peak → end" for days with a peak
- **Mobile Zoom**: Increased default mobile zoom levels by 0.1 for better visibility

### Changed
- **Test Suite Update**: Expanded tests to 71 passing cases

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
