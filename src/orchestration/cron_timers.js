import React from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {ApioDatatable} from "../utils/datatable";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import update from "immutability-helper";
import {Search} from "../utils/common";
import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Table, {th, tr, td} from "react-bootstrap/lib/Table";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Select from "react-select";
import InputGroup from "react-bootstrap/lib/InputGroup";
import {DeleteConfirmButton} from "../utils/deleteConfirm";


const validateCronEntry = (timer) => {
    const {minute, hour, day, month, year} = timer;
    if(minute && minute !== "*") {
        const m = parseInt(minute, 10);
        if(isNaN(m) || m < 0 || m > 59) return false;
    }
    if(hour && hour !== "*") {
        const h = parseInt(hour, 10);
        if(isNaN(h) || h < 0 || h > 23) return false;
    }
    if(day && day !== "*") {
        const d = parseInt(day, 10);
        if(isNaN(d) || d < 0 || d > 31) return false;
    }
    if(month && month !== "*") {
        const m = parseInt(month, 10);
        if(isNaN(m) || m < 0 || m > 12) return false;
    }
    if(year && year !== "*") {
        const y = parseInt(year, 10);
        if(isNaN(y) || y < 2000) return false;
    }
    return true;
};

class NewCronTimer extends React.Component {
    state = {
        show: false,
        new_timer: NewCronTimer.new_timer()
    };

    static new_timer() {
        return {
            job_id: "",
            request_body: "",
            enabled: true
        }
    }

    onSubmit() {
        const {new_timer} = this.state;
        fetch_post("/api/v01/timers/cron", new_timer)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="new-timer-created" defaultMessage="New timer created" />);
                this.setState({show: false, new_timer: NewCronTimer.new_timer()});
                this.props.onClose();
            })
            .catch(error =>
                NotificationsManager.error(
                    <FormattedMessage id="new-timer-failed" defaultMessage="Failed to create new timer" />,
                    error.message
                )
            )
    }

    static getDerivedStateFromProps(props, state) {
        if (props.activities && props.activities.length > 0 && state.new_timer && state.new_timer.activity_id === undefined) {
            return {
                new_timer: update(state.new_timer, {$merge: {activity_id: props.activities[0]["id"]}})
            };
        }
        // Return null to indicate no change to state.
        return null;
    }

    render() {
        const {show, new_timer} = this.state;
        const {activities} = this.props;
        const hideNewTimer = () => this.setState({show: false, new_timer: NewCronTimer.new_timer()});
        const validJobId = new_timer.job_id && new_timer.job_id.length > 0 ? "success": null;
        const validCronEntry = validateCronEntry(new_timer) ? null :"error";
        const validForm = validJobId === "success" && validCronEntry !== "error";

        const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));
        return (
            <div>
                <Button onClick={() => this.setState({show: true})} bsStyle={"primary"}>
                    <FormattedMessage id="new-timer" defaultMessage="New timer" />
                </Button>
                <Modal show={show} onHide={hideNewTimer} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="new-timer" defaultMessage="New timer" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup validationState={validJobId}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="job-id" defaultMessage="Job id" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={new_timer.job_id}
                                        placeholder="job label"
                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {job_id: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="enabled" defaultMessage="Enabled" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                         checked={new_timer.enabled}
                                         onChange={e => this.setState({new_timer: update(new_timer, {$merge: {enabled: e.target.checked}})})}/>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={validCronEntry}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="cron" defaultMessage="Cron entry" />
                                </Col>

                                <Col sm={9}>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th><FormattedMessage id="minute" defaultMessage="minute" /></th>
                                                <th><FormattedMessage id="hour" defaultMessage="hour" /></th>
                                                <th><FormattedMessage id="day" defaultMessage="day" /></th>
                                                <th><FormattedMessage id="month" defaultMessage="month" /></th>
                                                <th><FormattedMessage id="year" defaultMessage="year" /></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.minute || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {minute: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.hour || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {hour: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.day || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {day: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.month || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {month: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.year || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {year: e.target.value}})})}/>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                    <HelpBlock>
                                         <FormattedMessage id="cron-entry-help-fil" defaultMessage="the possible values may be a number (restricted by the category, ex: minute has to be between 0 and 60) or * (any) or left empty."/>
                                         <br/>
                                         <FormattedMessage id="cron-entry-help-cols" defaultMessage="notice the columns left empty on the right are defaulted to '*' (any) and columns left empty on the left are considered as 0"/>
                                     </HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="activity" defaultMessage="Activity" />
                                </Col>

                                <Col sm={9}>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        value={new_timer.activity_id && activitiesOptions.find(a => a.value === new_timer.activity_id)}
                                        isClearable={false}
                                        isSearchable={true}
                                        name="activity"
                                        onChange={(value, action) => {
                                            if(["select-option", "clear"].includes(action.action)) {
                                              this.setState({new_timer: update(new_timer, {$merge: {activity_id: value.value}})})
                                            }
                                        }}
                                        options={activitiesOptions} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="request-body" defaultMessage="Request body" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="textarea"
                                        value={new_timer.request_body}
                                        placeholder='{"body": {"username": "fool"}}'
                                        onChange={e => this.setState({new_timer: update(new_timer, {$merge: {request_body: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            onClick={this.onSubmit.bind(this)}
                            disabled={!validForm}
                            bsStyle="primary"
                            autoFocus >
                            <FormattedMessage id="save" defaultMessage="Save"/>
                        </Button>
                        <Button onClick={hideNewTimer}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}


class UpdateTimer extends React.Component {
    state = {
        show: false,
        diff_timer: {},
    };

    onSubmit() {
        const {diff_timer} = this.state;
        const {timer} = this.props;
        fetch_put(`/api/v01/timers/cron/${timer.id}`, diff_timer)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="timer-updated" defaultMessage="Timer updated" />);
                this.setState({show: false, diff_timer: {}});
                this.props.onClose();
            })
            .catch(error =>
                NotificationsManager.error(
                    <FormattedMessage id="timer-update-failed" defaultMessage="Failed to update timer" />,
                    error.message
                )
            )
    }

    render() {
        const {show, diff_timer} = this.state;
        const {activities, timer} = this.props;
        const onClose = () => this.setState({show: false, diff_timer: {}});
        const new_timer = update(timer, {$merge: diff_timer});
        const validJobId = !new_timer.job_id || new_timer.job_id.length === 0 ? "error": null;
        const validCronEntry = validateCronEntry(new_timer) ? null :"error";
        const validForm = validJobId !== "error" && validCronEntry !== "error";
        const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));

        return (
            <div>
                <Button onClick={() => this.setState({show: true})} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="pencil"/>
                </Button>
                <Modal show={show} onHide={onClose} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="update-timer" defaultMessage="Update timer" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup validationState={validJobId}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="job-id" defaultMessage="Job id" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={new_timer.job_id}
                                        placeholder="job label"
                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {job_id: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="enabled" defaultMessage="Enabled" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                         checked={new_timer.enabled}
                                         onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {enabled: e.target.checked}})})}/>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={validCronEntry}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="cron" defaultMessage="Cron entry" />
                                </Col>

                                <Col sm={9}>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th><FormattedMessage id="minute" defaultMessage="minute" /></th>
                                                <th><FormattedMessage id="hour" defaultMessage="hour" /></th>
                                                <th><FormattedMessage id="day" defaultMessage="day" /></th>
                                                <th><FormattedMessage id="month" defaultMessage="month" /></th>
                                                <th><FormattedMessage id="year" defaultMessage="year" /></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.minute || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {minute: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.hour || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {hour: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.day || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {day: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.month || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {month: e.target.value}})})}/>
                                                </td>
                                                <td>
                                                    <FormControl
                                                        componentClass="input"
                                                        value={new_timer.year || ""}
                                                        placeholder="*"
                                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {year: e.target.value}})})}/>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                    <HelpBlock>
                                         <FormattedMessage id="cron-entry-help-fil" defaultMessage="the possible values may be a number (restricted by the category, ex: minute has to be between 0 and 60) or * (any) or left empty."/>
                                         <br/>
                                         <FormattedMessage id="cron-entry-help-cols" defaultMessage="notice the columns left empty on the right are defaulted to '*' (any) and columns left empty on the left are considered as 0"/>
                                     </HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="activity" defaultMessage="Activity" />
                                </Col>

                                <Col sm={9}>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        value={new_timer.activity_id && activitiesOptions.find(a => a.value === new_timer.activity_id)}
                                        isClearable={false}
                                        isSearchable={true}
                                        name="activity"
                                        onChange={(value, action) => {
                                            if(["select-option", "clear"].includes(action.action)) {
                                              this.setState({diff_timer: update(diff_timer, {$merge: {activity_id: value.value}})})
                                            }
                                        }}
                                        options={activitiesOptions} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="request-body" defaultMessage="Request body" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="textarea"
                                        value={new_timer.request_body}
                                        placeholder='{"body": {"username": "fool"}}'
                                        onChange={e => this.setState({diff_timer: update(diff_timer, {$merge: {request_body: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            onClick={this.onSubmit.bind(this)}
                            disabled={!validForm}
                            bsStyle="primary"
                            autoFocus >
                            <FormattedMessage id="save" defaultMessage="Save"/>
                        </Button>
                        <Button onClick={onClose}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}


function deleteCronTimer(id, onSuccess) {
    fetch_delete(`/api/v01/timers/cron/${id}`)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="cron-timer-delete-failed" defaultMessage="Timer deleted!" />);
            onSuccess && onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="cron-timer-delete-failed" defaultMessage="Timer delete failed!" />,
            error.message
    ))
}


export default class CronTimers extends Search {
    static defaultProps = update(Search.defaultProps, {'$merge': {
        searchUrl: '/api/v01/timers/cron',
        collectionName: 'timers',
        defaultSortingSpec: [{field: 'job_id', direction: 'asc'}],
    }});

    constructor(props) {
        super(props);
        this.state.activities = [];
    }
    fetchActivities() {
        fetch_get('/api/v01/activities')
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                error.message
            ));
    }

    onSelectActivity(timer_id, activity_id) {
        fetch_put(`/api/v01/timers/cron/${timer_id}`, {activity_id: activity_id?parseInt(activity_id, 10): null})
            .then(() => {
                NotificationsManager.success(
                    <FormattedMessage id="update-cron-timer-done" defaultMessage="Cron timer saved!"/>
                );
                this._refresh();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="update-cron-timer-failed" defaultMessage="Failed to update cron timer"/>,
                error.message
            ));
    }

    onEnable(timer_id, enabled) {
        fetch_put(`/api/v01/timers/cron/${timer_id}`, {enabled: enabled})
            .then(() => {
                NotificationsManager.success(
                    <FormattedMessage id="update-cron-timer-done" defaultMessage="Cron timer saved!"/>
                );
                this._refresh();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="update-cron-timer-failed" defaultMessage="Failed to update cron timer"/>,
                error.message
            ));
    }

    componentDidMount() {
        document.title = "Cron";
        super.componentDidMount();
        this.fetchActivities();
    }

    render() {
        const {resources, sorting_spec, pagination, activities} = this.state;
        const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="cron-timers" defaultMessage="Cron timers"/></Breadcrumb.Item>
                </Breadcrumb>

                <Panel>
                    <Panel.Body>
                        <ButtonToolbar>
                            <NewCronTimer onClose={() => this._refresh()} activities={activities} />
                        </ButtonToolbar>
                    </Panel.Body>
                </Panel>

                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="cron-timers" defaultMessage="Cron timers" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <ApioDatatable
                            sorting_spec={sorting_spec}
                            headers={[
                                {
                                    title: '',
                                    field: 'enabled',
                                    sortable: true,
                                    style: { width: 50 },
                                    render: n => (
                                        <Checkbox
                                            checked={n.enabled}
                                            onChange={e => e.preventDefault()}
                                            onClick={e => {
                                                e.preventDefault();
                                                this.onEnable(n.id, e.target.checked);
                                            }} />
                                    )
                                },
                                {title: "job id", field: 'job_id', sortable: true},
                                {title: "minute", field: 'minute', style: { width: 70 }},
                                {title: "hour", field: 'hour', style: { width: 70 }},
                                {title: "day", field: 'day', style: { width: 70 }},
                                {title: "month", field: 'month', style: { width: 70 }},
                                {title: "year", field: 'year', style: { width: 70 }},
                                {
                                    title: <FormattedMessage id="activity" defaultMessage="Activity"/>,
                                    field: 'activity_id',
                                    style: { width: 300 },
                                    render: n => (
                                        <InputGroup>
                                            <Select
                                                className="basic-single"
                                                classNamePrefix="select"
                                                value={n.activity_id && activitiesOptions.find(a => a.value === n.activity_id)}
                                                isClearable={false}
                                                isSearchable={true}
                                                name="activity"
                                                onChange={(value, action) => {
                                                    if(["select-option", "clear"].includes(action.action)) {
                                                      this.onSelectActivity(n.id, value && value.value);
                                                    }
                                                }}
                                                options={activitiesOptions} />
                                            <InputGroup.Button>
                                                <Button
                                                    disabled={n.activity_id === null}
                                                    bsStyle="primary"
                                                    onClick={() => {
                                                        let win = window.open(`/transactions/config/activities/editor/${n.activity_id}`, '_blank');
                                                        win.focus();
                                                    }}
                                                    style={{marginLeft: '5px'}}
                                                >
                                                    <Glyphicon glyph="eye-open"/>
                                                </Button>
                                            </InputGroup.Button>
                                        </InputGroup>
                                    )
                                },
                                {
                                    title: '',
                                    style: { width: "200px" },
                                    render: n => (
                                        <ButtonToolbar>
                                            <UpdateTimer onClose={() => this._refresh()} timer={n}  activities={activities} />
                                            <DeleteConfirmButton
                                                resourceName={n.job_id}
                                                style={{marginLeft: '5px', marginRight: '5px'}}
                                                onConfirm={() => deleteCronTimer(n.id, () => this._refresh())} />
                                        </ButtonToolbar>
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
