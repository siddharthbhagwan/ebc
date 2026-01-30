# EBC Dashboard - Product Specification

## Overview

**Product Name:** EBC Dashboard (Everest Base Camp Trek Map Blog)  
**Version:** 1.11.0  
**Last Updated:** January 30, 2026  
**Live URL:** https://coderbear.com/ebc/  
**Repository:** https://github.com/siddharthbhagwan/ebc

### Description

EBC Dashboard is an interactive map-based blog documenting the Everest Base Camp 3 Pass Trek. It provides a day-by-day visualization of the 19-day trek route through the Himalayas, featuring elevation profiles, route highlighting, and points of interest.

---

## Technical Stack

### Frontend

| Technology    | Version | Purpose                      |
| ------------- | ------- | ---------------------------- |
| React         | 17.0.2  | UI Framework                 |
| Redux         | 4.2.1   | State Management             |
| React-Redux   | 7.2.9   | React-Redux Bindings         |
| Leaflet       | 1.9.4   | Map Rendering                |
| React-Leaflet | 2.4.0   | React Components for Leaflet |

### Supporting Libraries

| Library               | Purpose                              |
| --------------------- | ------------------------------------ |
| react-device-detect   | Device detection (desktop/mobile)    |
| react-leaflet-control | Custom map controls                  |
| react-bootstrap       | UI Components                        |
| react-ga4             | Google Analytics 4                   |
| gh-pages              | GitHub Pages deployment              |

### Build Tools

| Tool                  | Purpose                   |
| --------------------- | ------------------------- |
| Bun                   | Package manager & runtime |
| Create React App      | Build configuration       |
| Jest                  | Testing framework         |
| React Testing Library | Component testing         |

---

## Architecture

### Component Structure

```
src/
├── App.jsx                 # Root application component
├── index.jsx               # Application entry point
├── components/
│   ├── Dashboard.js        # Main dashboard with metrics & controls
│   ├── GeoJsonRoutes.js    # Route rendering with elevation gradients
│   ├── Legend.js           # Map legend component
│   ├── Info.js             # About/Info modal
│   ├── MapContainer.js     # Leaflet map wrapper
│   ├── POI.js              # Points of Interest markers
│   └── Reset.js            # Map reset control
├── hooks/
│   └── useDays.js          # Day navigation hook
├── reducers/
│   ├── mapStateReducer.jsx # Map state (zoom, center, view mode)
│   └── routeReducer.jsx    # Route state (current day, metrics)
├── store/
│   └── store.jsx           # Redux store configuration
├── utils/
│   ├── geoJson.js          # Trek route data (GeoJSON)
│   ├── heightGradient.js   # Elevation color gradients
│   ├── markers.jsx         # POI marker definitions
│   ├── preCalculatedBounds.js # Route bounds cache
│   ├── trekStats.js        # Trek statistics calculations
│   └── utils.js            # Redux action dispatchers
└── resources/
    ├── css/                # Stylesheets
    └── images/             # Icons and images
```

### State Management

#### Map State (`mapStateReducer`)

| Property          | Type         | Default          | Description                 |
| ----------------- | ------------ | ---------------- | --------------------------- |
| `center`          | `[lat, lng]` | `[27.84, 86.76]` | Map center coordinates      |
| `zoom`            | `number`     | `11.3`           | Zoom level                  |
| `isSingleDayView` | `boolean`    | `false`          | Single day vs overview mode |
| `showLegend`      | `boolean`    | `true`           | Legend visibility           |
| `showInfo`        | `boolean`    | `false`          | Info modal visibility       |
| `unit`            | `'km' \| 'mi'`| `'km'`           | Distance/altitude unit      |

#### Route State (`routeReducer`)

| Property      | Type     | Description               |
| ------------- | -------- | ------------------------- |
| `day`         | `string` | Current day number (1-19) |
| `name`        | `string` | Route segment name        |
| `time`        | `string` | Estimated time            |
| `distance`    | `string` | Route distance            |
| `startAlt`    | `string` | Starting altitude (ft)    |
| `endAlt`      | `string` | Ending altitude (ft)      |
| `peakAlt`     | `string` | Peak altitude (ft)        |
| `total_climb` | `string` | Total elevation gain (ft) |
| `descent`     | `string` | Total descent (ft)        |

---

## Design System

### Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Elevation Red (high altitude) | Dark Maroon | `#8E0000` |
| Elevation Green (ascent) | Green | `#27ae60` |
| Elevation Red (descent) | Red | `#c0392b` |
| Pass/Summit Tags | Dark Maroon | `#8E0000` |
| Primary Blue (active state) | Blue | `#2563eb` |
| Text Primary | Dark Gray | `#34495e` |
| Text Secondary | Medium Gray | `#4a5568` |
| Border Gray | Light Gray | `#cbd5e0` |
| Background Light | Off-white | `#f9f9f9` |

### Typography

| Element | Font | Size (Desktop) | Size (Mobile) | Weight |
|---------|------|----------------|---------------|--------|
| Trek Name | System | 19px (dynamic) | 15.5px (dynamic) | 600 |
| Stats Heading | System | 19px | 14.5px | Normal |
| Stat Labels | System | 13px | 10.5px | 500 |
| Info Content | Georgia, serif | 16px | 15px | 400 |

### Spacing & Layout

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Dashboard Width | `min(600px, calc(100vw - 40px))` | `100vw` |
| Dashboard Height | 115px | 138px |
| Dashboard Bottom Offset | `min(20px, 2vh)` | 0 |
| Dashboard Right Offset | `min(20px, 2vw)` | 0 |
| Panel Gap (above dashboard) | 12px | N/A |
| Border Radius (desktop) | 12px | 0 (full-width) |

---

## Features

### 1. Interactive Map

#### Base Map

- **Provider:** CartoDB Light
- **URL:** `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- **Attribution:** OpenStreetMap & Leaflet

#### Route Visualization

- **Format:** GeoJSON MultiLineString
- **Styling:** Elevation-based color gradient
- **Gradient Range:** Blue (low) → Green → Yellow → Red (high)
- **Highlight:** "Tube" style for current day route in overview mode

### 2. Dashboard Panel

#### Location & Responsive Behavior

| Viewport | Position | Sizing |
|----------|----------|--------|
| Desktop (≥1025px) | Bottom-right, fixed | Fluid width with max 600px |
| Mobile (<1025px) | Bottom, full-width | 100vw, fixed height |
| Desktop Resized | Scales proportionally | Maintains desktop styling via JS detection |

**Important:** Dashboard styling is determined by `isDesktop` from `react-device-detect`, NOT by CSS media queries. This ensures desktop browsers maintain desktop styling regardless of window size.

#### Components

| Element | Description |
|---------|-------------|
| Route Name | Current day's route segment name (clickable to re-center) |
| Elevation Stats | Total climb (▲) and descent (▼) with triangles |
| Altitude Stats | Start → peak → end altitudes |
| Day Indicator | Current day number with Pass/Summit tags |
| Navigation Arrows | Previous/Next day controls |
| Control Icons | Target view toggle, Tools panel |

#### Elevation Display

- **Triangles:** ▲ for ascent, ▼ for descent
- **Triangle Size:** `0.7em` relative to text
- **Dynamic Sizing:** Larger value gets larger font (17px vs 14px on desktop)
- **Hidden when zero:** Elevation row hidden if both climb and descent are "0"

#### Pass/Summit Tags

- **Location:** Next to day indicator
- **Color:** `#8E0000` (same as elevation red)
- **Style:** Small rounded badge with white text
- **Pass Days:** 9, 13, 15
- **Summit Days:** 12, 14

#### Rest Day / Acclimatization Day Display

- **Name:** Shown normally
- **Elevation:** Hidden (no ▲ or ▼)
- **Altitude:** Single altitude only (no start → end progression)
- **Distance/Time:** Hidden
- **Rest Days:** 4, 8, 11

### 3. Tools Panel

#### Opening/Closing

- Opens via Settings icon in control icons
- Closes via X button or clicking outside
- Closing tools panel on mobile also closes Info panel

#### Tool Icons

| Icon | Function | Active State |
|------|----------|--------------|
| Σ (Sigma) | Toggle Trek Stats panel | Blue background, blue border |
| Legend | Toggle legend visibility | Blue background, blue border |
| Info (i) | Toggle About panel | Blue background, blue border |
| M/FT Toggle | Switch units | Sliding indicator |

#### Icon Styling

- **Default:** `#f9f9f9` background, `1.5px solid #bdc3c7` border
- **Active:** `#e3f2fd` background, `1.5px solid #2563eb` border

### 4. Statistics Panel (Trek Stats)

#### Location

| Viewport | Position |
|----------|----------|
| Desktop | `bottom: calc(115px + min(20px, 2vh) + 12px)`, right-aligned |
| Mobile | Full-width, above dashboard |

#### Content

| Section | Items |
|---------|-------|
| Trek Stats (header) | Title only, normal weight |
| Summary Stats | Total Distance, Total Ascent, Total Descent, Max Altitude, Days (Active/Rest) |
| High Points (header) | Title with sort indicator, normal weight |
| High Points List | Sorted list of passes and summits |

#### Styling

- **No row separators:** No gray lines between stats on desktop
- **Headers:** Normal weight (not bold), with bottom border only on "Trek Stats"
- **Sortable:** Click anywhere in clickable area to cycle sort (day → desc → asc)

#### Mutual Exclusivity

- Opening Stats closes About panel
- Opening About closes Stats panel
- Single click achieves the switch (not two clicks)
- Logic handled directly in click handlers (no useEffect conflicts)

#### Mobile Toolbar Close Behavior

- Closing the toolbar (via toggle or X button) on mobile closes both Stats and About panels
- Ensures clean state when toolbar is dismissed

### 5. About Panel (Info)

#### Location

| Viewport | Position |
|----------|----------|
| Desktop | `bottom: calc(115px + min(20px, 2vh) + 8px)`, right-aligned, same width as dashboard |
| Mobile | Full-width bottom sheet with backdrop blur |

#### Content

- Profile image (lazy loaded, 102x102px)
- Social links (Twitter/X, GitHub, Website)
- Description text
- "Tap here to close" footer

#### Desktop Sizing

- **Width:** `min(600px, calc(100vw - 40px))` (matches dashboard)
- **Height:** Auto-fit to content with `max-height: min(300px, 40vh)`
- **Backdrop blur** shown when window width < 700px on desktop

### 6. Navigation

#### Methods

| Input | Action |
|-------|--------|
| Arrow Keys (←/→) | Navigate between days |
| Click Arrows | Navigate between days |
| Space / Enter | Reset zoom / toggle view |
| Arrow Up/Down | Zoom out/in |
| Tap/Click Route | Select and zoom to route |
| Tap/Click POI | Select and zoom to day |
| Click Trek Name | Re-center to current day |

#### View Modes

| Mode | Zoom | Description |
|------|------|-------------|
| Overview | 10.6 (mobile) / 11.3 (desktop) | Full trek visible |
| Single Day | ~13+ | Zoomed to current day's route |

#### Target Button Behavior

- **From Overview:** Zooms to currently highlighted route
- **From Single Day:** Returns to overview mode
- **Priority:** Current day → Last zoomed day → Day 1

### 7. Points of Interest (POI)

#### POI Types

| Type | Icon | Size Multiplier |
|------|------|-----------------|
| Lodge/Camp | Tent | 1.0 |
| Base Camp | EBC | 1.0 |
| Summit | Peak | 0.72 (reduced ~10%) |
| Pass | Flag | 1.0 |
| Airport | Plane | 1.0 |

#### Label Collision Detection

POI labels automatically hide when overlapping with other labels for a cleaner map appearance:

| Behavior | Description |
|----------|-------------|
| **Priority** | Everest Base Camp always visible (highest priority) |
| **Detection** | Bounding box overlap check with 4px padding |
| **Trigger** | Runs on zoom, pan, resize, and view mode change |
| **Animation** | Smooth 0.2s opacity fade transition |
| **Zoom In** | More space reveals more labels |
| **Zoom Out** | Overlapping labels hide automatically |
| **Single Day View** | Only relevant POIs shown (no collision detection) |

#### Legend Icon Sizes

| Type | Desktop | Mobile |
|------|---------|--------|
| Base Camp | 10px | 9px |
| Summit | 8px | 8px |
| Pass | 10px | 9px |
| Camp | 9px | 10px |

### 8. Legend

#### Location

- **Desktop:** Top-right, horizontal bar with rounded bottom corners
- **Mobile:** Top, full-width horizontal bar

#### Elements

- Base Camp icon with label
- Summit icon with label
- Pass icon with label
- Camp icon with label
- Elevation gradient bar

### 9. Unit Conversion

| Unit | Distance | Altitude |
|------|----------|----------|
| Metric (M) | Kilometers | Meters |
| Imperial (FT) | Miles | Feet |

### 10. User Preferences (Cookies)

| Preference | Cookie Key | Default | Expiry |
|------------|------------|---------|--------|
| Unit (km/mi) | `ebc_unit` | `km` | 1 year |
| Legend visibility | `ebc_show_legend` | `true` | 1 year |

---

## Analytics Tracking

### Categories

| Category | Actions |
|----------|---------|
| Navigation | Next Day, Previous Day, Keyboard, Click Trek Name |
| UI | Toggle Tools Panel, Close Tools Panel, Toggle Stats, Toggle Legend, Toggle Info, Close Info Panel, Close Stats Panel, Toggle Unit, Toggle View Mode, Sort High Points |
| POI | Click Marker |
| Route | Click Route Line, Click Rest Day Point |
| Social | Click Twitter, Click GitHub, Click Website |

### Event Labels

Labels include contextual information:
- Device type: `Desktop` or `Mobile`
- Current day: `Day X`
- Source/destination: `from Day Y`
- Panel state: `Open`, `Close`, `Show`, `Hide`
- Close method: `Via Backdrop`, `Via Tap Text`, `Via X Button`

---

## Responsive Design

### Device Detection

**Critical:** Device detection uses `isDesktop` from `react-device-detect`, NOT viewport width media queries. This ensures:
- Desktop browsers maintain desktop styling when resized
- Landscape warning only appears on touch devices (`pointer: coarse`)
- CSS classes (`--desktop`, `--mobile`) are applied via JavaScript

### Breakpoints (CSS fallbacks only)

| Context | Breakpoint | Notes |
|---------|------------|-------|
| Desktop styling | `min-width: 1025px` | Used as fallback only |
| Mobile styling | `max-width: 1024px` | Used as fallback only |
| Landscape mobile | `orientation: landscape` AND `pointer: coarse` | Touch devices only |

### Landscape Mode

- **Mobile (touch devices):** Shows "Landscape not supported" message
- **Desktop browsers:** No restriction, works at any aspect ratio

### Fluid Scaling (Desktop)

All panels use `min()` for fluid responsiveness:
- `width: min(600px, calc(100vw - 40px))`
- `right: min(20px, 2vw)`
- `bottom: min(20px, 2vh)`

This allows desktop panels to scale down gracefully when the browser window is resized while maintaining the desktop visual style.

---

## Trek Data

### Route Summary

| Property | Value |
|----------|-------|
| Trek Name | Everest Base Camp 3 Pass Trek |
| Total Days | 19 |
| Active Days | 16 |
| Rest Days | 3 (Days 4, 8, 11) |
| Total Distance | ~130 km / 80 mi |
| Total Ascent | ~9,500m |
| Total Descent | ~9,500m |
| Max Altitude | 18,514 ft (5,644 m) - Kala Patthar |
| Start/End Point | Lukla (9,373 ft) |

### Three Passes

| Pass | Altitude | Day |
|------|----------|-----|
| Kongma La | 18,136 ft (5,528 m) | Day 9 |
| Cho La | 17,782 ft (5,420 m) | Day 13 |
| Renjo La | 17,585 ft (5,360 m) | Day 15 |

### Summits

| Summit | Altitude | Day |
|--------|----------|-----|
| Kala Patthar | 18,514 ft (5,644 m) | Day 12 |
| Gokyo Ri | 17,575 ft (5,357 m) | Day 14 |

### Day-by-Day Routes

| Day | Route | Distance | Start Alt | End Alt |
|-----|-------|----------|-----------|---------|
| 1 | Lukla → Phakding | 7.5 km | 9,373 ft | 8,563 ft |
| 2 | Phakding → Namche Bazaar | 10 km | 8,563 ft | 11,286 ft |
| 3 | Namche → Khumjung → Namche | 8 km | 11,286 ft | 11,286 ft |
| 4 | Namche Bazaar (Rest Day) | - | 11,286 ft | 11,286 ft |
| 5 | Namche → Tengboche | 10 km | 11,286 ft | 12,687 ft |
| 6 | Tengboche → Dingboche | 11 km | 12,687 ft | 14,469 ft |
| 7 | Dingboche → Chhukung | 5 km | 14,469 ft | 15,518 ft |
| 8 | Chhukung (Rest Day) | - | 15,518 ft | 15,518 ft |
| 9 | Chhukung → Kongma La → Lobuche | 9 km | 15,518 ft | 16,175 ft |
| 10 | Lobuche → Gorak Shep → EBC | 13 km | 16,175 ft | 17,598 ft |
| 11 | Gorak Shep (Rest Day) | - | 17,598 ft | 17,598 ft |
| 12 | Gorak Shep → Kala Patthar → Dzongla | 12 km | 17,598 ft | 15,951 ft |
| 13 | Dzongla → Cho La → Gokyo | 11 km | 15,951 ft | 15,583 ft |
| 14 | Gokyo → Gokyo Ri → Gokyo | 4 km | 15,583 ft | 15,583 ft |
| 15 | Gokyo → Renjo La → Lungden | 10 km | 15,583 ft | 14,632 ft |
| 16 | Lungden → Thame | 10 km | 14,632 ft | 12,467 ft |
| 17 | Thame → Namche Bazaar | 10 km | 12,467 ft | 11,286 ft |
| 18 | Namche → Lukla | 19 km | 11,286 ft | 9,373 ft |
| 19 | Lukla (Departure) | - | 9,373 ft | - |

---

## Performance Optimizations

### Memoization

| Hook | Usage |
|------|-------|
| `useMemo` | Route bounds, padding values, icon sizes, routes data, gradient segments |
| `useCallback` | Event handlers, formatters, navigation functions |

### Caching

- Pre-calculated route bounds stored in `preCalculatedBounds.js`
- Memoized gradient segments for routes
- Static GeoJSON data

### Image Optimization

- Profile image uses `loading="lazy"` and `decoding="async"`
- Explicit `width` and `height` attributes to prevent layout shift

---

## Testing

### Test Files

| File | Coverage |
|------|----------|
| `Dashboard.test.js` | Dashboard behaviors, navigation, metrics display |
| `Legend.test.js` | Legend rendering, icon display |
| `markers.test.js` | Marker data structure, icon assignments |

### Test Infrastructure

- Jest with React Testing Library
- Mocked Leaflet, react-leaflet, react-device-detect
- Custom `setupTests.js` configuration

---

## Deployment

### Hosting

- **Platform:** GitHub Pages
- **Domain:** coderbear.com/ebc/
- **Branch:** gh-pages

### Build Process

```bash
npm run build      # Create production build
npm run deploy     # Deploy to gh-pages (auto-amends commit)
```

### Version Management

- Version stored in `package.json`
- Displayed in dashboard branding strip
- Updated in CHANGELOG.md for releases

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

## License

Private project - All rights reserved.

## Author

**Siddhartha Bhagwan**

- Twitter: [@siddhartha_b](https://twitter.com/siddhartha_b)
- GitHub: [siddharthbhagwan](https://github.com/siddharthbhagwan)
- Website: [coderbear.com](https://coderbear.com)
