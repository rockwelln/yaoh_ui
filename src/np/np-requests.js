import React, { Component } from 'react';

import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';

import {
  API_URL_PREFIX, AuthServiceManager, fetch_get, userLocalizeUtcDate
} from "../utils";
import { fetchOperators } from "./data/operator_mgm";
import { ApioDatatable } from "../utils/datatable";

import 'react-datepicker/dist/react-datepicker.css';
import {
  needActionCriteria,
} from "../requests/requests";
import update from 'immutability-helper';
import {localUser, modules} from "../utils/user";
import {fetchRoles} from "../system/user_roles";

export const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';


export const needApprovalCriteria = {
  approval: {
    'or': [
      {
        'and': [
          { model: 'NPRequest', field: 'kind', value: 'PortIn', op: 'eq' },
          { model: 'Context', field: 'key', value: 'manual_rfs', op: 'eq' },
          { model: 'Context', field: 'value', value: 'waiting', op: 'eq' },
        ]
      },
      {
        'and': [
          { model: 'NPRequest', field: 'kind', value: 'PortOut', op: 'eq' },
          { model: 'Context', field: 'key', value: 'donor_approval', op: 'eq' },
          { model: 'Context', field: 'value', value: 'waiting', op: 'eq' },
        ]
      },
    ]
  }
};


export const waitForIVR = {
  wait_ivr: {
    'and': [
      { model: 'NPRequest', field: 'kind', value: 'PortIn', op: 'eq' },
      { model: 'Task', field: 'cell_id', value: 'Wait for IVR', op: 'eq' },
      { model: 'Task', field: 'status', value: 'WAIT', op: 'eq' },
    ]
  }
};


export const errorCriteria = {
  task_status: { model: 'Task', value: 'ERROR', op: 'eq' }
};

export const activeCriteria = {
  status: { model: 'ActivityInstance', value: 'ACTIVE', op: 'eq' }
};

export const numberCriteria = (number_) => (
  { number: { model: 'NPRequestRange', value: number_, op: 'eq' } }
);

export const getIcon = (k) => {
  switch (k) {
    case "PortIn": return <Glyphicon glyph="arrow-right" title="PortIn" />;
    case "PortOut": return <Glyphicon glyph="arrow-left" title="PortOut" />;
    case "Disconnect": return <Glyphicon glyph="scissors" title="Disconnect" />;
    case "Update": return <Glyphicon glyph="save" title="Update" />;
    case "Broadcast": return <Glyphicon glyph="save" title="Broadcast" />;
    case "ChangeOfInstallationAddress": return <Glyphicon glyph="envelope" title="ChangeOfInstallationAddress" />;
    default: return "";
  }
};

function fetchRequestStatuses(onSuccess) {
  return fetch_get("/api/v01/npact/np_requests/statuses")
    .then(d => onSuccess(d.statuses.sort((a, b) => a.localeCompare(b))))
    .catch(error => console.error(error));
}

export class NPRequests extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      filter_criteria: NPRequests.criteria_from_params(this.props.location.search),
      paging_info: {
        page_number: 1, page_size: 50
      },
      sorting_spec: [{
        model: 'NPRequest', field: 'created_on', direction: 'desc'
      }],

      requests: [],
      request_statuses: [],
      operators: [],
      roles: [],
      pagination: {
        page_number: 1,
        num_pages: 1,
      },
      error: undefined,
    };
    this._refresh = this._refresh.bind(this);
    this._prepare_url = this._prepare_url.bind(this);
    this._refreshOperators = this._refreshOperators.bind(this);
  }

  static default_criteria() {
    return {
      kind: { model: 'NPRequest', value: '', op: 'eq' },
      number: { model: 'NPRequestRange', value: '', op: 'eq' },
      crdc_id: { model: 'NPRequest', value: '', op: 'eq' },
      acbis_porting_id: { model: 'NPRequest', value: '', op: 'eq' },
      status: { model: 'ActivityInstance', value: '', op: 'eq' },
      request_status: { model: 'NPRequest', value: '', op: 'eq' },
      donor_id: { model: 'NPRequest', value: '', op: 'eq' },
      recipient_id: { model: 'NPRequest', value: '', op: 'eq' },
      customer_id: { model: 'NPRequest', value: '', op: 'eq' },
      created_on: { model: 'NPRequest', value: '', op: 'ge' },
      due_date: { model: 'NPRequest', value: '', op: 'ge' },
      b2b: { model: 'NPRequest', value: '', op: 'eq' },
      role_id: { model: 'manual_actions', value: '', op: 'eq' },
      task_status: localUser.isSystem() ? undefined : errorCriteria.task_status,
      action_status: undefined,
    }
  }

  static criteria_from_params(url_params) {
    const params = queryString.parse(url_params);
    let custom_params = {};
    if (params.filter !== undefined) {
      try {
        custom_params = JSON.parse(params.filter);
      } catch (e) { console.error(e) }
    }
    return update(
      NPRequests.default_criteria(),
      { $merge: custom_params }
    );
  }

  _refreshOperators() {
    fetchOperators(
      this.props.auth_token,
      data => !this.cancelLoad && this.setState({ operators: data }),
      error => console.log(error)
    )
  }

  componentDidMount() {
    document.title = "Requests";
    fetchRoles(roles => this.setState({roles: roles}));
    fetchRequestStatuses(s => this.setState({request_statuses: s}))
    this._refreshOperators();
    this._refresh();
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.pathname === this.props.location.pathname &&
      nextProps.location.search !== this.props.location.search) {
      this.setState({
        filter_criteria: NPRequests.criteria_from_params(nextProps.location.search)
      });
    }
  }

  // componentWillUpdate(nextProps, nextState) {
  //   if (JSON.stringify(nextState.filter_criteria) !== JSON.stringify(this.state.filter_criteria)) {
  //     setTimeout(() => this._refresh(), 800);
  //   }
  // }

  _prepare_url(paging_spec, sorting_spec, format) {
    let url = new URL(API_URL_PREFIX + '/api/v01/npact/np_requests/search');
    // filter
    const { filter_criteria } = this.state;
    let filter_spec = Object.keys(filter_criteria)
      .filter(f =>
        filter_criteria[f] &&
        (
          (filter_criteria[f].value && filter_criteria[f].op && (typeof(filter_criteria[f].value) !== "object" || filter_criteria[f].value.length !== 0)) ||
          filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_null' || typeof (filter_criteria[f].value) === 'boolean'
        )
      )
      .map(f => {
        let {model, op, value} = filter_criteria[f];
        if(op === "like" && !value.includes("%")) {
          value = "%" + value.trim() + "%";
        }

        switch (f) {
          case 'number':
            // special handling to look into the ranges of the requests
            return {
              'or': [
                {
                  model: model,
                  field: 'range_from',
                  op: op,
                  value: value.trim()
                },
                {
                  model: model,
                  field: 'range_to',
                  op: op,
                  value: value.trim()
                }
              ]
            };
          case 'task_status':
          case 'action_status':
            return {
              model: model,
              field: 'status',
              op: op,
              value: value,
            }
          case 'request_status':
            return op === "eq" ? {
              "or": value.map(v =>
                ({
                  model: model,
                  field: 'status',
                  op: op,
                  value: v,
                }),
              )
            } : {
              "and": value.map(v =>
                ({
                  model: model,
                  field: 'status',
                  op: op,
                  value: v,
                }),
              )
            };
          case 'role_id':
            return { "and": [
                {
                    model: model,
                    field: f,
                    op: op,
                    value: value
                },
                {
                    model: "manual_actions",
                    field: "output",
                    op: "is_null"
                }
            ]};
          case 'created_on':
          case 'due_date':
            return {
                model: model,
                field: f,
                op: op,
                value: moment.parseZone(value).utc().format()
            };
          case 'approval':
          case 'wait_ivr':
            return filter_criteria[f];
          case 'b2b':
            return {
              model: model, // needed in multi-model query
              field: f,
              op: op,
              value: value
            };
          default:
            return {
              model: model, // needed in multi-model query
              field: f,
              op: op,
              value: typeof value === "string" ? value.trim() : value
            }
        }
      });
    url.searchParams.append('filter', JSON.stringify(filter_spec));
    // paging
    if (paging_spec !== undefined) {
      url.searchParams.append('paging', JSON.stringify(paging_spec));
    }
    //sorting
    if (sorting_spec !== undefined) {
      url.searchParams.append('sorting', JSON.stringify(sorting_spec));
    }
    //formatting
    if (format !== undefined) {
      url.searchParams.append('as', format);
    }
    //full listing
    const qs = queryString.parse(this.props.location.search);
    if (qs.full) {
      url.searchParams.append('full', '1');
    }
    return url;
  }

  _refresh(p, s) {
    let { paging_info, sorting_spec, filter_criteria } = this.state;
    // override paging and sorting if needed
    if (p !== undefined) {
      paging_info = update(this.state.paging_info, { $merge: p });
    }
    if (s !== undefined) {
      sorting_spec = [s];
    }

    // get the export URL
    const url = this._prepare_url(paging_info, sorting_spec);
    let export_url = this._prepare_url(undefined, sorting_spec, 'csv');
    // export_url.searchParams.append('auth_token', this.props.auth_token);

    //reset collection
    this.setState({ requests: undefined });

    fetch_get(url, this.props.auth_token)
      .then(data => {
        if (this.cancelLoad) return;
        // devnote: save in the history the search.
        const filter_spec = Object.keys(filter_criteria)
          .filter(f => filter_criteria[f] && (
            (filter_criteria[f].value && filter_criteria[f].op) ||
            filter_criteria[f].or ||
            filter_criteria[f].and ||
            filter_criteria[f].in ||
            filter_criteria[f].op === 'is_null' ||
            filter_criteria[f].op === 'is_not_null'
          )).reduce((obj, key) => {
            obj[key] = filter_criteria[key];
            return obj;
          }, {});

        if (Object.keys(filter_spec).length !== 0) {
          const search_str = queryString.stringify(
            {
              filter: JSON.stringify(filter_spec),
              paging_info: paging_info, // not used: RFU
              sorting_spec: sorting_spec // not used: RFU
            }
          );
          this.props.history.push(this.props.location.pathname + '?' + search_str);
        }

        this.setState({
          requests: data.requests,
          pagination: {
            page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
            page_size: data.pagination[1],
            num_pages: data.pagination[2],
            total_results: data.pagination[3],
          },
          sorting_spec: data.sorting || [],
          export_url: export_url.href
        });
      })
      .catch(error => !this.cancelLoad && this.setState({ error: error }));
  }

  render() {
    const { filter_criteria, requests, operators, export_url, roles } = this.state;
    const { user_info } = this.props;
    requests && requests.forEach(r => {
      const donor = operators.find(o => o.id === r.nprequest.donor_id);
      const recipient = operators.find(o => o.id === r.nprequest.recipient_id);
      r.donor_name = donor ? donor.name : 'n/a';
      r.recipient_name = recipient ? recipient.name : 'n/a';
    });
    const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment.utc(filter_criteria.created_on.value).isValid();
    const invalid_due_date = filter_criteria.due_date.value.length !== 0 && !moment.utc(filter_criteria.due_date.value).isValid();
    const manualActions = user_info.modules && user_info.modules.includes(modules.manualActions);

    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="porting-requests" defaultMessage="Porting Requests" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel defaultExpanded={false} >
          <Panel.Heading>
            <Panel.Title toggle><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number" defaultMessage="Number" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.number.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    value={filter_criteria.number.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="kind" defaultMessage="Kind" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.kind.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { kind: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <Select
                    isClearable
                    value={{value: filter_criteria.kind.value, label: filter_criteria.kind.value}}
                    name="kind"
                    options={["Disconnect", "PortIn", "PortOut", "Update", "Broadcast"].map(k => ({value: k, label: k}))}
                    onChange={v => {
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { kind: { $merge: { value: v ? v.value: "" } } })
                      })
                    }}
                    className="basic-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="porting-id" defaultMessage="Porting ID" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.crdc_id.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { crdc_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    value={filter_criteria.crdc_id.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { crdc_id: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="workflow-status" defaultMessage="Workflow status" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.status.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { status: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <Select
                    isClearable
                    value={{value: filter_criteria.status.value, label: filter_criteria.status.value}}
                    name="status"
                    options={["ACTIVE", "CLOSED_IN_SUCCESS", "CLOSED_IN_ERROR"].map(k => ({value: k, label: k}))}
                    onChange={v => {
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { status: { $merge: { value: v ? v.value : "" } } })
                      })
                    }}
                    className="basic-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="request-status" defaultMessage="Request status" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.request_status.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { request_status: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <Select
                    isMulti
                    isClearable
                    placeholder=""
                    value={filter_criteria.request_status.value ? filter_criteria.request_status.value.map(s => ({value: s, label: s})): []}
                    name="request_status"
                    options={
                      this.state.request_statuses.map(k => ({value: k, label: k}))
                    }
                    onChange={(v) => {
                      v && this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { request_status: { $merge: { value: v.map(e => e.value) } } })
                      })
                    }}
                    clearValue={() =>
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { request_status: { $merge: { value: [] } } })
                      })
                    }
                    className="basic-multi-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="donor" defaultMessage="Donor" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.donor_id.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { donor_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>
                <Col sm={8}>
                  <Select
                    isClearable
                    isSearchable
                    value={{ value: filter_criteria.donor_id.value, label: operators.find(o => o.id === filter_criteria.donor_id.value)?.name }}
                    name="donor"
                    options={operators.map(o => ({value: o.id, label: o.name}))}
                    onChange={v => {
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { donor_id: { $merge: { value: v && v.value } } })
                      })
                    }}
                    className="basic-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="recipient" defaultMessage="Recipient" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.recipient_id.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { recipient_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>
                <Col sm={8}>
                  <Select
                    isClearable
                    isSearchable
                    value={{ value: filter_criteria.recipient_id.value, label: operators.find(o => o.id === filter_criteria.recipient_id.value)?.name }}
                    name="recipient"
                    options={operators.map(o => ({value: o.id, label: o.name}))}
                    onChange={v => {
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { recipient_id: { $merge: { value: v && v.value } } })
                      })
                    }}
                    className="basic-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>

              {
                  manualActions &&
                      <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="pending-action-role" defaultMessage="Pending action role" />
                          </Col>

                          <Col sm={1}>
                              <FormControl
                                  componentClass="select"
                                  value={filter_criteria.role_id.op}
                                  onChange={e => this.setState({
                                      filter_criteria: update(this.state.filter_criteria,
                                          { role_id: { $merge: { op: e.target.value } } })
                                  })}>
                                  <option value="eq">==</option>
                                  <option value="ne">!=</option>
                                  <option value="is_not_null">*any*</option>
                              </FormControl>
                          </Col>

                          <Col sm={8}>
                              <Select
                                isClearable
                                disabled={filter_criteria.role_id.op === "is_not_null"}
                                value={{value: filter_criteria.role_id.value, label: roles.find(r => r.id === filter_criteria.role_id.value)?.name}}
                                options={roles.map(r => ({value: r.id, label: r.name}))}
                                onChange={v => {
                                  this.setState({
                                    filter_criteria: update(this.state.filter_criteria,
                                      { role_id: { $merge: { value: v && v.value } } })
                                  })
                                }}
                                name="manual-action-role"
                                className="basic-select"
                                classNamePrefix="select" />
                          </Col>
                      </FormGroup>
              }

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="customer-id" defaultMessage="Customer ID" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.customer_id.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { customer_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="is_null">is null</option>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>
                <Col sm={8}>
                  <FormControl
                    value={filter_criteria.customer_id.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { customer_id: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup validationState={invalid_due_date ? "error" : null}>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="due-date" defaultMessage="Due date" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.due_date.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { due_date: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="gt">&gt;</option>
                    <option value="ge">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="le">&lt;=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <DatePicker
                    className="form-control"
                    selected={filter_criteria.due_date.value.length !== 0 ? userLocalizeUtcDate(moment.utc(filter_criteria.due_date.value), this.props.user_info).toDate() : null}
                    onChange={d => {
                      this.setState({
                        filter_criteria: update(
                          this.state.filter_criteria,
                          { due_date: { $merge: { value: d || "" } } })
                      });
                    }}
                    dateFormat="dd/MM/yyy HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60} />
                </Col>
              </FormGroup>

              <FormGroup validationState={invalid_created_on ? "error" : null}>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="created-on" defaultMessage="Created on" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.created_on.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { created_on: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="gt">&gt;</option>
                    <option value="ge">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="le">&lt;=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <DatePicker
                    className="form-control"
                    selected={filter_criteria.created_on.value.length !== 0?userLocalizeUtcDate(moment.utc(filter_criteria.created_on.value), this.props.user_info).toDate():null}
                    onChange={d => {
                        this.setState({
                            filter_criteria: update(
                                this.state.filter_criteria,
                                {created_on: {$merge: {value: d || ""}}})
                        })
                    }}
                    dateFormat="dd/MM/yyyy HH:mm"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60}/>
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="is-b2b" defaultMessage="Is B2B" />
                </Col>

                <Col smOffset={1} sm={8}>
                  <Select
                    isClearable
                    value={{value: filter_criteria.b2b.value, label: `${filter_criteria.b2b.value}` }}
                    options={[{value: true, label: "true"}, {value: false, label: "false"}]}
                    onChange={v => {
                      this.setState({
                        filter_criteria: update(this.state.filter_criteria,
                          { b2b: { $merge: { value: v ? v.value : "" } } })
                      })
                    }}
                    name="b2b"
                    className="basic-select"
                    classNamePrefix="select" />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="flags" defaultMessage="Flags" />
                </Col>

                <Col smOffset={1} sm={8}>
                  <Checkbox
                    checked={filter_criteria.task_status && filter_criteria.task_status.value === 'ERROR'}
                    onChange={e => (
                      e.target.checked ?
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $merge: errorCriteria })
                        }) :
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $unset: ['task_status'] })
                        })
                    )} >
                    <FormattedMessage id="with-errors" defaultMessage="With errors" />
                  </Checkbox>

                  <Checkbox
                    checked={filter_criteria.action_status !== undefined}
                    onChange={e => (
                      e.target.checked ?
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $merge: needActionCriteria })
                        }) :
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $unset: ['action_status'] })
                        })
                    )}
                  >
                    <FormattedMessage id="need-action" defaultMessage="Need a manual action" />
                  </Checkbox>

                </Col>
              </FormGroup>

              <FormGroup>
                <Col smOffset={1} sm={1}>
                  <Button bsStyle="info" onClick={() => this._refresh({ page_number: 1 })} disabled={invalid_created_on}>
                    <FormattedMessage id="search" defaultMessage="Search" />
                  </Button>
                </Col>
              </FormGroup>
            </Form>
          </Panel.Body>
        </Panel>

        <Panel>
          <Panel.Body>
            <ApioDatatable
              sorting_spec={this.state.sorting_spec}
              headers={[
                { title: '', render: n => getIcon(n.nprequest.kind), style: { width: '40px' } },
                {
                  title: '#', field: 'crdc_id', model: 'NPRequest',
                  render: n => <Link to={`/transactions/${n.id}`}>{n.nprequest.crdc_id || n.id}</Link>,
                  sortable: true
                },
                {
                  title: <FormattedMessage id="status" defaultMessage="Status" />,
                  field: 'status',
                  model: 'NPRequest',
                  render: n => n.nprequest.status,
                  sortable: true,
                  className: 'visible-md visible-lg',
                },
                { title: <FormattedMessage id="donor" defaultMessage="Donor" />, field: 'donor_name', className: 'visible-md visible-lg' },
                { title: <FormattedMessage id="recipient" defaultMessage="Recipient" />, field: 'recipient_name', className: 'visible-md visible-lg' },
                { title: <FormattedMessage id="customer-id" defaultMessage="Customer ID" />, field: 'customer_id', render: n => n.nprequest.customer_id, className: 'visible-md visible-lg' },
                {
                  title: <FormattedMessage id="ranges" defaultMessage="Ranges" />, render: n => (
                    n.nprequest.ranges.map((r, key) => (
                      <span key={key}>
                        {r.range_from}-{r.range_to}
                        <br />
                      </span>
                    )
                    )),
                  className: 'visible-md visible-lg',
                },
                {
                  title: <FormattedMessage id="due-date" defaultMessage="Due date" />, field: 'due_date', model: 'NPRequest',
                  render: n => n.nprequest.due_date?userLocalizeUtcDate(moment.utc(n.nprequest.due_date), this.props.user_info).format():"-",
                  sortable: true,
                  className: 'visible-md visible-lg',
                },
                {
                  title: <FormattedMessage id="created-on" defaultMessage="Created on" />, field: 'created_on', model: 'NPRequest',
                  render: n => userLocalizeUtcDate(moment.utc(n.created_on), this.props.user_info).format(),
                  sortable: true,
                },
              ]}
              pagination={this.state.pagination}
              data={requests}
              onSort={s => this._refresh(undefined, s)}
              onPagination={p => this._refresh(p)}
            />
          </Panel.Body>
        </Panel>
        <Panel>
          <Panel.Body>
            <Button
              bsStyle="primary"
              onClick={() => {
                export_url && AuthServiceManager.getValidToken().then(token => {
                  window.location=`${export_url}&auth_token=${token}`
                })
              }}
              disabled={export_url === undefined}
            >
              <FormattedMessage id="export-as-csv" defaultMessage="Export as CSV" />
            </Button>
          </Panel.Body>
        </Panel>
      </div>
    )
  }
}
