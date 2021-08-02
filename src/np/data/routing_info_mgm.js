import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Modal from 'react-bootstrap/lib/Modal';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import { FormattedMessage } from 'react-intl';

import {fetch_get, fetch_post, fetch_delete, fetch_put, NotificationsManager} from "../../utils";
import update from "immutability-helper/index";
import { ApioDatatable } from "../../utils/datatable";
import { Search, StaticControl } from "../../utils/common";
import { access_levels, pages, isAllowed } from "../../utils/user";
import { fetchOperators } from './operator_mgm';


export function fetchRoutes(onSuccess) {
  fetch_get("/api/v01/npact/routing_info/search")
    .then(data => onSuccess(data.routing_info))
    .catch(error => NotificationsManager.error("Failed to fetch routes", error.message))
}

class NewRoutingInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routing_info: {
        main_access_area: '',
        routing_info: '',
        operator_id: '',
      },
      show: false,
    };
    this.onClose = this.onClose.bind(this);
  }

  componentWillReceiveProps(props) {
    if (this.state.routing_info.operator_id === '' && props.operators && props.operators.length > 0) {
      this.setState({ routing_info: update(this.state.routing_info, { $merge: { operator_id: props.operators[0].id } }) });
    }
  }

  onSave() {
    const { routing_info } = this.state;
    fetch_post('/api/v01/npact/routing_info', routing_info, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="new-routing-saved" defaultMessage="New routing info saved!" />,
          level: 'success'
        });
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="new-routing-failed" defaultMessage="Failed to save" />,
        message: error.message,
        level: 'error'
      }));
  }

  onClose() {
    this.setState({
      routing_info: {
        main_access_area: '',
        routing_info: '',
        operator_id: '',
      },
      show: false,
    });
    this.props.onClose && this.props.onClose();
  }

  render() {
    return (
      <div>
        <Button bsStyle="primary" onClick={() => this.setState({ show: true })}>
          <FormattedMessage id="add-routing-info" defaultMessage="Add routing info" />
        </Button>
        <Modal show={this.state.show} onHide={this.onClose} backdrop={false}>
          <Modal.Header closeButton>
            <Modal.Title><FormattedMessage id="new-routing-info" defaultMessage="New Routing info" /></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="main-access-area" defaultMessage="Main access area" />
                </Col>

                <Col sm={9}>
                  <FormControl type="input" value={this.state.routing_info.main_access_area}
                    onChange={e => this.setState({
                      routing_info: update(this.state.routing_info, { $merge: { main_access_area: e.target.value } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="routing-info" defaultMessage="Routing info" />
                </Col>

                <Col sm={9}>
                  <FormControl type="input" value={this.state.routing_info.routing_info}
                    onChange={e => this.setState({
                      routing_info: update(this.state.routing_info, { $merge: { routing_info: e.target.value } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="operator" defaultMessage="Operator" />
                </Col>

                <Col sm={9}>
                  <FormControl componentClass="select" value={this.state.routing_info.operator_id}
                    onChange={e => this.setState({
                      routing_info: update(this.state.routing_info, { $merge: { operator_id: parseInt(e.target.value, 10) } })
                    })}>
                    {
                      this.props.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                    }
                  </FormControl>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="primary" onClick={this.onSave.bind(this)}>
              <FormattedMessage id="save" defaultMessage="Save" />
            </Button>
            <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}


class RoutingInfoActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showUpdate: false, showDelete: false,
      _pendingChanges: {},
    };
    this.onClose = this.onClose.bind(this);
  }

  onSave() {
    const { _pendingChanges } = this.state;
    const { entry, auth_token } = this.props;
    fetch_put(`/api/v01/npact/routing_info/${entry.id}`, _pendingChanges, auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="routing-updated" defaultMessage="Routing info updated!" />,
          level: 'success'
        });
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="routing-failed" defaultMessage="Failed to save" />,
        message: error.message,
        level: 'error'
      }));
  }

  onDelete() {
    fetch_delete(`/api/v01/npact/routing_info/${this.props.entry.id}`, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="routing-deleted" defaultMessage="Routing info deleted!" />,
          level: 'success'
        });
        this.props.onDelete && this.props.onDelete();
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="routing-delete-failed" defaultMessage="Failed to delete" />,
        message: error.message,
        level: 'error'
      }));
  }

  onClose() {
    this.props.onClose && this.props.onClose();
    this.setState({
      showUpdate: false,
      showDelete: false,
      _pendingChanges: {},
    });
  }

  render() {
    const _entry = update(this.props.entry, { $merge: this.state._pendingChanges });

    return <div>
      <ButtonToolbar>
        <Button onClick={() => this.setState({ showUpdate: true })} bsStyle="primary">
          <Glyphicon glyph="pencil" />
        </Button>
        <Button onClick={() => this.setState({ showDelete: true })} bsStyle="danger">
          <Glyphicon glyph="remove-sign" />
        </Button>
      </ButtonToolbar>
      <Modal show={this.state.showUpdate} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="update" defaultMessage="Update" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticControl
              label={<FormattedMessage id="main-access-area" defaultMessage='Main access area' />}
              value={_entry.main_access_area} />
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="routing-info" defaultMessage="Routing info" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={_entry.routing_info}
                  onChange={e =>
                    this.setState({ _pendingChanges: update(this.state._pendingChanges, { $merge: { routing_info: e.target.value } }) })
                  } />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="operator" defaultMessage="Operator" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={_entry.operator_id}
                  onChange={e =>
                    this.setState({ _pendingChanges: update(this.state._pendingChanges, { $merge: { operator_id: parseInt(e.target.value, 10) } }) })
                  }>
                  {
                    this.props.operators.map(o =>
                      <option key={o.id} value={o.id}>{o.name}</option>
                    )
                  }
                </FormControl>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.onSave.bind(this)}>
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
      <Modal show={this.state.showDelete} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="confirm" defaultMessage="Confirm" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticControl
              label={<FormattedMessage id="main-access-area" defaultMessage='Main access area' />}
              value={_entry.main_access_area} />
            <StaticControl
              label={<FormattedMessage id="routing-info" defaultMessage='Routing info' />}
              value={_entry.routing_info} />
            <StaticControl
              label={<FormattedMessage id="opertor" defaultMessage='Operator' />}
              value={_entry.operator_name} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onDelete.bind(this)} bsStyle="danger">
            <FormattedMessage id="delete" defaultMessage="Delete" />
          </Button>
          <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    </div>
  }
}


export default class SearchRoutingInfo extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/npact/routing_info/search',
      collectionName: 'routing_info',
      defaultCriteria: {
        routing_info: { value: '', op: 'eq' },
        main_access_area: { value: '', op: 'eq' },
        operator_id: { value: '', op: 'eq' },
      }
    }
  });

  componentDidMount() {
    document.title = "Routing";
    this._refresh();
    fetchOperators(undefined, operators => this.setState({ operators: operators }));
  }

  render() {
    const { filter_criteria, resources, operators } = this.state;
    resources && operators && resources.forEach(r => {
      const op = operators.find(o => o.id === r.operator_id);
      r.operator_name = op !== undefined ? op.name : '';
    });

    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="routing-info" defaultMessage="Routing info" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel defaultExpanded={false} >
          <Panel.Heading>
            <Panel.Title toggle><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="main-access-area" defaultMessage="Main access area" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.main_access_area.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { main_access_area: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    type="input"
                    value={filter_criteria.main_access_area.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { main_access_area: { $merge: { value: e.target.value } } })
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
                  <FormattedMessage id="operator" defaultMessage="Operator" />
                </Col>
                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.operator_id.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { operator_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                  </FormControl>
                </Col>
                <Col sm={8}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.operator_id.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { operator_id: { $merge: { value: parseInt(e.target.value, 10) || e.target.value } } })
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
                <Col smOffset={1} sm={1}>
                  <Button bsStyle="info" onClick={() => this._refresh({ page_number: 1 })}>
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
                { title: <FormattedMessage id="main-access-area" defaultMessage="Main access area" />, field: 'main_access_area', sortable: true },
                { title: <FormattedMessage id="routing-info" defaultMessage="Routing info" />, field: 'routing_info', sortable: true },
                { title: <FormattedMessage id="operator" defaultMessage="Operator" />, field: 'operator_name' },
                {
                  title: '', render: n => (
                    isAllowed(this.props.user_info.ui_profile, pages.npact_routing_info, access_levels.modify) &&
                    <RoutingInfoActions
                      onClose={() => this._refresh()}
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
        {isAllowed(this.props.user_info.ui_profile, pages.npact_routing_info, access_levels.modify) &&
          <Panel>
            <Panel.Body>
              <NewRoutingInfo
                operators={operators || []}
                onClose={() => this._refresh()}
                {...this.props} />
            </Panel.Body>
          </Panel>
        }
      </div>
    )
  }
}
