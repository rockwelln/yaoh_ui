import React, {useState, useEffect} from "react";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

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


function HistoryLine({h}) {
    const [expanded, setExpanded] = useState(false);
    const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

    let v = [
        <tr key={h.unique_id} onClick={() => setExpanded(!expanded)}>
            <td>{expIco}</td>
            <td>{h.unique_id}</td>
            <td>{h.created_on}</td>
        </tr>
    ];

    if(expanded) {
        v.push(
            <tr key={h.unique_id + "_details"}>
                <td colSpan={3}>
                    <Tabs defaultActiveKey={0} id={`hl-det-${h.unique_id}`}>
                        <Tab eventKey={0} title={<FormattedMessage id="request" defaultMessage="Request" />} style={{paddingTop: "15px"}}>
                            <pre>
                                {JSON.stringify(h.request.body, null, 2)}
                            </pre>
                        </Tab>
                        <Tab eventKey={1} title={<FormattedMessage id="response" defaultMessage="Response: {status}" values={{status: h.response.status}} /> } style={{paddingTop: "15px"}}>
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


const newWb = {
    name: '',
    active: true,
    target: '',
    secret: '',
    custom_header: '',
    custom_header_value: '',
    username: '',
    password: '',
    events: [],
};


function fetchEvents(onSuccess) {
    fetch_get("/api/v01/webhooks/events")
        .then(data => onSuccess(data.events))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch_webhooks-events-failed" defaultMessage="Fetch webhooks events failed!" />,
            error.message,
        ))
}


function createNewWebhook(data, onSuccess) {
    fetch_post("/api/v01/webhooks", data)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="webhook-created" defaultMessage="Webhook created" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="webhooks-creation-failed" defaultMessage="Webhook creation failed!" />,
            error.message,
        ))
}


function NewWebhook({show, onClose}) {
    const [wb, setWb] = useState(newWb);
    const [events, setEvents] = useState([]);

    useEffect(() => {
      if(show) {
        setWb(newWb);
        fetchEvents(setEvents);
      }
    }, [show]);

    return (
        <Modal show={show} onHide={() => onClose(false)} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                    <Modal.Title>
                        <FormattedMessage id="new-webhook" defaultMessage="New webhook" />
                    </Modal.Title>
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
                                        setWb(update(wb, {$merge: {active: e.target.checked}}))
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
                                    onChange={e => setWb(update(wb, {$merge: {name: e.target.value}}))}/>
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
                                    onChange={e => setWb(update(wb, {$merge: {target: e.target.value}}))}/>
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
                                    onChange={e => setWb(update(wb, {$merge: {secret: e.target.value}}))}/>
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
                                    onChange={e => setWb(update(wb, {$merge: {custom_header: e.target.value}}))}/>
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
                                    onChange={e => setWb(update(wb, {$merge: {custom_header_value: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <hr/>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="basic-auth-username" defaultMessage="Basic auth. username" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={wb.username}
                                    onChange={e => setWb(update(wb, {$merge: {username: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="basic-auth-password" defaultMessage="Basic auth. password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={wb.password}
                                    onChange={e => setWb(update(wb, {$merge: {password: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <hr/>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="events" defaultMessage="Events" />
                            </Col>

                            <Col sm={9}>
                                {
                                    events.sort((a, b) => a.event_id - b.event_id).map(e =>
                                        <Checkbox
                                            key={e.event_id}
                                            checked={wb.events.includes(e.event_id)}
                                            onChange={ev => {
                                                if(ev.target.checked) {
                                                    setWb(update(wb, {events: {"$push": [e.event_id]}}))
                                                } else {
                                                    setWb(update(wb, {events: {"$splice": [[wb.events.indexOf(e.event_id), 1]]}}))
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
                        <Button onClick={() => createNewWebhook(wb, () => onClose(true))} bsStyle="primary">
                            <FormattedMessage id="save" defaultMessage="Save" />
                        </Button>
                        <Button onClick={() => onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                    </ButtonToolbar>
                </Modal.Body>
        </Modal>
    )
}


function loadWebhookHistory(webhookID, onSuccess) {
    fetch_get(`/api/v01/webhooks/${webhookID}/history`)
        .then(data => onSuccess(data.history))
        .catch(error =>
            NotificationsManager.error(
                <FormattedMessage id="webhook-fetch-history-error" defaultMessage="Failed to fetch webhook history" />,
                error.message
            )
        )
}


function generateFakeEvent(webhookID, entry, onSuccess) {
    fetch_post(`/api/v01/webhooks/${webhookID}/test`, entry)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="webhook-tested" defaultMessage="Test call generated" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="test-call-failed" defaultMessage="Test call failed!" />,
            error.message,
        ))
}


function updateWebhook(webhookID, entry, onSuccess) {
    fetch_put(`/api/v01/webhooks/${webhookID}`, entry)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="webhook-update" defaultMessage="Webhook updated" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="webhooks-update-failed" defaultMessage="Webhook update failed!" />,
            error.message,
        ))
}


function UpdateWebhook({show, onClose, entry}) {
    const [diff, setDiff] = useState({});
    const [events, setEvents] = useState([]);
    const [wbHistory, setWebHistory] = useState([]);

    useEffect(() => {
        if(show) {
            setDiff({events: entry.events});
            fetchEvents(setEvents);
            loadWebhookHistory(entry.webhook_id, setWebHistory);
        }
    }, [show, entry]);

    if(entry === undefined) {
        return <div/>;
    }
    const localEntry = update(entry, {$merge: diff});

    return (
        <Modal show={show} onHide={() => onClose(false)} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="update-webhook" defaultMessage="Update webhook" />
                    { entry.name }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="active" defaultMessage="Active" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={localEntry.active}
                                onChange={e => e.stopPropagation()}
                                onClick={e =>
                                    setDiff(update(diff, {$merge: {active: e.target.checked}}))
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
                                value={localEntry.name}
                                onChange={e => setDiff(update(diff, {$merge: {name: e.target.value}}))}/>
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
                                value={localEntry.target}
                                onChange={e => setDiff(update(diff, {$merge: {target: e.target.value}}))}/>
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
                                value={localEntry.secret}
                                onChange={e => setDiff(update(diff, {$merge: {secret: e.target.value}}))}/>
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
                                value={localEntry.custom_header}
                                onChange={e => setDiff(update(diff, {$merge: {custom_header: e.target.value}}))}/>
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
                                value={localEntry.custom_header_value}
                                onChange={e => setDiff(update(diff, {$merge: {custom_header_value: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <hr/>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="basic-auth-username" defaultMessage="Basic auth. username" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={localEntry.username}
                                onChange={e => setDiff(update(diff, {$merge: {username: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="basic-auth-password" defaultMessage="Basic auth. password" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={localEntry.password}
                                onChange={e => setDiff(update(diff, {$merge: {password: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <hr/>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="events" defaultMessage="Events" />
                        </Col>

                        <Col sm={9}>
                            {
                                events.sort((a, b) => a.event_id - b.event_id).map(e =>
                                    <Checkbox
                                        key={e.event_id}
                                        checked={localEntry.events.includes(e.event_id)}
                                        onChange={ev => {
                                            if(ev.target.checked) {
                                                setDiff(update(diff, {events: {"$push": [e.event_id]}}))
                                            } else {
                                                setDiff(update(diff, {events: {"$splice": [[diff.events.indexOf(e.event_id), 1]]}}))
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
                    <Button onClick={() => updateWebhook(entry.webhook_id, diff, () => onClose(true))} bsStyle="primary">
                        <FormattedMessage id="save" defaultMessage="Save" />
                    </Button>
                    <Button onClick={() => onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                    <Button onClick={() => generateFakeEvent(entry.webhook_id, localEntry, () => setTimeout(() => loadWebhookHistory(entry.webhook_id, setWebHistory), 1000))}>
                        <FormattedMessage id="fake-event" defaultMessage="Generate test event"/>
                    </Button>
                </ButtonToolbar>
                <hr/>
                <Form>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="history" defaultMessage="History"/>
                        </Col>
                        <Table>
                            <tbody>
                            {
                                wbHistory.sort((a, b) => b.history_id - a.history_id).map(h =>
                                    <HistoryLine key={h.history_id} h={h}/>
                                )
                            }
                            </tbody>
                        </Table>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


const newEvent = {
    label: '',
    tag: '',
    method: 'post',
    url: '',
};


function createEvent(entry, onSuccess) {
    fetch_post("/api/v01/webhooks/events", entry)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="event-created" defaultMessage="Event created" />)
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="event-creation-failed" defaultMessage="Event creation failed!" />,
            error.message,
        ))
}

function NewEvent({show, onClose}) {
    const [event, setEvent] = useState(newEvent);

    useEffect(() => {show && setEvent(newEvent)}, [show]);
    return (
        <Modal show={show} onHide={() => onClose(false)} backdrop={false}>
            <Modal.Header closeButton>
                    <Modal.Title>
                        <FormattedMessage id="new-event" defaultMessage="New event" />
                    </Modal.Title>
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
                                    value={event.label}
                                    onChange={e => setEvent(update(event, {$merge: {label: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="method" defaultMessage="Method" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={event.method}
                                    onChange={e => setEvent(update(event, {$merge: {method: e.target.value}}))}>
                                    <option value="post">post</option>
                                    <option value="put">put</option>
                                    <option value="patch">patch</option>
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
                                    value={event.url}
                                    onChange={e => setEvent(update(event, {$merge: {url: e.target.value}}))}/>
                                <HelpBlock>
                                  This is a regular expression to match on URL.
                                </HelpBlock>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => createEvent(event, () => onClose(true))} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                    <Button onClick={() => onClose(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </Modal.Footer>
        </Modal>
    )
}


function updateEvent(eventID, diff, onSuccess) {
    fetch_put(`/api/v01/webhooks/events/${eventID}`, diff)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="event-update" defaultMessage="Event updated" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="event-update-failed" defaultMessage="Event update failed!" />,
            error.message,
        ))
}


function UpdateEvent({entry, show, onHide}) {
    const [diff, setDiff] = useState({});

    useEffect(() => {show && setDiff({})}, [show]);
    if(entry === undefined) {
        return <div/>;
    }
    const localEntry = update(entry, {$merge: diff});

    return (
        <Modal show={show} onHide={() => onHide(false)} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="update-event" defaultMessage="Update event" />
                </Modal.Title>
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
                                value={localEntry.label}
                                onChange={e => setDiff(update(diff, {$merge: {label: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="method" defaultMessage="Method" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="select"
                                value={localEntry.method}
                                onChange={e => setDiff(update(diff, {$merge: {method: e.target.value}}))}>
                                <option value="post">post</option>
                                <option value="put">put</option>
                                <option value="patch">patch</option>
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
                                value={localEntry.url}
                                onChange={e => setDiff(update(diff, {$merge: {url: e.target.value}}))}/>
                            <HelpBlock>
                              This is a regular expression to match on URL.
                            </HelpBlock>
                        </Col>
                    </FormGroup>
                </Form>
                <hr/>
                <ButtonToolbar>
                    <Button onClick={() => updateEvent(entry.event_id, diff, () => onHide(true))} bsStyle="primary">
                        <FormattedMessage id="save" defaultMessage="Save" />
                    </Button>
                    <Button onClick={() => onHide(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </ButtonToolbar>
            </Modal.Body>
        </Modal>
    )
}


function deleteEvent(eventId, onSuccess) {
    fetch_delete(`/api/v01/webhooks/events/${eventId}`)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="event-deleted" defaultMessage="Event deleted" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="delete-event-failed" defaultMessage="Delete event failed!" />,
            error.message,
        ))
}


function WebhookEvents() {
    const [events, setEvents] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [updateEvent, setUpdateEvent] = useState(undefined);

    useEffect(() => {fetchEvents(setEvents);}, []);

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
                                (a, b) => a.event_id - b.event_id
                            ).map(e =>
                                <tr key={e.event_id}>
                                    <td>{ e.label }</td>
                                    <td>{ e.method }</td>
                                    <td>{ e.url }</td>
                                    <td style={{width: "20%"}}>
                                        <Button onClick={() => setUpdateEvent(e)} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                                            <Glyphicon glyph="pencil"/>
                                        </Button>
                                        <Button onClick={() => deleteEvent(e.event_id, () => fetchEvents(setEvents))} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
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
                        <Button bsStyle='primary' onClick={() => setShowNew(true)}>
                            <FormattedMessage id="new" defaultMessage="New" />
                        </Button>
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>

            <NewEvent
                show={showNew}
                onClose={refresh => {
                    refresh && fetchEvents(setEvents);
                    setShowNew(false);
                }}
                />

            <UpdateEvent
                show={updateEvent !== undefined}
                entry={updateEvent}
                onHide={refresh => {
                    refresh && fetchEvents(setEvents);
                    setUpdateEvent(undefined);
                }}
                />
        </div>
    )
}


function fetchWebhooks(onSuccess) {
    fetch_get("/api/v01/webhooks")
        .then(data => onSuccess(data.webhooks))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch_webhooks-failed" defaultMessage="Fetch webhooks failed!" />,
            error.message,
        ));
}


function deleteWebhook(webhookId, onSuccess) {
    fetch_delete(`/api/v01/webhooks/${webhookId}`)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="webhook-deleted" defaultMessage="Webhook deleted" />);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="delete_webhook-failed" defaultMessage="Delete webhook failed!" />,
            error.message,
        ))
}

export function Webhooks() {
    const [webhooks, setWebhooks] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [updateWh, setUpdateWh] = useState(undefined);

    useEffect(() => {
      fetchWebhooks(setWebhooks);
      document.title = "Webhooks";
    }, []);

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="webhooks" defaultMessage="Webhooks"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="webhooks" defaultMessage="Webhooks" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Table>
                        <tbody>
                        {
                            webhooks && webhooks.sort((a, b) => a.webhook_id - b.webhook_id).map(wh => (
                                <tr key={wh.webhook_id}>
                                    <td style={{width: "5%"}}>{wh.active?<Glyphicon glyph="ok"/>:<Glyphicon glyph="remove"/>}</td>
                                    <td style={{width: "75%"}}>{wh.target}</td>
                                    <td style={{width: "20%"}}>
                                        <Button onClick={() => setUpdateWh(wh)} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                                            <Glyphicon glyph="pencil"/>
                                        </Button>
                                        <Button onClick={() => deleteWebhook(wh.webhook_id, () => fetchWebhooks(setWebhooks))} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
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
                        <Button bsStyle='primary' onClick={() => setShowNew(true)}>
                            <FormattedMessage id="new" defaultMessage="New" />
                        </Button>
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>

            <NewWebhook
                show={showNew}
                onClose={refresh => {
                    refresh && fetchWebhooks(setWebhooks);
                    setShowNew(false);
                }}
                />

            <UpdateWebhook
                show={updateWh !== undefined}
                entry={updateWh}
                onClose={refresh => {
                    refresh && fetchWebhooks(setWebhooks);
                    setUpdateWh(undefined);
                }}
                />

            <WebhookEvents />
        </div>
    );
}
