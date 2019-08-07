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
            <Row className={"panel panel-default"}>{this.returnStep()}</Row>
          </Col>
        </Row>
      </React.Fragment>
    );
  }

  returnStep = () => {
    switch (this.props.createGroupStep) {
      case "Basic": {
        return <Basic auth_token={this.props.auth_token} />;
      }
      case "Template": {
        return <Template auth_token={this.props.auth_token} />;
      }
      case "Created": {
        return <Created auth_token={this.props.auth_token} />;
      }
      case "Limits": {
        return <Limits auth_token={this.props.auth_token} />;
      }
      case "Admin": {
        return <Admin auth_token={this.props.auth_token} />;
      }
      default:
        return <Basic auth_token={this.props.auth_token} />;
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
