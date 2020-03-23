import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import draw_editor from "./editor";
import {parseJSON, fetch_post, fetch_get, fetch_delete, fetch_put} from "../utils";

import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import FormControl from 'react-bootstrap/lib/FormControl';

import GridPic from "./grid.gif";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";


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

function fetchActivities(onSuccess) {
    fetch_get('/api/v01/activities')
        .then(data => onSuccess(data.activities))
        .catch(console.error);
}

function fetchConfiguration(onSuccess) {
    fetch_get('/api/v01/system/configuration')
        .then(data => onSuccess(data.content))
        .catch(console.error);
}

export default class ActivityEditor extends Component {
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
