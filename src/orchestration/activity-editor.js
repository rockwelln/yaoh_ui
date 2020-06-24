import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {Redirect} from "react-router";
import draw_editor, {getDefinition} from "./editor";
import {fetch_post, fetch_get, fetch_delete, fetch_put, NotificationsManager} from "../utils";

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import Table from 'react-bootstrap/lib/Table';
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';

import GridPic from "./grid.gif";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {LinkContainer} from "react-router-bootstrap";
import Panel from "react-bootstrap/lib/Panel";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import update from "immutability-helper";
import InputGroup from "react-bootstrap/lib/InputGroup";
import InputGroupButton from "react-bootstrap/lib/InputGroupButton";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStethoscope, faChartBar } from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import {SimulatorPanel} from "./simulator";


const NEW_ACTIVITY = {
    name: '',
    status: 'ACTIVE',
    definition: {
        cells: {'start': {name: 'start', original_name: 'start', outputs: ['ok'], params: []}},
        entities: [],
        transitions: [],
    },
};

function fetchCells(onSuccess) {
    fetch_get('/api/v01/cells')
        .then(data => onSuccess(data.cells))
        .catch(console.error);
}

function fetchEntities(onSuccess) {
    fetch_get('/api/v01/entities')
        .then(data => onSuccess(data.entities))
        .catch(console.error);
}

export function fetchActivities(onSuccess) {
    fetch_get('/api/v01/activities')
        .then(data => onSuccess(data.activities))
        .catch(console.error);
}

function fetchActivity(activityId, cb) {
    fetch_get('/api/v01/activities/' + activityId)
        .then(data => cb(data.activity))
        .catch(console.error);
}

function deleteActivity(activityId, cb) {
    fetch_delete(`/api/v01/activities/${activityId}`)
        .then(r => r.json())
        .then(data =>{
            cb && cb(data);
            NotificationsManager.success("Activity deleted");
        })
        .catch(error => {
            NotificationsManager.error("Failed to delete activity", error.message);
        });
}

function saveActivity(activity, cb) {
    const method = activity.id === undefined?fetch_post:fetch_put;

    method(
        `/api/v01/activities${activity.id === undefined?'':'/'+activity.id}`,
        {
            'name': activity.name,
            'definition': activity.definition,
        }
    )
    .then(r => r.json())
    .then(data => {
        NotificationsManager.success("Activity saved");
        cb && cb(data);
    })
    .catch(error => {
        NotificationsManager.error("Failed to save activity", error.message);
    });
}

function fetchConfiguration(onSuccess) {
    fetch_get('/api/v01/system/configuration')
        .then(data => onSuccess(data.content))
        .catch(console.error);
}

function fetchActivityStats(id, onSuccess) {
    fetch_get(`/api/v01/activities/${id}/stats`)
        .then(resp => onSuccess(resp))
        .catch(error => {
            NotificationsManager.error("Failed to fetch statistics", error.message);
        });
}

function NewActivity(props) {
    const {show, onClose} = props;
    const [newActivity, setNewActivity] = useState(NEW_ACTIVITY);
    const [redirect, setRedirect] = useState(null);

    return (
        <Modal show={show} onHide={onClose} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="new-activity" defaultMessage="New activity" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="name" defaultMessage="Name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={newActivity.name}
                                onChange={e => setNewActivity(update(newActivity, {$merge: {name: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <ButtonToolbar>
                                <Button
                                    type="submit"
                                    onClick={e => {
                                        e.preventDefault();
                                        saveActivity(newActivity, a => setRedirect(a.id));
                                    }}
                                    disabled={!newActivity.name || newActivity.name.length === 0}
                                    bsStyle="primary">
                                    <FormattedMessage id="create" defaultMessage="Create" />
                                </Button>
                                <Button onClick={onClose}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                </Button>
                            </ButtonToolbar>
                            {
                                redirect && <Redirect to={`/transactions/config/activities/editor/${redirect}`}/>
                            }
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

function SearchBar(props) {
    const {onSearch, size} = props;
    const [filter, setFilter] = useState("");

    return (
        <Form onSubmit={e => {e.preventDefault(); onSearch(filter);}}>
            <Col smOffset={12 - (size || 4)} sm={size || 4}>
                <InputGroup>
                    <FormControl
                        type="text"
                        value={filter}
                        placeholder="search"
                        onChange={e => setFilter(e.target.value)} />
                    <InputGroupButton>
                        <Button type='submit'>
                            <Glyphicon glyph="search" />
                        </Button>
                    </InputGroupButton>
                </InputGroup>
            </Col>
        </Form>
    )
}

export function Activities(props) {
    const [activities, setActivities] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        fetchActivities(setActivities);
    }, []);

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="activity-editor" defaultMessage="Activities"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Body>
                    <SearchBar onSearch={setFilter} />
                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Created on</th>
                                <th/>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            activities
                                .filter(a => filter.length === 0 || a.name.includes(filter))
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(a => (
                                    <tr key={a.id}>
                                        <td>{a.name}</td>
                                        <td>{a.status}</td>
                                        <td>{a.created_on}</td>

                                        <td>
                                            <ButtonToolbar>
                                                <LinkContainer to={`/transactions/config/activities/editor/${a.id}`}>
                                                    <Button bsStyle="primary"
                                                            style={{marginLeft: '5px', marginRight: '5px'}}>
                                                        <Glyphicon glyph="pencil"/>
                                                    </Button>
                                                </LinkContainer>
                                                <DeleteConfirmButton
                                                    resourceName={a.name}
                                                    style={{marginLeft: '5px', marginRight: '5px'}}
                                                    onConfirm={() => deleteActivity(a.id, () => fetchActivities(setActivities))} />
                                            </ButtonToolbar>
                                        </td>
                                    </tr>
                                )
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
                    <NewActivity
                        show={showNew}
                        onClose={() => {setShowNew(false);}}
                         />
                </Panel.Body>
            </Panel>
        </>
    )
}


function ActivityStatsModal(props) {
    const {show, onHide, id} = props;
    const [stats, setStats] = useState({});

    useEffect(() => {
        show && fetchActivityStats(id, setStats);
    }, [show]);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Run statistics</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table>
                    <tbody>
                        <tr>
                            <th>run count</th>
                            <td>{stats.run_count || "-"}</td>
                        </tr>
                        <tr>
                            <th>first run</th>
                            <td>
                                {
                                    stats.first_run ?
                                        <Link to={`/transactions/${stats.first_run.instance_id}`}>
                                            {stats.first_run.instance_id}
                                        </Link> :
                                        "-"
                                }
                            </td>
                            <td>{stats.first_run ? stats.first_run.created_on : "-"}</td>
                        </tr>
                        <tr>
                            <th>last run</th>
                            <td>
                                {
                                    stats.last_run ?
                                        <Link to={`/transactions/${stats.last_run.instance_id}`}>
                                            {stats.last_run.instance_id}
                                        </Link> :
                                        "-"
                                }
                            </td>
                            <td>{stats.last_run ? stats.last_run.created_on : "-"}</td>
                        </tr>
                    </tbody>
                </Table>
                <Table>
                    <thead>
                        <tr>
                            <th>cell</th>
                            <th>min(runtime)</th>
                            <th>max(runtime)</th>
                            <th>avg(runtime)</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        stats.tasks && stats.tasks.sort((a, b) => a.cell_id.localeCompare(b.cell_id) ).map((t, i) => <tr key={i}>
                            <td>{t.cell_id}</td>
                            <td>{t.min_1 ? t.min_1.toFixed(3) : "-"} sec(s)</td>
                            <td>{t.max_1 ? t.max_1.toFixed(3) : "-"} sec(s)</td>
                            <td>{t.avg_1 ? t.avg_1.toFixed(3) : "-"} sec(s)</td>
                        </tr>)
                    }
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    )
}

export function ActivityEditor(props) {
    const [entities, setEntities] = useState([]);
    const [cells, setCells] = useState([]);
    const [configuration, setConfiguration] = useState({});
    const [currentActivity, setCurrentActivity] = useState(null);
    const [newActivity, setNewActivity] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [editor, setEditor] = useState(null);

    useEffect(() => {
        fetchConfiguration(setConfiguration);
        fetchCells(setCells);
        fetchEntities((setEntities));
    }, []);

    const editorRef = useRef(null);
    const toolbarRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        // (container, handlers, placeholders, props)
        const e = draw_editor(
            ReactDOM.findDOMNode(editorRef.current),
            newActivity?NEW_ACTIVITY:currentActivity,
            {
                get: fetchActivity,
                onSave: (activity, onSuccess) => saveActivity(
                    activity,
                    p => {
                        onSuccess(p);
                        activity.id=p.id;
                        setCurrentActivity(activity);
                        setNewActivity(false);
                    }
                ),
                // onDelete: () => deleteActivity(currentActivity.id, () => setNewActivity(true)),
            },
            {
                toolbar: ReactDOM.findDOMNode(toolbarRef.current),
                title: ReactDOM.findDOMNode(titleRef.current),
            },
            {
                configuration: configuration,
                cells: cells,
                entities: entities,
            }
        );
        setEditor(e);
    }, [editorRef, toolbarRef, titleRef, currentActivity, newActivity, cells, entities]);

    useEffect(() => {
        if(props.match.params.activityId) {
            fetchActivity(
                props.match.params.activityId,
                activity => {
                    setCurrentActivity(activity);
                    setNewActivity(false);
                }
            );
        }
    }, [props.match.params.activityId]);

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                <LinkContainer to={`/transactions/config/activities/editor`}>
                    <Breadcrumb.Item><FormattedMessage id="activity-editor" defaultMessage="Activities"/></Breadcrumb.Item>
                </LinkContainer>
                <Breadcrumb.Item active>{(currentActivity && currentActivity.name) || props.match.params.activityId}</Breadcrumb.Item>
            </Breadcrumb>
            <Row>
                <Col sm={2}>
                    <FormControl componentClass="input" placeholder="Name" ref={titleRef}/>
                </Col>
                <Col sm={7}>
                    <div ref={toolbarRef} />
                </Col>
                <Col sm={2}>
                    <Button onClick={() => setShowStats(true)}><FontAwesomeIcon icon={faChartBar} /></Button>
                </Col>
            </Row>
            <hr />
            <Row>
                <Col>
                    <div ref={editorRef} style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
                </Col>
            </Row>
            <hr />
            <Row>
                <Col>
                    <SimulatorPanel activity={() => {
                        let a = getDefinition(editor, ReactDOM.findDOMNode(titleRef.current).value).activity;
                        Object.keys(a.definition.cells).map(c => delete a.definition.cells[c].name);
                        return a;
                    }} />
                </Col>
            </Row>
            <ActivityStatsModal
                show={showStats}
                onHide={() => setShowStats(false)}
                id={props.match.params.activityId} />
        </>
    );
}
