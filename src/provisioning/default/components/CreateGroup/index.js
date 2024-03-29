import React, { Component } from "react";
import { connect } from "react-redux";

import Basic from "./Basic";
import Template from "./Template";
import Limits from "./Limits";
import Admin from "./Admin";
import Created from "./Created";

import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

import Breadcrumb from "../../common/Breadcrumb";
import Sidebar from "../../common/Sidebar";
import Title from "../../common/Title";

export class CreateGroup extends Component {
  render() {
    return (
      <React.Fragment>
        <Row className={"margin-bottom-4"}>
          <Title />
        </Row>
        <Row>
          <Col md={2}>
            <Sidebar />
          </Col>
          <Col md={10} className={"padding-left-3"}>
            <Row>
              <Breadcrumb />
            </Row>
            <div className={"panel panel-default"}>{this.returnStep()}</div>
          </Col>
        </Row>
      </React.Fragment>
    );
  }

  returnStep = () => {
    switch (this.props.createGroupStep) {
      case "Basic": {
        return <Basic />;
      }
      case "Template": {
        return <Template />;
      }
      case "Created": {
        return <Created />;
      }
      case "Limits": {
        return <Limits />;
      }
      case "Admin": {
        return <Admin />;
      }
      default:
        return <Basic />;
    }
  };
}

const mapStateToProps = state => ({
  createGroupStep: state.createGroupStep
});

export default connect(
  mapStateToProps,
  null
)(CreateGroup);
