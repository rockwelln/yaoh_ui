import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Panel from "react-bootstrap/lib/Panel";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Button from "react-bootstrap/lib/Button";
import Table from "react-bootstrap/lib/Table";

import { FormattedMessage } from "react-intl";
import Loading from "../../../../common/Loading";
import ServicePackAuthorisation from "../../../ServicePackAuthorisation";
import LicensesPanel from "../../../../common/License";
import SingleEdit from "../../../../common/License/SingleEdit";

import {
  fetchGetLicensesByGroupId,
  fetchGetTrunkByGroupID,
  fetchPutUpdateGroupDetails,
  fetchPutUpdateTrunkByGroupId,
  clearErrorMassage,
  fetchPutUpdateServicePacksByGroupId,
  fetchPutUpdateGroupServicesByGroupId,
  fetchPostAddGroupServicesToGroup,
  fetchGetTenantServicePack,
  showHideAdditionalServiceGroup,
  fetchGetTenantGroupService,
  showHideAdditionalUserServicesGroup,
  fetchGetDictServicePacks,
  fetchGetDictUserServices,
  fetchGetDictVirtualServicePacks,
} from "../../../../store/actions";

const INFINITY = 8734;

export class Licenses extends Component {
  state = {
    isLoading: true,
    isLoadingTrunk: true,
    groupServices: [],
    trunkGroups: {},
    servicePacks: [],
    newUserLimit: 0,
    editGroupServices: false,
    showModal: false,
    editTrunkLicenses: false,
    editMaxBursting: false,
    editServicePacks: false,
    indexOfService: 0,
    showMore: true,
    editUserLimit: false,
    editUserServices: false,
    isLoadingServicePacksDict: false,
    isLoadingUserServicesDict: false,
    isLoadingVirtualServicePacksDict: false,
  };

  fetchData = () => {
    this.setState({ isLoading: true, isLoadingTrunk: true }, () => {
      this.props
        .fetchGetLicensesByGroupId(this.props.tenantId, this.props.groupId)
        .then((data) => {
          this.setState(
            {
              groupServices: this.props.groupServices.groups,
              servicePacks: this.props.servicePacks,
              newUserLimit: this.props.group.userLimit,
              limitedUserServicesGroup:
                this.props.limitedUserServicesGroup.services,
              isLoading: data ? false : true,
            },
            () => this.props.showHideAdditionalServiceGroup(this.state.showMore)
          );
        });
      this.props
        .fetchGetTrunkByGroupID(this.props.tenantId, this.props.groupId)
        .then(() => {
          this.setState({
            trunkGroups: this.props.trunkGroups,
            newUserLimit: this.props.group.userLimit,
            isLoadingTrunk: false,
          });
        });
    });
    this.setState({ isLoadingServicePacksDict: true }, () =>
      this.props
        .fetchGetDictServicePacks()
        .then(() => this.setState({ isLoadingServicePacksDict: false }))
    );
    this.setState({ isLoadingUserServicesDict: true }, () =>
      this.props
        .fetchGetDictUserServices()
        .then(() => this.setState({ isLoadingUserServicesDict: false }))
    );
    this.setState({ isLoadingVirtualServicePacksDict: true }, () =>
      this.props
        .fetchGetDictVirtualServicePacks()
        .then(() => this.setState({ isLoadingVirtualServicePacksDict: false }))
    );
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.refreshTab !== prevProps.refreshTab &&
      this.props.refreshTab
    ) {
      this.fetchData();
    }
  }

  render() {
    const {
      isLoading,
      isLoadingTrunk,
      trunkGroups,
      editTrunkLicenses,
      editMaxBursting,
      editServicePacks,
      editGroupServices,
      indexOfService,
      editUserLimit,
      editUserServices,
      isLoadingServicePacksDict,
      isLoadingUserServicesDict,
      isLoadingVirtualServicePacksDict,
    } = this.state;

    if (
      isLoading ||
      isLoadingTrunk ||
      isLoadingServicePacksDict ||
      isLoadingUserServicesDict ||
      isLoadingVirtualServicePacksDict
    ) {
      return <Loading />;
    }

    const dictForLicenses = {
      ...this.props.dictServicePacks,
      ...this.props.dictVirtualServicePacks,
    };

    return (
      <Row className={"margin-top-2 margin-left-8"}>
        <Col md={5}>
          <div>
            <Panel>
              <Panel.Heading>
                <FormattedMessage
                  id="trunling_capacity"
                  defaultMessage="TRUNKING CAPACITY"
                />
              </Panel.Heading>
              {this.props.fetchTrunksGroupsFail ? (
                Object.keys(trunkGroups).length ? (
                  <Panel.Body>
                    <Table responsive>
                      <tbody>
                        <tr>
                          <td className={"licenses-td vertical-middle"}>
                            <FormattedMessage
                              id="trunking_licenses"
                              defaultMessage={`Trunking licenses:`}
                            />
                          </td>
                          <td
                            className={"text-right licenses-td vertical-middle"}
                          >
                            {this.props.trunkGroups.maxActiveCalls}
                          </td>
                          <td
                            className={"text-right licenses-td vertical-middle"}
                          >
                            <Glyphicon
                              glyph="glyphicon glyphicon-pencil"
                              className={"edit-pencil"}
                              onClick={() =>
                                this.setState({
                                  editTrunkLicenses: true,
                                })
                              }
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className={"licenses-td vertical-middle"}>
                            <FormattedMessage
                              id="max_bursting"
                              defaultMessage={`Max bursting:`}
                            />
                          </td>
                          <td
                            className={"text-right licenses-td vertical-middle"}
                          >
                            {this.props.trunkGroups.burstingMaxActiveCalls
                              .unlimited
                              ? String.fromCharCode(INFINITY)
                              : this.props.trunkGroups.burstingMaxActiveCalls
                                  .maximum}
                          </td>
                          <td
                            className={"text-right licenses-td vertical-middle"}
                          >
                            <Glyphicon
                              glyph="glyphicon glyphicon-pencil"
                              className={"edit-pencil"}
                              onClick={() =>
                                this.setState({ editMaxBursting: true })
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    {editTrunkLicenses && (
                      <SingleEdit
                        isEditTunkLicenses
                        show={editTrunkLicenses}
                        title={
                          <FormattedMessage
                            id="trunling_capacity"
                            defaultMessage="TRUNKING CAPACITY"
                          />
                        }
                        onClose={() =>
                          this.setState({ editTrunkLicenses: false }, () =>
                            this.fetchData()
                          )
                        }
                        trunkLicensesMax={
                          this.props.trunkGroups.maxAvailableActiveCalls
                            .unlimited
                            ? String.fromCharCode(INFINITY)
                            : this.props.trunkGroups.maxAvailableActiveCalls
                                .maximum
                        }
                        value={this.state.trunkGroups.maxActiveCalls}
                        onChange={this.changeTrunkingLicenses}
                        onSave={this.updateTrunkCapacity}
                        licenseTitle={
                          <FormattedMessage
                            id="trunking_licenses"
                            defaultMessage={`Trunking licenses:`}
                          />
                        }
                      />
                    )}
                    {editMaxBursting && (
                      <SingleEdit
                        show={editMaxBursting}
                        title={
                          <FormattedMessage
                            id="trunling_capacity"
                            defaultMessage="TRUNKING CAPACITY"
                          />
                        }
                        onClose={() =>
                          this.setState({ editMaxBursting: false }, () =>
                            this.fetchData()
                          )
                        }
                        isEditMaxBursting
                        value={
                          this.state.trunkGroups.burstingMaxActiveCalls.maximum
                        }
                        infinity={
                          this.state.trunkGroups.burstingMaxActiveCalls
                            .unlimited
                        }
                        onChangeInfinity={this.changeMaxBurstingInfinity}
                        onChange={this.changeMaxBurstingValue}
                        onSave={this.updateTrunkCapacity}
                        licenseTitle={
                          <FormattedMessage
                            id="max_bursting"
                            defaultMessage={`Max bursting:`}
                          />
                        }
                      />
                    )}
                  </Panel.Body>
                ) : (
                  <Panel.Body>
                    <FormattedMessage
                      id="no_trunk_groups"
                      defaultMessage="No info"
                    />
                  </Panel.Body>
                )
              ) : (
                <Panel.Body>
                  <FormattedMessage
                    id="trunking_not_authorised"
                    defaultMessage="Trunking not authorised"
                  />
                </Panel.Body>
              )}
            </Panel>
            <Panel>
              <Panel.Heading>
                <FormattedMessage
                  id="number_of_users"
                  defaultMessage="Number of users"
                />
              </Panel.Heading>
              <Panel.Body>
                <Table responsive>
                  <thead>
                    <tr>
                      <th className={"licenses-th"}></th>
                      <th
                        className={
                          "text-right vertical-middle licenses-th nowrap"
                        }
                      >
                        <FormattedMessage id="in_use" defaultMessage="in use" />
                      </th>
                      <th className={"text-right vertical-middle licenses-th"}>
                        <FormattedMessage
                          id="limited"
                          defaultMessage="limited"
                        />
                      </th>
                      <th className={"licenses-th"}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={"licenses-td vertical-middle"}>
                        <FormattedMessage
                          id="service_packs"
                          defaultMessage="User limit:"
                        />
                      </td>
                      <td className={"text-right licenses-td vertical-middle"}>
                        {this.props.group.userCount}
                      </td>
                      <td className={"text-right licenses-td vertical-middle"}>
                        {this.props.group.userLimit}
                      </td>
                      <td className={"text-right licenses-td vertical-middle"}>
                        <Glyphicon
                          glyph="glyphicon glyphicon-pencil"
                          className={"edit-pencil"}
                          onClick={() =>
                            this.setState({
                              editUserLimit: true,
                            })
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                </Table>
                {editUserLimit && (
                  <SingleEdit
                    isEditGroup
                    isEditUserLimit
                    show={editUserLimit}
                    title={
                      <FormattedMessage
                        id="number_of_users"
                        defaultMessage="Number of users"
                      />
                    }
                    onClose={() =>
                      this.setState({ editUserLimit: false }, () =>
                        this.fetchData()
                      )
                    }
                    allocated={this.props.group.userCount}
                    value={this.state.newUserLimit}
                    onChange={(value) => this.setState({ newUserLimit: value })}
                    onSave={this.updateUserLimit}
                    licenseTitle={
                      <FormattedMessage
                        id="service_packs"
                        defaultMessage="User limit:"
                      />
                    }
                  />
                )}
              </Panel.Body>
            </Panel>
            <Panel>
              <Panel.Heading>
                <FormattedMessage
                  id="service_packs"
                  defaultMessage="SERVICE PACKS"
                />
              </Panel.Heading>
              <Panel.Body>
                {this.props.servicePacks.length ? (
                  <LicensesPanel
                    licenses={this.props.servicePacks}
                    showEdit={this.showEditSericePacks}
                    isEditGroup
                    dict={dictForLicenses}
                  />
                ) : (
                  <FormattedMessage
                    id="No_service_packs"
                    defaultMessage="No service packs were found"
                  />
                )}
                {editServicePacks && (
                  <SingleEdit
                    tenantId={this.props.match.params.tenantId}
                    isEditGroup
                    isEditPacks
                    apiRequest={this.props.fetchGetTenantServicePack}
                    pack={this.props.tenantServicePack}
                    show={editServicePacks}
                    title={
                      <FormattedMessage
                        id="service_packs"
                        defaultMessage="SERVICE PACKS"
                      />
                    }
                    onClose={() =>
                      this.setState({ editServicePacks: false }, () =>
                        this.fetchData()
                      )
                    }
                    licenseTitle={
                      dictForLicenses[
                        this.state.servicePacks[indexOfService].name
                      ]?.display_name ||
                      this.state.servicePacks[indexOfService].name
                    }
                    technicalTitle={
                      this.state.servicePacks[indexOfService].name
                    }
                    allocated={
                      this.state.servicePacks[indexOfService].inUse || 0
                    }
                    value={
                      this.state.servicePacks[indexOfService].allocated
                        .maximum || 0
                    }
                    infinity={
                      this.state.servicePacks[indexOfService].allocated
                        .unlimited
                    }
                    onChangeInfinity={this.changeServicePacksUnlimeted}
                    onChange={this.changeServicePacksMaximum}
                    onSave={this.updateServicePacks}
                  />
                )}
              </Panel.Body>
            </Panel>
            <Button
              className={"width-100p"}
              bsStyle="link"
              onClick={() => this.setState({ showModal: true })}
            >
              <FormattedMessage
                id="edit_service_pack_authorisation"
                defaultMessage="Edit service pack authorisation"
              />
            </Button>
            <ServicePackAuthorisation
              level={"group"}
              groupId={this.props.match.params.groupId}
              isOpen={this.state.showModal}
              handleHide={this.handleHide}
              userServices={this.props.userServices}
            />
          </div>
        </Col>
        <Col md={7}>
          <Panel>
            <Panel.Heading>
              <FormattedMessage
                id="group_services"
                defaultMessage="GROUP SERVICES"
              />
            </Panel.Heading>
            <Panel.Body>
              {this.props.groupServices.groups &&
              this.props.groupServices.groups.length ? (
                <LicensesPanel
                  licenses={this.props.groupServices.groups}
                  showHide={this.showHideAdditionalServices}
                  showEdit={this.showEditGroupServices}
                  isEditGroup
                  withShowMore
                />
              ) : (
                <FormattedMessage
                  id="No_service_found"
                  defaultMessage="No services were found"
                />
              )}
              {editGroupServices && (
                <SingleEdit
                  tenantId={this.props.match.params.tenantId}
                  isEditGroup
                  isEditPacks
                  apiRequest={this.props.fetchGetTenantGroupService}
                  pack={this.props.tenantGroupService}
                  show={editGroupServices}
                  title={
                    <FormattedMessage
                      id="group_services"
                      defaultMessage="GROUP SERVICES"
                    />
                  }
                  onClose={() =>
                    this.setState({ editGroupServices: false }, () =>
                      this.fetchData()
                    )
                  }
                  licenseTitle={this.state.groupServices[indexOfService].name}
                  allocated={this.state.groupServices[indexOfService].inUse}
                  value={
                    this.state.groupServices[indexOfService].allocated
                      .maximum || 0
                  }
                  infinity={
                    this.state.groupServices[indexOfService].allocated.unlimited
                  }
                  onChangeInfinity={this.changeGroupServicesUnlimeted}
                  onChange={this.changeGroupServicesMaximum}
                  onSave={this.updateGroupServices}
                />
              )}
            </Panel.Body>
          </Panel>
          <Panel>
            <Panel.Heading>
              <FormattedMessage
                id="user_services"
                defaultMessage="USER SERVICES"
              />
            </Panel.Heading>
            <Panel.Body>
              {this.props.limitedUserServicesGroup &&
              this.props.limitedUserServicesGroup.services.length ? (
                <LicensesPanel
                  licenses={this.props.limitedUserServicesGroup.services}
                  showHide={this.showHideAdditionalUserServices}
                  showEdit={this.showEditUserServices}
                  withShowMore
                  dict={{ ...this.props.dictUserServices }}
                />
              ) : (
                <FormattedMessage
                  id="No_services_found"
                  defaultMessage="No services were found"
                />
              )}
              {editUserServices && (
                <SingleEdit
                  isEditPacks
                  show={editUserServices}
                  title={
                    <FormattedMessage
                      id="user_services"
                      defaultMessage="USER SERVICES"
                    />
                  }
                  onClose={() =>
                    this.setState({ editUserServices: false }, () =>
                      this.fetchData()
                    )
                  }
                  licenseTitle={
                    this.props.dictUserServices[
                      this.state.limitedUserServicesGroup[indexOfService].name
                    ] ||
                    this.state.limitedUserServicesGroup[indexOfService].name
                  }
                  allocated={
                    this.state.limitedUserServicesGroup[indexOfService].inUse
                  }
                  value={
                    this.state.limitedUserServicesGroup[indexOfService]
                      .allocated.maximum
                  }
                  infinity={
                    this.state.limitedUserServicesGroup[indexOfService]
                      .allocated.unlimited
                  }
                  onChangeInfinity={this.changeUserServicesUnlimeted}
                  onChange={this.changeUserServicesMaximum}
                  onSave={this.updateUserServices}
                />
              )}
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }

  updateUserServices = () => {
    const data = {
      userServices: this.state.limitedUserServicesGroup,
    };

    this.props
      .fetchPutUpdateGroupServicesByGroupId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(() => this.fetchData())
      .then(() => this.setState({ editUserServices: false }));
  };

  changeUserServicesMaximum = (max) => {
    this.setState((prevState) => ({
      limitedUserServicesGroup: [
        ...prevState.limitedUserServicesGroup.slice(
          0,
          this.state.indexOfService
        ),
        {
          ...prevState.limitedUserServicesGroup[this.state.indexOfService],
          allocated: {
            ...prevState.limitedUserServicesGroup[this.state.indexOfService]
              .allocated,
            maximum: Number(max),
          },
        },
        ...prevState.limitedUserServicesGroup.slice(
          this.state.indexOfService + 1
        ),
      ],
    }));
  };

  changeUserServicesUnlimeted = (checked) => {
    this.setState((prevState) => ({
      limitedUserServicesGroup: [
        ...prevState.limitedUserServicesGroup.slice(
          0,
          this.state.indexOfService
        ),
        {
          ...prevState.limitedUserServicesGroup[this.state.indexOfService],
          allocated: {
            ...prevState.limitedUserServicesGroup[this.state.indexOfService]
              .allocated,
            unlimited: checked,
          },
        },
        ...prevState.limitedUserServicesGroup.slice(
          this.state.indexOfService + 1
        ),
      ],
    }));
  };

  showEditUserServices = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editUserServices: true })
    );
  };

  showHideAdditionalUserServices = (status) => {
    this.setState({ showMoreUserServices: status });
    this.props.showHideAdditionalUserServicesGroup(status);
  };

  showEditGroupServices = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editGroupServices: true })
    );
  };

  showEditSericePacks = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editServicePacks: true })
    );
  };

  changeMaxBurstingValue = (value) => {
    this.setState((prevState) => ({
      trunkGroups: {
        ...prevState.trunkGroups,
        burstingMaxActiveCalls: {
          ...prevState.trunkGroups.burstingMaxActiveCalls,
          maximum: Number(value),
        },
      },
    }));
  };

  changeMaxBurstingInfinity = () => {
    this.setState((prevState) => ({
      trunkGroups: {
        ...prevState.trunkGroups,
        burstingMaxActiveCalls: {
          ...prevState.trunkGroups.burstingMaxActiveCalls,
          unlimited: !prevState.trunkGroups.burstingMaxActiveCalls.unlimited,
        },
      },
    }));
  };

  changeTrunkingLicenses = (value) => {
    this.setState((prevState) => ({
      trunkGroups: {
        ...prevState.trunkGroups,
        maxActiveCalls: Number(value),
      },
    }));
  };

  showHideAdditionalServices = (status) => {
    this.setState({ showMore: status });
    this.props.showHideAdditionalServiceGroup(status);
  };

  handleHide = () => {
    this.setState({ showModal: false }, () => this.fetchData());
  };

  updateServicePacks = () => {
    const data = {
      servicePacks: this.state.servicePacks,
    };

    this.props
      .fetchPutUpdateServicePacksByGroupId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(() => this.fetchData())
      .then(() => this.setState({ editServicePacks: false }));
  };

  changeServicePacksUnlimeted = (checked) => {
    this.setState((prevState) => ({
      servicePacks: [
        ...prevState.servicePacks.slice(0, this.state.indexOfService),
        {
          ...prevState.servicePacks[this.state.indexOfService],
          allocated: {
            ...prevState.servicePacks[this.state.indexOfService].allocated,
            unlimited: checked,
          },
        },
        ...prevState.servicePacks.slice(this.state.indexOfService + 1),
      ],
    }));
  };

  changeServicePacksMaximum = (max) => {
    this.setState((prevState) => ({
      servicePacks: [
        ...prevState.servicePacks.slice(0, this.state.indexOfService),
        {
          ...prevState.servicePacks[this.state.indexOfService],
          allocated: {
            ...prevState.servicePacks[this.state.indexOfService].allocated,
            maximum: Number(max),
          },
        },
        ...prevState.servicePacks.slice(this.state.indexOfService + 1),
      ],
    }));
  };

  updateGroupServices = () => {
    const data = {
      groupServices: this.state.groupServices,
    };

    const authorisedServices = {
      services: this.state.groupServices.reduce((prev, service) => {
        if (
          !(!service.allocated.unlimited && service.allocated.maximum === 0)
        ) {
          prev.push({ name: service.name });
          return prev;
        }
        return prev;
      }, []),
    };

    this.props
      .fetchPutUpdateGroupServicesByGroupId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(() =>
        this.props.fetchPostAddGroupServicesToGroup(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          authorisedServices
        )
      )
      .then(() => this.fetchData())
      .then(() => this.setState({ editGroupServices: false }));
  };

  changeGroupServicesUnlimeted = (checked) => {
    this.setState((prevState) => ({
      groupServices: [
        ...prevState.groupServices.slice(0, this.state.indexOfService),
        {
          ...prevState.groupServices[this.state.indexOfService],
          allocated: {
            ...prevState.groupServices[this.state.indexOfService].allocated,
            unlimited: checked,
          },
        },
        ...prevState.groupServices.slice(this.state.indexOfService + 1),
      ],
    }));
  };

  changeGroupServicesMaximum = (max) => {
    this.setState((prevState) => ({
      groupServices: [
        ...prevState.groupServices.slice(0, this.state.indexOfService),
        {
          ...prevState.groupServices[this.state.indexOfService],
          allocated: {
            ...prevState.groupServices[this.state.indexOfService].allocated,
            maximum: Number(max),
          },
        },
        ...prevState.groupServices.slice(this.state.indexOfService + 1),
      ],
    }));
  };

  updateUserLimit = () => {
    const data = {
      userLimit: this.state.newUserLimit
        ? parseInt(this.state.newUserLimit, 10)
        : this.props.group.userLimit,
    };

    this.props
      .fetchPutUpdateGroupDetails(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(() =>
        this.setState({ editNumberOfUsers: false, editUserLimit: false })
      );
  };

  updateTrunkCapacity = () => {
    const data = {
      maxActiveCalls: this.state.trunkGroups.maxActiveCalls,
      burstingMaxActiveCalls: this.state.trunkGroups.burstingMaxActiveCalls,
    };

    this.props
      .fetchPutUpdateTrunkByGroupId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        data
      )
      .then(
        this.setState({ editTrunkLicenses: false, editMaxBursting: false })
      );
  };
}

const mapStateToProps = (state) => ({
  group: state.group,
  servicePacks: state.servicePacks,
  groupServices: state.groupServices,
  trunkGroups: state.trunkGroups,
  groupTrunkErrorMassage: state.groupTrunkErrorMassage,
  userServices: state.userServicesGroup,
  fetchTrunksGroupsFail: state.fetchTrunksGroupsFail,
  tenantServicePack: state.tenantServicePack,
  tenantGroupService: state.tenantGroupService,
  limitedUserServicesGroup: state.limitedUserServicesGroup,
  dictServicePacks: state.dictServicePacks,
  dictUserServices: state.dictUserServices,
  dictVirtualServicePacks: state.dictVirtualServicePacks,
});

const mapDispatchToProps = {
  fetchGetLicensesByGroupId,
  fetchGetTrunkByGroupID,
  fetchPutUpdateGroupDetails,
  fetchPutUpdateTrunkByGroupId,
  clearErrorMassage,
  fetchPutUpdateServicePacksByGroupId,
  fetchPutUpdateGroupServicesByGroupId,
  fetchPostAddGroupServicesToGroup,
  fetchGetTenantServicePack,
  showHideAdditionalServiceGroup,
  fetchGetTenantGroupService,
  showHideAdditionalUserServicesGroup,
  fetchGetDictServicePacks,
  fetchGetDictUserServices,
  fetchGetDictVirtualServicePacks,
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Licenses)
);
