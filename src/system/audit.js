import React, {useState} from 'react';
import {fetch_get, NotificationsManager} from "../utils";
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
import moment from "moment";
import DatePicker from "react-datepicker";
import {localUser} from "../utils/user";
import ReactSelect from 'react-select';

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


function AuditActions({entry}) {
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
    static defaultProps = {...Search.defaultProps,
        searchUrl: '/api/v01/system/users/audit/search',
        collectionName: 'records',
        defaultCriteria: {
            username: {value: '', op: 'eq'},
            when: {value: '', op: 'eq'},
            operation: {value: '', op: 'eq'},
            target: {value: '', op: 'eq'},
            target_type: {value: '', op: 'ilike'},
            channel: {value: '', op: 'eq'},
        },
    };

    componentDidMount() {
        document.title = "Audit logs"
        this._fetchUsers();
        this._refresh();
    }

    _fetchUsers() {
        fetch_get('/api/v01/system/users/audit/usernames')
            .then(data => this.setState({usernames: data.usernames}))
            .catch(error => NotificationsManager.error(
              <FormattedMessage id="fetch-users-failed" defaultMessage="Failed to fetch users"/>,
              error.message,
            ));
    }

    render() {
        const {filter_criteria, resources, usernames, sorting_spec, pagination} = this.state;
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
                                        value={filter_criteria.username.op}
                                        onChange={(e) => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {username: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <ReactSelect
                                        isClearable
                                        value={{value: filter_criteria.username.value, label: filter_criteria.username.value}}
                                        options={usernames?.map(u => ({value: u, label: u}))}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {username: {$merge: {value: e?.value}}})
                                        })}/>
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
                                    <DatePicker
                                        className="form-control"
                                        selected={filter_criteria.when.value.length !== 0?localUser.localizeUtcDate(filter_criteria.when.value).toDate():null}
                                        onChange={d => {
                                            this.setState({
                                                filter_criteria: update(
                                                    this.state.filter_criteria,
                                                    {when: {$merge: {value: d? moment.utc(d).format() : ""}}})
                                            })
                                        }}
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={60}/>
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
                                    <ReactSelect
                                        isClearable
                                        value={{value: filter_criteria.operation.value, label: filter_criteria.operation.value}}
                                        options={[
                                            {value: 'create', label: 'create'},
                                            {value: 'update', label: 'update'},
                                            {value: 'delete', label: 'delete'},
                                        ]}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {operation: {$merge: {value: e?.value}}})
                                        })}/>
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
                                        <option value="ilike">==</option>
                                        <option value="ne">!=</option>
                                        <option value="is_null">is null</option>
                                    </FormControl>
                                </Col>
                                <Col sm={8}>
                                    <ReactSelect
                                        isClearable
                                        value={{value: filter_criteria.target_type.value, label: filter_criteria.target_type.value}}
                                        options={audit_target_types.map(t => ({value: t, label: t}))}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {target_type: {$merge: {value: e?.value}}})
                                        })}/>
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
                                {title: <FormattedMessage id="user" defaultMessage="User" />, field: 'username', sortable: true, render: e => e.username},
                                {title: <FormattedMessage id="operation" defaultMessage="Operation" />, field: 'operation', sortable: true},
                                {title: <FormattedMessage id="target" defaultMessage="Target" />, field: 'target', sortable: true},
                                {title: <FormattedMessage id="target-type" defaultMessage="Target type" />, field: 'target_type', sortable: true},
                                {title: <FormattedMessage id="when" defaultMessage="When" />, field: 'when', sortable: true, render: e => e.when && localUser.localizeUtcDate(e.when).format()},
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