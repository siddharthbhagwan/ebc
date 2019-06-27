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
          paddingBottom: "20px"
        }}
        className="row"
      >
        <div className="col-md-4">Day {this.props.day}</div>
        <div className="col-md-4">Details</div>
        <div className="col-md-4">Details</div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => ({
  day: state.details.day
});

export default connect(mapStateToProps)(Details);
