import React from "react";

import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

import Sidebar from "../../common/Sidebar";
import AddPhoneNumber from "./AddPhoneNumber";
import Title from "../../common/Title";

const AddPhoneNumberComponent = props => {
  return (
    <React.Fragment>
      <Row className={"margin-bottom-4"}>
        <Title />
      </Row>
      <Row>
        <Col md={2}>
          <Sidebar />
        </Col>
        <Col md={10} className={"padding-left-3 padding-right-3"}>
          <div className={"panel panel-default"}>
            <AddPhoneNumber />
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default AddPhoneNumberComponent;
