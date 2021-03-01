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

import { FormattedMessage } from 'react-intl';

import { fetch_delete, fetch_post, fetch_put } from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import update from "immutability-helper";
import { Search, StaticControl } from "../../utils/common";
import { access_levels, pages, isAllowed } from "../../utils/user";
import { fetchOperators } from './operator_mgm';


class NewRange extends Component {
  constructor(props) {
    super(props);
    this.state = {
      range: {
        number_from: '',
        number_to: '',
        number_type: 'GEO',
        operator_id: '',
      },
      show: false,
    };
    this.onClose = this.onClose.bind(this);
  }

  componentWillReceiveProps(props) {
    if (this.state.range.operator_id === '' && props.operators && props.operators.length > 0) {
      this.setState({ range: update(this.state.range, { $merge: { operator_id: props.operators[0].id } }) });
    }
  }

  onSave() {
    const { range } = this.state;
    fetch_post('/api/v01/npact/ranges', range, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="new-range-saved" defaultMessage="New range saved!" />,
          level: 'success'
        });
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="range-failed" defaultMessage="Failed to save the range" />,
        message: error.message,
        level: 'error'
      }));
  }

  onClose() {
    this.setState({
      range: {
        number_from: '',
        number_to: '',
        number_type: 'GEO',
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
          <FormattedMessage id="add-range" defaultMessage="Add range" />
        </Button>
        <Modal show={this.state.show} onHide={this.onClose} backdrop={false}>
          <Modal.Header closeButton>
            <Modal.Title><FormattedMessage id="new-range" defaultMessage="New Range" /></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-from" defaultMessage="Number from" />
                </Col>

                <Col sm={9}>
                  <FormControl type="number" value={this.state.range.number_from}
                    onChange={e => this.setState({
                      range: update(this.state.range, { $merge: { number_from: parseInt(e.target.value, 10) || e.target.value } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-to" defaultMessage="Number to" />
                </Col>

                <Col sm={9}>
                  <FormControl type="number" value={this.state.range.number_to}
                    onChange={e => this.setState({
                      range: update(this.state.range, { $merge: { number_to: parseInt(e.target.value, 10) || e.target.value } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-type" defaultMessage="Number type" />
                </Col>

                <Col sm={9}>
                  <FormControl componentClass="select" value={this.state.range.number_type}
                    onChange={e => this.setState({
                      range: update(this.state.range, { $merge: { number_type: e.target.value } })
                    })}>
                    <option value="MOBILE">MOBILE</option>
                    <option value="GEO">GEO</option>
                    <option value="NON GEO">NON GEO</option>
                  </FormControl>
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="operator" defaultMessage="Operator" />
                </Col>

                <Col sm={9}>
                  <FormControl componentClass="select" value={this.state.range.operator_id}
                    onChange={e => this.setState({
                      range: update(this.state.range, { $merge: { operator_id: parseInt(e.target.value, 10) } })
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

class RangeActions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showUpdate: false, showDelete: false,
      _pendingChanges: {},
    };
    this.onClose = this.onClose.bind(this);
  }

  onSave() {
    const { entry } = this.props;
    const { _pendingChanges } = this.state;
    fetch_put(`/api/v01/npact/ranges/${entry.id}`, _pendingChanges, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="saved" defaultMessage="Saved!" />,
          level: 'success'
        });
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="range-failed" defaultMessage="Failed to save the range" />,
        message: error.message,
        level: 'error'
      }));
  }

  onDelete() {
    fetch_delete(`/api/v01/npact/ranges/${this.props.entry.id}`, this.props.auth_token)
      .then(() => {
        this.props.notifications.addNotification({
          message: <FormattedMessage id="range-deleted" defaultMessage="Range deleted!" />,
          level: 'success'
        });
        this.props.onDelete && this.props.onDelete();
        this.onClose();
      })
      .catch(error => this.props.notifications.addNotification({
        title: <FormattedMessage id="range-delete-failed" defaultMessage="Failed to delete the range" />,
        message: error.message,
        level: 'error'
      }));
  }

  onClose() {
    this.props.onClose && this.props.onClose();
    this.setState({
      showUpdate: false,
      showDelete: false,
      _pendingChanges: {}
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
              label={<FormattedMessage id="number-from" defaultMessage='Number from' />}
              value={_entry.number_from} />
            <StaticControl
              label={<FormattedMessage id="number-to" defaultMessage='Number to' />}
              value={_entry.number_to} />

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="type" defaultMessage="Type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={_entry.number_type}
                  onChange={e =>
                    this.setState({ _pendingChanges: update(this.state._pendingChanges, { $merge: { number_type: e.target.value } }) })
                  }>
                  <option value="MOBILE">MOBILE</option>
                  <option value="GEO">GEO</option>
                  <option value="NON GEO">NON GEO</option>
                </FormControl>
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
              label={<FormattedMessage id="number-from" defaultMessage='Number from' />}
              value={_entry.number_from} />
            <StaticControl
              label={<FormattedMessage id="number-to" defaultMessage='Number to' />}
              value={_entry.number_to} />
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

export default class SearchRange extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/npact/ranges/search',
      collectionName: 'ranges',
      defaultCriteria: {
        number_from: { value: '', op: 'eq' },
        number_to: { value: '', op: 'eq' },
        number_type: { value: '', op: 'eq' },
        start_date: { value: '', op: 'eq' },
        operator_id: { value: '', op: 'eq' },
      }
    }
  });

  componentDidMount() {
    document.title = "Ranges";
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
          <Breadcrumb.Item active><FormattedMessage id="ranges" defaultMessage="Ranges" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel defaultExpanded={false} >
          <Panel.Heading>
            <Panel.Title toggle><div><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></div></Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-from" defaultMessage="Number from" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.number_from.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_from: { $merge: { op: e.target.value } } })
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
                  <FormControl
                    type="input"
                    value={filter_criteria.number_from.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_from: { $merge: { value: e.target.value && parseInt(e.target.value, 10) } } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-to" defaultMessage="Number to" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.number_to.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_to: { $merge: { op: e.target.value } } })
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
                  <FormControl
                    type="input"
                    value={filter_criteria.number_to.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_to: { $merge: { value: e.target.value && parseInt(e.target.value, 10) } } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number-type" defaultMessage="Number type" />
                </Col>
                <Col sm={1}>
                  <FormControl componentClass="select"
                    value={filter_criteria.number_type.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_type: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="is_null">is null</option>
                  </FormControl>
                </Col>
                <Col sm={8}>
                  <FormControl componentClass="select"
                    value={filter_criteria.number_type.value}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number_type: { $merge: { value: e.target.value } } })
                    })}>
                    <option value="" />
                    <option value="MOBILE">MOBILE</option>
                    <option value="GEO">GEO</option>
                    <option value="NON GEO">NON GEO</option>
                  </FormControl>
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
                { title: <FormattedMessage id="from" defaultMessage="From" />, field: 'number_from', sortable: true },
                { title: <FormattedMessage id="to" defaultMessage="To" />, field: 'number_to', sortable: true },
                { title: <FormattedMessage id="type" defaultMessage="Type" />, field: 'number_type', sortable: true },
                { title: <FormattedMessage id="operator" defaultMessage="Operator" />, field: 'operator_name' },
                {
                  title: '', render: n => (
                    isAllowed(this.props.user_info.ui_profile, pages.npact_ranges, access_levels.modify) &&
                    <RangeActions
                      onClose={() => !this.cancelLoad && this._refresh()}
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

        {isAllowed(this.props.user_info.ui_profile, pages.npact_ranges, access_levels.modify) &&
          <Panel>
            <Panel.Body>
              <NewRange
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
