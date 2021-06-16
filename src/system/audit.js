import React, {useState} from 'react';
import {fetch_get} from "../utils";
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import {Search, StaticControl} from "../utils/common";

import {FormattedMessage} from 'react-intl';

import update from "immutability-helper/index";
import {ApioDatatable} from "../utils/datatable";

const audit_target_types = [
    "User",
    "Gateway",
    "Configuration",
    "Activity",
    "Startup Event",
    "Transaction",
    "Instance",
    "MVNO number",
    "Operator",
    "Porting number",
    "Request",
    "Holiday",
    "Range",
    "Routing info",
    "Report",
    "callback",
    "custom_route",
    "webhook",
    "webhook_event",
    "user profile",
    "template",
    "documents",
    "logs",
];


function AuditActions(props) {
    const {entry} = props;
    const [showDetails, setShowDetails] = useState(false);
    const onClose = () => setShowDetails(false);

    return (
        <div>
            <Button onClick={() => setShowDetails(true)} bsStyle="info">
                <Glyphicon glyph="search"/>
            </Button>
            {
                showDetails && (
                    <Modal
                        show={showDetails}
                        onHide={onClose}
                        backdrop={false}>
                        <Modal.Header closeButton>
                            <Modal.Title><FormattedMessage id="details" defaultMessage="Details" /></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form horizontal>
                                <StaticControl label={<FormattedMessage id='user' defaultMessage='User'/>} value={entry.user}/>
                                <StaticControl label={<FormattedMessage id='summary' defaultMessage='Summary'/>} value={entry.summary}/>
                                <StaticControl label={<FormattedMessage id='operation' defaultMessage='Operation'/>} value={entry.operation}/>
                                <StaticControl label={<FormattedMessage id='target' defaultMessage='Target'/>} value={entry.target}/>
                                <StaticControl label={<FormattedMessage id='target-type' defaultMessage='Target type'/>} value={entry.target_type}/>
                                <StaticControl label={<FormattedMessage id='channel' defaultMessage='Channel'/>} value={entry.channel}/>
                                <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={entry.when}/>
                                <StaticControl label={<FormattedMessage id='extra' defaultMessage='Extra...'/>} value={entry.extra_info}/>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={onClose}><FormattedMessage id="close" defaultMessage="Close" /></Button>
                        </Modal.Footer>
                    </Modal>
                )
            }
        </div>
    );
}

export class AuditLogs extends Search {
    static defaultProps = update(Search.defaultProps, {'$merge': {
        searchUrl: '/api/v01/system/users/audit/search',
        collectionName: 'records',
        defaultCriteria: {
            user_id: {value: '', op: 'eq'},
            when: {value: '', op: 'eq'},
            operation: {value: '', op: 'eq'},
            target: {value: '', op: 'eq'},
            target_type: {value: '', op: 'eq'},
            channel: {value: '', op: 'eq'},
        },
    }});

    componentDidMount() {
        document.title = "Audit logs"
        this._fetchUsers();
        this._refresh();
    }

    _fetchUsers() {
        fetch_get('/api/v01/system/users', this.props.auth_token)
            .then(data => this.setState({users: data.users}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-users-failed" defaultMessage="Failed to fetch users"/>,
                message: error.message,
                level: 'error'
            }));
    }

    render() {
        const {filter_criteria, resources, users, sorting_spec, pagination} = this.state;
        resources && resources.forEach(r => {
            const user = users && users.find(u => u.id === r.user_id);
            r.user = user !== undefined ? user.username : null;
        });
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="users" defaultMessage="Users"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="audit" defaultMessage="Audit"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={false} >
                    <Panel.Heading>
                        <Panel.Title toggle><div><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></div></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body collapsible>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="user" defaultMessage="User" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.user_id.op}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {user_id: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.user_id.value}
                                        onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {user_id: {$merge: {value: parseInt(e.target.value, 10) || e.target.value}}})
                                             })}>
                                        <option value="" />
                                    {
                                        users && users.map(u =>
                                            <option key={u.id} value={u.id}>{u.username}</option>
                                        )
                                    }
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="when" defaultMessage="When" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.when.op}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {when: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                        <option value="gt">&gt;</option>
                                        <option value="ge">&gt;=</option>
                                        <option value="lt">&lt;</option>
                                        <option value="le">&lt;=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>

                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="operation" defaultMessage="Operation" />
                                </Col>
                                <Col sm={1}>
                                    <FormControl componentClass="select"
                                         value={filter_criteria.operation.op}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {operation: {$merge: {op: e.target.value}}})
                                             })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>
                                <Col sm={8}>
                                    <FormControl componentClass="select"
                                         value={filter_criteria.operation.value}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {operation: {$merge: {value: e.target.value}}})
                                             })}>
                                        <option value="" />
                                        <FormattedMessage id="create" defaultMessage="create">
                                            {m => <option value="create">{m}</option> }
                                        </FormattedMessage>
                                        <FormattedMessage id="update" defaultMessage="update">
                                            {m => <option value="update">{m}</option> }
                                        </FormattedMessage>
                                        <FormattedMessage id="delete" defaultMessage="delete">
                                            {m => <option value="delete">{m}</option> }
                                        </FormattedMessage>
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="target" defaultMessage="Target" />
                                </Col>
                                <Col sm={1}>
                                    <FormControl componentClass="select"
                                         value={filter_criteria.target.op}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {target: {$merge: {op: e.target.value}}})
                                             })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                        <option value="is_null">is null</option>
                                    </FormControl>
                                </Col>
                                <Col sm={8}>
                                    <FormControl componentClass="input"
                                         value={filter_criteria.target.value}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {target: {$merge: {value: e.target.value}}})
                                             })} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="target-type" defaultMessage="Target type" />
                                </Col>
                                <Col sm={1}>
                                    <FormControl componentClass="select"
                                         value={filter_criteria.target_type.op}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {target_type: {$merge: {op: e.target.value}}})
                                             })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                        <option value="is_null">is null</option>
                                    </FormControl>
                                </Col>
                                <Col sm={8}>
                                    <FormControl componentClass="select"
                                         value={filter_criteria.target_type.value}
                                         onChange={e => this.setState({
                                             filter_criteria: update(filter_criteria,
                                                 {target_type: {$merge: {value: e.target.value}}})
                                             })} >
                                        <option value=''/>
                                        {
                                            audit_target_types.map(
                                                (t, i) => <option key={i} value={t}>{t}</option>
                                            )
                                        }
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col smOffset={1} sm={1}>
                                    <Button bsStyle="info" onClick={() => this._refresh({page_number: 1})}>
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
                                {title: <FormattedMessage id="user" defaultMessage="User" />, field: 'user', sortable: true},
                                {title: <FormattedMessage id="operation" defaultMessage="Operation" />, field: 'operation', sortable: true},
                                {title: <FormattedMessage id="target" defaultMessage="Target" />, field: 'target', sortable: true},
                                {title: <FormattedMessage id="target-type" defaultMessage="Target type" />, field: 'target_type', sortable: true},
                                {title: <FormattedMessage id="when" defaultMessage="When" />, field: 'when', sortable: true},
                                {title: '', render: n => (
                                    <AuditActions
                                        entry={n}
                                        {...this.props}
                                    />
                                )},
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