import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";

import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Pagination from "react-bootstrap/lib/Pagination";
import { FormattedMessage } from "react-intl";
import {
  fetchGetResellerAdmins,
  fetchPostAddResellerAdmin,
} from "../../../../store/actions";

import { countsPerPages } from "../../../../constants";
import Admin from "./Admin";
import Loading from "../../../../common/Loading";
import AddAdminModal from "./AddEditAdmin";

const Admins = () => {
  const params = useParams();

  const resellerAdmins = useSelector((state) => state.resellerAdmins);

  const dispatch = useDispatch();
  //const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [countPerPage, setCountPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [adminsState, setResellersState] = useState(resellerAdmins);
  const [paginationAdmins, setPaginationAdmins] = useState([]);
  const [countPages, setCountPages] = useState(null);
  const [sortedBy, setSortedBy] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = () => {
    setIsLoading(true);
    dispatch(fetchGetResellerAdmins(params.resellerName)).then(() =>
      setIsLoading(false)
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setResellersState(resellerAdmins);
  }, [resellerAdmins]);

  useEffect(() => {
    pagination();
  }, [adminsState, countPerPage]);

  const pagination = () => {
    const countPages = Math.ceil(adminsState.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = adminsState.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = adminsState.slice(counter, counter + countPerPage);
        paginationItems.push(item);
      }
      counter = counter + countPerPage;
    }
    setPaginationAdmins(paginationItems);
    setCountPages(countPages);
  };

  const changeCoutOnPage = (e) => {
    setCountPerPage(Number(e.target.value));
    setPage(0);
  };

  const sort = (sortBy) => {
    const tempResellers = [...adminsState];
    if (sortedBy === sortBy) {
      const resellerSorted = tempResellers.reverse();
      setResellersState(resellerSorted);
    } else {
      const resellerSorted = tempResellers.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1;
        if (a[sortBy] > b[sortBy]) return 1;
        return 0;
      });
      setResellersState(resellerSorted);
      setSortedBy(sortBy);
    }
  };

  const filterBySearchValue = (searchValue) => {
    const searchArray = [...resellerAdmins].filter(
      (admin) =>
        admin.username.toLowerCase().includes(searchValue.toLowerCase()) ||
        admin?.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
        admin?.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
        admin?.language.toLowerCase().includes(searchValue.toLowerCase())
    );
    setResellersState(searchArray);
  };

  const incrementPage = () => {
    if (page >= countPages - 1) {
      return;
    }
    setPage(page + 1);
  };

  const decrementPage = () => {
    if (page === 0) {
      return;
    }
    setPage(page - 1);
  };

  const createAdmin = ({ data, callback }) => {
    dispatch(fetchPostAddResellerAdmin(params.resellerName, data)).then(
      (isSuccess) => {
        callback && callback();
        if (isSuccess === "success") {
          setShowAddModal(false);
          fetchData();
        }
      }
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className={"panel-body"}>
        <Row className={"margin-top-2"}>
          <Col md={11}>
            <InputGroup>
              <InputGroup.Addon>
                <Glyphicon glyph="lyphicon glyphicon-search" />
              </InputGroup.Addon>
              <FormattedMessage
                id="search_placeholder"
                defaultMessage="Username, first name, last name, language"
              >
                {(placeholder) => (
                  <FormControl
                    type="text"
                    placeholder={placeholder}
                    onChange={(e) => filterBySearchValue(e.target.value)}
                  />
                )}
              </FormattedMessage>
            </InputGroup>
          </Col>
          <Col md={1}>
            <Glyphicon
              className={"x-large"}
              onClick={() => setShowAddModal(true)}
              glyph="glyphicon glyphicon-plus-sign"
            />
            {showAddModal && (
              <AddAdminModal
                show={showAddModal}
                mode="Create"
                onClose={() => setShowAddModal(false)}
                onSubmit={createAdmin}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div className="flex flex-row flex-end-center indent-top-bottom-1">
              <div>Item per page</div>
              <FormControl
                componentClass="select"
                defaultValue={countPerPage}
                style={{ display: "inline", width: "auto" }}
                className={"margin-left-1"}
                onChange={changeCoutOnPage}
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
        {paginationAdmins.length ? (
          <React.Fragment>
            <Row>
              <Col md={12}>
                <Table hover>
                  <thead>
                    <tr>
                      <th>
                        <FormattedMessage
                          id="username"
                          defaultMessage="Username"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("username")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="firstName"
                          defaultMessage="First name"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("firstName")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="lastName"
                          defaultMessage="Last name"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("lastName")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="language"
                          defaultMessage="Language"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("language")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="userLevel"
                          defaultMessage="User level"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("userLevel")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="userProfileType"
                          defaultMessage="User profile type"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("userProfileType")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="tenantId"
                          defaultMessage="Tenant ID"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("tenantId")}
                        />
                      </th>
                      <th style={{ width: "4%" }} />
                      <th style={{ width: "4%" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginationAdmins[page].map((admin) => (
                      <Admin
                        key={admin.username}
                        admin={admin}
                        onReload={fetchData}
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
                    <Pagination.Prev onClick={decrementPage} />
                    <Pagination.Item>{page + 1}</Pagination.Item>
                    <Pagination.Next onClick={incrementPage} />
                  </Pagination>
                </div>
              </Col>
            </Row>
          </React.Fragment>
        ) : (
          <Col md={10}>
            <FormattedMessage
              id="notFound"
              defaultMessage="No admins were found"
            />
          </Col>
        )}
      </div>
    </>
  );
};

export default Admins;
