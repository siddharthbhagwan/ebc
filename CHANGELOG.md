# Changelog

All notable changes to the EBC Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.1] - 2026-01-31

### Added
- **Stats Panel Triangles**: Added ▲/▼ triangle indicators to Total Ascent and Total Descent in the Trek Stats panel for visual consistency with the main dashboard.

### Changed
- **Descent Color**: Updated Total Descent color in stats panel to match main dashboard (#8c2419 dark red).
- **Single Day View Labels**: Other-day POIs now show only name (no D# or altitude) in smaller 9px font for cleaner display on both desktop and mobile.

### Fixed
- **Bounds Calculation**: Regenerated preCalculatedBounds from route-only coordinates, excluding POI icons. This ensures single-day view zooms to show only the actual route, not distant markers.

## [1.11.0] - 2026-01-30

### Added
- **Label Collision Detection**: Automatically hides overlapping POI labels on small screens for a cleaner map. EBC always visible; zoom in to reveal more labels.

## [1.10.0] - 2026-01-30

### Added
- **Day Labels on All POIs**: All map markers now display day number (e.g., "D5") next to the name, not just summits and passes.

### Changed
- **Label Visibility**: All POI labels (name + altitude) now visible by default on both desktop and mobile. Icons always visible.

### Fixed
- **Day Assignments**: Corrected sleeping location days to only show nights actually spent at each location:
  - Namche Bazaar: D2, 3 & 19 (removed day 20)
  - Lobuche: D8, 9 & 12 (removed days 10, 11, 13)
  - Gorak Shep: D10 & 11 (removed day 12)
  - Marlung: D18 (removed day 19)

## [1.9.1] - 2026-01-30

### Added
- **Altitude Always Visible**: POI tooltips now always display altitude under place names, not just when zoomed in.
- **Day Labels on Highpoints**: Summit, pass, and EBC markers now show day number (e.g., "D12") in smaller, lighter font next to the name.

### Changed
- **Dashboard Height**: Increased desktop dashboard height from 115px to 120px for better content fit.
- **Altitude Fallback**: Dashboard altitude display now falls back to route data if Redux props are null on initial load.

## [1.9.0] - 2026-01-30

### Added
- **Responsive Panel Scaling**: Stats and About panels now scale proportionally with the dashboard during viewport resize, using JS-based device detection instead of CSS media queries.
- **Narrow Desktop Backdrop**: About panel shows blur backdrop on desktop when window width < 700px.

### Changed
- **About Panel**: Width now matches dashboard (600px max), positioned directly above dashboard with 8px gap.
- **About Panel Sizing**: Height is now auto-fit to content instead of fixed height, eliminating excess whitespace.
- **Stats Panel**: Now uses JS-based device detection for consistent breakpoint behavior with dashboard.
- **Panel Mutual Exclusivity**: Simplified logic by removing conflicting useEffects; mutual exclusivity now handled directly in click handlers.
- **Metrics Row**: Removed background color from day/distance/time row for cleaner appearance.

### Fixed
- **Trek Name**: Corrected to "Everest Base Camp 3 Pass Trek" in About section.
- **Elevation Triangles**: Restored green (▲) and red (▼) indicators for climb/descent values.
- **Mobile Toolbar Close**: Closing toolbar now properly closes both Stats and About panels on mobile.

## [1.8.0] - 2026-01-30

### Changed
- **Summit/Pass Tag Color**: Updated to elevation red (`#8E0000`) for visual consistency with high-altitude route segments.
- **Summit Icon Size**: Reduced by ~10% for better visual balance on map markers and legend.
- **Elevation Triangles**: Restored ▲/▼ indicators with smaller, more subtle sizing (70% of text).
- **Stats Panel**: Removed faint line separators between rows on desktop for cleaner appearance.
- **About Panel**: Increased width by 10% on desktop (300px → 330px) for better readability.
- **Panel Mutual Exclusivity**: Fixed bug where clicking Info/Stats buttons wouldn't properly toggle the other panel closed.
- **Mobile UX**: Closing toolbar now properly closes About panel.

## [1.7.0] - 2026-01-30

### Added
- **Unit Customization**: Updated toolbar toggle to display **M/FT** instead of KM/MI for altitude preference.
- **Improved Alignment**: Fixed Lobuche marker text alignment to always appear on the right.
- **Testing**: Created dedicated test files for Legend and markers utilities.

### Changed
- **Typography Polish**: Reduced dashboard font weight across branding, metrics, and navigation for a more sophisticated, less "fat" appearance.
- **Desktop Refinement**: Slimmed down statistics and info cards to a 300px width on desktop (originally 520px) to maximize map visibility.
- **Icon Alignment**: Fixed vertical centering of legend "tags" (Summit/Pass/Lodging) by normalizing icon container sizes and ensuring flexbox alignment without increasing bar height.
- **Unit Formatting**: Removed whitespaces between values and units (e.g., `18,000ft`) for tighter data display.
- **Icon Refinements**: Decreased summit and pass icon sizes by 1px for better balance with text labels and on-map circles.
- **Summit/Pass Tag Color**: Changed tag colors to match elevation red (`#8E0000`) for visual consistency with high-altitude markers.
- **Mobile UX**: Closing the toolbar now automatically closes the About panel on mobile devices.
- **Test Reorganization**: Moved tests from `UIFixes.test.js` to respective component test files (`Legend.test.js`, `markers.test.js`).

## [1.6.0] - 2026-01-30

### Added
- **Mutual Exclusivity**: Stats and Info panels now automatically toggle each other off when opened.
- **Floating UI Design**: Statistics and Info panels converted to modern floating cards on mobile for better safe-area compatibility.
- **Analytics Integration**: Added ReactGA4 tracking for all major UI interactions including panel toggles and sorting.

### Changed
- **Branding**: Renamed "Trek Statistics" to "Trek Stats" and updated headings to normal case.
- **Desktop Refinements**: Synchronized widths (480px) and 스타일 between Info and Stats panels.
- **UI Height**: Reduced desktop dashboard height to 115px with optimized sticky metrics bar.
- **Data Cleanup**: Removed " Pass" suffix from geo-data names for a cleaner interface.

## [1.5.1] - 2026-01-30

### Changed
- **Code Maintenance**: Refactored React hooks to resolve ESLint warnings and optimize performance.
- **Dependency Optimization**: Cleaned up unnecessary hook dependencies.
- **Repository Health**: Squashed development commits for a cleaner branch history.

## [1.5.0] - 2026-01-30

### Added
- **Refined Statistics UI**: Improved typography and layout for better readability.
- **Robust Geodata Validation**: Implemented coordinate sanitization to prevent "Invalid LatLng" runtime errors during rapid navigation.

### Changed
- **Trek Statistics**:
  - Normalized all altitude and climb/descent data to feet for consistent display.
  - Corrected high point elevations for Chhukung Ri (18,209 ft), Kongma La (18,159 ft), and Gokyo Ri (17,575 ft).
  - Switched labels to uppercase for impact (TOTAL ASCENT, MAX ALTITUDE, etc.).
  - Added triangle icon to Trek Statistics header.
  - Removed space between ascent/descent triangles and digits.
- **Info Component**:
  - Redesigned with a dedicated "Click here to close" section and separator line.
  - Adjusted mobile metrics bar height and branding strip (Rangola) for better visibility on small screens.
  - Integrated toolbar closure: closing the toolbar now automatically closes the statistics tab.
- **Layout**:
  - Full-content width map on desktop with non-blurring background when stats are open.
  - Thinner dashboard borders (2px) and optimized spacing.

## [1.4.0] - 2026-01-29

### Added
- **Trek Statistics**: New statistics overlay displaying comprehensive trek metrics
  - Total Distance: 130.7 km
  - Total Climb and Descent
  - Maximum Altitude: 18,192 ft
  - Active Days: 19
  - Rest Days: 0
  - Sortable HIGH PASSES section (click to cycle between altitude descent/ascent/day order)
- **Day Badges**: Visual indicators for special days
  - Pass badges (Days 8, 14, 18) showing pass names
  - Summit badges (Days 7, 12, 16) showing summit names
  - Displayed on both desktop and mobile day indicators
- **Statistics Button**: Sigma (Σ) button in toolbar with visual feedback when active

### Changed
- **About Section**: Updated with "Click anywhere to close" instruction
- **Info Modal**: Improved styling for better consistency

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
