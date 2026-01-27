# EBC Dashboard - Product Specification

## Overview

**Product Name:** EBC Dashboard (Everest Base Camp Trek Map Blog)  
**Version:** 1.0.0  
**Last Updated:** January 27, 2026  
**Live URL:** https://coderbear.com/ebc/  
**Repository:** https://github.com/siddharthbhagwan/ebc

### Description

EBC Dashboard is an interactive map-based blog documenting the Everest Base Camp 3 Pass Trek. It provides a day-by-day visualization of the 19-day trek route through the Himalayas, featuring elevation profiles, route highlighting, and points of interest.

---

## Technical Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 17.0.2 | UI Framework |
| Redux | 4.2.1 | State Management |
| React-Redux | 7.2.9 | React-Redux Bindings |
| Leaflet | 1.9.4 | Map Rendering |
| React-Leaflet | 2.4.0 | React Components for Leaflet |

### Supporting Libraries
| Library | Purpose |
|---------|---------|
| react-device-detect | Responsive behavior (desktop/mobile) |
| react-leaflet-control | Custom map controls |
| react-bootstrap | UI Components |
| react-ga4 | Google Analytics |
| gh-pages | GitHub Pages deployment |

### Build Tools
| Tool | Purpose |
|------|---------|
| Bun | Package manager & runtime |
| Create React App | Build configuration |
| Jest | Testing framework |
| React Testing Library | Component testing |

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
│   └── utils.js            # Redux action dispatchers
└── resources/
    ├── css/                # Stylesheets
    └── images/             # Icons and images
```

### State Management

#### Map State (`mapStateReducer`)
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `center` | `[lat, lng]` | `[27.84, 86.76]` | Map center coordinates |
| `zoom` | `number` | `11.3` | Zoom level |
| `isSingleDayView` | `boolean` | `false` | Single day vs overview mode |
| `showLegend` | `boolean` | `true` | Legend visibility |
| `showInfo` | `boolean` | `false` | Info modal visibility |
| `unit` | `'km' | 'mi'` | `'km'` | Distance/altitude unit |

#### Route State (`routeReducer`)
| Property | Type | Description |
|----------|------|-------------|
| `day` | `string` | Current day number (1-19) |
| `name` | `string` | Route segment name |
| `time` | `string` | Estimated time |
| `distance` | `string` | Route distance |
| `startAlt` | `string` | Starting altitude (ft) |
| `endAlt` | `string` | Ending altitude (ft) |
| `peakAlt` | `string` | Peak altitude (ft) |
| `total_climb` | `string` | Total elevation gain (ft) |
| `descent` | `string` | Total descent (ft) |

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
- **Highlight:** "Tube" style for current day route

### 2. Dashboard Panel

#### Location
- **Desktop:** Bottom-right corner, fixed position
- **Mobile:** Bottom of screen, full width

#### Components
| Element | Description |
|---------|-------------|
| Route Name | Current day's route segment name |
| Elevation Stats | Total climb (▲) and descent (▼) - hidden if zero |
| Altitude Stats | Start → peak → end altitudes (or single altitude for rest days) |
| Day Indicator | Current day number (always on the left) |
| Navigation Arrows | Previous/Next day controls |

#### Rest Day / Acclimatization Day Display
- **Name:** Shown normally
- **Elevation:** Hidden (no ▲ or ▼)
- **Altitude:** Single altitude only (no start → end progression)
- **Distance/Time:** Hidden

#### Zero Value Handling
- Elevation gain (▲) hidden when `total_climb` is "0"
- Elevation descent (▼) hidden when `descent` is "0"
- Entire elevation row hidden when both are "0"

### 3. Navigation

#### Methods
| Input | Action |
|-------|--------|
| Arrow Keys (←/→) | Navigate between days |
| Click Arrows | Navigate between days |
| Space / Enter | Toggle overview/single day view |
| Tap/Click Route | Select and enter Single Route View |
| Double-tap Route | Select and enter Single Route View |
| Tap/Click POI | Select and enter Single Route View |

#### View Mode Decoupling
- **Visuals**: Manual zoom levels (scroll/pinch) do not affect view mode state or visuals (e.g., Tube highlight remains visible in overview even when zoomed in manually).
- **Engagement**: Single Route View is only engaged via explicit tap/click on a feature or the Target button.

#### Target Button Behavior
- **From Overview:** Zooms to currently highlighted/selected route (not Day 1)
- **From Single Day:** Returns to overview mode
- **Priority:** Current day → Last zoomed day → Day 1

#### View Modes
| Mode | Zoom | Description |
|------|------|-------------|
| Overview | 10.6 (mobile) / 11.3 (desktop) | Full trek visible |
| Single Day | ~13+ | Zoomed to current day's route |

### 4. Points of Interest (POI)

#### POI Types
| Type | Icon | Description |
|------|------|-------------|
| Lodge/Camp | 🏕️ Tent | Overnight stops |
| Base Camp | ⛰️ EBC | Everest Base Camp |
| Summit | 🏔️ Peak | Mountain summits |
| Pass | 🚩 Flag | High passes |
| Airport | ✈️ Plane | Lukla Airport |

#### Visibility Rules
- **Overview:** Show start/end camps, major POIs
- **Zoomed In:** Show all POIs with labels

### 5. Legend

#### Location
- **Desktop:** Top-right, horizontal bar
- **Mobile:** Top, full-width horizontal bar

#### Elements
- Base Camp icon with label
- Camp icon with label  
- Summit icon with label
- Pass icon with label
- Elevation gradient bar

### 6. Toolbar Controls

| Icon | Function |
|------|----------|
| Location/Target | Toggle between overview and single day view (zooms to selected route) |
| Settings | Open tools menu |
| Legend | Toggle legend visibility |
| Info | Show about modal |

#### Tool Icon Styling
- Icons have visible borders for better contrast
- Background: `#f9f9f9` with `1.5px solid #bdc3c7` border

### 7. Unit Conversion

| Unit | Distance | Altitude |
|------|----------|----------|
| Metric (km) | Kilometers | Meters |
| Imperial (mi) | Miles | Feet |

### 8. User Preferences (Cookies)

User preferences are persisted via cookies with 1-year expiry:
| Preference | Cookie Key | Default |
|------------|------------|---------|
| Unit (km/mi) | `ebc_unit` | `km` |
| Legend visibility | `ebc_show_legend` | `true` |

---

## Trek Data

### Route Summary
| Property | Value |
|----------|-------|
| Total Days | 19 |
| Rest Days | 3 (Days 4, 8, 11) |
| Total Distance | ~130 km / 80 mi |
| Max Altitude | 18,514 ft (5,644 m) - Kala Patthar |
| Start Point | Lukla (9,373 ft) |
| End Point | Lukla (9,373 ft) |

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

### Three Passes
| Pass | Altitude | Day |
|------|----------|-----|
| Kongma La | 18,136 ft (5,528 m) | Day 9 |
| Cho La | 17,782 ft (5,420 m) | Day 13 |
| Renjo La | 17,585 ft (5,360 m) | Day 15 |

---

## Responsive Design

### Breakpoints
| Device | Detection | Behavior |
|--------|-----------|----------|
| Desktop | `isDesktop: true` | Side dashboard, larger controls |
| Mobile Portrait | `isDesktop: false` | Bottom dashboard, compact layout |
| Mobile Landscape | `isLandscape: true` | Adjusted zoom level |

### Mobile-Specific Adjustments
- Reduced dashboard height
- Smaller font sizes
- Touch-friendly button sizes
- Full-width legend bar
- Adjusted map padding

---

## Performance Optimizations

### Memoization
| Hook | Usage |
|------|-------|
| `useMemo` | Route bounds, padding values, icon sizes, routes data |
| `useCallback` | Event handlers, formatters, navigation functions |

### Caching
- Pre-calculated route bounds
- Memoized gradient segments for routes
- Static GeoJSON data

---

## Testing

### Test Coverage
| Category | Tests | Coverage |
|----------|-------|----------|
| Navigation | 8 | Arrow keys, click handlers |
| View Toggle | 4 | Space bar, target button |
| Metrics Display | 12 | Elevation, altitude, distance |
| Responsive | 6 | Desktop vs mobile |
| Unit Conversion | 4 | km/mi toggle |
| **Total** | **46** | All Dashboard behaviors |

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
bun run build      # Create production build
bun run deploy     # Deploy to gh-pages
```

### CI/CD
- Manual deployment via npm scripts
- Build verification before deploy

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 1 version |
| Firefox | Last 1 version |
| Safari | Last 1 version |

---

## Future Enhancements

### Potential Features
- [ ] Photo gallery integration
- [ ] Elevation profile chart
- [ ] Weather data overlay
- [ ] Offline support (PWA)
- [ ] Share functionality
- [ ] Multiple trek routes
- [ ] 3D terrain view

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

## License

Private project - All rights reserved.

## Author

**Siddharth Bhagwan**  
- Twitter: [@siddhartha_b](https://twitter.com/siddhartha_b)
- Website: [coderbear.com](https://coderbear.com)
