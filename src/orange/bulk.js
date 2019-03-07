import React, {Component} from 'react';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Table, {thead, tbody, th, tr} from 'react-bootstrap/lib/Table';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Alert from "react-bootstrap/lib/Alert";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import {FormattedMessage} from "react-intl";
import {fetch_get, fetch_post_raw} from "../utils";
import {SubInstance} from "./requests";


class NewBulk extends Component {
    constructor(props) {
        super(props);
        this.state = {
            label: '',
            source_type: 'csv',
            source: '',
            action: '',
            approvedSource: false,
            actions: [],
        };
        this.cancelLoad = false;
        this.onLoadSource = this.onLoadSource.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this._fetchActions = this._fetchActions.bind(this);
    }

    _fetchActions() {
        fetch_get('/api/v01/bulks/actions', this.props.auth_token)
            .then(d => !this.cancelLoad && this.setState({actions: d.actions}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-actions-failed" defaultMessage="Failed to fetch actions"/>,
                message: error.message,
                level: 'error'
            }))
    }

    componentDidMount() {
        this._fetchActions();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onLoadSource() {
        const {action, source} = this.state;

        let data = new FormData();
        data.append('action', action);
        data.append('input_file', source);

        this.setState({validationError: undefined, loading: true, approvedSource: false});
        fetch_post_raw('/api/v01/bulks/validate', data, this.props.auth_token)
            .then(() => !this.cancelLoad && this.setState({approvedSource: true, loading: false}))
            .catch(error => !this.cancelLoad && this.setState({validationError: error.message, loading: false}));
    }

    onSubmit() {
        const {action, source, label} = this.state;
        const {onChange} = this.props;

        let data = new FormData();
        data.append('label', label);
        data.append('action', action);
        data.append('input_file', source);

        this.setState({loading: true});
        fetch_post_raw('/api/v01/bulks', data, this.props.auth_token)
            .then(() => {
                this.setState({loading: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-new-bulk-success" defaultMessage="New bulk operation started"/>,
                    level: 'success'
                });
                onChange && onChange();
            })
            .catch(error => {
                this.setState({creationError: error.message, loading: false});
            });
    }

    render() {
        const {label, source_type, source, action, approvedSource, actions, validationError, loading} = this.state;

        const validLabel = label && label.length !== 0 ? "success": null;
        const validSource = source && source.length !== 0 ? "success": null;
        const validAction = action && action.length !== 0 ? "success": null;
        const validForm = validLabel === "success" && validSource === "success" && validAction === "success";
        return (
            <Panel defaultExpanded={true}>
                <Panel.Heading>
                    <Panel.Title toggle><FormattedMessage id="new-bulk" defaultMessage="New bulk" /> <Glyphicon glyph="equalizer" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    <Form horizontal>
                        {
                            validationError && <Alert bsStyle="danger">{validationError}</Alert>
                        }
                        <FormGroup validationState={validLabel}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="label" defaultMessage="Label" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={label}
                                    onChange={e => this.setState({label: e.target.value})} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validSource}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="source" defaultMessage="Source" />
                            </Col>

                            <Col sm={1}>
                                <FormControl
                                    componentClass="select"
                                    value={source_type}
                                    onChange={e => this.setState({source_type: e.target.value, approvedSource: false})}>
                                    <option value="csv">csv</option>
                                </FormControl>
                            </Col>

                            <Col sm={8}>
                                <FormControl
                                    componentClass="input"
                                    type="file"
                                    accept={`.${source_type}`}
                                    onChange={e => this.setState({source: e.target.files[0], approvedSource: false})} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validAction}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="action" defaultMessage="Action" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={action}
                                    onChange={e => this.setState({action: e.target.value})}>
                                    <option value="" />
                                    {
                                        Object.keys(actions).map(a => <option value={a} key={a}>{a}</option>)
                                    }
                                </FormControl>

                                { action && (
                                    <HelpBlock style={{color: 'grey'}}>
                                        <FormattedMessage
                                            id="columns-available"
                                            defaultMessage="Columns available (mandatory: *): {cols}"
                                            values={
                                                {cols: (
                                                    Object.keys(actions[action].validation_schema.properties)
                                                        .map(p => actions[action].validation_schema.required.indexOf(p) !== -1?`*${p}*`:p)
                                                        .join(", ")
                                                )}
                                            }/>
                                    </HelpBlock>
                                )}

                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col smOffset={2} sm={9}>
                                <ButtonToolbar>
                                    <Button bsStyle={approvedSource?"default":"primary"} onClick={this.onLoadSource} disabled={!validForm || loading}>
                                        <FormattedMessage id="validate-source" defaultMessage="Validate source" />
                                    </Button>

                                    <Button bsStyle={approvedSource?"primary":"default"} onClick={this.onSubmit} disabled={!approvedSource || loading}>
                                        <FormattedMessage id="launch" defaultMessage="Launch" />
                                    </Button>
                                </ButtonToolbar>
                            </Col>
                        </FormGroup>
                    </Form>
                    {
                        /* RFU to show an extract of the file as it will be processed
                    <Table>
                        <thead>

                        </thead>
                        <tbody>

                        </tbody>
                    </Table>
                        */
                    }
                </Panel.Body>
            </Panel>
        )
    }
}


class BulkEntry extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        };
    }

    render() {
        const {expanded} = this.state;
        const {bulk, auth_token} = this.props;
        const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

        let rows = [
            <tr key={`bulk_head_${bulk.bulk_id}`} onClick={() => this.setState({expanded: !expanded})}>
                <td style={{width: '2%'}}>{bulk.related.length !== 0 && expIco}</td>
                <td>{bulk.bulk_id}</td>
                <td>{bulk.label}</td>
                <td>{bulk.status}</td>
                <td>{bulk.action}</td>
                <td>{bulk.created_on}</td>
            </tr>
        ];

        if(expanded) {
            bulk.related.map(i => rows.push(
                <SubInstance key={`inst_${i.id}`} instance={i} auth_token={auth_token} colOffset={1}/>
            ))
        }
        return rows;
    }
}

const BulkHistory = ({bulks, auth_token}) => (
    <Panel defaultExpanded={false}>
        <Panel.Heading>
            <Panel.Title toggle><FormattedMessage id="history" defaultMessage="History" /> <Glyphicon glyph="cog" /></Panel.Title>
        </Panel.Heading>
        <Panel.Body collapsible>
            <Table>
                <thead>
                    <tr>
                        <th/>
                        <th>#</th>
                        <th><FormattedMessage id="label" defaultMessage="Label"/></th>
                        <th><FormattedMessage id="status" defaultMessage="Status"/></th>
                        <th><FormattedMessage id="workflow" defaultMessage="Workflow"/></th>
                        <th><FormattedMessage id="creation-date" defaultMessage="Creation date"/></th>
                    </tr>
                </thead>
                <tbody>
                {
                    bulks && bulks.sort((a, b) => b.bulk_id - a.bulk_id).map(b => <BulkEntry bulk={b} key={`bulk_${b.bulk_id}`} auth_token={auth_token}/>)
                }
                </tbody>
            </Table>
        </Panel.Body>
    </Panel>
);


export class BulkActions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bulks: []
        };
        this.cancelLoad = false;
        this._fetchHistory = this._fetchHistory.bind(this);
    }

    _fetchHistory() {
        fetch_get('/api/v01/bulks', this.props.auth_token)
            .then(d => !this.cancelLoad && this.setState({bulks: d.bulks}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-bulks-failed" defaultMessage="Failed to fetch bulk operations"/>,
                message: error.message,
                level: 'error'
            }))
    }

    componentDidMount() {
        this._fetchHistory()
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="bulk" defaultMessage="Bulk"/></Breadcrumb.Item>
                </Breadcrumb>

                <NewBulk onChange={this._fetchHistory} {...this.props}/>
                <BulkHistory bulks={this.state.bulks} {...this.props}/>
            </div>
        )
    }
}