import React, {Component, useState, useEffect} from 'react';

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
import Modal from "react-bootstrap/lib/Modal";

import {FormattedMessage} from "react-intl";
import {
    API_URL_PREFIX,
    AuthServiceManager,
    fetch_delete,
    fetch_get,
    fetch_post_raw,
    NotificationsManager, userLocalizeUtcDate
} from "../utils";
import update from "immutability-helper";
import queryString from "query-string";
import {Link} from "react-router-dom";
import {Pagination} from "../utils/datatable";
import moment from 'moment';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";


class NewBulk extends Component {
    state = {
        bulk: NewBulk.emptyBulk(),
        source: undefined,
        actions: [],
        loading: false,
        source_entries: "",
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

        this.setState({creationError: undefined, validationError: undefined, loading: true, approvedSource: false, source_entries: ""});
        fetch_post_raw('/api/v01/bulks/validate', data)
            .then(resp => resp.json())
            .then(resp_data => !this.cancelLoad && this.setState({approvedSource: true, loading: false, source_entries: resp_data.nb_entries}))
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
        const {bulk, approvedSource, actions, validationError, creationError, loading, source_entries} = this.state;
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
                            source_entries && <Alert bsStyle="info"><FormattedMessage id="entries-validated" defaultMessage="{nb_entries} entries validated" values={{nb_entries: source_entries}} /></Alert>
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
                                        actions
                                          .sort((a, b) => a.name.localeCompare(b.name))
                                          .map(a => <option value={a.id} key={a.id}>{a.name}</option>)
                                    }
                                </FormControl>

                                { action_obj && action_obj.sample_input && (
                                    <HelpBlock style={{color: 'grey'}}>
                                        <FormattedMessage
                                            id="new-bulk-sample-input"
                                            defaultMessage="Sample input:"/>
                                        {' '}
                                        <a download={`${action_obj.name}_sample.csv`} href={`data:text/plain,${encodeURIComponent(action_obj.sample_input)}`}>download</a>
                                    </HelpBlock>
                                )}

                                { action_obj && action_obj.validation_schema && (
                                    <HelpBlock style={{color: 'grey'}}>
                                        <FormattedMessage
                                            id="columns-available"
                                            defaultMessage="Columns available (mandatory: *): {cols}"
                                            values={
                                                {cols: (
                                                    Object.keys(action_obj.validation_schema.properties)
                                                        .map(p => action_obj.validation_schema.required && action_obj.validation_schema.required.contains(p) !== -1?`*${p}*`:p)
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
                    <Modal show={loading}>
                        <Modal.Body>
                            <FormattedMessage id="loading" defaultMessage="Loading..." />
                        </Modal.Body>
                    </Modal>
                </Panel.Body>
            </Panel>
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
                    case "CLOSED_IN_ERROR":
                        statusColor = '#ca6f7b';
                        statusGlyph = 'remove';
                        break;
                    case "CLOSED_IN_SUCCESS":
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
            if (result.response && result.response.status) {
                if(result.response.status < 400) {
                    statusColor = '#a4d1a2';
                    statusGlyph = 'ok';
                } else if (result.response.status >= 400) {
                    statusColor = '#ca6f7b';
                    statusGlyph = 'remove';
                }
            }
            break;
        default:
            statusColor = '#a4d1a2';
            statusGlyph = 'play';
    }
    const back_link = result.back_link || (result.instance && `/transactions/${result.instance.id}`);
    let trace = result.trace;
    if(trace) {
        try {
            trace = JSON.stringify(JSON.parse(trace), null, 4)
        } catch {
        }
    }

    return (
        <tr>
            {
                colOffset && <td colSpan={colOffset}/>
            }
            <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={statusGlyph}/></td>
            <td colSpan={2}>
                {
                    back_link ?
                        <a href={back_link} target="_blank" rel="noopener noreferrer">{result.input_ref}</a> :
                        result.input_ref
                }<br/>
                {result.trace && <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>{trace}</pre>}
            </td>
            <td style={{width: '15%'}} >
              {
                result.response && result.response.message &&
                  <p style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap', color: statusColor}}>{result.response.message}</p>
              }
            </td>
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


const DeleteBulk = ({bulk, onClose}) => {
    const onDelete = () => {
        fetch_delete(`/api/v01/bulks/${bulk.bulk_id}`)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="bulk-deleted" defaultMessage="Bulk deleted!" />);
                onClose();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="bulk-delete-failed" defaultMessage="Bulk delete failed!" />,
                error.message
        ))
    };

    return (
        <Button onClick={onDelete} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
            <Glyphicon glyph="remove-sign"/>
        </Button>
    )
};


function fetchStats(bulkId, onSuccess) {
  fetch_get(`/api/v01/bulks/${bulkId}/stats`)
    .then(r => onSuccess(r.stats))
    .catch(error => NotificationsManager.error(
      <FormattedMessage id="bulk-stats-failed" defaultMessage="Fetch bulk stats failed!" />,
      error.message
    ));
}


function BulkStats(props) {
  const {show, bulkId} = props;
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if(show) {
      fetchStats(bulkId, setStats);
      const i = setInterval(() => fetchStats(bulkId, setStats), 10000);
      return () => clearInterval(i);
    }
  }, [show]);

  const statuses = stats.reduce((o, c) => { !o.includes(c.status) && o.push(c.status); return o;}, []);
  const stats_ = stats.reduce((o, c) => {
    if(o[c.cell_id] === undefined) o[c.cell_id] = {};
    o[c.cell_id][c.status] = c.count_1;
    return o;
  }, {});

  return (
    <Table>
      <thead>
        <tr>
          <th>Tasks</th>
          {
            statuses.map(s => <th key={`status-${s}`}># of {s}</th>)
          }
        </tr>
      </thead>
      <tbody>
      {
        Object.entries(stats_).map(([cellId, s], i) =>
          <tr key={`stat-${i}`}>
            <td>{cellId}</td>
            {
              statuses.map(status => <td>{s[status] || "0"}</td>)
            }
          </tr>
        )
      }
      </tbody>
    </Table>
  )
}

class BulkEntry extends Component {
    state = {
        expanded: false,
        truncated: null,
        results: []
    };

    onLoadResults() {
        const {bulk} = this.props;
        this.setState({loading: true});

        fetch_get(`/api/v01/bulks/${bulk.bulk_id}/results`)
            .then(data => {
                if(this.cancelLoad) {
                    return;
                }
                if(data.results.length > 250) {
                    const originalLen = data.results.length;
                    data.results.length = 250;
                    this.setState({results: data.results, loading: false, truncated: originalLen})
                } else {
                    this.setState({results: data.results, loading: false, truncated: null})
                }
            })
            .catch(error => {
                NotificationsManager.error(
                    <FormattedMessage id="fetch-bulk-results-failed" defaultMessage="Fetch bulk results failed" />,
                    error.message
                );
                !this.cancelLoad && this.setState({loading: false})
            })
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(!prevState.expanded && prevState.expanded !== this.state.expanded) {
            this.onLoadResults()
        }
    }

    completionStatus() {
        const {results, truncated} = this.state;
        if(!results.length) return null;

        const completed = results.filter(r => r.status !== "active" || (r.instance && r.instance.status !== "ACTIVE")).length;
        return `${truncated?"...":completed} / ${truncated?truncated:results.length}`;
    }

    render() {
        const {expanded, results, loading, truncated} = this.state;
        const {bulk, onDelete, userInfo} = this.props;
        const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

        let rows = [
            <tr key={`bulk_head_${bulk.bulk_id}`} >
                <td style={{width: '2%'}} onClick={() => this.setState({expanded: !expanded})}>{expIco}</td>
                <td>{bulk.bulk_id}</td>
                <td>{bulk.label}</td>
                <td>{bulk.status}</td>
                <td>{this.completionStatus()}</td>
                <td>{bulk.action}</td>
                <td>{userLocalizeUtcDate(moment.utc(bulk.created_on), userInfo).format()}</td>
                <td>
                    <DeleteBulk bulk={bulk} onClose={onDelete} />
                </td>
            </tr>
        ];

        if(expanded && loading) {
            rows.push(
                <tr>
                    <td/>
                    <td>
                        <FontAwesomeIcon icon="spinner" aria-hidden="true" style={{'fontSize': '24px'}} spin />
                    </td>
                    <td colSpan={5}/>
                </tr>
            )
        } else if (expanded) {
            rows.push(
              <tr>
                <td/>
                <td colSpan={6}>
                  <Tabs defaultActiveKey={"list"} id="bulk-details">
                    <Tab eventKey="list" title="List">
                      <Table>
                        <tbody>
                        {
                        results.map(r =>
                          <BulkResult key={`res_${r.bulk_result_id}`} result={r} />
                        )
                        }
                        </tbody>
                      </Table>
                    </Tab>
                    <Tab eventKey="stats" title="Stats">
                      <BulkStats show={expanded} bulkId={bulk.bulk_id}/>
                    </Tab>
                  </Tabs>
                </td>
              </tr>
            );
            rows.push(
                <tr>
                    <td colSpan={7}>
                        { truncated &&
                        <p>
                          The result list is limited to 250 results. Click here to have the full results:
                          <Button
                            bsStyle="link"
                            onClick={() => {
                              AuthServiceManager.getValidToken().then(token => {
                                  window.location=`${API_URL_PREFIX}/api/v01/bulks/${bulk.bulk_id}/results?as=log&auth_token=${token}`
                                })
                            }}
                          >here</Button>
                        </p>
                        }
                        {
                            results.length && results[0].instance && <p>
                                See generated <Link to={{pathname: "/transactions/list", search: queryString.stringify({
                                    filter: JSON.stringify({label: { model: 'bulks', value: bulk.label, op: 'eq' }})
                                })}}>requests</Link>
                            </p>
                        }
                    </td>
                </tr>
            );
        }
        return rows;
    }
}


const BulkHistory = ({bulks, onDelete, pagination, onPagination, userInfo}) => (
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
                        <th/>
                        <th><FormattedMessage id="action" defaultMessage="Action"/></th>
                        <th><FormattedMessage id="creation-date" defaultMessage="Creation date"/></th>
                        <th/>
                    </tr>
                </thead>
                <tbody>
                {
                    bulks && bulks.map(b => <BulkEntry bulk={b} onDelete={onDelete} key={`bulkEntry_${b.bulk_id}`} userInfo={userInfo}/>)
                }
                </tbody>
            </Table>
            <Pagination
                onChange={onPagination}
                page_number={pagination.page_number}
                num_pages={pagination.num_pages}
                total_results={pagination.total_results}
            />
        </Panel.Body>
    </Panel>
);


function fetchActions(onSuccess) {
    fetch_get('/api/v01/bulks/actions')
        .then(d => onSuccess(d.actions))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch-actions-failed" defaultMessage="Failed to fetch bulk actions"/>,
            error.message
        ))
}


function fetchHistory(pagination, onSuccess) {
    const url = new URL(API_URL_PREFIX + "/api/v01/bulks");
    url.searchParams.append("paging", JSON.stringify(pagination));
    fetch_get(url)
        .then(d => onSuccess(
            d.bulks,
            {
                page_number: d.pagination[0], // page_number, page_size, num_pages, total_results
                page_size: d.pagination[1],
                num_pages: d.pagination[2],
                total_results: d.pagination[3],
            }
        ))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="fetch-bulks-failed" defaultMessage="Failed to fetch bulk operations"/>,
            error.message
        ))
}


export function Bulks(props) {
    const [bulks, setBulks] = useState([]);
    const [actions, setActions] = useState([]);
    const [pagination, setPagination] = useState({
        page_number: 1,
        page_size: 20,
        num_pages: 1,
    });

    const setBulksWithPage = (bulks, pagination) => {setBulks(bulks); setPagination(pagination)};

    useEffect(() => {
        document.title = "Bulks";
        fetchActions(setActions);
        fetchHistory(pagination, setBulksWithPage);
    }, []);

    useEffect(() => {
        fetchHistory(pagination, setBulks);
    }, [pagination]);

    useEffect(() => {
        bulks.map(b => {
            const action = actions.find(a => a.id === b.action_id);
            if(action) {
                b.action = action.name
            }
        })
    }, [actions, bulks]);

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="bulk" defaultMessage="Bulk"/></Breadcrumb.Item>
            </Breadcrumb>

            <NewBulk onChange={() => fetchHistory(pagination, setBulksWithPage)} />
            <BulkHistory
                bulks={bulks}
                onDelete={() => fetchHistory(pagination, setBulksWithPage)}
                pagination={pagination}
                onPagination={e => setPagination(update(pagination, {$merge: e}))}
                userInfo={props.userInfo}
            />
        </div>
    )
}
