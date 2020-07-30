import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Alert from 'react-bootstrap/lib/Alert';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import update from 'immutability-helper';
import { Link } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import DatePicker from 'react-datepicker';

import { DATE_FORMAT /*, DEFAULT_RECIPIENT*/ } from './np-requests';
import { parseJSON, fetch_delete, fetch_post, fetch_put } from "../utils";
import { ApioDatatable } from '../utils/datatable';
import { Search, StaticControl } from "../utils/common";
import { access_levels, pages, isAllowed } from "../utils/user";
import { fetchOperators } from './data/operator_mgm';

/*
function ownedCase(c) {
  return c._recipient && c._recipient.short_name === DEFAULT_RECIPIENT;
}
*/

class UpdateNumberPortingModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      diff_case: {}
    };
  }

  onSaveUpdate() {
    // post a new PORTING CASE (type: update)
    fetch_post(
      '/api/v01/voo/np_requests/update',
      update(this.props.case, { $merge: this.state.diff_case }),
      this.props.auth_token
    )
      .then(parseJSON)
      .then(data => this.setState({ new_np_request: data.id }))
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="create-update-request-failed" defaultMessage="Failed to create update request" />,
        message: error.message,
        level: 'error'
      }));
  }

  onLocalSaveUpdate() {
    const case_ = update(this.props.case, { $merge: this.state.diff_case });
    fetch_put(
      `/api/v01/voo/number_porting/${this.props.case.id}`,
      {
        routing_info: case_.routing_info,
        recipient_id: case_.recipient_id,
        donor_id: case_.donor_id,
        coded_id: case_.coded_id,
        installation_address: case_.installation_address,
        broadcasted_on: case_.broadcasted_on,
        due_date: case_.due_date,
        service_type: case_.service_type,
        sub_type: case_.sub_type,
      },
      this.props.auth_token
    )
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="porting-case-saved" defaultMessage="Porting case saved!" />,
          level: 'success'
        });
        this.props.onClose && this.props.onClose(true);
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="update-case-failed" defaultMessage="Failed to update porting case" />,
        message: error.message,
        level: 'error'
      }));
  }

  render() {
    const onClose = () => {
      this.setState({ diff_case: {} });
      this.props.onClose && this.props.onClose(false);
    };
    const case_ = update(this.props.case, { $merge: this.state.diff_case });
    const validBroadcast = case_.broadcasted_on === null || moment(case_.broadcasted_on, "DD/MM/YYYY HH:mm").isValid() ? null : "error";
    const validDueDate = case_.due_date === null || moment(case_.due_date, "DD/MM/YYYY HH:mm").isValid() ? null : "error";
    return (
      <Modal show={this.props.show} onHide={onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="update-number-portability" defaultMessage="Update a Number Portability" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            this.state.new_np_request && (
              <Alert bsStyle="success">
                <FormattedMessage id="new-request-started" defaultMessage="New request started" /><br />
                <i><Link to={"/transactions/" + this.state.new_np_request}><FormattedMessage id="see" defaultMessage="See" /> {this.state.new_np_request}</Link></i>
              </Alert>
            )
          }
          <Form horizontal>
            <StaticControl label={<FormattedMessage id='number' defaultMessage='Number' />} value={case_.number} />

            <FormGroup controlId="recipient">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="recipient" defaultMessage="Recipient" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="select" value={case_.recipient_id}
                  onChange={(e) => { this.setState({ diff_case: update(this.state.diff_case, { $merge: { recipient_id: parseInt(e.target.value) } }) }) }}>
                  <option value="" />
                  {
                    this.props.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup controlId="donor">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="donor" defaultMessage="Donor" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="select" value={case_.donor_id}
                  onChange={(e) => { this.setState({ diff_case: update(this.state.diff_case, { $merge: { donor_id: parseInt(e.target.value) } }) }) }}>
                  <option value="" />
                  {
                    this.props.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup controlId="broadcastedOn" validationState={validBroadcast}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="brodcast-date" defaultMessage="Brodcast date" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.broadcasted_on}
                  onChange={e => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { broadcasted_on: e.target.value } })
                  })} />
              </Col>
            </FormGroup>

            <FormGroup controlId="routingInfo">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="routing-info" defaultMessage="Routing info" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.routing_info}
                  onChange={e => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { routing_info: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="serviceType">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="service-type" defaultMessage="Serivce type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.service_type}
                  onChange={e => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { service_type: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="subType">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sub-type" defaultMessage="Sub type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.sub_type}
                  onChange={e => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { sub_type: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="installationAddress">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="installation-address" defaultMessage="Installation address" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.installation_address}
                  onChange={e => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { installation_address: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="codedId">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="coded-id" defaultMessage="Coded Id" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.coded_id}
                  onChange={(e) => this.setState({
                    diff_case: update(this.state.diff_case, { '$merge': { coded_id: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/*ownedCase(this.props.case) &&
            <Button onClick={this.onSaveUpdate.bind(this)} bsStyle="primary">
              <FormattedMessage id="Save @ Clear house" />
            </Button>
          */}
          <Button bsStyle="info" onClick={this.onLocalSaveUpdate.bind(this)} disabled={
            validBroadcast === "error" || validDueDate === "error"}>
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    )
  }
}


class DisconnectNumberPortingModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  onDisconnect() {
    this.setState({ error: undefined, new_np_request: undefined });
    // post a new PORTING CASE (type: disconnect as donor)
    fetch_post('/api/v01/voo/np_requests/disconnect', this.props.case, this.props.auth_token)
      .then(parseJSON)
      .then(data => this.setState({ new_np_request: data.id }))
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="create-disconnect-request-failed" defaultMessage="Failed to create disconnect request" />,
        message: error.message,
        level: 'error'
      }));
  }

  onLocalDisconnect() {
    this.setState({ error: undefined });
    fetch_delete(`/api/v01/voo/number_porting/${this.props.case.id}`, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="porting-case-deleted" defaultMessage="Porting case deleted" />,
          level: 'success'
        });
        this.props.onClose(true);
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="create-local-disconnect-request-failed" defaultMessage="Failed to create local disconnect request" />,
        message: error.message,
        level: 'error'
      }));
  }

  render() {
    const onClose = () => {
      this.setState({ error: undefined, new_np_request: undefined });
      this.props.onClose && this.props.onClose(false);
    };
    return (
      <Modal show={this.props.show} onHide={onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="disconnect-number" defaultMessage="Disconnect a Number" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            this.state.new_np_request && (
              <Alert bsStyle="success">
                <FormattedMessage id="new-request-started" defaultMessage="New request started" /><br />
                <i><Link to={"/transactions/" + this.state.success}><FormattedMessage id="see" defaultMessage="See" /> {this.state.new_np_request}</Link></i>
              </Alert>
            )
          }
          <Form horizontal>
            <StaticControl label={<FormattedMessage id='number' defaultMessage='Number' />} value={this.props.case.number} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/*ownedCase(this.props.case) &&
            <Button onClick={this.onDisconnect.bind(this)} bsStyle="danger">
              <FormattedMessage id="disconnect-clear-house" defaultMessage="Disconnect @ Clear house" />
            </Button>
          */}
          <Button onClick={this.onLocalDisconnect.bind(this)} bsStyle="warning">
            <FormattedMessage id="local-disconnect" defaultMessage="Local Disconnect" />
          </Button>
          <Button onClick={onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

class NewNumberPorting extends Component {
  constructor(props) {
    super(props);
    this.state = { case_: NewNumberPorting._freshCase() };
    this.onLocalCreate = this.onLocalCreate.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  static _freshCase() {
    return {
      number: '',
      routing_info: '',
      recipient_id: null,
      donor_id: null,
      coded_id: '',
      installation_address: '',
      broadcasted_on: null,
      due_date: null,
      service_type: null,
      sub_type: null,
    }
  }

  onClose(r) {
    this.setState({ case_: NewNumberPorting._freshCase() });
    this.props.onClose && this.props.onClose(r);
  }

  onLocalCreate() {
    const { case_ } = this.state;
    this.setState({ error: undefined });
    fetch_post('/api/v01/voo/number_porting', case_, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="new-local-porting-case" defaultMessage="New porting case created locally" />,
          level: 'success'
        });
        this.onClose(true);
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="create-porting-case-failed" defaultMessage="Failed to create porting case" />,
        message: error.message,
        level: 'error'
      }));
  }

  render() {
    const { case_ } = this.state;
    const validBroadcast = case_.broadcasted_on === null || moment(case_.broadcasted_on, "DD/MM/YYYY HH:mm").isValid() ? null : "error";
    const validRoutingInfo = case_.routing_info.length === 0 ? null : "success";
    return (
      <Modal show={this.props.show} onHide={() => this.onClose(false)} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="create-number-portability" defaultMessage="Create a Number Portability" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup controlId="number">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="number" defaultMessage="Number" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.number}
                  onChange={e => this.setState({
                    case_: update(this.state.case_, { '$merge': { number: e.target.value.trim() } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="recipient">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="recipient" defaultMessage="Recipient" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="select" value={case_.recipient_id}
                  onChange={(e) => { this.setState({ case_: update(case_, { $merge: { recipient_id: parseInt(e.target.value, 10) || e.target.value } }) }) }}>
                  <option value="" />
                  {
                    this.props.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup controlId="donor">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="donor" defaultMessage="Donor" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="select" value={case_.donor_id}
                  onChange={(e) => { this.setState({ case_: update(case_, { $merge: { donor_id: parseInt(e.target.value, 10) || e.target.value } }) }) }}>
                  <option value="" />
                  {
                    this.props.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup controlId="broadcastedOn" validationState={validBroadcast}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="broadcast-date" defaultMessage="Broadcast date" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.broadcasted_on}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { broadcasted_on: e.target.value } })
                  })} />
              </Col>
            </FormGroup>

            <FormGroup controlId="routingInfo" validationState={validRoutingInfo}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="routing-info" defaultMessage="Routing info" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.routing_info}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { routing_info: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="serviceType">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="service-type" defaultMessage="Service type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.service_type}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { service_type: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="subType">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sub-type" defaultMessage="Sub type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.sub_type}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { sub_type: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="installationAddress">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="installation-address" defaultMessage="Installation address" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.installation_address}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { installation_address: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId="codedId">
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="coded-id" defaultMessage="Coded Id" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={case_.coded_id}
                  onChange={e => this.setState({
                    case_: update(case_, { '$merge': { coded_id: e.target.value } })
                  })}
                />
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.onLocalCreate} disabled={
            validBroadcast === "error" || validRoutingInfo === "error"}>
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={() => this.onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

class PortingCaseActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showUpdate: false, showDelete: false,
    }
  }

  render() {
    const onClose = (force_refresh) => {
      this.setState({
        showUpdate: false,
        showDelete: false,
      });
      this.props.onClose && this.props.onClose(force_refresh);
    };

    return (
      <div>
        <ButtonToolbar>
          <Button onClick={() => this.setState({ showUpdate: true })} bsStyle="primary">
            <Glyphicon glyph="pencil" />
          </Button>
          <Button onClick={() => this.setState({ showDelete: true })} bsStyle="danger">
            <Glyphicon glyph="remove-sign" />
          </Button>
        </ButtonToolbar>
        <UpdateNumberPortingModal
          show={this.state.showUpdate}
          case={this.props.entry}
          operators={this.props.operators}
          onClose={onClose}
          auth_token={this.props.auth_token}
          notifications={this.props.notifications}
        />
        <DisconnectNumberPortingModal
          show={this.state.showDelete}
          case={this.props.entry}
          onClose={onClose}
          auth_token={this.props.auth_token}
          notifications={this.props.notifications}
        />
      </div>
    )
  }
}

export default class SearchPortingCases extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/voo/number_porting/search',
      collectionName: 'numbers',
      defaultCriteria: {
        number: { value: '', op: 'eq' },
        routing_info: { value: '', op: 'eq' },
        donor_id: { value: '', op: 'eq' },
        recipient_id: { value: '', op: 'eq' },
        created_on: { value: '', op: 'ge' },
      }
    }
  });

  componentDidMount() {
    this._refresh();
    fetchOperators(undefined, operators => this.setState({ operators: operators }));
  }

  _normalizeResource(r) {
    r.created_on = r.created_on && moment(r.created_on).format(DATE_FORMAT);
    r.broadcasted_on = r.broadcasted_on && moment(r.broadcasted_on).format(DATE_FORMAT);
    r.due_date = r.due_date && moment(r.due_date).format(DATE_FORMAT);
    return r;
  }

  render() {
    const { filter_criteria, resources, operators } = this.state;
    resources && operators && resources.forEach(r => {
      r._donor = operators.find(o => o.id === r.donor_id);
      r._recipient = operators.find(o => o.id === r.recipient_id);
    });
    const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value).isValid();

    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="porting-cases" defaultMessage="Porting cases" /></Breadcrumb.Item>
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
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    value={filter_criteria.number.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { value: e.target.value.trim() } } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="routing-info" defaultMessage="Routing info" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.routing_info.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { routing_info: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    type="input"
                    value={filter_criteria.routing_info.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { routing_info: { $merge: { value: e.target.value } } })
                    })} />
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
                        { donor_id: { $merge: { value: parseInt(e.target.value, 10) || e.target.value } } })
                    })}>
                    <option value="" />
                    {
                      operators && operators.map(o =>
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
                        { recipient_id: { $merge: { value: parseInt(e.target.value, 10) || e.target.value } } })
                    })}>
                    <option value="" />
                    {
                      operators && operators.map(o =>
                        <option key={o.id} value={o.id}>{o.name}</option>
                      )
                    }
                  </FormControl>
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
                    selected={filter_criteria.created_on.value.length !== 0 ? moment(filter_criteria.created_on.value) : null}
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
                        { created_on: { $merge: { value: d.format() } } })
                    })}
                    dateFormat="DD/MM/YYYY HH:mm"
                    locale="fr-fr"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60} />
                  <HelpBlock><FormattedMessage id="datepicker-note" defaultMessage="The date has to be formatted as DD/MM/YYYY HH:mm" /></HelpBlock>
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
                { title: <FormattedMessage id="number" defaultMessage="Number" />, field: 'number', sortable: true },
                { title: <FormattedMessage id="routing-info" defaultMessage="Routing info" />, field: 'routing_info', sortable: true },
                { title: <FormattedMessage id="donor" defaultMessage="Donor" />, field: '_donor', render: c => c._donor ? c._donor.name : 'n/a' },
                { title: <FormattedMessage id="recipient" defaultMessage="Recipient" />, field: '_recipient', render: c => c._recipient ? c._recipient.name : 'n/a' },
                { title: <FormattedMessage id="created-on" defaultMessage="Created on" />, field: 'created_on', sortable: true },
                {
                  title: '', render: n => (
                    isAllowed(this.props.user_info.ui_profile, pages.npact_porting_cases, access_levels.modify) &&
                    <PortingCaseActions
                      onClose={force_refresh => force_refresh && this._refresh()}
                      operators={operators || []}
                      entry={n}
                      {...this.props}
                    />
                  )
                },
              ]}
              pagination={this.state.pagination}
              data={resources}
              onSort={s => this._refresh(undefined, s)}
              onPagination={p => this._refresh(p)}
            />
          </Panel.Body>
        </Panel>

        {isAllowed(this.props.user_info.ui_profile, pages.npact_porting_cases, access_levels.modify) &&
          <Panel>
            <Panel.Body>
              <Button bsStyle="primary" onClick={() => this.setState({ showAdd: true })}>
                <FormattedMessage id="add-porting-case" defaultMessage="Add porting case" />
              </Button>
              <NewNumberPorting
                show={this.state.showAdd}
                operators={operators || []}
                onClose={(r) => {
                  this.setState({ showAdd: false });
                  r && this._refresh();
                }}
                {...this.props} />
            </Panel.Body>
          </Panel>
        }
      </div>
    )
  }
}
