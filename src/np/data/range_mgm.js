import React, {Component, useCallback, useEffect, useState} from 'react';

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
import ProgressBar from "react-bootstrap/lib/ProgressBar";

import { FormattedMessage } from 'react-intl';

import {downloadFile, fetch_delete, fetch_post, fetch_put, NotificationsManager} from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import update from "immutability-helper";
import { Search, StaticControl } from "../../utils/common";
import { access_levels, pages, isAllowed } from "../../utils/user";
import { fetchOperators } from './operator_mgm';
import {useDropzone} from "react-dropzone";
import Alert from "react-bootstrap/lib/Alert";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner} from "@fortawesome/free-solid-svg-icons";
import {readFile} from "../../orchestration/startup_events";
import Checkbox from "react-bootstrap/lib/Checkbox";


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
        NotificationsManager.success(
          <FormattedMessage id="new-range-saved" defaultMessage="New range saved!" />,
        );
        this.onClose();
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="range-failed" defaultMessage="Failed to save the range" />,
        error.message,
      ));
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

function ImportRanges({onChange}) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replace, setReplace] = useState(false);
  const [responses, setResponses] = useState(null);

  useEffect(() => {
    if(responses === null) {
      return;
    }

    const errors = responses.reduce((o, e) => { o.push(...e.errors); return o; }, []);
    const total = responses.reduce((t, o) => t + o.counter, 0);

    if(errors.length !== 0) {
      downloadFile(`import_errors_report.txt`, 'text/plain', errors.join('\n'));
    }

    NotificationsManager.success(
      `${total} ranges imported, with ${errors.length} errors`
    );

    setResponses(null);
  }, [responses]);

  const onClose = () => {
    setShow(false);
    setError(null);
    setLoading(false);
    setProgress(0);
    setReplace(false);
    setResponses(null);
    onChange();
  }

  const onDrop = useCallback((_acceptedFiles, _rejectedFiles) => {
    if (_rejectedFiles.length > 0) {
      setError(_rejectedFiles[0].errors[0].message);
      return;
    }
    setError(null);
    setLoading(true);
    setProgress(0);

    readFile(_acceptedFiles[0]).then(async (content) => {
      const lines = content.split('\n');
      // group lines by 500
      const ranges = [];
      let currentRange = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l === '') {
          continue;
        }
        const [number_from, number_to, number_type, operator] = l.split(',');
        if (number_from === '') {
          continue;
        }
        const nbFrom = parseInt(number_from, 10);
        if (isNaN(nbFrom)) {
          setError(`Invalid number from: ${number_from} (line ${i + 1})`)
          return;
        }
        const nbTo = parseInt(number_to, 10);
        if (isNaN(nbTo)) {
          setError(`Invalid number to: ${number_to} (line ${i + 1})`)
          return;
        }
        currentRange.push([
          nbFrom,
          nbTo,
          number_type,
          operator.trim(),
        ]);

        if (currentRange.length === 2000) {
          ranges.push(currentRange);
          currentRange = [];
        }
      }

      if (currentRange.length > 0) {
        ranges.push(currentRange);
      }

      let responses = [];

      for (let i = 0; i < ranges.length; i++) {
        let resp = await fetch_post(`/api/v01/npact/ranges?replace=${replace && i===0?"y":"n"}`, {ranges: ranges[i]});
        let body = await resp.json();
        responses.push(body);
        setProgress((i + 1) / ranges.length);
      }

      setResponses(responses);
      onClose();
    }).catch(error => {
      setError(error.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [replace, onClose]);

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({
    accept: 'text/csv',
    maxFiles: 1,
    onDrop: onDrop,
  });

  return (
    <>
      <Button bsStyle="primary" onClick={() => setShow(true)}>
        <FormattedMessage id="import" defaultMessage="Import" />
      </Button>
      <Modal show={show} onHide={onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FormattedMessage id="import-operators" defaultMessage="Import operators" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup>
              <section className="dropcontainer" >
                <div {...getRootProps({className: 'dropzone'})} >
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
              </section>
            </FormGroup>
            <FormGroup>
              <Col smOffset={2} sm={9}>
                Files need to be CSV without headers and with columns "range start", "range end", "number type" and "operator name"
              </Col>
            </FormGroup>
            <FormGroup>
              <Col smOffset={2} sm={9}>
                <Checkbox checked={replace} onChange={e => setReplace(e.target.checked)}>
                  <FormattedMessage id="replace-existing" defaultMessage="Replace existing ranges" />
                </Checkbox>
              </Col>
            </FormGroup>
          </Form>
          {error && <Alert bsStyle="danger">{error}</Alert>}
          {
            loading &&
            <Panel>
              <Panel.Body>
                <FontAwesomeIcon icon={faSpinner} aria-hidden="true" style={{'fontSize': '24px'}} spin />Don't close this window, it may take a while...
                <ProgressBar now={progress * 100} label={`importing... ${Math.floor(progress * 100)}%`} />
              </Panel.Body>
            </Panel>
          }
        </Modal.Body>
      </Modal>
    </>
  );
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
        NotificationsManager.success(
          <FormattedMessage id="saved" defaultMessage="Saved!" />,
        );
        this.onClose();
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="range-failed" defaultMessage="Failed to save the range" />,
        error.message,
      ));
  }

  onDelete() {
    fetch_delete(`/api/v01/npact/ranges/${this.props.entry.id}`, this.props.auth_token)
      .then(() => {
        NotificationsManager.success(
          <FormattedMessage id="range-deleted" defaultMessage="Range deleted!" />,
        );
        this.props.onDelete && this.props.onDelete();
        this.onClose();
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="range-delete-failed" defaultMessage="Failed to delete the range" />,
        error.message,
      ));
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
              <ButtonToolbar>
                <NewRange
                  operators={operators || []}
                  onClose={() => this._refresh()}
                  {...this.props} />
                <ImportRanges
                  onChange={() => this._refresh()} />
              </ButtonToolbar>
            </Panel.Body>
          </Panel>
        }
      </div>
    )
  }
}
