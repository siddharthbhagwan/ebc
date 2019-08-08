import { MapControl, withLeaflet } from "react-leaflet";
import * as L from "leaflet";
import resetIcon from "../resources/images/map.svg";
import "leaflet-easybutton";

// interface IProps {
//   mapHandle: any;
//   center: [number, number];
//   zoom: number;
// }

class Reset extends MapControl<any> {
  // @ts-ignore
  public createLeafletElement(props: any) {}

  public addResetButton = () => {
    const that = this;
    const resetbutton = L.easyButton(
      `<img src="${resetIcon}" width="15px">`,
      function(btn, map) {
        map.flyTo(that.props.center, that.props.zoom, {
          duration: 0.5
        });
      }
    );

    const { map } = this.props.leaflet;
    resetbutton.addTo(map);
  };

  componentDidMount() {
    this.addResetButton();
  }

  render() {
    return null;
  }
}

export default withLeaflet(Reset);
