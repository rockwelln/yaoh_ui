import React, { Component } from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Table from 'react-bootstrap/lib/Table';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Modal from 'react-bootstrap/lib/Modal';
import {FormattedMessage} from 'react-intl';
import {fetch_delete, fetch_get, fetch_post, fetch_put} from "../utils";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Form from "react-bootstrap/lib/Form";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from 'immutability-helper';
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Alert from "react-bootstrap/lib/Alert";
import {StaticControl} from "../utils/common";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";

const CUSTOM_ROUTE_PREFIX = "https://<target>/api/v01/custom";
const JSON_SCHEMA_SAMPLE = (
`{
    "$schema": "http://json-schema.org/schema#",
    "type": "object",
    "properties": {
        "status": {
            "type": "string", "enum": ["ACTIVE", "ERROR"]
        }
    },
    "additionalProperties": false
}`
);


class DedicatedStartupEvents extends Component {
    constructor(props) {
        super(props);
        this.state = {events: [], handlers: []};
        this.cancelLoad = false;
        this.selectHandler = this.selectHandler.bind(this);
        this.refreshConfig = this.refreshConfig.bind(this);
    }

    refreshConfig() {
        fetch_get('/api/v01/transactions/startup_events', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({events: data.events}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-startup-events-failed" defaultMessage="Failed to fetch startup events"/>,
                message: error.message,
                level: 'error'
            }));

        fetch_get('/api/v01/activities', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({handlers: data.activities}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentDidMount() {
        this.refreshConfig()
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    selectHandler(e, eventName) {
        fetch_put(`/api/v01/transactions/startup_events/${eventName}`, {activity_id: e.target.value}, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-startup-event-done" defaultMessage="Startup event saved!"/>,
                    level: 'success'
                });
                this.refreshConfig()
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="update-startup-event-failed" defaultMessage="Failed to update startup event"/>,
                message: error.message,
                level: 'error'
            }));
    }

    render() {
        const {events, handlers} = this.state;
        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="startup-events" defaultMessage="Startup events" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Table>
                        <thead>
                        <tr>
                            <th><FormattedMessage id="trigger" defaultMessage="Trigger" /></th>
                            <th><FormattedMessage id="activity" defaultMessage="Activity" /></th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                           events.sort((a, b) => {
                               if(b.name > a.name) return -1;
                               if(b.name < a.name) return 1;
                               return 0
                           }).map(event => (
                                <tr key={event.name}>
                                    <td>{event.name}</td>
                                    <td>
                                        <select onChange={(e) => this.selectHandler(e, event.name)} value={event.activity_id || ''}>
                                            <FormattedMessage id="none" defaultMessage="*none*">
                                                {(message) => <option value={""}>{message}</option>}
                                            </FormattedMessage>
                                            {handlers
                                                .sort((a,b) => {
                                                    if(a.name > b.name) return 1;
                                                    if(a.name < b.name) return -1;
                                                    return 0;
                                                })
                                                .map(h => <option value={h.id} key={h.id}>{h.name}</option>)
                                            }
                                        </select>
                                    </td>
                                </tr>)
                            )
                        }
                        </tbody>
                    </Table>
                </Panel.Body>
            </Panel>
        )
    }
}


const isObject = value => value && typeof value === 'object' && value.constructor === Object;


class CustomRoutes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activities: [],
            custom_routes: [],
            new_route: CustomRoutes.new_route(),
            showSyncWarning: false,
            showUpdateModal:false
        };
        this.cancelLoad = false;
        this.fetchActivities = this.fetchActivities.bind(this);
        this.onSelectActivity = this.onSelectActivity.bind(this);
        this.onSyncUpdate = this.onSyncUpdate.bind(this);
    }

    static new_route() {
        return {method: "get", sync: false, route: "", schema: null}
    }

    fetchRoutes() {
        fetch_get('/api/v01/custom_routes', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({custom_routes: data.routes}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-routes-failed" defaultMessage="Failed to fetch custom routes"/>,
                message: error.message,
                level: 'error'
            }));
    }

    fetchActivities() {
        fetch_get('/api/v01/activities', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onSelectActivity(route_id, activity_id) {
        fetch_put(`/api/v01/custom_routes/${route_id}`, {activity_id: activity_id?parseInt(activity_id, 10): null}, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route saved!"/>,
                    level: 'success'
                });
                this.fetchRoutes();
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="update-custom-routes-failed" defaultMessage="Failed to update custom route"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onSyncUpdate(route_id, new_sync) {
        fetch_put(`/api/v01/custom_routes/${route_id}`, {sync: new_sync}, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route saved!"/>,
                    level: 'success'
                });
                this.fetchRoutes();
                this.setState({showSyncWarning: false, pending_route: undefined})
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="update-custom-routes-failed" defaultMessage="Failed to update custom route"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onNewRoute() {
        const {new_route} = this.state;
        // copy onto a new object.
        if(new_route.schema) {
            new_route.schema = JSON.parse(new_route.schema);
        }
        fetch_post('/api/v01/custom_routes', new_route, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route saved!"/>,
                    level: 'success'
                });
                this.setState({showNewRoute: false, new_route: CustomRoutes.new_route()});
                this.fetchRoutes();
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="create-custom-routes-failed" defaultMessage="Failed to create custom route"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onDeleteCustomRoute(route_id) {
        fetch_delete(`/api/v01/custom_routes/${route_id}`)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="delete-custom-route-done" defaultMessage="Custom route deleted!"/>,
                    level: 'success'
                });
                this.fetchRoutes();
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="delete-custom-routes-failed" defaultMessage="Failed to delete custom route"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onUpdateCustomRoute() {
        const {pending_route} = this.state;
        const route = Object.keys(pending_route).filter(k => ["activity_id", "schema", "sync"].includes(k)).reduce(
            (obj, key) => {
                obj[key] = pending_route[key];
                return obj;
            }, {}
        );
        if(route.schema) {
            route.schema = JSON.parse(route.schema);
        } else {
            route.schema = null;
        }
        fetch_put(`/api/v01/custom_routes/${pending_route.route_id}`, route, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route updated!"/>,
                    level: 'success'
                });
                this.setState({showUpdateModal: false, pending_route: undefined});
                this.fetchRoutes();
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="update-custom-routes-failed" defaultMessage="Failed to update custom route"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentDidMount() {
        this.fetchActivities();
        this.fetchRoutes();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        const {custom_routes, activities, showNewRoute, showUpdateModal, new_route, showSyncWarning, pending_route} = this.state;
        const hideNewRoute = () => this.setState({showNewRoute: false, new_route: CustomRoutes.new_route()});
        const cancelSyncWarning = () => this.setState({showSyncWarning: false, pending_route: undefined});
        const cancelUpdate = () => this.setState({showUpdateModal: false, pending_route: undefined});
        const route_ = new_route.route;
        const validRoute = !route_ || route_.length<5 ? null : (
             ["..", "?", "&"].map(c => route_.indexOf(c)).filter(i => i !== -1).length !== 0
        )  || route_[0] !== "/" ? "error" : "success";
        let validSchema = null;
        if(new_route.schema) {
            try {
                JSON.parse(new_route.schema);
                validSchema = "success";
            } catch {
                validSchema = "error";
            }
        }
        let validUpdateSchema = null;
        if(pending_route && pending_route.schema && !isObject(pending_route.schema)) {
            try {
                JSON.parse(pending_route.schema);
                validUpdateSchema = "success";
            } catch {
                validUpdateSchema = "error";
            }
        }
        const validNewRouteForm = validRoute === "success" && validSchema !== "error";
        const validUpdateRouteForm = validUpdateSchema !== "error";

        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="custom-routes" defaultMessage="Custom routes" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Table>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th><FormattedMessage id="method" defaultMessage="Method" /></th>
                            <th><FormattedMessage id="route" defaultMessage="Route (prefix: {prefix})" values={{prefix: CUSTOM_ROUTE_PREFIX}} /></th>
                            <th><FormattedMessage id="handler" defaultMessage="Activity" /></th>
                            <th><FormattedMessage id="sync" defaultMessage="Sync" /></th>
                            <th/>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            custom_routes && custom_routes.sort((a, b) => {
                                    if(a.route_id < b.route_id) return -1;
                                    if(a.route_id > b.route_id) return 1;
                                    return 0;
                                }).map((route, i) => (
                                    <tr key={i}>
                                        <td>{ route.route_id }</td>
                                        <td>{ route.method }</td>
                                        <td>{ route.route }</td>
                                        <td>
                                            <select onChange={e => this.onSelectActivity(route.route_id, e.target.value)} value={route.activity_id || ''}>
                                                <FormattedMessage id="none" defaultMessage="*none*">
                                                    {message => <option value={""}>{message}</option>}
                                                </FormattedMessage>
                                                {activities
                                                    .sort((a,b) => {
                                                        if(a.name > b.name) return 1;
                                                        if(a.name < b.name) return -1;
                                                        return 0;
                                                    })
                                                    .map(a => <option value={a.id} key={a.id}>{a.name}</option>)
                                                }
                                            </select>
                                        </td>
                                        <td>
                                            <Checkbox
                                                checked={route.sync}
                                                onChange={e => e.preventDefault()}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    this.setState({
                                                        pending_route: update(route, {$merge: {sync: e.target.checked}}),
                                                        showSyncWarning: true})
                                                }} />
                                        </td>
                                        <td>
                                            <ButtonToolbar>
                                                <Button
                                                    onClick={() => this.setState({
                                                        pending_route: Object.assign({}, route),
                                                        showUpdateModal: true})
                                                    }
                                                    bsStyle="primary"
                                                    style={{marginLeft: '5px', marginRight: '5px'}} >
                                                    <Glyphicon glyph="pencil"/>
                                                </Button>
                                                <Button onClick={() => this.onDeleteCustomRoute(route.route_id)} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
                                                    <Glyphicon glyph="remove-sign"/>
                                                </Button>
                                            </ButtonToolbar>
                                        </td>
                                    </tr>
                                ))
                        }
                        </tbody>
                    </Table>
                    <ButtonToolbar>
                        <Button onClick={() => this.setState({showNewRoute: true})}>
                            <FormattedMessage id="new-route" defaultMessage="New route" />
                        </Button>
                    </ButtonToolbar>
                    <Modal show={showNewRoute} onHide={hideNewRoute} backdrop={false}>
                        <Modal.Header closeButton>
                            <Modal.Title><FormattedMessage id="new-route" defaultMessage="New route" /></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form horizontal>
                                <FormGroup validationState={validRoute}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="route" defaultMessage="Route" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            value={new_route.route}
                                            placeholder="ex: /clients/{client_id:\d+}/addresses"
                                            onChange={e => this.setState({new_route: update(new_route, {$merge: {route: e.target.value}})})}/>
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col smOffset={2} sm={10}>
                                        <HelpBlock>
                                            <FormattedMessage id="custom-route-help" defaultMessage="The final endpoint will be: " />
                                            {`${CUSTOM_ROUTE_PREFIX}${new_route.route || ''}`}
                                        </HelpBlock>
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="method" defaultMessage="Method" />
                                    </Col>

                                    <Col sm={2}>
                                        <FormControl
                                            componentClass="select"
                                            value={new_route.method}
                                            onChange={e => this.setState({new_route: update(new_route, {$merge: {method: e.target.value}})})}>
                                            <option value="get">get</option>
                                            <option value="post">post</option>
                                            <option value="put">put</option>
                                            <option value="delete">delete</option>
                                        </FormControl>
                                    </Col>
                                </FormGroup>

                                <FormGroup validationState={validSchema}>
                                     <Col componentClass={ControlLabel} sm={2}>
                                         <FormattedMessage id="json-schema" defaultMessage="JSON Schema (optional)" />
                                     </Col>

                                     <Col sm={9}>
                                         <Button
                                             bsSize="small"
                                             style={{
                                                 position: "absolute",
                                                 right: "20px",
                                                 top: "5px",
                                             }}
                                             onClick={() => this.setState({new_route: update(new_route, {$merge: {schema: JSON_SCHEMA_SAMPLE}})})}>
                                             <FormattedMessage id="sample" defaultMessage="Sample"/>
                                         </Button>
                                         <FormControl componentClass="textarea"
                                             value={new_route.schema || ""}
                                             rows={5}
                                             placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                             onChange={e => this.setState({new_route: update(new_route, {$merge: {schema: e.target.value}})})} />

                                         <HelpBlock>
                                             <FormattedMessage id="custom-route-schema" defaultMessage="When set, the body is systematically checked against the schema associated to the route."/>
                                         </HelpBlock>
                                     </Col>
                                 </FormGroup>

                                 <FormGroup>
                                     <Col componentClass={ControlLabel} sm={2}>
                                         <FormattedMessage id="sync" defaultMessage="Sync" />
                                     </Col>

                                     <Col sm={9}>
                                         <Checkbox
                                             checked={new_route.sync}
                                             onChange={e => this.setState({new_route: update(new_route, {$merge: {sync: e.target.checked}})})}/>

                                         <HelpBlock>
                                             <FormattedMessage id="custom-route-sync" defaultMessage="When set, the call to this API is synchronous and the response is returned directly. Otherwise, only an instance id is returned and the associated job is spawned asynchronously."/>
                                         </HelpBlock>
                                     </Col>
                                 </FormGroup>

                                <FormGroup>
                                    <Col smOffset={2} sm={10}>
                                        <ButtonToolbar>
                                            <Button onClick={this.onNewRoute.bind(this)} bsStyle="primary" disabled={!validNewRouteForm}>
                                                <FormattedMessage id="create" defaultMessage="Create" />
                                            </Button>
                                            <Button onClick={hideNewRoute}>
                                                <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                            </Button>
                                        </ButtonToolbar>
                                    </Col>
                                </FormGroup>
                            </Form>
                        </Modal.Body>
                    </Modal>
                    {
                        pending_route && <Modal show={showUpdateModal} onHide={cancelUpdate} backdrop={false}>
                            <Modal.Header closeButton>
                                <Modal.Title>
                                    <FormattedMessage id="update" defaultMessage="Update"/>
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Form horizontal>
                                    <StaticControl label={<FormattedMessage id='route' defaultMessage='Route'/>} value={pending_route.route}/>
                                    <FormGroup>
                                        <Col smOffset={2} sm={10}>
                                            <HelpBlock>
                                                <FormattedMessage id="custom-route-help" defaultMessage="The final endpoint will be: " />
                                                {`${CUSTOM_ROUTE_PREFIX}${pending_route.route || ''}`}
                                            </HelpBlock>
                                        </Col>
                                    </FormGroup>

                                    <StaticControl label={<FormattedMessage id='method' defaultMessage='Method'/>} value={pending_route.method}/>

                                    <FormGroup validationState={validUpdateSchema}>
                                         <Col componentClass={ControlLabel} sm={2}>
                                             <FormattedMessage id="json-schema" defaultMessage="JSON Schema (optional)" />
                                         </Col>

                                         <Col sm={9}>
                                             <Button
                                                 bsSize="small"
                                                 style={{
                                                     position: "absolute",
                                                     right: "20px",
                                                     top: "5px",
                                                 }}
                                                 onClick={() => this.setState({pending_route: update(pending_route, {$merge: {schema: JSON_SCHEMA_SAMPLE}})})}>
                                                 <FormattedMessage id="sample" defaultMessage="Sample"/>
                                             </Button>
                                             <FormControl componentClass="textarea"
                                                 value={isObject(pending_route.schema)?JSON.stringify(pending_route.schema, null, 2):pending_route.schema || ""}
                                                 rows={5}
                                                 placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                                 onChange={e => this.setState({pending_route: update(pending_route, {$merge: {schema: e.target.value}})})} />

                                             <HelpBlock>
                                                 <FormattedMessage id="custom-route-schema" defaultMessage="When set, the body is systematically checked against the schema associated to the route."/>
                                             </HelpBlock>
                                         </Col>
                                     </FormGroup>

                                     <FormGroup>
                                         <Col componentClass={ControlLabel} sm={2}>
                                             <FormattedMessage id="sync" defaultMessage="Sync" />
                                         </Col>

                                         <Col sm={9}>
                                             <Checkbox
                                                 checked={pending_route.sync}
                                                 onChange={e => this.setState({pending_route: update(pending_route, {$merge: {sync: e.target.checked}})})}/>

                                             <HelpBlock>
                                                 <FormattedMessage id="custom-route-sync" defaultMessage="When set, the call to this API is synchronous and the response is returned directly. Otherwise, only an instance id is returned and the associated job is spawned asynchronously."/>
                                             </HelpBlock>
                                         </Col>
                                     </FormGroup>

                                    <FormGroup>
                                        <Col smOffset={2} sm={10}>
                                            <ButtonToolbar>
                                                <Button onClick={this.onUpdateCustomRoute.bind(this)} bsStyle="primary" disabled={!validUpdateRouteForm}>
                                                    <FormattedMessage id="save" defaultMessage="Save" />
                                                </Button>
                                                <Button onClick={cancelUpdate}>
                                                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                                </Button>
                                            </ButtonToolbar>
                                        </Col>
                                    </FormGroup>
                                </Form>
                            </Modal.Body>
                        </Modal>
                    }
                    {
                        pending_route && <Modal show={showSyncWarning} onHide={cancelSyncWarning} backdrop={false}>
                            <Modal.Header closeButton>
                                <Modal.Title><FormattedMessage id="confirm-update"
                                                               defaultMessage="Are you sure?"/></Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Alert bsStyle="info"><FormattedMessage id="sync-update"
                                                                        defaultMessage="Update sync flag..."/></Alert>
                                <p><FormattedMessage id="update-sync-warning"
                                                     defaultMessage={`You are about to change the output of the endpoint ${pending_route.route} !`}/>
                                </p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    onClick={() => this.onSyncUpdate(pending_route.route_id, pending_route.sync)}
                                    bsStyle="primary"
                                    autoFocus >
                                    <FormattedMessage id="ok" defaultMessage="Ok"/>
                                </Button>
                                <Button onClick={cancelSyncWarning}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    }
                </Panel.Body>
            </Panel>
        )
    }
}


export const StartupEvents = ({...props}) => (
    <div>
        <Breadcrumb>
            <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
            <Breadcrumb.Item active><FormattedMessage id="startup-events" defaultMessage="Startup events"/></Breadcrumb.Item>
        </Breadcrumb>
        <DedicatedStartupEvents {...props} />
        <CustomRoutes {...props} />
    </div>
);
