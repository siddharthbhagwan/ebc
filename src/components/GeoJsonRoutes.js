import React, { useState, useEffect, useMemo } from "react";
import { Polyline, withLeaflet, Marker } from "react-leaflet";
import L from "leaflet";
import { getDayWiseDataG } from "../utils/geoJson";
import { preCalculatedBounds } from "../utils/preCalculatedBounds";
import { connect } from "react-redux";
import { isDesktop, useMobileOrientation } from "react-device-detect";
import { mapDispatchToProps } from "../utils/utils";
import {
  createGradientSegments,
  getColorForElevation,
} from "../utils/heightGradient";
import tentIcon from "../resources/images/tent.svg";
import airportIcon from "../resources/images/airport.svg";

const ZOOM_MOBILE = 10.5;
const ZOOM_LANDSCAPE = 10;

const GeoJsonRoutes = (props) => {
  const { map } = props.leaflet;
  const {
    zoomDuration,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
    currentDay,
    isSingleDayView,
    showLegend,
    setSingleDayView,
    zoom,
  } = props;

  const { isLandscape = false } = useMobileOrientation();
  const derivedZoom = isDesktop
    ? zoom
    : isLandscape
      ? ZOOM_LANDSCAPE
      : ZOOM_MOBILE;

  const [currentZoom, setCurrentZoom] = useState(map ? map.getZoom() : zoom);

  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      const newZoom = map.getZoom();
      // Use a smaller threshold to ensure consistency with the UI state
      const wasZoomedIn = currentZoom > derivedZoom + 0.1;
      const isNowZoomedIn = newZoom > derivedZoom + 0.1;

      // Only re-render if we cross the zoom threshold to keep it performant
      if (wasZoomedIn !== isNowZoomedIn) {
        setCurrentZoom(newZoom);
      }
    };

    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [map, currentZoom, derivedZoom]);

  // Adjust padding for mobile and desktop to account for the legend at the top and dashboard at the bottom
  const effectivePaddingTopLeft = [
    paddingTopLeft[0],
    isDesktop
      ? paddingTopLeft[1] + (showLegend ? 30 : 0)
      : paddingTopLeft[1] + (showLegend ? 35 : 0), // Further reduced from 40 to 35
  ];

  const effectivePaddingBottomRight = isDesktop
    ? [paddingBottomRight[0] + 625, paddingBottomRight[1] + 160]
    : [paddingBottomRight[0], paddingBottomRight[1] + 150]; // Increased from 130 to compensate for shift

  const routes = getDayWiseDataG();

  const currentDayRoute = routes[currentDay];
  const isCurrentDayRestDay =
    currentDayRoute &&
    currentDayRoute.features &&
    currentDayRoute.features[0] &&
    currentDayRoute.features[0].properties.time === "Rest Day";

  // Memoize segments for all routes once to avoid heavy recalculation on every state change
  const memoizedRoutes = useMemo(() => {
    if (!routes) return {};
    const result = {};
    Object.entries(routes).forEach(([day, route]) => {
      if (!route || !route.features) return;

      result[day] = route.features.map((feature) => {
        if (feature.geometry.type === "MultiLineString") {
          return {
            segments: createGradientSegments(feature.geometry.coordinates),
            properties: feature.properties,
            geometry: feature.geometry,
          };
        } else {
          return {
            properties: feature.properties,
            geometry: feature.geometry,
          };
        }
      });
    });
    return result;
  }, [routes]);

  if (!routes) {
    return null;
  }

  // Check if we're zoomed in (more than 0.1 above the derived zoom)
  const isZoomedIn = currentZoom > derivedZoom + 0.1;

  const polylines = [];
  const tapTargets = [];

  Object.entries(memoizedRoutes).forEach(([day, features]) => {
    features.forEach((featureData, featIdx) => {
      const { geometry, properties, segments } = featureData;

      // Handle Point features (Rest Days or specialized markers)
      if (geometry.type === "Point") {
        // Show rest day circular border if zoomed in AND it's the current rest day,
        // OR if zoomed out AND it's selected (for Day 0 or Rest Days)
        const isSelectedPoint = properties.day === currentDay;
        const shouldShowBorder = isZoomedIn ? isSelectedPoint : isSelectedPoint;

        if (!shouldShowBorder) {
          return;
        }

        const pointLatlng = [geometry.coordinates[1], geometry.coordinates[0]];
        const elevation = geometry.coordinates[2];
        const color = getColorForElevation(elevation);

        polylines.push(
          <Marker
            key={"rest-day-" + properties.day + "-" + featIdx}
            position={pointLatlng}
            interactive={properties.day !== "20"}
            icon={L.divIcon({
              className: "rest-day-border-only",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              html: `<div class="rest-day-circle" style="border-color: ${color};">
                      ${
                        properties.day === "0" || properties.day === "20"
                          ? `<img src="${airportIcon}" style="width: 14px; height: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />`
                          : `<img src="${tentIcon}" style="width: 14px; height: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />`
                      }
                     </div>`,
              shadowUrl: null,
            })}
            onmouseover={() => {
              if (properties.day !== "20") {
                dispatchLayerDetails(properties);
              }
            }}
            onclick={() => {
              if (properties.day !== "20") {
                dispatchLayerDetails(properties);
                // Zoom to the point
                const offset = 0.005;
                const bounds = L.latLngBounds(
                  [pointLatlng[0] - offset, pointLatlng[1] - offset],
                  [pointLatlng[0] + offset, pointLatlng[1] + offset],
                );
                map.flyToBounds(bounds, {
                  paddingTopLeft: effectivePaddingTopLeft,
                  paddingBottomRight: effectivePaddingBottomRight,
                  duration: zoomDuration,
                });
              }
            }}
          />,
        );
        return;
      }

      if (geometry.type !== "MultiLineString" || !segments) {
        return;
      }

      // When zoomed in, only show the currently highlighted route
      if (isZoomedIn && properties.day !== currentDay) {
        return;
      }

      const clickHandler = () => {
        if (properties.day === "20") return;
        dispatchLayerDetails(properties);
        setSingleDayView(true); // Switch to Single Day View on selection

        // Use pre-calculated bounds or calculate on the fly
        let bounds;
        const stored = preCalculatedBounds[properties.day];
        if (stored) {
          const boundData = isDesktop ? stored.desktop : stored.mobile;
          bounds = L.latLngBounds(boundData[0], boundData[1]);
        } else {
          const allLatlngs = geometry.coordinates.flatMap((line) =>
            line.map((coord) => [coord[1], coord[0]]),
          );
          if (allLatlngs.length > 0) {
            bounds = L.latLngBounds(allLatlngs);
          }
        }

        if (bounds) {
          map.flyToBounds(bounds, {
            paddingTopLeft: effectivePaddingTopLeft,
            paddingBottomRight: effectivePaddingBottomRight,
            duration: zoomDuration,
          });
        }
      };

      // Render gradient segments (visible part)
      segments.forEach((segment, segIdx) => {
        // Highlighting logic detection
        const isHighlighted =
          !isZoomedIn &&
          properties.day === currentDay &&
          currentDay !== "0" &&
          !isCurrentDayRestDay;

        // Base weight for non-zoomed view
        let weight = 2.5;

        // If zoomed in, make it much thicker
        if (isZoomedIn) {
          weight = 6;
        }

        // Apply 20% increase for desktop default lines
        if (isDesktop) {
          weight *= 1.2;
        }

        if (isHighlighted) {
          // Bottom Layer: Thick Colored path - provides the main visibility
          polylines.push(
            <Polyline
              key={day + "-" + featIdx + "-" + segIdx + "-base"}
              positions={segment.latlngs}
              color={segment.color}
              weight={isDesktop ? 8 : 7}
              opacity={1}
              lineCap="round"
              lineJoin="round"
              smoothFactor={2}
              interactive={false} // Interactive handled by tap-target
              className="route-highlight-main"
            />,
          );

          // Top Layer: Thin White Core - creates a "tube" effect for high contrast on all maps
          polylines.push(
            <Polyline
              key={day + "-" + featIdx + "-" + segIdx + "-core"}
              positions={segment.latlngs}
              color="white"
              weight={isDesktop ? 2.5 : 2}
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
              smoothFactor={2}
              interactive={false}
            />,
          );
        } else {
          // Standard/Dimmed Route - Lower opacity to push them to background
          polylines.push(
            <Polyline
              key={day + "-" + featIdx + "-" + segIdx}
              positions={segment.latlngs}
              color={segment.color}
              weight={weight}
              opacity={isZoomedIn ? 1.0 : 0.8}
              lineCap="round"
              lineJoin="round"
              smoothFactor={isZoomedIn ? 0 : 3}
              interactive={false} // Interactive handled by tap-target
              className="non-highlighted-route"
            />,
          );
        }
      });

      // Prepare invisible wider Polyline for easier clicking/tapping
      // We collect these separately to render them on top of all visible segments
      tapTargets.push(
        <Polyline
          key={"tap-target-" + day + "-" + featIdx}
          positions={geometry.coordinates.flatMap((line) =>
            line.map((coord) => [coord[1], coord[0]]),
          )}
          color="transparent"
          weight={isDesktop ? 25 : 35} // Wider target on mobile
          opacity={0}
          interactive={properties.day !== "20"}
          onmouseover={() => {
            if (properties.day !== "20") {
              dispatchLayerDetails(properties);
            }
          }}
          onclick={clickHandler}
          style={{ cursor: "pointer" }}
        />,
      );
    });
  });

  return [...polylines, ...tapTargets];
};

const mapStateToProps = (state) => ({
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  currentDay: state.route.day,
  zoom: state.mapState.zoom,
  derivedZoom: state.mapState.zoom, // Will be overridden by MapContainer
  isSingleDayView: state.mapState.isSingleDayView,
  showLegend: state.mapState.showLegend,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLeaflet(GeoJsonRoutes));
