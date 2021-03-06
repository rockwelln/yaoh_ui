import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Pagination from "react-bootstrap/lib/Pagination";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";

import { NotificationsManager } from "../../../../../../utils";

import { FormattedMessage } from "react-intl";

import deepEqual from "../../../deepEqual";

import {
  fetchGetPhoneNumbersByGroupId,
  fetchPutUpdateNumbersStatus,
  fetchGetPhoneNumbersWithRefreshDB
} from "../../../../store/actions";

import Loading from "../../../../common/Loading";
import PhoneNumber from "./PhoneNumber";
import DeleteModal from "./DeleteMultipleNumbers";
import { countsPerPages } from "../../../../constants";

import { isAllowed, pages } from "../../../../../../utils/user";

import "./styles.css";

export class PhoneNumbersTab extends Component {
  state = {
    searchValue: "",
    phoneNumbers: [],
    sortedBy: "",
    isLoading: true,
    selectAll: false,
    selectAllPreActive: false,
    selectAllActive: false,
    numbersForDelete: [],
    showDelete: false,
    paginationPhoneNumbers: [],
    countPerPage: 25,
    page: 0,
    pagination: true,
    countPages: null,
    showWithStatus: false,
    showRefreshAllDialog: false,
    disableDialogButtons: false,
    disabledUpdateStatusActive: false,
    disabledUpdateStatusPreActive: false
  };

  fetchGetNumbers() {
    this.props
      .fetchGetPhoneNumbersByGroupId(this.props.tenantId, this.props.groupId)
      .then(() =>
        this.setState(
          {
            phoneNumbers: this.props.phoneNumbers.sort((a, b) => {
              if (a.rangeStart < b.rangeStart) return -1;
              if (a.rangeStart > b.rangeStart) return 1;
              return 0;
            }),
            isLoading: false,
            sortedBy: "rangeStart"
          },
          () => this.pagination()
        )
      );
  }

  componentDidMount() {
    this.fetchGetNumbers();
  }

  componentDidUpdate(prevProps) {
    if (!deepEqual(prevProps.phoneNumbers, this.props.phoneNumbers)) {
      this.setState(
        {
          phoneNumbers: this.props.phoneNumbers.sort((a, b) => {
            if (a.rangeStart < b.rangeStart) return -1;
            if (a.rangeStart > b.rangeStart) return 1;
            return 0;
          }),
          isLoading: false,
          sortedBy: "rangeStart"
        },
        () => this.pagination()
      );
    }
  }

  render() {
    const {
      isLoading,
      numbersForDelete,
      showDelete,
      countPerPage,
      pagination,
      paginationPhoneNumbers,
      page
    } = this.state;

    if (isLoading && pagination) {
      return <Loading />;
    }
    return (
      <React.Fragment>
        <Row className={"margin-top-2 flex align-items-center"}>
          <Col mdOffset={1} md={10}>
            <InputGroup className={"margin-left-negative-4"}>
              <InputGroup.Addon>
                <Glyphicon glyph="lyphicon glyphicon-search" />
              </InputGroup.Addon>
              <FormattedMessage
                id="search_placeholder_numbers"
                defaultMessage="Numbers"
              >
                {placeholder => (
                  <FormControl
                    type="text"
                    value={this.state.searchValue}
                    placeholder={placeholder}
                    onChange={e =>
                      this.setState(
                        {
                          searchValue: e.target.value
                        },
                        () => this.filterBySearchValue()
                      )
                    }
                  />
                )}
              </FormattedMessage>
            </InputGroup>
          </Col>
          {isAllowed(localStorage.getItem("userProfile"), pages.add_access) && (
            <Col md={1}>
              <Link
                to={`/provisioning/${this.props.match.params.gwName}/tenants/${this.props.tenantId}/groups/${this.props.groupId}/addphone`}
              >
                <Glyphicon
                  className={"x-large"}
                  glyph="glyphicon glyphicon-plus-sign"
                />
              </Link>
            </Col>
          )}
        </Row>
        {/* {paginationPhoneNumbers.length ? ( */}
        <React.Fragment>
          <Row>
            <Col mdOffset={1} md={10}>
              <div className={"flex space-between indent-top-bottom-1"}>
                <div className={"flex align-items-center"}>
                  {/* <Checkbox
                      className={"margin-checbox"}
                      checked={this.state.selectAll}
                      onChange={this.handleSelectAllClick}
                    >
                      (Un)select all shown numbers
                    </Checkbox> */}
                  {isAllowed(
                    localStorage.getItem("userProfile"),
                    pages.delete_access
                  ) && (
                    <div
                      onClick={this.deleteSlectedNumbers}
                      className={
                        "cursor-pointer padding-left-05 flex text-align-center align-items-center margin-right-1"
                      }
                    >
                      <Glyphicon
                        glyph="glyphicon glyphicon-trash"
                        className={"margin-right-1"}
                        onClick={this.deleteSlectedNumbers}
                      />
                      <div>Delete selected numbers</div>
                    </div>
                  )}
                  <DeleteModal
                    rangeStart={numbersForDelete.map(
                      number => number.phoneNumbers || number.phoneNumber
                    )}
                    show={showDelete}
                    onClose={e => {
                      this.fetchGetNumbers();
                      this.setState({ showDelete: false, selectAll: false });
                    }}
                    {...this.props}
                  />
                  <Button
                    onClick={this.updateStatus}
                    className={"btn-primary margin-right-1"}
                    disabled={
                      this.state.disabledUpdateStatusActive ||
                      this.state.disabledUpdateStatusPreActive
                    }
                  >
                    <FormattedMessage
                      id="updateStatus"
                      defaultMessage="Update Status"
                    />
                  </Button>
                  <Button
                    onClick={this.refreshInformation}
                    className={"btn-primary margin-right-1"}
                  >
                    <FormattedMessage
                      id="refreshInformation"
                      defaultMessage="Refresh information"
                    />
                  </Button>
                  <Button
                    onClick={() =>
                      this.setState({ showRefreshAllDialog: true })
                    }
                    className={"btn-primary margin-right-1"}
                  >
                    <FormattedMessage
                      id="refreshAll"
                      defaultMessage="Refresh all"
                    />
                  </Button>
                </div>
                <Modal show={this.state.showRefreshAllDialog}>
                  <Modal.Header>
                    <Modal.Title>Refresh All</Modal.Title>
                  </Modal.Header>

                  <Modal.Body>This activity could take a long time</Modal.Body>

                  <Modal.Footer>
                    <Button
                      onClick={() =>
                        this.setState({ showRefreshAllDialog: false })
                      }
                      disabled={this.state.disableDialogButtons}
                    >
                      Close
                    </Button>
                    <Button
                      disabled={this.state.disableDialogButtons}
                      onClick={this.refreshAll}
                      bsStyle="primary"
                    >
                      OK
                    </Button>
                  </Modal.Footer>
                </Modal>

                <div className={"flex align-items-center"}>
                  <div>Item per page</div>
                  <FormControl
                    componentClass="select"
                    defaultValue={countPerPage}
                    style={{ display: "inline", width: "auto" }}
                    className={"margin-left-1"}
                    onChange={this.changeCoutOnPage}
                  >
                    {countsPerPages.map(counts => (
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
                    <th>
                      <Checkbox
                        className={"margin-0 height-20"}
                        checked={this.state.selectAll}
                        onChange={this.handleSelectAllClick}
                      />
                    </th>
                    <React.Fragment>
                      <th>
                        <Checkbox
                          className={"margin-0"}
                          checked={this.state.selectAllActive}
                          onChange={this.handleSelectAllClickActive}
                        >
                          <div className={"font-weight-bold"}>
                            <FormattedMessage
                              id="activate"
                              defaultMessage="Activate"
                            />
                          </div>
                        </Checkbox>
                      </th>
                      <th>
                        <Checkbox
                          className={"margin-0"}
                          checked={this.state.selectAllPreActive}
                          onChange={this.handleSelectAllClickPreActive}
                        >
                          <div className={"font-weight-bold"}>
                            <FormattedMessage
                              id="pre-activate"
                              defaultMessage="Pre-activate"
                            />
                          </div>
                        </Checkbox>
                      </th>
                    </React.Fragment>
                    <th>
                      <FormattedMessage
                        id="tenant-id"
                        defaultMessage="Range start"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={this.sortByRangeStart}
                      />
                    </th>
                    <th>
                      <FormattedMessage id="name" defaultMessage="Range end" />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={this.sortByRangeEnd}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="mainNumber"
                        defaultMessage="Main Number"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={this.sortByMainNumber}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="maintenanceNumber"
                        defaultMessage="Maintenance Number"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={this.sortByMaintenanceNumber}
                      />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {!!paginationPhoneNumbers.length &&
                    paginationPhoneNumbers[page].map((number, i) => (
                      <PhoneNumber
                        index={i}
                        key={i}
                        number={number}
                        showWithStatus={this.state.showWithStatus}
                        handleSingleCheckboxClick={
                          this.handleSingleCheckboxClick
                        }
                        handleSingleCheckboxClickActive={
                          this.handleSingleCheckboxClickActive
                        }
                        handleSingleCheckboxClickPreActive={
                          this.handleSingleCheckboxClickPreActive
                        }
                        onReload={() => this.fetchGetNumbers()}
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
        {/* ) : (
          <Col mdOffset={1} md={10}>
            <FormattedMessage
              id="notFound"
              defaultMessage="No phone numbers were found"
            />
          </Col>
        )} */}
      </React.Fragment>
    );
  }

  refreshAll = () => {
    this.setState({ disableDialogButtons: true }, () =>
      this.props
        .fetchGetPhoneNumbersWithRefreshDB(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          "refresh_db=true"
        )
        .then(() =>
          this.setState({
            showRefreshAllDialog: false,
            disableDialogButtons: false
          })
        )
    );
  };

  refreshInformation = () => {
    const { phoneNumbers } = this.state;
    const numbersForRefresh = [];
    phoneNumbers.map(phone => {
      if (!!phone.phoneChecked) {
        numbersForRefresh.push(phone.phoneNumber);
      }
      return 0;
    });
    if (!numbersForRefresh.length) {
      NotificationsManager.error(
        <FormattedMessage
          id="notSelectedNumbers"
          defaultMessage="Numbers is not selcted"
        />,
        "Please select numbers at first"
      );
      return;
    }
    const queryNumbers = numbersForRefresh.reduce(
      (numbersString, number) =>
        (numbersString = `${numbersString}&only_for_numbers=${number}`),
      ""
    );
    const queryString = `refresh_db=true${queryNumbers}`;
    this.props.fetchGetPhoneNumbersWithRefreshDB(
      this.props.match.params.tenantId,
      this.props.match.params.groupId,
      queryString
    );
  };

  updateStatus = () => {
    const activeNumbers = this.state.phoneNumbers.filter(
      el => el.active && el.isChanged
    );
    const preActiveNumbers = this.state.phoneNumbers.filter(
      el => el.preActive && el.isChanged
    );
    console.log(activeNumbers, preActiveNumbers);
    const allActiveNumbers = [];
    const allPreActiveNumbers = [];
    activeNumbers.map(el => {
      allActiveNumbers.push(el.phoneNumber);
      return 0;
    });
    preActiveNumbers.map(el => {
      allPreActiveNumbers.push(el.phoneNumber);
      return 0;
    });
    const activeData = {
      numbers: allActiveNumbers.map(number => ({ phoneNumber: number })),
      status: "active"
    };
    const preActiveData = {
      numbers: allPreActiveNumbers.map(number => ({ phoneNumber: number })),
      status: "preActive"
    };
    this.setState({
      disabledUpdateStatusActive: !!allActiveNumbers.length,
      disabledUpdateStatusPreActive: !!allPreActiveNumbers.length
    });
    allActiveNumbers.length &&
      this.props
        .fetchPutUpdateNumbersStatus(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          activeData
        )
        .then(() => this.setState({ disabledUpdateStatusActive: false }));
    allPreActiveNumbers.length &&
      this.props
        .fetchPutUpdateNumbersStatus(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          preActiveData
        )
        .then(() => this.setState({ disabledUpdateStatusPreActive: false }));
  };

  getNumbersWithStatus = () => {
    this.props
      .fetchGetPhoneNumbersByGroupId(
        this.props.tenantId,
        this.props.groupId,
        true
      )
      .then(() =>
        this.setState(
          {
            phoneNumbers: this.props.phoneNumbers.sort((a, b) => {
              if (a.rangeStart < b.rangeStart) return -1;
              if (a.rangeStart > b.rangeStart) return 1;
              return 0;
            }),
            isLoading: false,
            sortedBy: "rangeStart",
            showWithStatus: true
          },
          () => this.pagination()
        )
      );
  };

  changeCoutOnPage = e => {
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
    const { countPerPage, phoneNumbers } = this.state;
    const countPages = Math.ceil(phoneNumbers.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = phoneNumbers.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = phoneNumbers.slice(counter, counter + countPerPage);
        paginationItems.push(item);
      }
      counter = counter + countPerPage;
    }

    this.setState({
      paginationPhoneNumbers: paginationItems,
      pagination: false,
      countPages,
      page: this.state.page
    });
  };

  filterBySearchValue = () => {
    const { searchValue } = this.state;
    const SearchArray = this.props.phoneNumbers
      .filter(
        phone =>
          phone.rangeStart.toLowerCase().includes(searchValue.toLowerCase()) ||
          phone.rangeEnd.toLowerCase().includes(searchValue.toLowerCase()) ||
          (phone.userId &&
            phone.userId.toLowerCase().includes(searchValue.toLowerCase())) ||
          (phone.userType &&
            phone.userType.toLowerCase().includes(searchValue.toLowerCase()))
      )
      .map(phone => phone);
    this.setState({ phoneNumbers: SearchArray }, () => this.pagination());
  };

  sortByRangeStart = () => {
    const { phoneNumbers, sortedBy } = this.state;
    if (sortedBy === "rangeStart") {
      const phonesSorted = phoneNumbers.reverse();
      this.setState({ phoneNumbers: phonesSorted }, () => this.pagination());
    } else {
      const phonesSorted = phoneNumbers.sort((a, b) => {
        if (a.rangeStart < b.rangeStart) return -1;
        if (a.rangeStart > b.rangeStart) return 1;
        return 0;
      });
      this.setState(
        { phoneNumbers: phonesSorted, sortedBy: "rangeStart" },
        () => this.pagination()
      );
    }
  };

  sortByRangeEnd = () => {
    const { phoneNumbers, sortedBy } = this.state;
    if (sortedBy === "rangeEnd") {
      const phonesSorted = phoneNumbers.reverse();
      this.setState({ phoneNumbers: phonesSorted }, () => this.pagination());
    } else {
      const phonesSorted = phoneNumbers.sort((a, b) => {
        if (a.rangeEnd < b.rangeEnd) return -1;
        if (a.rangeEnd > b.rangeEnd) return 1;
        return 0;
      });
      this.setState({ phoneNumbers: phonesSorted, sortedBy: "rangeEnd" }, () =>
        this.pagination()
      );
    }
  };

  sortByMainNumber = () => {
    const { phoneNumbers, sortedBy } = this.state;
    if (sortedBy === "main_number") {
      const phonesSorted = phoneNumbers.reverse();
      this.setState({ phoneNumbers: phonesSorted }, () => this.pagination());
    } else {
      const phonesSorted = phoneNumbers.sort((a, b) => {
        if (a.main_number > b.main_number) return -1;
        if (a.main_number < b.main_number) return 1;
        return 0;
      });
      this.setState(
        {
          phoneNumbers: phonesSorted,
          sortedBy: "main_number"
        },
        () => this.pagination()
      );
    }
  };

  sortByMaintenanceNumber = () => {
    const { phoneNumbers, sortedBy } = this.state;
    if (sortedBy === "maintenance_number") {
      const phonesSorted = phoneNumbers.reverse();
      this.setState({ phoneNumbers: phonesSorted }, () => this.pagination());
    } else {
      const phonesSorted = phoneNumbers.sort((a, b) => {
        if (a.maintenance_number > b.maintenance_number) return -1;
        if (a.maintenance_number < b.maintenance_number) return 1;
        return 0;
      });
      this.setState(
        {
          phoneNumbers: phonesSorted,
          sortedBy: "maintenance_number"
        },
        () => this.pagination()
      );
    }
  };

  deleteSlectedNumbers = () => {
    const { phoneNumbers } = this.state;
    const numbersForDelete = phoneNumbers.filter(phone => {
      return !!phone.phoneChecked;
    });
    this.setState({ numbersForDelete, showDelete: true });
  };

  handleSelectAllClickPreActive = e => {
    const isChecked = e.target.checked;
    const newArr = this.state.phoneNumbers.map(el => ({
      ...el,
      preActive: isChecked,
      active: !isChecked,
      isChanged: !el.isChanged
    }));
    this.setState(
      {
        phoneNumbers: newArr,
        selectAllPreActive: !this.state.selectAllPreActive,
        selectAllActive: this.state.selectAllPreActive
      },
      () => this.pagination()
    );
  };

  handleSelectAllClickActive = e => {
    const isChecked = e.target.checked;
    const newArr = this.state.phoneNumbers.map(el => ({
      ...el,
      active: isChecked,
      preActive: !isChecked,
      isChanged: !el.isChanged
    }));
    this.setState(
      {
        phoneNumbers: newArr,
        selectAllActive: !this.state.selectAllActive,
        selectAllPreActive: this.state.selectAllActive
      },
      () => this.pagination()
    );
  };

  handleSelectAllClick = e => {
    const isChecked = e.target.checked;
    const newArr = this.state.phoneNumbers.map(el => ({
      ...el,
      phoneChecked: isChecked
    }));
    this.setState(
      { phoneNumbers: newArr, selectAll: !this.state.selectAll },
      () => this.pagination()
    );
  };

  handleSingleCheckboxClick = index => {
    const newArr = this.state.phoneNumbers.map((el, i) => ({
      ...el,
      phoneChecked: index === i ? !el.phoneChecked : el.phoneChecked
    }));
    this.setState({ phoneNumbers: newArr, selectAll: false }, () =>
      this.pagination()
    );
  };
  handleSingleCheckboxClickActive = index => {
    const newArr = this.state.phoneNumbers.map((el, i) => ({
      ...el,
      active: index === i ? !el.active : el.active,
      preActive: index === i ? !el.preActive : el.preActive,
      isChanged: index === i ? !el.isChanged : el.isChanged
    }));
    this.setState({ phoneNumbers: newArr, selectAllActive: false }, () =>
      this.pagination()
    );
  };

  handleSingleCheckboxClickPreActive = index => {
    const newArr = this.state.phoneNumbers.map((el, i) => ({
      ...el,
      preActive: index === i ? !el.preActive : el.preActive,
      active: index === i ? !el.active : el.active,
      isChanged: index === i ? !el.isChanged : el.isChanged
    }));
    this.setState({ phoneNumbers: newArr, selectAllPreActive: false }, () =>
      this.pagination()
    );
  };
}

const mapStateToProps = state => ({
  phoneNumbers: state.phoneNumbersByGroup
});

const mapDispatchToProps = {
  fetchGetPhoneNumbersByGroupId,
  fetchPutUpdateNumbersStatus,
  fetchGetPhoneNumbersWithRefreshDB
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(PhoneNumbersTab)
);
