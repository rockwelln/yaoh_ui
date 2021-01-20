import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import { Link } from "react-router-dom";

import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import InputGroup from "react-bootstrap/lib/InputGroup";
import FormGroup from "react-bootstrap/lib/FormGroup";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import { FormattedMessage } from "react-intl";

import {
  refuseCreateTenant,
  fetchPostCreateTenantAdmin,
  changeStepOfCreateTenant,
  fetchGetTenantPasswordRules,
} from "../../store/actions";

import { passwordValidator } from "../passwordValidator";
import Loading from "../../common/Loading";

export class Admin extends Component {
  state = {
    createAdminData: {
      userId: "",
      firstName: "",
      lastName: "",
      language: "English",
      password: "",
      emailAddress: "",
    },
    passwordConfirmation: "",
    passwordNotMatch: null,
    userIdError: null,
    passwordLenthError: null,
    emptyFieldError: "",
    requiredEmail: null,
    passwordError: null,
    textPasswordError: "",
  };

  componentDidMount() {
    this.props
      .fetchGetTenantPasswordRules(this.props.createdTenant.tenantId)
      .then(() => this.setState({ isLoadingPassRules: false }));
  }

  render() {
    if (this.state.isLoadingPassRules) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        {/* PANEL HEADER */}
        <div className={"panel-heading"}>
          <Row>
            <Col md={12}>
              <div className={"header"}>
                <FormattedMessage
                  id="add-admin-header-tenant"
                  defaultMessage="Add admin to tenant"
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* PANEL HEADER */}
        <div className={"panel-body"}>
          {/* EXPLANATION */}
          <Row>
            <Col md={12}>
              <p>
                <FormattedMessage
                  id="add-admin-header-tenant"
                  defaultMessage="Add an administrator who can manage this tenant"
                />
              </p>
            </Col>
          </Row>

          {/* FORM */}

          {/* USER-ID */}
          <Row className={"margin-1"}>
            <FormGroup
              controlId="passwordGroupAdmin"
              validationState={this.state.userIdError}
            >
              <Col componentClass={ControlLabel} md={2}>
                ID{"\u002a"}
              </Col>
              <Col md={10}>
                <InputGroup>
                  <FormControl
                    type="text"
                    placeholder="Admin ID"
                    defaultValue={this.state.createAdminData.userId}
                    onChange={(e) => {
                      this.clearErrors();
                      this.setState({
                        createAdminData: {
                          ...this.state.createAdminData,
                          userId: e.target.value,
                        },
                      });
                    }}
                  />
                  <InputGroup.Addon>{`@${this.props.createdTenant.defaultDomain}`}</InputGroup.Addon>
                </InputGroup>
                {this.state.userIdError && (
                  <HelpBlock>
                    Must be greater than 6 and less than 80 characters
                  </HelpBlock>
                )}
              </Col>
            </FormGroup>
          </Row>
          <Row className={"margin-1"}>
            <FormGroup
              controlId="email"
              validationState={this.state.requiredEmail}
            >
              <Col componentClass={ControlLabel} md={2} className={"text-left"}>
                Email*
              </Col>
              <Col md={10}>
                <FormControl
                  type="email"
                  placeholder="Email"
                  defaultValue={this.state.createAdminData.emailAddress}
                  onChange={(e) => {
                    this.setState({
                      createAdminData: {
                        ...this.state.createAdminData,
                        emailAddress: e.target.value,
                      },
                      requiredEmail: null,
                    });
                  }}
                />
                {this.state.requiredEmail && (
                  <HelpBlock>Please fill in the field</HelpBlock>
                )}
              </Col>
            </FormGroup>
          </Row>

          {/* FIRST & LAST NAME */}
          <Row className={"margin-1"}>
            <Col componentClass={ControlLabel} md={2}>
              Name
            </Col>
            <Col md={5}>
              <FormControl
                type="text"
                placeholder="First Name"
                defaultValue={this.state.createAdminData.firstName}
                onChange={(e) => {
                  this.clearErrors();
                  this.setState({
                    createAdminData: {
                      ...this.state.createAdminData,
                      firstName: e.target.value,
                    },
                  });
                }}
              />
            </Col>
            <Col md={5}>
              <FormControl
                type="text"
                placeholder="Last Name"
                defaultValue={this.state.createAdminData.lastName}
                onChange={(e) => {
                  this.clearErrors();
                  this.setState({
                    createAdminData: {
                      ...this.state.createAdminData,
                      lastName: e.target.value,
                    },
                  });
                }}
              />
            </Col>
          </Row>

          {/* PASSWORD */}
          <Row className={"margin-1"}>
            <FormGroup
              controlId="passwordGroupAdmin"
              validationState={
                this.state.passwordNotMatch || this.state.passwordError
              }
            >
              <Col componentClass={ControlLabel} md={2} className={"text-left"}>
                Password
              </Col>
              <Col md={10}>
                <FormControl
                  type="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  defaultValue={this.state.createAdminData.password}
                  onChange={(e) => {
                    this.clearErrors();
                    this.setState({
                      createAdminData: {
                        ...this.state.createAdminData,
                        password: e.target.value,
                      },
                      passwordError: null,
                    });
                  }}
                />
                {this.state.passwordError && (
                  <HelpBlock>{this.state.textPasswordError}</HelpBlock>
                )}
              </Col>
            </FormGroup>
          </Row>

          {/* PASSWORD CONFIRMATION */}
          <Row className={"margin-1"}>
            <FormGroup
              controlId="passwordConfirmation"
              validationState={this.state.passwordNotMatch}
            >
              <Col componentClass={ControlLabel} md={2} className={"text-left"}>
                Password confirmation
              </Col>
              <Col md={10}>
                <FormControl
                  type="password"
                  placeholder="Password confirmation"
                  autoComplete="new-password"
                  defaultValue={this.state.passwordConfirmation}
                  onChange={(e) => {
                    this.clearErrors();
                    this.setState({ passwordConfirmation: e.target.value });
                  }}
                />
                {this.state.passwordNotMatch && (
                  <HelpBlock>Passwords not match</HelpBlock>
                )}
              </Col>
            </FormGroup>
          </Row>

          {/* BUTTONS */}
          <Row>
            <Col md={12}>
              <div class="button-row">
                <div class="pull-right">
                  {/* CREATE & FINISH */}
                  <Button
                    onClick={() => this.createAdmin()}
                    className={"btn-primary"}
                  >
                    <Glyphicon glyph="glyphicon glyphicon-ok" />
                    &nbsp; Create
                  </Button>
                </div>
                <div className="pull-right link-button">
                  <Link
                    to={`/provisioning/${this.props.match.params.gwName}/tenants`}
                  >
                    <div onClick={() => this.props.refuseCreateTenant()}>
                      Quit wizard
                    </div>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }

  clearErrors = () => {
    this.setState({
      passwordNotMatch: null,
      userIdError: null,
      passwordLenthError: null,
      emptyFieldError: "",
    });
  };

  createAdmin = () => {
    const { createAdminData, passwordConfirmation } = this.state;

    if (
      createAdminData.userId.length < 6 ||
      createAdminData.userId.length > 80
    ) {
      this.setState({ userIdError: "error" });
      return;
    }
    if (!createAdminData.emailAddress) {
      this.setState({ requiredEmail: "error" });
      return;
    }
    if (
      createAdminData.password &&
      passwordValidator(
        createAdminData.password,
        this.props.tenantPasswordRules
      )
    ) {
      this.setState({
        passwordError: "error",
        textPasswordError: passwordValidator(
          createAdminData.password,
          this.props.tenantPasswordRules
        ),
      });
      return;
    }
    if (
      (createAdminData.password || passwordConfirmation) &&
      createAdminData.password !== passwordConfirmation
    ) {
      this.setState({ passwordNotMatch: "error" });
      return;
    }
    if (!createAdminData.userId && !createAdminData.password) {
      this.setState({ emptyFieldError: "Id and Password is required fields" });
      return;
    }

    this.props
      .fetchPostCreateTenantAdmin(
        this.props.createdTenant.tenantId,
        this.state.createAdminData
      )
      .then(() => {
        this.props.history.push(
          `/provisioning/${this.props.match.params.gwName}/tenants/${this.props.createdTenant.tenantId}`
        );
        this.props.refuseCreateTenant();
      });
  };
}

const mapStateToProps = (state) => ({
  createdTenant: state.createdTenant,
  tenantPasswordRules: state.tenantPasswordRules,
});

const mapDispatchToProps = {
  fetchPostCreateTenantAdmin,
  refuseCreateTenant,
  changeStepOfCreateTenant,
  fetchGetTenantPasswordRules,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Admin));
