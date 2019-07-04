import React from "react";
import { connect } from "react-redux";

class Details extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div
        style={{
          border: "1px solid #dadada",
          borderRadius: "5px",
          paddingTop: "20px",
          paddingBottom: "20px",
          fontSize: "24px"
        }}
        className="row"
      >
        <div className="col-md-4">
          Day {this.props.day}
          <br />
          <span style={{ fontSize: "17px" }}>{this.props.name}</span>
        </div>
        <div className="col-md-4">
          {this.props.distance}
          <br />
          {this.props.time}
        </div>
        <div className="col-md-4">
          {this.props.start_alt} <span style={{ fontSize: "17px" }}>ft -</span>{" "}
          {this.props.end_alt} <span style={{ fontSize: "17px" }}>ft</span>
          <br />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => ({
  day: state.details.day,
  name: state.details.name,
  time: state.details.time,
  end_alt: state.details.end_alt,
  distance: state.details.distance,
  start_alt: state.details.start_alt
});

export default connect(mapStateToProps)(Details);
