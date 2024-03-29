import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Button from "react-bootstrap/lib/Button";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Pagination from "react-bootstrap/lib/Pagination";

import { FormattedMessage } from "react-intl";

import {
  fetchGetUserServicesByUserId,
  fetchPostAssignUserServicePacks,
  fetchDeleteAssignUserServicePacks,
  fetchGetDictServicePacks,
  fetchGetDictVirtualServicePacks,
} from "../../../../store/actions";
import { countsPerPages } from "../../../../constants";

import Loading from "../../../../common/Loading";
import Service from "./Service";

export class Services extends Component {
  state = {
    services: [],
    paginationServices: [],
    isLoading: true,
    sortedBy: "",
    countPerPage: 25,
    page: 0,
    pagination: true,
    countPages: null,
    searchValue: "",
    showDelete: false,
    servicesForDelete: [],
    postServices: false,
    deleteServices: false,
    updateMessage: "",
    isLoadingServicePacksDict: false,
    isLoadingVirtualServicePacksDict: false,
  };

  fetchServices = () => {
    this.setState({ isLoadingServicePacksDict: true }, () =>
      this.props
        .fetchGetDictServicePacks()
        .then(() => this.setState({ isLoadingServicePacksDict: false }))
    );
    this.setState({ isLoadingVirtualServicePacksDict: true }, () =>
      this.props
        .fetchGetDictVirtualServicePacks()
        .then(() => this.setState({ isLoadingVirtualServicePacksDict: false }))
    );
    return this.props
      .fetchGetUserServicesByUserId(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        this.props.match.params.userName
      )
      .then((data) =>
        this.setState(
          {
            services: this.props.userServicePacks.sort((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            }),
            isLoading: data ? false : true,
            sortedBy: "name",
          },
          () => this.pagination()
        )
      );
  };

  componentDidMount() {
    this.fetchServices();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (!prevState.postServices && this.state.postServices) ||
      (!prevState.deleteServices && this.state.deleteServices)
    ) {
      this.fetchServices().then(() =>
        this.setState({
          postServices: false,
          deleteServices: false,
          updateMessage: "Service Packs is updated",
        })
      );
    }

    if (
      this.props.refreshTab !== prevProps.refreshTab &&
      this.props.refreshTab
    ) {
      this.setState({ isLoading: true }, () => this.fetchServices());
    }
  }

  render() {
    const {
      isLoading,
      countPerPage,
      paginationServices,
      page,
      updateMessage,
      isLoadingServicePacksDict,
      isLoadingVirtualServicePacksDict,
    } = this.state;
    if (
      isLoading ||
      isLoadingServicePacksDict ||
      isLoadingVirtualServicePacksDict
    ) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <Row className={"margin-top-2"}>
          <Col mdOffset={1} md={10}>
            <InputGroup>
              <InputGroup.Addon>
                <Glyphicon glyph="lyphicon glyphicon-search" />
              </InputGroup.Addon>
              <FormattedMessage
                id="search_placeholder"
                defaultMessage="Service"
              >
                {(placeholder) => (
                  <FormControl
                    type="text"
                    value={this.state.searchValue}
                    placeholder={placeholder}
                    onChange={(e) =>
                      this.setState(
                        {
                          searchValue: e.target.value,
                        },
                        () => this.filterBySearchValue()
                      )
                    }
                  />
                )}
              </FormattedMessage>
            </InputGroup>
          </Col>
          <Col md={1}>
            {/* <Glyphicon
              className={"x-large"}
              glyph="glyphicon glyphicon-plus-sign"
            /> */}
          </Col>
        </Row>
        {paginationServices.length ? (
          <React.Fragment>
            <Row>
              <Col mdOffset={1} md={10}>
                <div className={"flex space-between indent-top-bottom-1"}>
                  <div className={"flex align-items-center"}>
                    <Checkbox
                      className={"margin-checbox"}
                      checked={this.state.selectAll}
                      onChange={this.handleSelectAllClick}
                    >
                      assign/deassign all
                    </Checkbox>
                  </div>
                  <div className={"flex align-items-center"}>
                    <div>Item per page</div>
                    <FormControl
                      componentClass="select"
                      defaultValue={countPerPage}
                      style={{ display: "inline", width: "auto" }}
                      className={"margin-left-1"}
                      onChange={this.changeCoutOnPage}
                    >
                      {countsPerPages.map((counts) => (
                        <option key={counts.value} value={counts.value}>
                          {counts.title}
                        </option>
                      ))}
                    </FormControl>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col mdOffset={1} md={10}>
                <Table hover>
                  <thead>
                    <tr>
                      <th style={{ width: "85%" }}>
                        <FormattedMessage
                          id="tenant-id"
                          defaultMessage="Service"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={this.sortByName}
                        />
                      </th>
                      <th style={{ width: "15%" }}>
                        <FormattedMessage id="name" defaultMessage="Assigned" />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={this.sortByServiceChecked}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginationServices[page].map((service, i) => (
                      <Service
                        key={service.name}
                        index={i}
                        tenantId={this.props.tenantId}
                        service={service}
                        handleSingleCheckboxClick={
                          this.handleSingleCheckboxClick
                        }
                        onReload={() =>
                          this.props.fetchGetUserServicesByUserId(
                            this.props.match.params.tenantId,
                            this.props.match.params.groupId,
                            this.props.match.params.userName
                          )
                        }
                        dict={{
                          ...this.props.dictServicePacks,
                          ...this.props.dictVirtualServicePacks,
                        }}
                      />
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row>
              <Col md={11}>
                <div className="flex flex-row flex-end-center">
                  <Pagination className={"indent-top-bottom-1"}>
                    <Pagination.Prev onClick={this.decrementPage} />
                    <Pagination.Item>{this.state.page + 1}</Pagination.Item>
                    <Pagination.Next onClick={this.incrementPage} />
                  </Pagination>
                </div>
              </Col>
            </Row>
            {updateMessage && (
              <Row className={"indent-top-bottom-1"}>
                <Col mdOffset={9} md={3}>
                  <HelpBlock
                    bsClass={`${
                      updateMessage === "Loading..."
                        ? "color-info"
                        : "color-success"
                    }`}
                  >
                    {updateMessage}
                  </HelpBlock>
                </Col>
              </Row>
            )}
            <Row className={"indent-top-bottom-1"}>
              <Col mdOffset={9} md={2}>
                <div className="button-row">
                  <div className="pull-right">
                    <Button
                      onClick={this.updateSevices}
                      className="btn-primary"
                    >
                      <Glyphicon glyph="glyphicon glyphicon-ok" /> UPDATE
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </React.Fragment>
        ) : (
          <Col mdOffset={1} md={10}>
            <FormattedMessage
              id="notFound"
              defaultMessage="No service packs found"
            />
          </Col>
        )}
      </React.Fragment>
    );
  }

  updateSevices = () => {
    const { services } = this.state;
    const servicesToPost = services
      .filter((service) => service.serviceChecked === true)
      .map((service) => {
        let data = { name: service.name };
        return data;
      });
    const postData = {
      servicePacks: servicesToPost,
    };
    const servicesToDelete = services
      .filter((service) => service.serviceChecked === false)
      .map((service) => {
        let data = { name: service.name };
        return data;
      });
    const deleteData = {
      servicePacks: servicesToDelete,
    };
    this.setState({ updateMessage: "Loading..." }, () => {
      this.props
        .fetchPostAssignUserServicePacks(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.userName,
          postData
        )
        .then(() => this.setState({ postServices: true }));
      this.props
        .fetchDeleteAssignUserServicePacks(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.userName,
          deleteData
        )
        .then(() => this.setState({ deleteServices: true }));
    });
  };

  changeCoutOnPage = (e) => {
    this.setState({ countPerPage: Number(e.target.value), page: 0 }, () =>
      this.pagination()
    );
  };

  incrementPage = () => {
    if (this.state.page >= this.state.countPages - 1) {
      return;
    }
    this.setState({ page: this.state.page + 1 });
  };

  decrementPage = () => {
    if (this.state.page === 0) {
      return;
    }
    this.setState({ page: this.state.page - 1 });
  };

  pagination = () => {
    const { countPerPage, services } = this.state;
    const countPages = Math.ceil(services.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = services.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = services.slice(counter, counter + countPerPage);
        paginationItems.push(item);
      }
      counter = counter + countPerPage;
    }

    this.setState({
      paginationServices: paginationItems,
      pagination: false,
      countPages,
      page: this.state.page,
    });
  };

  handleSelectAllClick = (e) => {
    const isChecked = e.target.checked;
    const newArr = this.state.services.map((el) => ({
      ...el,
      serviceChecked: isChecked,
    }));
    this.setState({ services: newArr, selectAll: !this.state.selectAll }, () =>
      this.pagination()
    );
  };

  handleSingleCheckboxClick = (index) => {
    const newArr = this.state.services.map((el, i) => ({
      ...el,
      serviceChecked: index === i ? !el.serviceChecked : el.serviceChecked,
    }));
    this.setState({ services: newArr, selectAll: false }, () =>
      this.pagination()
    );
  };

  filterBySearchValue = () => {
    const { searchValue } = this.state;
    const SearchArray = this.props.userServicePacks
      .filter((service) =>
        service.name.toLowerCase().includes(searchValue.toLowerCase())
      )
      .map((service) => service);
    this.setState({ services: SearchArray }, () => this.pagination());
  };

  sortByName = () => {
    const { services, sortedBy } = this.state;
    if (sortedBy === "name") {
      const servicesSorted = services.reverse();
      this.setState({ services: servicesSorted }, () => this.pagination());
    } else {
      const servicesSorted = services.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      this.setState({ services: servicesSorted, sortedBy: "name" }, () =>
        this.pagination()
      );
    }
  };

  sortByServiceChecked = () => {
    const { services, sortedBy } = this.state;
    if (sortedBy === "serviceChecked") {
      const servicesSorted = services.reverse();
      this.setState({ services: servicesSorted }, () => this.pagination());
    } else {
      const servicesSorted = services.sort((a, b) => {
        if (a.serviceChecked < b.serviceChecked) return 1;
        if (a.serviceChecked > b.serviceChecked) return -1;
        return 0;
      });
      this.setState(
        { services: servicesSorted, sortedBy: "serviceChecked" },
        () => this.pagination()
      );
    }
  };
}

const mapStateToProps = (state) => ({
  userServicePacks: state.userServicePacks,
  dictServicePacks: state.dictServicePacks,
  dictVirtualServicePacks: state.dictVirtualServicePacks,
});

const mapDispatchToProps = {
  fetchGetUserServicesByUserId,
  fetchPostAssignUserServicePacks,
  fetchDeleteAssignUserServicePacks,
  fetchGetDictServicePacks,
  fetchGetDictVirtualServicePacks,
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Services)
);
