import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import { Link } from "react-router-dom";

import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Button from "react-bootstrap/lib/Button";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";
import FormControl from "react-bootstrap/lib/FormControl";

import Loading from "../../common/Loading";

import { removeEmpty } from "../remuveEmptyInObject";

import {
  refuseCreateTenant,
  changeStepOfCreateTenant,
  fetchGetListOfRoutingProfiles,
  fetchPutUpdateTenantDetails,
  fetchPutUpdateTenantRoutingProfile,
  fetchPutUpdateTenantVoiceMessaging,
  fetchGetTenantVoiceMessaging
} from "../../store/actions";

export class TenantParameters extends Component {
  state = {
    isLoading: true,
    useCustomRouting: false,
    selectedRoutingProfile: "",
    enabledVoiceMessagingSettings: false,
    voiceMessageNotification: "",
    voiceMessageDelivery: "",
    voicePortalPasscodeLockout: "",
    systemDefaultMN: true,
    systemDefaultMD: true,
    systemDefaultPPL: true,
    skipNextButtonName: "Skip",
    isLoadingVM: true
  };

  componentDidMount() {
    this.props.fetchGetListOfRoutingProfiles();
    this.props
      .fetchGetTenantVoiceMessaging(this.props.createdTenant.tenantId)
      .then(() => this.setState({ isLoadingVM: false }));
  }

  render() {
    if (this.state.isLoadingVM) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <Row>
            <Col md={12}>
              <div className={"header"}>Tenant parameters</div>
            </Col>
          </Row>
        </div>
        <div class="panel-body">
          <Row>
            <Col md={12} className={"flex-row"}>
              <div className={"width-100p"}>
                <Checkbox
                  className={"margin-top-0"}
                  checked={this.state.useCustomRouting}
                  onChange={e => {
                    if (e.target.checked) {
                      this.setState({
                        useCustomRouting: e.target.checked,
                        selectedRoutingProfile: this.props
                          .listOfRoutingProfiles[0]
                      });
                    } else {
                      this.setState({
                        useCustomRouting: e.target.checked,
                        selectedRoutingProfile: ""
                      });
                    }
                  }}
                >
                  Use custom routing profile
                </Checkbox>
                {this.state.useCustomRouting && (
                  <React.Fragment>
                    <div className="flex space-between align-items-center margin-bottom-1">
                      <div className="nowrap margin-right-1 width-50p">
                        Routing profile
                      </div>
                      <FormControl
                        componentClass="select"
                        value={this.state.selectedRoutingProfile}
                        onChange={e => {
                          this.setState({
                            selectedRoutingProfile: e.target.value
                          });
                        }}
                      >
                        {this.props.listOfRoutingProfiles.map(el => (
                          <option key={el} value={el}>
                            {el}
                          </option>
                        ))}
                      </FormControl>
                    </div>
                    <div class="button-row margin-right-0">
                      <div className="pull-right">
                        <Button
                          className={"btn-primary"}
                          onClick={this.saveRoutingProfile}
                          disabled={!this.state.selectedRoutingProfile}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </React.Fragment>
                )}
              </div>
            </Col>
          </Row>
          {Object.keys(this.props.tenantVoiceMessaging).length ? (
            <Row>
              <Col md={12} className={"flex-row"}>
                <div className={"width-100p"}>
                  <Checkbox
                    className={"margin-top-0"}
                    checked={this.state.enabledVoiceMessagingSettings}
                    onChange={e => {
                      if (e.target.checked) {
                        this.setState({
                          enabledVoiceMessagingSettings: e.target.checked
                        });
                      } else {
                        this.setState({
                          enabledVoiceMessagingSettings: e.target.checked,
                          voiceMessageNotification: "",
                          voiceMessageDelivery: "",
                          voicePortalPasscodeLockout: ""
                        });
                      }
                    }}
                  >
                    Voice messaging settings
                  </Checkbox>
                  {this.state.enabledVoiceMessagingSettings && (
                    <React.Fragment>
                      <div className="flex space-between align-items-center margin-bottom-1">
                        <div className="nowrap margin-right-1 width-50p">
                          Voicemail Notification
                        </div>
                        <Checkbox
                          checked={!this.state.systemDefaultMN}
                          onChange={e =>
                            this.setState({
                              systemDefaultMN: !e.target.checked
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voicemail Notification"
                          value={this.state.voiceMessageNotification}
                          onChange={e =>
                            this.setState({
                              voiceMessageNotification: e.target.value
                            })
                          }
                          disabled={this.state.systemDefaultMN}
                        />
                      </div>
                      <div className="flex space-between align-items-center margin-bottom-1">
                        <div className="nowrap margin-right-1 width-50p">
                          Voicemail Delivery
                        </div>
                        <Checkbox
                          checked={!this.state.systemDefaultMD}
                          onChange={e =>
                            this.setState({
                              systemDefaultMD: !e.target.checked
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voicemail Delivery"
                          value={this.state.voiceMessageDelivery}
                          onChange={e =>
                            this.setState({
                              voiceMessageDelivery: e.target.value
                            })
                          }
                          disabled={this.state.systemDefaultMD}
                        />
                      </div>
                      <div className="flex space-between align-items-center margin-bottom-1">
                        <div className="nowrap margin-right-1 width-50p">
                          Voice portal passcode lockout
                        </div>
                        <Checkbox
                          checked={!this.state.systemDefaultPPL}
                          onChange={e =>
                            this.setState({
                              systemDefaultPPL: !e.target.checked
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voice portal passcode lockout"
                          value={this.state.voicePortalPasscodeLockout}
                          onChange={e =>
                            this.setState({
                              voicePortalPasscodeLockout: e.target.value
                            })
                          }
                          disabled={this.state.systemDefaultPPL}
                        />
                      </div>
                      <div class="button-row margin-right-0">
                        <div className="pull-right">
                          <Button
                            className={"btn-primary"}
                            onClick={this.saveVoiceMessaging}
                            disabled={
                              (!this.state.systemDefaultMN &&
                                !this.state.voiceMessageNotification) ||
                              (!this.state.systemDefaultMD &&
                                !this.state.voiceMessageDelivery) ||
                              (!this.state.systemDefaultPPL &&
                                !this.state.voicePortalPasscodeLockout)
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </React.Fragment>
                  )}
                </div>
              </Col>
            </Row>
          ) : null}
          <Row>
            <div class="button-row">
              <div className="pull-right">
                <Button className={"btn-primary"} onClick={this.goToLicenses}>
                  <Glyphicon glyph="glyphicon glyphicon-ok" />
                  {this.state.skipNextButtonName}
                </Button>
              </div>
              <div className="pull-right link-button">
                <Link
                  to={`/provisioning/${this.props.match.params.gwName}/tenants/${this.props.createdTenant.tenantId}`}
                >
                  <div onClick={() => this.props.refuseCreateTenant()}>
                    Quit wizard
                  </div>
                </Link>
              </div>
            </div>
          </Row>
        </div>
      </React.Fragment>
    );
  }

  saveVoiceMessaging = () => {
    const data = {
      voiceMessageDelivery: {
        fromAddress: this.state.voiceMessageDelivery,
        systemDefault: this.state.systemDefaultMD
      },
      voiceMessageNotification: {
        fromAddress: this.state.voiceMessageNotification,
        systemDefault: this.state.systemDefaultMN
      },
      voicePortalPasscodeLockout: {
        fromAddress: this.state.voicePortalPasscodeLockout,
        systemDefault: this.state.systemDefaultPPL
      }
    };
    const clearData = removeEmpty(data);
    this.props
      .fetchPutUpdateTenantVoiceMessaging(
        this.props.createdTenant.tenantId,
        clearData
      )
      .then(() => this.setState({ skipNextButtonName: "Next" }));
  };

  saveRoutingProfile = () => {
    this.props
      .fetchPutUpdateTenantDetails(this.props.createdTenant.tenantId, {
        useCustomRoutingProfile: true
      })
      .then(() => {
        this.props
          .fetchPutUpdateTenantRoutingProfile(
            this.props.createdTenant.tenantId,
            {
              routingProfile: this.state.selectedRoutingProfile
            }
          )
          .then(() => this.setState({ skipNextButtonName: "Next" }));
      });
  };

  goToLicenses = () => {
    this.props.changeStepOfCreateTenant("Limits");
  };
}

const mapStateToProps = state => ({
  createdTenant: state.createdTenant,
  listOfRoutingProfiles: state.listOfRoutingProfiles,
  tenantVoiceMessaging: state.tenantVoiceMessaging
});

const mapDispatchToProps = {
  refuseCreateTenant,
  changeStepOfCreateTenant,
  fetchGetListOfRoutingProfiles,
  fetchPutUpdateTenantDetails,
  fetchPutUpdateTenantRoutingProfile,
  fetchPutUpdateTenantVoiceMessaging,
  fetchGetTenantVoiceMessaging
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(TenantParameters)
);
