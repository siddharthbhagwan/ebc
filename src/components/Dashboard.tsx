import { MapControl, withLeaflet } from "react-leaflet";
import * as L from "leaflet";
import { getDashboardHtml } from "../utils/data";
// import { IDay } from "../interfaces/interfaces";

// interface IProps {
//   day: IDay;
// }

// interface IState {
//   dashboard: any;
// }

class Dashboard extends MapControl<any> {
  // @ts-ignore
  public createLeafletElement(props: any) {}

  public addDashboard() {
    const that = this;

    // @ts-ignore
    const dashboard = L.control({ position: "topright" });

    dashboard.onAdd = function() {
      this._div = L.DomUtil.create("div", "dashboard");
      this.update(that.props.day);
      return this._div;
    };

    dashboard.update = function(day: any) {
      this._div.innerHTML = getDashboardHtml(day);
    };

    // @ts-ignore
    const { map } = this.props.leaflet;
    dashboard.addTo(map);
    // this.setState({ dashboard });
  }

  componentDidMount() {
    this.addDashboard();
  }

  render() {
    // if (this.state.dashboard) {
    //   this.state.dashboard.update(this.props.day);
    // }
    return null;
  }
}

export default withLeaflet(Dashboard);
