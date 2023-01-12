import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import update from 'immutability-helper';

import { FormattedMessage } from 'react-intl';
import moment from 'moment';

import { DATE_FORMAT } from './np-requests';
import {fetch_delete, fetch_put, NotificationsManager} from "../utils";
import { ApioDatatable } from '../utils/datatable';
import { Search, StaticControl } from "../utils/common";
import { access_levels, isAllowed, pages } from "../utils/user";


class MVNONumberActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showUpdate: false, showDelete: false,
      _pendingChanges: {},
    }
    this.onClose = this.onClose.bind(this);
  }

  onSave() {
    const { _pendingChanges } = this.state;
    const { MVNOEntry, auth_token, notifications } = this.props;
    fetch_put(`/api/v01/npact/mvno_numbers/${MVNOEntry.id}`, _pendingChanges, auth_token)
      .then(() => {
        notifications.addNotification({
          message: <FormattedMessage id="update-mvno-saved" defaultMessage="MVNO entry saved!" />,
          level: 'success'
        });
        this.onClose();
      })
      .catch(error => notifications.addNotification({
        title: <FormattedMessage id="update-mvno-failed" defaultMessage="Failed to update MVNO entry" />,
        message: error.message,
        level: 'error'
      }));
  }

  onDelete() {
    fetch_delete(`/api/v01/npact/mvno_numbers/${this.props.MVNOEntry.id}`, this.props.auth_token)
      .then(() => {
        this.setState({ showUpdate: false, showDelete: false });
        this.props.onDelete && this.props.onDelete();
        NotificationsManager.success(
          <FormattedMessage id="mvno-deleted" defaultMessage="MVNO entry deleted!" />,
        )
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="delete-mvno-failed" defaultMessage="Failed to delete MVNO entry" />,
        error.message,
      ));
  }

  onClose() {
    this.setState({
      showUpdate: false,
      showDelete: false,
      _pendingChanges: {}
    });
    this.props.onClose && this.props.onClose();
  }

  render() {
    const { showDelete, showUpdate, _pendingChanges } = this.state;
    const _entry = update(this.props.MVNOEntry, { $merge: _pendingChanges });
    const validDateTime = moment(_entry.request_date_time, "DD/MM/YYYY HH:mm").isValid() ? null : "error";

    return <div>
      <ButtonToolbar>
        <Button onClick={() => this.setState({ showUpdate: true })} bsStyle="primary">
          <Glyphicon glyph="pencil" />
        </Button>
        <Button onClick={() => this.setState({ showDelete: true })} bsStyle="danger">
          <Glyphicon glyph="remove-sign" />
        </Button>
      </ButtonToolbar>
      <Modal show={showUpdate} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="update" defaultMessage="Update" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticControl label={<FormattedMessage id='number' defaultMessage='Number' />} value={_entry.number} />

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="transaction-id" defaultMessage="Transaction id" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={_entry.transaction_id}
                  onChange={e =>
                    this.setState({ _pendingChanges: update(_pendingChanges, { $merge: { transaction_id: e.target.value } }) })
                  } />
              </Col>
            </FormGroup>

            <FormGroup validationState={validDateTime}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="request-date-time" defaultMessage="Request date time" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={_entry.request_date_time}
                  onChange={e =>
                    this.setState({ _pendingChanges: update(_pendingChanges, { $merge: { request_date_time: e.target.value } }) })
                  } />
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.onSave.bind(this)} disabled={validDateTime === "error"}>
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDelete} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="confirm" defaultMessage="Confirm" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <StaticControl label={<FormattedMessage id='number' defaultMessage='Number' />} value={_entry.number} />
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


export default class SearchMVNO extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/npact/mvno_numbers/search',
      collectionName: 'MVNONumbers',
      defaultCriteria: {
        number: { value: '', op: 'eq' },
        request_date_time: { value: '', op: 'eq' },
        transaction_id: { value: '', op: 'eq' },
      }
    }
  });

  _normalizeResource(r) {
    r.request_date_time = moment(r.request_date_time).format(DATE_FORMAT);
    return r;
  }

  render() {
    const { filter_criteria, resources, pagination, sorting_spec } = this.state;

    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="mvno-numbers" defaultMessage="MVNO Numbers" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel defaultExpanded={false}>
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
                  <FormControl componentClass="select" value={filter_criteria.number.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl value={filter_criteria.number.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { value: e.target.value.trim() } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="request-datetime" defaultMessage="Request datetime" />
                </Col>

                <Col sm={1}>
                  <FormControl componentClass="select" value={filter_criteria.request_date_time.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { request_date_time: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="gt">&gt;</option>
                    <option value="ge">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="le">&lt;=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl value={filter_criteria.request_date_time.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { request_date_time: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="transaction-id" defaultMessage="Transaction id" />
                </Col>

                <Col sm={1}>
                  <FormControl componentClass="select" value={filter_criteria.transaction_id.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { transaction_id: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl value={filter_criteria.transaction_id.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { transaction_id: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup>
                <Col smOffset={1} sm={1}>
                  <Button onClick={() => this._refresh({ page_number: 1 })} bsStyle="info">
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
              sorting_spec={sorting_spec}
              headers={[
                { title: <FormattedMessage id="number" defaultMessage="Number" />, field: 'number', sortable: true },
                { title: <FormattedMessage id="transaction-id" defaultMessage="Transaction id" />, field: 'transaction_id', sortable: true },
                { title: <FormattedMessage id="request-datetime" defaultMessage="Request datetime" />, field: 'request_date_time', sortable: true },
                {
                  title: '', render: n => (
                    isAllowed(this.props.user_info.ui_profile, pages.npact_mvno_numbers, access_levels.modify) &&
                    <MVNONumberActions
                      onDelete={() => this._refresh()}
                      MVNOEntry={n}
                      onClose={() => this._refresh()}
                      {...this.props}
                    />
                  )
                },
              ]}
              pagination={pagination}
              data={resources}
              onSort={s => this._refresh(undefined, s)}
              onPagination={p => this._refresh(p)}
            />
          </Panel.Body>
        </Panel>
      </div>
    )
  }
}