import React from "react";

import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

import Sidebar from "../../common/Sidebar";
import Title from "../../common/Title";
import Breadcrumb from "../../common/Breadcrumb";

import CategoryPage from "./CategoryPage";

const CategoryComponent = props => {
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
          <Row>
            <Breadcrumb />
          </Row>
          <div className={"panel panel-default"}>
            <CategoryPage />
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default CategoryComponent;
