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
import Badge from "react-bootstrap/lib/Badge";

import {FormattedMessage} from "react-intl";
import {fetch_get, fetch_post_raw, NotificationsManager} from "../utils";
import update from "immutability-helper";


class NewBulk extends Component {
    state = {
        bulk: NewBulk.emptyBulk(),
        source: undefined,
        actions: [],
        loading: false,
        approvedSource: false
    };

    static emptyBulk() {
        return {
            label: '',
            source_type: 'csv',
            source: '',
            action: ''
        }
    }

    fetchActions() {
        fetch_get('/api/v01/bulks/actions')
            .then(d => !this.cancelLoad && this.setState({actions: d.actions}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-actions-failed" defaultMessage="Failed to fetch actions"/>,
                error.message
            ))
    }

    componentDidMount() {
        this.fetchActions();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onLoadSource() {
        const {bulk} = this.state;

        let data = new FormData();
        data.append('action', bulk.action);
        data.append('input_file', bulk.source);

        this.setState({creationError: undefined, validationError: undefined, loading: true, approvedSource: false});
        fetch_post_raw('/api/v01/bulks/validate', data)
            .then(() => !this.cancelLoad && this.setState({approvedSource: true, loading: false}))
            .catch(error => !this.cancelLoad && this.setState({validationError: error.message, loading: false}));
    }

    onSubmit() {
        const {bulk} = this.state;
        const {onChange} = this.props;

        let data = new FormData();
        data.append('label', bulk.label);
        data.append('action', bulk.action);
        data.append('input_file', bulk.source);

        this.setState({creationError: undefined, loading: true});
        fetch_post_raw('/api/v01/bulks', data, this.props.auth_token)
            .then(() => {
                this.setState({loading: false});
                NotificationsManager.success(
                    <FormattedMessage id="fetch-new-bulk-success" defaultMessage="New bulk operation started"/>,
                );
                onChange && onChange();
            })
            .catch(error => {
                this.setState({creationError: error.message, loading: false});
            });
    }

    render() {
        const {bulk, approvedSource, actions, validationError, creationError, loading} = this.state;
        const action_obj = actions && bulk.action && actions.find(a => a.id === bulk.action);

        const validLabel = bulk && bulk.label && bulk.label.length !== 0 ? "success": null;
        const validSource = bulk.source && bulk.source.length !== 0 ? "success": null;
        const validAction = bulk.action ? "success": null;
        const validForm = validLabel === "success" && validSource === "success" && validAction === "success";
        return (
            <Panel defaultExpanded={true}>
                <Panel.Heading>
                    <Panel.Title toggle>
                        <FormattedMessage id="new-bulk" defaultMessage="New bulk" /> <Glyphicon glyph="equalizer" />
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    <Form horizontal>
                        {
                            validationError && <Alert bsStyle="danger">{validationError}</Alert>
                        }
                        {
                            creationError && <Alert bsStyle="danger">{creationError}</Alert>
                        }
                        <FormGroup validationState={validLabel}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="label" defaultMessage="Label" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={bulk.label}
                                    onChange={e => this.setState({bulk: update(bulk, {$merge: {label: e.target.value}})})} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validSource}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="source" defaultMessage="Source" />
                            </Col>

                            <Col sm={1}>
                                <FormControl
                                    componentClass="select"
                                    value={bulk.source_type}
                                    onChange={e => this.setState({bulk: update(bulk, {$merge: {source_type: e.target.value}})})} >
                                    <option value="csv">csv</option>
                                </FormControl>
                            </Col>

                            <Col sm={8}>
                                <FormControl
                                    componentClass="input"
                                    type="file"
                                    accept={`.${bulk.source_type}`}
                                    onChange={e => this.setState({bulk: update(bulk, {$merge: {source: e.target.files[0]}}), approvedSource: false})} />

                                {
                                    bulk.source_type === "csv" &&
                                        <HelpBlock style={{color: 'grey'}}>
                                            <FormattedMessage
                                                id="csv-format"
                                                defaultMessage="The file has to contains the headers and the delimiter has to be a semicolon (;)." />
                                        </HelpBlock>
                                }
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validAction}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="action" defaultMessage="Action" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={bulk.action}
                                    onChange={e => this.setState({bulk: update(bulk, {$merge: {action: e.target.value ? parseInt(e.target.value) : null}})})}>
                                    <option value="" />
                                    {
                                        actions.sort((a, b) => {
                                            if(a.name > b.name) return 1;
                                            if(a.name < b.name) return -1;
                                            return 0;
                                        }).map(a => <option value={a.id} key={a.id}>{a.name}</option>)
                                    }
                                </FormControl>

                                { action_obj && action_obj.validation_schema && (
                                    <HelpBlock style={{color: 'grey'}}>
                                        <FormattedMessage
                                            id="columns-available"
                                            defaultMessage="Columns available (mandatory: *): {cols}"
                                            values={
                                                {cols: (
                                                    action_obj.validation_schema.properties
                                                        .map(p => action_obj.validation_schema.required.indexOf(p) !== -1?`*${p}*`:p)
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
                                    <Button
                                        bsStyle={approvedSource?"default":"primary"}
                                        onClick={this.onLoadSource.bind(this)}
                                        disabled={!validForm || loading} >
                                        <FormattedMessage id="validate-source" defaultMessage="Validate source" />
                                    </Button>

                                    <Button
                                        bsStyle={approvedSource?"primary":"default"}
                                        onClick={this.onSubmit.bind(this)}
                                        disabled={!approvedSource || loading} >
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

class InstanceDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            request: {},
        };
        this.cancelLoad = false;
        this.computeLabel = this.computeLabel.bind(this);
        this.refreshRequest = this.refreshRequest.bind(this);
    }

    componentDidMount() {
        this.refreshRequest();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    refreshRequest() {
        const {instance, auth_token} = this.props;

        fetch_get(`/api/v01/apio/requests/${instance.original_request_id}`, auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                setTimeout(this.refreshRequest, 30 * 1000);
                this.setState({request: data.request});
            })
            .catch(error => {
                if(this.cancelLoad) return;
                setTimeout(this.refreshRequest, 30 * 1000);
                this.setState({error: error});
            });
    }

    computeLabel() {
        const {instance} = this.props;
        const {request} = this.state;
        const entity = request.entities && request.entities[0];

        if(!entity) {
            return instance.id;
        }

        let label = entity.tenant_id;
        if (entity.site_id) {
            label += ' - ' + entity.site_id;
        }
        if (entity.numbers) {
            label += ' - ' + entity.numbers;
        }
        return label;
    }

    render() {
        const {instance, tasks, colOffset} = this.props;
        const {request} = this.state;
        let statusColor = '';
        let statusGlyph = '';
        switch(request.status) {
            case "ERROR":
                statusColor = '#ca6f7b';
                statusGlyph = 'remove';
                break;
            case "SUCCESS":
                statusColor = '#a4d1a2';
                statusGlyph = 'ok';
                break;
            default:
                statusColor = '#a4d1a2';
                statusGlyph = 'play';
        }
        const callback_task = tasks && tasks.find(t => t.id === instance.callback_task_id);

        return (
            <tr key={`message_sub_flow_sync_${instance.id}`}>
                {
                    colOffset && <td colSpan={colOffset}/>
                }
                <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={statusGlyph}/></td>
                <td>
                    <a href={`/transactions/${instance.id}`} target="_blank" rel="noopener noreferrer">{this.computeLabel()}</a>{' '}
                    {
                        instance.errors !== 0 && <Badge style={{backgroundColor: '#ff0808'}}>{instance.errors}{' '}<FormattedMessage id="errors" defaultMessage="error(s)"/></Badge>
                    }
                </td>
                <td style={{width: '30%'}} />
                <td style={{width: '15%'}}>
                    {
                        callback_task && <Badge>{callback_task.cell_id}</Badge>
                    }
                </td>
            </tr>
        )
    }
}


const BulkResult = ({result, colOffset}) => {
    let statusColor = '';
    let statusGlyph = '';
    switch(result.status) {
        case "fail":
            statusColor = '#ca6f7b';
            statusGlyph = 'remove';
            break;
        case "ok":
            if (result.instance && result.instance.status) {
                switch(result.instance.status) {
                    case "ERROR":
                        statusColor = '#ca6f7b';
                        statusGlyph = 'remove';
                        break;
                    case "SUCCESS":
                        statusColor = '#a4d1a2';
                        statusGlyph = 'ok';
                        break;
                    default:
                        statusColor = '#a4d1a2';
                        statusGlyph = 'play';
                }
            } else {
                statusColor = '#a4d1a2';
                statusGlyph = 'ok';

            }
            break;
        default:
            statusColor = '#a4d1a2';
            statusGlyph = 'play';
    }
    const back_link = result.back_link || (result.instance && `/transactions/${result.instance.id}`);
    let trace = result.trace;
    try {
        trace = JSON.stringify(JSON.parse(trace), null, 4)
    } catch {}

    return (
        <tr>
            {
                colOffset && <td colSpan={colOffset}/>
            }
            <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={statusGlyph}/></td>
            <td>
                {
                    back_link ?
                        <a href={back_link} target="_blank" rel="noopener noreferrer">{result.input_ref}</a> :
                        result.input_ref
                }<br/>
                {result.trace && <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>{trace}</pre>}
            </td>
            <td style={{width: '15%'}} />
            <td style={{width: '15%'}} >
            {
                result.instance && result.instance.errors !== 0 &&
                <Badge style={{backgroundColor: '#ff0808'}}>
                    {result.instance.errors}{' '}<FormattedMessage id="errors" defaultMessage="error(s)"/>
                </Badge>
            }
            </td>
        </tr>
    )
};


class BulkEntry extends Component {
    state = {
        expanded: false,
        results: []
    };

    onLoadResults() {
        const {bulk} = this.props;

        fetch_get(`/api/v01/bulks/${bulk.bulk_id}/results`)
            .then(data => !this.cancelLoad && this.setState({results: data.results.sort((a, b) => a.bulk_result_id - b.bulk_result_id)}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-bulk-results-failed" defaultMessage="Fetch bulk results failed" />,
                error.message
            ))
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevState.expanded && prevState.expanded !== this.state.expanded) {
            this.onLoadResults()
        }
    }

    render() {
        const {expanded, results} = this.state;
        const {bulk} = this.props;
        const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

        let rows = [
            <tr key={`bulk_head_${bulk.bulk_id}`} onClick={() => this.setState({expanded: !expanded})}>
                <td style={{width: '2%'}}>{expIco}</td>
                <td>{bulk.bulk_id}</td>
                <td>{bulk.label}</td>
                <td>{bulk.status}</td>
                <td>{bulk.action}</td>
                <td>{bulk.created_on}</td>
            </tr>
        ];

        if(expanded) {
            results.map(r => rows.push(
                <BulkResult key={`res_${r.id}`} result={r} colOffset={1}/>
            ))
        }
        return rows;
    }
}


const BulkHistory = ({bulks}) => (
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
                        <th><FormattedMessage id="action" defaultMessage="Action"/></th>
                        <th><FormattedMessage id="creation-date" defaultMessage="Creation date"/></th>
                    </tr>
                </thead>
                <tbody>
                {
                    bulks && bulks.sort((a, b) => b.bulk_id - a.bulk_id).map(b => <BulkEntry bulk={b} key={`bulk_${b.bulk_id}`}/>)
                }
                </tbody>
            </Table>
        </Panel.Body>
    </Panel>
);


export class Bulks extends Component {
    state = {
        bulks: [],
        actions: []
    };

    fetchActions() {
        fetch_get('/api/v01/bulks/actions')
            .then(d => !this.cancelLoad && this.setState({actions: d.actions}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-actions-failed" defaultMessage="Failed to fetch bulk actions"/>,
                error.message
            ))
    }

    fetchHistory() {
        fetch_get('/api/v01/bulks')
            .then(d => !this.cancelLoad && this.setState({bulks: d.bulks}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-bulks-failed" defaultMessage="Failed to fetch bulk operations"/>,
                error.message
            ))
    }

    componentDidMount() {
        this.fetchActions();
        this.fetchHistory();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        const {bulks, actions} = this.state;
        actions && bulks && bulks.map(b => {
            const action = actions.find(a => a.id === b.action_id);
            if(action) {
                b.action = action.name
            }
        });
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="bulk" defaultMessage="Bulk"/></Breadcrumb.Item>
                </Breadcrumb>

                <NewBulk onChange={this.fetchHistory.bind(this)} />
                <BulkHistory bulks={bulks} />
            </div>
        )
    }
}