import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useHistory, useParams } from "react-router";
import { Link } from "react-router-dom";

import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Pagination from "react-bootstrap/lib/Pagination";
import { FormattedMessage } from "react-intl";
import {
  fetchGetCallRecordingPlatforms,
  fetchPutUpdateCallRecordingPlatform,
} from "../../../../../store/actions";

import { countsPerPages } from "../../../../../constants";
import Platform from "./Platform";
import Loading from "../../../../../common/Loading";

const Platforms = () => {
  const params = useParams();

  const callRecordingPlatforms = useSelector(
    (state) => state.callRecordingPlatforms
  );

  const dispatch = useDispatch();
  //const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [countPerPage, setCountPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [platforms, setPlatforms] = useState(callRecordingPlatforms);
  const [paginationPlatforms, setPaginationPlatforms] = useState([]);
  const [countPages, setCountPages] = useState(null);
  const [sortedBy, setSortedBy] = useState("");

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchGetCallRecordingPlatforms()).then(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setPlatforms(callRecordingPlatforms);
  }, [callRecordingPlatforms]);

  useEffect(() => {
    pagination();
  }, [platforms, countPerPage]);

  const pagination = () => {
    const countPages = Math.ceil(platforms.length / countPerPage);

    let paginationItems = [];
    let counter = 0;

    for (let i = 0; i < countPages; i++) {
      if (i === 0) {
        const item = platforms.slice(0, countPerPage);
        paginationItems.push(item);
      } else {
        const item = platforms.slice(counter, counter + countPerPage);
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
    setIsLoading(true);
    dispatch(
      fetchPutUpdateCallRecordingPlatform({ name, data: { default: true } })
    ).then(() => {
      dispatch(fetchGetCallRecordingPlatforms()).then(() =>
        setIsLoading(false)
      );
    });
  };

  const sort = (sortBy) => {
    const tempPlatforms = [...platforms];
    if (sortedBy === sortBy) {
      const platformsSorted = tempPlatforms.reverse();
      setPlatforms(platformsSorted);
    } else {
      const platformsSorted = tempPlatforms.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1;
        if (a[sortBy] > b[sortBy]) return 1;
        return 0;
      });
      setPlatforms(platformsSorted);
      setSortedBy(sortBy);
    }
  };

  const filterBySearchValue = (searchValue) => {
    const searchArray = [...callRecordingPlatforms].filter(
      (platform) =>
        platform.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        platform.netAddress.toLowerCase().includes(searchValue.toLowerCase())
    );
    setPlatforms(searchArray);
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Row className={"margin-top-2"}>
        <Col md={11}>
          <InputGroup>
            <InputGroup.Addon>
              <Glyphicon glyph="lyphicon glyphicon-search" />
            </InputGroup.Addon>
            <FormattedMessage
              id="search_placeholder"
              defaultMessage="Platform Name, Net Address"
            >
              {(placeholder) => (
                <FormControl
                  type="text"
                  //value={searchValue}
                  placeholder={placeholder}
                  onChange={(e) => filterBySearchValue(e.target.value)}
                />
              )}
            </FormattedMessage>
          </InputGroup>
        </Col>
        <Col md={1}>
          <Link
            to={`/provisioning/${params.gwName}/tenants/${params.tenantId}/addgroup`}
          >
            <Glyphicon
              className={"x-large"}
              glyph="glyphicon glyphicon-plus-sign"
            />
          </Link>
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
      {paginationPlatforms.length ? (
        <React.Fragment>
          <Row>
            <Col md={12}>
              <Table hover>
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>
                      <FormattedMessage id="default" defaultMessage="Default" />
                    </th>
                    <th>
                      <FormattedMessage id="name" defaultMessage="Name" />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("name")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="netAddress"
                        defaultMessage="Net address"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("netAddress")}
                      />
                    </th>
                    <th>
                      <FormattedMessage id="port" defaultMessage="Port" />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("port")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="mediaStream"
                        defaultMessage="Media stream"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("mediaStream")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="description"
                        defaultMessage="Description"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("description")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="transportProtocol"
                        defaultMessage="Transport protocol"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("transportProtocol")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="schemaVersion"
                        defaultMessage="Schema version"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("schemaVersion")}
                      />
                    </th>
                    <th>
                      <FormattedMessage
                        id="supportVideoRecording"
                        defaultMessage="Support video recording"
                      />
                      <Glyphicon
                        glyph="glyphicon glyphicon-sort"
                        onClick={() => sort("supportVideoRecording")}
                      />
                    </th>
                    <th style={{ width: "4%" }} />
                    <th style={{ width: "4%" }} />
                  </tr>
                </thead>
                <tbody>
                  {paginationPlatforms[page].map((platform) => (
                    <Platform
                      key={platform.name}
                      platform={platform}
                      changeDefault={changeDefault}
                      //onReload={() => this.fetchReq()}
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
            defaultMessage="No groups were found"
          />
        </Col>
      )}
    </>
  );
};

export default Platforms;
