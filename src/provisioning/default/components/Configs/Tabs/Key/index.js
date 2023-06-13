import React, { Component } from "react";
import { connect } from "react-redux";

import {
  fetchGetApplications,
  fetchGetKeysByApplication,
  fetchGetValueOfKey,
  fetchPutUpdateKey,
  fetchDeleteKey,
} from "../../../../store/actions";

import FormControl from "react-bootstrap/lib/FormControl";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Button from "react-bootstrap/lib/Button";
import Loading from "../../../../common/Loading";

import AddKeyForm from "./AddKeyForm";

export class KeyTab extends Component {
  state = {
    isLoading: true,
    selectedApplication: "none",
    applications: [],
    applicationKeys: [],
    selectedKey: "none",
    keyValue: null,
    data: "",
  };
  componentDidMount() {
    this.props.fetchGetApplications().then(() =>
      this.setState({
        isLoading: false,
        applications: this.props.applications,
      })
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.applicationKeys.length !== this.props.applicationKeys.length
    ) {
      this.props
        .fetchGetKeysByApplication(this.state.selectedApplication)
        .then(() =>
          this.setState({ applicationKeys: this.props.applicationKeys })
        );
    }
    if (prevState.selectedKey !== this.state.selectedKey) {
      this.setState({ keyValue: null });
    }
    if (prevState.selectedApplication !== this.state.selectedApplication) {
      this.setState({ applicationKeys: [] });
    }
  }
  render() {
    if (this.state.isLoading) {
      return <Loading />;
    }
    return (
      <React.Fragment>
        <Row className={"margin-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Application name:
            </div>
            <div>
              <FormControl
                componentClass="select"
                value={this.state.selectedApplication}
                onChange={(e) =>
                  this.setState(
                    { selectedApplication: e.target.value },
                    () =>
                      this.state.selectedApplication !== "none" &&
                      this.props
                        .fetchGetKeysByApplication(
                          this.state.selectedApplication
                        )
                        .then(() =>
                          this.setState({
                            applicationKeys: this.props.applicationKeys,
                            selectedKey: "none",
                            data: "",
                          })
                        )
                  )
                }
              >
                <option key={"none"} value={"none"}>
                  {"none"}
                </option>
                {this.state.applications.map((app) => (
                  <option key={app.applicationId} value={app.applicationId}>
                    {app.applicationId}
                  </option>
                ))}
              </FormControl>
            </div>
          </Col>
        </Row>
        {this.state.selectedApplication !== "none" &&
          !!this.state.applicationKeys.length && (
            <React.Fragment>
              <Row className={"margin-1"}>
                <Col md={12} className={"flex align-items-center"}>
                  <div className={"margin-right-1 flex flex-basis-33"}>
                    Key:
                  </div>
                  <div>
                    <FormControl
                      componentClass="select"
                      value={this.state.selectedKey}
                      onChange={(e) =>
                        this.setState({ selectedKey: e.target.value }, () =>
                          this.setKeyCallback()
                        )
                      }
                    >
                      {this.state.selectedKey === "none" && (
                        <option key={"none"} value={"none"}>
                          {"none"}
                        </option>
                      )}
                      {this.state.applicationKeys.map((key) => (
                        <option key={key.key} value={key.key}>
                          {key.key}
                        </option>
                      ))}
                    </FormControl>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="button-row">
                    <div className="pull-left">
                      <Button
                        className={"btn-primary"}
                        onClick={() => this.setState({ showModal: true })}
                        disabled={this.state.selectedApplication === "none"}
                      >
                        Add Key
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              {this.state.keyValue && (
                <React.Fragment>
                  <Row className={"margin-1"}>
                    <Col md={12} className={"flex align-items-center"}>
                      <div className={"margin-right-1 flex flex-basis-33"}>
                        Data
                      </div>
                      <div className={"flex flex-basis-66"}>
                        <FormControl
                          componentClass="textarea"
                          className={"height-30"}
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
                  <Row>
                    <Col md={12}>
                      <div className="button-row">
                        <div className="pull-left">
                          <Button
                            className={"btn-danger"}
                            onClick={() => this.onDelete()}
                          >
                            DELETE
                          </Button>
                        </div>
                        <div className="pull-right">
                          <Button
                            className={"btn-primary"}
                            onClick={() =>
                              this.props.fetchPutUpdateKey(
                                this.state.selectedApplication,
                                this.state.selectedKey,
                                { data: this.state.data }
                              )
                            }
                          >
                            UPDATE
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        {this.state.selectedApplication === "none" && (
          <Row>
            <Col md={12}>
              <div className="button-row">
                <div className="pull-left">
                  <Button
                    className={"btn-primary"}
                    onClick={() => this.setState({ showModal: true })}
                  >
                    {"Add Application & Key"}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        )}
        {this.state.showModal && (
          <AddKeyForm
            show={this.state.showModal}
            title={
              this.state.selectedApplication === "none"
                ? "Add Application & Key"
                : "Add Key Form"
            }
            application={this.state.selectedApplication}
            onClose={() => this.setState({ showModal: false })}
            onAdd={this.onAdd}
          />
        )}
      </React.Fragment>
    );
  }

  setKeyCallback = () => {
    this.props
      .fetchGetValueOfKey(
        this.state.selectedApplication,
        this.state.selectedKey
      )
      .then(() =>
        this.setState({
          keyValue: this.props.keyValue,
          data: this.props.keyValue.data,
        })
      );
  };

  onAdd = (appName) => {
    if (this.state.selectedApplication === "none") {
      this.props.fetchGetApplications().then(() =>
        this.setState(
          {
            isLoading: false,
            applications: this.props.applications,
            selectedApplication: appName,
          },
          () => {
            this.props.fetchGetKeysByApplication(appName).then(() =>
              this.setState(
                {
                  applicationKeys: this.props.applicationKeys,
                  selectedKey: this.props.applicationKeys[0].key,
                },
                () => this.setKeyCallback()
              )
            );
          }
        )
      );
    }
    this.setState({ showModal: false }, () =>
      this.props.fetchGetKeysByApplication(appName).then(() =>
        this.setState({
          selectedApplication: appName,
          applicationKeys: this.props.applicationKeys,
        })
      )
    );
  };

  onDelete = () => {
    this.props
      .fetchDeleteKey(this.state.selectedApplication, this.state.selectedKey)
      .then(
        (res) =>
          res === "deleted" &&
          this.setState(
            {
              selectedKey: "none",
              selectedApplication:
                this.props.applicationKeys.length === 1
                  ? "none"
                  : this.state.selectedApplication,
              keyValue: null,
            },
            () =>
              this.props.applicationKeys.length > 1 &&
              this.props.fetchGetKeysByApplication(
                this.state.selectedApplication
              )
          )
      );
  };
}

const mapStateToProps = (state) => ({
  applications: state.applications,
  applicationKeys: state.applicationKeys,
  keyValue: state.keyValue,
});

const mapDispatchToProps = {
  fetchGetApplications,
  fetchGetKeysByApplication,
  fetchGetValueOfKey,
  fetchPutUpdateKey,
  fetchDeleteKey,
};

export default connect(mapStateToProps, mapDispatchToProps)(KeyTab);
