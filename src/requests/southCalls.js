import React, { useEffect, useState, useRef, useCallback } from "react";

import Form from "react-bootstrap/lib/Form";
import Panel from "react-bootstrap/lib/Panel";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Table from "react-bootstrap/lib/Table";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";

import {Link} from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { API_URL_PREFIX, NotificationsManager, fetch_get } from "../utils";
import { localUser } from "../utils/user";
import { Pagination } from "../utils/datatable";
import update from 'immutability-helper';
import ReactSelect from "react-select";


function search({filter, paging, sort}) {
  let url = new URL(API_URL_PREFIX + "/api/v01/apio/southbound_calls");
  url.searchParams.append('filter', JSON.stringify(filter));
  url.searchParams.append('paging', JSON.stringify(paging));
  url.searchParams.append('sorting', JSON.stringify(sort));
  return fetch_get(url);
}

export default function SouthCalls() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filter, setFilter] = useState([]);
  const [pendingFilter, setPendingFilter] = useState({});
  const [data, setData] = useState();
  const [page, setPage] = useState(1); // current page
  const [sort, setSort] = useState({field: "processing_trace_id", direction: "desc"});

  const _refresh = useCallback(() => {
    search({filter: filter, paging: {page_number: page, page_size: 50}, sort: [sort]}).then((data) => {
      setData(data);
    }).catch((error) => {
      NotificationsManager.error(
        <FormattedMessage id="fetch-error" defaultMessage="Fetch error" />,
        error.message
      );
    });
  }, [page, sort, filter]);

  useEffect(() => {
    document.title = "Southbound Calls";
    _refresh();
  }, [page, sort, filter]);

  const nbFilters = filter.length;

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="south_calls" defaultMessage="Sounthbound Calls" /></Breadcrumb.Item>
      </Breadcrumb>

      <Panel defaultExpanded={false} onToggle={e => setSearchExpanded(e)}>
        <Panel.Heading>
          <Panel.Title toggle>
            <FormattedMessage id="search" defaultMessage="Search" />{" "}
            {
              !searchExpanded && nbFilters !== 0 ?
              <Button bsStyle="info" bsSize="small">{nbFilters} <Glyphicon glyph="filter" /></Button> :
                <Glyphicon glyph="search" />
            }
            
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body collapsible>
          <Form horizontal>
            
            <SearchFilters filter={pendingFilter} onChange={setPendingFilter} />

            <FormGroup>
              <Col smOffset={1} sm={1}>
                <Button bsStyle="info" onClick={() => {
                  setPage(1);
                  setFilter(
                    Object.entries(pendingFilter)
                    .filter((a) => a[1].value !== "" && a[1].value !== null && a[1].value !== undefined)
                    .map(([k, v]) => ({field: k, op: v.op, value: v.value}))
                  );
                }}>
                  <FormattedMessage id="search" defaultMessage="Search" />
                </Button>
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Body>

          <DataTable
            data={data}
            onPageChange={setPage} />

        </Panel.Body>
      </Panel>
    </>
  )
}


function DataTable({data, onPageChange}) {
  return (
    <Form horizontal>
      <Table>
        <thead>
          <tr>
            <th><FormattedMessage id="link" defaultMessage="#" /></th>
            <th><FormattedMessage id="host" defaultMessage="Session holder / Host" /></th>
            <th><FormattedMessage id="status" defaultMessage="Status" /></th>
            <th><FormattedMessage id="method" defaultMessage="Method" /></th>
            <th><FormattedMessage id="url" defaultMessage="Url" /></th>
            <th><FormattedMessage id="created_on" defaultMessage="Created On" /></th>
          </tr>
        </thead>
        <tbody>
          {
            data?.calls.map((row, idx) => (
              <tr key={idx}>
                <td>
                  { row.instance_id ?
                    <Link to={`/transactions/${row.instance_id}`}>I{row.instance_id}</Link> :
                    <Link to={`/requests/${row.request_id}`}>R{row.request_id}</Link>
                  }
                </td>
                <td>{row.session_holder || "-"} ({row.host || "-"})</td>
                <td>{row.status}</td>
                <td>{row.method}</td>
                <td>{row.url}</td>
                <td>{localUser.localizeUtcDate(row.created_on).format()}</td>
              </tr>
            ))
          }
        </tbody>
      </Table>
      <Pagination
        onChange={({page_number}) => onPageChange(page_number)}
        page_number={data?.pagination[0]}
        page_size={data?.pagination[1]}
        num_pages={data?.pagination[2]}
        total_results={data?.pagination[3]} />
    </Form>
  )
}


function SearchFilters({filter, onChange}) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="host" defaultMessage="Host" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.host?.op || "eq"}
            onChange={e => onChange(
                !filter.host ? update(filter, {host: {$set: {op: e.target.value, value: ""}}}) :
                update(filter, {host: {$merge: {op: e.target.value}}})
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <FormControl
            type="text"
            value={filter.host?.value || ""}
            onChange={e => onChange(
              !filter.host ? update(filter, {host: {$set: {op: "eq", value: e.target.value}}}) :
              update(filter, {host: {$merge: {value: e.target.value}}})
            )} />
        </Col>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="session_holder" defaultMessage="Session holder" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.session_holder?.op || "eq"}
            onChange={e => onChange(
                !filter.session_holder ? update(filter, {session_holder: {$set: {op: e.target.value, value: ""}}}) :
                update(filter, {session_holder: {$merge: {op: e.target.value}}})
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <FormControl
            type="text"
            value={filter.session_holder?.value || ""}
            onChange={e => onChange(
              !filter.session_holder ? update(filter, {session_holder: {$set: {op: "eq", value: e.target.value}}}) :
              update(filter, {session_holder: {$merge: {value: e.target.value}}})
            )} />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="status" defaultMessage="Status" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.status?.op || "eq"}
            onChange={e => onChange(
                !filter.status ? update(filter, {status: {$set: {op: e.target.value, value: ""}}}) :
                update(filter, {status: {$merge: {op: e.target.value}}})
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
            <option value="le">&lt;=</option>
            <option value="ge">&gt;=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <FormControl
            type="text"
            value={filter.status?.value || ""}
            onChange={e => onChange(
              !filter.status ? update(filter, {status: {$set: {op: "eq", value: e.target.value && parseInt(e.target.value)}}}) :
              update(filter, {status: {$merge: {value: e.target.value && parseInt(e.target.value)}}})
            )} />
        </Col>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="method" defaultMessage="Method" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.http_method?.op || "eq"}
            onChange={e => onChange(
                !filter.http_method ? update(filter, {http_method: {$set: {op: e.target.value, value: ""}}}) :
                update(filter, {http_method: {$merge: {op: e.target.value}}})
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <ReactSelect
            value={{value: filter.http_method?.value || "", label: filter.http_method?.value || ""}}
            placeholder=""
            onChange={e => onChange(
              !filter.http_method ? update(filter, {http_method: {$set: {op: "eq", value: e.value}}}) :
              update(filter, {http_method: {$merge: {value: e.value}}})
            )}
            options={[
              {value: "", label: ""},
              {value: "GET", label: "GET"},
              {value: "POST", label: "POST"},
              {value: "PUT", label: "PUT"},
              {value: "DELETE", label: "DELETE"},
            ]} />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="url" defaultMessage="Url" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.http_url?.op || "eq"}
            onChange={e => onChange(
                !filter.http_url ? update(filter, {http_url: {$set: {op: e.target.value, value: ""}}}) :
                update(filter, {http_url: {$merge: {op: e.target.value}}})
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
            <option value="like">like</option>
          </FormControl>
        </Col>
        <Col sm={9}>
          <FormControl
            type="text"
            value={filter.http_url?.value || ""}
            onChange={e => onChange(
              !filter.http_url ? update(filter, {http_url: {$set: {op: "eq", value: e.target.value}}}) :
              update(filter, {http_url: {$merge: {value: e.target.value}}}))} />
        </Col>
      </FormGroup>
    </>
  );
}


function useCountdown({ seconds, onComplete, onTick, enable }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const intervalRef = useRef();

  useEffect(() => {
    if (!enable) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(timeLeft => {
        if (timeLeft > 1) {
          onTick && onTick(timeLeft - 1);
          return timeLeft - 1;
        }
        clearInterval(intervalRef.current);
        onComplete && onComplete();
        if (enable) {
          return seconds;
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds, onComplete, onTick, enable]);

  return timeLeft;
}
