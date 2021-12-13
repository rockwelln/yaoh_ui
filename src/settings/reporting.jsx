import React, {Component, useCallback, useEffect, useState} from 'react';
import {FormattedMessage} from 'react-intl';
import Panel from 'react-bootstrap/lib/Panel';
import Badge from 'react-bootstrap/lib/Badge';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import {fetch_get, fetch_put, fetch_delete, fetch_post, NotificationsManager} from "../utils";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import update from 'immutability-helper';
import Alert from "react-bootstrap/lib/Alert";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Modal from "react-bootstrap/lib/Modal";

const DESCRIPTIONS = {
    'errors': <FormattedMessage id="errors-report-description" defaultMessage="This report is usually generated once a day and sent by mail with the list of cases open blocked with tasks still in error state."/>,
    't7': <FormattedMessage id="t7-report-description" defaultMessage="This report is generated once a day (around 1am) and sent by mail with the list of NP cases open with a timer T7 expiring today and which didn't got the IVR signal yet."/>,
    'usage': <FormattedMessage id="usage-report-description" defaultMessage="This report is generated once a day and sent by mail with the usage statistics of the workflow engine."/>,
};
const validateName = name => name === ''?null:name.length < 4?"error":"success";
const validateType = type => type === undefined || type === ""?null:"success";
const validatePeriodicity = period_range => period_range < 60 ? "error": null;
const validateDestination = destination => null;


class Report extends Component {
    static updatable_field = k => ['name', 'period_range', 'active', 'destination'].includes(k);

    constructor(props) {
        super(props);
        this.state = {};
        this.onSave = this.onSave.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onDelete() {
        fetch_delete(`/api/v01/reports/${this.props.report.id}`)
            .then(() => {
                NotificationsManager.success(
                  <FormattedMessage id="report-deleted" defaultMessage="Report deleted!" />,
                );
                this.props.onDelete && this.props.onDelete();
            })
            .catch(error => {
                let message;
                if(error.response && error.response.status === 400) {
                    const e = error.message.split(',');
                    message = e[0] + '.' + e[1] + ': ' + e[2];
                } else {
                    message = error.message;
                }
                NotificationsManager.error(
                  <FormattedMessage id="delete-report-failed" defaultMessage="Failed to delete report"/>,
                  message
                )
            })
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if(this.state.report !== nextProps.report) {
            this.setState({report: nextProps.report});
        }
    }

    onSave() {
        const report = Object.keys(this.state.report).filter(Report.updatable_field).reduce(
            (obj, key) => {
                obj[key] = this.state.report[key];
                return obj;
            }, {}
        );
        fetch_put(`/api/v01/reports/${this.props.report.id}`, report)
            .then(() => {
                NotificationsManager.success(
                  <FormattedMessage id="report-saved" defaultMessage="Report saved!" />,
                );
                this.props.onSaved && this.props.onSaved();
            })
            .catch(error => {
                NotificationsManager.error(
                  <FormattedMessage id="save-report-failed" defaultMessage="Failed to save report"/>,
                  error.message
                )
            })
    }

    render() {
        let {report} = this.state;
        if(!report) {
            report = this.props.report;
        }
        const description = DESCRIPTIONS[report.type];

        const validName = validateName(report.name) === "success"?null:"error";
        const validPeriodicity = validatePeriodicity(report.period_range);
        const validDestination = validateDestination(report.destination);
        const validForm = validName !== "error" && validPeriodicity !== "error";

        return (
            <Panel defaultExpanded={false}>
                <Panel.Heading>
                    <Panel.Title toggle>
                        {this.props.report.name} ({this.props.report.type}) <Badge>{this.props.report.active?"active":"inactive"}</Badge>
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    <Form horizontal>
                        <FormGroup>
                            <Col smOffset={2} sm={9}>
                                <FormControl.Static>
                                    {description}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validName}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="name" defaultMessage="Name" />
                            </Col>

                            <Col sm={9}>
                                <div>
                                    <FormControl componentClass="input"
                                        value={report && report.name}
                                        onChange={e => this.setState({report: update(report, {$merge: {name: e.target.value}})})} />
                                </div>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="type" defaultMessage="Type" />
                            </Col>

                            <Col sm={9}>
                                <FormControl.Static>
                                    {report.type}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="active" defaultMessage="Active" />
                            </Col>

                            <Col sm={9}>
                                <div>
                                    <Checkbox
                                        checked={report && report.active}
                                        onChange={e => this.setState({report: update(report, {$merge: {active: e.target.checked}})})} />
                                </div>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validPeriodicity}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="periodicity" defaultMessage="Periodicity" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="number"
                                    value={report.period_range}
                                    onChange={e => this.setState({report: update(report, {$merge: {period_range: parseInt(e.target.value, 10)}})})} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validDestination}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="mail-destination" defaultMessage="Mail destination" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="input"
                                    value={report.destination}
                                    onChange={e => this.setState({report: update(report, {$merge: {destination: e.target.value}})})} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="last-run" defaultMessage="Last run" />
                            </Col>

                            <Col sm={9}>
                                <FormControl.Static>
                                    {report.last_run}
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col smOffset={2} sm={10}>
                                <ButtonToolbar>
                                    <Button bsStyle="primary" onClick={this.onSave} disabled={!validForm}>
                                        <FormattedMessage id="save" defaultMessage="Save" />
                                    </Button>
                                    <Button bsStyle="danger" onClick={this.onDelete}>
                                        <FormattedMessage id="delete" defaultMessage="Delete" />
                                    </Button>
                                </ButtonToolbar>
                            </Col>
                        </FormGroup>
                    </Form>
                </Panel.Body>
            </Panel>
        )
    }
}

class RequestAlmostOverdueReport extends Report {
    static defaultProps = {
      title: <FormattedMessage id="requests-almost-overdue" defaultMessage="Requests almost overdue"/>,
      description: <FormattedMessage id="requests-almost-overdue-desc" defaultMessage="This report is generated once a day (around 1am) and sent by mail with the list of NP requests open with a due date expiring tomorrow and which didn't got the IVR signal yet."/>,
    }
}

const emptyReport = {
    name: '',
    active: true,
    type: undefined,
    destination: '',
    period_range: 24 * 60 * 60,
};


function NewReport({onClose}) {
  const [report, setReport] = useState(emptyReport);
  const [show, setShow] = useState(false);

  const _onClose = useCallback(() => {
    setShow(false);
    setReport(emptyReport);
    onClose && onClose();
  }, [onClose]);

  const onSubmit = useCallback(() => {
    fetch_post(`/api/v01/reports`, report)
    .then(() => {
        NotificationsManager.success(
          <FormattedMessage id="report-created" defaultMessage="Report created!" />,
        );
        _onClose();
    })
    .catch(error => {
        NotificationsManager.error(
          <FormattedMessage id="create-report-failed" defaultMessage="Failed to create report"/>,
          error.message
        )
    })
  }, [_onClose, report]);


  const validName = validateName(report.name);
  const validType = validateType(report.type);
  const validPeriodicity = validatePeriodicity(report.period_range);
  const validDestination = validateDestination(report.destination);
  const validForm = validName === "success" && validType === "success" && validPeriodicity !== "error";

  return (
      <div>
          <Button bsStyle="primary" onClick={() => setShow(true)}>
              <FormattedMessage id="reporting-new" defaultMessage="New report"/>
          </Button>
          <Modal show={show} onHide={_onClose} backdrop={false}>
              <Modal.Header closeButton>
                  <Modal.Title><FormattedMessage id="new-report" defaultMessage="Create a new report" /></Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <Form horizontal>
                      <FormGroup validationState={validName}>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="name" defaultMessage="Name" />
                          </Col>

                          <Col sm={9}>
                              <FormControl
                                  componentClass="input"
                                  value={report.name}
                                  onChange={e => setReport(update(report, {$merge: {name: e.target.value}}))}/>
                          </Col>
                      </FormGroup>
                      <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="active" defaultMessage="Active" />
                          </Col>

                          <Col sm={9}>
                              <Checkbox
                                  checked={report.active}
                                  onChange={e => setReport(update(report, {$merge: {active: e.target.checked}}))}/>
                          </Col>
                      </FormGroup>
                      <FormGroup validationState={validType}>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="type" defaultMessage="Type" />
                          </Col>

                          <Col sm={9}>
                              <FormControl
                                  componentClass="select"
                                  value={report.type}
                                  onChange={e => setReport(update(report, {$merge: {type: e.target.value}}))}>
                                  <option value=""/>
                                  <option value="usage">usage</option>
                                  <option value="errors">Errors</option>
                                  <option value="t7">T7</option>
                              </FormControl>
                          </Col>
                      </FormGroup>
                      <FormGroup validationState={validDestination}>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="destination" defaultMessage="Destination" />
                          </Col>

                          <Col sm={9}>
                              <FormControl
                                  componentClass="input"
                                  value={report.destination}
                                  onChange={e => setReport(update(report, {$merge: {destination: e.target.value}}))}/>
                          </Col>
                      </FormGroup>
                      <FormGroup validationState={validPeriodicity}>
                          <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="Periodicity" defaultMessage="Periodicity" />
                          </Col>

                          <Col sm={9}>
                              <FormControl
                                  type="number"
                                  value={report.period_range}
                                  onChange={e => setReport(update(report, {$merge: {period_range:parseInt(e.target.value, 10)}}))}/>
                          </Col>
                      </FormGroup>
                  </Form>
              </Modal.Body>
              <Modal.Footer>
                  <Button onClick={onSubmit} bsStyle="primary" disabled={!validForm}>
                      <FormattedMessage id="create" defaultMessage="Create" />
                  </Button>
                  <Button onClick={_onClose}>
                      <FormattedMessage id="cancel" defaultMessage="Cancel" />
                  </Button>
              </Modal.Footer>
          </Modal>
      </div>
  )
}

export function Reporting(props) {
  const [reports, setReports] = useState([]);

  const _refresh = () => {
    fetch_get('/api/v01/reports')
      .then(data => setReports(data.reports))
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="fetch-reports-failed" defaultMessage="Failed to fetch reports"/>,
        error.message
      ));
  }

  useEffect(() => {
    document.title = "Reports";
    _refresh();
  }, []);

  const getReport = (report) => {
    switch(report.type) {
      case 'usage':
      case 'errors':
      case 't7': return <Report key={report.id} report={report} onDelete={_refresh} onSaved={_refresh} {...props} />;
      case 'almost_overdue': return <RequestAlmostOverdueReport key={report.id} report={report} onDelete={_refresh} {...props} />;
      default: return '';
    }
  }

  return (
      <div>
          <Breadcrumb>
              <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
              <Breadcrumb.Item active><FormattedMessage id="reporting" defaultMessage="Reporting"/></Breadcrumb.Item>
          </Breadcrumb>
          <Panel>
              <Panel.Body>
                  <ButtonToolbar>
                      <NewReport
                          onClose={() => _refresh()}
                          {...props} />
                  </ButtonToolbar>
              </Panel.Body>
          </Panel>
      {
          reports.map(getReport)
      }
      { reports.length === 0 &&
          <Alert bsStyle="info">
              <FormattedMessage id="reporting-no-reports" defaultMessage="No reports defined"/>
          </Alert>

      }
      </div>
  )
}