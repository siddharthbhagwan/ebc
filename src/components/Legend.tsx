import React from "react";
import * as L from "leaflet";
import { getLegendHtml } from "../utils/data";

interface IProps {
  mapHandle: any;
}

class Legend extends React.Component<IProps> {
  constructor(props: any) {
    super(props);
    this.addLegend = this.addLegend.bind(this);
  }

  public addLegend = () => {
    // @ts-ignore
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function() {
      this._div = L.DomUtil.create("div", "legend");
      this._div.innerHTML = getLegendHtml();
      return this._div;
    };

    legend.addTo(this.props.mapHandle.current.leafletElement);
  };

  componentDidMount() {
    this.addLegend();
  }

  render() {
    return null;
  }
}

export default Legend;
