import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import InputGroup from "react-bootstrap/lib/InputGroup";
import { Form } from "react-bootstrap";

import {
  fetchPostCreateGroupAdmin,
  fetchPostCreateTenantAdmin,
  fetchGetGroupById,
  fetchGetTenantById,
  clearErrorMassage,
  fetchGetLanguages,
  fetchGetTenantPasswordRules,
  fetchGetGroupPasswordRules,
} from "../../store/actions";

import Loading from "../../common/Loading";

import { passwordValidator } from "../passwordValidator";

class CreateAdmin extends Component {
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
    requiredEmail: null,
    isLoading: true,
    isLoadingLang: true,
    isLoadingPassRules: true,
    userIdError: null,
    passwordError: null,
    textPasswordError: "",
    disabledCreateButton: false,
  };

  componentDidMount() {
    this.props.match.params.groupId
      ? this.props
          .fetchGetGroupPasswordRules(
            this.props.match.params.tenantId,
            this.props.match.params.groupId
          )
          .then(() => this.setState({ isLoadingPassRules: false }))
      : this.props
          .fetchGetTenantPasswordRules(this.props.match.params.tenantId)
          .then(() => this.setState({ isLoadingPassRules: false }));
    this.props.fetchGetLanguages().then(() =>
      this.setState({
        isLoadingLang: false,
        createAdminData: {
          ...this.state.createAdminData,
          language: this.props.languages.defaultLangue,
        },
      })
    );
    this.props.match.params.groupId
      ? this.props
          .fetchGetGroupById(
            this.props.match.params.tenantId,
            this.props.match.params.groupId
          )
          .then(() => this.setState({ isLoading: false }))
      : this.props
          .fetchGetTenantById(this.props.match.params.tenantId)
          .then(() => this.setState({ isLoading: false }));
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.shouldRedirect && this.props.shouldRedirect) {
      this.props.match.params.groupId
        ? this.props.history.push(
            `/provisioning/${this.props.match.params.gwName}/tenants/${this.props.match.params.tenantId}/groups/${this.props.match.params.groupId}`
          )
        : this.props.history.push(
            `/provisioning/${this.props.match.params.gwName}/tenants/${this.props.match.params.tenantId}`
          );
    }
  }

  render() {
    const {
      createAdminData,
      passwordConfirmation,
      passwordNotMatch,
      isLoading,
      isLoadingLang,
      requiredEmail,
      isLoadingPassRules,
      passwordError,
      textPasswordError,
      disabledCreateButton,
    } = this.state;

    if (isLoading || isLoadingLang || isLoadingPassRules) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <div className={"header"}>CREATE ADMIN</div>
        </div>
        <div className={"panel-body"}>
          <Row>
            <Col md={8}>
              <Form horizontal className={"margin-1"}>
                <FormGroup controlId="Details">
                  <FormGroup
                    controlId="usernameGroupAdmin"
                    validationState={this.state.userIdError}
                  >
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Username
                    </Col>
                    <Col md={9}>
                      <InputGroup>
                        <FormControl
                          type="text"
                          placeholder="User name"
                          defaultValue={createAdminData.userId}
                          autoComplete="new-username"
                          onChange={(e) => {
                            this.setState({
                              createAdminData: {
                                ...this.state.createAdminData,
                                userId: e.target.value,
                              },
                              userIdError: null,
                            });
                            this.props.clearErrorMassage();
                          }}
                        />
                        <InputGroup.Addon>{`@${
                          this.props.match.params.groupId
                            ? this.props.groupDefaultDomain
                            : this.props.tenantDefaultDomain
                        }`}</InputGroup.Addon>
                      </InputGroup>
                      {this.state.userIdError && (
                        <HelpBlock>
                          Must be greater than 6 and less than 80 characters
                        </HelpBlock>
                      )}
                    </Col>
                  </FormGroup>
                  <FormGroup controlId="email" validationState={requiredEmail}>
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Email*
                    </Col>
                    <Col md={9}>
                      <FormControl
                        type="email"
                        placeholder="Email"
                        defaultValue={createAdminData.emailAddress}
                        onChange={(e) => {
                          this.setState({
                            createAdminData: {
                              ...this.state.createAdminData,
                              emailAddress: e.target.value,
                            },
                            requiredEmail: null,
                          });
                          this.props.clearErrorMassage();
                        }}
                      />
                      {requiredEmail && (
                        <HelpBlock>Please fill in the field</HelpBlock>
                      )}
                    </Col>
                  </FormGroup>
                  <FormGroup controlId="firstName">
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      First Name
                    </Col>
                    <Col md={9}>
                      <FormControl
                        type="text"
                        placeholder="First name"
                        defaultValue={createAdminData.firstName}
                        onChange={(e) => {
                          this.setState({
                            createAdminData: {
                              ...this.state.createAdminData,
                              firstName: e.target.value,
                            },
                          });
                          this.props.clearErrorMassage();
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup controlId="lastName">
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Last Name
                    </Col>
                    <Col md={9}>
                      <FormControl
                        type="text"
                        placeholder="Last name"
                        defaultValue={createAdminData.lastName}
                        onChange={(e) => {
                          this.setState({
                            createAdminData: {
                              ...this.state.createAdminData,
                              lastName: e.target.value,
                            },
                          });
                          this.props.clearErrorMassage();
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup controlId="language">
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Language
                    </Col>
                    <Col md={9}>
                      <FormControl
                        componentClass="select"
                        defaultValue={createAdminData.language}
                        onChange={(e) =>
                          this.setState({
                            createAdminData: {
                              ...this.state.createAdminData,
                              language: e.target.value,
                            },
                          })
                        }
                      >
                        {this.props.languages.availableLanguages.map((lang) => (
                          <option key={`${lang.locale}`} value={lang.name}>
                            {lang.name}
                          </option>
                        ))}
                      </FormControl>
                    </Col>
                  </FormGroup>
                  <FormGroup
                    controlId="passwordGroupAdmin"
                    validationState={passwordNotMatch || passwordError}
                  >
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Password
                    </Col>
                    <Col md={9}>
                      <FormControl
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        defaultValue={createAdminData.password}
                        onChange={(e) => {
                          this.setState({
                            createAdminData: {
                              ...this.state.createAdminData,
                              password: e.target.value,
                            },
                            passwordNotMatch: null,
                            passwordError: null,
                          });
                          this.props.clearErrorMassage();
                        }}
                      />
                      {passwordError && (
                        <HelpBlock>{textPasswordError}</HelpBlock>
                      )}
                    </Col>
                  </FormGroup>
                  <FormGroup
                    controlId="passwordConfirmation"
                    validationState={passwordNotMatch}
                  >
                    <Col
                      componentClass={ControlLabel}
                      md={3}
                      className={"text-left"}
                    >
                      Password confirmation
                    </Col>
                    <Col md={9}>
                      <FormControl
                        type="password"
                        placeholder="Password confirmation"
                        autoComplete="new-password"
                        defaultValue={passwordConfirmation}
                        onChange={(e) => {
                          this.setState({
                            passwordConfirmation: e.target.value,
                            passwordNotMatch: null,
                          });
                          this.props.clearErrorMassage();
                        }}
                      />
                      {passwordNotMatch && (
                        <HelpBlock>Passwords not match</HelpBlock>
                      )}
                    </Col>
                  </FormGroup>
                  <Col mdOffset={3} md={9}>
                    {this.props.errorMassage && (
                      <HelpBlock bsClass="color-error">
                        {this.props.errorMassage}
                      </HelpBlock>
                    )}
                  </Col>
                </FormGroup>
                <Row>
                  <Col mdPush={10} md={1}>
                    <Button
                      onClick={this.createAdmin}
                      disabled={disabledCreateButton}
                    >
                      <Glyphicon glyph="glyphicon glyphicon-ok" /> CREATE
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }

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
        this.props.match.params.groupId
          ? this.props.groupPasswordRules
          : this.props.tenantPasswordRules
      )
    ) {
      this.setState({
        passwordError: "error",
        textPasswordError: passwordValidator(
          createAdminData.password,
          this.props.match.params.groupId
            ? this.props.groupPasswordRules
            : this.props.tenantPasswordRules
        ),
      });
      return;
    }
    if (createAdminData.password !== passwordConfirmation) {
      this.setState({ passwordNotMatch: "error" });
      return;
    }

    const callback = () => {
      this.setState({ disabledCreateButton: false });
    };

    this.setState({ disabledCreateButton: true }, () => {
      this.props.match.params.groupId
        ? this.props.fetchPostCreateGroupAdmin(
            this.props.match.params.tenantId,
            this.props.match.params.groupId,
            createAdminData,
            callback
          )
        : this.props.fetchPostCreateTenantAdmin(
            this.props.match.params.tenantId,
            createAdminData,
            callback
          );
    });
  };
}

const mapStateToProps = (state) => ({
  groupDefaultDomain: state.group.defaultDomain,
  tenantDefaultDomain: state.tenant.defaultDomain,
  errorMassage: state.errorMassage,
  shouldRedirect: state.shouldRedirect,
  languages: state.languages,
  tenantPasswordRules: state.tenantPasswordRules,
  groupPasswordRules: state.groupPasswordRules,
});

const mapDispatchToProps = {
  fetchPostCreateGroupAdmin,
  fetchPostCreateTenantAdmin,
  fetchGetGroupById,
  fetchGetTenantById,
  clearErrorMassage,
  fetchGetLanguages,
  fetchGetTenantPasswordRules,
  fetchGetGroupPasswordRules,
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(CreateAdmin)
);
