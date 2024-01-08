import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import {
  fetchGetTenantLicenses,
  fetchGetTrunkByTenantID,
  fetchPutUpdateTrunkByTenantId,
  fetchPutUpdateGroupServicesByTenantId,
  fetchPutUpdateTenantServicePacks,
  showHideAdditionalServicesTenant,
  fetchGetTenantEntitlements,
  fetchGetSelfcareURL,
  showHideAdditionalUserServicesTenant,
  fetchDeleteServicePacksFromTenant,
  fetchGetDictServicePacks,
  fetchGetDictUserServices,
  fetchGetDictVirtualServicePacks,
} from "../../../../store/actions";

import Panel from "react-bootstrap/lib/Panel";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Button from "react-bootstrap/lib/Button";
import Table from "react-bootstrap/lib/Table";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";

import { FormattedMessage } from "react-intl";
import Loading from "../../../../common/Loading";
import ServicePackAuthorisation from "../../../ServicePackAuthorisation";
import LicensesPanel from "../../../../common/License";
import SingleEdit from "../../../../common/License/SingleEdit";
import DeleteService from "../../../../common/License/DeleteService";
import AddEntitlements from "./AddEntitlements";
import EditEntitlements from "./EditEntitlements";
import DeleteEntitlements from "./DeleteEntitlements";
import AddServicePacks from "./AddServicePacks";

import { removeEmpty } from "../../../remuveEmptyInObject";
import { get } from "../../../get";

const INFINITY = 8734;

export class Licenses extends Component {
  state = {
    isLoading: true,
    isLoadingTrunk: true,
    groupServices: [],
    trunkGroups: {},
    servicePacks: [],
    newUserLimit: null,
    editGroupServices: false,
    showModal: false,
    editTrunkLicenses: false,
    editMaxBursting: false,
    editServicePacks: false,
    indexOfService: 0,
    showMore: true,
    isLoadingEntitlements: true,
    showAddEntitlements: false,
    editEntitlement: undefined,
    deleteEntitlement: undefined,
    limitedUserServicesTenant: [],
    showMoreUserServices: true,
    editUserServices: false,
    isDeleteServicePack: false,
    showAddServicePack: false,
    isLoadingServicePacksDict: false,
    isLoadingUserServicesDict: false,
    isLoadingVirtualServicePacksDict: false,
  };

  fetchData() {
    this.setState(
      { isLoading: true, isLoadingTrunk: true, isLoadingEntitlements: true },
      () => {
        this.props
          .fetchGetTenantLicenses(this.props.match.params.tenantId)
          .then(() =>
            this.setState(
              {
                isLoading: false,
                groupServices: this.props.tenantLicenses.groups,
                servicePacks: this.props.tenantServicePacks,
                limitedUserServicesTenant:
                  this.props.limitedUserServicesTenant.services,
              },
              () =>
                this.props.showHideAdditionalServicesTenant(this.state.showMore)
            )
          );
        this.props
          .fetchGetTrunkByTenantID(this.props.match.params.tenantId)
          .then(() => {
            this.setState({
              trunkGroups: this.props.tenantTrunkGroups,
              isLoadingTrunk: false,
            });
          });
      }
    );
    if (
      get(this.props, "selfcareUrl.modules.nims") &&
      this.props.selfcareUrl.modules.nims
    ) {
      this.props
        .fetchGetTenantEntitlements(this.props.match.params.tenantId)
        .then(this.setState({ isLoadingEntitlements: false }));
    } else {
      this.setState({ isLoadingEntitlements: false });
    }
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
  }

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
      isLoadingEntitlements,
      editUserServices,
      isDeleteServicePack,
      showAddServicePack,
      isLoadingServicePacksDict,
      isLoadingUserServicesDict,
      isLoadingVirtualServicePacksDict,
    } = this.state;
    if (
      isLoading ||
      isLoadingTrunk ||
      isLoadingEntitlements ||
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
              {this.props.isAuthorisedTrunkTenant ? (
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
                            {
                              this.props.tenantTrunkGroups.maxActiveCalls
                                .maximum
                            }
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
                            {this.props.tenantTrunkGroups.burstingMaxActiveCalls
                              .unlimited
                              ? String.fromCharCode(INFINITY)
                              : this.props.tenantTrunkGroups
                                  .burstingMaxActiveCalls.maximum}
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
                        value={this.state.trunkGroups.maxActiveCalls.maximum}
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
              <Panel.Heading
                className={"flex space-between align-items-center"}
              >
                <FormattedMessage
                  id="service_packs"
                  defaultMessage="SERVICE PACKS"
                />
                <Button
                  bsStyle="primary"
                  onClick={() => this.setState({ showAddServicePack: true })}
                >
                  <FormattedMessage id="add" defaultMessage="ADD" />
                </Button>
              </Panel.Heading>
              <Panel.Body>
                {this.props.tenantServicePacks.length ? (
                  <LicensesPanel
                    licenses={this.props.tenantServicePacks}
                    showEdit={this.showEditSericePacks}
                    showDelete={this.showDeleteServicePacks}
                    showDeleteIcon={true}
                    dict={dictForLicenses}
                  />
                ) : (
                  <FormattedMessage
                    id="No_service_packs"
                    defaultMessage="No service packs were found"
                  />
                )}
                {showAddServicePack && (
                  <AddServicePacks
                    show={showAddServicePack}
                    onClose={() =>
                      this.setState({ showAddServicePack: false }, () =>
                        this.fetchData()
                      )
                    }
                  />
                )}
                {isDeleteServicePack && (
                  <DeleteService
                    show={isDeleteServicePack}
                    service={this.state.servicePacks[indexOfService]}
                    onClose={() =>
                      this.setState({ isDeleteServicePack: false }, () =>
                        this.fetchData()
                      )
                    }
                    deleteServiceRequest={fetchDeleteServicePacksFromTenant}
                  />
                )}
                {editServicePacks && (
                  <SingleEdit
                    isEditPacks
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
                    allocated={
                      this.state.servicePacks[indexOfService].currentlyAllocated
                    }
                    value={
                      this.state.servicePacks[indexOfService].allocated.maximum
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
                id="edit_end_user_service_authorisation"
                defaultMessage="Edit end user service authorisation"
              />
            </Button>
            <ServicePackAuthorisation
              level={"tenant"}
              tenantId={this.props.match.params.tenantId}
              isOpen={this.state.showModal}
              handleHide={this.handleHide}
              userServices={this.props.userServices}
            />
          </div>
        </Col>
        <Col md={7}>
          {get(this.props, "selfcareUrl.modules.nims") &&
            this.props.selfcareUrl.modules.nims && (
              <Panel>
                <Panel.Heading
                  className={"flex space-between align-items-center"}
                >
                  <FormattedMessage
                    id="number_entitlement"
                    defaultMessage="Number entitlement"
                  />
                  <Button
                    bsStyle="primary"
                    onClick={() => this.setState({ showAddEntitlements: true })}
                  >
                    <FormattedMessage id="add" defaultMessage="ADD" />
                  </Button>
                </Panel.Heading>
                <Panel.Body>
                  {this.props.tenantEntitlements.length ? (
                    <Table hover>
                      <thead>
                        <tr>
                          <th />
                          <th>
                            <FormattedMessage
                              id="assigned"
                              defaultMessage="assigned"
                            />
                          </th>
                          <th>
                            <FormattedMessage
                              id="entitled"
                              defaultMessage="entitled"
                            />
                          </th>
                          <th />
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {this.props.tenantEntitlements.map((el) => (
                          <tr key={el.id}>
                            <td>{el.name}</td>
                            <td>{el.counter ? el.counter : 0}</td>
                            <td>{el.entitlement}</td>
                            <td>
                              <Glyphicon
                                glyph="glyphicon glyphicon-pencil"
                                className={"edit-pencil"}
                                onClick={() =>
                                  this.setState({ editEntitlement: el })
                                }
                              />
                            </td>
                            <td>
                              {el.counter ? null : (
                                <ButtonToolbar
                                  onClick={() =>
                                    this.setState({ deleteEntitlement: el })
                                  }
                                >
                                  <Glyphicon glyph="glyphicon glyphicon-remove" />
                                </ButtonToolbar>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <FormattedMessage
                      id="entitlements_not_assigned"
                      defaultMessage="No entitlements assigned for this tenant"
                    />
                  )}
                </Panel.Body>
              </Panel>
            )}
          {this.state.showAddEntitlements && (
            <AddEntitlements
              show={this.state.showAddEntitlements}
              onClose={() =>
                this.setState({ showAddEntitlements: false }, () =>
                  this.fetchData()
                )
              }
            />
          )}
          {this.state.editEntitlement && (
            <EditEntitlements
              show={this.state.editEntitlement}
              entitlement={this.state.editEntitlement}
              onClose={() =>
                this.setState({ editEntitlement: undefined }, () =>
                  this.fetchData()
                )
              }
            />
          )}
          {this.state.deleteEntitlement && (
            <DeleteEntitlements
              show={this.state.deleteEntitlement}
              entitlement={this.state.deleteEntitlement}
              onClose={() =>
                this.setState({ deleteEntitlement: undefined }, () =>
                  this.fetchData()
                )
              }
            />
          )}
          <Panel>
            <Panel.Heading>
              <FormattedMessage
                id="group_services"
                defaultMessage="GROUP SERVICES"
              />
            </Panel.Heading>
            <Panel.Body>
              {this.props.tenantLicenses.groups &&
              this.props.tenantLicenses.groups.length ? (
                <LicensesPanel
                  licenses={this.props.tenantLicenses.groups}
                  showHide={this.showHideAdditionalServices}
                  showEdit={this.showEditGroupServices}
                  withShowMore
                />
              ) : (
                <FormattedMessage
                  id="No_services_found"
                  defaultMessage="No services were found"
                />
              )}
              {editGroupServices && (
                <SingleEdit
                  isEditPacks
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
                  allocated={
                    this.state.groupServices[indexOfService].currentlyAllocated
                  }
                  value={
                    this.state.groupServices[indexOfService].allocated.maximum
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
              {this.props.limitedUserServicesTenant &&
              this.props.limitedUserServicesTenant.services.length ? (
                <LicensesPanel
                  licenses={this.props.limitedUserServicesTenant.services}
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
                      this.state.limitedUserServicesTenant[indexOfService].name
                    ] ||
                    this.state.limitedUserServicesTenant[indexOfService].name
                  }
                  allocated={
                    this.state.limitedUserServicesTenant[indexOfService].inUse
                  }
                  value={
                    this.state.limitedUserServicesTenant[indexOfService]
                      .allocated.maximum
                  }
                  infinity={
                    this.state.limitedUserServicesTenant[indexOfService]
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

  showEditSericePacks = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editServicePacks: true })
    );
  };

  showDeleteServicePacks = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ isDeleteServicePack: true })
    );
  };

  showEditGroupServices = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editGroupServices: true })
    );
  };

  showEditUserServices = (index) => {
    this.setState({ indexOfService: index }, () =>
      this.setState({ editUserServices: true })
    );
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

  showHideAdditionalServices = (status) => {
    this.setState({ showMore: status });
    this.props.showHideAdditionalServicesTenant(status);
  };

  showHideAdditionalUserServices = (status) => {
    this.setState({ showMoreUserServices: status });
    this.props.showHideAdditionalUserServicesTenant(status);
  };

  changeTrunkingLicenses = (value) => {
    this.setState((prevState) => ({
      trunkGroups: {
        ...prevState.trunkGroups,
        maxActiveCalls: {
          ...prevState.trunkGroups.maxActiveCalls,
          maximum: Number(value),
        },
      },
    }));
  };

  handleHide = () => {
    this.setState({ showModal: false });
    this.fetchData();
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

  changeUserServicesUnlimeted = (checked) => {
    this.setState((prevState) => ({
      limitedUserServicesTenant: [
        ...prevState.limitedUserServicesTenant.slice(
          0,
          this.state.indexOfService
        ),
        {
          ...prevState.limitedUserServicesTenant[this.state.indexOfService],
          allocated: {
            ...prevState.limitedUserServicesTenant[this.state.indexOfService]
              .allocated,
            unlimited: checked,
          },
        },
        ...prevState.limitedUserServicesTenant.slice(
          this.state.indexOfService + 1
        ),
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

  changeUserServicesMaximum = (max) => {
    this.setState((prevState) => ({
      limitedUserServicesTenant: [
        ...prevState.limitedUserServicesTenant.slice(
          0,
          this.state.indexOfService
        ),
        {
          ...prevState.limitedUserServicesTenant[this.state.indexOfService],
          allocated: {
            ...prevState.limitedUserServicesTenant[this.state.indexOfService]
              .allocated,
            maximum: Number(max),
          },
        },
        ...prevState.limitedUserServicesTenant.slice(
          this.state.indexOfService + 1
        ),
      ],
    }));
  };

  updateTrunkCapacity = () => {
    const data = {
      maxActiveCalls: this.state.trunkGroups.maxActiveCalls,
      burstingMaxActiveCalls: this.state.trunkGroups.burstingMaxActiveCalls,
    };
    this.props
      .fetchPutUpdateTrunkByTenantId(this.props.match.params.tenantId, data)
      .then(
        this.setState({ editTrunkLicenses: false, editMaxBursting: false })
      );
  };

  updateGroupServices = () => {
    const data = {
      groupServices: this.state.groupServices,
    };

    // const authorisedServices = {
    //   services: this.state.groupServices.reduce((prev, service) => {
    //     if (
    //       !(!service.allocated.unlimited && service.allocated.maximum === 0)
    //     ) {
    //       prev.push({ name: service.name });
    //       return prev;
    //     }
    //     return prev;
    //   }, [])
    // };

    this.props
      .fetchPutUpdateGroupServicesByTenantId(
        this.props.match.params.tenantId,
        data
      )
      .then(() => this.fetchData())
      .then(() => this.setState({ editGroupServices: false }));
  };

  updateUserServices = () => {
    const data = {
      userServices: this.state.limitedUserServicesTenant,
    };

    this.props
      .fetchPutUpdateGroupServicesByTenantId(
        this.props.match.params.tenantId,
        data
      )
      .then(() => this.fetchData())
      .then(() => this.setState({ editUserServices: false }));
  };

  updateServicePacks = (servicePack) => {
    let servicePackName = "";
    const dictForLicenses = {
      ...this.props.dictServicePacks,
      ...this.props.dictVirtualServicePacks,
    };
    Object.keys(dictForLicenses).forEach((key) => {
      if (dictForLicenses[key].display_name === servicePack) {
        servicePackName = key;
        return;
      }
    });
    const packs = [...this.state.servicePacks].filter(
      (pack) => pack.name === servicePackName || pack.name === servicePack
    );
    const arrayOfPromise = [];
    packs.forEach((pack) => {
      const clearPack = removeEmpty(pack);
      arrayOfPromise.push(
        this.props.fetchPutUpdateTenantServicePacks(
          this.props.match.params.tenantId,
          clearPack.name,
          clearPack
        )
      );
    });
    Promise.all(arrayOfPromise)
      .then(() => this.fetchData())
      .then(() => this.setState({ editServicePacks: false }));
  };
}

const mapStateToProps = (state) => ({
  tenantLicenses: state.tenantLicenses,
  tenantTrunkGroups: state.tenantTrunkGroups,
  tenantServicePacks: state.tenantServicePacks,
  userServices: state.userServicesTenant,
  isAuthorisedTrunkTenant: state.isAuthorisedTrunkTenant,
  selfcareUrl: state.selfcareUrl,
  tenantEntitlements: state.tenantEntitlements,
  limitedUserServicesTenant: state.limitedUserServicesTenant,
  dictServicePacks: state.dictServicePacks,
  dictUserServices: state.dictUserServices,
  dictVirtualServicePacks: state.dictVirtualServicePacks,
});

const mapDispatchToProps = {
  fetchGetTenantLicenses,
  fetchGetTrunkByTenantID,
  fetchPutUpdateTrunkByTenantId,
  fetchPutUpdateGroupServicesByTenantId,
  fetchPutUpdateTenantServicePacks,
  showHideAdditionalServicesTenant,
  fetchGetTenantEntitlements,
  fetchGetSelfcareURL,
  showHideAdditionalUserServicesTenant,
  fetchDeleteServicePacksFromTenant,
  fetchGetDictServicePacks,
  fetchGetDictUserServices,
  fetchGetDictVirtualServicePacks,
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Licenses)
);
