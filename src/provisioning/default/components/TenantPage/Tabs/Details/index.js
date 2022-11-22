import React, { Component } from "react";
import { connect } from "react-redux";

import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Col from "react-bootstrap/lib/Col";
import Button from "react-bootstrap/lib/Button";
import Checkbox from "react-bootstrap/lib/Checkbox";
import { Form } from "react-bootstrap";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import Loading from "../../../../common/Loading";

import { removeEmpty } from "../../../remuveEmptyInObject";

import { get } from "../../../get";

import {
  fetchPutUpdateTenantDetails,
  fetchGetTenantById,
  fetchGetListOfRoutingProfiles,
  fetchGetTenantRoutingProfile,
  fetchPutUpdateTenantRoutingProfile,
  fetchGetTenantVoiceMessaging,
  fetchPutUpdateTenantVoiceMessaging,
  fetchGetTenantOnlineCharging,
  fetchPutUpdateTenantOnlineCharging,
} from "../../../../store/actions";

class Details extends Component {
  state = {
    tenant: {},
    tenantName: "",
    defaultDomain: "",
    //useTenantLanguages: "",
    useCustomRoutingProfile: "",
    isLoading: true,
    addressInformation: {},
    isLoadingRoutingProfile: true,
    tenantRoutingProfile: "",
    syncStatus: undefined,
    isLoadingListRoutingProfile: true,

    voiceMessageDelivery: "",
    voiceMessageNotification: "",
    voicePortalPasscodeLockout: "",

    isLoadingOnlineCharging: false,
    onlineChargingEnabled: false,
    spendingLimit: "",
    isDisabledOnlineCharging: false,
  };

  fetchReq = () => {
    this.setState(
      {
        isLoading: true,
        isLoadingRoutingProfile: true,
        isLoadingVM: true,
        isLoadingListRoutingProfile: true,
        isLoadingOnlineCharging: true,
      },
      () => {
        this.props
          .fetchGetListOfRoutingProfiles()
          .then(() => this.setState({ isLoadingListRoutingProfile: false }));
        this.props.fetchGetTenantById(this.props.tenantId).then(() =>
          this.setState({
            tenant: { ...this.props.tenant },
            addressInformation: this.props.tenant.addressInformation
              ? this.props.tenant.addressInformation
              : {},
            isLoading: false,
          })
        );
        this.props.tenant.type === "Enterprise"
          ? this.props
              .fetchGetTenantRoutingProfile(this.props.tenantId)
              .then(() => {
                this.setState({
                  isLoadingRoutingProfile: false,
                  tenantRoutingProfile: this.props.tenantRoutingProfile,
                  useCustomRoutingProfile: !!this.props.tenantRoutingProfile,
                });
              })
          : this.setState({ isLoadingRoutingProfile: false });
        this.props
          .fetchGetTenantVoiceMessaging(this.props.tenantId)
          .then(() => {
            this.setVoiceMessaging();
          });
        this.props
          .fetchGetTenantOnlineCharging(this.props.tenantId)
          .then(() => {
            this.setState({
              isLoadingOnlineCharging: false,
              onlineChargingEnabled: this.props.tenantOnlineCharging.enabled,
              spendingLimit: this.props.tenantOnlineCharging.spendingLimit,
            });
          });
      }
    );
  };

  componentDidMount() {
    this.fetchReq();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.refreshTab !== prevProps.refreshTab &&
      this.props.refreshTab
    ) {
      this.fetchReq();
    }
    if (
      JSON.stringify(prevProps.tenantVoiceMessaging) !==
      JSON.stringify(this.props.tenantVoiceMessaging)
    ) {
      this.setVoiceMessaging();
    }
  }

  render() {
    if (
      this.props.isLoading ||
      this.state.isLoadingRoutingProfile ||
      this.state.isLoadingVM ||
      this.state.isLoadingOnlineCharging
    ) {
      return <Loading />;
    }

    return (
      <Col md={8}>
        <Form horizontal className={"margin-1"}>
          <FormGroup controlId="Details">
            <ControlLabel className={"margin-1"}>DETAILS</ControlLabel>
            <FormGroup controlId="tentantID">
              <Col componentClass={ControlLabel} md={3}>
                ID
              </Col>
              <Col md={9}>
                <FormControl
                  type="text"
                  placeholder="Tenant ID"
                  disabled
                  defaultValue={this.state.tenant.tenantId}
                />
              </Col>
            </FormGroup>
            {this.state.tenant.sync && (
              <React.Fragment>
                <FormGroup controlId="ldap">
                  <Col componentClass={ControlLabel} md={3}>
                    External LDAP
                  </Col>
                  <Col md={9}>
                    <FormControl value={this.state.tenant.sync.ldap} disabled />
                  </Col>
                </FormGroup>
                <FormGroup controlId="ldap">
                  <Col componentClass={ControlLabel} md={3}>
                    Tenant OU
                  </Col>
                  <Col md={9}>
                    <FormControl value={this.state.tenant.sync.ou} disabled />
                  </Col>
                </FormGroup>
              </React.Fragment>
            )}
            {this.state.tenant.sync && (
              <React.Fragment>
                <FormGroup>
                  <Col mdOffset={3} md={9}>
                    <Checkbox
                      defaultChecked={
                        get(this.props, "tenant.sync.status")
                          ? this.props.tenant.sync.status === "SYNCED" ||
                            this.props.tenant.sync.status === "MUST_BE_SYNCED"
                          : false
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          this.setState({ syncStatus: "MUST_BE_SYNCED" });
                        } else {
                          this.setState({ syncStatus: "MUST_BE_SKIPPED" });
                        }
                      }}
                    >
                      Include the Tenant in next Synchronization cycle (Groups
                      and Users)
                    </Checkbox>
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col mdOffset={1}>
                    <div>{`Last synchronization performed for this Tenant: ${
                      get(this.props, "tenant.sync.timeStamp")
                        ? this.props.tenant.sync.timeStamp
                        : ""
                    } `}</div>
                  </Col>
                </FormGroup>
              </React.Fragment>
            )}
            <FormGroup controlId="tenantName">
              <Col componentClass={ControlLabel} md={3}>
                Name
              </Col>
              <Col md={9}>
                <FormControl
                  type="text"
                  placeholder="Tenant name"
                  defaultValue={this.state.tenant.name}
                  onChange={(e) => {
                    this.setState({ tenantName: e.target.value });
                  }}
                  disabled={this.state.tenant.sync}
                />
              </Col>
            </FormGroup>
            <FormGroup controlId="defaultDomain">
              <Col componentClass={ControlLabel} md={3}>
                Domain
              </Col>
              <Col md={9}>
                <FormControl
                  type="text"
                  placeholder="Tenant name"
                  defaultValue={this.state.tenant.defaultDomain}
                  onChange={(e) => {
                    this.setState({ defaultDomain: e.target.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup controlId="tentantStreet">
              <Col componentClass={ControlLabel} md={3}>
                Addess
              </Col>
              <Col md={9}>
                <FormControl
                  type="text"
                  placeholder="Street"
                  value={this.state.addressInformation.addressLine1}
                  onChange={(e) =>
                    this.setState({
                      addressInformation: {
                        ...this.state.addressInformation,
                        addressLine1: e.target.value,
                      },
                    })
                  }
                />
              </Col>
            </FormGroup>
            <FormGroup controlId="tentantZipCity">
              <Col mdOffset={3} md={3}>
                <FormControl
                  type="text"
                  placeholder="ZIP"
                  value={this.state.addressInformation.postalCode}
                  onChange={(e) =>
                    this.setState({
                      addressInformation: {
                        ...this.state.addressInformation,
                        postalCode: e.target.value,
                      },
                    })
                  }
                />
              </Col>
              <Col md={6}>
                <FormControl
                  type="text"
                  placeholder="City"
                  value={this.state.addressInformation.city}
                  onChange={(e) =>
                    this.setState({
                      addressInformation: {
                        ...this.state.addressInformation,
                        city: e.target.value,
                      },
                    })
                  }
                />
              </Col>
              <Col md={12}>
                <div class="button-row margin-right-0">
                  <div className="pull-right">
                    <Button
                      className={"btn-primary"}
                      onClick={this.updateTenant}
                    >
                      {`Save`}
                    </Button>
                  </div>
                </div>
              </Col>
            </FormGroup>
            {this.props.tenant.type === "Enterprise" && (
              <>
                <FormGroup controlId="useCustomRoutingProfile">
                  <Col mdOffset={3} md={9}>
                    <Checkbox
                      checked={this.state.useCustomRoutingProfile}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          this.setState({
                            useCustomRoutingProfile: e.target.checked,
                            tenantRoutingProfile: "",
                          });
                        } else {
                          this.setState({
                            useCustomRoutingProfile: e.target.checked,
                          });
                        }
                      }}
                    >
                      Use custom routing profile
                    </Checkbox>
                  </Col>
                </FormGroup>
                {this.state.useCustomRoutingProfile && (
                  <FormGroup controlId="routingProfile">
                    <Col componentClass={ControlLabel} md={3}>
                      Routing profile
                    </Col>
                    <Col md={9}>
                      <FormControl
                        componentClass="select"
                        value={this.state.tenantRoutingProfile}
                        onChange={(e) => {
                          this.setState({
                            tenantRoutingProfile: e.target.value,
                          });
                        }}
                      >
                        {!this.state.tenantRoutingProfile && (
                          <option key={"null"} value={""}>
                            {""}
                          </option>
                        )}
                        {this.props.listOfRoutingProfiles.map((el) => (
                          <option key={el} value={el}>
                            {el}
                          </option>
                        ))}
                      </FormControl>
                    </Col>
                    <Col md={12}>
                      <div class="button-row margin-right-0">
                        <div className="pull-right">
                          <Button
                            className={"btn-primary"}
                            onClick={this.saveRoutingProfile}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </FormGroup>
                )}
                {((this.state.tenantRoutingProfile !==
                  this.props.tenantRoutingProfile &&
                  !this.state.useCustomRoutingProfile) ||
                  this.props.tenant.type === "ServiceProvider") && (
                  <FormGroup>
                    <Col md={12}>
                      <div class="button-row margin-right-0">
                        <div className="pull-right">
                          <Button
                            className={"btn-primary"}
                            onClick={this.saveRoutingProfile}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </FormGroup>
                )}
              </>
            )}
            {Object.keys(this.props.tenantVoiceMessaging).length ? (
              <React.Fragment>
                <FormGroup controlId="useCustomRoutingProfile">
                  <Col mdOffset={3} md={9}>
                    {!this.state.enabledVoiceMessagingSettings ? (
                      <Glyphicon
                        className={"glyphicon-light"}
                        glyph="glyphicon glyphicon-collapse-down"
                        onClick={this.showHideMore}
                        style={{ display: "flex", lineHeight: "20px" }}
                      >
                        <div
                          style={{
                            fontFamily: `"Ubuntu, Helvetica Neue",Helvetica,Arial,sans-serif`,
                          }}
                        >
                          &nbsp; Show voice messaging settings
                        </div>
                      </Glyphicon>
                    ) : (
                      <Glyphicon
                        className={"glyphicon-light"}
                        glyph="glyphicon glyphicon-collapse-down"
                        onClick={this.showHideMore}
                        style={{ display: "flex", lineHeight: "20px" }}
                      >
                        <div
                          style={{
                            fontFamily: `"Helvetica Neue",Helvetica,Arial,sans-serif`,
                          }}
                        >
                          &nbsp; Hide voice messaging settings
                        </div>
                      </Glyphicon>
                    )}
                  </Col>
                </FormGroup>
                {this.state.enabledVoiceMessagingSettings && (
                  <React.Fragment>
                    <FormGroup>
                      <Col
                        componentClass={ControlLabel}
                        md={3}
                        className={"padding-top-0"}
                      >
                        Voicemail Notification
                      </Col>
                      <Col md={9} className={"flex"}>
                        <Checkbox
                          checked={!this.state.systemDefaultMN}
                          onChange={(e) =>
                            this.setState({
                              systemDefaultMN: !e.target.checked,
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voicemail Notification"
                          value={this.state.voiceMessageNotification}
                          onChange={(e) =>
                            this.setState({
                              voiceMessageNotification: e.target.value,
                            })
                          }
                          disabled={this.state.systemDefaultMN}
                        />
                      </Col>
                    </FormGroup>
                    <FormGroup>
                      <Col
                        componentClass={ControlLabel}
                        md={3}
                        className={"padding-top-0"}
                      >
                        Voicemail Delivery
                      </Col>
                      <Col md={9} className={"flex"}>
                        <Checkbox
                          checked={!this.state.systemDefaultMD}
                          onChange={(e) =>
                            this.setState({
                              systemDefaultMD: !e.target.checked,
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voicemail Delivery"
                          value={this.state.voiceMessageDelivery}
                          onChange={(e) =>
                            this.setState({
                              voiceMessageDelivery: e.target.value,
                            })
                          }
                          disabled={this.state.systemDefaultMD}
                        />
                      </Col>
                    </FormGroup>
                    <FormGroup>
                      <Col
                        componentClass={ControlLabel}
                        md={3}
                        className={"padding-top-0"}
                      >
                        Voice portal passcode lockout
                      </Col>
                      <Col md={9} className={"flex"}>
                        <Checkbox
                          checked={!this.state.systemDefaultPPL}
                          onChange={(e) =>
                            this.setState({
                              systemDefaultPPL: !e.target.checked,
                            })
                          }
                        />
                        <FormControl
                          type="text"
                          placeholder="Voice portal passcode lockout"
                          value={this.state.voicePortalPasscodeLockout}
                          onChange={(e) =>
                            this.setState({
                              voicePortalPasscodeLockout: e.target.value,
                            })
                          }
                          disabled={this.state.systemDefaultPPL}
                        />
                      </Col>
                      <Col md={12}>
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
                      </Col>
                    </FormGroup>
                  </React.Fragment>
                )}
                {this.props?.config?.tenantFeatures?.onlineCharging && (
                  <>
                    <FormGroup controlId="onlineCharging">
                      <Col mdOffset={3} md={9}>
                        <Checkbox
                          checked={this.state.onlineChargingEnabled}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              this.setState({
                                onlineChargingEnabled: e.target.checked,
                                spendingLimit: "",
                              });
                            } else {
                              this.setState({
                                onlineChargingEnabled: e.target.checked,
                              });
                            }
                          }}
                        >
                          Online Charging Enabled
                        </Checkbox>
                      </Col>
                    </FormGroup>
                    <FormGroup controlId="onlineCharging">
                      <Col componentClass={ControlLabel} md={3}>
                        Spending Limit
                      </Col>
                      <Col md={9}>
                        <FormControl
                          type="number"
                          placeholder="Spending Limit"
                          disabled={!this.state.onlineChargingEnabled}
                          value={this.state.spendingLimit}
                          onChange={(e) =>
                            this.setState({ spendingLimit: e.target.value })
                          }
                        />
                      </Col>
                    </FormGroup>
                    <FormGroup controlId="onlineCharging">
                      <Col md={12}>
                        <div class="button-row margin-right-0">
                          <div className="pull-right">
                            <Button
                              className={"btn-primary"}
                              disabled={
                                (this.state.onlineChargingEnabled &&
                                  !this.state.spendingLimit) ||
                                this.state.isDisabledOnlineCharging
                              }
                              onClick={this.updateTenantOnlineCharging}
                            >
                              {`Save`}
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </FormGroup>
                  </>
                )}
              </React.Fragment>
            ) : null}
          </FormGroup>
        </Form>
      </Col>
    );
  }

  updateTenantOnlineCharging = () => {
    const data = {
      enabled: this.state.onlineChargingEnabled,
      spendingLimit: this.state.spendingLimit,
    };
    this.setState({ isDisabledOnlineCharging: true }, () =>
      this.props
        .fetchPutUpdateTenantOnlineCharging({
          tenantId: this.props.tenantId,
          data,
        })
        .then(() => this.setState({ isDisabledOnlineCharging: false }))
    );
  };

  setVoiceMessaging = () => {
    this.setState({
      isLoadingVM: false,
      voiceMessageDelivery: get(
        this.props,
        "tenantVoiceMessaging.voiceMessageDelivery.fromAddress"
      )
        ? this.props.tenantVoiceMessaging.voiceMessageDelivery.fromAddress
        : "",
      systemDefaultMD: get(
        this.props,
        "tenantVoiceMessaging.voiceMessageDelivery.systemDefault"
      )
        ? this.props.tenantVoiceMessaging.voiceMessageDelivery.systemDefault
        : true,
      voiceMessageNotification: get(
        this.props,
        "tenantVoiceMessaging.voiceMessageNotification.fromAddress"
      )
        ? this.props.tenantVoiceMessaging.voiceMessageNotification.fromAddress
        : "",
      systemDefaultMN: get(
        this.props,
        "tenantVoiceMessaging.voiceMessageNotification.systemDefault"
      )
        ? this.props.tenantVoiceMessaging.voiceMessageNotification.systemDefault
        : true,
      voicePortalPasscodeLockout: get(
        this.props,
        "tenantVoiceMessaging.voicePortalPasscodeLockout.fromAddress"
      )
        ? this.props.tenantVoiceMessaging.voicePortalPasscodeLockout.fromAddress
        : "",
      systemDefaultPPL: get(
        this.props,
        "tenantVoiceMessaging.voicePortalPasscodeLockout.systemDefault"
      )
        ? this.props.tenantVoiceMessaging.voicePortalPasscodeLockout
            .systemDefault
        : true,
    });
  };

  showHideMore = () => {
    this.setState((prevState) => ({
      enabledVoiceMessagingSettings: !prevState.enabledVoiceMessagingSettings,
    }));
  };

  updateTenant = () => {
    const {
      tenantName,
      defaultDomain,
      //useTenantLanguages,
      useCustomRoutingProfile,
      addressInformation,
      syncStatus,
    } = this.state;

    const data = {
      name: this.props.tenant.sync
        ? ""
        : tenantName
        ? tenantName
        : this.state.tenant.name,
      defaultDomain: defaultDomain
        ? defaultDomain
        : this.state.tenant.defaultDomain,
      // useTenantLanguages: useTenantLanguages
      //   ? useTenantLanguages
      //   : this.state.tenant.useTenantLanguages,
      useCustomRoutingProfile: useCustomRoutingProfile
        ? useCustomRoutingProfile
        : this.state.tenant.useCustomRoutingProfile,
      addressInformation,
      sync: {
        status: syncStatus,
      },
    };
    const clearData = removeEmpty(data);

    this.props.fetchPutUpdateTenantDetails(
      this.state.tenant.tenantId,
      clearData
    );
  };

  saveRoutingProfile = () => {
    this.props
      .fetchPutUpdateTenantDetails(this.state.tenant.tenantId, {
        useCustomRoutingProfile: true,
      })
      .then(() => {
        this.props.tenant.type === "Enterprise" &&
          this.props.fetchPutUpdateTenantRoutingProfile(
            this.state.tenant.tenantId,
            {
              routingProfile: this.state.tenantRoutingProfile,
            }
          );
      });
  };

  saveVoiceMessaging = () => {
    const data = {
      voiceMessageDelivery: {
        fromAddress: this.state.voiceMessageDelivery,
        systemDefault: this.state.systemDefaultMD,
      },
      voiceMessageNotification: {
        fromAddress: this.state.voiceMessageNotification,
        systemDefault: this.state.systemDefaultMN,
      },
      voicePortalPasscodeLockout: {
        fromAddress: this.state.voicePortalPasscodeLockout,
        systemDefault: this.state.systemDefaultPPL,
      },
    };

    const clearData = removeEmpty(data);

    this.props.fetchPutUpdateTenantVoiceMessaging(
      this.state.tenant.tenantId,
      clearData
    );
  };
}

const mapStateToProps = (state) => ({
  tenant: state.tenant,
  ldapBackends: state.ldapBackends,
  tenantOU: state.tenantOU,
  listOfRoutingProfiles: state.listOfRoutingProfiles,
  tenantRoutingProfile: state.tenantRoutingProfile,
  tenantVoiceMessaging: state.tenantVoiceMessaging,
  config: state.selfcareUrl,
  tenantOnlineCharging: state.tenantOnlineCharging,
});

const mapDispatchToProps = {
  fetchGetTenantById,
  fetchPutUpdateTenantDetails,
  fetchGetListOfRoutingProfiles,
  fetchGetTenantRoutingProfile,
  fetchPutUpdateTenantRoutingProfile,
  fetchGetTenantVoiceMessaging,
  fetchPutUpdateTenantVoiceMessaging,
  fetchGetTenantOnlineCharging,
  fetchPutUpdateTenantOnlineCharging,
};

export default connect(mapStateToProps, mapDispatchToProps)(Details);
