import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

import {
  fetchGetTenants,
  refuseCreateTenant,
  fetchGetSelfcareURL,
} from "../../store/actions";

import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Pagination from "react-bootstrap/lib/Pagination";
import { FormattedMessage } from "react-intl";

import Loading from "../../common/Loading";

import Tenant from "./Tenant";
import { countsPerPages } from "../../constants";

class Tenants extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      tenants: [],
      paginationTenants: [],
      searchValue: "",
      sortedBy: null,
      isLoading: true,
      countPerPage: 25,
      page: 0,
      pagination: true,
      countPages: null,
    };
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  fetchRequsts = () => {
    this.setState({ isLoading: true }, () =>
      this.props.fetchGetTenants(this.cancelLoad).then(() => {
        const sortedTenants = [...this.props.tenants];
        this.setState(
          {
            tenants: sortedTenants.sort((a, b) => {
              if (a.tenantId < b.tenantId) return -1;
              if (a.tenantId > b.tenantId) return 1;
              return 0;
            }),
            sortedBy: "id",
            isLoading: false,
          },
          () => this.pagination()
        );
      })
    );
    this.props.refuseCreateTenant();
    this.props.fetchGetSelfcareURL();
  };

  componentDidMount() {
    this.fetchRequsts();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.gwName !== this.props.match.params.gwName) {
      this.fetchRequsts();
    }
    if (prevProps.tenants.length !== this.props.tenants.length) {
      const sortedTenants = [...this.props.tenants];
      this.setState({ isLoading: true }, () =>
        this.setState(
          {
            tenants: sortedTenants.sort((a, b) => {
              if (a.tenantId < b.tenantId) return -1;
              if (a.tenantId > b.tenantId) return 1;
              return 0;
            }),
            sortedBy: "id",
            isLoading: false,
          },
          () => this.pagination()
        )
      );
    }
  }

  render() {
    const { countPerPage, paginationTenants, page } = this.state;

    if (this.state.isLoading) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <div className={"header"}>Tenant overview</div>
        </div>
        <div className={"panel-body"}>
          <Row>
            <Col mdOffset={1} md={10}>
              <InputGroup>
                <InputGroup.Addon>
                  <Glyphicon glyph="lyphicon glyphicon-search" />
                </InputGroup.Addon>
                <FormattedMessage
                  id="search_placeholder"
                  defaultMessage="Tenant ID or Name or Type or Resellers"
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
              <Link
                to={`/provisioning/${this.props.match.params.gwName}/tenants/add`}
              >
                <Glyphicon
                  className={"x-large"}
                  glyph="glyphicon glyphicon-plus-sign"
                />
              </Link>
            </Col>
          </Row>
          <Row>
            <Col md={11}>
              <div className="flex flex-row flex-end-center indent-top-bottom-1">
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
            </Col>
          </Row>
          {paginationTenants.length ? (
            <React.Fragment>
              <Row>
                <Col mdOffset={1} md={10}>
                  <Table hover>
                    <thead>
                      <tr>
                        <th style={{ width: "19%" }}>
                          <FormattedMessage
                            id="tenant-id"
                            defaultMessage="ID"
                          />
                          <Glyphicon
                            glyph="glyphicon glyphicon-sort"
                            onClick={this.sortByID}
                          />
                        </th>
                        <th style={{ width: "19%" }}>
                          <FormattedMessage id="name" defaultMessage="Name" />
                          <Glyphicon
                            glyph="glyphicon glyphicon-sort"
                            onClick={this.sortByName}
                          />
                        </th>
                        <th style={{ width: "19%" }}>
                          <FormattedMessage id="type" defaultMessage="Type" />
                          <Glyphicon
                            glyph="glyphicon glyphicon-sort"
                            onClick={this.sortByType}
                          />
                        </th>
                        {this.props?.config?.reseller?.tenant && (
                          <th style={{ width: "19%" }}>
                            <FormattedMessage
                              id="reseller"
                              defaultMessage="Reseller"
                            />
                            <Glyphicon
                              glyph="glyphicon glyphicon-sort"
                              onClick={this.sortByReseller}
                            />
                          </th>
                        )}
                        <th style={{ width: "19%" }}>
                          <FormattedMessage id="sync" defaultMessage="Sync" />
                          <Glyphicon
                            glyph="glyphicon glyphicon-sort"
                            onClick={this.sortBySync}
                          />
                        </th>
                        <th style={{ width: "4%" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {paginationTenants[page].map((t) => (
                        <Tenant
                          key={t.tenantId}
                          t={t}
                          onReload={this.fetchRequsts}
                          showReseller={this.props?.config?.reseller?.tenant}
                          {...this.props}
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
            </React.Fragment>
          ) : (
            <Col mdOffset={1} md={10}>
              <FormattedMessage
                id="notFound"
                defaultMessage="No tenants were found"
              />
            </Col>
          )}
        </div>
      </React.Fragment>
    );
  }

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
    const { countPerPage, tenants } = this.state;
    const countPages = Math.ceil(tenants.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = tenants.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = tenants.slice(counter, counter + countPerPage);
        paginationItems.push(item);
      }
      counter = counter + countPerPage;
    }

    this.setState({
      paginationTenants: paginationItems,
      pagination: false,
      countPages,
      page: this.state.page,
    });
  };

  filterBySearchValue = () => {
    const { searchValue } = this.state;
    const SearchArray = this.props.tenants
      .filter(
        (tennant) =>
          tennant.tenantId.toLowerCase().includes(searchValue.toLowerCase()) ||
          tennant.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          tennant.type.toLowerCase().includes(searchValue.toLowerCase()) ||
          tennant?.resellerId?.toLowerCase().includes(searchValue.toLowerCase())
      )
      .map((tenant) => tenant);
    this.setState({ tenants: SearchArray }, () => {
      const tenansSorted = this.state.tenants.sort((a, b) => {
        if (a.tenantId < b.tenantId) return -1;
        if (a.tenantId > b.tenantId) return 1;
        return 0;
      });
      this.setState({ tenants: tenansSorted, sortedBy: "id" }, () =>
        this.pagination()
      );
    });
  };

  sortByID = () => {
    const { tenants, sortedBy } = this.state;
    if (sortedBy === "id") {
      const tenansSorted = tenants.reverse();
      this.setState({ tenants: tenansSorted }, () => this.pagination());
    } else {
      const tenansSorted = tenants.sort((a, b) => {
        if (a.tenantId < b.tenantId) return -1;
        if (a.tenantId > b.tenantId) return 1;
        return 0;
      });
      this.setState({ tenants: tenansSorted, sortedBy: "id" }, () =>
        this.pagination()
      );
    }
  };

  sortByName = () => {
    const { tenants, sortedBy } = this.state;
    if (sortedBy === "name") {
      const tenansSorted = tenants.reverse();
      this.setState({ tenants: tenansSorted }, () => this.pagination());
    } else {
      const tenansSorted = tenants.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      this.setState({ tenants: tenansSorted, sortedBy: "name" }, () =>
        this.pagination()
      );
    }
  };

  sortByType = () => {
    const { tenants, sortedBy } = this.state;
    if (sortedBy === "type") {
      const tenansSorted = tenants.reverse();
      this.setState({ tenants: tenansSorted }, () => this.pagination());
    } else {
      const tenansSorted = tenants.sort((a, b) => {
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        return 0;
      });
      this.setState({ tenants: tenansSorted, sortedBy: "type" }, () =>
        this.pagination()
      );
    }
  };

  sortByReseller = () => {
    const { tenants, sortedBy } = this.state;
    if (sortedBy === "resellerId") {
      const tenansSorted = tenants.reverse();
      this.setState({ tenants: tenansSorted }, () => this.pagination());
    } else {
      const tenansSorted = tenants.sort((a, b) => {
        if (!a.resellerId && b.resellerId) return -1;
        if (a.resellerId && !b.resellerId) return 1;

        if (a.resellerId < b.resellerId) return -1;
        if (a.resellerId > b.resellerId) return 1;
        return 0;
      });
      this.setState({ tenants: tenansSorted, sortedBy: "resellerId" }, () =>
        this.pagination()
      );
    }
  };

  sortBySync = () => {
    const { tenants, sortedBy } = this.state;
    if (sortedBy === "sync") {
      const tenansSorted = tenants.reverse();
      this.setState({ tenants: tenansSorted }, () => this.pagination());
    } else {
      const notSyncTenants = tenants.filter((el) => !el.sync);
      const tenantsSorted = tenants
        .filter((el) => el.sync)
        .sort((a, b) => {
          if (a.sync.ldap < b.sync.ldap) return -1;
          if (a.sync.ldap > b.sync.ldap) return 1;
          return 0;
        });
      this.setState(
        { tenants: [...tenantsSorted, ...notSyncTenants], sortedBy: "sync" },
        () => this.pagination()
      );
    }
  };
}

const mapDispatchToProps = {
  fetchGetTenants,
  refuseCreateTenant,
  fetchGetSelfcareURL,
};

const mapStateToProps = (state) => ({
  tenants: state.tenants,
  config: state.selfcareUrl,
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Tenants)
);
