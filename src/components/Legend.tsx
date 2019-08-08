import { MapControl, withLeaflet } from "react-leaflet";
import * as L from "leaflet";
import { getLegendHtml } from "../utils/data";

class Legend extends MapControl {
  // @ts-ignore
  public createLeafletElement(props: any) {}

  public addLegend = () => {
    // @ts-ignore
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function() {
      this._div = L.DomUtil.create("div", "legend");
      this._div.innerHTML = getLegendHtml();
      return this._div;
    };

    // @ts-ignore
    const { map } = this.props.leaflet;
    legend.addTo(map);
  };

  componentDidMount() {
    this.addLegend();
  }

  render() {
    return null;
  }
}

export default withLeaflet(Legend);
