import React from "react";
import { Map, TileLayer } from "react-leaflet";
import { connect } from "react-redux";
import Dashboard from "./Dashboard";
import GeoJsonRoutes from "./GeoJsonRoutes";
import Legend from "./Legend";
import POI from "./POI";
import PolylineRoutes from "./PolylineRoutes";
import Reset from "./Reset";

class MapContainer extends React.Component<any> {
  public constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <Map
        center={this.props.center}
        zoomSnap={this.props.zoomSnap}
        zoom={this.props.zoom}
        style={this.props.style}
      >
        <TileLayer url={this.props.url} attribution={this.props.attribution} />
        <Reset />
        <POI />
        <Legend />
        <Dashboard />
        <GeoJsonRoutes />
        <PolylineRoutes />
      </Map>
    );
  }
}

const mapStateToProps = (state: any) => ({
  url: state.mapState.url,
  zoom: state.mapState.zoom,
  style: state.mapState.style,
  center: state.mapState.center,
  zoomSnap: state.mapState.zoomSnap,
  hoverColor: state.mapState.hoverColor,
  markerZoom: state.mapState.markerZoom,
  attribution: state.mapState.attribution,
  zoomDuration: state.mapState.zoomDuration,
  topLeftPadding: state.mapState.topLeftPadding,
  bottomRightPadding: state.mapState.bottomRightPadding
});

export default connect(mapStateToProps)(MapContainer);
