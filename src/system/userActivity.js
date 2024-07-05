import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import queryString from "query-string";
import { API_URL_PREFIX, AuthServiceManager, NotificationsManager, fetch_get } from "../utils";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Table from "react-bootstrap/lib/Table";
import Alert from "react-bootstrap/lib/Alert";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import ReactSelect from "react-select";
import { FormattedMessage } from "react-intl";
import update from "immutability-helper";
import { localUser } from "../utils/user";
import { Pagination } from "../utils/datatable";
import moment from "moment";
import ReactDatePicker from "react-datepicker";
import { faSort, faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function search({ filter, paging, sort }) {
  let url = new URL(API_URL_PREFIX + "/api/v01/system/users/activity");
  url.searchParams.append('filter', JSON.stringify(filter));
  url.searchParams.append('paging', JSON.stringify(paging));
  url.searchParams.append('sorting', JSON.stringify(sort));
  return fetch_get(url);
}

function prepareExportUrl(filter, sort) {
  let url = new URL(API_URL_PREFIX + "/api/v01/system/users/activity?as=csv");
  url.searchParams.append('filter', JSON.stringify(filter));
  url.searchParams.append('sorting', JSON.stringify(sort));
  return url;
}

const defaultFilter = {timestamp: { op: "between", value: moment().subtract(24, 'hour').format(), value2: moment().format() }}

function UsersActivity() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filter, setFilter] = useState(pendingFilterToFilter(defaultFilter));
  const [pendingFilter, setPendingFilter] = useState(defaultFilter);
  const [data, setData] = useState();
  const [page, setPage] = useState(1); // current page
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState({ field: "timestamp", direction: "desc" });
  const [exportUrl, setExportUrl] = useState();

  const _refresh = useCallback(() => {
    setLoading(true);
    search({ filter: filter, paging: { page_number: page, page_size: 50 }, sort: [sort] }).then((data) => {
      setData(data);
      setExportUrl(prepareExportUrl(filter, sort));
    }).catch((error) => {
      NotificationsManager.error(
        <FormattedMessage id="fetch-error" defaultMessage="Fetch error" />,
        error.message
      );
    }).finally(() => {
      setLoading(false);
    });
  }, [page, sort, filter]);

  useEffect(() => {
    document.title = "Users Activity";
    _refresh();
  }, [page, sort, filter]);

  const nbFilters = filter.length;

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="users" defaultMessage="Users" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="activity" defaultMessage="Activity" /></Breadcrumb.Item>
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
                <Button
                  bsStyle="info"
                  disabled={loading}
                  onClick={() => {
                    setPage(1);
                    setFilter(pendingFilterToFilter(pendingFilter));
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
          {
            loading && (
              <Alert bsStyle="info">
                <FormattedMessage id="loading" defaultMessage="Loading..." />
              </Alert>
            )
          }

          <DataTable
            data={data}
            onPageChange={setPage}
            onSort={setSort} />

        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Body>
          <Button
            bsStyle="primary"
            onClick={() => {
              exportUrl && AuthServiceManager.getValidToken().then(token => {
                window.location = `${exportUrl}&auth_token=${token}`
              })
            }}
            disabled={!exportUrl}
          >
            <FormattedMessage id="export" defaultMessage="Export" />
          </Button>
        </Panel.Body>
      </Panel>
    </>
  )
}

function pendingFilterToFilter(pendingFilter) {
  return Object.entries(pendingFilter)
    .filter((a) => {
      return a[1].value !== "" && a[1].value !== null && a[1].value !== undefined && (!(a[1].value instanceof Array) || a[1].value.length > 0)
    })
    .map(([k, v]) => {
      if (v.value instanceof Array) {
        if (v.op === "eq") {
          return { "or": v.value.map(vv => ({ field: k, op: v.op, value: vv })) }
        } else if (v.op === "ne") {
          return { "and": v.value.map(vv => ({ field: k, op: v.op, value: vv })) }
        }
      }
      else if (v.op === "between") {
        return {
          "and": [
            {
              field: k,
              op: "ge",
              value: moment.parseZone(v.value).utc().format()
            },
            {
              field: k,
              op: "le",
              value: moment.parseZone(v.value2 || v.value).utc().format()
            }
          ]
        };
      }
      return { field: k, op: v.op, value: v.value }
    })
}

function TableHead({ data, field, onSort, children }) {
  const renderSortIcon = field => {
    const e = data?.sorting.find(s => s.field === field);
    return <FontAwesomeIcon icon={e === undefined ? faSort : e.direction === "desc" ? faSortDown : faSortUp} />
  };

  const getSortDirection = field => {
    const e = data?.sorting.find(s => s.field === field);
    return (e === undefined || e.direction === 'desc') ? 'asc' : 'desc';
  };

  return (
    <th
      onClick={() =>
        onSort({
          field: field,
          direction: getSortDirection(field),
        })}
    >
      {children}
      <span className="pull-right">
        {renderSortIcon(field)}
      </span>
    </th>
  )
}

function DataTable({ data, onPageChange, onSort }) {
  return (
    <Form horizontal>
      <Table>
        <thead>
          <tr>
            <th><FormattedMessage id="username" defaultMessage="Username" /></th>
            <TableHead
              data={data}
              field={"timestamp"}
              onSort={onSort}
            >
              <FormattedMessage id="timestamp" defaultMessage="Timestamp" />
            </TableHead>
            <th><FormattedMessage id="method" defaultMessage="Method" /></th>
            <TableHead
              data={data}
              field={"service"}
              onSort={onSort}
            >
              <FormattedMessage id="service" defaultMessage="Service" />
            </TableHead>
            <th />
          </tr>
        </thead>
        <tbody>
          {
            data?.recs.map((row, i) => (
              <tr key={i}>
                <td>{row.username}</td>
                <td>{localUser.localizeUtcDate(row.ts).format()}</td>
                <td>{row.method.toUpperCase()}</td>
                <td>{row.service}</td>
                <td>
                  <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(composeRowFilter(row))
                    })
                  }} role="button">
                    <Button bsStyle="primary" style={{ marginLeft: '5px', marginRight: '5px' }}>
                      <Glyphicon glyph="send" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          }
        </tbody>
      </Table>
      <Pagination
        onChange={({ page_number }) => onPageChange(page_number)}
        page_number={data?.pagination[0]}
        page_size={data?.pagination[1]}
        num_pages={data?.pagination[2]}
        total_results={data?.pagination[3]} />
    </Form>
  )
}

function composeRowFilter({ username, service, method, ts }) {
  let r = {};
  if (username) {
    r["owner"] = { model: 'instances', value: username, op: 'eq' };
  }

  if (method) {
    r["request_method"] = { model: 'requests', value: method.toLowerCase(), op: 'eq' };
  }

  if (service) {
    r["request_url"] = { model: 'requests', value: `%/services/${service}/%`, op: 'like' };
  }

  if (ts) {
    let ts1 = moment.parseZone(ts).utc()
    let ts2 = ts1.clone().add(1, 'hour')
    r["created_on"] = { model: 'requests', value: ts1.format(), value2: ts2.format(), op: 'between' };
  }

  return r;
}

function SearchFilters({ filter, onChange }) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="username" defaultMessage="Username" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.username?.op || "eq"}
            onChange={e => onChange(
              !filter.username ? update(filter, { username: { $set: { op: e.target.value, value: "" } } }) :
                update(filter, { username: { $merge: { op: e.target.value } } })
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <FormControl
            type="text"
            value={filter.username?.value || ""}
            onChange={e => onChange(
              !filter.username ? update(filter, { username: { $set: { op: "eq", value: e.target.value } } }) :
                update(filter, { username: { $merge: { value: e.target.value } } })
            )} />
        </Col>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="service" defaultMessage="Service" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.service?.op || "eq"}
            onChange={e => onChange(
              !filter.service ? update(filter, { service: { $set: { op: e.target.value, value: "" } } }) :
                update(filter, { service: { $merge: { op: e.target.value } } })
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <FormControl
            type="text"
            value={filter.service?.value || ""}
            onChange={e => onChange(
              !filter.service ? update(filter, { service: { $set: { op: "eq", value: e.target.value } } }) :
                update(filter, { service: { $merge: { value: e.target.value } } })
            )} />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="method" defaultMessage="Method" />
        </Col>
        <Col sm={1}>
          <FormControl
            componentClass="select"
            value={filter.method?.op || "eq"}
            onChange={e => onChange(
              !filter.method ? update(filter, { method: { $set: { op: e.target.value, value: "" } } }) :
                update(filter, { method: { $merge: { op: e.target.value } } })
            )}>
            <option value="eq">==</option>
            <option value="ne">!=</option>
          </FormControl>
        </Col>
        <Col sm={3}>
          <ReactSelect
            isMulti={true}
            isClearable={true}
            value={filter.method?.value ? filter.method?.value.map(m => ({ value: m, label: m.toUpperCase() })) : []}
            placeholder=""
            onChange={v => onChange(
              !filter.method ? update(filter, { method: { $set: { op: "eq", value: v.map(e => e.value) } } }) :
                update(filter, { method: { $merge: { value: v.map(e => e.value) } } })
            )}
            onClear={() => onChange(update(filter, { method: { $set: null } }))}
            options={[
              { value: "", label: "" },
              { value: "get", label: "GET" },
              { value: "post", label: "POST" },
              { value: "put", label: "PUT" },
              { value: "delete", label: "DELETE" },
            ]} />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={1}>
          <FormattedMessage id="timestamp" defaultMessage="Timestamp" />
        </Col>
        <Col sm={8} smOffset={1}>
          <ReactDatePicker
            className="form-control"
            selected={filter.timestamp?.value ? localUser.localizeUtcDate(filter.timestamp?.value).toDate() : null}
            onChange={date => onChange(
              !filter.timestamp ? update(filter, { timestamp: { $set: { op: "between", value: date || "", value2: date || "" } } }) :
                update(filter, { timestamp: { $merge: { value: date || "" } } })
            )}
            dateFormat="dd/MM/yyyy HH:mm"
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={60} />
          {" - "}
          <ReactDatePicker
            className="form-control"
            selected={filter.timestamp?.value2 ? localUser.localizeUtcDate(filter.timestamp?.value2).toDate() : null}
            onChange={date => onChange(
              !filter.timestamp ? update(filter, { timestamp: { $set: { op: "between", value: date || "", value2: date || "" } } }) :
                update(filter, { timestamp: { $merge: { value2: date || "" } } })
            )}
            dateFormat="dd/MM/yyyy HH:mm"
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={60} />
        </Col>
      </FormGroup>
    </>
  );
}

export default UsersActivity;