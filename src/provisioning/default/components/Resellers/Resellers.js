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
import { fetchGetResellers, fetchPostAddReseller } from "../../store/actions";

import { countsPerPages } from "../../constants";
import Reseller from "./Reseller";
import Loading from "../../common/Loading";
import AddResellerModal from "./AddModifyReseller";

const Resellers = () => {
  const params = useParams();

  const resellers = useSelector((state) => state.resellers);

  const dispatch = useDispatch();
  //const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [countPerPage, setCountPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [resellersState, setResellersState] = useState(resellers);
  const [paginationResellers, setPaginationPlatforms] = useState([]);
  const [countPages, setCountPages] = useState(null);
  const [sortedBy, setSortedBy] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = () => {
    setIsLoading(true);
    dispatch(fetchGetResellers()).then(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setResellersState(resellers);
  }, [resellers]);

  useEffect(() => {
    pagination();
  }, [resellersState, countPerPage]);

  const pagination = () => {
    const countPages = Math.ceil(resellersState.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = resellersState.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = resellersState.slice(counter, counter + countPerPage);
        paginationItems.push(item);
      }
      counter = counter + countPerPage;
    }
    setPaginationPlatforms(paginationItems);
    setCountPages(countPages);
  };

  const changeCoutOnPage = (e) => {
    setCountPerPage(Number(e.target.value));
    setPage(0);
  };

  const changeDefault = (name) => {
    // setIsLoading(true);
    // dispatch(
    //   fetchPutUpdateCallRecordingPlatform({ name, data: { default: true } })
    // ).then(() => {
    //   dispatch(fetchGetCallRecordingPlatforms()).then(() =>
    //     setIsLoading(false)
    //   );
    // });
  };

  const sort = (sortBy) => {
    const tempResellers = [...resellersState];
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
    const searchArray = [...resellers].filter(
      (reseller) =>
        reseller.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        reseller?.externalName.toLowerCase().includes(searchValue.toLowerCase())
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

  const createReseller = ({ data, callback }) => {
    dispatch(fetchPostAddReseller(data)).then((isSuccess) => {
      callback && callback();
      if (isSuccess === "success") {
        setShowAddModal(false);
        fetchData();
      }
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className={"panel-heading"}>
        <div className={"header"}>Resellers</div>
      </div>
      <div className={"panel-body"}>
        <Row className={"margin-top-2"}>
          <Col md={11}>
            <InputGroup>
              <InputGroup.Addon>
                <Glyphicon glyph="lyphicon glyphicon-search" />
              </InputGroup.Addon>
              <FormattedMessage
                id="search_placeholder"
                defaultMessage="Name, external name"
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
              <AddResellerModal
                show={showAddModal}
                mode="Create"
                onClose={() => setShowAddModal(false)}
                onSubmit={createReseller}
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
        {paginationResellers.length ? (
          <React.Fragment>
            <Row>
              <Col md={12}>
                <Table hover>
                  <thead>
                    <tr>
                      <th>
                        <FormattedMessage id="name" defaultMessage="Name" />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("name")}
                        />
                      </th>
                      <th>
                        <FormattedMessage
                          id="externalName"
                          defaultMessage="External name"
                        />
                        <Glyphicon
                          glyph="glyphicon glyphicon-sort"
                          onClick={() => sort("externalName")}
                        />
                      </th>
                      <th style={{ width: "4%" }} />
                      <th style={{ width: "4%" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {paginationResellers[page].map((reseller) => (
                      <Reseller
                        key={reseller.name}
                        reseller={reseller}
                        changeDefault={changeDefault}
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
              defaultMessage="No resellers were found"
            />
          </Col>
        )}
      </div>
    </>
  );
};

export default Resellers;
