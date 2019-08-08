import { MapControl, withLeaflet } from "react-leaflet";
import * as L from "leaflet";
import { getDashboardHtml } from "../utils/data";
import { connect } from "react-redux";
// import { IDay } from "../interfaces/interfaces";

// interface IProps {
//   day: IDay;
// }

// interface IState {
//   dashboard: any;
// }

class Dashboard extends MapControl<any, any> {
  // @ts-ignore
  public createLeafletElement(props: any) {
    this.state = { dashboard: null };
  }

  public addDashboard() {
    const that = this;

    // @ts-ignore
    const dashboard = L.control({ position: "topright" });

    dashboard.onAdd = function() {
      this._div = L.DomUtil.create("div", "dashboard");
      this.update(that.props);
      return this._div;
    };

    dashboard.update = function(day: any) {
      this._div.innerHTML = getDashboardHtml(day);
    };

    // @ts-ignore
    const { map } = this.props.leaflet;
    dashboard.addTo(map);
    this.setState({ dashboard });
  }

  componentDidMount() {
    this.addDashboard();
  }

  render() {
    // @ts-ignore
    if (this.state.dashboard) {
      // @ts-ignore
      this.state.dashboard.update(this.props);
    }
    return null;
  }
}

const mapStateToProps = (state: any) => ({
  day: state.route.day,
  name: state.route.name,
  time: state.route.time,
  end_alt: state.route.end_alt,
  distance: state.route.distance,
  peak_alt: state.route.peak_alt,
  start_alt: state.route.start_alt
});

export default connect(mapStateToProps)(withLeaflet(Dashboard));
