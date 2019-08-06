import React from "react";
import * as L from "leaflet";
import { getDashboardHtml } from "../utils/data";
import { IDay } from "../interfaces/interfaces";

interface IProps {
  mapHandle: any;
  day: IDay;
}

interface IState {
  dashboard: any;
}

class Dashboard extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = { dashboard: null };
    this.addDashboard = this.addDashboard.bind(this);
  }

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

    dashboard.addTo(this.props.mapHandle.current.leafletElement);
    this.setState({ dashboard });
  }

  componentDidMount() {
    this.addDashboard();
  }

  render() {
    if (this.state.dashboard) {
      this.state.dashboard.update(this.props.day);
    }
    return null;
  }
}

export default Dashboard;
