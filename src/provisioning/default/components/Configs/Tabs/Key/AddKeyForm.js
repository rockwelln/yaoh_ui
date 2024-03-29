import React, { Component } from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";

import Modal from "react-bootstrap/lib/Modal";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";

import { fetchPostAddKeyToApplication } from "../../../../store/actions";

export class AddKeyForm extends Component {
  state = {
    key: "",
    data: "",
    application: "",
  };

  render() {
    const disabledAddButton =
      this.props.application === "none"
        ? !this.state.application || !this.state.key || !this.state.data
        : !this.state.key || !this.state.data;

    return (
      <Modal show={this.props.show}>
        <Panel className={"margin-0"}>
          <Panel.Heading>
            <div className={"header"}>
              {this.props.title}
              <Button
                className={"margin-left-1 btn-danger"}
                onClick={() => this.props.onClose()}
              >
                Cancel
              </Button>
            </div>
          </Panel.Heading>
          <Panel.Body>
            {this.props.application === "none" && (
              <Row className={"margin-top-1"}>
                <Col md={12} className={"flex align-items-center"}>
                  <div className={"margin-right-1 flex flex-basis-33"}>
                    Application
                  </div>
                  <div className={"width-100p"}>
                    <FormControl
                      type="text"
                      value={this.state.application}
                      onChange={(e) => {
                        this.setState({
                          application: e.target.value,
                        });
                      }}
                    />
                  </div>
                </Col>
              </Row>
            )}
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-33"}>Key</div>
                <div className={"width-100p"}>
                  <FormControl
                    type="text"
                    value={this.state.key}
                    onChange={(e) => {
                      this.setState({
                        key: e.target.value,
                      });
                    }}
                  />
                </div>
              </Col>
            </Row>
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-33"}>Data</div>
                <div className={"width-100p"}>
                  <FormControl
                    componentClass="textarea"
                    value={this.state.data}
                    onChange={(e) => {
                      this.setState({
                        data: e.target.value,
                      });
                    }}
                  />
                </div>
              </Col>
            </Row>
            <Row className={"margin-top-1"}>
              <Col md={12}>
                <div className="button-row">
                  <div className="pull-right">
                    <Button
                      disabled={disabledAddButton}
                      className={"btn-primary width-12"}
                      onClick={this.addKey}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Panel.Body>
        </Panel>
      </Modal>
    );
  }

  addKey = () => {
    const data = {
      key: this.state.key,
      data: this.state.data,
    };
    const application =
      this.props.application === "none"
        ? this.state.application
        : this.props.application;
    this.props
      .fetchPostAddKeyToApplication(application, data)
      .then((res) => res && this.props.onAdd(application));
  };
}

const mapStateToProps = (state) => ({});

const mapDispatchToProps = { fetchPostAddKeyToApplication };

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AddKeyForm)
);
