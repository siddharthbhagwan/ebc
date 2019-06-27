import React from "react";

class Details extends React.Component {
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
        <div className="col-md-4">Details</div>
        <div className="col-md-4">Details</div>
        <div className="col-md-4">Details</div>
      </div>
    );
  }
}

export default Details;
