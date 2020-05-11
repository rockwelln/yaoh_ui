import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {Redirect} from "react-router";
import draw_editor from "./editor";
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
                                                <Button onClick={() => deleteActivity(a.id, () => fetchActivities(setActivities))} bsStyle="danger"
                                                        style={{marginLeft: '5px', marginRight: '5px'}}>
                                                    <Glyphicon glyph="remove-sign"/>
                                                </Button>
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

export function ActivityEditor(props) {
    const [entities, setEntities] = useState([]);
    const [cells, setCells] = useState([]);
    const [configuration, setConfiguration] = useState({});
    const [currentActivity, setCurrentActivity] = useState(null);
    const [newActivity, setNewActivity] = useState(true);

    useEffect(() => {
        fetchConfiguration(setConfiguration);
        fetchCells(setCells);
        fetchEntities((setEntities));
    }, []);

    const editor = useRef(null);
    const toolbar = useRef(null);
    const title = useRef(null);

    useEffect(() => {
        // (container, handlers, placeholders, props)
        draw_editor(
            ReactDOM.findDOMNode(editor.current),
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
                toolbar: ReactDOM.findDOMNode(toolbar.current),
                title: ReactDOM.findDOMNode(title.current),
            },
            {
                configuration: configuration,
                cells: cells,
                entities: entities,
            }
        )
    }, [editor, toolbar, title, currentActivity, newActivity, cells, entities]);

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
                    <FormControl componentClass="input" placeholder="Name" ref={title}/>
                </Col>
                <Col smOffset={2}>
                    <div ref={toolbar} />
                </Col>
            </Row>
            <hr />
            <Row>
                <Col>
                    <div ref={editor} style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
                </Col>
            </Row>

        </>
    );
}
/*
export  class ActivityEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activities: [],
            configuration: {},
            currentActivity: null,
            newActivity: true,
        };

        this.renderGrid = this.renderGrid.bind(this);
        this.saveActivity = this.saveActivity.bind(this);
        this.deleteActivity = this.deleteActivity.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
    }

    componentDidMount() {
        fetchActivities(a => this.setState({activities: a}));
        fetchConfiguration(c => this.setState({configuration: c}));
    }

    fetchActivity(actId, cb) {
        fetch_get('/api/v01/activities/' + actId, this.props.auth_token)
            .then(data => cb(data.activity))
            .catch(console.error);
    }

    componentDidUpdate() {
        const getData = this.state.currentActivity===null && !this.state.newActivity?null:
        (cb)=> {
            if (this.state.newActivity) {
                cb(JSON.parse(JSON.stringify(NEW_ACTIVITY)));
            } else {
                this.fetchActivity(this.state.currentActivity, cb)
            }
        };
        let onDelete = this.state.newActivity?undefined:() => this.deleteActivity(this.state.currentActivity);
        this.renderGrid(getData, this.saveActivity, onDelete);
    }

    renderGrid(getActivity, onSave, onDelete) {
        if (getActivity === null) return;
        const {configuration} = this.state;

        let node = ReactDOM.findDOMNode(this.refs['editor']);
        let toolbar = ReactDOM.findDOMNode(this.refs['toolbar']);
        let title = ReactDOM.findDOMNode(this.refs['title']);
        // (container, handlers, placeholders, props)
        draw_editor(node, {
            get: getActivity,
            onSave: onSave,
            onDelete: onDelete,
            getCellDefinitions: fetchCells,
            getEntities: fetchEntities,
            }, {
            toolbar: toolbar,
            title: title,
            }, {
            configuration: configuration,
            }
        )
    }

    saveActivity(data, cb) {
        const method = data.id === undefined?fetch_post:fetch_put;

        method(
            `/api/v01/activities${data.id === undefined?'':'/'+data.id}`,
            {
                'name': data.name,
                'definition': data.definition,
            },
            this.props.auth_token
        )
        .then(data_ => {
            cb && cb(data_);
            this.showAlert("Activity saved !");
            fetchActivities(a => this.setState({activities: a}));

            if(data.id === undefined) { // new activity created, we have to fetch again the activity list.
                this.setState({newActivity: false, currentActivity: data_.id});
            }
        })
        .catch(error => {
            console.error(error);
            if(error.response.status === 409) {
                this.showAlert("Duplicate name!")
            } else if(error.response.status === 404 && data.id !== undefined) {
                // we tried to update a resource not found. so we retry to create it instead.
                delete data.id;
                this.saveActivity(data, cb);
            } else {
                this.showAlert(`Impossible to save the activity (${error})`, "danger");
            }
        });
    }

    showAlert(message, type) {
        if(type === undefined) type = "success";
        let node = ReactDOM.findDOMNode(this.refs['alert-editor']);
        node.className = "alert alert-" + type + " editor-fadeOut";
        node.innerHTML = message;

        setTimeout(() => {
            node.className = "";
            node.innerHTML = "";
        }, 2 * 1000);
    }

    deleteActivity(activityId, cb) {
        fetch_delete(`/api/v01/activities/${activityId}`)
            .then(parseJSON)
            .then(data =>{
                if(cb !== undefined) {
                    cb(data);
                }
                setTimeout(() => this.showAlert("Activity deleted successfully"), 1000);
                this.setState({currentActivity: null, newActivity: true});
                fetchActivities(a => this.setState({activities: a}));
            })
            .catch((error) => {
                console.log(error);
                this.showAlert("Impossible to delete the activity (" + error + ")", "danger");
            });
    }

    render() {
        const {activities} = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="activity-editor" defaultMessage="Activity editor"/></Breadcrumb.Item>
                </Breadcrumb>
                <div role="alert" ref="alert-editor" />
                <Row>
                    <Col sm={2}>
                        <FormControl componentClass="input" placeholder="Name" ref="title"/>
                    </Col>
                    <Col smOffset={2}>
                        <div ref="toolbar" />
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col sm={2}>
                        <Nav bsSize="small" bsStyle="pills" stacked>
                            <NavItem onClick={() => this.setState({newActivity: true})}>+ New</NavItem>
                            {
                                activities
                                    .sort((a, b) => {
                                        if(a.name > b.name) return 1;
                                        if(a.name < b.name) return -1;
                                        return 0;
                                    })
                                    .map(a => (
                                        <NavItem key={a.name} onClick={() => this.setState({currentActivity:a.id, newActivity: false})}>
                                            {a.name}
                                        </NavItem>
                                    )
                                )
                            }
                        </Nav>
                    </Col>

                    <Col sm={10}>
                        <div ref="editor" style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
                    </Col>
                </Row>

            </div>
        );
    }
}
*/