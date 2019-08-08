import { MapControl, withLeaflet } from "react-leaflet";
import { connect } from "react-redux";
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

const mapStateToProps = (state: any) => ({
  zoom: state.mapState.zoom,
  center: state.mapState.center
});

export default connect(mapStateToProps)(withLeaflet(Reset));
