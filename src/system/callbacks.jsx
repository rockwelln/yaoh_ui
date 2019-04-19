import React, {Component} from "react";

import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Form from "react-bootstrap/lib/Form";
import Table from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FormGroup from "react-bootstrap/lib/FormGroup";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import FormControl from "react-bootstrap/lib/FormControl";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import {FormattedMessage} from "react-intl";
import update from "immutability-helper";
import {fetch_delete, fetch_get, fetch_post, fetch_put} from "../utils";


const isJsonValid = e => {
    try {
        JSON.parse(e)
    } catch {
        return false;
    }
    return true;
};

const SAMPLE_ENDPOINT_EXTRA = JSON.stringify({
    "auth": {
        "type": "basic",
        "value": "<username>:<password>"
    }
}, null, 2);

const CallbackDetails = ({cb, onChange, onCancel, onSave}) => (
    <Form horizontal style={{paddingTop: 10}}>
        <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="event_category" defaultMessage="Event category"/>
            </Col>
            <Col sm={9}>
                <FormControl
                    componentClass="select"
                    value={cb.event_category}
                    onChange={e => onChange(update(cb, {$merge: {event_category: e.target.value}}))}>
                     <option value="" />

                     <option value="on_request_success">on_request_success</option>
                     <option value="on_request_failure">on_request_failure</option>
                     <option value="on_blocking_error">on_blocking_error</option>
                </FormControl>
            </Col>
        </FormGroup>
        <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="scope" defaultMessage="Scope"/>
            </Col>
            <Col sm={9}>
                <FormControl
                    componentClass="select"
                    value={cb.scope}
                    onChange={e => onChange(update(cb, {$merge: {scope: e.target.value}}))}>
                     <option value="" />

                     <FormattedMessage id="user" defaultMessage="User">
                         {m => <option value="user">{m}</option>}
                     </FormattedMessage>
                     <FormattedMessage id="group" defaultMessage="Group">
                         {m => <option value="group">{m}</option>}
                     </FormattedMessage>
                     <FormattedMessage id="platform" defaultMessage="Platform">
                         {m => <option value="platform">{m}</option>}
                     </FormattedMessage>
                </FormControl>
            </Col>
        </FormGroup>
        <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="endpoint" defaultMessage="Endpoint"/>
            </Col>
            <Col sm={9}>
                <FormControl
                    componentClass="input"
                    type="text"
                    value={cb.endpoint}
                    onChange={e => onChange(update(cb, {$merge: {endpoint: e.target.value}}))} />
            </Col>
        </FormGroup>
        <FormGroup validationState={!cb.endpoint_extra?null:isJsonValid(cb.endpoint_extra)?"success":"error"}>
            <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="extra" defaultMessage="Extra..."/>
            </Col>
            <Col sm={9}>
                <FormControl
                    componentClass="textarea"
                    placeholder={SAMPLE_ENDPOINT_EXTRA}
                    value={cb.endpoint_extra || ''}
                    onChange={e => onChange(update(cb, {$merge: {endpoint_extra: e.target.value}}))}
                    style={{minHeight: "150px"}} />
                <HelpBlock><FormattedMessage id="help-json" defaultMessage="Need to be JSON valid!"/></HelpBlock>
            </Col>
        </FormGroup>
        <FormGroup>
            <Col smOffset={2} sm={10}>
                <ButtonToolbar>
                    <Button onClick={onSave} bsStyle="primary" disabled={!(!cb.endpoint_extra || isJsonValid(cb.endpoint_extra))}>
                        <FormattedMessage id="save" defaultMessage="Save"/>
                    </Button>
                    <Button onClick={onCancel} bsStyle="default">
                        <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                    </Button>
                </ButtonToolbar>
            </Col>
        </FormGroup>
    </Form>
);


const CallbacksTable = ({callbacks, onEdit, onDelete, onAdd}) => (
    <Table>
        <thead>
        <tr>
            <th><FormattedMessage id="category" defaultMessage="Event category"/></th>
            <th><FormattedMessage id="scope" defaultMessage="Scope"/></th>
            <th><FormattedMessage id="endpoint" defaultMessage="Endpoint"/></th>
            <th/>
        </tr>
        </thead>
        <tbody>
        {
            callbacks && callbacks.map((cb, i) => {
                return (
                    <tr key={i}>
                        <td>{cb.event_category}</td>
                        <td>{cb.scope}</td>
                        <td>{cb.endpoint}</td>
                        <td>
                            <ButtonToolbar>
                                <Button bsStyle="primary" onClick={() => onEdit(i)}>
                                    <Glyphicon glyph="pencil"/>
                                </Button>
                                <Button bsStyle="danger" onClick={() => onDelete(cb.callback_id)}>
                                    <Glyphicon glyph="remove-circle"/>
                                </Button>
                            </ButtonToolbar>
                        </td>
                    </tr>
                )
            })
        }
        <tr>
            <td colSpan={4}>
                <Button bsStyle="primary" onClick={onAdd}><FormattedMessage id="add" defaultMessage="Add"/></Button>
            </td>
        </tr>
        </tbody>
    </Table>
);


export class CallbackHandler extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.cancelLoad = false;
        this.onDeleteCallback = this.onDeleteCallback.bind(this);
        this.onAddCallback = this.onAddCallback.bind(this);
        this.onUpdateCallback = this.onUpdateCallback.bind(this);
    }

    componentDidMount() {
        !this.cancelLoad && this.refresh()
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    refresh() {
        fetch_get(`/api/v01/system/users/${this.props.userId}/callbacks`, this.props.auth_token)
            .then(data => (
                !this.cancelLoad &&
                this.setState({
                    callbacks: data.callbacks.map(cb => {
                        if(cb.endpoint_extra) {
                            cb.endpoint_extra = JSON.stringify(cb.endpoint_extra, null, 2)
                        }
                        return cb;
                        }),
                    editCallback: undefined
                })
            ))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="Callbacks refresh"/>,
                message: error.message,
                level: 'error'
            }))
    }

    onDeleteCallback(cb_id) {
        fetch_delete(`/api/v01/system/users/${this.props.userId}/callbacks/${cb_id}`, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="callback-deleted" defaultMessage="Callback deleted"/>,
                    level: 'success'
                });
                !this.cancelLoad && this.refresh();
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="Callback removal failed"/>,
                message: error.message,
                level: 'error'
            }))
    }

    onAddCallback(cb) {
        let body = Object.assign(cb, {});
        if(body.endpoint_extra) {
            body.endpoint_extra = JSON.parse(body.endpoint_extra);
        } else {
            delete body.endpoint_extra;
        }
        fetch_post(`/api/v01/system/users/${this.props.userId}/callbacks`, body, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="callback-added" defaultMessage="Callback added"/>,
                    level: 'success'
                });
                !this.cancelLoad && this.refresh()
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="Callback creation failed"/>,
                message: error.message,
                level: 'error'
            }))
    }

    onUpdateCallback(cb) {
        let body = Object.assign(cb, {});
        if(body.endpoint_extra) {
            body.endpoint_extra = JSON.parse(body.endpoint_extra);
        } else {
            body.endpoint_extra = null;
        }
        fetch_put(
            `/api/v01/system/users/${this.props.userId}/callbacks/${cb.callback_id}`,
            Object.keys(body).filter(k => ['scope', 'event_category', 'endpoint', 'endpoint_extra'].includes(k)).reduce(
                (obj, key) => {
                    obj[key] = cb[key];
                    return obj;
                }, {}
            ),
            this.props.auth_token
        )
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="callback-update" defaultMessage="Callback updated"/>,
                    level: 'success'
                });
                !this.cancelLoad && this.refresh()
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="Callback update failed"/>,
                message: error.message,
                level: 'error'
            }))
    }

    render() {
        const {editCallback, callbacks} = this.state;

        return (
            editCallback ?
                 <CallbackDetails
                     cb={editCallback}
                     onChange={cb => this.setState({editCallback: cb})}
                     onCancel={() => this.setState({editCallback: undefined})}
                     onSave={() => editCallback.callback_id ? this.onUpdateCallback(editCallback) : this.onAddCallback(editCallback)}
                 /> :
                 <CallbacksTable
                     callbacks={callbacks}
                     onAdd={() => this.setState({editCallback: {event_category: '', scope: '', endpoint: ''}})}
                     onDelete={cb_i => this.onDeleteCallback(cb_i)}
                     onEdit={cb_i => this.setState({editCallback: callbacks[cb_i]})}
                 />
        )
    }
}