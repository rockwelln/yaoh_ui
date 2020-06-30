import React, { Component } from 'react';

import Alert from 'react-bootstrap/lib/Alert';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Table from 'react-bootstrap/lib/Table';
import Tab from 'react-bootstrap/lib/Tab';
import Tabs from 'react-bootstrap/lib/Tabs';
import Badge from 'react-bootstrap/lib/Badge';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';

import {
  API_URL_PREFIX, fetch_get, parseJSON, fetch_post, fetch_put, NotificationsManager
} from "../utils";
import { fetchOperators } from "./data/operator_mgm";
import { ApioDatatable } from "../utils/datatable";

import 'react-datepicker/dist/react-datepicker.css';
import { TransactionFlow, Comments, Errors, ContextTable, TxTable, TasksTable } from "../requests/requests";
import update from 'immutability-helper';
import { StaticControl } from "../utils/common";
import { access_levels, is_admin, isAllowed, pages } from "../utils/user";
import { DEFAULT_RECIPIENT as citcRecipient, rejection_codes } from "./requests/crdb-rsa";

export const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const DEFAULT_RECIPIENT = citcRecipient;


class Error extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { entry } = this.props;
    const summary = entry.output ? entry.output : <FormattedMessage id="see-description" defaultMessage="See description" />;
    return (
      <tr key={entry.id}>
        <th>{entry.cell_id}</th>
        <td>
          {summary.split("\n").map((l, i) => <div key={i}>{l}<br /></div>)}
          <br />
          <Button bsStyle="link" onClick={() => this.setState({ showDetails: true })}>...</Button>
        </td>
        <td>{moment(entry.created_on).format(DATE_FORMAT)}</td>
        <Modal show={this.state.showDetails} onHide={() => this.setState({ showDetails: false })}>
          <Modal.Header closeButton>
            <Modal.Title><FormattedMessage id="error-details" defaultMessage="Error details" /></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <StaticControl label={<FormattedMessage id='source' defaultMessage='Source' />} value={entry.cell_id} />
              <StaticControl label={<FormattedMessage id='when' defaultMessage='When' />} value={moment(entry.created_on).format(DATE_FORMAT)} />

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="summary" defaultMessage="Summary" />
                </Col>

                <Col sm={9}>
                  {summary.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="description" defaultMessage="Description" />
                </Col>

                <Col sm={9}>
                  {entry.description.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
        </Modal>
      </tr>
    )
  }
}


class Events extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = { events: [], logs: [], show_details: false, selected_evt: {} };
  }

  componentDidMount() {
    // get the events
    fetch_get(`/api/v01/transactions/${this.props.tx_id}/events`, this.props.auth_token)
      .then(data => !this.cancelLoad && this.setState({ events: data.events.map(e => { e.type = 'event'; return e }) }))
      .catch(error => !this.cancelLoad && this.setState({ events_error: error }));
    // get the logs
    fetch_get(`/api/v01/transactions/${this.props.tx_id}/logs`, this.props.auth_token)
      .then(data => !this.cancelLoad && this.setState({
        logs: data.logs.map(l => { l.type = 'log'; l.source_entity = l.source; l.content = l.message; return l; })
      }))
      .catch(error => !this.cancelLoad && this.setState({ logs_error: error }));
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  render() {
    if (this.state.events_error !== undefined && this.state.logs_error !== undefined) {
      return <Alert bsStyle="danger">
        <FormattedMessage id="fail-fetch-events" defaultMessage="Failed to fetch events." /><br />
        {this.state.events_error.message}<br />
        {this.state.logs_error.message}
      </Alert>
    }
    const { selected_evt, events_error, logs_error, events, logs, show_details } = this.state;
    let alert = '';
    if (events_error !== undefined) {
      alert = <Alert bsStyle="danger">
        <FormattedMessage id="fail-fetch-events" defaultMessage="Failed to fetch events." /><br />
        {events_error.message}
      </Alert>
    } else if (logs_error !== undefined) {
      alert = <Alert bsStyle="danger">
        <FormattedMessage id="fail-fetch-logs" defaultMessage="Failed to fetch logs." /><br />
        {logs_error.message}
      </Alert>
    }
    const closeModal = () => this.setState({ show_details: false, selected_evt: {} });
    const events_ = events.concat(logs);
    events_.sort((a, b) => (moment(b.created_on) - moment(a.created_on)));
    return (<div>
      {alert}
      <Table condensed>
        <tbody>
          {events_.map((e, n) => (
            <tr key={n}>
              <th>{e.source_entity + (e.username ? ' (' + e.username + ')' : '')}<br />{moment(e.created_on).format(DATE_FORMAT)}</th>
              <td>
                {e.content.substr(0, 50)}
                <br />
                <Button bsStyle="link" onClick={() => this.setState({ show_details: true, selected_evt: e })}>...</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={show_details} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="event-details" defaultMessage="Event details" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticControl label={<FormattedMessage id='source' defaultMessage='Source' />} value={selected_evt.source_entity} />
            <StaticControl label={<FormattedMessage id='username' defaultMessage='Username' />} value={selected_evt.username} />
            <StaticControl label={<FormattedMessage id='when' defaultMessage='When' />} value={moment(selected_evt.created_on).format(DATE_FORMAT)} />
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="content" defaultMessage="Content" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="textarea" defaultValue={selected_evt.content} />
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    </div>)
  }
}


class RequestTable extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      operators: undefined,
      diff_req: {},
      publicHolidays: [],
      saving: false,
    };
    this.onSubmit = this.onSubmit.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
    fetchOperators(this.props.auth_token,
      data => !this.cancelLoad && this.setState({ operators: data }),
      error => !this.cancelLoad && this.setState({ error: error })
    );
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  onSubmit() {
    let { diff_req } = this.state;
    if (diff_req.due_date !== undefined && typeof diff_req.due_date !== "string") {
      diff_req.due_date = diff_req.due_date.format();
    }

    this.setState({ saving: true });
    fetch_put(`/api/v01/voo/np_requests/${this.props.request.id}`, diff_req, this.props.auth_token)
      .then(parseJSON)
      .then(data => {
        this.setState({ request_crdc: data.event_sent, saving: false });
        if (data.request_crdc) {
          NotificationsManager.success(
            <FormattedMessage id="request-updated-with-crdc" defaultMessage="Update request sent to CRDC!" />
          )
        } else {
          NotificationsManager.success(
            <FormattedMessage id="request-updated" defaultMessage="Request updated!" />
          )
        }
        //this._fetch();  // devnote: refresh the data
        this.onClose();
      })
      .catch(error => {
        this.setState({ saving: false });
        NotificationsManager.error(
          <FormattedMessage id="request-update-failed" defaultMessage="Request update failed!" />,
          error.message
        );
      }
      );
  }

  onClose() {
    this.setState({ diff_req: {}, saving: false });
    this.props.onEditEnd && this.props.onEditEnd();
  }

  render() {
    if (this.props.request === undefined || this.state.operators === undefined) {
      return <div><FormattedMessage id="loading" defaultMessage="Loading..." /></div>;
    }

    if (this.state.error !== undefined) {
      return <Alert bsStyle="danger">
        <FormattedMessage id="fail-fetch-request" defaultMessage="Failed to fetch original request." />
        {this.state.error.message}
      </Alert>
    }

    const req = update(this.props.request, { $merge: this.state.diff_req });
    const donor = this.state.operators.find(d => d.id === parseInt(req.donor_id, 10));
    const recipient = this.state.operators.find(d => d.id === parseInt(req.recipient_id, 10));
    return (
      <Panel>
        <Panel.Body>
          <Table condensed>
            <tbody>
              <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{req.id}</td></tr>
              <tr><th><FormattedMessage id="kind" defaultMessage="Kind" /></th><td>{req.kind}</td></tr>
              <tr><th><FormattedMessage id="complexity" defaultMessage="Complexity" /></th><td>{req.complexity_class}</td></tr>
              <tr><th><FormattedMessage id="final-status" defaultMessage="Status" /></th><td>{req.status}</td></tr>
              <tr><th><FormattedMessage id="port-id" defaultMessage="Port ID" /></th><td>{req.crdc_id}</td></tr>
              <tr><th><FormattedMessage id="ranges" defaultMessage="Ranges" /></th>
                <td>{req.ranges[0].range_from} {' - '} {req.ranges[0].range_to}</td>
              </tr>
              {
                req.ranges.map((r, i) => {
                  if (i === 0) return null; // the first entry has already been treated.
                  return (<tr key={i}><td /><td>{r.range_from} {' - '} {r.range_to}</td></tr>)
                })
              }
              <tr><th><FormattedMessage id="donor" defaultMessage="Donor" /></th>
                <td>
                  {
                    this.props.edit_mode ? (
                      <FormControl
                        componentClass="select"
                        value={req.donor_id}
                        onChange={e => this.setState({ diff_req: update(this.state.diff_req, { $merge: { donor: e.target.value } }) })}
                      >
                        {this.state.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </FormControl>
                    ) : (
                        donor !== undefined ? donor.name : '-'
                      )
                  }
                </td>
              </tr>
              <tr><th><FormattedMessage id="recipient" defaultMessage="Recipient" /></th><td>{recipient !== undefined ? recipient.name : '-'}</td></tr>
              <tr>
                <th><FormattedMessage id="routing-info" defaultMessage="Routing info" /></th>
                <td>{req.routing_info}</td>
              </tr>
              <tr><th><FormattedMessage id="service-type" defaultMessage="Service type" /></th><td>{req.service_type}</td></tr>
              <tr><th><FormattedMessage id="sub-type" defaultMessage="Sub type" /></th><td>{req.sub_type}</td></tr>
              <tr><th><FormattedMessage id="port-req-form-id" defaultMessage="Port request form ID" /></th><td>{req.port_req_form_id}</td></tr>
              <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td>{req.created_on}</td></tr>
              <tr>
                <th><FormattedMessage id="subscriber-data" defaultMessage="Subscriber data" /></th>
                <td>
                  <pre>{JSON.stringify(req.subscriber_data, undefined, 4)}</pre>
                </td>
              </tr>
            </tbody>
          </Table>
          {
            this.props.edit_mode && (
              <div>
                <ButtonToolbar>
                  <Button onClick={this.onSubmit} bsStyle="primary" disabled={this.state.saving}><FormattedMessage id="save" defaultMessage="Save" /></Button>
                  <Button onClick={this.onClose} disabled={this.state.saving}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </ButtonToolbar>
              </div>
            )
          }
        </Panel.Body>
      </Panel>
    )
  }
}

class RejectionReason extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onClose = this.onClose.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    this.props.onSubmit('donor_approval', 'API.reject', { reason: this.state.rej });
    this.onClose();
  }

  onClose() {
    this.setState({});
    this.props.onHide && this.props.onHide();
  }

  render() {
    const { rej } = this.state;

    return (
      <Modal show={this.props.show} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="reject-title" defaultMessage="Reject" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="reason" defaultMessage="Reason" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={rej && rej.id}
                  onChange={e => this.setState({ rej: rejection_codes.find(r => r.id === e.target.value) })} >
                  <option value={null} />
                  {
                    rejection_codes.map(r => <option key={r.id} value={r.id}>{r.id} - {r.summary}</option>)
                  }
                </FormControl>
                <HelpBlock>
                  {rej && rej.help}
                </HelpBlock>
              </Col>
            </FormGroup>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onSave} disabled={!rej} bsStyle="primary">
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    );
  }
}


const RELOAD_TX = 10 * 1000;


export class NPTransaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      sending: false,
      activeTab: 1,
    };
    this.cancelLoad = false;

    this.onReplay = this.onReplay.bind(this);
    this.onForceClose = this.onForceClose.bind(this);
    this.fetchTxDetails = this.fetchTxDetails.bind(this);
    this.actionList = this.actionList.bind(this);
    this.changeTxStatus = this.changeTxStatus.bind(this);
    this.onReopen = this.onReopen.bind(this);
    this.sendEvent = this.sendEvent.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.caseUpdated = this.caseUpdated.bind(this);
    this.caseUpdateFailure = this.caseUpdateFailure.bind(this);
  }

  fetchTxDetails(reload) {
    this.setState({ error: undefined });
    fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`, this.props.auth_token)
      .then(data => {
        if (this.cancelLoad)
          return;

        this.setState({ tx: data });

        fetch_get(`/api/v01/voo/np_requests/${data.original_request_id}`, this.props.auth_token)
          .then(data => !this.cancelLoad && this.setState({ request: data }))
          .catch(error => !this.cancelLoad && this.setState({ error: error }));

        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
      })
      .catch(error => {
        if (this.cancelLoad)
          return;
        let error_msg = undefined;
        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
        if (error.response === undefined) {
          this.setState({ error: error });
          return
        }
        switch (error.response.status) {
          case 404: error_msg = <FormattedMessage id="unknown-transaction" defaultMessage="Unknown transaction." />; break;
          case 401: error_msg = <FormattedMessage id="not-allowed-transaction" defaultMessage="You are not allowed to see this transaction." />; break;
          default: error_msg = <FormattedMessage id="unknown-error" defaultMessage="Unknown error: {status}" values={{ status: error.response.status }} />;
        }
        this.setState({ error: new Error(error_msg) })
      });
  }

  componentDidMount() {
    this.fetchTxDetails(true);
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentWillReceiveProps() {
    this.setState({ activeTab: 1 });
    this.fetchTxDetails(false);
  }

  onReplay(activity_id, task_id) {
    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {}, this.props.auth_token)
      .then(() => NotificationsManager.success(
        <FormattedMessage id="task-replayed" defaultMessage="Task replayed!" />,
      ))
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!" />,
        error.message
      ))
  }

  changeTxStatus(new_status) {
    fetch_put(`/api/v01/transactions/${this.state.tx.id}`, { status: new_status }, this.props.auth_token)
      .then(() => {
        this.fetchTxDetails(false);
        NotificationsManager.success(
          <FormattedMessage id="task-status-changed" defaultMessage="Task status updated!" />,
        );
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="task-update-failed" defaultMessage="Task status update failed!" />,
        error.message
      ))
  }

  caseUpdated() {
    NotificationsManager.success(
      <FormattedMessage id="case-updated" defaultMessage="Case updated!" />,
    );
    this.fetchTxDetails(false);
  }

  caseUpdateFailure(error) {
    NotificationsManager.error(
      <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!" />,
      error.message
    );
  }

  onForceClose() {
    this.changeTxStatus("CLOSED_IN_ERROR")
  }

  onReopen() {
    this.changeTxStatus("ACTIVE")
  }

  sendEvent(value, trigger_type, extra) {
    this.setState({ sending: true });
    fetch_post(
      `/api/v01/transactions/${this.state.tx.id}/events`,
      {
        key: trigger_type,
        value: value,
        ...extra,
      },
      this.props.auth_token
    )
      .then(() => {
        this.caseUpdated();
        setTimeout(() => this.setState({ sending: false }), RELOAD_TX);
      })
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  updateContext(key, value) {
    this.setState({ sending: true });
    fetch_put(
      `/api/v01/transactions/${this.state.tx.id}/context`,
      {
        key: key,
        value: value,
      },
      this.props.auth_token
    )
      .then(() => {
        this.caseUpdated();
        setTimeout(() => this.setState({ sending: false }), RELOAD_TX);
      })
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  onApproveHold(proposed_due_date) {
    this.setState({ sending: true });
    fetch_put(
      `/api/v01/voo/np_requests/${this.state.tx.original_request_id}`,
      {
        due_date: proposed_due_date
      },
      this.props.auth_token
    )
      .then(() => this.updateContext("hold", "approved"))
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  onCancel() {
    this.sendEvent('', 'API.cancel');
  }

  onAbort() {
    this.sendEvent('', 'API.abort');
  }

  onEdit() {
    this.setState({ edit_request: true })
  }

  actionList() {
    const { tx, request } = this.state;

    const is_active = tx.status === 'ACTIVE';
    const edited = this.state.edit_request === true;
    const is_portin = request && request.kind === 'PortIn';
    // const is_portout = request && request.kind === 'PortOut';
    const fnp_exec_sent = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Set accepted' && t.status === 'OK') !== -1;

    let can_edit = false; // is_active && !is_portout;
    if (can_edit && is_portin) {
      const fnp_request_sent = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send FNPRequest' && t.status === 'OK') !== -1;
      const fnp_accept_recv = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send InDueDate' || t.cell_id === 'Set accepted') !== -1;

      can_edit = !fnp_exec_sent && (!fnp_request_sent || fnp_accept_recv);
    }
    const can_close = is_active;
    const can_reopen = !is_active;
    const can_cancel = is_active && is_portin && !fnp_exec_sent;
    const can_abort = is_active && is_portin && fnp_exec_sent;

    return (
      <ButtonGroup vertical block>
        {can_edit && <Button onClick={() => this.onEdit()} disabled={edited}><FormattedMessage id="edit" defaultMessage="Edit" /></Button>}
        {can_close && <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>}
        {can_reopen && <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>}
        {can_cancel && <Button onClick={() => this.onCancel()}><FormattedMessage id="trigger-cancel" defaultMessage="Trigger cancel" /></Button>}
        {can_abort && <Button onClick={() => this.onAbort()}><FormattedMessage id="trigger-abort" defaultMessage="Trigger abort" /></Button>}
      </ButtonGroup>
    )
  }

  render() {
    const { sending, error, tx, request, activeTab } = this.state;
    let alerts = [];
    error && alerts.push(
      <Alert bsStyle="danger" key='fail-fetch-tx'>
        <p>{error.message}</p>
      </Alert>
    );
    if (!tx && error) {
      return <div>{alerts.map(e => e)}</div>
    } else if (!tx) {
      return <div><FormattedMessage id='loading' defaultMessage='Loading...' /></div>
    }

    let actions_required = [];
    // add a user profile check to see if the user *can* approve/reject/hold
    const can_act = isAllowed(this.props.user_info.ui_profile, pages.requests_nprequests, access_levels.modify);

    if (tx.context.find(c => c.key === "donor_approval" && c.value === "waiting") !== undefined) {
      actions_required.push(<Alert bsStyle="warning">
        <FormattedMessage id="request-need-approval" defaultMessage="This request need your approval" />
        {can_act &&
          <ButtonToolbar>
            <Button bsSize="xsmall" onClick={() => this.sendEvent('donor_approval', 'API.accept')} disabled={sending}>
              <FormattedMessage id="approve" defaultMessage="approve" />
            </Button>
            <Button bsSize="xsmall" onClick={() => this.setState({ showRejectReason: true })} disabled={sending}>
              <FormattedMessage id="reject" defaultMessage="reject" />
            </Button>
          </ButtonToolbar>
        }
        <RejectionReason
          show={this.state.showRejectReason}
          onHide={() => this.setState({ showRejectReason: undefined })}
          onSubmit={this.sendEvent}
          tx={tx}
          {...this.props} />
      </Alert>);
    }
    if (tx.context.find(c => c.key === "manual_rfs" && (c.value === "waiting" || c.value === "nonrfs")) !== undefined) {
      actions_required.push(
        <Alert bsStyle="warning">
          <FormattedMessage id="manual-rfs" defaultMessage="Manual RFS" />
          <ButtonToolbar>
            <Button bsSize="xsmall" onClick={() => this.sendEvent('', 'API.recipient.rfs')} disabled={!can_act || sending}><FormattedMessage id="rfs" defaultMessage="RFS" /></Button>
          </ButtonToolbar>
        </Alert>);
    }

    return (
      <div>
        {alerts}
        <Row>
          {can_act && tx.status === 'ACTIVE' && actions_required.map((a, i) => <div key={i}>{a}</div>)}
        </Row>
        <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({ activeTab: e })} id="np-request-tabs">
          <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
            <Col xs={12} sm={6} md={8} lg={8}>
              <RequestTable
                request={request}
                edit_mode={this.state.edit_request === true}
                onEditEnd={() => {
                  this.setState({ edit_request: false });
                  this.fetchTxDetails(false);
                }}
                {...this.props} />
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              {can_act &&
                <Panel>
                  <Panel.Heading>
                    <Panel.Title><FormattedMessage id="actions" defaultMessage="Actions" /></Panel.Title>
                  </Panel.Heading>
                  <Panel.Body>
                    {this.actionList()}
                  </Panel.Body>
                </Panel>
              }
              <Panel header="Context">
                <ContextTable context={tx.context} />
              </Panel>
            </Col>
            <Col xs={12} sm={12} md={12} lg={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title><FormattedMessage id="comments" defaultMessage="Comments" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Comments req_id={tx.id} {...this.props} />
                </Panel.Body>
              </Panel>
            </Col>
          </Tab>
          <Tab
            eventKey={2}
            title={
              <div>
                <FormattedMessage id="workflow" defaultMessage="Workflow" /> <Badge>{tx.errors.length}</Badge>
              </div>
            }>
            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="summary" defaultMessage="Summary" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TxTable tx={tx} request={request} />
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TransactionFlow definition={tx.definition} states={tx.tasks} activityId={tx.activity_id} />
                <TasksTable
                  tasks={tx.tasks}
                  definition={tx.definition}
                  onReplay={this.onReplay}
                  user_can_replay={can_act && tx.status === 'ACTIVE'}
                  tx_id={tx.id}
                />
              </Panel.Body>
            </Panel>

            <Panel bsStyle="danger">
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="errors" defaultMessage="Errors" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <Errors errors={tx.errors} user_info={this.props.user_info} />
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <Events tx_id={tx.id} {...this.props} />
              </Panel.Body>
            </Panel>
          </Tab>
        </Tabs>
      </div>)
  }
}

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
    default: return "";
  }
};

export class NPRequests extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      filter_criteria: NPRequests.criteria_from_params(this.props.location.search, this.props.user_info.ui_profile),
      paging_info: {
        page_number: 1, page_size: 50
      },
      sorting_spec: [{
        model: 'NPRequest', field: 'created_on', direction: 'desc'
      }],

      requests: [], operators: [],
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

  static default_criteria(ui_profile) {
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
      task_status: is_admin(ui_profile) ? undefined : errorCriteria.task_status,
    }
  }

  static criteria_from_params(url_params, ui_profile) {
    const params = queryString.parse(url_params);
    let custom_params = {};
    if (params.filter !== undefined) {
      try {
        custom_params = JSON.parse(params.filter);
      } catch (e) { console.error(e) }
    }
    return update(
      NPRequests.default_criteria(ui_profile),
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
        filter_criteria: NPRequests.criteria_from_params(nextProps.location.search, nextProps.user_info.ui_profile)
      });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (JSON.stringify(nextState.filter_criteria) !== JSON.stringify(this.state.filter_criteria)) {
      setTimeout(() => this._refresh(), 800);
    }
  }

  _prepare_url(paging_spec, sorting_spec, format) {
    let url = new URL(API_URL_PREFIX + '/api/v01/voo/np_requests/search');
    // filter
    const { filter_criteria } = this.state;
    let filter_spec = Object.keys(filter_criteria)
      .filter(f =>
        filter_criteria[f] &&
        (
          (filter_criteria[f].value && filter_criteria[f].op) ||
          filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_null' || typeof (filter_criteria[f].value) === 'boolean'
        )
      )
      .map(f => {
        switch (f) {
          case 'number':
            // special handling to look into the ranges of the requests
            return {
              'or': [
                {
                  model: filter_criteria[f].model,
                  field: 'range_from',
                  op: filter_criteria[f].op,
                  value: filter_criteria[f].value.trim()
                },
                {
                  model: filter_criteria[f].model,
                  field: 'range_to',
                  op: filter_criteria[f].op,
                  value: filter_criteria[f].value.trim()
                }
              ]
            };
          case 'task_status':
          case 'request_status':
            return {
              model: filter_criteria[f].model,
              field: 'status',
              op: filter_criteria[f].op,
              value: filter_criteria[f].value
            };
          case 'approval':
          case 'wait_ivr':
            return filter_criteria[f];
          case 'b2b':
            return {
              model: filter_criteria[f].model, // needed in multi-model query
              field: f,
              op: filter_criteria[f].op,
              value: filter_criteria[f].value
            };
          default:
            return {
              model: filter_criteria[f].model, // needed in multi-model query
              field: f,
              op: filter_criteria[f].op,
              value: f === 'created_on' || f === 'due_date' ?
                moment(filter_criteria[f].value, 'DD/MM/YYYY HH:mm').format() :
                typeof filter_criteria[f].value === "string" ? filter_criteria[f].value.trim() : filter_criteria[f].value
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
    export_url.searchParams.append('auth_token', this.props.auth_token);

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
            filter_criteria[f].op === 'is_null')
          ).reduce((obj, key) => {
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
          requests: data.requests.map(c => {
            c.created_on = c.created_on ? moment(c.created_on).format(DATE_FORMAT) : null;
            return c;
          }),
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
    const { filter_criteria, requests, operators, export_url } = this.state;
    requests && requests.forEach(r => {
      const donor = operators.find(o => o.id === r.nprequest.donor_id);
      const recipient = operators.find(o => o.id === r.nprequest.recipient_id);
      r.donor_name = donor ? donor.name : 'n/a';
      r.recipient_name = recipient ? recipient.name : 'n/a';
    });
    const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm").isValid();
    const invalid_due_date = filter_criteria.due_date.value.length !== 0 && !moment(filter_criteria.due_date.value, "DD/MM/YYYY HH:mm").isValid();

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

                <Col smOffset={1} sm={8}>
                  <FormControl componentClass="select" value={filter_criteria.kind.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { kind: { $merge: { value: e.target.value } } })
                    })}>
                    <option value='' />
                    <option value="Disconnect">Disconnect</option>
                    <option value="PortIn">PortIn</option>
                    <option value="PortOut">PortOut</option>
                    <option value="Update">Update</option>
                  </FormControl>
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
                  <FormControl componentClass="select" value={filter_criteria.status.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { status: { $merge: { value: e.target.value } } })
                    })}>
                    <option value='' />
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED_IN_ERROR">CLOSED_IN_ERROR</option>
                    <option value="CLOSED_IN_SUCCESS">CLOSED_IN_SUCCESS</option>
                  </FormControl>
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
                  <FormControl componentClass="select" value={filter_criteria.request_status.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { request_status: { $merge: { value: e.target.value } } })
                    })}>
                    <option value='' />
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPDATED">UPDATED</option>
                    <option value="DISCONNECTED">DISCONNECTED</option>
                    <option value="ACTIVATED">ACTIVATED</option>
                    <option value="FAILED">FAILED</option>
                  </FormControl>
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
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.donor_id.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { donor_id: { $merge: { value: e.target.value && parseInt(e.target.value) } } })
                    })}>
                    <option value="" />
                    {
                      this.state.operators.map(o =>
                        <option key={o.id} value={o.id}>{o.name}</option>
                      )
                    }
                  </FormControl>
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
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.recipient_id.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { recipient_id: { $merge: { value: e.target.value && parseInt(e.target.value) } } })
                    })}>
                    <option value="" />
                    {
                      this.state.operators.map(o =>
                        <option key={o.id} value={o.id}>{o.name}</option>
                      )
                    }
                  </FormControl>
                </Col>
              </FormGroup>

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
                    selected={filter_criteria.due_date.value.length !== 0 ? moment(filter_criteria.due_date.value, "DD/MM/YYYY HH:mm") : null}
                    onChangeRaw={d => {
                      this.setState({
                        filter_criteria: update(
                          this.state.filter_criteria,
                          { due_date: { $merge: { value: d.target.value } } })
                      });
                      d.target.value.length === 0 && d.preventDefault();
                    }}
                    onChange={d => this.setState({
                      filter_criteria: update(
                        this.state.filter_criteria,
                        { due_date: { $merge: { value: d.format("DD/MM/YYYY HH:mm") } } })
                    })}
                    dateFormat="DD/MM/YYYY HH:mm"
                    locale="fr-fr"
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
                    selected={filter_criteria.created_on.value.length !== 0 ? moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm") : null}
                    onChangeRaw={d => {
                      this.setState({
                        filter_criteria: update(
                          this.state.filter_criteria,
                          { created_on: { $merge: { value: d.target.value } } })
                      });
                      d.target.value.length === 0 && d.preventDefault();
                    }}
                    onChange={d => this.setState({
                      filter_criteria: update(
                        this.state.filter_criteria,
                        { created_on: { $merge: { value: d.format("DD/MM/YYYY HH:mm") } } })
                    })}
                    dateFormat="DD/MM/YYYY HH:mm"
                    locale="fr-fr"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="is-b2b" defaultMessage="Is B2B" />
                </Col>

                <Col smOffset={1} sm={8}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.b2b.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { b2b: { $merge: { value: e.target.value === '' ? e.target.value : e.target.value === 'true' } } })
                    })}>
                    <option value="" />
                    <FormattedMessage id='true' defaultMessage='True'>
                      {message => <option value="true">{message}</option>}
                    </FormattedMessage>
                    <FormattedMessage id='false' defaultMessage='False'>
                      {message => <option value="false">{message}</option>}
                    </FormattedMessage>
                  </FormControl>
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
                    checked={filter_criteria.approval !== undefined}
                    onChange={e => (
                      e.target.checked ?
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $merge: needApprovalCriteria })
                        }) :
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $unset: ['approval'] })
                        })
                    )}
                  >
                    <FormattedMessage id="need-approval" defaultMessage="Need approval" />
                    <HelpBlock><FormattedMessage id="port-out requiring approval or port-in with manual rfs to activate" /></HelpBlock>
                  </Checkbox>

                  <Checkbox
                    checked={filter_criteria.wait_ivr !== undefined}
                    onChange={e => (
                      e.target.checked ?
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $merge: waitForIVR })
                        }) :
                        this.setState({
                          filter_criteria: update(this.state.filter_criteria,
                            { $unset: ['wait_ivr'] })
                        })
                    )}
                  >
                    <FormattedMessage id="wait-for-ivr" defaultMessage="Wait for IVR" />
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
                  render: n => n.nprequest.due_date,
                  sortable: true,
                  className: 'visible-md visible-lg',
                },
                { title: <FormattedMessage id="created-on" defaultMessage="Created on" />, field: 'created_on', model: 'NPRequest', sortable: true },
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
              href={export_url}
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
