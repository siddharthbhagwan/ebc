import React from "react";
import * as L from "leaflet";
import resetIcon from "../resources/images/map.svg";
import "leaflet-easybutton";

class Reset extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.addResetButton = this.addResetButton.bind(this);
  }

  public addResetButton = () => {
    const that = this;
    L.easyButton(`<img src="${resetIcon}" width="15px">`, function(btn, map) {
      map.flyTo(that.props.center, that.props.zoom, {
        duration: 0.5
      });
    }).addTo(this.props.mapHandle.current.leafletElement);
  };

  componentDidMount() {
    this.addResetButton();
  }

  render() {
    return null;
  }
}

export default Reset;
