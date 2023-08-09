import React, { Component, useState, useCallback } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Col from 'react-bootstrap/lib/Col';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Table from 'react-bootstrap/lib/Table';
import Alert from "react-bootstrap/lib/Alert";

import { FormattedMessage } from 'react-intl';

import {fetch_delete, fetch_post, fetch_put, fetch_get, NotificationsManager} from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import { access_levels, isAllowed, pages } from "../../utils/user";
import { Search } from "../../utils/common";
import update from "immutability-helper/index";
import Checkbox from "react-bootstrap/lib/Checkbox";
import {readFile} from "../../orchestration/startup_events";
import {useDropzone} from "react-dropzone";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner} from "@fortawesome/free-solid-svg-icons";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import {DeleteConfirmButton} from "../../utils/deleteConfirm";


export function fetchOperators(token, onSuccess, onError) {
  fetch_get('/api/v01/npact/operators', token)
    .then(data => (
      onSuccess && onSuccess(data.operators.sort((a, b) => (a.name < b.name) ? -1 : 1))
    ))
    .catch(error => onError && onError(error));
}


class Operator extends Component {
  static defaultProps = {
    button: <Glyphicon glyph="pencil" />,
    title: <FormattedMessage id="update-operator" defaultMessage="Update operator" />,
    operator: { short_name: null, name: null },
    bsStyle: 'primary',
  };

  constructor(props) {
    super(props);
    this.state = {
      show: false,
      operator: this.props.operator,
    };
    this.onClose = this.onClose.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave(e) {
    e.preventDefault();
    const { operator } = this.state;
    fetch_put(
      `/api/v01/npact/operators/${this.props.operator.id}`,
      {
        'name': operator.name,
        'short_name': operator.short_name,
        'contact_email': operator.contact_email,
        'default': operator.default,
      }
    )
      .then(() => {
        this.onClose();
        NotificationsManager.success(<FormattedMessage id="operator-updated" defaultMessage="Operator saved!" />);
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="operator-update-failed" defaultMessage="Failed to save" />,
        error.message
      ));
  }

  onClose() {
    this.setState({ show: false, operator: this.props.operator });
    this.props.onClose && this.props.onClose();
  }

  render() {
    const { show, operator } = this.state;
    const { title, button, bsStyle } = this.props;
    return (
      <div>
        <Button bsStyle={bsStyle} onClick={() => this.setState({ show: true })}>{button}</Button>
        <Modal show={show} onHide={this.onClose} backdrop={false}>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="short-name" defaultMessage="Short name" />
                </Col>

                <Col sm={9}>
                  <FormControl type="text" value={operator.short_name}
                    onChange={e => this.setState({ operator: update(operator, { '$merge': { short_name: e.target.value } }) })}
                  />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="system-name" defaultMessage="System name" />
                </Col>

                <Col sm={9}>
                  <FormControl type="text" value={operator.name}
                    onChange={e => this.setState({ operator: update(operator, { '$merge': { name: e.target.value } }) })}
                  />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="contact-email" defaultMessage="Contact email" />
                </Col>

                <Col sm={9}>
                  <FormControl type="text" value={operator.contact_email}
                    onChange={e => this.setState({ operator: update(operator, { '$merge': { contact_email: e.target.value } }) })}
                  />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="default" defaultMessage="Default" />
                </Col>

                <Col sm={9}>
                  <Checkbox checked={operator.default} onChange={e => this.setState({ operator: update(operator, { '$merge': { default: e.target.checked } }) })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col smOffset={2} sm={10}>
                  <Button bsStyle="primary" onClick={this.onSave}>
                    <FormattedMessage id="save" defaultMessage="Save" />
                  </Button>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    )
  }
}

class NewOperator extends Operator {
  static defaultProps = update(Operator.defaultProps, {
    '$merge': {
      button: <FormattedMessage id="add-operator" defaultMessage="Add operator" />,
      title: <FormattedMessage id="new-operator" defaultMessage="New operator" />,
      bsStyle: 'primary',
    }
  });

  onSave(e) {
    e.preventDefault();
    fetch_post(
      '/api/v01/npact/operators',
      this.state.operator
    )
      .then(() => {
        this.onClose();
        NotificationsManager.success(
          <FormattedMessage id="operator-saved" defaultMessage="New operator saved!" />
        )
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="operator-failed" defaultMessage="Failed to save" />,
        error.message
      ));
  }
}

function ImportOperators({onChange}) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState([]);
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);

  const onDrop = useCallback((_acceptedFiles, _rejectedFiles) => {
    setOperators([]);
    setRejectedFiles(_rejectedFiles);

    setLoading(true);
    const promises = [];
    for (let i = 0; i < _acceptedFiles.length; i++) {
      const file = _acceptedFiles[i];
      // read csv file and POST entries 1-by-1 to the server
      promises.push(readFile(file).then(async content => {
        const lines = content.split('\n');
        const ops = [];
        const headers = ["short_name", "name", "contact_email"];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === '') {
            continue;
          }
          const values = lines[i].split(',');
          const operator = {source: file.path + ':' + (i + 1)};
          for (let j = 0; j < headers.length; j++) {
            operator[headers[j]] = values[j];
          }
          ops.push(operator);
        }

        for (let i = 0; i < ops.length; i++) {
          const {short_name, name, context_email} = ops[i];
          try {
            await fetch_post('/api/v01/npact/operators', {short_name, name, context_email})
            ops[i].status = 'success';
          } catch (error) {
              ops[i].status = 'error - ' + error.message;
          }
        }

        setOperators(o => update(o, {'$push': ops}));
      }));
    }

    Promise.all(promises).then(() => {
      setLoading(false);
    }).catch(error => {
      setError(error.message);
    });
  }, []);

  const {
    // acceptedFiles,
    // fileRejections,
    getRootProps,
    getInputProps,
  } = useDropzone({
    accept: 'text/csv',
    onDrop: onDrop,
  });

  const onClose = () => {
    setShow(false);
    setError(null);
    setLoading(false);
    setOperators([]);
    onChange();
  }

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
                Files need to be CSV without headers and with columns "name", "short name" and "contact email"
              </Col>
            </FormGroup>
          </Form>
          {
            loading &&
            <Panel>
              <Panel.Body>
                <FontAwesomeIcon icon={faSpinner} aria-hidden="true" style={{'fontSize': '24px'}} spin />
              </Panel.Body>
            </Panel>
          }
          {error && <Alert bsStyle="danger">{error}</Alert>}
          {(acceptedFiles?.length > 0 || rejectedFiles?.length > 0) && (
            <Table striped bordered condensed hover>
              <thead>
                <tr>
                  <th><FormattedMessage id="source" defaultMessage="Source" /></th>
                  <th><FormattedMessage id="size" defaultMessage="Size" /></th>
                </tr>
              </thead>
              <tbody>
                {rejectedFiles.map(({file, errors}, i) => (
                  <tr key={`rej-${i}`}>
                    <td>{file.path}</td>
                    <td>{errors[0].code} {errors[0].message}</td>
                  </tr>
                ))}
                {acceptedFiles.map((file, i) => (
                  <tr key={`acc-${i}`}>
                    <td>{file.path}</td>
                    <td>{file.size} bytes</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {operators?.length !== 0 && (
            <Table striped bordered condensed hover>
              <thead>
                <tr>
                  <th><FormattedMessage id="source" defaultMessage="Source" /></th>
                  <th><FormattedMessage id="short-name" defaultMessage="Short name" /></th>
                  <th><FormattedMessage id="name" defaultMessage="Name" /></th>
                  <th><FormattedMessage id="contact-email" defaultMessage="Contact email" /></th>
                  <th><FormattedMessage id="status" defaultMessage="Status" /></th>
                </tr>
              </thead>
              <tbody>
                {operators.map((operator, i) => (
                  <tr key={i}>
                    <td>{operator.source}</td>
                    <td>{operator.short_name}</td>
                    <td>{operator.name}</td>
                    <td>{operator.contact_email}</td>
                    <td>{operator.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}

export default class SearchOperators extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/npact/operators',
      collectionName: 'operators',
    }
  });

  constructor(props) {
    super(props);
    this.onDelete = this.onDelete.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    document.title = "Operators";
  }

  onFilterChange(f) {
    this.setState({
      filter_criteria: {
        'or': [
          {
            field: 'short_name',
            op: 'like',
            value: '%' + f + '%'
          },
          {
            field: 'name',
            op: 'like',
            value: '%' + f + '%'
          },
          {
            field: 'contact_email',
            op: 'like',
            value: '%' + f + '%'
          }
        ]
      }
    })
  }

  _filterCriteriaAsSpec(filter_criteria) {
    return filter_criteria;
  }

  onDelete(e, opId) {
    e && e.preventDefault();
    fetch_delete(`/api/v01/npact/operators/${opId}`)
      .then(() => {
        NotificationsManager.success(
          <FormattedMessage id="operator-deleted" defaultMessage="Operator deleted!" />
        );
        this._refresh()
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="operator-delete-failed" defaultMessage="Failed to delete" />,
        error.message
      ));
  }

  render() {
    const { pagination, sorting_spec, resources, filter_criteria } = this.state;
    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="operators" defaultMessage="Operators" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel>
          <Panel.Heading>
            <Panel.Title><FormattedMessage id="operators" defaultMessage="Operators" /></Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <ApioDatatable
              sorting_spec={sorting_spec}
              headers={[
                {
                  title: <FormattedMessage id="default" defaultMessage="Default" />, field: 'default', sortable: true, render: n => <Checkbox checked={n.default} disabled/>, style: { width: '100px' }
                },
                { title: <FormattedMessage id="short-name" defaultMessage="Short name" />, field: 'short_name', sortable: true },
                { title: <FormattedMessage id="name" defaultMessage="Name" />, field: 'name', sortable: true },
                { title: <FormattedMessage id="email" defaultMessage="Email" />, field: 'contact_email', sortable: true },
                {
                  title: '', style: { width: '120px' }, render: n => (
                    isAllowed(this.props.user_info.ui_profile, pages.npact_operators, access_levels.modify) &&
                    <ButtonToolbar>
                      <Operator
                        onClose={() => this._refresh()}
                        operator={n}
                        {...this.props} />

                      <DeleteConfirmButton
                        resourceName={`operator ${n.name}`}
                        style={{width: '40px'}}
                        onConfirm={e => this.onDelete(e, n.id)} />

                    </ButtonToolbar>
                  )
                },
              ]}
              pagination={pagination}
              data={resources}
              onSort={s => this._refresh(undefined, s)}
              onPagination={p => this._refresh(p)}
              filter={filter_criteria.or && filter_criteria.or[0].value.replace(/%/g, '')}
              onFilterChange={this.onFilterChange}
              onSearch={() => this._refresh()}
            />
          </Panel.Body>
        </Panel>
        {isAllowed(this.props.user_info.ui_profile, pages.npact_operators, access_levels.modify) &&
          <Panel>
            <Panel.Body>
              <ButtonToolbar>
                <NewOperator
                  onClose={() => this._refresh()}
                  {...this.props} />
                <ImportOperators
                  onChange={() => this._refresh()} />
              </ButtonToolbar>
            </Panel.Body>
          </Panel>
        }
      </div>
    )
  }
}
