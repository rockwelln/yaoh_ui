import React from "react";

import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

import Sidebar from "../../common/Sidebar";
import Title from "../../common/Title";

import Resellers from "./Resellers";

const ResellersPage = () => {
  return (
    <>
      <Row className={"margin-bottom-4"}>
        <Title />
      </Row>
      <Row>
        <Col md={2}>
          <Sidebar />
        </Col>
        <Col md={10} className={"padding-left-3 padding-right-3"}>
          <Row className={"panel panel-default"}>
            <Resellers />
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default ResellersPage;
