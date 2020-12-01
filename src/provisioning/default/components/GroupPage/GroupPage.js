import React, { Component } from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Button from "react-bootstrap/lib/Button";

import Loading from "../../common/Loading";
import SuspensionStatusModal from "../../common/SuspensionStatusModal";
import Users from "./Tabs/Users";
import PhoneNumbers from "./Tabs/PhoneNumbers";
import Licenses from "./Tabs/Licenses";
import Details from "./Tabs/Details";
import Devices from "./Tabs/Devices";
import Admins from "./Tabs/Admins";
import TrunksGroup from "./Tabs/TrunksGroup";
import MobileNumbersTab from "./Tabs/MobileNumbers";

import { get } from "../get";

import {
  fetchGetTenantById,
  fetchGetGroupById,
  fetchGetTrunksGroupsByGroup,
  fetchGetSelfcareURL,
  fetchGetGroupSuspensionStatus,
  fetchPutUpdateGroupSuspensionStatus,
  fetchGetTenantPasswordRules
} from "../../store/actions";

import DeleteModal from "./DeleteModal";

class TenantPage extends Component {
  state = {
    isLoadingTenant: true,
    isLoadingGroup: true,
    showDelete: false,
    isLoadingSCURL: true,
    activeKey: 0,
    refreshTab: "",
    isLoadingSS: true,
    showSuspensionStatusModal: false,
    isLoadingTPP: true
  };

  fetchTennant = () => {
    this.setState(
      {
        isLoadingTenant: true,
        isLoadingGroup: true,
        isLoadingSCURL: true,
        isLoadingSS: true,
        isLoadingTPP: true
      },
      () => {
        this.props
          .fetchGetTenantPasswordRules(this.props.match.params.tenantId)
          .then(() => this.setState({ isLoadingTPP: false }));
        this.props
          .fetchGetTenantById(this.props.match.params.tenantId)
          .then(() => this.setState({ isLoadingTenant: false }));
        this.props
          .fetchGetGroupById(
            this.props.match.params.tenantId,
            this.props.match.params.groupId
          )
          .then(() => this.setState({ isLoadingGroup: false }));
        this.props.fetchGetTrunksGroupsByGroup(
          this.props.match.params.tenantId,
          this.props.match.params.groupId
        );
        this.props
          .fetchGetSelfcareURL()
          .then(() => this.setState({ isLoadingSCURL: false }));
        this.props
          .fetchGetGroupSuspensionStatus(this.props.match.params.tenantId)
          .then(() => this.setState({ isLoadingSS: false }));
      }
    );
  };

  componentDidMount() {
    this.fetchTennant();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.tenantId !== this.props.match.params.tenantId) {
      this.fetchTennant();
    }
  }

  render() {
    const { tenant, group } = this.props;
    const {
      isLoadingTenant,
      isLoadingGroup,
      showDelete,
      isLoadingSCURL,
      isLoadingSS,
      isLoadingTPP
    } = this.state;

    if (
      isLoadingTenant ||
      isLoadingGroup ||
      isLoadingSCURL ||
      isLoadingSS ||
      isLoadingTPP
    ) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <div className={"header flex space-between"}>
            <div>
              {`GROUP: ${group.groupName} (${this.props.match.params.groupId}) of tenant ${tenant.name} (${tenant.tenantId})`}
              <Button
                className={`${
                  this.props.groupSuspensionStatus
                    ? "btn-danger"
                    : "btn-success"
                } margin-left-1`}
                onClick={() =>
                  this.setState({ showSuspensionStatusModal: true })
                }
              >
                {this.props.groupSuspensionStatus
                  ? this.props.groupSuspensionStatus
                  : "Active"}
              </Button>
              {!group.sync && (
                <Glyphicon
                  glyph="glyphicon glyphicon-trash"
                  onClick={() => this.setState({ showDelete: true })}
                />
              )}
              <DeleteModal
                groupId={this.props.match.params.groupId}
                show={showDelete}
                onClose={() => {
                  this.setState({ showDelete: false });
                }}
              />
            </div>
            {get(this.props, "selfcareUrl.selfcare.url") && (
              <div>
                <Button
                  className="btn-primary"
                  onClick={() =>
                    window.open(
                      `${
                        this.props.selfcareUrl.selfcare.url
                      }/sso?token=${localStorage.getItem(
                        "auth_token"
                      )}&refreshToken=${localStorage.getItem(
                        "refreshToken"
                      )}&tenant=${this.props.match.params.tenantId}&group=${
                        this.props.match.params.groupId
                      }`
                    )
                  }
                >
                  Switch to selfcare portal
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className={"panel-body"}>
          <Tabs
            activeKey={
              this.props.location.state && this.props.location.state.defaultTab
                ? this.props.location.state.defaultTab
                : this.state.activeKey
            }
            onSelect={this.changeTab}
          >
            <Tab eventKey={0} title="LICENSES">
              <Licenses
                tenantId={this.props.match.params.tenantId}
                groupId={this.props.match.params.groupId}
                refreshTab={this.state.refreshTab === "Licenses"}
              />
            </Tab>
            <Tab eventKey={1} title="HOSTED PBX USERS">
              <Users
                tenantId={this.props.match.params.tenantId}
                groupId={this.props.match.params.groupId}
                refreshTab={this.state.refreshTab === "Users"}
              />
            </Tab>
            {this.props.fetchTrunksGroupsFail &&
              this.props.trunkGroupNotAuthorisedGroup && (
                <Tab eventKey={2} title="TRUNKING">
                  <TrunksGroup
                    refreshTab={this.state.refreshTab === "TrunksGroup"}
                  />
                </Tab>
              )}
            <Tab eventKey={3} title="PHONE NUMBERS">
              <PhoneNumbers
                tenantId={this.props.match.params.tenantId}
                groupId={this.props.match.params.groupId}
                refreshTab={this.state.refreshTab === "PhoneNumbers"}
              />
            </Tab>
            <Tab eventKey={7} title="MOBILE NUMBERS">
              <MobileNumbersTab
                tenantId={this.props.match.params.tenantId}
                groupId={this.props.match.params.groupId}
                isLoadingTenant={isLoadingTenant}
                refreshTab={this.state.refreshTab === "MobileNumbersTab"}
              />
            </Tab>
            <Tab eventKey={4} title="DEVICES">
              <Devices
                tenantId={this.props.match.params.tenantId}
                groupId={this.props.match.params.groupId}
                refreshTab={this.state.refreshTab === "Devices"}
              />
            </Tab>
            {this.props.tenantPasswordRules.rulesApplyTo !==
            "Group Administrator and User External Authentication" ? (
              <Tab eventKey={5} title="ADMINISTRATORS">
                <Admins
                  tenantId={this.props.match.params.tenantId}
                  groupId={this.props.match.params.groupId}
                  refreshTab={this.state.refreshTab === "Admins"}
                />
              </Tab>
            ) : null}
            <Tab eventKey={6} title="DETAILS">
              <Details
                group={group}
                isLoading={isLoadingTenant}
                refreshTab={this.state.refreshTab === "Details"}
              />
            </Tab>
          </Tabs>
        </div>
        {this.state.showSuspensionStatusModal && (
          <SuspensionStatusModal
            show={this.state.showSuspensionStatusModal}
            handleClose={() =>
              this.setState({ showSuspensionStatusModal: false })
            }
            status={this.props.groupSuspensionStatus}
            updateSuspensionStatus={this.updateSuspensionStatus}
          />
        )}
      </React.Fragment>
    );
  }

  updateSuspensionStatus = status => {
    const data = {
      suspensionStatus: status
    };
    this.setState({ showSuspensionStatusModal: false });
    this.props
      .fetchPutUpdateGroupSuspensionStatus(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(() => this.fetchTennant());
  };

  changeTab = key => {
    let refreshTab = "";
    switch (key) {
      case 0:
        refreshTab = "Licenses";
        break;
      case 1:
        refreshTab = "Users";
        break;
      case 2:
        refreshTab = "TrunksGroup";
        break;
      case 3:
        refreshTab = "PhoneNumbers";
        break;
      case 4:
        refreshTab = "Devices";
        break;
      case 5:
        refreshTab = "Admins";
        break;
      case 6:
        refreshTab = "Details";
        break;
      case 7:
        refreshTab = "MobileNumbersTab";
        break;
      default:
        refreshTab = "";
    }
    this.setState({ activeKey: key, refreshTab });
  };
}

const mapDispatchToProps = {
  fetchGetTenantById,
  fetchGetGroupById,
  fetchGetTrunksGroupsByGroup,
  fetchGetSelfcareURL,
  fetchGetGroupSuspensionStatus,
  fetchPutUpdateGroupSuspensionStatus,
  fetchGetTenantPasswordRules
};

const mapStateToProps = state => ({
  tenant: state.tenant,
  group: state.group,
  fetchTrunksGroupsFail: state.fetchTrunksGroupsFail,
  trunkGroupNotAuthorisedGroup: state.trunkGroupNotAuthorisedGroup,
  selfcareUrl: state.selfcareUrl,
  groupSuspensionStatus: state.groupSuspensionStatus,
  tenantPasswordRules: state.tenantPasswordRules
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(TenantPage)
);
