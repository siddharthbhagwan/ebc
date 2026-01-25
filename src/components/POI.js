import React from "react";
import * as L from "leaflet";
import { connect } from "react-redux";
import { isDesktop } from "react-device-detect";
import "../resources/css/dashboard.css";
import { getMarkers } from "../utils/markers";
import { getDayWiseDataG } from "../utils/geoJson";
import { mapDispatchToProps } from "../utils/utils";
import { Marker, withLeaflet, Tooltip } from "react-leaflet";

import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";
import airportIcon from "../resources/images/airport.svg";
import { getColorForElevation } from "../utils/heightGradient";

const POI = (props) => {
  const { map } = props.leaflet;
  const {
    markerZoom,
    paddingTopLeft,
    paddingBottomRight,
    dispatchLayerDetails,
    unit,
    currentDay,
    isSingleDayView,
    setSingleDayView,
  } = props;

  const isZoomedIn = isSingleDayView;

  // Format altitude based on unit
  const formatAltitude = (altFt) => {
    if (!altFt) return "";
    const numericAlt = parseInt(altFt.replace(/,/g, ""), 10);
    if (unit === "km") {
      // Convert feet to meters
      const meters = Math.round(numericAlt * 0.3048);
      return `${meters.toLocaleString()} m`;
    } else {
      // Keep as feet
      return `${numericAlt.toLocaleString()} ft`;
    }
  };

  const addPOIs = () => {
    const markerData = getMarkers();
    const routesData = getDayWiseDataG();
    const currentRoute = routesData[currentDay];
    const isCurrentDayRestDay =
      currentRoute &&
      currentRoute.features &&
      currentRoute.features[0] &&
      currentRoute.features[0].properties.time === "Rest Day";

    // Determine destination coordinate of current day to identify "end of day" house
    const getDestinationCoord = (route) => {
      if (!route || !route.features || !route.features.length) return null;
      // Get the last feature in the collection to ensure we find the actual daily destination
      const feature = route.features[route.features.length - 1];
      const coords = feature.geometry.coordinates;
      if (feature.geometry.type === "MultiLineString") {
        const lastLine = coords[coords.length - 1];
        return lastLine[lastLine.length - 1];
      } else if (feature.geometry.type === "Point") {
        return coords;
      } else {
        return coords[coords.length - 1];
      }
    };

    const destCoord = getDestinationCoord(currentRoute);

    const arr = [];
    markerData.forEach((markerPoint) => {
      const isHouse = markerPoint.icon === tentIcon;
      const isEBC = markerPoint.icon === ebcIcon;
      const isAirport = markerPoint.icon === airportIcon;
      const isPass = markerPoint.icon === passIcon;
      const isSummit = markerPoint.icon === summitIcon;

      // Check if this marker is at the destination coordinate
      // Increased threshold to 0.0015 to account for slight GPS/marker mismatches (e.g. Gorak Shep)
      const isDest =
        destCoord &&
        Math.abs(markerPoint.point[0] - destCoord[1]) < 0.0015 &&
        Math.abs(markerPoint.point[1] - destCoord[0]) < 0.0015;

      // Check if this marker matches the current day
      const isDayMatch = markerPoint.properties.day
        .split(/[,&]/)
        .map((d) => d.trim())
        .includes(currentDay);

      // Filter out markers that aren't relevant to the current day when zoomed in
      if (isZoomedIn && !isDayMatch && !isDest) {
        return;
      }

      // On acclimatization days (Rest Days), only show the circled house
      if (isZoomedIn && isCurrentDayRestDay) {
        if (!isDayMatch || !isHouse) {
          return;
        }
      }

      // Determine circle logic:
      // 1. In Overview (!isSingleDayView), circle all Houses and Airports.
      // 2. In Single Day View, circle ONLY the Destination POI (including rest day houses).
      const shouldCircle = !isSingleDayView ? isHouse || isAirport : isDest;

      // Altitude-based border color
      const altFt = parseInt(
        (markerPoint.properties.startAlt || "0").replace(/,/g, ""),
        10,
      );
      const altM = altFt * 0.3048;
      const borderColor = getColorForElevation(altM);

      let icon;
      if (shouldCircle) {
        // Destination Circle Wrapper
        const wrapSize = isHouse
          ? 20
          : isAirport
            ? 22
            : markerPoint.size[0] + 6;
        const imgSize = isHouse ? 11 : isAirport ? 15 : markerPoint.size[0];

        let imgClass = "";
        if (isEBC) imgClass = "ebc-marker-icon";
        if (isPass) imgClass = "flag-marker-icon";
        if (isSummit) imgClass = "summit-marker-icon";

        let imgStyle = `width: ${imgSize}px; height: ${imgSize}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
        if (isSummit) {
          imgStyle = `width: ${imgSize * 0.9}px; height: ${imgSize * 0.9}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
        }

        icon = L.divIcon({
          className: "dest-circle-wrapper",
          iconSize: [wrapSize, wrapSize],
          iconAnchor: [wrapSize / 2, wrapSize / 2],
          html: `<div class="rest-day-circle" style="border-color: ${borderColor}; border-width: 1.5px; width: 100%; height: 100%;">
                  <img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />
                 </div>`,
          shadowUrl: null,
        });
      } else {
        // Standard icons WITHOUT circles
        let imgClass = "";
        if (isEBC) imgClass = "ebc-marker-icon";
        if (isPass) imgClass = "flag-marker-icon";
        if (isSummit) imgClass = "summit-marker-icon";

        let imgStyle = "width: 100%; height: 100%;";
        if (isSummit) {
          imgStyle = "width: 90%; height: 90%; margin: 5%;";
        }

        icon = L.divIcon({
          className: "standard-poi-wrapper",
          iconSize: markerPoint.size,
          iconAnchor: [markerPoint.size[0] / 2, markerPoint.size[1] / 2],
          html: `<img src="${markerPoint.icon}" class="${imgClass}" style="${imgStyle}" />`,
          shadowUrl: null,
        });
      }

      // Tooltip visibility: Only permanent if it belongs to the current day or is the destination
      // This prevents the map from becoming unreadable while still showing all markers
      const isTooltipPermanent = isDayMatch || isDest;

      arr.push(
        <Marker
          position={markerPoint.point}
          style={markerPoint.properties}
          key={markerPoint.point.toString() + markerPoint.properties.day}
          onclick={clickHandler}
          onmouseover={mouseoverHandler}
          icon={icon}
          properties={markerPoint.properties}
        >
          {isTooltipPermanent && (
            <Tooltip
              permanent={true}
              className={"tooltipLabel"}
              direction={markerPoint.properties.direction}
            >
              <div style={{ fontSize: isZoomedIn ? "14px" : "11px" }}>
                <div style={{ fontWeight: isZoomedIn ? "600" : "normal" }}>
                  {markerPoint.properties.name}
                </div>
                {isZoomedIn && markerPoint.properties.startAlt && (
                  <div
                    style={{
                      fontSize: "0.9em",
                      opacity: 0.8,
                      marginTop: "2px",
                    }}
                  >
                    {formatAltitude(markerPoint.properties.startAlt)}
                  </div>
                )}
              </div>
            </Tooltip>
          )}
        </Marker>,
      );
    });
    return arr;
  };

  const clickHandler = (e) => {
    dispatchLayerDetails(e.target.options.properties);
    setSingleDayView(true); // Switch to Single Day View on selection

    const effectivePaddingTopLeft = [
      paddingTopLeft[0],
      isDesktop ? paddingTopLeft[1] + 30 : paddingTopLeft[1] + 60,
    ];
    const effectivePaddingBottomRight = isDesktop
      ? [paddingBottomRight[0] + 525, paddingBottomRight[1] + 160]
      : [paddingBottomRight[0], paddingBottomRight[1] + 130];

    map.flyToBounds(L.latLngBounds(e.latlng, e.latlng), {
      paddingTopLeft: effectivePaddingTopLeft,
      paddingBottomRight: effectivePaddingBottomRight,
      maxZoom: markerZoom,
      duration: props.zoomDuration,
    });
  };

  const mouseoverHandler = (e) =>
    dispatchLayerDetails(e.target.options.properties);

  return addPOIs();
};

const mapStateToProps = (state) => ({
  markerZoom: state.mapState.markerZoom,
  zoomDuration: state.mapState.zoomDuration,
  paddingTopLeft: state.mapState.paddingTopLeft,
  paddingBottomRight: state.mapState.paddingBottomRight,
  zoom: state.mapState.zoom,
  unit: state.mapState.unit,
  currentDay: state.route.day,
  isSingleDayView: state.mapState.isSingleDayView,
});

export default connect(mapStateToProps, mapDispatchToProps)(withLeaflet(POI));
