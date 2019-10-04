import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';
import Panel from 'react-bootstrap/lib/Panel';
import Badge from 'react-bootstrap/lib/Badge';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import {fetch_get, fetch_put, fetch_delete, fetch_post} from "../utils";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import update from 'immutability-helper';
import Alert from "react-bootstrap/lib/Alert";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Modal from "react-bootstrap/lib/Modal";

const DESCRIPTIONS = {
    'errors': <FormattedMessage id="errors-report-description" defaultMessage="This report is usually generated once a day and sent by mail with the list of cases open blocked with tasks still in error state."/>,
    't7': <FormattedMessage id="t7-report-description" defaultMessage="This report is generated once a day (around 1am) and sent by mail with the list of NP cases open with a timer T7 expiring today and which didn't got the IVR signal yet."/>,
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
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="report-deleted" defaultMessage="Report deleted!" />,
                    level: 'success'
                });
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
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="delete-report-failed" defaultMessage="Failed to delete report"/>,
                    message: message,
                    level: 'error'
                })
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
        fetch_put(`/api/v01/reports/${this.props.report.id}`, report, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="report-saved" defaultMessage="Report saved!" />,
                    level: 'success'
                });
                this.props.onSaved && this.props.onSaved();
            })
            .catch(error => {
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="save-report-failed" defaultMessage="Failed to save report"/>,
                    message: error.message,
                    level: 'error'
                })
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

class NewReport extends Component {
    static empty_report() {
        return {
            name: '',
            active: true,
            type: undefined,
            destination: '',
            period_range: 24 * 60 * 60,
        }
    }
    constructor(props) {
        super(props);
        this.state = {
            report: NewReport.empty_report(),
        };
        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit() {
        const {report} = this.state;

        fetch_post(`/api/v01/reports`, report, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="report-created" defaultMessage="Report created!" />,
                    level: 'success'
                });
                this.setState({show: false, report: NewReport.empty_report()});
                this.props.onClose && this.props.onClose();
            })
            .catch(error => {
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="create-report-failed" defaultMessage="Failed to create report"/>,
                    message: error.message,
                    level: 'error'
                })
            })
    }

    render() {
        const {report, show} = this.state;
        const onClose = () => this.setState({show: false, report: NewReport.empty_report()});
        const validName = validateName(report.name);
        const validType = validateType(report.type);
        const validPeriodicity = validatePeriodicity(report.period_range);
        const validDestination = validateDestination(report.destination);
        const validForm = validName === "success" && validType === "success" && validPeriodicity !== "error";

        return (
            <div>
                <Button bsStyle="primary" onClick={() => this.setState({show:true})}>
                    <FormattedMessage id="reporting-new" defaultMessage="New report"/>
                </Button>
                <Modal show={show} onHide={onClose} backdrop={false}>
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
                                        onChange={e => this.setState({report: update(report, {$merge: {name: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="active" defaultMessage="Active" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={report.active}
                                        onChange={e => this.setState({report: update(report, {$merge: {active: e.target.checked}})})}/>
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
                                        onChange={e => this.setState({report: update(report, {$merge: {type: e.target.value}})})}>
                                        <option value=""/>
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
                                        onChange={e => this.setState({report: update(report, {$merge: {destination: e.target.value}})})}/>
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
                                        onChange={e => this.setState({report: update(report, {$merge: {period_range:parseInt(e.target.value, 10)}})})}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSubmit} bsStyle="primary" disabled={!validForm}>
                            <FormattedMessage id="create" defaultMessage="Create" />
                        </Button>
                        <Button onClick={onClose}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export class Reporting extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reports: [],
        };
        this.getReport = this.getReport.bind(this);
        this._refresh = this._refresh.bind(this);
    }

    _refresh() {
        fetch_get('/api/v01/reports', this.props.auth_token)
            .then(data => this.setState({reports: data.reports}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-reports-failed" defaultMessage="Failed to fetch reports"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentDidMount() {
        this._refresh();
    }

    getReport(report) {
        switch(report.type) {
            case 'errors':
            case 't7': return <Report key={report.id} report={report} onDelete={this._refresh} onSaved={this._refresh} {...this.props} />;
            case 'almost_overdue': return <RequestAlmostOverdueReport key={report.id} report={report} onDelete={this._refresh} {...this.props} />;
            default: return '';
        }
    }

    render() {
        const {reports} = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="reporting" defaultMessage="Reporting"/></Breadcrumb.Item>
                </Breadcrumb>
            {
                reports.map(this.getReport)
            }
            { reports.length === 0 &&
                <Alert bsStyle="info">
                    <FormattedMessage id="reporting-no-reports" defaultMessage="No reports defined"/>
                </Alert>

            }
            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <NewReport
                            onClose={() => this._refresh()}
                            {...this.props} />
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>
            </div>
        )
    }
}