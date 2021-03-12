import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Checkbox from "react-bootstrap/lib/Checkbox";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import {
  fetchPutUpdateTrunkGroup,
  fetchGetSelfcareURL,
  fetchGetTrunkGroupAccessInfo,
  fetchPutUpdateTrunkGroupAccessInfo,
} from "../../../../store/actions";

import { removeEmpty } from "../../../remuveEmptyInObject";
import DevicePage from "../../../DevicePage";
import Loading from "../../../../common/Loading";

export class Authentication extends Component {
  state = {
    requireAuthentication: false,
    sipAuthenticationUserName: null,
    sipAuthenticationPassword: null,
    accessDevice: null,
    disableButton: false,
    validatePassword: "",
    passwordsNotMatch: false,
    isLoadingConfig: true,
    access_data: [],
    isLoadingAccessInfo: true,
  };

  componentDidMount() {
    this.props
      .fetchGetSelfcareURL()
      .then(() =>
        this.setState({ isLoadingConfig: false, ...this.props.trunkingConfig })
      );
    this.props
      .fetchGetTrunkGroupAccessInfo(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        this.props.match.params.trunkGroupName
      )
      .then(() => this.setState({ isLoadingAccessInfo: false }));
    this.setState({
      requireAuthentication: this.props.trunkGroup.requireAuthentication
        ? this.props.trunkGroup.requireAuthentication
        : false,
      sipAuthenticationUserName: this.props.trunkGroup.sipAuthenticationUserName
        ? this.props.trunkGroup.sipAuthenticationUserName
        : "",
      sipAuthenticationPassword: this.props.trunkGroup.sipAuthenticationPassword
        ? this.props.trunkGroup.sipAuthenticationPassword
        : "",
      accessDevice: this.props.trunkGroup.accessDevice
        ? this.props.trunkGroup.accessDevice.name
        : "",
    });
  }

  render() {
    console.log(this.state);

    if (this.state.isLoadingConfig || this.state.isLoadingAccessInfo) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <Row className={"margin-top-1"}>
          <Col md={12}>
            <div className={"font-weight-bold font-16 licenses-th width-66p"}>
              Authentication
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1 margin-left-1"}>
          <Col md={12}>
            <Checkbox
              className={"margin-0"}
              checked={this.state.requireAuthentication}
              onChange={(e) => {
                if (e.target.checked) {
                  this.setState({ requireAuthentication: e.target.checked });
                } else {
                  this.setState({
                    requireAuthentication: e.target.checked,
                    sipAuthenticationUserName: "",
                    sipAuthenticationPassword: "",
                    passwordsNotMatch: false,
                  });
                }
              }}
            >
              PBX must register using the pilot-user
            </Checkbox>
          </Col>
        </Row>
        <Row className={"margin-top-1 margin-left-3"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>Username</div>
            <div>
              <FormControl
                autoComplete={false}
                type="text"
                value={this.state.sipAuthenticationUserName}
                disabled={!this.state.requireAuthentication}
                onChange={(e) => {
                  this.setState({
                    sipAuthenticationUserName: e.target.value,
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1 margin-left-3"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>Password</div>
            <div>
              <FormControl
                autoComplete="new-password"
                type="password"
                value={this.state.sipAuthenticationPassword}
                disabled={!this.state.requireAuthentication}
                onChange={(e) => {
                  this.setState({
                    sipAuthenticationPassword: e.target.value,
                    passwordsNotMatch: this.state.validatePassword
                      ? this.state.validatePassword !== e.target.value
                      : false,
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1 margin-left-3"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              Confirm password
            </div>
            <div>
              <FormControl
                autoComplete="new-password"
                type="password"
                value={this.state.validatePassword}
                disabled={!this.state.requireAuthentication}
                onChange={(e) => {
                  this.setState({
                    validatePassword: e.target.value,
                    passwordsNotMatch:
                      this.state.sipAuthenticationPassword !== e.target.value,
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        {this.state.passwordsNotMatch && (
          <Row className={"margin-top-1 margin-left-3"}>
            <Col md={12} className={"flex align-items-center"}>
              <div className={"margin-right-1 flex flex-basis-16"}></div>
              <div>
                <HelpBlock bsClass="color-error">
                  Passwords do not match
                </HelpBlock>
              </div>
            </Col>
          </Row>
        )}
        {this.isShowAccessInformation() && (
          <>
            <Row className={"margin-top-1"}>
              <Col md={12}>
                <div
                  className={"font-weight-bold font-16 licenses-th width-66p"}
                >
                  Access information
                </div>
              </Col>
            </Row>
            {this.state.access_data.map((field, index) => (
              <Row key={index} className={"margin-top-1 margin-left-3"}>
                <Col md={12} className={"flex align-items-center"}>
                  <div className={"margin-right-1 flex flex-basis-16"}>
                    {field.name}
                    {this.getRequiredIcon(field.mandatory)}
                  </div>
                  <div>
                    <FormControl
                      type={field.type === "Integer" ? "number" : "text"}
                      value={field.value}
                      onChange={(e) => {
                        const newAccessData = JSON.parse(
                          JSON.stringify(this.state.access_data)
                        );
                        newAccessData[index].value = e.target.value;
                        this.setState({
                          access_data: newAccessData,
                        });
                      }}
                    />
                  </div>
                </Col>
              </Row>
            ))}
          </>
        )}
        <Row className={"margin-top-1"}>
          <Col md={12}>
            <div className={"font-weight-bold font-16 licenses-th width-66p"}>
              Access device / Point of presence
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1 margin-left-3"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              Access device
            </div>
            <div className={"margin-right-1"}>{this.state.accessDevice}</div>
            <Button
              className={"btn-primary"}
              onClick={() => this.setState({ showDevice: true })}
            >
              Edit
            </Button>
          </Col>
        </Row>
        {this.state.showDevice && (
          <DevicePage
            isOpen={this.state.showDevice}
            deviceName={this.state.accessDevice}
            handleHide={() => this.setState({ showDevice: false })}
          />
        )}
        <Row className={"margin-top-1"}>
          <Col md={12}>
            <div className="button-row">
              <div className="pull-right">
                <Button
                  className={"btn-primary"}
                  onClick={this.update}
                  disabled={
                    this.state.disableButton ||
                    this.getButtonStatusByAuthentication() ||
                    this.state.passwordsNotMatch
                  }
                >
                  Update
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </React.Fragment>
    );
  }

  getButtonStatusByAuthentication = () => {
    if (this.state.requireAuthentication) {
      return !(
        this.state.sipAuthenticationUserName &&
        this.state.sipAuthenticationPassword &&
        this.state.validatePassword
      );
    } else {
      return false;
    }
  };

  getRequiredIcon = (isMandatory) => {
    if (this.state.requireAuthentication) {
      if (isMandatory && this.state.authentication_accessInfo === "mandatory") {
        return "*";
      } else {
        return "";
      }
    } else {
      if (
        isMandatory &&
        this.state.noAuthentication_accessInfo === "mandatory"
      ) {
        return "*";
      } else {
        return "";
      }
    }
  };

  isShowAccessInformation = () => {
    if (
      this.state.requireAuthentication &&
      this.state.authentication_accessInfo !== "forbidden"
    ) {
      return true;
    }
    if (
      !this.state.requireAuthentication &&
      this.state.noAuthentication_accessInfo !== "forbidden"
    ) {
      return true;
    }
    return false;
  };

  update = () => {
    const {
      requireAuthentication,
      sipAuthenticationUserName,
      sipAuthenticationPassword,
    } = this.state;

    const data = {
      requireAuthentication,
      sipAuthenticationUserName,
      sipAuthenticationPassword,
    };

    const accesInfoData = {
      primaryAddress: this.state.access_data[0].value,
      primaryPort: this.state.access_data[1].value,
    };

    this.props.fetchPutUpdateTrunkGroupAccessInfo(
      this.props.match.params.tenantId,
      this.props.match.params.groupId,
      this.props.match.params.trunkGroupName,
      accesInfoData
    );

    this.setState({ disableButton: true }, () =>
      this.props
        .fetchPutUpdateTrunkGroup(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.trunkGroupName,
          data
        )
        .then(() => this.setState({ disableButton: false }))
    );
  };
}

const mapStateToProps = (state) => ({
  trunkGroup: state.trunkGroup,
  trunkGroupUsers: state.trunkGroupUsers,
  trunkingConfig: state.selfcareUrl.trunking,
});

const mapDispatchToProps = {
  fetchPutUpdateTrunkGroup,
  fetchGetSelfcareURL,
  fetchGetTrunkGroupAccessInfo,
  fetchPutUpdateTrunkGroupAccessInfo,
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Authentication)
);
