import React from "react";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Alert from "react-bootstrap/lib/Alert";

import {FormattedMessage} from "react-intl";
import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";


class HistoryLine extends React.Component {
    state = {
        expended: false,
    };

    render() {
        const {expanded} = this.state;
        const {h} = this.props;
        const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

        let v = [
            <tr key={h.unique_id} onClick={() => this.setState({expanded: !expanded})}>
                <td>{expIco}</td>
                <td>{h.unique_id}</td>
                <td>{h.created_on}</td>
            </tr>
        ];

        if(expanded) {
            v.push(
                <tr key={h.unique_id + "_details"}>
                    <td colSpan={3}>
                        <Tabs defaultActiveKey={1}>
                            <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />} style={{paddingTop: "15px"}}>
                                <pre>
                                    {JSON.stringify(h.request.body, null, 2)}
                                </pre>
                            </Tab>
                            <Tab eventKey={2} title={<FormattedMessage id="response" defaultMessage="Response: {status}" values={{status: h.response.status}} /> } style={{paddingTop: "15px"}}>
                                <pre>
                                    {JSON.stringify(h.response.body, null, 2)}
                                </pre>
                            </Tab>
                        </Tabs>
                    </td>
                </tr>
            )
        }

        return v;
    }
}

class NewWebhook extends React.Component {
    static newWb = {
        name: '',
        active: true,
        target: '',
        format: 'json',
        secret: '',
        custom_header: '',
        custom_header_value: '',
        events: [],
    };
    state = {
        wb: NewWebhook.newWb,
        events: [],
        wb_history: [],
    };
    title = <FormattedMessage id="new-webhook" defaultMessage="New webhook" />;
    fakeEventGenerator = false;

    loadEvents() {
        fetch_get("/api/v01/webhooks/events", this.props.auth_token)
            .then(data => this.setState({events: data.events}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch_webhooks-events-failed" defaultMessage="Fetch webhooks events failed!" />,
                error.message,
            ))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.show !== this.props.show && this.props.show) {
            this.setState({wb: NewWebhook.newWb});
            this.loadEvents();
        }
    }

    onSave() {
        fetch_post("/api/v01/webhooks", this.state.wb, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="webhook-created" defaultMessage="Webhook created" />)
                this.props.onClose(true);
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="webhooks-creation-failed" defaultMessage="Webhook creation failed!" />,
                error.message,
            ))
    }

    onGenerateFakeEvent() {}

    render() {
        const {show, onClose} = this.props;
        const {wb, events, wb_history} = this.state;

        return (
            <Modal show={show} onHide={() => onClose(false)} backdrop={false} bsSize="large">
                <Modal.Header closeButton>
                        <Modal.Title>{this.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="active" defaultMessage="Active" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={wb.active}
                                        onChange={e => e.stopPropagation()}
                                        onClick={e =>
                                            this.setState({wb: update(wb, {$merge: {active: e.target.checked}})})
                                        } />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="name" defaultMessage="Name" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={wb.name}
                                        onChange={e => this.setState({wb: update(wb, {$merge: {name: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="target" defaultMessage="Target" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        placeholder="http://my-webhook/handler"
                                        value={wb.target}
                                        onChange={e => this.setState({wb: update(wb, {$merge: {target: e.target.value}})})}/>
                                    <HelpBlock>
                                        <FormattedMessage id="webhook-target-help" defaultMessage="need to be an URL"/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="secret" defaultMessage="Secret" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        type="password"
                                        value={wb.secret}
                                        onChange={e => this.setState({wb: update(wb, {$merge: {secret: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="custom-header" defaultMessage="Custom header" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        placeholder="X-API-HEADER"
                                        value={wb.custom_header}
                                        onChange={e => this.setState({wb: update(wb, {$merge: {custom_header: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="custom-header-value" defaultMessage="Custom header value" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        placeholder="..."
                                        value={wb.custom_header_value}
                                        onChange={e => this.setState({wb: update(wb, {$merge: {custom_header_value: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <hr/>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="events" defaultMessage="Events" />
                                </Col>

                                <Col sm={9}>
                                    {
                                        events.sort((a, b) => {
                                            if(a.event_id > b.event_id) return 1;
                                            if(a.event_id < b.event_id) return -1;
                                            return 0;
                                        }).map(e =>
                                            <Checkbox
                                                checked={wb.events.includes(e.event_id)}
                                                onChange={ev => {
                                                    if(ev.target.checked) {
                                                        this.setState({wb: update(wb, {events: {"$push": [e.event_id]}})})
                                                    } else {
                                                        this.setState({wb: update(wb, {events: {"$splice": [[wb.events.indexOf(e.event_id), 1]]}})})
                                                    }
                                                }}
                                            >
                                                {e.label}
                                            </Checkbox>
                                        )
                                    }
                                </Col>
                            </FormGroup>
                        </Form>
                        <hr/>
                        <ButtonToolbar>
                            <Button onClick={this.onSave.bind(this)} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                            <Button onClick={() => onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                            {
                                this.fakeEventGenerator &&
                                <Button onClick={() => this.onGenerateFakeEvent()}>
                                    <FormattedMessage id="fake-event" defaultMessage="Generate test event"/>
                                </Button>
                            }
                        </ButtonToolbar>
                        <hr/>
                        { this.fakeEventGenerator &&
                        <Form>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="history" defaultMessage="History"/>
                                </Col>
                                <Table>
                                    <tbody>
                                    {
                                        wb_history.sort((a, b) => {
                                            if (a.history_id < b.history_id) return 1;
                                            if (a.history_id > b.history_id) return -1;
                                            return 0;
                                        }).map(h =>
                                            <HistoryLine h={h}/>
                                        )
                                    }
                                    </tbody>
                                </Table>
                            </FormGroup>
                        </Form>
                        }
                    </Modal.Body>
            </Modal>
        )
    }
}


class UpdateWebhook extends NewWebhook {
    title = <FormattedMessage id="update-webhook" defaultMessage="Update webhook" />;
    static updatableFields = ["name", "active", "target", "secret", "custom_header", "custom_header_value", "events"];
    fakeEventGenerator = true;

    loadWebhookHistory(webhook_id) {
        fetch_get(`/api/v01/webhooks/${webhook_id}/history`, this.props.auth_token)
            .then(data => this.setState({wb_history: data.history}))
            .catch(error =>
                NotificationsManager.error(
                    <FormattedMessage id="webhook-fetch-history-error" defaultMessage="Failed to fetch webhook history" />,
                    error.message
                )
            )
    }

    onGenerateFakeEvent() {
        fetch_post(`/api/v01/webhooks/${this.props.wb.webhook_id}/test`, this.state.wb, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="webhook-tested" defaultMessage="Test call generated" />);
                setTimeout(() => this.loadWebhookHistory(this.props.wb.webhook_id), 1000);
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="test-call-failed" defaultMessage="Test call failed!" />,
                error.message,
            ))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.show !== this.props.show && this.props.show) {
            this.props.wb && this.setState({wb: this.props.wb});
            this.loadWebhookHistory(this.props.wb.webhook_id);
            this.loadEvents();
        }
    }

    onSave() {
        const {wb} = this.state;
        const wb_ = Object.keys(wb)
            .filter(k => UpdateWebhook.updatableFields.includes(k))
            .reduce(
                (obj, key) => {
                    obj[key] = wb[key];
                    return obj;
                }, {}
            );
        fetch_put(`/api/v01/webhooks/${this.props.wb.webhook_id}`, wb_, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="webhook-update" defaultMessage="Webhook updated" />);
                this.props.onClose(true);
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="webhooks-update-failed" defaultMessage="Webhook update failed!" />,
                error.message,
            ))
    }
}


class NewEvent extends React.Component {
    static newEvent = {
        label: '',
        tag: 'BW',
        method: 'post',
        url: '',
    };
    state = {
        ev: NewEvent.newEvent,
    };
    title = <FormattedMessage id="new-event" defaultMessage="New event" />;

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.show !== this.props.show && this.props.show) {
            this.setState({ev: NewEvent.newEvent});
        }
    }

    onSave() {
        fetch_post("/api/v01/webhooks/events", this.state.ev, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="event-created" defaultMessage="Event created" />)
                this.props.onClose(true);
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="event-creation-failed" defaultMessage="Event creation failed!" />,
                error.message,
            ))
    }

    render() {
        const {show, onClose} = this.props;
        const {ev} = this.state;

        return (
            <Modal show={show} onHide={() => onClose(false)} backdrop={false}>
                <Modal.Header closeButton>
                        <Modal.Title>{this.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="label" defaultMessage="Label" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={ev.label}
                                        onChange={e => this.setState({ev: update(ev, {$merge: {label: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="tag" defaultMessage="Tag" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="select"
                                        value={ev.tag}
                                        onChange={e => this.setState({ev: update(ev, {$merge: {tag: e.target.value}})})}>
                                        <option value="BW">BroadSoft AS</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="method" defaultMessage="Method" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="select"
                                        value={ev.method}
                                        onChange={e => this.setState({ev: update(ev, {$merge: {method: e.target.value}})})}>
                                        <option value="post">post</option>
                                        <option value="put">put</option>
                                        <option value="delete">delete</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="url" defaultMessage="Url" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        type="input"
                                        placeholder="/api/v1/tenants"
                                        value={ev.url}
                                        onChange={e => this.setState({ev: update(ev, {$merge: {url: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSave.bind(this)} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                        <Button onClick={() => onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                    </Modal.Footer>
            </Modal>
        )
    }
}


class UpdateEvent extends NewEvent {
    title = <FormattedMessage id="update-event" defaultMessage="Update event" />;
    static updatableFields = ["label", "tag", "method", "url"];

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.show !== this.props.show && this.props.show) {
            this.props.event && this.setState({ev: this.props.event});
        }
    }

    onSave() {
        const {ev} = this.state;
        const ev_ = Object.keys(ev)
            .filter(k => UpdateEvent.updatableFields.includes(k))
            .reduce(
                (obj, key) => {
                    obj[key] = ev[key];
                    return obj;
                }, {}
            );
        fetch_put(`/api/v01/webhooks/events/${this.props.event.event_id}`, ev_, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="event-update" defaultMessage="Event updated" />)
                this.props.onClose(true);
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="event-update-failed" defaultMessage="Event update failed!" />,
                error.message,
            ))
    }
}


class WebhookEvents extends React.Component {
    state = {
        newEvent: false,
        updateEvent: undefined,
        events: [],
    };

    fetchEvents() {
        fetch_get("/api/v01/webhooks/events", this.props.auth_token)
            .then(data => this.setState({events: data.events}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-events-failed" defaultMessage="Fetch events failed!" />,
                error.message,
            ));
    }

    onDelete(event_id) {
        fetch_delete(`/api/v01/webhooks/events/${event_id}`, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="event-deleted" defaultMessage="Event deleted" />);
                this.fetchEvents();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="delete-event-failed" defaultMessage="Delete event failed!" />,
                error.message,
            ))
    }

    componentDidMount() {
        this.fetchEvents()
    }

    render() {
        const {events} = this.state;
        return (
            <div>
                <hr/>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <Table>
                            <tbody>
                            {
                                events && events.sort(
                                    (a, b) => {
                                        if(a.event_id > b.event_id) return 1;
                                        if(a.event_id < b.event_id) return 1;
                                        return 0;
                                    }
                                ).map(e =>
                                    <tr>
                                        <td>{ e.label }</td>
                                        <td>{ e.tag }</td>
                                        <td>{ e.method }</td>
                                        <td>{ e.url }</td>
                                        <td style={{width: "20%"}}>
                                            <Button onClick={() => this.setState({updateEvent: e})} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="pencil"/>
                                            </Button>
                                            <Button onClick={() => this.onDelete(e.event_id)} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="remove-sign"/>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </Table>
                    </Panel.Body>
                </Panel>
                <Panel>
                    <Panel.Body>
                        <ButtonToolbar>
                            <Button bsStyle='primary' onClick={() => this.setState({newEvent: true})}>
                                <FormattedMessage id="new" defaultMessage="New" />
                            </Button>
                        </ButtonToolbar>
                    </Panel.Body>
                </Panel>

                <NewEvent
                    show={this.state.newEvent}
                    onClose={refresh => {
                        refresh && this.fetchEvents();
                        this.setState({newEvent: false})
                    }}
                    {...this.props} />

                <UpdateEvent
                    show={this.state.updateEvent}
                    event={this.state.updateEvent}
                    onClose={refresh => {
                        refresh && this.fetchEvents();
                        this.setState({updateEvent: undefined})
                    }}
                    {...this.props} />

            </div>
        )
    }
}


export class Webhooks extends React.Component {
    state = {
        webhooks: undefined,
        updateWebhook: undefined,
        newWebhook: false,
    };

    fetchWebhooks() {
        fetch_get("/api/v01/webhooks", this.props.auth_token)
            .then(data => this.setState({webhooks: data.webhooks}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch_webhooks-failed" defaultMessage="Fetch webhooks failed!" />,
                error.message,
            ));
    }

    onDelete(webhook_id) {
        fetch_delete(`/api/v01/webhooks/${webhook_id}`, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="webhook-deleted" defaultMessage="Webhook deleted" />);
                this.fetchWebhooks();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="delete_webhook-failed" defaultMessage="Delete webhook failed!" />,
                error.message,
            ))
    }

    componentDidMount() {
        this.fetchWebhooks()
    }

    render() {
        const {webhooks} = this.state;
        const {user_info} = this.props;
        const can_edit_webhook_events = user_info.is_system;

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="webhooks" defaultMessage="Webhooks"/></Breadcrumb.Item>
                </Breadcrumb>

                <Alert bsStyle="danger">This feature is experimental and shouldn't be used without pre-approval of the Netaxis dev team! (contact: norman.denayer@netaxis.be)</Alert>

                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="webhooks" defaultMessage="Webhooks" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <Table>
                            <tbody>
                            {
                                webhooks && webhooks.sort((a, b) => {
                                    if(a.webhook_id > b.webhook_id) return 1;
                                    if(a.webhook_id < b.webhook_id) return -1;
                                    return 0;
                                }).map(wh => (
                                    <tr>
                                        <td style={{width: "5%"}}>{wh.active?<Glyphicon glyph="ok"/>:<Glyphicon glyph="remove"/>}</td>
                                        <td style={{width: "75%"}}>{wh.target}</td>
                                        <td style={{width: "20%"}}>
                                            <Button onClick={() => this.setState({updateWebhook: wh})} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="pencil"/>
                                            </Button>
                                            <Button onClick={() => this.onDelete(wh.webhook_id)} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="remove-sign"/>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </Table>
                    </Panel.Body>
                </Panel>
                <Panel>
                    <Panel.Body>
                        <ButtonToolbar>
                            <Button bsStyle='primary' onClick={() => this.setState({newWebhook: true})}>
                                <FormattedMessage id="new" defaultMessage="New" />
                            </Button>
                        </ButtonToolbar>
                    </Panel.Body>
                </Panel>

                <NewWebhook
                    show={this.state.newWebhook}
                    onClose={refresh => {
                        refresh && this.fetchWebhooks();
                        this.setState({newWebhook: false})
                    }}
                    {...this.props} />

                <UpdateWebhook
                    show={this.state.updateWebhook}
                    wb={this.state.updateWebhook}
                    onClose={refresh => {
                        refresh && this.fetchWebhooks();
                        this.setState({updateWebhook: undefined})
                    }}
                    {...this.props} />

                {
                    can_edit_webhook_events && <WebhookEvents auth_token={this.props.auth_token} />
                }
            </div>
        );
    }
}
