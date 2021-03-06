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
  fetchGetGroupById,
  fetchGetGroupAdminByAdminId,
  fetchPutUpdateGroupAdmin,
  fetchGetTenantAdminByAdminId,
  fetchGetTenantById,
  fetchPutUpdateTenantAdmin,
  fetchGetLanguages
} from "../../store/actions";

import { removeEmpty } from "../remuveEmptyInObject";

import Loading from "../../common/Loading";

class CreateAdmin extends Component {
  state = {
    updateAdminData: {
      firstName: "",
      lastName: "",
      language: "",
      password: ""
    },
    passwordConfirmation: "",
    passwordNotMatch: null,
    isLoadingLevel: true,
    isLoadingAdmin: true,
    isUpdatedMassage: "",
    errorMassage: "",
    errorLengthMassage: "",
    isLoadingLanguages: true
  };

  fetchGroupAdmin = () => {
    this.props
      .fetchGetGroupById(
        this.props.match.params.tenantId,
        this.props.match.params.groupId
      )
      .then(() => this.setState({ isLoadingLevel: false }));
    this.props
      .fetchGetGroupAdminByAdminId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        this.props.match.params.adminId
      )
      .then(() =>
        this.setState({
          updateAdminData: this.props.groupAdmin,
          isLoadingAdmin: false
        })
      );
  };

  fetchTenantAdmin = () => {
    this.props
      .fetchGetTenantById(this.props.match.params.tenantId)
      .then(() => this.setState({ isLoadingLevel: false }));
    this.props
      .fetchGetTenantAdminByAdminId(
        this.props.match.params.tenantId,
        this.props.match.params.adminId
      )
      .then(() =>
        this.setState({
          updateAdminData: this.props.tenantAdmin,
          isLoadingAdmin: false
        })
      );
  };

  componentDidMount() {
    this.props
      .fetchGetLanguages()
      .then(() => this.setState({ isLoadingLanguages: false }));
    this.props.match.params.groupId
      ? this.fetchGroupAdmin()
      : this.fetchTenantAdmin();
  }

  render() {
    const {
      updateAdminData,
      passwordConfirmation,
      passwordNotMatch,
      isLoadingLevel,
      isLoadingAdmin,
      isLoadingLanguages
    } = this.state;

    if (isLoadingLevel || isLoadingAdmin || isLoadingLanguages) {
      return <Loading />;
    }

    let splitedAdminId;
    const indexOfSlice = this.props.match.params.adminId.indexOf("@");
    if (indexOfSlice === -1) {
      splitedAdminId = this.props.match.params.adminId;
    } else {
      splitedAdminId = this.props.match.params.adminId.slice(0, indexOfSlice);
    }

    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <div className={"header"}>UPDATE ADMIN</div>
        </div>
        <div className={"panel-body"}>
          <Col md={8}>
            <Form horizontal className={"margin-1"}>
              <FormGroup controlId="Details">
                <FormGroup controlId="usernameGroupAdmin">
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
                        defaultValue={splitedAdminId}
                        autoComplete="new-username"
                        disabled
                      />
                      <InputGroup.Addon>{`@${
                        this.props.match.params.groupId
                          ? this.props.groupDefaultDomain
                          : this.props.tenantDefaultDomain
                      }`}</InputGroup.Addon>
                    </InputGroup>
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
                      defaultValue={updateAdminData.firstName}
                      onChange={e => {
                        this.setState({
                          updateAdminData: {
                            ...this.state.updateAdminData,
                            firstName: e.target.value
                          },
                          isUpdatedMassage: "",
                          errorMassage: ""
                        });
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
                      defaultValue={updateAdminData.lastName}
                      onChange={e => {
                        this.setState({
                          updateAdminData: {
                            ...this.state.updateAdminData,
                            lastName: e.target.value
                          },
                          isUpdatedMassage: "",
                          errorMassage: ""
                        });
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
                      value={updateAdminData.language}
                      onChange={e =>
                        this.setState({
                          updateAdminData: {
                            ...this.state.updateAdminData,
                            language: e.target.value
                          }
                        })
                      }
                    >
                      {this.props.languages.availableLanguages.map(lang => (
                        <option key={`${lang.locale}`} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </FormGroup>
                <FormGroup
                  controlId="passwordGroupAdmin"
                  validationState={passwordNotMatch}
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
                      defaultValue={updateAdminData.password}
                      onChange={e => {
                        this.setState({
                          updateAdminData: {
                            ...this.state.updateAdminData,
                            password: e.target.value
                          },
                          passwordNotMatch: null,
                          isUpdatedMassage: "",
                          errorMassage: "",
                          errorLengthMassage: ""
                        });
                      }}
                    />
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
                      onChange={e => {
                        this.setState({
                          passwordConfirmation: e.target.value,
                          passwordNotMatch: null,
                          isUpdatedMassage: "",
                          errorMassage: "",
                          errorLengthMassage: ""
                        });
                      }}
                    />
                  </Col>
                </FormGroup>
                <Col mdOffset={3} md={9}>
                  {this.state.errorMassage && (
                    <HelpBlock bsClass="color-error">
                      {this.state.errorMassage}
                    </HelpBlock>
                  )}
                </Col>
              </FormGroup>
              <Row>
                <div className="button-row">
                  <div className="pull-right">
                    <Button
                      onClick={
                        this.props.match.params.groupId
                          ? this.createGroupAdmin
                          : this.createTenantAdmin
                      }
                      disabled={this.state.isUpdatedMassage === "Loading..."}
                      className={"btn-primary"}
                    >
                      <Glyphicon glyph="glyphicon glyphicon-ok" /> UPDATE
                    </Button>
                  </div>
                </div>
              </Row>
            </Form>
          </Col>
        </div>
      </React.Fragment>
    );
  }

  createGroupAdmin = () => {
    const { updateAdminData, passwordConfirmation } = this.state;
    if (
      updateAdminData.password &&
      updateAdminData.password !== passwordConfirmation
    ) {
      this.setState({
        errorMassage: "Passwords do not match",
        passwordNotMatch: "error"
      });
      return;
    }
    this.setState({ isUpdatedMassage: "Loading..." }, () =>
      this.props
        .fetchPutUpdateGroupAdmin(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.adminId,
          removeEmpty(updateAdminData)
        )
        .then(() =>
          this.setState({
            isUpdatedMassage: ""
          })
        )
    );
  };

  createTenantAdmin = () => {
    const { updateAdminData, passwordConfirmation } = this.state;
    if (
      updateAdminData.password &&
      updateAdminData.password !== passwordConfirmation
    ) {
      this.setState({
        errorMassage: "Passwords do not match",
        passwordNotMatch: "error"
      });
      return;
    }

    this.setState({ isUpdatedMassage: "Loading..." }, () =>
      this.props
        .fetchPutUpdateTenantAdmin(
          this.props.match.params.tenantId,
          this.props.match.params.adminId,
          removeEmpty(updateAdminData)
        )
        .then(() =>
          this.setState({
            isUpdatedMassage: ""
          })
        )
    );
  };
}

const mapStateToProps = state => ({
  groupDefaultDomain: state.group.defaultDomain,
  tenantDefaultDomain: state.tenant.defaultDomain,
  groupAdmin: state.groupAdmin,
  tenantAdmin: state.tenantAdmin,
  languages: state.languages
});

const mapDispatchToProps = {
  fetchGetGroupById,
  fetchGetGroupAdminByAdminId,
  fetchPutUpdateGroupAdmin,
  fetchGetTenantAdminByAdminId,
  fetchGetTenantById,
  fetchPutUpdateTenantAdmin,
  fetchGetLanguages
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CreateAdmin)
);
