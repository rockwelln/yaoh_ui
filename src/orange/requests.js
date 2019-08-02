import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import Alert from 'react-bootstrap/lib/Alert';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Table, {tbody, th, tr} from 'react-bootstrap/lib/Table';
import Tab from 'react-bootstrap/lib/Tab';
import Tabs from 'react-bootstrap/lib/Tabs';
import Badge from 'react-bootstrap/lib/Badge';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap/lib/Tooltip';

import DatePicker from 'react-datepicker';
import moment from 'moment';
import {Link} from 'react-router-dom';
import {FormattedMessage} from 'react-intl';
import queryString from 'query-string';
import 'font-awesome/css/font-awesome.min.css';
import ReactJson from 'react-json-view';

import {
    API_URL_PREFIX, API_URL_PROXY_PREFIX, fetch_get, parseJSON, fetch_post, fetch_put
} from "../utils";
import {ApioDatatable, Pagination} from "../utils/datatable";

import 'react-datepicker/dist/react-datepicker.css';
import GridPic from "../grid.gif";
import draw_editor from "../editor";
import update from 'immutability-helper';
import {StaticControl} from "../utils/common";
import {access_levels, isAllowed, pages} from "../utils/user";

export const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const SUB_REQUESTS_PAGE_SIZE = 25;

const workableDefinition = (definition, states) => {
    let new_def = Object.assign({}, definition);
    
    Object.keys(definition.cells).map(k => {
        let c = definition.cells[k];
        //c.name = k;
        const state = states && states.find(s => s.cell_id === k);
        if(state !== undefined) {
            c.state = state.status;
        }
        new_def.cells[k] = c;
        return null;
    });
    
    new_def.transitions && states && new_def.transitions.map(t => {
        const src = t[0];
        const dst = t[1];

        const state = states && states.find(s => src === `${s.cell_id}.${s.output}`);
        if(state !== undefined) {
            const dest_state = states.find(s => dst === s.cell_id);
            if(dest_state !== undefined) {
                t[2] = {'status': dest_state.status};
            }
        }

        return null;
    });

    return new_def;
};


const pp_as_json = (s) => {
    try {
        return JSON.stringify(JSON.parse(s), null, 2);
    } catch(e) {
        //console.log(e);
        return s
    }
};

class TransactionFlow extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {};
        this.flowGraphRef = React.createRef();
        this.toolbarRef = React.createRef();
        this._renderGrid = this._renderGrid.bind(this);
        this._refreshGrid = this._refreshGrid.bind(this);
    }

    _renderGrid(getActivity) {
        const node = ReactDOM.findDOMNode(this.flowGraphRef.current);
        const toolbarNode = ReactDOM.findDOMNode(this.toolbarRef.current);
        draw_editor(node, {
            get: getActivity
        }, {
            toolbar: toolbarNode,
        }, {
            readOnly: true,
            height: 300,
        });
    }

    _refreshGrid(force) {
        const width = this.flowGraphRef.current?ReactDOM.findDOMNode(this.flowGraphRef.current).getBoundingClientRect().width:null;
        if(!width) return;
        if(width !== this.state.eltWidth || force) {
            this.setState({eltWidth: width});

            const {definition, states} = this.props;
            width !== 0 && this._renderGrid(
                cb => cb({definition: workableDefinition(JSON.parse(definition), states)})
            );
        }
    }

    componentDidMount() {
        this._refreshGrid(true);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const width = this.flowGraphRef.current?ReactDOM.findDOMNode(this.flowGraphRef.current).getBoundingClientRect().width:null;
        // if resized
        if(width && width !== this.state.eltWidth){
            return true;
        }
        // if there is a new task
        if(!this.props.states || this.props.states.length !== nextProps.states.length){
            return true;
        }
        // if a task status changed
        return (
            this.props.states.filter(
                s => nextProps.states.find(
                    ns => ns.cell_id === s.cell_id && s.status !== ns.status
                ) !== undefined
            ).length !== 0
        );
    }

    componentDidUpdate(prevProps, prevState) {
        this._refreshGrid(true);
    }

    render() {
        return (
            <div>
                <div ref={this.toolbarRef} style={{position: 'absolute', zIndex: '100'}} />
                <div ref={this.flowGraphRef} style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
            </div>
        );
    }
}


const transformXML = (xmlText, xsltText) => {
    // Bomb out if this browser does not support DOM parsing and transformation
    if(!window.DOMParser) {
        return xmlText
    }

    var xslt;
    if(window.XSLTProcessor) {
        xslt = new XSLTProcessor();
    }
    else if(window.ActiveXObject || "ActiveXObject" in window) {
        //xslt = new window.ActiveXObject("Msxml2.XSLTemplate");
        //xslt.stylesheet = xsltDoc;
        try {
            var xmlDoc = new window.ActiveXObject('Msxml2.DOMDocument.6.0');
            xmlDoc.loadXML(xmlText);

            var sheet = new window.ActiveXObject('Msxml2.DOMDocument.6.0');
            sheet.loadXML(xsltText);

            return xmlDoc.transformNode(sheet);
        } catch (e) {
            console.error(e);
            return xmlText;
        }
    } else {
        return xmlText;
    }

    var xsltDoc = new DOMParser().parseFromString(xsltText, "text/xml");

    // Apply that document to as a stylesheet to a transformer
    // var xslt = new XSLTProcessor();
    xslt.importStylesheet(xsltDoc);

    // Load the XML into a document.
    // Trim any preceding whitespace to prevent parse failure.
    var xml = new DOMParser().parseFromString(xmlText.trim(), "text/xml");
    // Transform it
    var transformedXml = xslt.transformToDocument(xml);
    // Apply the transformed document if it was successful
    return !transformedXml ? xmlText : new XMLSerializer().serializeToString(transformedXml);
};


const XSLT_PP = "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\">\n" +
    "<xsl:output omit-xml-declaration=\"yes\" indent=\"yes\"/>\n" +
    "  <xsl:template match=\"node()|@*\">\n" +
    "    <xsl:copy><xsl:apply-templates select=\"node()|@*\"/></xsl:copy>\n" +
    "  </xsl:template>\n" +
    "</xsl:stylesheet>";


const pp_output = (protocol, content) => {
    switch(protocol) {
        case "BS-OCI":
        case "ROM":
            return transformXML(content, XSLT_PP);
        default:
            return content;
    }
};

const protocol2endpoint = (protocol) => {
    switch(protocol) {
        case "BS-OCI": return "BroadWorks";
        case "ROM":
            return protocol;
        default:
            return "unknown ..."
    }
};

const protocol2summary = (protocol, content) => {
    var s;
    switch(protocol) {
        case "BS-OCI":
            s = /xsi:type="([A-Za-z0-9:]+)".*$/gm.exec(content);
            return s && s[1];
        case "ROM":
            s = /<(ns[0-9]:|)action>([A-Za-z0-9:]+)<\/.*$/gm.exec(content);
            return (s && s[2]) || "....";
        default:
            return "..."
    }
};

const SyncMessagesDetails = ({data}) => (
    <Table>
        <thead>
            <tr>
                <th><FormattedMessage id="time" defaultMessage="Time" /></th>
                <th><FormattedMessage id="protocol" defaultMessage="Protocol" /></th>
                <th><FormattedMessage id="type" defaultMessage="Type" /></th>
                <th><FormattedMessage id="id" defaultMessage="Id" /></th>
                <th><FormattedMessage id="content" defaultMessage="Content" /></th>
            </tr>
        </thead>
        <tbody>
        {
            data.map(
                (d, i) =>
                    <tr key={`sync_msg_${i}`}>
                        <td>{moment(Math.floor(parseFloat(d.timestamp) * 1000)).format("HH:mm:ss.SSS")}</td>
                        <td>{d.protocol}</td>
                        <td>{d.type}</td>
                        <td>{d.id}</td>
                        <td>
                            <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                                {d.content && pp_output(d.protocol, d.content)}
                            </pre>
                        </td>
                    </tr>
            )
        }
        </tbody>
    </Table>
);


const vSpacing = 30;
// const hSpacing = 200;

class SyncMessagesFlow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            boundingRect: SyncMessagesFlow.defaultClientRect,
        };
        this.chartRef = React.createRef();
    }

    static _extractEndpoints(data) {
        const endpoints = data.map(d => protocol2endpoint(d.protocol));
        return [...new Set(endpoints)];
    }

    static defaultClientRect = {
        height: 250,
        width: 800,
    };

    componentDidMount() {
        const boundingRect = this.chartRef.current?ReactDOM.findDOMNode(this.chartRef.current).getBoundingClientRect():null;

        if(boundingRect && boundingRect.width !== this.state.boundingRect.width) {
            this.setState({boundingRect: boundingRect});
        }
    }

    render() {
        const {data} = this.props;
        const {boundingRect, focusId} = this.state;

        const endpoints = SyncMessagesFlow._extractEndpoints(data);
        const flowWidth = boundingRect.width - 240;
        const endpointsHSpacing = flowWidth / (endpoints.length);
        const messageWidth = p => (endpoints.indexOf(protocol2endpoint(p)) + 1) * endpointsHSpacing;

        const vLineHeight = (data.length + 2) * vSpacing;
        return (
            <svg className="flow" width="100%" height={vLineHeight+75} ref={this.chartRef}>
                <marker id="end" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="8" markerHeight="8" orient="auto">
                    <path d="M0,-5L10,0L0,5"/>
                </marker>
                <g transform="translate(120,40)">

                    <g transform="translate(0,30)">
                        {
                            data.map(
                                (d, i) =>
                                    <line
                                        key={`message_line_${i}`}
                                        x1={d.type === "request"?0:messageWidth(d.protocol)}
                                        x2={d.type === "request"?messageWidth(d.protocol):0}
                                        y1={vSpacing * (i+1)}
                                        y2={vSpacing * (i+1)}
                                        stroke={d.type === "request"?"blue":d.type === "error"?"red":"green"}
                                        markerEnd={`url(#end)`}
                                        className="path"
                                    />
                            )
                        }
                    </g>
                    <g transform="translate(0,30)">
                        {
                            data.map(
                                (d, i) => (
                                        <OverlayTrigger
                                          key={`tooltip-${i}`}
                                          placement="top"
                                          onEntered={() => this.setState({focusId: d.id})}
                                          onExited={() => this.setState({focusId: undefined})}
                                          overlay={
                                              <Tooltip
                                                  id={`tooltip-${i}`}
                                                  style={{padding: '2px 10px', borderRadius: 3}}>
                                                  {d.content}
                                              </Tooltip>
                                          }>
                                            <text
                                                textAnchor="middle"
                                                x={messageWidth(d.protocol) / 2}
                                                y={(vSpacing * (i + 1)) - 10}
                                                fill={!focusId || focusId === d.id ? "#1f77b4" : "rgba(31,119,180,0.4)"}
                                                fillOpacity={1}
                                                className="message-label">
                                                {protocol2summary(d.protocol, d.content)}
                                            </text>
                                        </OverlayTrigger>
                                )
                            )
                        }
                    </g>
                    <g transform="translate(0,30)">
                        {
                            data.map(
                                (d, i) =>
                                    <text
                                        key={`timeline_${i}`}
                                        textAnchor="end"
                                        x="-10"
                                        y={vSpacing * (i+1)}
                                        fillOpacity={1}
                                        className="timestamp">
                                        {moment(Math.floor(parseFloat(d.timestamp) * 1000)).format("HH:mm:ss.SSS")}
                                    </text>
                            )
                        }
                        {
                            data.map(
                                (d, i) =>
                                    <line
                                        key={`message_o_line_${i}`}
                                        x1={0}
                                        x2={flowWidth}
                                        y1={vSpacing * (i+1)}
                                        y2={vSpacing * (i+1)}
                                        stroke="black"
                                        strokeOpacity="0.05"
                                    />
                            )
                        }
                    </g>
                    <g>
                        <line x1={0} x2={0} y1={15} y2={vLineHeight} stroke="black"/>
                        {
                            endpoints.map(
                                (e, i) =>
                                    <line
                                        key={`endpoint_line_${i}`}
                                        x1={endpointsHSpacing * (i + 1)}
                                        x2={endpointsHSpacing * (i + 1)}
                                        y1={15}
                                        y2={vLineHeight}
                                        stroke="black"
                                    />
                            )
                        }

                        <text textAnchor="middle" x={0} y={10} fill="black" fillOpacity="1">APIO</text>
                        {
                            endpoints.map(
                                (e, i) =>
                                    <text
                                        key={`endpoint_text_${i}`}
                                        textAnchor="middle"
                                        x={endpointsHSpacing * (i + 1)}
                                        y={10}
                                        fill="black"
                                        fillOpacity={1}
                                    >{e}</text>
                            )
                        }
                    </g>
                </g>
            </svg>
        )
    }
}


class Message extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            loading: false,
        };
        this.fetchDetails = this.fetchDetails.bind(this);
        this.onExpand = this.onExpand.bind(this);
    }

    fetchDetails() {
        this.setState({loading: true});
        fetch_get(`${API_URL_PROXY_PREFIX}/api/v1/local/audit_records/${this.props.entry.external_id}`, this.props.auth_token)
            .then(data => {
                this.setState({syncDetails: data, loading: false});
            })
            .catch(error => {
                this.setState({error: error, loading: false})
            });
    }

    onExpand() {
        const {expanded} = this.state;
        if(!expanded) {
            this.fetchDetails();
        }
        this.setState({expanded: !expanded});
    }

    getStatusColor() {
        return this.props.entry.status < 400 ? '#a4d1a2' : '#ca6f7b';
    }

    render() {
        const {entry, p} = this.props;
        const {syncDetails, loading, expanded} = this.state;
        const statusColor = this.getStatusColor();
        const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;
        let rows = [
            <tr
                onClick={this.onExpand}
                key={`message_summary_${entry.processing_trace_id}`}
            >
                <td style={{width: '1%'}}>{expIco}</td>
                <td style={{width: '1%'}}>{`${p+1}. `}</td>
                <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={entry.status < 400?"ok":"remove"}/></td>
                <td style={{width: '16%'}}>{entry.label}</td>
                <td style={{width: '5%'}}>{entry.status}</td>
                <td style={{width: '60%'}}>{moment(entry.created_on).format(DATE_FORMAT)}</td>
                <td style={{width: '15%'}}><Badge>{entry.task_name}</Badge></td>
            </tr>
        ];

        if (loading) {
            rows.push(
                <tr key={`message_loading_${entry.processing_trace_id}`}>
                    <td colSpan={7}><FormattedMessage id="loading" defaultMessage="Loading..."/></td>
                </tr>
            )
        } else if (expanded) {
            rows.push(
                <tr key={`message_details_${entry.processing_trace_id}`}>
                    <td colSpan={7}>
                        <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>{pp_as_json(entry.output)}</pre>
                    </td>
                </tr>
            );

            try {
                syncDetails && rows.push(
                    <tr key={`message_flow_sync_${entry.processing_trace_id}`}>
                        <td colSpan={7}>
                            <Tabs defaultActiveKey={1} id="syn-messages-flow">
                                <Tab eventKey={1} title={<FormattedMessage id="flows" defaultMessage="Flows" />}>
                                    <SyncMessagesFlow data={JSON.parse(syncDetails.south_data)} />
                                </Tab>
                                <Tab eventKey={2} title={<FormattedMessage id="messages" defaultMessage="Messages" />}>
                                    <SyncMessagesDetails data={JSON.parse(syncDetails.south_data)} />
                                </Tab>
                            </Tabs>
                        </td>
                    </tr>
                );
            } catch {
                console.error("invalid sync details")
            }

        }
        return rows;
    }
}


const MessagesTable = ({messages, auth_token})  => (
    <Table condensed>
        <tbody>
        {
            messages.sort(
                (a, b) => {
                    if(a.created_on < b.created_on) return -1;
                    if(a.created_on > b.created_on) return 1;
                    if(a.processing_trace_id < b.processing_trace_id) return -1;
                    if(a.processing_trace_id > b.processing_trace_id) return 1;
                    return 0;
                }
            ).map(
                (e, i) => <Message key={`message_${i}`} entry={e} p={i} auth_token={auth_token}/>
            )
        }
        </tbody>
    </Table>
);


class ExternalCallback extends Component {
    constructor(props) {
        super(props);
        this.state = {show_details: false}
    }

    render() {
        const {entry, tasks} = this.props;
        const task = tasks.find(t => t.id === entry.origin_task_id);
        return (
            <tr>
                <td>{entry.callback_id}</td>
                <td>{entry.entity}</td>
                <td>{entry.external_id}</td>
                <td>{task && <Badge>{task.cell_id}</Badge>}</td>
                <td>{entry.status}</td>
            </tr>
        )
    }
}

const ExternalCallbacks = ({callbacks, tasks}) => (
    <Table condensed>
        <thead>
            <tr>
                <th><FormattedMessage id="id" defaultMessage="id" /></th>
                <th><FormattedMessage id="entity" defaultMessage="Entity" /></th>
                <th><FormattedMessage id="external-id" defaultMessage="External id" /></th>
                <th><FormattedMessage id="task" defaultMessage="Task" /></th>
                <th><FormattedMessage id="status" defaultMessage="Status" /></th>
            </tr>
        </thead>
        <tbody>
        {
            callbacks.sort(
                (a, b) => {
                    if(a.callback_id < b.callback_id) return -1;
                    if(a.callback_id > b.callback_id) return 1;
                    return 0;
                }
            ).map(
                (e, i) => <ExternalCallback key={`ext_cb_${i}`} entry={e} p={i} tasks={tasks} />
            )
        }
        </tbody>
    </Table>
);


const SubRequest = ({req, tasks, colOffset, onRollback, onReplay}) => {
    const request = req.request;
    const instance_ = req.instance;
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
    const callback_task = tasks && tasks.find(t => t.id === instance_.callback_task_id);

    return (
        <tr key={`message_sub_flow_sync_${instance_.id}`}>
            {
                colOffset && <td colSpan={colOffset}/>
            }
            <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={statusGlyph}/></td>
            <td>
                <Link to={`/transactions/${instance_.id}`}>{request.label}</Link>{' '}
                {
                    instance_.errors !== 0 && <Badge style={{backgroundColor: '#ff0808'}}>{instance_.errors}{' '}<FormattedMessage id="errors" defaultMessage="error(s)"/></Badge>
                }
            </td>
            <td style={{width: '30%'}}>
                {
                    request.status === "ACTIVE" && instance_.tasks && instance_.tasks.filter(t => t.status === 'ERROR').map(t =>
                        <ButtonToolbar key={`subints_act_${instance_.id}_${t.task_id}`}>
                            <Button bsStyle="primary" onClick={() => onReplay(instance_.id, t.task_id)}><FormattedMessage id="replay" defaultMessage="Replay" /></Button>
                            <Button bsStyle="danger" onClick={() => onRollback(instance_.id, t.task_id, "rollback")}><FormattedMessage id="rollback" defaultMessage="Rollback" /></Button>
                        </ButtonToolbar>
                    ).pop()
                }
            </td>
            <td style={{width: '15%'}}>
                {
                    callback_task && <Badge>{callback_task.cell_id}</Badge>
                }
            </td>
        </tr>
    )
};

const SubRequestsTable = ({subrequests, tasks, ...props}) => (
    <Table condensed>
        <tbody>
        {
            subrequests.map(
                (r, i) => <SubRequest key={`subreqs_${i}`} req={r} tasks={tasks} {...props} />
            )
        }
        </tbody>
    </Table>
);


class Comments extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            comments: [],
            error: undefined,
            save_error: undefined,
            showAddModal: false,
            comment: '',
        };
        this.fetchComments = this.fetchComments.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    fetchComments() {
        fetch_get(`/api/v01/transactions/${this.props.req_id}/comments?load_user_info=1`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({comments: data.comments}))
            .catch(error => !this.cancelLoad && this.setState({error: error}))
    }

    componentDidMount() {
        this.fetchComments()
    }

    saveNewComment() {
        fetch_post(
            `/api/v01/transactions/${this.props.req_id}/comments`,
            {comment: this.state.comment},
            this.props.auth_token
        )
        .then(parseJSON)
        .then(() => {
            this.setState({showAddModal: false, comment: '', save_error: undefined});
            this.props.notifications.addNotification({
                message: <FormattedMessage id="new-comment-added" defaultMessage="Your comment has been added!"/>,
                level: 'success'
            });
            this.fetchComments();
        })
        .catch(error => this.setState({save_error: error}))
    }

    render() {
        const {comments, showAddModal, comment, save_error} = this.state;
        const closeModal = () => this.setState({showAddModal: false, comment: '', save_error: undefined});

        return (<div>
            <Table condensed>
                <tbody>
                    {comments && comments.map(c => (
                        <tr key={c.id}>
                            <th style={{width: '15%'}}>{c.user.username}<br/>{moment(c.created_on).format(DATE_FORMAT)}</th>
                            <td>{c.content.split('\n').map((e, i) => <div key={i}>{e}</div>)}</td>
                        </tr>
                        ))
                    }
                    <tr>
                        <td colSpan={4}>
                            <Button onClick={() => this.setState({showAddModal: true})} bsStyle="info"><FormattedMessage id="new-comment" defaultMessage="New comment"/></Button>
                        </td>
                    </tr>
                </tbody>
            </Table>
            <Modal show={showAddModal} onHide={closeModal} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="new-comment" defaultMessage="New comment"/></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        save_error &&
                            <Alert bsStyle="danger">
                                <FormattedMessage id="fail-save-comment" defaultMessage="Failed to save comment."/><br/>
                            </Alert>
                    }
                    <Form>
                        <FormGroup controlId="comment">
                            <FormControl componentClass="textarea"
                                         placeholder="..."
                                         value={comment}
                                         onChange={e => this.setState({comment: e.target.value})}
                                         autoFocus />
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.saveNewComment.bind(this)} bsStyle="primary" disabled={comment.length === 0}>
                        <FormattedMessage id="save" defaultMessage="Save"/>
                    </Button>
                    <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
                </Modal.Footer>
            </Modal>
        </div>);
    }
}

class Error extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {entry} = this.props;
        const summary = entry.output?entry.output:<FormattedMessage id="see-description" defaultMessage="See description" />;
        return (
            <tr key={entry.id}>
                <th>{entry.cell_id}</th>
                <td>
                    {summary.split("\n").map((l, i) => <div key={i}>{l}<br/></div>)}
                    <br/>
                    <Button bsStyle="link" onClick={() => this.setState({showDetails:true})}>...</Button>
                </td>
                <td>{moment(entry.created_on).format(DATE_FORMAT)}</td>
                <Modal show={this.state.showDetails} onHide={() => this.setState({showDetails: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="error-details" defaultMessage="Error details" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={entry.cell_id}/>
                            <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={moment(entry.created_on).format(DATE_FORMAT)}/>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="summary" defaultMessage="Summary" />
                                </Col>

                                <Col sm={9}>
                                    {summary.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="description" defaultMessage="Description" />
                                </Col>

                                <Col sm={9}>
                                    {entry.description && entry.description.split("\n").map((l, i) => <FormControl.Static key={i}>{l}</FormControl.Static>)}
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                </Modal>
            </tr>
        )
    }
}

const Errors = ({errors, user_info}) => (
    <Table condensed>
        <thead>
        <tr>
            <th><FormattedMessage id="cell" defaultMessage="Cell" /></th>
            <th><FormattedMessage id="summary" defaultMessage="Summary" /></th>
            <th><FormattedMessage id="created" defaultMessage="Created" /></th>
        </tr>
        </thead>
        <tbody>
        {
            errors.sort(
                (a, b) => {
                    if(a.created_on < b.created_on) return 1;
                    if(a.created_on > b.created_on) return -1;
                    return 0;
                }
            ).map(
                e => (!e.advanced || user_info.ui_profile === "admin") && <Error key={e.id} entry={e} />
            )
        }
        </tbody>
    </Table>
);


class Events extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {show_details: false, selected_evt: {}};
    }

    render() {
        const {selected_evt, show_details} = this.state;
        const {events, logs} = this.props;

        const closeModal = () => this.setState({show_details: false, selected_evt: {}});
        const event_content = pp_as_json(selected_evt.content);
        const extra = pp_as_json(selected_evt.extra);
        return (<div>
            <Table condensed>
                <thead>
                    <tr><th colSpan={2}>{"# "}<FormattedMessage id="external" defaultMessage="External"/></th></tr>
                </thead>
                <tbody>
                {
                    events.sort((a, b) => {
                        if(b.event_id && a.event_id) {
                            if(b.event_id > a.event_id) return -1;
                            if(b.event_id < a.event_id) return 1;
                            return 0
                        } else {
                            return moment(b.created_on) - moment(a.created_on)
                        }
                    }).map(
                        (e, n) => (
                            <tr key={n}>
                                <th style={{width: "20%"}}>
                                    {e.source_entity + (e.username?' (' + e.username + ')':'')}
                                    <br/>
                                    {moment(e.created_on).format(DATE_FORMAT)}
                                </th>
                                <td>
                                    {e.content.substr(0, 50)}
                                    <br/>
                                    <Button bsStyle="link" onClick={() => this.setState({show_details: true, selected_evt: e})}>...</Button>
                                </td>
                            </tr>
                        )
                    )
                }
                </tbody>
            </Table>
            <Table condensed>
                <thead>
                    <tr><th colSpan={2}>{"# "}<FormattedMessage id="logs" defaultMessage="Log"/></th></tr>
                </thead>
                <tbody>
                {
                    logs.sort((a, b) => {
                        if(b.event_id && a.event_id) {
                            if(b.event_id > a.event_id) return -1;
                            if(b.event_id < a.event_id) return 1;
                            return 0
                        } else {
                            return moment(b.created_on) - moment(a.created_on)
                        }
                    }).map(
                        (e, n) => (
                            <tr key={n}>
                                <th style={{width: "20%"}}>
                                    {e.source_entity + (e.username?' (' + e.username + ')':'')}
                                    <br/>
                                    {moment(e.created_on).format(DATE_FORMAT)}
                                </th>
                                <td>
                                    {e.content.substr(0, 50)}
                                    <br/>
                                    <Button bsStyle="link" onClick={() => this.setState({show_details: true, selected_evt: e})}>...</Button>
                                </td>
                            </tr>
                        )
                    )
                }
                </tbody>
            </Table>
            <Modal show={show_details} onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="event-details" defaultMessage="Event details" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={selected_evt.source_entity}/>
                        <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={selected_evt.username}/>
                        <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={moment(selected_evt.created_on).format(DATE_FORMAT)}/>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="content" defaultMessage="Content" />
                            </Col>

                            <Col sm={9}>
                                <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '250px'}}>{event_content}</pre>
                            </Col>
                        </FormGroup>
                        {
                            extra &&
                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="extra" defaultMessage="Extra..." />
                                    </Col>

                                    <Col sm={9}>
                                        <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '250px'}}>{extra}</pre>
                                    </Col>
                                </FormGroup>
                        }
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </Modal.Footer>
            </Modal>
            </div>)
    }
}


const FORCEABLE_TASKS = [
    "delete @ENUM",
];

const titleCase = s => s[0].toUpperCase() + s.substr(1);

const TasksTable = ({tasks, onReplay, onRollback, user_can_replay, tx_id}) => (
    <Table condensed>
        <thead>
        <tr>
            <th><FormattedMessage id="cell" defaultMessage="Cell" /></th>
            <th><FormattedMessage id="status" defaultMessage="Status" /></th>
            <th><FormattedMessage id="output" defaultMessage="Output" /></th>
            <th><FormattedMessage id="created" defaultMessage="Created" /></th>
            <th><FormattedMessage id="updated" defaultMessage="Updated" /></th>
            <th/>
        </tr>
        </thead>
        <tbody>
            {
                tasks.sort(
                    (a, b) => {
                        if(a.id < b.id) return -1;
                        if(a.id > b.id) return 1;
                        return 0;
                    }
                ).map(t => {
                    const replayable = onReplay && user_can_replay;
                    const can_replay = (replayable || t.cell_id === 'end') && t.status === 'ERROR' &&
                        t.id === Math.max(tasks.filter(ot => ot.cell_id === t.cell_id).map(oot => oot.id));
                    const support_rollback = !["end", "start", "mark request success", "mark request error"].includes(t.cell_id);
                    const support_force = FORCEABLE_TASKS.includes(t.cell_id);
                    const support_skip = support_rollback;

                    return (
                        <tr key={t.id}>
                            <th>{t.cell_id}</th>
                            <td>{t.status}</td>
                            <td>{t.output}</td>
                            <td>{moment(t.created_on).format(DATE_FORMAT)}</td>
                            <td>{t.updated_on?moment(t.updated_on).format(DATE_FORMAT):'-'}</td>
                            <td>
                                <ButtonToolbar>
                                    {
                                        can_replay &&
                                        <Button bsStyle="primary" onClick={() => onReplay(tx_id, t.id)}>
                                            <FormattedMessage id="replay" defaultMessage="Replay" />
                                        </Button>
                                    }
                                    {
                                        can_replay && support_rollback &&
                                        <Button bsStyle="danger" onClick={() => onRollback(tx_id, t.id, "rollback")}>
                                            <FormattedMessage id="rollback" defaultMessage="Rollback"/>
                                        </Button>
                                    }
                                    {
                                        can_replay && support_force &&
                                        <Button bsStyle="danger" onClick={() => onRollback(tx_id, t.id, "force")}>
                                            <FormattedMessage id="force" defaultMessage="Force"/>
                                        </Button>
                                    }
                                    {
                                        replayable && t.status === 'WAIT' && t.cell_id.includes("numbers") &&
                                        <Button bsStyle="danger" onClick={() => onRollback(tx_id, t.id, "rollback")}>
                                            <FormattedMessage id="full-rollback" defaultMessage="Full rollback"/>
                                        </Button>
                                    }
                                    {
                                        can_replay && support_skip &&
                                        <Button bsStyle="primary" onClick={() => onRollback(tx_id, t.id, "skip")}>
                                            <FormattedMessage id="skip" defaultMessage="Skip"/>
                                        </Button>
                                    }
                                </ButtonToolbar>
                            </td>
                        </tr>
                    )
                })
            }
        </tbody>
    </Table>
);


const TxTable = ({tx, request}) => (
    <Table condensed>
        <tbody>
            <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{tx.id}</td></tr>
            <tr><th><FormattedMessage id="request-status" defaultMessage="Request status" /></th><td>{request && request.status}</td></tr>
            <tr><th><FormattedMessage id="workflow-status" defaultMessage="Workflow status" /></th><td>{tx.status}</td></tr>
            <tr><th><FormattedMessage id="creation-date" defaultMessage="Creation date" /></th><td>{moment(tx.created_on).format(DATE_FORMAT)}</td></tr>
            <tr><th><FormattedMessage id="last-update" defaultMessage="Last update" /></th><td>{moment(tx.updated_on).format(DATE_FORMAT)}</td></tr>
            <tr><th><FormattedMessage id="errors" defaultMessage="Errors" /></th><td>{tx.errors.length}</td></tr>
        </tbody>
    </Table>
);


const ContextTable = ({context}) => (
    <Table style={{tableLayout: 'fixed'}}>
        <tbody>
        {
            context.sort((a, b) => {
                if(a.id < b.id) return 1;
                if(a.id > b.id) return -1;
                return 0;
            }).map(c =>
                <tr key={c.id}><th>{c.key}</th><td style={{wordWrap:'break-word'}}>{c.value}</td></tr>
            )
        }
        </tbody>
    </Table>
);


const RELOAD_TX = 10 * 1000;


export class Transaction extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: undefined,
            sending: false,
            activeTab: 1,
            messages: [],
            messageShown: true,
            subrequests: [],
            subrequestsShown: true,
            subrequests_paging_info: {page_number: 1, page_size: SUB_REQUESTS_PAGE_SIZE},
            externalCallbacks: [],
            logs: [],
            events: [],
        };
        this.cancelLoad = false;

        this.onReplay = this.onReplay.bind(this);
        this.onRollback = this.onRollback.bind(this);
        this.onForceClose = this.onForceClose.bind(this);
        this.fetchTxDetails = this.fetchTxDetails.bind(this);
        this.changeTxStatus = this.changeTxStatus.bind(this);
        this.onReopen = this.onReopen.bind(this);
        this.sendEvent = this.sendEvent.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.caseUpdated = this.caseUpdated.bind(this);
        this.caseUpdateFailure = this.caseUpdateFailure.bind(this);
        this.refreshMessages = this.refreshMessages.bind(this);
        this.refreshSubInstances = this.refreshSubInstances.bind(this);
    }

    fetchTxDetails(reload) {
        this.setState({error: undefined});
        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`, this.props.auth_token)
            .then(data => {
                if(this.cancelLoad)
                    return;

                let diffState = {tx: data};

                // devnote: if the transaction was not yet loaded and is a sub-workflow.
                if(!this.state.tx && data.callback_task_id) {
                    diffState.activeTab = 2;
                }

                if(this.state.tx && this.state.tx.status !== "ACTIVE" && data.status !== "ACTIVE") {
                    this.setState(diffState);
                    reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
                    return;
                }

                this.setState(diffState);

                data.original_request_id && fetch_get(`/api/v01/apio/requests/${data.original_request_id}`, this.props.auth_token)
                    .then(data => !this.cancelLoad && this.setState({request: data.request}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/events`, this.props.auth_token)
                    .then(data => !this.cancelLoad && this.setState({events: data.events}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/logs`, this.props.auth_token)
                    .then(data => !this.cancelLoad && this.setState({
                        logs: data.logs.map(l => {l.type='log'; l.source_entity=l.source; l.content=l.message; return l;})
                    }))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/apio/transactions/${this.props.match.params.txId}/callbacks`, this.props.auth_token)
                    .then(data => !this.cancelLoad && this.setState({externalCallbacks: data.callbacks}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                if(this.state.messageShown) {
                    this.refreshMessages();
                }
                if(this.state.subrequestsShown) {
                    this.refreshSubInstances();
                }
                
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
            })
            .catch(error => {
                if(this.cancelLoad)
                    return;
                let error_msg = undefined;
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
                if(error.response === undefined) {
                    this.props.notifications.addNotification({
                        title: <FormattedMessage id="fetch-tx-failed" defaultMessage="Fetch transaction failed!"/>,
                        message: error.message,
                        level: 'error'
                    });
                    return;
                }
                switch(error.response.status) {
                    case 404: error_msg = <FormattedMessage id="unknown-transaction" defaultMessage="Unknown transaction." />; break;
                    case 403: error_msg = <FormattedMessage id="not-allowed-transaction" defaultMessage="You are not allowed to see this transaction." />; break;
                    default: error_msg = <FormattedMessage id="unknown-error" defaultMessage="Unknown error: {status}" values={{status: error.response.status}} />;
                }
                this.setState({error: new Error(error_msg)})
            });
    }

    componentDidMount() {
        this.fetchTxDetails(true);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.match.params.txId !== this.props.match.params.txId) {
            this.setState({
                activeTab: 1,
                tx: undefined,
                request: undefined,
                logs: [],
                events: [],
                externalCallbacks: [],
                messages: [],
                subrequests: [],
                subrequests_paging_info: {page_number: 1, page_size: SUB_REQUESTS_PAGE_SIZE}
            });
            this.fetchTxDetails(false);
        }
    }

    onReplay(activity_id, task_id) {
        this.setState({replaying: true});
        fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {}, this.props.auth_token)
            .then(() => {
                !this.cancelLoad && this.setState({replaying: false});
                this.fetchTxDetails(false);
                this.props.notifications.addNotification({
                        message: <FormattedMessage id="task-replayed" defaultMessage="Task replayed!"/>,
                        level: 'success'
                });
            })
            .catch(error => {
                !this.cancelLoad && this.setState({replaying: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!"/>,
                    message: error.message,
                    level: 'error'
                });
            })
    }

    onRollback(activity_id, task_id, replay_behaviour) {
        this.setState({replaying: true});
        const meta = JSON.stringify({replay_behaviour: replay_behaviour});
        const action = titleCase(replay_behaviour);
        fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}?meta=${meta}`, {}, this.props.auth_token)
            .then(() => {
                !this.cancelLoad && this.setState({replaying: false});
                this.fetchTxDetails(false);
                this.props.notifications.addNotification({
                        message: <FormattedMessage id="rollback-triggered" defaultMessage="{action} triggered!" values={{action: action}}/>,
                        level: 'success'
                });
            })
            .catch(error => {
                !this.cancelLoad && this.setState({replaying: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="rollback-failed" defaultMessage="{action} failed!" values={{action: action}}/>,
                    message: error.message,
                    level: 'error'
                });
            })
    }

    refreshMessages() {
        this.state.tx.tasks.map(t => {
            const task_name = t.cell_id;
            fetch_get(`/api/v01/apio/transactions/${this.state.tx.id}/tasks/${t.id}/traces`, this.props.auth_token)
                .then(data => {
                    const missing_messages = data.traces.filter(
                        t => this.state.messages.findIndex(m => m.processing_trace_id === t.processing_trace_id) === -1
                    ).map(m => update(m, {'task_name' : {'$set' : task_name}}));

                    !this.cancelLoad && this.setState({
                        messages: update(
                            this.state.messages, {
                                '$push': missing_messages,
                            })
                    });
                })
                .catch(error => console.error(error));
            return t;
        });
    }

    refreshSubInstances(p) {
        const {subrequests_paging_info} = this.state;
        const url = new URL(API_URL_PREFIX + `/api/v01/apio/transactions/${this.state.tx.id}/sub_requests`);
        // paging
        const paging_spec = p === undefined ? subrequests_paging_info : update(subrequests_paging_info, {$merge: p});
        url.searchParams.append('paging', JSON.stringify(paging_spec));

        fetch_get(url, this.props.auth_token)
            .then(data => {
                !this.cancelLoad && this.setState({
                    subrequests: data.requests,
                    subrequests_pagination: {
                        page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                        page_size: data.pagination[1],
                        num_pages: data.pagination[2],
                        total_results: data.pagination[3],
                    },
                    subrequests_paging_info: paging_spec,
                });
            })
            .catch(error => console.error(error));
    }

    changeTxStatus(new_status) {
        fetch_put(`/api/v01/transactions/${this.state.tx.id}`, {status: new_status}, this.props.auth_token)
            .then(() =>
                this.state.tx.original_request_id &&
                fetch_put(`/api/v01/apio/requests/${this.state.tx.original_request_id}`, {status: new_status === "CLOSED_IN_ERROR"?"ERROR":new_status}, this.props.auth_token)
                    .then(() => {
                        this.fetchTxDetails(false);
                        this.props.notifications.addNotification({
                            message: <FormattedMessage id="instance-status-changed" defaultMessage="Instance status updated!"/>,
                            level: 'success'
                        });
                    })
                    .catch(error => this.props.notifications.addNotification({
                            title: <FormattedMessage id="instance-update-failed" defaultMessage="Instance status update failed!"/>,
                            message: error.message,
                            level: 'error'
                        })
                    )
            )
            .catch(error => this.props.notifications.addNotification({
                    title: <FormattedMessage id="instance-update-failed" defaultMessage="Instance status update failed!"/>,
                    message: error.message,
                    level: 'error'
                })
            )
    }

    caseUpdated() {
        this.props.notifications.addNotification({
            message: <FormattedMessage id="case-updated" defaultMessage="Case updated!"/>,
            level: 'success'
        });
        this.fetchTxDetails(false);
    }

    caseUpdateFailure(error) {
        this.props.notifications.addNotification({
            title: <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!"/>,
            message: error.message,
            level: 'error'
        });
    }

    onForceClose() {
        this.changeTxStatus("CLOSED_IN_ERROR")
    }

    onReopen() {
        this.changeTxStatus("ACTIVE")
    }

    sendEvent(value, trigger_type, extra) {
        this.setState({sending: true});
        fetch_post(
            `/api/v01/transactions/${this.state.tx.id}/events`,
            {
                trigger_type: trigger_type,
                value: value,
                ...extra,
            },
            this.props.auth_token
        )
        .then(() => {
            this.caseUpdated();
            setTimeout(() => !this.cancelLoad && this.setState({sending: false}), RELOAD_TX);
        })
        .catch(error => {
            this.caseUpdateFailure(error);
            !this.cancelLoad && this.setState({sending: false});
        });
    }

    onEdit() {
        this.setState({edit_request: true})
    }

    render() {
        const {error, tx, request, events, logs, activeTab, replaying, messages, subrequests, messageShown, subrequestsShown, subrequests_pagination, externalCallbacks} = this.state;
        const {user_info} = this.props;

        const raw_event = events && (request ? events.filter(e => e.event_id === request.event_id)[0] : events[0]);

        let alerts = [];
        if(error) {
            alerts.push(
                <Alert bsStyle="danger" key='fail-fetch-tx'>
                    <p>{error.message || error}</p>
                </Alert>
            );
        }
        if(request && request.status === 'ERROR') {
            alerts.push(
                <Alert bsStyle="danger" key='request-error'>
                    <FormattedMessage id="request-error" defaultMessage="The request ended in error. (see workflow for details)"/>
                </Alert>
            );
        }
        if(tx && tx.tasks.filter(t => t.status === 'ERROR').length !== 0 && tx.status === 'ACTIVE') {
            alerts.push(
                <Alert bsStyle="warning" key='blocking-error'>
                    <FormattedMessage id="blocking-error" defaultMessage="The request is blocked and needs manual intervention. (see workflow for details)"/>
                </Alert>
            );
        }
        if(tx && tx.super_instance) {
            alerts.push(
                <Alert bsStyle="info" key='super-instance'>
                    <FormattedMessage id="super-instance-link" defaultMessage="The request is a sub-instance of the request: "/>
                    <Link to={`/transactions/${tx.super_instance.id}`}>{tx.super_instance.id}</Link>
                </Alert>
            );
        }

        if(!tx && error) {
            return <div>{alerts}</div>
        } else if (!tx) {
            return <div><FormattedMessage id='loading' defaultMessage='Loading...'/></div>
        }

        // let actions_required = [];
        // add a user profile check to see if the user *can* approve/reject/hold
        const can_act = isAllowed(user_info.ui_profile, pages.requests_nprequests, access_levels.modify);

        return (
            <div>
                {alerts}
                <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({activeTab: e})} id="request-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
                        <Col xs={12} sm={6} md={8} lg={8} style={{marginTop: '10px'}}>
                            <Panel>
                                <Panel.Body>
                                {
                                    raw_event && <ReactJson src={JSON.parse(raw_event.content)}/>
                                }
                                </Panel.Body>
                            </Panel>
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={4}>
                            <Panel style={{marginTop: "10px"}}>
                                <ButtonGroup vertical block>
                                    {
                                        tx.status === "ACTIVE" &&
                                        <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>
                                    }
                                    {
                                        tx.status !== "ACTIVE" &&
                                        <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>
                                    }
                                </ButtonGroup>
                            </Panel>
                            { tx.context && tx.context.length !== 0 &&
                                <Panel header="Context">
                                    <ContextTable context={tx.context}/>
                                </Panel>
                            }
                        </Col>
                        <Col xs={12} sm={12} md={12} lg={12}>
                            <Panel>
                                <Panel.Heading>
                                    <Panel.Title><FormattedMessage id="comments" defaultMessage="Comments" /></Panel.Title>
                                </Panel.Heading>
                                <Panel.Body>
                                    <Comments req_id={tx.id} {...this.props} />
                                </Panel.Body>
                            </Panel>
                        </Col>
                    </Tab>
                    <Tab
                        eventKey={2}
                        title={
                            <div>
                                <FormattedMessage id="workflow" defaultMessage="Workflow" /> {tx.errors.length !== 0 && <Badge style={{backgroundColor: '#ff0808'}}>{tx.errors.length}</Badge>}
                            </div>
                        }>
                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="summary" defaultMessage="Summary" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <TxTable tx={tx} request={request}/>
                            </Panel.Body>
                        </Panel>

                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <TransactionFlow definition={tx.definition} states={tx.tasks} />
                                <TasksTable
                                    tasks={tx.tasks}
                                    onReplay={this.onReplay}
                                    onRollback={this.onRollback}
                                    user_can_replay={can_act && tx.status === 'ACTIVE' && !replaying}
                                    tx_id={tx.id}
                                />
                            </Panel.Body>
                        </Panel>

                        {
                            messages.length !== 0 && (
                                <Panel
                                    expanded={messageShown}
                                    onToggle={e => {
                                        this.setState({messageShown: e});
                                        e && this.refreshMessages();
                                    }}
                                >
                                    <Panel.Heading>
                                        <Panel.Title toggle>
                                            <FormattedMessage id="messages" defaultMessage="Messages"/>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <MessagesTable
                                            messages={messages}
                                            tasks={tx.tasks}
                                            {...this.props}
                                        />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            subrequests.length !== 0 && (
                                <Panel
                                    expanded={subrequestsShown}
                                    onToggle={e => {
                                        this.setState({subrequestsShown: e});
                                        e && this.refreshSubInstances();
                                    }}
                                >
                                    <Panel.Heading>
                                        <Panel.Title toggle>
                                            <FormattedMessage id="sub-instances" defaultMessage="Sub instances"/>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <SubRequestsTable
                                            subrequests={subrequests}
                                            tasks={tx.tasks}
                                            onReplay={this.onReplay}
                                            onRollback={this.onRollback}
                                            {...this.props}
                                        />
                                        <Pagination
                                            onChange={this.refreshSubInstances}
                                            page_number={subrequests_pagination.page_number}
                                            num_pages={subrequests_pagination.num_pages}
                                            total_results={subrequests_pagination.total_results}
                                        />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            tx.errors.length !== 0 && (
                                <Panel bsStyle="danger" defaultExpanded={true}>
                                    <Panel.Heading>
                                        <Panel.Title toggle>
                                            <FormattedMessage id="errors" defaultMessage="Errors"/>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <Errors errors={tx.errors} user_info={user_info}/>
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            externalCallbacks.length !== 0 && (
                                <Panel defaultExpanded={true}>
                                    <Panel.Heading>
                                        <Panel.Title toggle>
                                            <FormattedMessage id="external-callbacks" defaultMessage="External callbacks"/>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <ExternalCallbacks callbacks={externalCallbacks} tasks={tx.tasks} />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            (events.length !== 0 || logs.length !== 0) && (
                                <Panel defaultExpanded={false}>
                                    <Panel.Heading>
                                        <Panel.Title toggle><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <Events events={events} logs={logs} />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                    </Tab>
                </Tabs>
            </div>)
    }
}


export class Request extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // error: undefined,
            messages: [],
        };
        this.cancelLoad = false;
        this.fetchDetails = this.fetchDetails.bind(this);
    }

    fetchDetails() {
        fetch_get(`/api/v01/apio/requests/${this.props.match.params.reqId}`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({request: data.request}))
            .catch(error =>
                !this.cancelLoad && this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-req-failed" defaultMessage="Fetch request failed!" />,
                    message: error.message,
                    level: 'error'
                })
            );

        fetch_get(`/api/v01/apio/requests/${this.props.match.params.reqId}/traces`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({messages: data.traces}))
            .catch(error =>
                !this.cancelLoad && this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-messages-failed" defaultMessage="Fetch request traces failed!" />,
                    message: error.message,
                    level: 'error'
                })
            );
    }

    componentDidMount() {
        this.fetchDetails();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        const {request, messages} = this.state;

        if (!request) {
            return <div><FormattedMessage id='loading' defaultMessage='Loading...'/></div>
        }

        const request_entity = request.entities[0];
        const raw_event = request_entity.details;

        const request_ = Object.keys(raw_event).filter(k => !["response", "user"].includes(k)).reduce(
            (obj, key) => {
                obj[key] = raw_event[key];
                return obj;
            }, {}
        );
        const response_ = raw_event.response;
        const username = raw_event.user;

        return (
            <div>
                <Col xs={12} sm={6} md={8} lg={8} style={{marginTop: '10px'}}>
                    <Panel>
                        <Panel.Body>
                        {
                            raw_event && (
                                <div>
                                    <ReactJson src={request_} name={"Request"}/><hr/>
                                    <ReactJson src={response_} name={"Response"}/><hr/>
                                </div>
                            )
                        }
                        </Panel.Body>
                    </Panel>
                </Col>
                <Col xs={12} sm={6} md={4} lg={4}>
                    <Panel style={{marginTop: "10px"}}>
                        <Panel.Body>
                            <Table condensed>
                                <tbody>
                                    <tr><th><FormattedMessage id="requset-id" defaultMessage="Request ID" /></th><td>{ request.request_id }</td></tr>
                                    <tr><th><FormattedMessage id="request-status" defaultMessage="Request status" /></th><td>{ request.status }</td></tr>
                                    <tr><th><FormattedMessage id="username" defaultMessage="Username" /></th><td>{ username }</td></tr>
                                    <tr><th><FormattedMessage id="target-type" defaultMessage="Target type" /></th><td>{ request_entity.entity_type }</td></tr>
                                    <tr><th><FormattedMessage id="creation-date" defaultMessage="Creation date" /></th><td>{ request.created_on }</td></tr>
                                </tbody>
                            </Table>
                        </Panel.Body>
                    </Panel>
                </Col>

                <Col xs={12} sm={12} md={12} lg={12}>
                    {
                        messages.length !== 0 && (
                            <Panel>
                                <Panel.Heading>
                                    <Panel.Title>
                                        <FormattedMessage id="messages" defaultMessage="Messages"/>
                                    </Panel.Title>
                                </Panel.Heading>
                                <Panel.Body>
                                    <MessagesTable
                                        messages={messages}
                                        {...this.props}
                                    />
                                </Panel.Body>
                            </Panel>
                        )
                    }
                </Col>
            </div>
        )
    }
}


export const errorCriteria = {
    task_status: {model: 'tasks', value: 'ERROR', op: 'eq'}
};


const callbackErrorCriteria = {
    end_task_status: {
        and: [
            {
                model: 'tasks',
                field: 'status',
                op: 'eq',
                value: 'ERROR'
            },
            {
                model: 'tasks',
                field: 'cell_id',
                op: "eq",
                value: "end"
            }
        ]
    }
};


export const activeCriteria = {
    status: {model: 'instances', value: 'ACTIVE', op: 'eq'}
};

const AutoRefreshTime = 10;

export class Requests extends Component{
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            filter_criteria: Requests.criteria_from_params(this.props.location.search, this.props.user_info.ui_profile),
            paging_info: {
                page_number: 1, page_size: 50
            },
            sorting_spec : [{
                model: 'requests', field: 'created_on', direction: 'desc'
            }],

            requests: [],
            pagination: {
                page_number: 1,
                num_pages: 1,
            },
            error: undefined,
            auto_refresh: false,
            auto_refresh_remaining: AutoRefreshTime,
        };
        this._refresh = this._refresh.bind(this);
        this._load_activities = this._load_activities.bind(this);
        this._prepare_url = this._prepare_url.bind(this);
    }

    static default_criteria(ui_profile) {
        return {
            activity_id: {model: 'instances', value: '', op: 'eq'},
            tenant_id: {model: 'request_entities', value: '', op: 'eq'},
            site_id: {model: 'request_entities', value: '', op: 'eq'},
            number: {model: 'request_entities', value: '', op: 'like'},
            status: {model: 'instances', value: '', op: 'eq'},
            kind: {model: 'instances', value: '', op: 'eq'},
            created_on: {model: 'requests', value: '', op: 'ge'},
            request_status: {model: 'requests', value: '', op: 'eq'},
            label: {model: 'bulks', value: '', op: 'eq'},
            task_status: undefined,
            end_task_status: undefined,
        }
    }

    static criteria_from_params(url_params, ui_profile) {
        const params = queryString.parse(url_params);
        let custom_params = {};
        if (params.filter !== undefined) {
            try {
                custom_params = JSON.parse(params.filter);
            } catch (e) { console.error(e) }
        }
        return update(
            Requests.default_criteria(ui_profile),
            {$merge: custom_params}
        );
    }

    componentDidMount() {
        this._load_activities();
        this._refresh();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this.autoRefreshHandler && clearInterval(this.autoRefreshHandler);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname === this.props.location.pathname &&
            nextProps.location.search !== this.props.location.search) {
            this.setState({
                filter_criteria: Requests.criteria_from_params(nextProps.location.search, nextProps.user_info.ui_profile)
            });
        }
    }

    _load_activities() {
        fetch_get('/api/v01/activities', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => console.error(error))
    }

    _prepare_url(paging_spec, sorting_spec, format) {
        let url = new URL(API_URL_PREFIX + '/api/v01/apio/requests/search');
        // filter
        const {filter_criteria} = this.state;
        let filter_spec = Object.keys(filter_criteria)
            .filter(f =>
                filter_criteria[f] &&
                (
                    (filter_criteria[f].value && filter_criteria[f].op) ||
                    filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_null' ||
                    filter_criteria[f].op === 'is_not_null' || typeof(filter_criteria[f].value) === 'boolean'
                )
            )
            .map(f => {
                switch(f) {
                    case 'number':
                        // special handling to look into the ranges of the requests
                        return {
                            model: 'request_entities',
                            field: 'numbers',
                            op: filter_criteria[f].op,
                            value: '%' + filter_criteria[f].value.trim() + '%'
                        };
                    case 'task_status':
                    case 'request_status':
                        return {
                            model: filter_criteria[f].model,
                            field: 'status',
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    case 'activity_id':
                        return {
                            model: filter_criteria[f].model,
                            field: f,
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    case 'end_task_status':
                        // filter transparently sent
                        return filter_criteria[f];
                    default:
                        return {
                            model: filter_criteria[f].model, // needed in multi-model query
                            field: f,
                            op: filter_criteria[f].op,
                            value: f === 'created_on' || f === 'due_date' ?
                                moment(filter_criteria[f].value, 'DD/MM/YYYY HH:mm').format() :
                                filter_criteria[f].value.trim()
                        }
                }
            });
        url.searchParams.append('filter', JSON.stringify(filter_spec));
        // paging
        if(paging_spec !== undefined) {
            url.searchParams.append('paging', JSON.stringify(paging_spec));
        }
        //sorting
        if(sorting_spec !== undefined) {
            url.searchParams.append('sorting', JSON.stringify(sorting_spec));
        }
        //formatting
        if(format !== undefined){
            url.searchParams.append('as', format);
        }
        return url;
    }

    _refresh(p, s) {
        let {paging_info, sorting_spec, filter_criteria} = this.state;
        // override paging and sorting if needed
        if(p !== undefined) {
            paging_info = update(this.state.paging_info, {$merge: p});
        }
        if(s !== undefined) {
            sorting_spec = [s];
        }

        // get the export URL
        const url = this._prepare_url(paging_info, sorting_spec);
        let export_url = this._prepare_url(undefined, sorting_spec, 'csv');
        export_url.searchParams.append('auth_token', this.props.auth_token);

        //reset collection
        this.setState({requests: undefined});

        fetch_get(url, this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                // devnote: save in the history the search.
                const filter_spec = Object.keys(filter_criteria)
                    .filter(f => filter_criteria[f] && (
                        (filter_criteria[f].value && filter_criteria[f].op) ||
                        filter_criteria[f].or ||
                        filter_criteria[f].and ||
                        filter_criteria[f].in ||
                        filter_criteria[f].op === 'is_null' ||
                        filter_criteria[f].op === 'is_not_null'
                    )).reduce((obj, key) => {
                        obj[key] = filter_criteria[key];
                        return obj;
                    }, {});

                if(Object.keys(filter_spec).length !== 0) {
                    const search_str = queryString.stringify(
                        {
                            filter: JSON.stringify(filter_spec),
                            paging_info: paging_info, // not used: RFU
                            sorting_spec: sorting_spec // not used: RFU
                        }
                    );
                    this.props.history.push(this.props.location.pathname + '?' + search_str);
                }

                this.setState({
                     requests: data.requests.map(c => {
                        c.created_on = c.created_on?moment(c.created_on).format(DATE_FORMAT):null;
                        c.updated_on = c.updated_on?moment(c.updated_on).format(DATE_FORMAT):null;
                        return c;
                     }),
                     pagination: {
                         page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                         page_size: data.pagination[1],
                         num_pages: data.pagination[2],
                         total_results: data.pagination[3],
                     },
                     sorting_spec: data.sorting || [],
                     export_url: export_url.href
                });
            })
            .catch(error => !this.cancelLoad && this.setState({error: error}));
    }

    render() {
        const {filter_criteria, requests, activities, export_url, auto_refresh} = this.state;
        const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm").isValid();

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={false} >
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" />
                            <Checkbox
                                className="pull-right"
                                style={{marginTop:0}}
                                checked={auto_refresh}
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                    this.setState({auto_refresh: e.target.checked});
                                    if(e.target.checked) {
                                        this.autoRefreshHandler = setInterval(() => {
                                            let {auto_refresh_remaining} = this.state;
                                            --auto_refresh_remaining;
                                            if(auto_refresh_remaining < 0) {
                                                auto_refresh_remaining = AutoRefreshTime;
                                                this._refresh();
                                            }
                                            this.setState({auto_refresh_remaining: auto_refresh_remaining});
                                        }, 1000);

                                    } else {
                                        clearInterval(this.autoRefreshHandler);
                                        this.setState({auto_refresh_remaining: AutoRefreshTime});
                                    }
                                }}
                            >
                                {
                                    auto_refresh ?
                                    <FormattedMessage id="remaining secs" defaultMessage="refresh in {r} secs" values={{r: this.state.auto_refresh_remaining}}/>
                                    :<FormattedMessage id="auto-refresh" defaultMessage="auto-refresh"/>
                                }
                            </Checkbox>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body collapsible>
                        <Form horizontal>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="bulk-label" defaultMessage="Bulk label" />
                                </Col>

                                <Col smOffset={1} sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.label.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {label: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="workflow" defaultMessage="Workflow" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.activity_id.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {activity_id: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                        <FormattedMessage id="proxy-none" defaultMessage="proxied (none)" >
                                            {
                                                message => <option value="is_null">{message}</option>
                                            }
                                        </FormattedMessage>
                                        <FormattedMessage id="not proxy" defaultMessage="not proxied (any)" >
                                            {
                                                message => <option value="is_not_null">{message}</option>
                                            }
                                        </FormattedMessage>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl
                                        componentClass="select"
                                        disabled={["is_null", "is_not_null"].includes(filter_criteria.activity_id.op)}
                                        value={filter_criteria.activity_id.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {activity_id: {$merge: {value: e.target.value && parseInt(e.target.value, 10)}}})
                                        })}>
                                        <option value='' />
                                        {
                                            activities && activities.sort((a, b) => {
                                                if(a.name > b.name) return 1;
                                                if(a.name < b.name) return -1;
                                                return 0
                                            }).map(
                                                a => <option value={a.id} key={a.id}>{a.name}</option>
                                            )
                                        }
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="workflow-status" defaultMessage="Workflow status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.status.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.status.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="CLOSED_IN_ERROR">CLOSED_IN_ERROR</option>
                                        <option value="CLOSED_IN_SUCCESS">CLOSED_IN_SUCCESS</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="request-status" defaultMessage="Request status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.request_status.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {request_status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.request_status.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {request_status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="FAILED">FAILED</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="tenant-id" defaultMessage="Tenant ID" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.tenant_id.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {tenant_id: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.tenant_id.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {tenant_id: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="site-id" defaultMessage="Site ID" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.site_id.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {site_id: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.site_id.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {site_id: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="number" defaultMessage="Number" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl componentClass="select" value="like" readOnly>
                                        <option value="like">like</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.number && filter_criteria.number.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {number: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={invalid_created_on?"error":null}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="created-on" defaultMessage="Created on" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.created_on.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {created_on: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="gt">&gt;</option>
                                        <option value="ge">&gt;=</option>
                                        <option value="lt">&lt;</option>
                                        <option value="le">&lt;=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <DatePicker
                                        className="form-control"
                                        selected={filter_criteria.created_on.value.length !== 0?moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm"):null}
                                        onChangeRaw={d => {
                                            this.setState({
                                                filter_criteria: update(
                                                    this.state.filter_criteria,
                                                    {created_on: {$merge: {value: d.target.value}}})
                                            });
                                            d.target.value.length === 0 && d.preventDefault();
                                        }}
                                        onChange={d => this.setState({
                                            filter_criteria: update(
                                                this.state.filter_criteria,
                                                {created_on: {$merge: {value: d.format("DD/MM/YYYY HH:mm")}}})
                                        })}
                                        dateFormat="DD/MM/YYYY HH:mm"
                                        locale="fr-fr"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={60}/>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="flags" defaultMessage="Flags" />
                                </Col>

                                <Col smOffset={1} sm={8}>
                                    <Checkbox
                                        checked={filter_criteria.task_status && filter_criteria.task_status.value === 'ERROR'}
                                        onChange={e => (
                                            e.target.checked ?
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$merge: errorCriteria})
                                                }) :
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$unset: ['task_status']})
                                                })
                                        )} >
                                        <FormattedMessage id="with-errors" defaultMessage="With errors" />
                                    </Checkbox>

                                    <Checkbox
                                        checked={filter_criteria.end_task_status}
                                        onChange={e => (
                                            e.target.checked ?
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$merge: callbackErrorCriteria})
                                                }) :
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$unset: ['end_task_status']})
                                                })
                                        )} >
                                        <FormattedMessage id="with-end-in-error" defaultMessage="With end in error" />
                                    </Checkbox>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col smOffset={1} sm={1}>
                                    <Button bsStyle="info" onClick={() => this._refresh({page_number: 1})} disabled={invalid_created_on}>
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
                            sorting_spec={this.state.sorting_spec}
                            headers={[
                                {
                                    title: '#', field: 'request_id', model: 'requests',
                                    render: n =>
                                        n.instance_id ?
                                            <Link to={`/transactions/${n.instance_id}`}>I{n.instance_id}</Link> :
                                            <Link to={`/requests/${n.request_id}`}>R{n.request_id}</Link>,
                                    sortable: true,
                                    style: {width: '50px', wordWrap: 'undefined'}
                                },
                                {
                                    title: <FormattedMessage id="workflow" defaultMessage="Workflow" />,
                                    field: 'activity_id', model: 'instances',
                                    render: n => activities && n.activity_id ? activities.find(a => a.id === n.activity_id).name : "-"
                                },
                                {
                                    title: <FormattedMessage id="tenant" defaultMessage="Tenant" />,
                                    field: 'tenant_id', model: 'request_entities',
                                },
                                {
                                    title: <FormattedMessage id="site" defaultMessage="Site" />,
                                    field: 'site_id', model: 'request_entities',
                                },
                                {
                                    title: <FormattedMessage id="user-s" defaultMessage="User(s)" />,
                                    field: 'numbers', model: 'request_entities',
                                    style: {
                                        //whiteSpace: 'nowrap',
                                        //width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        overflowWrap: 'unset',
                                        wordWrap:'break-word'
                                    },
                                },
                                {
                                    title: <FormattedMessage id="status" defaultMessage="Status" />,
                                    field: 'status', model: 'requests', sortable: true,
                                    render: n => n.status
                                },
                                {
                                    title: <FormattedMessage id="owner" defaultMessage="Owner" />,
                                    field: 'username'
                                },
                                {
                                    title: <FormattedMessage id="created-on" defaultMessage="Created on" />,
                                    field: 'created_on', model: 'requests', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: <FormattedMessage id="updated-on" defaultMessage="Updated on" />,
                                    field: 'updated_on', model: 'requests', sortable: true, style: {width: '200px'}
                                },
                            ]}
                            pagination={this.state.pagination}
                            data={requests}
                            labels={requests && requests.map(r => r.label)}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            />
                    </Panel.Body>
                </Panel>

                <Panel>
                    <Panel.Body>
                        <Button
                            bsStyle="primary"
                            href={export_url}
                            disabled={export_url === undefined}
                        >
                            <FormattedMessage id="export-as-csv" defaultMessage="Export as CSV"/>
                        </Button>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}


export class CustomRequests extends Component{
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            filter_criteria: CustomRequests.criteria_from_params(this.props.location.search, this.props.user_info.ui_profile),
            paging_info: {
                page_number: 1, page_size: 50
            },
            sorting_spec : [{
                model: 'instances', field: 'created_on', direction: 'desc'
            }],

            requests: [],
            pagination: {
                page_number: 1,
                num_pages: 1,
            },
            error: undefined,
            auto_refresh: false,
            auto_refresh_remaining: AutoRefreshTime,
        };
        this._refresh = this._refresh.bind(this);
        this._load_activities = this._load_activities.bind(this);
        this._prepare_url = this._prepare_url.bind(this);
    }

    static default_criteria(ui_profile) {
        return {
            status: {value: '', op: 'eq'},
            created_on: {value: '', op: 'ge'},
            method: {model: 'events', value: '', op: 'eq'},
            url: {model: 'events', value: '', op: 'like'},
            user: {value: '', op: 'eq'},
            task_status: undefined,
        }
    }

    static criteria_from_params(url_params, ui_profile) {
        const params = queryString.parse(url_params);
        let custom_params = {};
        if (params.filter !== undefined) {
            try {
                custom_params = JSON.parse(params.filter);
            } catch (e) { console.error(e) }
        }
        return update(
            CustomRequests.default_criteria(ui_profile),
            {$merge: custom_params}
        );
    }

    componentDidMount() {
        this._load_activities();
        this._refresh();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this.autoRefreshHandler && clearInterval(this.autoRefreshHandler);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname === this.props.location.pathname &&
            nextProps.location.search !== this.props.location.search) {
            this.setState({
                filter_criteria: CustomRequests.criteria_from_params(nextProps.location.search, nextProps.user_info.ui_profile)
            });
        }
    }

    _load_activities() {
        fetch_get('/api/v01/activities', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => console.error(error))
    }

    _prepare_url(paging_spec, sorting_spec, format) {
        let url = new URL(API_URL_PREFIX + '/api/v01/custom_instances/search');
        // filter
        const {filter_criteria} = this.state;
        let filter_spec = Object.keys(filter_criteria)
            .filter(f =>
                filter_criteria[f] &&
                (
                    (filter_criteria[f].value && filter_criteria[f].op) ||
                    filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_null' || typeof(filter_criteria[f].value) === 'boolean'
                )
            )
            .map(f => {
                const criteria = filter_criteria[f];
                switch(f) {
                    case 'method':
                        return {
                            model: criteria.model,
                            field: 'key',
                            op: criteria.op === "eq"?"like":"not_like",
                            value: criteria.value + " %"
                        };
                    case 'url':
                        const op = criteria.op === "ne" ? "not_like": "like";
                        const value = ["like", "ne"].indexOf(criteria.op) !== -1 ? "% %" + criteria.value + "%" : "% " + criteria.value;
                        return {
                            model: criteria.model,
                            field: 'key',
                            op: op,
                            value: value,
                        };
                    case 'task_status':
                        return {
                            model: criteria.model,
                            field: 'status',
                            op: criteria.op,
                            value: criteria.value
                        };
                    default:
                        return {
                            model: criteria.model, // needed in multi-model query
                            field: f,
                            op: criteria.op,
                            value: f === 'created_on' || f === 'due_date' ?
                                moment(criteria.value, 'DD/MM/YYYY HH:mm').format() :
                                criteria.value.trim()
                        }
                }
            });
        url.searchParams.append('filter', JSON.stringify(filter_spec));
        // paging
        if(paging_spec !== undefined) {
            url.searchParams.append('paging', JSON.stringify(paging_spec));
        }
        //sorting
        if(sorting_spec !== undefined) {
            url.searchParams.append('sorting', JSON.stringify(sorting_spec));
        }
        //formatting
        if(format !== undefined){
            url.searchParams.append('as', format);
        }
        return url;
    }

    _refresh(p, s) {
        let {paging_info, sorting_spec, filter_criteria} = this.state;
        // override paging and sorting if needed
        if(p !== undefined) {
            paging_info = update(this.state.paging_info, {$merge: p});
        }
        if(s !== undefined) {
            sorting_spec = [s];
        }

        // get the export URL
        const url = this._prepare_url(paging_info, sorting_spec);
        let export_url = this._prepare_url(undefined, sorting_spec, 'csv');
        export_url.searchParams.append('auth_token', this.props.auth_token);

        //reset collection
        this.setState({requests: undefined});

        fetch_get(url, this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                // devnote: save in the history the search.
                const filter_spec = Object.keys(filter_criteria)
                    .filter(f => filter_criteria[f] && (
                        (filter_criteria[f].value && filter_criteria[f].op) ||
                        filter_criteria[f].or ||
                        filter_criteria[f].and ||
                        filter_criteria[f].in ||
                        filter_criteria[f].op === 'is_null')
                    ).reduce((obj, key) => {
                        obj[key] = filter_criteria[key];
                        return obj;
                    }, {});

                if(Object.keys(filter_spec).length !== 0) {
                    const search_str = queryString.stringify(
                        {
                            filter: JSON.stringify(filter_spec),
                            paging_info: paging_info, // not used: RFU
                            sorting_spec: sorting_spec // not used: RFU
                        }
                    );
                    this.props.history.push(this.props.location.pathname + '?' + search_str);
                }

                this.setState({
                     requests: data.instances.map(c => {
                        c.created_on = c.created_on?moment(c.created_on).format(DATE_FORMAT):null;
                        c.updated_on = c.updated_on?moment(c.updated_on).format(DATE_FORMAT):null;
                        return c;
                     }),
                     pagination: {
                         page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                         page_size: data.pagination[1],
                         num_pages: data.pagination[2],
                         total_results: data.pagination[3],
                     },
                     sorting_spec: data.sorting || [],
                     export_url: export_url.href
                });
            })
            .catch(error => !this.cancelLoad && this.setState({error: error}));
    }

    render() {
        const {filter_criteria, requests, activities, export_url, auto_refresh} = this.state;
        const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm").isValid();

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="custom-requests" defaultMessage="Custom requests"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={false} >
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" />
                            <Checkbox
                                className="pull-right"
                                style={{marginTop:0}}
                                checked={auto_refresh}
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                    this.setState({auto_refresh: e.target.checked});
                                    if(e.target.checked) {
                                        this.autoRefreshHandler = setInterval(() => {
                                            let {auto_refresh_remaining} = this.state;
                                            --auto_refresh_remaining;
                                            if(auto_refresh_remaining < 0) {
                                                auto_refresh_remaining = AutoRefreshTime;
                                                this._refresh();
                                            }
                                            this.setState({auto_refresh_remaining: auto_refresh_remaining});
                                        }, 1000);

                                    } else {
                                        clearInterval(this.autoRefreshHandler);
                                        this.setState({auto_refresh_remaining: AutoRefreshTime});
                                    }
                                }}
                            >
                                {
                                    auto_refresh ?
                                    <FormattedMessage id="remaining secs" defaultMessage="refresh in {r} secs" values={{r: this.state.auto_refresh_remaining}}/>
                                    :<FormattedMessage id="auto-refresh" defaultMessage="auto-refresh"/>
                                }
                            </Checkbox>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body collapsible>
                        <Form horizontal>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="method" defaultMessage="Method" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.method.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {method: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.method.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {method: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="get">get</option>
                                        <option value="post">post</option>
                                        <option value="put">put</option>
                                        <option value="delete">delete</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="url" defaultMessage="URL" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.url.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {url: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="like">like</option>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="input" value={filter_criteria.url.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(filter_criteria,
                                                {url: {$merge: {value: e.target.value}}})
                                        })} />
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="status" defaultMessage="Status" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.status.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="eq">==</option>
                                        <option value="ne">!=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <FormControl componentClass="select" value={filter_criteria.status.value}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {status: {$merge: {value: e.target.value}}})
                                        })}>
                                        <option value='' />
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="CLOSED_IN_ERROR">CLOSED_IN_ERROR</option>
                                        <option value="CLOSED_IN_SUCCESS">CLOSED_IN_SUCCESS</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={invalid_created_on?"error":null}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="created-on" defaultMessage="Created on" />
                                </Col>

                                <Col sm={1}>
                                    <FormControl
                                        componentClass="select"
                                        value={filter_criteria.created_on.op}
                                        onChange={e => this.setState({
                                            filter_criteria: update(this.state.filter_criteria,
                                                {created_on: {$merge: {op: e.target.value}}})
                                        })}>
                                        <option value="gt">&gt;</option>
                                        <option value="ge">&gt;=</option>
                                        <option value="lt">&lt;</option>
                                        <option value="le">&lt;=</option>
                                    </FormControl>
                                </Col>

                                <Col sm={8}>
                                    <DatePicker
                                        className="form-control"
                                        selected={filter_criteria.created_on.value.length !== 0?moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm"):null}
                                        onChangeRaw={d => {
                                            this.setState({
                                                filter_criteria: update(
                                                    this.state.filter_criteria,
                                                    {created_on: {$merge: {value: d.target.value}}})
                                            });
                                            d.target.value.length === 0 && d.preventDefault();
                                        }}
                                        onChange={d => this.setState({
                                            filter_criteria: update(
                                                this.state.filter_criteria,
                                                {created_on: {$merge: {value: d.format("DD/MM/YYYY HH:mm")}}})
                                        })}
                                        dateFormat="DD/MM/YYYY HH:mm"
                                        locale="fr-fr"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={60}/>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="flags" defaultMessage="Flags" />
                                </Col>

                                <Col smOffset={1} sm={8}>
                                    <Checkbox
                                        checked={filter_criteria.task_status && filter_criteria.task_status.value === 'ERROR'}
                                        onChange={e => (
                                            e.target.checked ?
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$merge: errorCriteria})
                                                }) :
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$unset: ['task_status']})
                                                })
                                        )} >
                                        <FormattedMessage id="with-errors" defaultMessage="With errors" />
                                    </Checkbox>

                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col smOffset={1} sm={1}>
                                    <Button bsStyle="info" onClick={() => this._refresh({page_number: 1})} disabled={invalid_created_on}>
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
                            sorting_spec={this.state.sorting_spec}
                            headers={[
                                {
                                    title: '#', field: 'instance_id', model: 'requests',
                                    render: n => <Link to={`/transactions/${n.instance_id}`}>I{n.instance_id}</Link>,
                                    sortable: true,
                                    style: {width: '50px'}
                                },
                                {
                                    title: <FormattedMessage id="workflow" defaultMessage="Workflow" />,
                                    field: 'activity_id', model: 'instances', sortable: true,
                                    render: n => activities && n.activity_id ? activities.find(a => a.id === n.activity_id).name : "-"
                                },
                                {
                                    title: <FormattedMessage id="route" defaultMessage="Route" />,
                                    field: 'key', model: 'events',
                                },
                                {
                                    title: <FormattedMessage id="status" defaultMessage="Status" />,
                                    field: 'status', model: 'instances', sortable: true,
                                    render: n => n.status
                                },
                                {
                                    title: <FormattedMessage id="created-on" defaultMessage="Created on" />,
                                    field: 'created_on', model: 'instances', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: <FormattedMessage id="updated-on" defaultMessage="Updated on" />,
                                    field: 'updated_on', model: 'instances', sortable: true, style: {width: '200px'}
                                },
                            ]}
                            pagination={this.state.pagination}
                            data={requests}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            />
                    </Panel.Body>
                </Panel>

                <Panel>
                    <Panel.Body>
                        <Button
                            bsStyle="primary"
                            href={export_url}
                            disabled={export_url === undefined}
                        >
                            <FormattedMessage id="export-as-csv" defaultMessage="Export as CSV"/>
                        </Button>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
