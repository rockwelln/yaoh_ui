import React from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import DatePicker from "react-datepicker";
import Button from "react-bootstrap/lib/Button";
import {ApioDatatable} from "../utils/datatable";
import {Link} from "react-router-dom";
import {Search} from "../utils/common";
import moment from "moment";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {fetch_delete, fetch_put, NotificationsManager} from "../utils";
import Modal from "react-bootstrap/lib/Modal";
import FormControlStatic from "react-bootstrap/lib/FormControlStatic";


class UpdateTimer extends React.Component {
    state = {
        show: false,
        diffTimer: {},
    };

    onClose() {
        this.setState({show: false, diffTimer: {}});
        this.props.onClose();
    }

    onSubmit() {
        const {timer} = this.props;
        const {diffTimer} = this.state;

        fetch_put(`/api/v01/timers/${timer.id}`, diffTimer)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="timer-updated" defaultMessage="Timer updated"/> );
                this.onClose();
            })
            .catch(error =>
                NotificationsManager.error(<FormattedMessage id="timer-updated" defaultMessage="Timer updated"/>, error.message)
            )
    }

    render() {
        const {show, diffTimer} = this.state;
        const {timer} = this.props;

        const timer_ = update(timer, {$merge: diffTimer});
        return (
            <div>
                <Button onClick={() => this.setState({show: true})} bsStyle="primary"
                        style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="pencil"/>
                </Button>
                <Modal show={show} onHide={this.onClose.bind(this)} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="update-a-timer" defaultMessage="Update a timer" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal style={{paddingTop: 10}}>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="instance-id" defaultMessage="Instance" />
                                </Col>

                                <Col sm={9}>
                                    <FormControlStatic>
                                        {timer.instance_id}
                                    </FormControlStatic>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="name" defaultMessage="Name" />
                                </Col>

                                <Col sm={9}>
                                    <FormControlStatic>
                                        {timer.name}
                                    </FormControlStatic>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="key" defaultMessage="Key" />
                                </Col>

                                <Col sm={9}>
                                    <FormControlStatic>
                                        {timer.key}
                                    </FormControlStatic>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="at" defaultMessage="At" />
                                </Col>

                                <Col sm={9}>
                                    <DatePicker
                                        className="form-control"
                                        selected={moment(timer_.at).toDate()}
                                        onChange={d => this.setState({
                                            diffTimer: update(
                                                diffTimer, {$merge: {at: moment(d).local().format()}})
                                        })}
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        showTimeInput />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="status" defaultMessage="Status" />
                                </Col>

                                <Col sm={9}>
                                    <FormControlStatic>
                                        {timer.status}
                                    </FormControlStatic>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSubmit.bind(this)} bsStyle="primary">
                            <FormattedMessage id="update" defaultMessage="Update" />
                        </Button>
                        <Button onClick={this.onClose.bind(this)}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}


export const TimerActions = ({onUpdate, onCancel, timer}) => {
    const onCancelHandler = () => {
        fetch_delete(`/api/v01/timers/${timer.id}`)
            .then(() => NotificationsManager.success(<FormattedMessage id="timer-cancelled"
                                                                       defaultMessage="Timer cancelled!"/>))
            .then(onCancel)
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="timer-cancel-failed" defaultMessage="Timer cancel failed!"/>,
                error.message
            ));
    };

    return (
        <ButtonToolbar>
            <UpdateTimer onClose={onUpdate} timer={timer} />

            <Button onClick={onCancelHandler} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
                <Glyphicon glyph="remove-sign"/>
            </Button>
        </ButtonToolbar>
    );
};


export default class Timers extends Search {
    static defaultProps = update(Search.defaultProps, {'$merge': {
        searchUrl: '/api/v01/timers/search',
        collectionName: 'timers',
        defaultCriteria: {
            key: {value: '', op: 'eq'},
            at: {value: '', op: 'eq'},
            created_on: {value: '', op: 'gt'},
            status: {value: '', op: 'eq'},
        },
        defaultSortingSpec: [{
            field: 'created_on', direction: 'desc'
        }],
    }});

    constructor(props) {
        super(props);

        this.state["selected_timers"] = [];
    }

    componentDidMount() {
      super.componentDidMount();
      document.title = "Timers";
    }

  render() {
        const {filter_criteria, resources, sorting_spec, pagination, selected_timers} = this.state;
        const invalid_created_on = filter_criteria.created_on.value && !moment(filter_criteria.created_on.value).isValid();
        return (
            <div>
                 <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="timers" defaultMessage="Timers"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={false} >
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" />
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body collapsible>
                        <Form horizontal>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="key" defaultMessage="Key" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.key.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {key: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                        <option value="like">like</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.key && filter_criteria.key.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {key: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="status" defaultMessage="Status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.status.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.status.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value='WAIT'>wait</option>
                                        <option value='STOP'>stop</option>
                                        <option value='CANCEL'>cancel</option>
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
                                                {created_on: {$merge: {op: e.target.value}}})
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
                                        selected={filter_criteria.created_on.value}
                                        onChange={d => this.setState({
                                            filter_criteria: update(
                                                this.state.filter_criteria,
                                                {created_on: {$merge: {value: d}}})
                                        })}
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={60}/>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col smOffset={1} sm={1}>
                                    <Button bsStyle="info" onClick={() => this._refresh({page_number: 1})} disabled={invalid_created_on}>
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
                                {
                                    title: '',
                                    render: n =>
                                        n.id && <Checkbox checked={selected_timers.includes(n.id)} onChange={e => {
                                            if(e.target.checked) {
                                                this.setState({selected_timers: update(selected_timers, {"$push": [n.id]})})
                                            } else {
                                                this.setState({selected_timers: update(selected_timers, {"$splice": [[selected_timers.indexOf(n.id), 1]]})})
                                            }
                                        }} />,
                                    style: {width: '30px'}
                                },
                                {
                                    title: <FormattedMessage id="instance" defaultMessage="Instance" />,
                                    field: 'instance_id', model: 'timers',
                                    render: n => <Link to={`/transactions/${n.instance_id}`}>I{n.instance_id}</Link>
                                },
                                {
                                    title: <FormattedMessage id="name" defaultMessage="Name" />,
                                    field: 'name', model: 'timers', sortable: true,
                                },
                                {
                                    title: <FormattedMessage id="status" defaultMessage="Status" />,
                                    field: 'status', model: 'timers', sortable: true,
                                },
                                {
                                    title: <FormattedMessage id="key" defaultMessage="Key" />,
                                    field: 'key', model: 'timers', sortable: true,
                                },
                                {
                                    title: <FormattedMessage id="at" defaultMessage="At" />,
                                    field: 'at', model: 'timers', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: <FormattedMessage id="created-on" defaultMessage="Created on" />,
                                    field: 'created_on', model: 'timers', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: '', render: n => (
                                        <TimerActions
                                            onCancel={() => this._refresh()}
                                            onUpdate={() => this._refresh()}
                                            timer={n}
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