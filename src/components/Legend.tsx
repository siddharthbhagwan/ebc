import React from "react";
import * as L from "leaflet";
import { getLegendHtml } from "../utils/data";

class Legend extends React.Component<any, any> {
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

    legend.addTo(this.props.mapHandle.leafletElement);
  };

  componentDidMount() {
    this.addLegend();
  }

  render() {
    return null;
  }
}

export default Legend;
