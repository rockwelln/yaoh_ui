import React, {useState, useEffect, useCallback} from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Table from 'react-bootstrap/lib/Table';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Modal from 'react-bootstrap/lib/Modal';
import {FormattedMessage} from 'react-intl';
import {
  API_URL_PREFIX,
  AuthServiceManager,
  fetch_delete,
  fetch_get,
  fetch_post,
  fetch_put,
  NotificationsManager
} from "../utils";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import Form from "react-bootstrap/lib/Form";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Alert from "react-bootstrap/lib/Alert";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import SplitButton from "react-bootstrap/lib/SplitButton";
import {useDropzone} from "react-dropzone";
import {JSON_TRANS_OPTIONS_SAMPLE} from "../system/bulk_actions";
import Select from "react-select";
import {SearchBar} from "../utils/datatable";
import InputGroup from "react-bootstrap/lib/InputGroup";
import {faDownload, faEdit, faSpinner, faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Creatable from "react-select/creatable";
import MenuItem from "react-bootstrap/lib/MenuItem";
import {deleteActivity, NewActivity, WORKING_VERSION_LABEL} from "./activity-editor";

import "./loading.css";

const CUSTOM_ROUTE_PREFIX = "https://<target>/api/v01/custom";
const PUBLIC_ROUTE_PREFIX = "https://<target>/api/v01/public";
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
const OUTPUT_JSON_SCHEMA_SAMPLE = (
  `{
      "200": {
        "description": "entity created",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "number"
                },
                "name": {
                  "type": "string",
                  "description": "entity name"
                }
              }
            }
          }
        }
      },
      "403": {
        "description": "operation forbidden"
      },
      "404": {
        "description": "entity not found"
      }
  }`
  );

function fetchStartupEvents(onSuccess) {
    fetch_get('/api/v01/transactions/startup_events')
        .then(data => onSuccess(data.events))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch-startup-events-failed" defaultMessage="Failed to fetch startup events"/>,
            error.message,
        ));
}


function fetchActivities(onSuccess) {
    fetch_get('/api/v01/activities')
        .then(data => onSuccess(data.activities))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
            error.message,
        ));
}


function fetchCustomRoutes(onSuccess) {
    fetch_get('/api/v01/custom_routes')
        .then(data => onSuccess(data.routes))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch-routes-failed" defaultMessage="Failed to fetch custom routes"/>,
            error.message
        ));
}


function importCustomRoute(data, options, onSuccess) {
    const url = new URL(API_URL_PREFIX + `/api/v01/custom_routes/import`);
    Object.entries(options).map(([k, v]) => url.searchParams.append(k, v));
    return fetch_post(url, data)
        .then(r => onSuccess(r));
}


function deleteCustomRoute(routeId, onSuccess, onError) {
    fetch_delete(`/api/v01/custom_routes/${routeId}`)
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="delete-custom-route-done" defaultMessage="Custom route deleted!"/>,
            );
            onSuccess();
        })
        .catch(error => {
          NotificationsManager.error(
            <FormattedMessage id="delete-custom-routes-failed" defaultMessage="Failed to delete custom route"/>,
            error.message
          )
          onError && onError();
        });
}

function updateHandler(e, eventName, onSuccess) {
    fetch_put(`/api/v01/transactions/startup_events/${eventName}`, {activity_id: e.target.value})
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="update-startup-event-done" defaultMessage="Startup event saved!"/>,
            );
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="update-startup-event-failed" defaultMessage="Failed to update startup event"/>,
            error.message,
        ));
}

function updateGroupName(oldName, newName, onSuccess) {
  fetch_put(`/api/v01/custom_routes/groups/${oldName}`, {name: newName})
      .then(() => {
          NotificationsManager.success(
              <FormattedMessage id="update-group-done" defaultMessage="Group saved!"/>,
          );
          onSuccess();
      })
      .catch(error => NotificationsManager.error(
          <FormattedMessage id="update-group-failed" defaultMessage="Failed to update startup events"/>,
          error.message,
      ));
}

function DedicatedEvents(props) {
    const [activities, setActivities] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchActivities(setActivities);
        fetchStartupEvents(setEvents);
    }, []);

    if(events.length === 0) {
        return <div/>
    }

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
                       events.sort((a, b) => a.name.localeCompare(b.name)).map(event => (
                            <tr key={event.name}>
                                <td>{event.name}</td>
                                <td>
                                    <select onChange={e => updateHandler(e, event.name, () => fetchStartupEvents(setEvents))} value={event.activity_id || ''}>
                                        <FormattedMessage id="none" defaultMessage="*none*">
                                            {(message) => <option value={""}>{message}</option>}
                                        </FormattedMessage>
                                        {
                                            activities
                                                .sort((a,b) => a.name.localeCompare(b.name))
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

const isObject = value => value && typeof value === 'object' && value.constructor === Object;
const newRoute = {method: "get", sync: false, public: false, enabled:true, route: "", schema: null, output_schema: null, support_bulk: false, bulk_options: null, group: null};


function updateCustomRoute(routeId, entry, onSuccess) {
    if(entry.schema) {
        entry.schema = JSON.parse(entry.schema);
    } else if(typeof entry.schema === "string" && entry.schema.length === 0) {
        entry.schema = null;
    }
    if(entry.output_schema) {
      entry.output_schema = JSON.parse(entry.output_schema);
    } else if(typeof entry.output_schema === "string" && entry.output_schema.length === 0) {
      entry.output_schema = null;
    }
    fetch_put(`/api/v01/custom_routes/${routeId}`, entry)
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route saved!"/>
            );
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="update-custom-routes-failed" defaultMessage="Failed to update custom route"/>,
            error.message
        ));
}


function updateCustomRouteActivity(routeId, activityId, onSuccess) {
    return updateCustomRoute(routeId, {activity_id: activityId?parseInt(activityId, 10): null}, onSuccess);
}


function updateCustomRouteEnabled(routeId, enabled, onSuccess) {
    return updateCustomRoute(routeId, {enabled: enabled}, onSuccess);
}


function updateCustomRouteSync(routeId, sync, onSuccess) {
    return updateCustomRoute(routeId, {sync: sync}, onSuccess);
}

function updateCustomRoutePublic(routeId, public_, onSuccess) {
    return updateCustomRoute(routeId, {public: public_}, onSuccess);
}


function createCustomRoute(route, onSuccess) {
    if(route.schema) {
        route.schema = JSON.parse(route.schema);
    }
    if(route.output_schema) {
      route.output_schema = JSON.parse(route.output_schema);
    }
    fetch_post('/api/v01/custom_routes', route)
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="update-custom-route-done" defaultMessage="Custom route saved!"/>,
            );
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="create-custom-routes-failed" defaultMessage="Failed to create custom route"/>,
            error.message
        ));
}

function NewCustomRoute({show, onHide, groups, activities}) {
    const [route, setRoute] = useState(newRoute);

    useEffect(() => {
        !show && setRoute(newRoute);
    }, [show]);

    const r = route.route;
    const validRoute = !r || r.length<5 ? null : (
         ["..", "?", "&"].map(c => r.indexOf(c)).filter(i => i !== -1).length !== 0
    )  || r[0] !== "/" ? "error" : "success";
    let validSchema = null;
    if(route.schema) {
        try {
            JSON.parse(route.schema);
            validSchema = "success";
        } catch {
            validSchema = "error";
        }
    }
    let validOutputSchema = null;
    if(route.output_schema) {
        try {
            JSON.parse(route.output_schema);
            validOutputSchema = "success";
        } catch {
          validOutputSchema = "error";
        }
    }
    let validOptions = null;
    if(route.bulk_options) {
        try {
            JSON.parse(route.bulk_options);
            validOptions = "success";
        } catch {
            validOptions = "error";
        }
    }
    const validNewRouteForm = validRoute === "success" && validSchema !== "error" && validOutputSchema !== "error" && validOptions !== "error";
    const activitiesOptions = activities
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(a => ({value: a.id, label: `${a.name} (${!a.version_label?WORKING_VERSION_LABEL:a.version_label})`}));

    return (
        <Modal show={show} onHide={() => onHide(false)} backdrop={false}>
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
                                value={route.route}
                                placeholder="ex: /clients/{client_id:\d+}/addresses"
                                onChange={e => setRoute({...route, route: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <HelpBlock>
                                <FormattedMessage id="custom-route-help" defaultMessage="The final endpoint will be: " />
                                {`${route.route && route.route.startsWith("/api/v01/")?'https://<target>':CUSTOM_ROUTE_PREFIX}${route.route || ''}`}
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
                                value={route.method}
                                onChange={e => setRoute({...route, method: e.target.value})}>
                                <option value="get">get</option>
                                <option value="post">post</option>
                                <option value="put">put</option>
                                <option value="delete">delete</option>
                            </FormControl>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="group" defaultMessage="Group" />
                        </Col>

                        <Col sm={9}>
                            <Creatable
                              value={{value: route.group || "", label: route.group || "*unassigned*"}}
                              isClearable
                              isSearchable
                              name="groups"
                              onChange={(value, action) => {
                                if(["select-option", "create-option", "clear"].includes(action.action)) {
                                  setRoute({...route, group: value ? value.value: null});
                                }
                              }}
                              options={groups.map(g => ({value: g, label: g}))} />
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
                                 onClick={() => setRoute({...route, schema: JSON_SCHEMA_SAMPLE})}>
                                 <FormattedMessage id="sample" defaultMessage="Sample"/>
                             </Button>
                             <FormControl componentClass="textarea"
                                 value={route.schema || ""}
                                 rows={5}
                                 placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                 onChange={e => setRoute({...route, schema: e.target.value})} />

                             <HelpBlock>
                                 <FormattedMessage id="custom-route-schema" defaultMessage="When set, the body is systematically checked against the schema associated to the route."/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                     <FormGroup validationState={validOutputSchema}>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="output-json-schema" defaultMessage="Output JSON Schema (optional)" />
                         </Col>

                         <Col sm={9}>
                             <Button
                                 bsSize="small"
                                 style={{
                                     position: "absolute",
                                     right: "20px",
                                     top: "5px",
                                 }}
                                 onClick={() => setRoute({...route, output_schema: OUTPUT_JSON_SCHEMA_SAMPLE})}>
                                 <FormattedMessage id="sample" defaultMessage="Sample"/>
                             </Button>
                             <FormControl componentClass="textarea"
                                 value={route.output_schema || ""}
                                 rows={5}
                                 placeholder={"ex: " + OUTPUT_JSON_SCHEMA_SAMPLE}
                                 onChange={e => setRoute({...route, output_schema: e.target.value})} />

                             <HelpBlock>
                                 <FormattedMessage id="output-custom-route-schema" defaultMessage="Inform in the custom route doc generation about the structure and the rules of the answer of this endpoint."/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="err-activity-id" defaultMessage="Error handler" />
                         </Col>

                         <Col sm={9}>
                             <Select
                              className="basic-single"
                              classNamePrefix="select"
                              value={route.err_activity_id && activitiesOptions.find(a => a.value === route.err_activity_id)}
                              isClearable={true}
                              isSearchable={true}
                              name="err-activity"
                              onChange={(value, action) => {
                                  if(["select-option", "clear"].includes(action.action)) {
                                    setRoute({...route, err_activity_id: value?.value || null});
                                  }
                              }}
                              options={activitiesOptions} />
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="enabled" defaultMessage="Enabled" />
                         </Col>

                         <Col sm={9}>
                             <Checkbox
                                 checked={route.enabled}
                                 onChange={e => setRoute({...route, enabled: e.target.checked})}/>
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="sync" defaultMessage="Sync" />
                         </Col>

                         <Col sm={9}>
                             <Checkbox
                                 checked={route.sync}
                                 onChange={e => setRoute({...route, sync: e.target.checked})}/>

                             <HelpBlock>
                                 <FormattedMessage id="custom-route-sync" defaultMessage="When set, the call to this API is synchronous and the response is returned directly. Otherwise, only an instance id is returned and the associated job is spawned asynchronously."/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="public" defaultMessage="Public" />
                         </Col>

                         <Col sm={9}>
                             <Checkbox
                                 checked={route.public}
                                 onChange={e => setRoute({...route, public: e.target.checked})}/>

                             <HelpBlock>
                                 <FormattedMessage id="custom-route-public" defaultMessage="Whether the route is public or not. (when public the route is exposed as /api/v0x/public/... and require no authentication at all)"/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="support-bulk" defaultMessage="Support bulk" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                               checked={route.support_bulk}
                               onChange={e => setRoute({...route, support_bulk: e.target.checked})}/>

                            <HelpBlock>
                               <FormattedMessage id="custom-route-support-bulk" defaultMessage="When set, the API will serve additionally a route with '/bulk' append to the custom URL. This endpoint support form-data body with a 'label' and a file content 'input_file' with a CSV structure (1 line per requests to be created)"/>
                            </HelpBlock>
                        </Col>
                   </FormGroup>

                    <FormGroup validationState={validOptions}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="bulk-options" defaultMessage="Bulk options (optional)" />
                        </Col>

                        <Col sm={9}>
                            <Button
                                bsSize="small"
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                    top: "5px",
                                }}
                                onClick={() => setRoute({...route, bulk_options: JSON_TRANS_OPTIONS_SAMPLE})}>
                                <FormattedMessage id="sample" defaultMessage="Sample"/>
                            </Button>
                            <FormControl
                                componentClass="textarea"
                                value={route.bulk_options || ""}
                                rows={5}
                                placeholder={"ex: " + JSON_TRANS_OPTIONS_SAMPLE}
                                onChange={e =>
                                    setRoute({...route, bulk_options: e.target.value})
                                } />
                            <HelpBlock>
                                <FormattedMessage
                                    id="bulk-action-options"
                                    defaultMessage="This is used to configure the transformation of the CSV record into JSON. (See {ref_link} for more information)"
                                    values={{ref_link: <a href="https://github.com/rockwelln/csv2json" target="_blank" rel="noopener noreferrer">csv2json</a>}}
                                />
                            </HelpBlock>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <ButtonToolbar>
                                <Button onClick={() => createCustomRoute(route, () => onHide(true))} bsStyle="primary" disabled={!validNewRouteForm}>
                                    <FormattedMessage id="create" defaultMessage="Create" />
                                </Button>
                                <Button onClick={() => onHide(false)}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                </Button>
                            </ButtonToolbar>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


function UpdateCustomRouteModal({show, entry, onHide, groups, activities}) {
    const [diffEntry, setDiffEntry] = useState({});

    useEffect(() => {
        !show && setDiffEntry({});
    }, [show]);

    const localEntry = {...entry, ...diffEntry};
    let validUpdateSchema = null;
    let validUpdateOutputSchema = null;

    const r = localEntry.route;
    const validRoute = !r || r.length<5 ? null : (
         ["..", "?", "&"].map(c => r.indexOf(c)).filter(i => i !== -1).length !== 0
    )  || r[0] !== "/" ? "error" : "success";
    if(diffEntry.schema) {
        try {
            JSON.parse(diffEntry.schema);
            validUpdateSchema = "success";
        } catch {
            validUpdateSchema = "error";
        }
    }
    if(diffEntry.output_schema) {
      try {
          JSON.parse(diffEntry.output_schema);
          validUpdateOutputSchema = "success";
      } catch {
         validUpdateOutputSchema = "error";
      }
  }
    let validOptions = null;
    if(diffEntry.bulk_options) {
        try {
            JSON.parse(diffEntry.bulk_options);
            validOptions = "success";
        } catch {
            validOptions = "error";
        }
    }
    const validUpdateRouteForm = validUpdateSchema !== "error" && validOptions !== "error";
    const activitiesOptions = activities
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(a => ({value: a.id, label: `${a.name} (${!a.version_label?WORKING_VERSION_LABEL:a.version_label})`}));

    const endpointPfx = localEntry.public ? PUBLIC_ROUTE_PREFIX : entry.route?.startsWith("/api/v01/") ? 'https://<target>' : CUSTOM_ROUTE_PREFIX;

    return (
        <Modal show={show} onHide={() => onHide(false)} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="update" defaultMessage="Update"/>
                </Modal.Title>
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
                                value={localEntry.route || ""}
                                placeholder="ex: /clients/{client_id:\d+}/addresses"
                                onChange={e => setDiffEntry({...diffEntry, route: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <HelpBlock>
                                <FormattedMessage id="custom-route-help" defaultMessage="The final endpoint will be: " />
                                {`${endpointPfx}${entry.route || ''}`}
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
                                value={localEntry.method || ""}
                                onChange={e => setDiffEntry({...diffEntry, method: e.target.value})}>
                                <option value="get">get</option>
                                <option value="post">post</option>
                                <option value="put">put</option>
                                <option value="delete">delete</option>
                            </FormControl>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="group" defaultMessage="Group" />
                        </Col>

                        <Col sm={9}>
                            <Creatable
                              value={{value: localEntry.group, label: localEntry.group || "*unassigned*"}}
                              isClearable
                              isSearchable
                              name="groups"
                              onChange={(value, action) => {
                                if(["select-option", "create-option", "clear"].includes(action.action)) {
                                  setDiffEntry({...diffEntry, group: value ? value.value: null});
                                }
                              }}
                              options={groups.map(g => ({value: g, label: g}))} />
                        </Col>
                    </FormGroup>

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
                                 onClick={() => setDiffEntry({...diffEntry, schema: JSON_SCHEMA_SAMPLE})}>
                                 <FormattedMessage id="sample" defaultMessage="Sample"/>
                             </Button>
                             <FormControl componentClass="textarea"
                                 value={isObject(localEntry.schema)?JSON.stringify(localEntry.schema, null, 2):localEntry.schema || ""}
                                 rows={5}
                                 placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                 onChange={e => setDiffEntry({...diffEntry, schema: e.target.value})} />

                             <HelpBlock>
                                 <FormattedMessage id="custom-route-schema" defaultMessage="When set, the body is systematically checked against the schema associated to the route."/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                     <FormGroup validationState={validUpdateOutputSchema}>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="output-json-schema" defaultMessage="Output JSON Schema (optional)" />
                         </Col>

                         <Col sm={9}>
                             <Button
                                 bsSize="small"
                                 style={{
                                     position: "absolute",
                                     right: "20px",
                                     top: "5px",
                                 }}
                                 onClick={() => setDiffEntry({...diffEntry, output_schema: OUTPUT_JSON_SCHEMA_SAMPLE})}>
                                 <FormattedMessage id="sample" defaultMessage="Sample"/>
                             </Button>
                             <FormControl componentClass="textarea"
                                 value={isObject(localEntry.output_schema)?JSON.stringify(localEntry.output_schema, null, 2):localEntry.output_schema || ""}
                                 rows={5}
                                 placeholder={"ex: " + OUTPUT_JSON_SCHEMA_SAMPLE}
                                 onChange={e => setDiffEntry({...diffEntry, output_schema: e.target.value})} />

                             <HelpBlock>
                             <FormattedMessage id="output-custom-route-schema" defaultMessage="Inform in the custom route doc generation about the structure and the rules of the answer of this endpoint."/>
                             </HelpBlock>
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="err-activity-id" defaultMessage="Error handler" />
                         </Col>

                         <Col sm={9}>
                             <Select
                              className="basic-single"
                              classNamePrefix="select"
                              value={localEntry.err_activity_id && activitiesOptions.find(a => a.value === localEntry.err_activity_id)}
                              isClearable={true}
                              isSearchable={true}
                              name="err-activity"
                              onChange={(value, action) => {
                                  if(["select-option", "clear"].includes(action.action)) {
                                    setDiffEntry({...diffEntry, err_activity_id: value?.value || null});
                                  }
                              }}
                              options={activitiesOptions} />
                         </Col>
                     </FormGroup>

                     <FormGroup>
                         <Col componentClass={ControlLabel} sm={2}>
                             <FormattedMessage id="enabled" defaultMessage="Enabled" />
                         </Col>

                         <Col sm={9}>
                             <Checkbox
                                 checked={localEntry.enabled}
                                 onChange={e => setDiffEntry({...diffEntry, enabled: e.target.checked})}/>
                         </Col>
                     </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="sync" defaultMessage="Sync" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={localEntry.sync}
                                onChange={e => setDiffEntry({...diffEntry, sync: e.target.checked})}/>

                            <HelpBlock>
                                <FormattedMessage id="custom-route-sync" defaultMessage="When set, the call to this API is synchronous and the response is returned directly. Otherwise, only an instance id is returned and the associated job is spawned asynchronously."/>
                            </HelpBlock>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="public" defaultMessage="Public" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={localEntry.public}
                                onChange={e => setDiffEntry({...diffEntry, public: e.target.checked})}/>

                            <HelpBlock>
                                <FormattedMessage id="custom-route-public" defaultMessage="Whether the route is public or not. (when public the route is exposed as /api/v0x/public/... and require no authentication at all)"/>
                            </HelpBlock>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="support-bulk" defaultMessage="Support bulk" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                               checked={localEntry.support_bulk}
                               onChange={e => setDiffEntry({...diffEntry, support_bulk: e.target.checked})}/>

                            <HelpBlock>
                               <FormattedMessage id="custom-route-support-bulk" defaultMessage="When set, the API will serve additionally a route with '/bulk' append to the custom URL. This endpoint support form-data body with a 'label' and a file content 'input_file' with a CSV structure (1 line per requests to be created)"/>
                            </HelpBlock>
                        </Col>
                   </FormGroup>

                    <FormGroup validationState={validOptions}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="bulk-options" defaultMessage="Bulk options (optional)" />
                        </Col>

                        <Col sm={9}>
                            <Button
                                bsSize="small"
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                    top: "5px",
                                }}
                                onClick={() => setDiffEntry({...diffEntry, bulk_options: JSON_TRANS_OPTIONS_SAMPLE})}>
                                <FormattedMessage id="sample" defaultMessage="Sample"/>
                            </Button>
                            <FormControl
                                componentClass="textarea"
                                value={localEntry.bulk_options || ""}
                                rows={5}
                                placeholder={"ex: " + JSON_TRANS_OPTIONS_SAMPLE}
                                onChange={e =>
                                    setDiffEntry({...diffEntry, bulk_options: e.target.value})
                                } />
                            <HelpBlock>
                                <FormattedMessage
                                    id="bulk-action-options"
                                    defaultMessage="This is used to configure the transformation of the CSV record into JSON. (See {ref_link} for more information)"
                                    values={{ref_link: <a href="https://github.com/rockwelln/csv2json" target="_blank" rel="noopener noreferrer">csv2json</a>}}
                                />
                            </HelpBlock>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <ButtonToolbar>
                                <Button onClick={() => updateCustomRoute(entry.route_id, diffEntry, () => onHide(true))} bsStyle="primary" disabled={!validUpdateRouteForm}>
                                    <FormattedMessage id="save" defaultMessage="Save" />
                                </Button>
                                <Button onClick={() => onHide(false)}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                </Button>
                            </ButtonToolbar>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  })
}

function ImportCustomRouteModal({show, onHide}) {
  const [errors, setErrors] = useState([]);
  const [loaded, setLoaded] = useState([]);
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
  } = useDropzone({accept: 'application/json'});
  const [options, setOptions] = useState({activateNewVersion: true});

  useEffect(() => {
    if(!show) {
      setErrors([]);
      setLoaded([]);
      setOptions({activateNewVersion: true});
    }
  }, [show])

  const acceptedFileItems = acceptedFiles.map((file, i) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
      <ul style={{color: "green"}}>
      {
        loaded.includes(i) && <li>Loaded</li>
      }
      </ul>
      <ul style={{color: "red"}}>
      {
        errors.filter(e => e.id === i).map(e => <li color={"red"}>{e.error}</li>)
      }
      </ul>
    </li>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
      <ul>
        {errors.map(e => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  return (
    <Modal show={show} onHide={() => onHide(true)} backdrop={false} bsSize="large">
      <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage id="import" defaultMessage="Import"/>
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
            <Col componentClass={ControlLabel} sm={2}>
              Rejected
            </Col>
            <Col sm={9}>
              <ul style={{color: "red"}}>{fileRejectionItems}</ul>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Files
            </Col>
            <Col sm={9}>
              <ul>{acceptedFileItems}</ul>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Merging options
            </Col>
            <Col sm={9}>
              <Checkbox
                checked={options.replaceWorkingVersion}
                onChange={e => setOptions({...options, replaceWorkingVersion: e.target.checked})}>
                <FormattedMessage
                  id="replace-working-version"
                  defaultMessage='Replace working versions'/>
              </Checkbox>
              <HelpBlock>
                Replace the working version in-place.
                Otherwise if no matching definition is found, the import is rejected
              </HelpBlock>

              <Checkbox
                disabled={!options.replaceWorkingVersion}
                checked={options.commitCurrentWorkingVersion}
                onChange={e => setOptions({...options, commitCurrentWorkingVersion: e.target.checked})}>
                <FormattedMessage
                  id="commit-current-working-version"
                  defaultMessage='Commit current working version'/>
                <FormControl
                  disabled={!options.commitCurrentWorkingVersion}
                  componentClass="input"
                  value={options.commitCurrentWorkingVersionLabel || ""}
                  onChange={e => setOptions({...options, commitCurrentWorkingVersionLabel: e.target.value})}
                  placeholder="commit label" />
              </Checkbox>
              <HelpBlock>
                Save the current working version in a commit.
                (The saved version remain activated)
              </HelpBlock>

              <Checkbox
                checked={options.activateNewVersion}
                onChange={e => setOptions({...options, activateNewVersion: e.target.checked})}>
                <FormattedMessage
                  id="activate-new-version"
                  defaultMessage='Activate new version'/>
              </Checkbox>
              <HelpBlock>
                Activate the new working version if not yet active.
              </HelpBlock>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col smOffset={2} sm={10}>
              <ButtonToolbar>
                <Button
                  type="submit"
                  bsStyle="primary"
                  onClick={e => {
                    e.preventDefault();
                    setErrors([]);
                    setLoaded([]);

                    importRoutes(
                      acceptedFiles,
                      options,
                      i => setLoaded(l => [...l, i]),
                      (i, e) => setErrors(es => [...es, {id: i, error: e.message}]),
                    )
                  }} >
                  Save
                </Button>
              </ButtonToolbar>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

async function importRoutes(inputFiles, options, onSuccess, onError) {
  for(let i = 0; i <inputFiles.length; i++) {
    const inputFile = inputFiles[i];

    try {
      const c = await readFile(inputFile);
      await importCustomRoute(JSON.parse(c), options, () => onSuccess(i))
    } catch(e) {
      console.error("failed to import route", e)
      onError && onError(i, e)
    }
  }
}

function UpdatePublicConfirmCheckbox({ checked, onConfirm, resourceName, ...props_ }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Checkbox
        checked={checked}
        onChange={e => e.preventDefault()}
        onClick={e => {
            e.preventDefault();
            setShow(true);
        }} {...props_} />

      <Modal show={show} onHide={() => setShow(false)} >
        <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage
                  id="confirm-update"
                  defaultMessage="Are you sure?" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert bsStyle="danger">
             <FormattedMessage
                 id="public-update"
                 defaultMessage="Update public flag..."/>
             <br/>
             <FormattedMessage
                 id="update-public-warning-suite"
                 defaultMessage={`When public, there is no more authentication required to access it`}/>
          </Alert>
          <p>
             <FormattedMessage
                 id="update-public-warning"
                 defaultMessage={`You are about to change the visibility of the endpoint ${resourceName} !`}/>
          </p>
          <Form>
            <Button bsStyle="primary" onClick={e => { onConfirm(!checked); setShow(false); }} autoFocus>
              Update
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}

function UpdateSyncConfirmCheckbox({ checked, onConfirm, resourceName, ...props_ }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Checkbox
        checked={checked}
        onChange={e => e.preventDefault()}
        onClick={e => {
            e.preventDefault();
            setShow(true);
        }} {...props_} />

      <Modal show={show} onHide={() => setShow(false)} >
        <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage
                  id="confirm-update"
                  defaultMessage="Are you sure?" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert bsStyle="info">
             <FormattedMessage
                 id="sync-update"
                 defaultMessage="Update sync flag..."/>
          </Alert>
          <p>
             <FormattedMessage
                 id="update-sync-warning"
                 defaultMessage={`You are about to change the output of the endpoint ${resourceName} !`}/>
          </p>
          <Form>
            <Button bsStyle="primary" onClick={e => { onConfirm(!checked); setShow(false); }} autoFocus>
              Update
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}


function RenameGroupModal({show, onHide, group}) {
  const [name, setName] = useState(group);
  return (
    <Modal show={show} onHide={() => onHide(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage
              id="rename-group"
              defaultMessage="Rename group" /> {group}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={e => {e.preventDefault(); updateGroupName(group, name, () => onHide(true));}}>
          <FormGroup>
            <Col smOffset={2} sm={9}>
                <FormControl
                  componentClass="input"
                  value={name}
                  placeholder="new name"
                  onChange={e => setName(e.target.value)}/>
            </Col>
          </FormGroup>
          <Button bsStyle="primary" type="submit" disabled={!name}>
            Update
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  )
}


function DeleteRoutes({show, routes, onHide}) {
  const [deleteActivities, setDeleteActivities] = useState(false);

  useEffect(() => setDeleteActivities(false), [show]);

  const onSubmit = async () => {
    for(const route of routes) {
      // deleted in sequence to avoid loop on removing activities and routes
      // eslint-disable-next-line no-await-in-loop
      await deleteCustomRoute(
        route.route_id,
        async () => {
          if (deleteActivities && route.activity_id) {
            await deleteActivity(route.activity_id)
          }
        },
      )
    }

    onHide(true);
  }

  return (
    <Modal show={show} onHide={() => onHide(false)}>
      <Modal.Header closeButton>
          <Modal.Title>Confirm delete of {routes.length} routes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => {e.preventDefault(); Promise.resolve(onSubmit())}} horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                Selected routes
              </Col>
              <Col sm={9}>
                <ul>
                {
                  routes.sort((a, b) => a.route_id - b.route_id).map(r =>
                    <li key={r.route_id}>
                      {r.method.toUpperCase()}{" "}{r.route}
                    </li>
                  )
                }
                </ul>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                Options
              </Col>
              <Col sm={9}>
                <Checkbox
                  checked={deleteActivities}
                  onChange={e => setDeleteActivities(e.target.checked)}>
                  <FormattedMessage
                    id="delete-activities-and-versions"
                    defaultMessage='Delete associated activities and their versions' />
                </Checkbox>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col sm={9}>
                <Button type="submit" bsStyle="danger" autoFocus>
                  Delete
                </Button>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
    </Modal>
  )
}

function DeleteConfirmButton({ resourceName, activity, onConfirm }) {
  const [show, setShow] = useState(false);
  const [deleteActivity, setDeleteActivity] = useState(false);

  return (
    <>
      <Button
        bsStyle="danger"
        onClick={() => setShow(true)} >
        <FontAwesomeIcon icon={faTimes} />
      </Button>
      <Modal show={show} onHide={() => setShow(false)} >
        <Modal.Header closeButton>
          <Modal.Title>Confirm delete { (resourceName ? `of ${resourceName}` : "") }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => {e.preventDefault(); onConfirm(deleteActivity); setShow(false);}}>
            {activity &&
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                Options
              </Col>
              <Col sm={9}>
                <Checkbox
                  checked={deleteActivity}
                  onChange={e => setDeleteActivity(e.target.checked)}>
                  <FormattedMessage
                    id="delete-activity"
                    defaultMessage='Delete activity "{activity}" and its versions'
                    values={{activity: activity}}/>
                </Checkbox>
              </Col>
            </FormGroup>
            }
            <FormGroup>
              <Button type="submit" bsStyle="danger" autoFocus>
                Delete
              </Button>
            </FormGroup>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}


function CustomRoutesGroup({routes, group, activities, groups, onChange, onSelect}) {
  const [showUpdateModal, setShowUpdateModal] = useState(undefined);
  const [showRename, setShowRename] = useState(false);
  const [showNewActivity, setShowNewActivity] = useState(undefined);
  const [loadedRoutes, setLoadedRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const activitiesOptions = activities
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(a => ({value: a.id, label: `${a.name} (${!a.version_label?WORKING_VERSION_LABEL:a.version_label})`}));
  
  useEffect(() => {
    setLoadingRoutes(r => r && true);
    setTimeout(() => {
      setLoadedRoutes(routes);
      setLoadingRoutes(false);
    }, 0);
  }, [routes]);
  return (
    <Panel style={{ minWidth: "min-content" }}>
      <Panel.Heading>
          <Panel.Title>
            {group || <FormattedMessage id="custom-routes" defaultMessage="Custom routes" />}
            {' '}
            {group &&
            <Button bsSize={"small"} bsStyle={"primary"} title={"rename"} onClick={() => setShowRename(true)}>
              <FontAwesomeIcon icon={faEdit}/>
            </Button>
            }
            {' '}
            {group &&
            <SplitButton
              id={"group-export-routes"}
              bsStyle="primary"
              bsSize="small"
              title={<FontAwesomeIcon icon={faDownload}/>}
              onClick={() =>
                AuthServiceManager.getValidToken()
                  .then(token => window.location = `${API_URL_PREFIX}/api/v01/custom_routes/groups/${group}/export?auth_token=${token}`)
              }>
              <MenuItem
                id={"group-export-routes-compatible-version"}
                onClick={() =>
                  AuthServiceManager.getValidToken()
                    .then(token => window.location = `${API_URL_PREFIX}/api/v01/custom_routes/groups/${group}/export?compat=1&auth_token=${token}`)
                }>
                <FormattedMessage
                  id="compatible"
                  defaultMessage="Compatible version (<0.18)" />
              </MenuItem>
            </SplitButton>
            }
          </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <Table
          onDrop={e => {
            e.preventDefault()
            const data = JSON.parse(e.dataTransfer.getData("custom-route"));
            console.log("drop", group, data.route_id)
            updateCustomRoute(data.route_id, {"group": group}, () => onChange());
          }}
        >
          <thead>
            <tr>
                <th/>
                <th style={{ width: "5em" }}><FormattedMessage id="method" defaultMessage="Method" /></th>
                <th><FormattedMessage id="route" defaultMessage="Route (prefix: {prefix})" values={{prefix: CUSTOM_ROUTE_PREFIX}} /></th>
                <th style={{ minWidth: "22em" }}><FormattedMessage id="activity" defaultMessage="Activity" /></th>
                <th style={{ width: "2em" }}><FormattedMessage id="enabled" defaultMessage="Enabled" /></th>
                <th style={{ width: "2em" }}><FormattedMessage id="sync" defaultMessage="Sync" /></th>
                <th style={{ width: "2em" }}><FormattedMessage id="public" defaultMessage="Public" /></th>
                <th style={{ minWidth: "15em" }}/>
            </tr>
          </thead>
          <tbody>
          {loadingRoutes &&
            <>
              <tr>
                <td colSpan={8}>
                  <div className="loading-animated">
                    <div className="background-masker btn-divide-left"></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={8}>
                  <div className="loading-animated">
                    <div className="background-masker btn-divide-left"></div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={8}>
                  <div className="loading-animated">
                    <div className="background-masker btn-divide-left"></div>
                  </div>
                </td>
              </tr>
            </>
          }
          {
            loadedRoutes.map((route, i) => (
              <tr key={i} style={{ backgroundColor: route.public ? '#B0FDACFF' : '#ffffffff' }}>
                <td
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("custom-route", JSON.stringify(route));
                  }}>
                  <Checkbox onClick={e => onSelect(route, e.target.checked)}/>
                </td>
                <td style={{verticalAlign: "middle"}}>{ route.method.toUpperCase() }</td>
                <td style={{overflowWrap: "anywhere", verticalAlign: "middle"}}>{ route.route }</td>
                <td>
                  <InputGroup>
                      <Select
                          className="basic-single"
                          classNamePrefix="select"
                          value={route.activity_id && activitiesOptions.find(a => a.value === route.activity_id)}
                          isClearable={true}
                          isSearchable={true}
                          name="activity"
                          onChange={(value, action) => {
                              if(["select-option", "clear"].includes(action.action)) {
                                updateCustomRouteActivity(route.route_id, value && value.value, () => onChange());
                              }
                          }}
                          options={activitiesOptions} />
                      <InputGroup.Button>
                        { route.activity_id !== null ?
                          <Button
                            bsStyle="primary"
                            onClick={() => {
                              let win = window.open(`/transactions/config/activities/editor/${route.activity_id}`, '_blank');
                              win.focus();
                            }}
                            style={{marginLeft: '5px'}}
                          >
                            <Glyphicon glyph="eye-open"/>
                          </Button> :
                          <Button
                            bsStyle="primary"
                            onClick={() => setShowNewActivity(route.route_id)}
                            style={{marginLeft: '5px'}}
                          >
                            <Glyphicon glyph="file"/>
                          </Button>
                        }
                      </InputGroup.Button>
                  </InputGroup>
                </td>
                <td>
                  <Checkbox
                    checked={route.enabled}
                    onChange={e => e.preventDefault()}
                    onClick={e => {
                        e.preventDefault();
                        updateCustomRouteEnabled(route.route_id, e.target.checked, () => onChange());
                    }} />
                </td>
                <td>
                  <UpdateSyncConfirmCheckbox
                    resourceName={route.route}
                    checked={route.sync}
                    onConfirm={checked => updateCustomRouteSync(route.route_id, checked, () => onChange())} />
                </td>
                <td>
                  <UpdatePublicConfirmCheckbox
                    resourceName={route.route}
                    checked={route.public}
                    onConfirm={checked => updateCustomRoutePublic(route.route_id, checked, () => onChange())} />
                </td>
                <td>
                  <ButtonToolbar>
                    <Button
                      onClick={() => setShowUpdateModal(Object.assign({}, route))}
                      bsStyle="primary"
                      style={{marginLeft: '5px', marginRight: '5px'}} >
                      <Glyphicon glyph="pencil"/>
                    </Button>
                    <DeleteConfirmButton
                      resourceName={`${route.method} ${route.route}`}
                      activity={activities.find(a => a.id === route.activity_id)?.name}
                      // style={{marginLeft: '5px', marginRight: '5px'}}
                      onConfirm={activity => deleteCustomRoute(
                        route.route_id,
                        () => {
                          if(activity) {
                            deleteActivity(route.activity_id)
                          }
                          onChange()
                        },
                      )} />
                    <SplitButton
                      id={"export-route"}
                      bsStyle="primary"
                      title={<FontAwesomeIcon icon={faDownload}/>}
                      onClick={() => {
                        AuthServiceManager.getValidToken().then(token => {
                            window.location=`${API_URL_PREFIX}/api/v01/custom_routes/${route.route_id}/export?auth_token=${token}`
                          })
                      }}>
                      <MenuItem
                        id={"export-route-compatible-version"}
                        onClick={() =>
                          AuthServiceManager.getValidToken()
                            .then(token => window.location = `${API_URL_PREFIX}/api/v01/custom_routes/${route.route_id}/export?compat=1&auth_token=${token}`)
                        }>
                        <FormattedMessage
                          id="compatible"
                          defaultMessage="Compatible version" />
                      </MenuItem>
                    </SplitButton>
                  </ButtonToolbar>
                </td>
              </tr>
            ))
          }
          </tbody>
        </Table>
        <NewActivity
          show={showNewActivity !== undefined}
          onClose={() => {setShowNewActivity(undefined);}}
          onCreated={id => {
            updateCustomRouteActivity(showNewActivity, id, () => onChange());
          }} />
        <UpdateCustomRouteModal
          show={showUpdateModal !== undefined}
          entry={showUpdateModal || {}}
          groups={groups}
          activities={activities}
          onHide={c => {
              setShowUpdateModal(undefined);
              c && onChange();
          }} />
        <RenameGroupModal
          show={showRename}
          group={group}
          onHide={r => {
            setShowRename(false);
            r && onChange();
          }} />
      </Panel.Body>
    </Panel>
  )
}

function CustomRoutes() {
  const [activities, setActivities] = useState([]);
  const [customRoutes, setCustomRoutes] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [key, setKey] = useState(0);
  const [filter, setFilter] = useState("");

  const refresh_ = useCallback(() => {
    setLoading(true);
    fetchActivities(setActivities);
    fetchCustomRoutes(r => {
      setCustomRoutes(r)
      setLoading(false)
      setSelected([])
    });
  }, []);

  useEffect(() => refresh_(), []);

  const allGroups = customRoutes.reduce((o, r) => {
    if(!o.includes(r["group"])) {
      o.push(r["group"]);
    }
    return o;
  }, []).sort((a, b) => a && b ? a.localeCompare(b): 0);

  const routePerGroups = customRoutes
    .sort((a, b) => a.route_id - b.route_id)
    .filter(r => !filter || r.route.includes(filter) || ((activities.find(a => a.id === r.activity_id) || {}).name || "").includes(filter))
    .reduce((o, r) => {
      (o[r["group"] || ""] = o[r["group"] || ""] || []).push(r);
      return o;
    }, {});

  return (
    <>
      {
        loading &&
          <Panel>
            <Panel.Body>
              <FontAwesomeIcon icon={faSpinner} aria-hidden="true" style={{'fontSize': '24px'}} spin />
            </Panel.Body>
          </Panel>
      }

      <Panel>
        <Panel.Body>
          <Row>
            <Col sm={6}>
              <ButtonToolbar>
                  <Button bsStyle="primary" onClick={() => setShowNew(true)}>
                      <FormattedMessage id="new-route" defaultMessage="New route" />
                  </Button>
                  <Button bsStyle="primary" onClick={() => setShowImport(true)}>
                      <FormattedMessage id="import" defaultMessage="Import" />
                  </Button>
                  <Button bsStyle="danger" onClick={() => setShowDelete(true)} disabled={selected.length === 0}>
                    <FormattedMessage id="delete" defaultMessage="Delete" />
                  </Button>
              </ButtonToolbar>
            </Col>
            <Col sm={6}>
              <SearchBar filter={filter} onChange={setFilter} size={8} />
            </Col>
          </Row>
        </Panel.Body>
      </Panel>

      {
        !loading && Object.entries(routePerGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([group, routes]) =>
          <CustomRoutesGroup
            key={`activity-group-${group}`}
            activities={activities}
            onChange={() => fetchCustomRoutes(setCustomRoutes)}
            routes={routes}
            group={group}
            groups={allGroups}
            onSelect={(r, checked) => {
              checked ? setSelected(s => [...s, r]) :
                setSelected(s => s.filter(ro => ro.route_id !== r.route_id))
            }}
            />
        )
      }

      <NewCustomRoute
          show={showNew}
          groups={allGroups}
          activities={activities}
          onHide={c => {
              setShowNew(false);
              c && refresh_();
          }} />

      <ImportCustomRouteModal
          show={showImport}
          key={key}
          onHide={c => {
              setKey(k => k+1);
              setShowImport(false);
              if(c) {
                refresh_();
              }
          }} />

      <DeleteRoutes
          routes={selected}
          show={showDelete}
          onHide={c => {
              setShowDelete(false);
              c && refresh_();
          }} />
    </>
  )
}

export function StartupEvents() {
  useEffect(() => {document.title = "Startup events"}, []);
  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="startup-events" defaultMessage="Startup events"/></Breadcrumb.Item>
      </Breadcrumb>
      <DedicatedEvents/>
      <CustomRoutes/>
    </div>
  )
}
