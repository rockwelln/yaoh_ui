import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import Alert from 'react-bootstrap/lib/Alert';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Table, {tbody, th, tr} from 'react-bootstrap/lib/Table';
import Tab from 'react-bootstrap/lib/Tab';
import Tabs from 'react-bootstrap/lib/Tabs';
import Badge from 'react-bootstrap/lib/Badge';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import DatePicker from 'react-datepicker';
import moment from 'moment';
import {Link} from 'react-router-dom';
import {FormattedMessage} from 'react-intl';
import queryString from 'query-string';
import 'font-awesome/css/font-awesome.min.css';

import {
    API_URL_PREFIX, fetch_get, parseJSON, fetch_post, fetch_put
} from "../utils";
import {ApioDatatable} from "../utils/datatable";

import 'react-datepicker/dist/react-datepicker.css';
import GridPic from "../grid.gif";
import draw_editor from "../editor";
import update from 'immutability-helper';
import {StaticControl} from "../utils/common";
import {access_levels, isAllowed, pages} from "../utils/user";

export const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';

const workableDefinition = (definition, states) => {
    let new_def = Object.assign({}, definition);
    
    Object.keys(definition.cells).map(k => {
        let c = definition.cells[k];
        //c.name = k;
        const state = states && states.find(s => s.cell_id === k);
        if(state !== undefined) {
            c.state = state.status;
        }
        new_def.cells[k] = c;
        return null;
    });
    
    new_def.transitions && states && new_def.transitions.map(t => {
        const src = t[0];
        const dst = t[1];
        const state = states && states.find(s => s.cell_id === dst);
        // devnote: if there is a state (task) for the cell, and the task source (trigger) match the transition *or* there is only 1 way to trigger this cell.
        if(state !== undefined && (state.source === src || new_def.transitions.filter(nt => nt[1] === t[1]).length === 1)) {
            t[2] = {'status': state.status};
            console.log(`${src} => ${dst}: ${state.status}`);
        }
        return null;
    });

    return new_def;
};


class TransactionFlow extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this._renderGrid = this._renderGrid.bind(this);
        this._refreshGrid = this._refreshGrid.bind(this);
    }

    _renderGrid(getActivity) {
        const node = ReactDOM.findDOMNode(this.refs.flowGraph);
        const toolbarNode = ReactDOM.findDOMNode(this.refs.toolbar);
        draw_editor(node, {
            get: getActivity
        }, {
            toolbar: toolbarNode,
        }, {
            readOnly: true,
            height: 300,
        });
    }

    _refreshGrid(force) {
        const width = ReactDOM.findDOMNode(this.refs.flowGraph).getBoundingClientRect().width;
        if(width !== this.state.eltWidth || force) {
            this.setState({eltWidth: width});

            const {definition, states} = this.props;
            width !== 0 && this._renderGrid(
                cb => cb({definition: workableDefinition(JSON.parse(definition), states)})
            );
        }
    }

    componentDidMount() {
        this._refreshGrid(true);
    }

    componentDidUpdate() {
        this._refreshGrid();
    }

    render() {
        return (
            <div>
                <div ref="toolbar" style={{position: 'absolute', zIndex: '100'}} />
                <div ref="flowGraph" style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
            </div>
        );
    }
}


class Comments extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            comments: [],
            error: undefined,
            save_error: undefined,
            showAddModal: false,
            comment: '',
        };
        this.fetchComments = this.fetchComments.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    fetchComments() {
        fetch_get(`/api/v01/transactions/${this.props.req_id}/comments?load_user_info=1`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({comments: data.comments}))
            .catch(error => !this.cancelLoad && this.setState({error: error}))
    }

    componentDidMount() {
        this.fetchComments()
    }

    saveNewComment() {
        fetch_post(
            `/api/v01/transactions/${this.props.req_id}/comments`,
            {comment: this.state.comment},
            this.props.auth_token
        )
        .then(parseJSON)
        .then(() => {
            this.setState({showAddModal: false, comment: '', save_error: undefined});
            this.props.notifications.addNotification({
                message: <FormattedMessage id="new-comment-added" defaultMessage="Your comment has been added!"/>,
                level: 'success'
            });
            this.fetchComments();
        })
        .catch(error => this.setState({save_error: error}))
    }

    render() {
        const {error, comments, showAddModal, comment, save_error} = this.state;
        const closeModal = () => this.setState({showAddModal: false, comment: '', save_error: undefined});

        return (<div>
            {
                error &&
                    <Alert bsStyle="danger">
                        <FormattedMessage id="fail-fetch-comments" defaultMessage="Failed to fetch comments."/>
                        {error.message}
                    </Alert>
            }
            <Table condensed>
                <tbody>
                    {comments && comments.map(c => (
                        <tr key={c.id}>
                            <th>{c.user.username}<br/>{moment(c.created_on).format(DATE_FORMAT)}</th>
                            <td>{c.content.split('\n').map((e, i) => <div key={i}>{e}</div>)}</td>
                        </tr>
                        ))
                    }
                    <tr>
                        <td colSpan={4}>
                            <Button onClick={() => this.setState({showAddModal: true})} bsStyle="info"><FormattedMessage id="new-comment" defaultMessage="New comment"/></Button>
                        </td>
                    </tr>
                </tbody>
            </Table>
            <Modal show={showAddModal} onHide={closeModal} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="new-comment" defaultMessage="New comment"/></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        save_error &&
                            <Alert bsStyle="danger">
                                <FormattedMessage id="fail-save-comment" defaultMessage="Failed to save comment."/><br/>
                                {save_error.message}
                            </Alert>
                    }
                    <Form>
                        <FormGroup controlId="comment">
                            <FormControl componentClass="textarea"
                                         placeholder="..."
                                         value={comment}
                                         onChange={e => this.setState({comment: e.target.value})} />
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.saveNewComment.bind(this)} bsStyle="primary" disabled={comment.length === 0}>
                        <FormattedMessage id="save" defaultMessage="Save"/>
                    </Button>
                    <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
                </Modal.Footer>
            </Modal>
        </div>);
    }
}

class Error extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {entry} = this.props;
        const summary = entry.output?entry.output:<FormattedMessage id="see-description" defaultMessage="See description" />;
        return (
            <tr key={entry.id}>
                <th>{entry.cell_id}</th>
                <td>
                    {summary.split("\n").map((l, i) => <div key={i}>{l}<br/></div>)}
                    <br/>
                    <Button bsStyle="link" onClick={() => this.setState({showDetails:true})}>...</Button>
                </td>
                <td>{moment(entry.created_on).format(DATE_FORMAT)}</td>
                <Modal show={this.state.showDetails} onHide={() => this.setState({showDetails: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="error-details" defaultMessage="Error details" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={entry.cell_id}/>
                            <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={moment(entry.created_on).format(DATE_FORMAT)}/>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="summary" defaultMessage="Summary" />
                                </Col>

                                <Col sm={9}>
                                    {summary.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="description" defaultMessage="Description" />
                                </Col>

                                <Col sm={9}>
                                    {entry.description.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                </Modal>
            </tr>
        )
    }
}

const Errors = ({errors, user_info}) => (
    <Table condensed>
        <thead>
        <tr>
            <th><FormattedMessage id="cell" defaultMessage="Cell" /></th>
            <th><FormattedMessage id="summary" defaultMessage="Summary" /></th>
            <th><FormattedMessage id="created" defaultMessage="Created" /></th>
        </tr>
        </thead>
        <tbody>
        {
            errors.map(e => (!e.advanced || user_info.ui_profile === "admin") && <Error key={e.id} entry={e} />)
        }
        </tbody>
    </Table>
);


class Events extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {events: [], logs: [], show_details: false, selected_evt: {}};
        this.onReplay = this.onReplay.bind(this);
    }

    componentDidMount() {
        // get the events
        fetch_get(`/api/v01/transactions/${this.props.tx_id}/events`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({events: data.events.map(e => {e.type='event'; return e})}))
            .catch(error => !this.cancelLoad && this.setState({events_error: error}));
        // get the logs
        fetch_get(`/api/v01/transactions/${this.props.tx_id}/logs`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({
                logs: data.logs.map(l => {l.type='log'; l.source_entity=l.source; l.content=l.message; return l;})
            }))
            .catch(error => !this.cancelLoad && this.setState({logs_error: error}));
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onReplay(event_id) {
        fetch_put(`/api/v01/transactions/${this.props.tx_id}/events/${event_id}`, {}, this.props.auth_token)
            .then(() =>
                this.props.notifications.addNotification({
                    message:  <FormattedMessage id="replay-event-success" defaultMessage="Event replayed!"/>,
                    level: 'success'
                })
            )
            .catch(error =>
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="replay-event-failed" defaultMessage="Replay event failed!"/>,
                    message: error.message,
                    level: 'error'
                })
            )
    }

    render() {
        if(this.state.events_error !== undefined && this.state.logs_error !== undefined) {
            return <Alert bsStyle="danger">
                <FormattedMessage id="fail-fetch-events" defaultMessage="Failed to fetch events."/><br/>
                {this.state.events_error.message}<br/>
                {this.state.logs_error.message}
            </Alert>
        }
        const {selected_evt, events_error, logs_error, events, logs, show_details} = this.state;
        let alert = '';
        if (events_error !== undefined) {
            alert = <Alert bsStyle="danger">
                <FormattedMessage id="fail-fetch-events" defaultMessage="Failed to fetch events."/><br/>
                {events_error.message}
            </Alert>
        } else if (logs_error !== undefined) {
            alert = <Alert bsStyle="danger">
                <FormattedMessage id="fail-fetch-logs" defaultMessage="Failed to fetch logs."/><br/>
                {logs_error.message}
            </Alert>
        }
        const closeModal = () => this.setState({show_details: false, selected_evt: {}});
        const events_ = events.concat(logs);
        events_.sort((a, b) => (moment(b.created_on) - moment(a.created_on)));
        return (<div>
            {alert}
            <Table condensed>
                <tbody>
                {events_.map((e, n) => (
                    <tr key={n}>
                        <th>{e.source_entity + (e.username?' (' + e.username + ')':'')}<br/>{moment(e.created_on).format(DATE_FORMAT)}</th>
                        <td>
                            {e.content.substr(0, 50)}
                            <br/>
                            <Button bsStyle="link" onClick={() => this.setState({show_details: true, selected_evt: e})}>...</Button>
                        </td>
                        <td>{e.type === 'event' && this.props.user_can_replay &&
                            <Button onClick={() => this.onReplay(e.id)}>
                                <FormattedMessage id="replay" defaultMessage="Replay" />
                            </Button>
                        }</td>
                    </tr>
                ))}
                </tbody>
            </Table>
            <Modal show={show_details} onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="event-details" defaultMessage="Event details" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={selected_evt.source_entity}/>
                        <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={selected_evt.username}/>
                        <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={moment(selected_evt.created_on).format(DATE_FORMAT)}/>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="content" defaultMessage="Content" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="textarea" defaultValue={selected_evt.content} />
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </Modal.Footer>
            </Modal>
            </div>)
    }
}


class RequestTable extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            operators: undefined,
            diff_req: {},
            publicHolidays: [],
            saving: false,
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onSubmit() {
        let {diff_req} = this.state;

        this.setState({saving: true});
        fetch_put(`/api/v01/orange/requests/${this.props.request.id}`, diff_req, this.props.auth_token)
            .then(parseJSON)
            .then(() => {
                this.setState({saving: false});
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="request-updated" defaultMessage="Request updated!"/>,
                    level: 'success'
                });
                this.onClose();
            })
            .catch(error => {
                    this.setState({saving: false});
                    this.props.notifications.addNotification({
                        title: <FormattedMessage id="request-update-failed" defaultMessage="Request update failed!"/>,
                        message: error.message,
                        level: 'error'
                    });
                }
            );
    }

    onClose() {
        this.setState({diff_req: {}, saving: false});
        this.props.onEditEnd && this.props.onEditEnd();
    }

    render() {
        if(this.props.request === undefined || this.state.operators === undefined) {
            return <div><FormattedMessage id="loading" defaultMessage="Loading..." /></div>;
        }

        if(this.state.error !== undefined) {
            return <Alert bsStyle="danger">
                <FormattedMessage id="fail-fetch-request" defaultMessage="Failed to fetch original request."/>
                {this.state.error.message}
            </Alert>
        }

        const req = update(this.props.request, {$merge: this.state.diff_req});
        return (
            <Panel>
                <Panel.Body>
                <Table condensed>
                    <tbody>
                    <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{req.id}</td></tr>
                    <tr><th><FormattedMessage id="kind" defaultMessage="Kind" /></th><td>{req.kind}</td></tr>
                    <tr><th><FormattedMessage id="final-status" defaultMessage="Status" /></th><td>{req.status}</td></tr>
                    <tr><th><FormattedMessage id="external-id" defaultMessage="CRDC ID" /></th><td>{req.crdc_id}</td></tr>
                    <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td>{moment(req.created_on).format(DATE_FORMAT)}</td></tr>
                    </tbody>
                </Table>
                {
                    this.props.edit_mode && (
                        <div>
                            <ButtonToolbar>
                                <Button onClick={this.onSubmit} bsStyle="primary" disabled={this.state.saving}><FormattedMessage id="save" defaultMessage="Save" /></Button>
                                <Button onClick={this.onClose} disabled={this.state.saving}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                            </ButtonToolbar>
                        </div>
                    )
                }
                </Panel.Body>
            </Panel>
        )
    }
}


const TasksTable = ({tasks, onReplay, user_can_replay, tx_id}) => (
    <Table condensed>
        <thead>
        <tr>
            <th><FormattedMessage id="cell" defaultMessage="Cell" /></th>
            <th><FormattedMessage id="status" defaultMessage="Status" /></th>
            <th><FormattedMessage id="output" defaultMessage="Output" /></th>
            <th><FormattedMessage id="created" defaultMessage="Created" /></th>
            <th><FormattedMessage id="updated" defaultMessage="Updated" /></th>
            <th/>
        </tr>
        </thead>
        <tbody>
            {tasks.map((t) => {
                const can_replay = onReplay && user_can_replay && t.status === 'ERROR' &&
                    t.id === Math.max(tasks.filter((ot) => ot.cell_id === t.cell_id).map((oot) => oot.id));
                return (
            <tr key={t.id}>
                <th>{t.cell_id}</th>
                <td>{t.status}</td>
                <td>{t.output}</td>
                <td>{moment(t.created_on).format(DATE_FORMAT)}</td>
                <td>{t.updated_on?moment(t.updated_on).format(DATE_FORMAT):'-'}</td>
                <td>{can_replay && <Button onClick={() => onReplay(tx_id, t.id)}><FormattedMessage id="replay" defaultMessage="Replay" /></Button>}</td>
            </tr>)})}
        </tbody>
    </Table>
);


const TxTable = ({tx}) => (
    <Table condensed>
        <tbody>
            <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{tx.id}</td></tr>
            <tr><th><FormattedMessage id="status" defaultMessage="Status" /></th><td>{tx.status}</td></tr>
            <tr><th><FormattedMessage id="creation-date" defaultMessage="Creation date" /></th><td>{moment(tx.created_on).format(DATE_FORMAT)}</td></tr>
            <tr><th><FormattedMessage id="last-update" defaultMessage="Last update" /></th><td>{tx.updated_on}</td></tr>
            <tr><th><FormattedMessage id="errors" defaultMessage="Errors" /></th><td>{tx.errors.length}</td></tr>
        </tbody>
    </Table>
);


const ContextTable = ({context}) => (
    <Table style={{tableLayout: 'fixed'}}><tbody>
        {context.map(c =>
            <tr key={c.id}><th>{c.key}</th><td style={{wordWrap:'break-word'}}>{c.value}</td></tr>
        )}
        </tbody>
    </Table>
);


const RELOAD_TX = 10 * 1000;


export class Transaction extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: undefined,
            sending: false,
            activeTab: 1,
        };
        this.cancelLoad = false;

        this.onReplay = this.onReplay.bind(this);
        this.onForceClose = this.onForceClose.bind(this);
        this.fetchTxDetails = this.fetchTxDetails.bind(this);
        this.actionList = this.actionList.bind(this);
        this.changeTxStatus = this.changeTxStatus.bind(this);
        this.onReopen = this.onReopen.bind(this);
        this.sendEvent = this.sendEvent.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.caseUpdated = this.caseUpdated.bind(this);
        this.caseUpdateFailure = this.caseUpdateFailure.bind(this);
    }

    fetchTxDetails(reload) {
        this.setState({error: undefined});
        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`, this.props.auth_token)
            .then(data => {
                if(this.cancelLoad)
                    return;

                this.setState({tx: data});
            
                fetch_get(`/api/v01/voo/np_requests/${data.original_request_id}`, this.props.auth_token)
                    .then(data => !this.cancelLoad && this.setState({request: data}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));
                
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
            })
            .catch(error => {
                if(this.cancelLoad)
                    return;
                let error_msg = undefined;
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
                if(error.response === undefined) {
                    this.setState({error: error});
                    return
                }
                switch(error.response.status) {
                    case 404: error_msg = <FormattedMessage id="unknown-transaction" defaultMessage="Unknown transaction." />; break;
                    case 401: error_msg = <FormattedMessage id="not-allowed-transaction" defaultMessage="You are not allowed to see this transaction." />; break;
                    default: error_msg = <FormattedMessage id="unknown-error" defaultMessage="Unknown error: {status}" values={{status: error.response.status}} />;
                }
                this.setState({error: new Error(error_msg)})
            });
    }

    componentDidMount() {
        this.fetchTxDetails(true);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    componentWillReceiveProps() {
        this.setState({activeTab: 1});
        this.fetchTxDetails(false);
    }

    onReplay(activity_id, task_id) {
        fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {}, this.props.auth_token)
            .then(() => this.props.notifications.addNotification({
                    message: <FormattedMessage id="task-replayed" defaultMessage="Task replayed!"/>,
                    level: 'success'
                })
            )
            .catch(error => this.props.notifications.addNotification({
                    title: <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!"/>,
                    message: error.message,
                    level: 'error'
                })
            )
    }

    changeTxStatus(new_status) {
        fetch_put(`/api/v01/transactions/${this.state.tx.id}`, {status: new_status}, this.props.auth_token)
            .then(() => {
                this.fetchTxDetails(false);
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="task-status-changed" defaultMessage="Task status updated!"/>,
                    level: 'success'
                });
            })
            .catch(error => this.props.notifications.addNotification({
                    title: <FormattedMessage id="task-update-failed" defaultMessage="Task status update failed!"/>,
                    message: error.message,
                    level: 'error'
                })
            )
    }

    caseUpdated() {
        this.props.notifications.addNotification({
            message: <FormattedMessage id="case-updated" defaultMessage="Case updated!"/>,
            level: 'success'
        });
        this.fetchTxDetails(false);
    }

    caseUpdateFailure(error) {
        this.props.notifications.addNotification({
            title: <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!"/>,
            message: error.message,
            level: 'error'
        });
    }

    onForceClose() {
        this.changeTxStatus("CLOSED_IN_ERROR")
    }

    onReopen() {
        this.changeTxStatus("ACTIVE")
    }

    sendEvent(value, trigger_type, extra) {
        this.setState({sending: true});
        fetch_post(
            `/api/v01/transactions/${this.state.tx.id}/events`,
            {
                trigger_type: trigger_type,
                value: value,
                ...extra,
            },
            this.props.auth_token
        )
        .then(() => {
            this.caseUpdated();
            setTimeout(() => this.setState({sending: false}), RELOAD_TX);
        })
        .catch(error => {
            this.caseUpdateFailure(error);
            this.setState({sending: false});
        });
    }

    updateContext(key, value) {
        this.setState({sending: true});
        fetch_put(
            `/api/v01/transactions/${this.state.tx.id}/context`,
            {
                key: key,
                value: value,
            },
            this.props.auth_token
        )
            .then(() => {
                this.caseUpdated();
                setTimeout(() => this.setState({sending: false}), RELOAD_TX);
            })
            .catch(error => {
                this.caseUpdateFailure(error);
                this.setState({sending: false});
            });
    }

    onCancel() {
        this.sendEvent('', 'cancel');
    }

    onAbort() {
        this.sendEvent('', 'abort');
    }

    onEdit() {
        this.setState({edit_request: true})
    }

    actionList() {
        const {tx} = this.state;

        const is_active = tx.status === 'ACTIVE';
        const edited = this.state.edit_request === true;
        const is_portin = tx.request && tx.request.kind === 'PortIn';
        const is_portout = tx.request && tx.request.kind === 'PortOut';
        const fnp_exec_sent = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send FNPExec' && t.status === 'OK') !== -1;

        let can_edit = is_active && !is_portout;
        if(can_edit && is_portin) {
            const fnp_request_sent = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send FNPRequest' && t.status === 'OK') !== -1;
            const fnp_accept_recv = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send InDueDate' || t.cell_id === 'Set accepted') !== -1;

            can_edit = !fnp_exec_sent && (!fnp_request_sent || fnp_accept_recv);
        }
        const can_close = is_active;
        const can_reopen = !is_active;
        const can_cancel = is_active && is_portin && !fnp_exec_sent;
        const can_abort = is_active && is_portin && fnp_exec_sent;

        return (
            <ButtonGroup vertical block>
                {can_edit && <Button onClick={() => this.onEdit()} disabled={edited}><FormattedMessage id="edit" defaultMessage="Edit" /></Button> }
                {can_close && <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>}
                {can_reopen && <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>}
                {can_cancel && <Button onClick={() => this.onCancel()}><FormattedMessage id="trigger-cancel" defaultMessage="Trigger cancel" /></Button>}
                {can_abort && <Button onClick={() => this.onAbort()}><FormattedMessage id="trigger-abort" defaultMessage="Trigger abort" /></Button>}
            </ButtonGroup>
        )
    }

    render() {
        const {sending, error, tx, request, activeTab} = this.state;
        let alerts = [];
        error && alerts.push(
            <Alert bsStyle="danger" key='fail-fetch-tx'>
                <p>{error.message}</p>
            </Alert>
        );
        if(!tx && error) {
            return <div>{alerts.map(e => e)}</div>
        } else if (!tx) {
            return <div><FormattedMessage id='loading' defaultMessage='Loading...'/></div>
        }

        let actions_required = [];
        // add a user profile check to see if the user *can* approve/reject/hold
        const can_act = isAllowed(this.props.user_info.ui_profile, pages.requests_nprequests, access_levels.modify);

        if(tx.context.find(c => c.key === "donor_approval" && c.value === "waiting") !== undefined) {
            actions_required.push(<Alert bsStyle="warning">
                <FormattedMessage id="request-need-approval" defaultMessage="This request need your approval" />
                { can_act &&
                    <ButtonToolbar>
                        <Button bsSize="xsmall" onClick={() => this.sendEvent('accept', 'donor_approval')} disabled={sending}>
                            <FormattedMessage id="approve" defaultMessage="approve"/>
                        </Button>
                        <Button bsSize="xsmall" onClick={() => this.setState({showRejectReason: true})} disabled={sending}>
                            <FormattedMessage id="reject" defaultMessage="reject"/>
                        </Button>
                    </ButtonToolbar>
                }
            </Alert>);
        }

        return (
            <div>
                {alerts}
                <Row>
                    {can_act && tx.status === 'ACTIVE' && actions_required.map((a, i) => <div key={i}>{a}</div>)}
                </Row>
                <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({activeTab: e})} id="np-request-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
                        <Col xs={12} sm={6} md={8} lg={8}>
                            <RequestTable
                                request={request}
                                edit_mode={this.state.edit_request === true}
                                onEditEnd={() => {
                                    this.setState({edit_request: false});
                                    this.fetchTxDetails(false);
                                }}
                                {...this.props} />
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={4}>
                            {can_act &&
                                <Panel>
                                    <Panel.Heading>
                                        <Panel.Title><FormattedMessage id="actions" defaultMessage="Actions" /></Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body>
                                        {this.actionList()}
                                    </Panel.Body>
                                </Panel>
                            }
                            <Panel header="Context">
                                <ContextTable context={tx.context}/>
                            </Panel>
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={12}>
                            <Panel>
                                <Panel.Heading>
                                    <Panel.Title><FormattedMessage id="comments" defaultMessage="Comments" /></Panel.Title>
                                </Panel.Heading>
                                <Panel.Body>
                                    <Comments req_id={tx.id} {...this.props} />
                                </Panel.Body>
                            </Panel>
                        </Col>
                    </Tab>
                    <Tab
                        eventKey={2}
                        title={
                            <div>
                                <FormattedMessage id="workflow" defaultMessage="Workflow" /> <Badge>{tx.errors.length}</Badge>
                            </div>
                        }>
                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="summary" defaultMessage="Summary" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <TxTable tx={tx}/>
                            </Panel.Body>
                        </Panel>

                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <TransactionFlow definition={tx.definition} states={tx.tasks} />
                                <TasksTable
                                    tasks={tx.tasks}
                                    onReplay={this.onReplay}
                                    user_can_replay={can_act && tx.status === 'ACTIVE'}
                                    tx_id={tx.id}
                                />
                            </Panel.Body>
                        </Panel>

                        <Panel bsStyle="danger">
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="errors" defaultMessage="Errors" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <Errors errors={tx.errors} user_info={this.props.user_info}/>
                            </Panel.Body>
                        </Panel>

                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <Events
                                    tx_id={tx.id}
                                    user_can_replay={can_act && tx.status === 'ACTIVE'}
                                    {...this.props} />
                            </Panel.Body>
                        </Panel>
                    </Tab>
                </Tabs>
            </div>)
    }
}


export const errorCriteria = {
    status: {model: 'tasks', value: 'ERROR', op: 'eq'}
};


export const activeCriteria = {
    status: {model: 'instances', value: 'ACTIVE', op: 'eq'}
};


export const getIcon = (k) => {
    switch (k) {
        case "PortIn": return <Glyphicon glyph="arrow-right" title="PortIn"/>;
        case "PortOut": return <Glyphicon glyph="arrow-left" title="PortOut"/>;
        case "Disconnect": return <Glyphicon glyph="scissors" title="Disconnect"/>;
        case "Update": return <Glyphicon glyph="save" title="Update"/>;
        default: return "";
    }
};

export class Requests extends Component{
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            filter_criteria: Requests.criteria_from_params(this.props.location.search, this.props.user_info.ui_profile),
            paging_info: {
                page_number: 1, page_size: 50
            },
            sorting_spec : [{
                model: 'requests', field: 'created_on', direction: 'desc'
            }],

            requests: [], operators: [],
            pagination: {
                page_number: 1,
                num_pages: 1,
            },
            error: undefined,
        };
        this._refresh = this._refresh.bind(this);
        this._prepare_url = this._prepare_url.bind(this);
    }

    static default_criteria(ui_profile) {
        return {
            name: {model: 'request_entities', value: '', op: 'eq'},
            status: {model: 'instances', value: '', op: 'eq'},
            kind: {model: 'instances', value: '', op: 'eq'},
            created_on: {model: 'requests', value: '', op: 'ge'},
            request_status: {model: 'requests', value: '', op: 'eq'},
        }
    }

    static criteria_from_params(url_params, ui_profile) {
        const params = queryString.parse(url_params);
        let custom_params = {};
        if (params.filter !== undefined) {
            try {
                custom_params = JSON.parse(params.filter);
            } catch (e) { console.error(e) }
        }
        return update(
            Requests.default_criteria(ui_profile),
            {$merge: custom_params}
        );
    }

    componentDidMount() {
        this._refresh();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname === this.props.location.pathname &&
            nextProps.location.search !== this.props.location.search) {
            this.setState({
                filter_criteria: Requests.criteria_from_params(nextProps.location.search, nextProps.user_info.ui_profile)
            });
        }
    }

    componentWillUpdate(nextProps, nextState) {
        if(JSON.stringify(nextState.filter_criteria) !== JSON.stringify(this.state.filter_criteria)) {
            setTimeout(() => this._refresh(), 800);
        }
    }

    _prepare_url(paging_spec, sorting_spec, format) {
        let url = new URL(API_URL_PREFIX + '/api/v01/apio/requests/search');
        // filter
        const {filter_criteria} = this.state;
        let filter_spec = Object.keys(filter_criteria)
            .filter(f =>
                filter_criteria[f] &&
                (
                    (filter_criteria[f].value && filter_criteria[f].op) ||
                    filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_null' || typeof(filter_criteria[f].value) === 'boolean'
                )
            )
            .map(f => {
                switch(f) {
                    case 'number':
                        // special handling to look into the ranges of the requests
                        return {'or': [
                                {
                                    model: filter_criteria[f].model,
                                    field: 'range_from',
                                    op: filter_criteria[f].op,
                                    value: filter_criteria[f].value.trim()
                                },
                                {
                                    model: filter_criteria[f].model,
                                    field: 'range_to',
                                    op: filter_criteria[f].op,
                                    value: filter_criteria[f].value.trim()
                                }
                            ]};
                    case 'task_status':
                    case 'request_status':
                        return {
                            model: filter_criteria[f].model,
                            field: 'status',
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    default:
                        return {
                            model: filter_criteria[f].model, // needed in multi-model query
                            field: f,
                            op: filter_criteria[f].op,
                            value: f === 'created_on' || f === 'due_date' ?
                                moment(filter_criteria[f].value, 'DD/MM/YYYY HH:mm').format() :
                                filter_criteria[f].value.trim()
                        }
                }
            });
        url.searchParams.append('filter', JSON.stringify(filter_spec));
        // paging
        if(paging_spec !== undefined) {
            url.searchParams.append('paging', JSON.stringify(paging_spec));
        }
        //sorting
        if(sorting_spec !== undefined) {
            url.searchParams.append('sorting', JSON.stringify(sorting_spec));
        }
        //formatting
        if(format !== undefined){
            url.searchParams.append('as', format);
        }
        //full listing
        const qs = queryString.parse(this.props.location.search);
        if(qs.full) {
            url.searchParams.append('full', '1');
        }
        return url;
    }

    _refresh(p, s) {
        let {paging_info, sorting_spec, filter_criteria} = this.state;
        // override paging and sorting if needed
        if(p !== undefined) {
            paging_info = update(this.state.paging_info, {$merge: p});
        }
        if(s !== undefined) {
            sorting_spec = [s];
        }

        // get the export URL
        const url = this._prepare_url(paging_info, sorting_spec);
        let export_url = this._prepare_url(undefined, sorting_spec, 'csv');
        export_url.searchParams.append('auth_token', this.props.auth_token);

        //reset collection
        this.setState({requests: undefined});

        fetch_get(url, this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                // devnote: save in the history the search.
                const filter_spec = Object.keys(filter_criteria)
                    .filter(f => filter_criteria[f] && (
                        (filter_criteria[f].value && filter_criteria[f].op) ||
                        filter_criteria[f].or ||
                        filter_criteria[f].and ||
                        filter_criteria[f].op === 'is_null')
                    ).reduce((obj, key) => {
                        obj[key] = filter_criteria[key];
                        return obj;
                    }, {});

                if(Object.keys(filter_spec).length !== 0) {
                    const search_str = queryString.stringify(
                        {
                            filter: JSON.stringify(filter_spec),
                            paging_info: paging_info, // not used: RFU
                            sorting_spec: sorting_spec // not used: RFU
                        }
                    );
                    this.props.history.push(this.props.location.pathname + '?' + search_str);
                }

                this.setState({
                     requests: data.requests.map(c => {
                        c.created_on = c.created_on?moment(c.created_on).format(DATE_FORMAT):null;
                        return c;
                    }),
                    pagination: {
                        page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                        page_size: data.pagination[1],
                        num_pages: data.pagination[2],
                        total_results: data.pagination[3],
                    },
                    sorting_spec: data.sorting || [],
                    export_url: export_url.href
                });
            })
            .catch(error => !this.cancelLoad && this.setState({error: error}));
    }

    render() {
        const {filter_criteria, requests, export_url} = this.state;
        const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm").isValid();

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={false} >
                    <Panel.Heading>
                        <Panel.Title toggle><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body collapsible>
                        <Form horizontal>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="kind" defaultMessage="Kind" />
                                </Col>

                                <Col smOffset={1} sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.kind.value}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {kind: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="Disconnect">Disconnect</option>
                                        <option value="PortIn">PortIn</option>
                                        <option value="PortOut">PortOut</option>
                                        <option value="Update">Update</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="workflow-status" defaultMessage="Workflow status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.status.op}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.status.value}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="CLOSED_IN_ERROR">CLOSED_IN_ERROR</option>
                                        <option value="CLOSED_IN_SUCCESS">CLOSED_IN_SUCCESS</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="request-status" defaultMessage="Request status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.request_status.op}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {request_status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.request_status.value}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {request_status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="UPDATED">UPDATED</option>
                                        <option value="DISCONNECTED">DISCONNECTED</option>
                                        <option value="ACTIVATED">ACTIVATED</option>
                                        <option value="FAILED">FAILED</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={invalid_created_on?"error":null}>
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
                                        selected={filter_criteria.created_on.value.length !== 0?moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm"):null}
                                        onChangeRaw={d => {
                                            this.setState({
                                                filter_criteria: update(
                                                    this.state.filter_criteria,
                                                    {created_on: {$merge: {value: d.target.value}}})
                                            });
                                            d.target.value.length === 0 && d.preventDefault();
                                        }}
                                        onChange={d => this.setState({
                                            filter_criteria: update(
                                                this.state.filter_criteria,
                                                {created_on: {$merge: {value: d.format("DD/MM/YYYY HH:mm")}}})
                                        })}
                                        dateFormat="DD/MM/YYYY HH:mm"
                                        locale="fr-fr"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={60}/>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="flags" defaultMessage="Flags" />
                                </Col>

                                <Col smOffset={1} sm={8}>
                                    <Checkbox
                                        checked={filter_criteria.task_status && filter_criteria.task_status.value === 'ERROR'}
                                        onChange={e => (
                                            e.target.checked ?
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$merge: errorCriteria})
                                                }) :
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$unset: ['task_status']})
                                                })
                                        )} >
                                        <FormattedMessage id="with-errors" defaultMessage="With errors" />
                                    </Checkbox>

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
                            sorting_spec={this.state.sorting_spec}
                            headers={[
                                {title: '#', field: 'id', model: 'requests',
                                    render: n => <Link to={`/transactions/${n.id}`}>{n.id}</Link>,
                                    sortable: true
                                },
                                {title: <FormattedMessage id="status" defaultMessage="Status" />,
                                    field: 'status',
                                    model: 'requests',
                                    render: n => n.request.status,
                                    sortable: true,
                                },
                                {title: <FormattedMessage id="created-on" defaultMessage="Created on" />, field: 'created_on', model: 'requests', sortable: true},
                            ]}
                            pagination={this.state.pagination}
                            data={requests}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            />
                    </Panel.Body>
                </Panel>
                <Panel>
                    <Panel.Body>
                        <Button
                            bsStyle="primary"
                            href={export_url}
                            disabled={export_url === undefined}
                        >
                            <FormattedMessage id="export-as-csv" defaultMessage="Export as CSV" />
                        </Button>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
