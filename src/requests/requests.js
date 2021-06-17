import React, {Component, useState, useEffect, useRef} from 'react';
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
// import 'font-awesome/css/font-awesome.min.css';
import ReactJson from 'react-json-view';

import {
  API_URL_PREFIX,
  API_URL_PROXY_PREFIX,
  fetch_get,
  fetch_post,
  fetch_put,
  API_WS_URL,
  NotificationsManager,
  userLocalizeUtcDate,
  AuthServiceManager,
  fetch_post_raw,
  fetch_delete, downloadJson,
} from "../utils";
import {ApioDatatable, Pagination} from "../utils/datatable";

import 'react-datepicker/dist/react-datepicker.css';
import GridPic from "../orchestration/grid.gif";
import update from 'immutability-helper';
import {StaticControl} from "../utils/common";
import {access_levels, isAllowed, modules, pages} from "../utils/user";
import {TimerActions} from "./timers";
import {fetchRoles} from "../system/user_roles";
import {LinkContainer} from "react-router-bootstrap";
import {EditCellModal, fetchActivities, fetchCells, useWindowSize} from "../orchestration/activity-editor";
import {SavedFiltersFormGroup} from "../utils/searchFilters";
import {ManualActionInputForm} from "../dashboard/manualActions";
import {useDropzone} from "react-dropzone";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import {fetchInstanceContext} from "../help/templatePlayground";
import {ContextTable} from "./components";

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


export function TransactionFlow({definition, states, activityId}) {
  const [editedCell, setEditedCell] = useState();
  const [cells, setCells] = useState([]);
  const [editor, setEditor] = useState(null);
  const [prevStates, setPrevStates] = useState(null);
  const [width, height] = useWindowSize();
  const flowGraphRef = useRef(null);
  const toolbarRef = useRef(null);

  const clientWidth = flowGraphRef.current?ReactDOM.findDOMNode(flowGraphRef.current).getBoundingClientRect().width:null;

  useEffect(() => {
    if(!clientWidth) return;

    import ("../orchestration/editor").then(e => {
        if(flowGraphRef.current === null) return;
        const ed = e.default(
            ReactDOM.findDOMNode(flowGraphRef.current),
            {
                onEdit: cell => setEditedCell(cell),
            },
            {
                toolbar: ReactDOM.findDOMNode(toolbarRef.current),
            },
            {
                readOnly: true,
                height: 300,
                activityId: activityId,
            }
        )
        e.updateGraphModel(ed, { definition: workableDefinition(JSON.parse(definition), states) }, {clear: true});
        setEditor(ed);
    })
  }, [flowGraphRef, toolbarRef, clientWidth]);

  useEffect(() => {
    if(!editor) return;

    // devnote: compare the states after removing duplicates (if any) (to find out if there is a real change)
    const currentStates = states.reduce((o, c) => {o[c.cell_id] = c;return o;}, {});
    const prevStates_ = prevStates && prevStates.reduce((o, c) => {o[c.cell_id] = c;return o;}, {});
    if(prevStates && JSON.stringify(currentStates) === JSON.stringify(prevStates_)) return;

    console.log("refresh for states!!");

    import ("../orchestration/editor").then(editorScript => {
        editorScript.updateGraphModel(editor, { definition: workableDefinition(JSON.parse(definition), Object.values(currentStates)) }, {clear: true});
    })
    setPrevStates(states);
  }, [editor, states, definition]);

  useEffect(() => {
      // force the width of the container
      if (editor && flowGraphRef.current) {
        import ("../orchestration/editor").then(e => {
          e.fitEditor(editor.graph, ReactDOM.findDOMNode(flowGraphRef.current), 300)
        })
      }
    }, [height, width, editor, flowGraphRef.current]);

  useEffect(() => {
    fetchCells(setCells);
  }, []);

  return (
    <div>
      <div ref={toolbarRef} style={{position: 'absolute', zIndex: '100'}} />
      <div ref={flowGraphRef} style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />

      <EditCellModal
        show={editedCell !== undefined}
        cell={editedCell}
        onHide={() => setEditedCell(undefined)}
        cells={cells}
        activity={{definition: workableDefinition(JSON.parse(definition), [])}}
        readOnly />
    </div>
  )
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
    }
    else {
        return xmlText;
    }

    try {
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
    } catch (e) {
        console.error(e);
        return xmlText
    }
};


const XSLT_PP = "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\">\n" +
    "<xsl:output omit-xml-declaration=\"yes\" indent=\"yes\"/>\n" +
    "  <xsl:template match=\"node()|@*\">\n" +
    "    <xsl:copy><xsl:apply-templates select=\"node()|@*\"/></xsl:copy>\n" +
    "  </xsl:template>\n" +
    "</xsl:stylesheet>";


export const pp_output = (protocol, content) => {
    switch(protocol) {
        case "BS-OCI":
        case "SOAP":
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


function fetchDetails(external_id, onSuccess, onLoading, onLoaded) {
    onLoading();
    fetch_get(`${API_URL_PROXY_PREFIX}/api/v1/local/audit_records/${external_id}`)
        .then(data => onSuccess(data))
        .catch(error => console.log(error))
        .then(data => onLoaded());
}


function Message(props) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [respSyncDetails, setRespSyncDetails] = useState(false);

    useEffect(() => {
        if(expanded && entry.external_id && !entry.gateway_details) {
            fetchDetails(entry.external_id, setRespSyncDetails, () => setLoading(true), () => setLoading(false))
        }
    }, [expanded]);

    const {entry, p, userInfo} = props;
    const statusColor = entry.status < 400 ? '#a4d1a2' : '#ca6f7b';
    const expIco = expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;
    const syncDetails = entry.gateway_details || respSyncDetails;
    let rows = [
        <tr
            onClick={() => setExpanded(!expanded)}
            key={`message_summary_${entry.processing_trace_id}`}
        >
            <td style={{width: '1%'}}>{expIco}</td>
            <td style={{width: '1%'}}>{`${p+1}. `}</td>
            <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={entry.status < 400?"ok":"remove"}/></td>
            <td style={{width: '16%'}}>{entry.label}</td>
            <td style={{width: '5%'}}>{entry.status}</td>
            <td style={{width: '60%'}}>{userLocalizeUtcDate(moment.utc(entry.created_on), userInfo).format()}</td>
            <td style={{width: '15%'}}><Badge>{entry.task_name}</Badge></td>
        </tr>
    ];

    if (expanded && entry.input) {
        rows.push(
            <tr key={`message_input_${entry.processing_trace_id}`}>
                <td><Glyphicon glyph="forward"/></td>
                <td colSpan={6}>
                    <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                        # request <br/>
                        {pp_as_json(entry.input)}
                    </pre>
                </td>
            </tr>
        )
    }

    if (loading) {
        rows.push(
            <tr key={`message_loading_${entry.processing_trace_id}`}>
                <td colSpan={7}><FormattedMessage id="loading" defaultMessage="Loading..."/></td>
            </tr>
        )
    } else if (expanded) {
        rows.push(
            <tr key={`message_details_${entry.processing_trace_id}`}>
                <td><Glyphicon glyph="backward"/></td>
                <td colSpan={6}>
                    <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                        # response <br/>
                        {pp_as_json(entry.output)}
                    </pre>
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
            console.error("invalid sync details on", syncDetails);
        }
    }
    return rows;
}


export const MessagesTable = ({messages, userInfo})  => (
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
                (e, i) => <Message key={`message_${i}`} entry={e} p={i} userInfo={userInfo}/>
            )
        }
        </tbody>
    </Table>
);


function ExternalCallback(props) {
    const {entry, tasks} = props;
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

export function triggerManualAction(transactionId, actionId, output, formValues, onSuccess) {
    fetch_post(`/api/v01/transactions/${transactionId}/manual_actions/${actionId}`, {"output": output, "form": formValues})
        .then(() => onSuccess())
        .catch(error => NotificationsManager.error("Failed to trigger the action", error.message))
}

export function ManualActions(props) {
    const {actions, tasks} = props;
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetchRoles(setRoles);
    }, []);

    return (
        <Table condensed>
            <thead>
                <tr>
                    <th>id</th>
                    <th>role</th>
                    <th>task</th>
                    <th>answer</th>
                    <th>handled by</th>
                    <th>description</th>
                </tr>
            </thead>
            <tbody>
            {
                actions.sort(
                    (a, b) => a.id - b.id
                ).map(
                    (a, i) => {
                        const task = ((tasks && tasks.find(t => t.id === a.created_by_task_id)) || {}).cell_id;
                        const role = ((roles && roles.find(r => r.id === a.role_id)) || {}).name;
                        let resp = [
                            <tr key={i}>
                                <td>{a.id}</td>
                                <td>{role || "?"}</td>
                                <td>{task || "?"}</td>
                                <td>{a.output || "waiting"}</td>
                                <td>{a.handled_by_username || "-"}</td>
                                <td>{a.description}</td>
                            </tr>
                        ];
                        if(a.form_values) {
                          resp.push(
                            <tr key={`output-${i}`}>
                              <td/>
                              <td colSpan={5}>
                                <pre>
                                  {JSON.stringify(a.form_values, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )
                        }
                        return resp;
                    }
                )
            }
            </tbody>
        </Table>
    )
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
                (a, b) => a.callback_id - b.callback_id
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
        case null:
            switch(instance_.status) {
                case "CLOSED_IN_SUCCESS":
                    statusColor = '#a4d1a2';
                    statusGlyph = 'ok';
                    break;
                case "CLOSED_IN_ERROR":
                    statusColor = '#ca6f7b';
                    statusGlyph = 'remove';
                    break;
                default:
                    statusColor = '#a4d1a2';
                    statusGlyph = 'play';
            }
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


function fetchComments(tx_id, onSuccess) {
    fetch_get(`/api/v01/transactions/${tx_id}/comments?load_user_info=1`)
        .then(data => onSuccess(data.comments))
        .catch(error => NotificationsManager.error(<FormattedMessage id="failed-fetch-comment" defaultMessage="Failed to fetch comments"/>, error.message))
}

function saveComment(tx_id, comment, onSuccess) {
    fetch_post(
        `/api/v01/transactions/${tx_id}/comments`,
        {comment: comment}
    )
        .then(() => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="failed-save-comment" defaultMessage="Failed to save comment"/>, error.message))
}

export function Comments(props) {
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const {userInfo, req_id} = props;

    useEffect(() => { fetchComments(req_id, setComments) }, []);

    const closeModal = () => {
        setShowAddModal(false);
        setComment("");
    };

    return (<div>
        <Table condensed>
            <tbody>
                {comments && comments.map(c => (
                    <tr key={c.id}>
                        <th style={{width: '15%'}}>{c.user.username}<br/>{userLocalizeUtcDate(moment.utc(c.created_on), userInfo).format()}</th>
                        <td>{c.content.split('\n').map((e, i) => <div key={i}>{e}</div>)}</td>
                    </tr>
                    ))
                }
                <tr>
                    <td colSpan={4}>
                        <Button onClick={() => setShowAddModal(true)} bsStyle="info">
                            <FormattedMessage id="new-comment" defaultMessage="New comment"/>
                        </Button>
                    </td>
                </tr>
            </tbody>
        </Table>
        <Modal show={showAddModal} onHide={closeModal} backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="new-comment" defaultMessage="New comment"/></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <FormGroup controlId="comment">
                        <FormControl componentClass="textarea"
                                     placeholder="..."
                                     value={comment}
                                     onChange={e => setComment(e.target.value)}
                                     autoFocus />
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={() => saveComment(req_id, comment, () => {
                        closeModal();
                        fetchComments(req_id, setComments);
                    })}
                    bsStyle="primary"
                    disabled={comment.length === 0}>
                    <FormattedMessage id="save" defaultMessage="Save"/>
                </Button>
                <Button onClick={closeModal}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
            </Modal.Footer>
        </Modal>
    </div>);
}

function ErrorEntry(props){
    const [showDetails, setShowDetails] = useState(false);

    const {entry, userInfo} = props;
    const summary = entry.output?entry.output:"See description...";
    return (
        <tr key={entry.id}>
            <th>{entry.cell_id}</th>
            <td>
                {summary.split("\n").map((l, i) => <div key={i}>{l}<br/></div>)}
                <br/>
                <Button bsStyle="link" onClick={() => setShowDetails(true)}>...</Button>
            </td>
            <td>{userLocalizeUtcDate(moment.utc(entry.created_on), userInfo).format()}</td>
            <Modal show={showDetails} onHide={() => setShowDetails(false)}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="error-details" defaultMessage="Error details" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={entry.cell_id}/>
                        <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={userLocalizeUtcDate(moment.utc(entry.created_on), userInfo).format()}/>

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

export const Errors = ({errors, user_info}) => (
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
                e => (!e.advanced || user_info.ui_profile === "admin") && <ErrorEntry key={e.id} entry={e} userInfo={user_info} />
            )
        }
        </tbody>
    </Table>
);


export function Events(props) {
    const [showDetails, setShowDetails] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState({});

    const {events, logs, userInfo} = props;

    const closeModal = () => {
        setShowDetails(false);
        setSelectedEvent({});
    };
    const event_content = pp_as_json(selectedEvent.content);
    const extra = pp_as_json(selectedEvent.extra);
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
                                {userLocalizeUtcDate(moment.utc(e.created_on), userInfo).format()}
                            </th>
                            <td>
                                {e.content ? e.content.substr(0, 50): ""}
                                <br/>
                                <Button bsStyle="link" onClick={() => { setShowDetails(true); setSelectedEvent(e); }}>...</Button>
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
                                {userLocalizeUtcDate(moment.utc(e.created_on), userInfo).format()}
                            </th>
                            <td>
                                {e.content.substr(0, 50)}
                                <br/>
                                <Button bsStyle="link" onClick={() => { setShowDetails(true); setSelectedEvent(e); }}>...</Button>
                            </td>
                        </tr>
                    )
                )
            }
            </tbody>
        </Table>
        <Modal show={showDetails} onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="event-details" defaultMessage="Event details" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <StaticControl label={<FormattedMessage id='source' defaultMessage='Source'/>} value={selectedEvent.source_entity}/>
                    <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={selectedEvent.username}/>
                    <StaticControl label={<FormattedMessage id='when' defaultMessage='When'/>} value={userLocalizeUtcDate(moment.utc(selectedEvent.created_on), userInfo).format()}/>
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

async function fetchAttachments(txId) {
    const resp = await fetch_get(`/api/v01/transactions/${txId}/documents`)
    return resp.documents
}

function deleteAttachment(txId, docId) {
    return fetch_delete(`/api/v01/transactions/${txId}/documents/${docId}`)
}

function saveDocument(txId, description, f, onSuccess) {
    let data = new FormData();
    data.append('description', description);
    data.append('content', f, f.source);
    return fetch_post_raw(`/api/v01/transactions/${txId}/documents`, data)
      .then(r => {
          NotificationsManager.success("document saved!");
          onSuccess && onSuccess(r);
      })
}

function NewAttachmentModal(props) {
  const {show, onHide, txId, onLoaded} = props;
  const [errors, setErrors] = useState([]);
  const [loaded, setLoaded] = useState([]);
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
  } = useDropzone();

  useEffect(() => {
    if(!show) {
      setErrors([]);
      setLoaded([]);
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
          <section className="dropcontainer" >
            <div {...getRootProps({className: 'dropzone'})} >
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <aside>
              <h5>Rejected</h5>
              <ul style={{color: "red"}}>{fileRejectionItems}</ul>
              <h5>Accepted</h5>
              <ul>{acceptedFileItems}</ul>
            </aside>
          </section>

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
                    acceptedFiles.map((f, i) => {
                      saveDocument(txId, "", f, () => {
                          setLoaded(l => update(l, {$push: [i]}))
                          onLoaded && onLoaded(i, acceptedFiles.length)
                      })
                      .catch(e => setErrors(es => update(es, {$push: [{id: i, error: e.message}]})));
                    })
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

function humanFileSize(bytes, si=false, dp=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + ' ' + units[u];
}

export function Attachments({txId, userInfo}) {
    const [docs, setDocs] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchAttachments(txId)
          .then(setDocs)
          .catch(error => NotificationsManager.error("Failed to fetch documents", error.message))
    }, []);

    const closeModal = () => {
        setShowAddModal(false);
    };

    return (<div>
        <Table condensed>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>MIME type</th>
                    <th>When</th>
                    <th/>
                </tr>
            </thead>
            <tbody>
                {docs.map(doc => (
                    <tr key={doc.id}>
                        <td>{doc.name}</td>
                        <td>{doc.description}</td>
                        <td>{doc.mime_type}</td>
                        <td>{userLocalizeUtcDate(moment.utc(doc.created_on), userInfo).format()}</td>
                        <td>
                            <Button
                                bsStyle="primary"
                                onClick={() => {
                                  AuthServiceManager.getValidToken().then(token => {
                                      window.location=`${API_URL_PREFIX}/api/v01/transactions/${txId}/documents/${doc.id}?auth_token=${token}`
                                    })
                                }}
                                style={{marginLeft: '5px', marginRight: '5px'}} >
                                <Glyphicon glyph="save"/>
                            </Button>
                            <br/>{humanFileSize(doc.size_in_bytes)}
                        </td>
                        <td>
                            <DeleteConfirmButton
                                resourceName={doc.name}
                                style={{marginLeft: '5px', marginRight: '5px'}}
                                onConfirm={() => deleteAttachment(txId, doc.id).then(() => fetchAttachments(txId).then(setDocs))} />
                        </td>
                    </tr>
                    ))
                }
                <tr>
                    <td colSpan={6}>
                        <Button onClick={() => setShowAddModal(true)} bsStyle="info">
                            <FormattedMessage id="attach" defaultMessage="Attach"/>
                        </Button>
                    </td>
                </tr>
            </tbody>
        </Table>
        <NewAttachmentModal
          show={showAddModal}
          onHide={closeModal}
          onLoaded={() => fetchAttachments(txId).then(setDocs)}
          txId={txId}
          backdrop={false} />
    </div>);
}

const FORCEABLE_TASKS = [
    "delete @ENUM",
];

function timer(ms) {
 return new Promise(res => setTimeout(res, ms));
}

export const ReplayingSubInstancesModal = ({show}) => (
    <Modal show={show} backdrop={false}>
        <Modal.Header>
            <Modal.Title><FormattedMessage id="replay in progress" defaultMessage="Replay in progress..."/></Modal.Title>
        </Modal.Header>
    </Modal>
);

export const SavingModal = ({show}) => (
    <Modal show={show} backdrop={false}>
        <Modal.Header>
            <Modal.Title><FormattedMessage id="saving in progress" defaultMessage="Saving in progress..."/></Modal.Title>
        </Modal.Header>
    </Modal>
);

const titleCase = s => s[0].toUpperCase() + s.substr(1);

export const TasksTable = ({tasks, definition, onReplay, onRollback, user_can_replay, tx_id, userInfo}) => (
    <Table condensed>
        <thead>
        <tr>
            <th><FormattedMessage id="cell" defaultMessage="Cell" /></th>
            <th><FormattedMessage id="status" defaultMessage="Status" /></th>
            <th><FormattedMessage id="output" defaultMessage="Output" /></th>
            <th><FormattedMessage id="created" defaultMessage="Created" /></th>
            <th><FormattedMessage id="updated" defaultMessage="Updated" /></th>
            <th><FormattedMessage id="runtime" defaultMessage="Runtime" /></th>
            <th/>
        </tr>
        </thead>
        <tbody>
            {
                tasks.sort( (a, b) => a.id - b.id).map(t => {
                    const replayable = onReplay && user_can_replay;
                    const can_replay = (replayable || t.cell_id === 'end') && t.status === 'ERROR' &&
                        t.id === Math.max(...tasks.filter(ot => ot.cell_id === t.cell_id).map(oot => oot.id));
                    const support_rollback = definition.cells && definition.cells[t.cell_id] && definition.cells[t.cell_id].outputs.includes("rollback");
                    const support_force = FORCEABLE_TASKS.includes(t.cell_id);
                    const support_skip = definition.cells && definition.cells[t.cell_id] && definition.cells[t.cell_id].outputs.includes("skip");

                    return (
                        <tr key={t.id}>
                            <th>{t.cell_id}</th>
                            <td>{t.status}</td>
                            <td>{t.output}</td>
                            <td>{userLocalizeUtcDate(moment.utc(t.created_on), userInfo).format()}</td>
                            <td>{t.updated_on?userLocalizeUtcDate(moment.utc(t.updated_on), userInfo).format():'-'}</td>
                            <td>{t.runtime?`${t.runtime.toFixed(3)} sec(s)`:'-'}</td>
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


export const TxTable = ({tx, request, userInfo, activities}) => (
    <Table condensed>
        <tbody>
            <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{tx.id}</td></tr>
            <tr><th><FormattedMessage id="workflow" defaultMessage="Workflow" /></th><td>{activities.find(a => a.id === tx.activity_id)?.name}</td></tr>
            <tr><th><FormattedMessage id="request-status" defaultMessage="Request status" /></th><td>{request && request.status}</td></tr>
            <tr><th><FormattedMessage id="workflow-status" defaultMessage="Workflow status" /></th><td>{tx.status}</td></tr>
            <tr><th><FormattedMessage id="creation-date" defaultMessage="Creation date" /></th><td>{userLocalizeUtcDate(moment.utc(tx.created_on), userInfo).format()}</td></tr>
            <tr><th><FormattedMessage id="last-update" defaultMessage="Last update" /></th><td>{userLocalizeUtcDate(moment.utc(tx.updated_on), userInfo).format()}</td></tr>
            <tr><th><FormattedMessage id="errors" defaultMessage="Errors" /></th><td>{tx.errors.length}</td></tr>
            {
                tx.label &&
                <tr><th><FormattedMessage id="label" defaultMessage="Label" /></th><td>{tx.label}</td></tr>
            }
        </tbody>
    </Table>
);


const Timers = ({timers, onUpdate}) => (
    <Table style={{tableLayout: 'fixed'}}>
        <thead>
            <tr>
                <th>#</th>
                <th>key</th>
                <th>status</th>
                <th>run at</th>
                <th>name</th>
                <th/>
            </tr>
        </thead>
        <tbody>
        {
            timers.sort((a, b) => {
                if(a.id < b.id) return 1;
                if(a.id > b.id) return -1;
                return 0;
            }).map(c =>
                <tr key={c.id}>
                    <th>{c.id}</th>
                    <td>{c.key}</td>
                    <td>{c.status}</td>
                    <td>{c.at}</td>
                    <td style={{wordWrap:'break-word'}}>{c.name}</td>
                    <td><TimerActions timer={c} onCancel={onUpdate} onUpdate={onUpdate} /></td>
                </tr>
            )
        }
        </tbody>
    </Table>
);

function RequestBody(props) {
    const {content} = props;
    let parsedContent = content
    try {
        parsedContent = JSON.parse(content);
        if(parsedContent !== null && typeof parsedContent === "object") {
            return <ReactJson name={null} src={parsedContent}/>
        }
    } catch (e) {
        console.error(e);
    }
    return (
        <pre>{parsedContent}</pre>
    )
}

function fetchRequest(requestID, onSuccess, onError) {
  return fetch_get(`/api/v01/apio/requests/${requestID}`)
    .then(data => onSuccess && onSuccess(data.request))
    .catch(error => onError && onError(error));
}

function fetchInstance(instanceID, onSuccess, onError) {
  fetch_get(`/api/v01/transactions/${instanceID}`)
    .then(data => onSuccess && onSuccess(data))
    .catch(error => onError && onError(error));
}

const RELOAD_TX = 10 * 1000;
let USE_WS = false;
try {
    USE_WS = window.location.href ? window.location.href.includes("ws=1") : document.location.href.includes("ws=1");
} catch {
    console.error("USE_WS not set");
}

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
            subrequests_paging_info: {page_number: 1, page_size: SUB_REQUESTS_PAGE_SIZE},
            subrequestsFilter: "all",
            externalCallbacks: [],
            manualActions: [],
            logs: [],
            events: [],
            timers: [],
            autoRefresh: false,
            activities: [],
        };
        this.cancelLoad = false;
        this.websocket = null;

        this.onReplay = this.onReplay.bind(this);
        this.onRollback = this.onRollback.bind(this);
        this.onForceClose = this.onForceClose.bind(this);
        this.fetchTxDetails = this.fetchTxDetails.bind(this);
        this.completeTx = this.completeTx.bind(this);
        this.fetchDetails = this.fetchDetails.bind(this);
        this.changeTxStatus = this.changeTxStatus.bind(this);
        this.onReopen = this.onReopen.bind(this);
        this.sendEvent = this.sendEvent.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.caseUpdated = this.caseUpdated.bind(this);
        this.caseUpdateFailure = this.caseUpdateFailure.bind(this);
        this.refreshMessages = this.refreshMessages.bind(this);
        this.refreshSubInstances = this.refreshSubInstances.bind(this);
    }

    completeTx(event) {
        console.log("message received");
        const data = JSON.parse(event.data);
        if(this.cancelLoad)
            return;

        let diffState = {tx: data};

        // devnote: if the transaction was not yet loaded and is a sub-workflow.
        if(!this.state.tx && data.callback_task_id) {
            diffState.activeTab = 2;
        }

        this.setState(diffState);

        data.original_request_id && fetch_get(`/api/v01/apio/requests/${data.original_request_id}`)
            .then(data => !this.cancelLoad && this.setState({request: data.request}))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/events`)
            .then(data => !this.cancelLoad && this.setState({events: data.events}))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/logs`)
            .then(data => !this.cancelLoad && this.setState({
                logs: data.logs.map(l => {l.type='log'; l.source_entity=l.source; l.content=l.message; return l;})
            }))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/apio/transactions/${this.props.match.params.txId}/callbacks`)
            .then(data => !this.cancelLoad && this.setState({externalCallbacks: data.callbacks}))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/manual_actions`)
            .then(data => !this.cancelLoad && this.setState({manualActions: data.manual_actions}))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/transactions/${this.props.match.params.txId}/timers`)
            .then(data => !this.cancelLoad && this.setState({timers: data.timers}))
            .catch(error => !this.cancelLoad && this.setState({error: error}));

        if(this.state.messageShown) {
            this.refreshMessages();
        }
        this.refreshSubInstances();
    }

    fetchDetails() {
        this.websocket = new WebSocket(`${API_WS_URL}/api/v01/transactions/${this.props.match.params.txId}/ws?auth_token=${this.props.auth_token}`);
        this.websocket.onopen = () => this.setState({error: undefined});
        this.websocket.onmessage = this.completeTx;
        this.websocket.onerror = () => this.setState({error: "Failed to fetch details"});
        this.websocket.onclose = e => {
            switch (e.code) {
                case 4001:
                    this.setState({error: "Not found ..."});
                    break;
                case 4002:
                    this.setState({error: "You are not allowed to see this request!"});
                    break;
                case 1000:	// CLOSE_NORMAL
                    console.log("WebSocket: closed");
                    break;
                default:	// Abnormal closure
                    this.setState({error: "Trying to reconnect..."});
                    setTimeout(this.fetchDetails, 1000);
                    break;
            }
        }
    }

    fetchTxDetails(reload, full) {
        this.setState({error: undefined});
        const txId = this.props.match.params.txId;
        if(reload && this.state.tx && !this.state.autoRefresh) {
            setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
            return;
        }
        fetch_get(`/api/v01/transactions/${txId}`)
            .then(data => {
                if(this.cancelLoad)
                    return;

                let diffState = {tx: data};

                // devnote: if the transaction was not yet loaded and is a sub-workflow.
                if(!this.state.tx && data.callback_task_id) {
                    diffState.activeTab = 2;
                }

                fetch_get(`/api/v01/transactions/${txId}/timers`)
                    .then(data => !this.cancelLoad && this.setState({timers: data.timers}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                if(this.state.tx && this.state.tx.status !== "ACTIVE" && data.status !== "ACTIVE" && !full) {
                    this.setState(diffState);
                    reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
                    return;
                }

                this.setState(diffState);

                data.original_request_id && fetch_get(`/api/v01/apio/requests/${data.original_request_id}`)
                    .then(data => !this.cancelLoad && this.setState({request: data.request}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/transactions/${txId}/events`)
                    .then(data => !this.cancelLoad && this.setState({events: data.events}))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/transactions/${txId}/logs`)
                    .then(data => !this.cancelLoad && this.setState({
                        logs: data.logs.map(l => {l.type='log'; l.source_entity=l.source; l.content=l.message; return l;})
                    }))
                    .catch(error => !this.cancelLoad && this.setState({error: error}));

                fetch_get(`/api/v01/apio/transactions/${txId}/callbacks`)
                    .then(data => !this.cancelLoad && this.setState({externalCallbacks: data.callbacks}))
                    .catch(console.error);

                fetch_get(`/api/v01/transactions/${txId}/manual_actions`)
                    .then(data => !this.cancelLoad && this.setState({manualActions: data.manual_actions}))
                    .catch(console.error);

                if(this.state.messageShown) {
                    this.refreshMessages();
                }
                this.refreshSubInstances();
                
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
            })
            .catch(error => {
                if(this.cancelLoad)
                    return;
                let error_msg = undefined;
                reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
                if(error.response === undefined) {
                    NotificationsManager.error(
                      <FormattedMessage id="fetch-tx-failed" defaultMessage="Fetch transaction failed!"/>,
                      error.message
                    );
                    return;
                }
                switch(error.response.status) {
                    case 404: error_msg = "Unknown transaction."; break;
                    case 403: error_msg = "You are not allowed to see this transaction."; break;
                    default: error_msg = `Unknown error: ${error.response.status}`;
                }
                this.setState({error: new Error(error_msg)})
            });
    }

    componentDidMount() {
        document.title = `Instance - ${this.props.match.params.txId}`;
        fetchActivities(a => this.setState({activities: a}))
        USE_WS ? this.fetchDetails() : this.fetchTxDetails(true);
    }

    componentWillUnmount() {
        USE_WS && this.websocket && this.websocket.close();
        this.cancelLoad = true;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevState.tx !== undefined && prevProps.match.params.txId !== this.props.match.params.txId) {
            document.title = `Instance - ${this.props.match.params.txId}`;
            this.setState({
                activeTab: 1,
                tx: undefined,
                request: undefined,
                logs: [],
                events: [],
                externalCallbacks: [],
                manualActions: [],
                messages: [],
                subrequests: [],
                subrequests_paging_info: {page_number: 1, page_size: SUB_REQUESTS_PAGE_SIZE},
                subrequestsFilter: "all"
            });
            if(USE_WS) {
                this.websocket && this.websocket.send(JSON.stringify({"reload": true}));
                this.fetchDetails();
            } else {
                this.fetchTxDetails(false);
            }
        }
    }

    onReplay(activity_id, task_id) {
        const _innerReplay = ({prefix}) => {
          return fetch_put(`/${prefix || "api/v01"}/transactions/${activity_id}/tasks/${task_id}`, {})
            .then(() => {
                !this.cancelLoad && this.setState({replaying: false});
                if(USE_WS) {
                    this.websocket && this.websocket.send(JSON.stringify({"reload": true}));
                } else {
                    this.fetchTxDetails(false);
                }
                NotificationsManager.success(
                  <FormattedMessage id="task-replayed" defaultMessage="Task replayed!"/>,
                );
            })
            .catch(error => {
                !this.cancelLoad && this.setState({replaying: false});
                NotificationsManager.error(
                    <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!"/>,
                    error.message,
                );
            })
        }

        const {tx} = this.state;
        this.setState({replaying: true});

        if(tx && tx.super_instance_chain) {
          const topInstanceID = tx.super_instance_chain[tx.super_instance_chain.length-1].id;
          fetchInstance(topInstanceID, i => {
            if(i.original_request_id) {
              fetchRequest(
                i.original_request_id,
                r => _innerReplay({prefix: r.proxy_gateway_host}),
                () => { this.setState({replaying: false})}
              )
            } else {
              _innerReplay()
            }
          }, () => { this.setState({replaying: false}) })
        } else {
          const {request} = this.state;
          _innerReplay({prefix: request?.proxy_gateway_host})
        }
    }

    onRollback(activity_id, task_id, replay_behaviour) {
        this.setState({replaying: true});
        const {proxy_gateway_host} = this.state.request;
        const meta = JSON.stringify({replay_behaviour: replay_behaviour});
        const action = titleCase(replay_behaviour);
        fetch_put(`/${proxy_gateway_host || "api/v01"}/transactions/${activity_id}/tasks/${task_id}?meta=${meta}`, {})
            .then(() => {
                !this.cancelLoad && this.setState({replaying: false});
                if(USE_WS) {
                    this.websocket && this.websocket.send(JSON.stringify({"reload": true}));
                } else {
                    this.fetchTxDetails(false);
                }
                NotificationsManager.success(
                  <FormattedMessage id="rollback-triggered" defaultMessage="{action} triggered!" values={{action: action}}/>,
                );
            })
            .catch(error => {
                !this.cancelLoad && this.setState({replaying: false});
                NotificationsManager.error(
                  <FormattedMessage id="rollback-failed" defaultMessage="{action} failed!" values={{action: action}}/>,
                  error.message
                );
            })
    }

    refreshMessages() {
        this.state.tx.tasks.map(t => {
            const task_name = t.cell_id;
            fetch_get(`/api/v01/apio/transactions/${this.state.tx.id}/tasks/${t.id}/traces?details=1`)
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

    refreshSubInstances(p, f) {
        const {subrequests_paging_info, subrequestsFilter, tx} = this.state;
        const url = new URL(API_URL_PREFIX + `/api/v01/apio/transactions/${tx.id}/sub_requests`);
        // filtering
        url.searchParams.append('filter', f || subrequestsFilter);

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
                    subrequestsFilter: data.filter,
                });
            })
            .catch(error => console.error(error));
    }

    onGlobalActionSubInstances(action, subRequests) {
        const {subrequestsFilter, tx} = this.state;
        const meta = action === "skip" ? "meta=" + JSON.stringify({replay_behaviour: "skip"}) : null;
        let p = null;
        if(subRequests) {
          p = Promise.resolve({requests: subRequests});
        } else {
          const url = new URL(API_URL_PREFIX + `/api/v01/apio/transactions/${tx.id}/sub_requests`);
          // filtering (but no paging -> get all sub-instances)
          url.searchParams.append('filter', subrequestsFilter);
          p = fetch_get(url);
        }
        this.setState({replaying: true});
        p.then(async data => {
            if(this.cancelLoad) return;

            for(let i=0;i < data.requests.length;i++) {
                const r = data.requests[i];
                if(action === "force-close") {
                    if(r.instance.status !== "ACTIVE") continue;
                    fetch_put(`/api/v01/transactions/${r.instance.id}`, {status: "CLOSE_IN_ERROR"});
                } else {
                    const errorTask = r.instance.tasks.find(t => t.status === "ERROR");
                    if (!errorTask) continue;
                    fetch_put(`/api/v01/transactions/${r.instance.id}/tasks/${errorTask.task_id}?${meta}`);
                }
                await timer(500);
            }
        })
            .then(() => this.setState({replaying: false}))
            .catch(error => this.setState({replaying: false}));
    }

    changeTxStatus(new_status) {
        fetch_put(`/api/v01/transactions/${this.state.tx.id}`, {status: new_status}, this.props.auth_token)
            .then(() =>
                this.state.tx.original_request_id ?
                fetch_put(`/api/v01/apio/requests/${this.state.tx.original_request_id}`, {status: new_status === "CLOSED_IN_ERROR"?"ERROR":new_status}, this.props.auth_token)
                    .then(() => {
                        if(USE_WS) {
                            this.websocket && this.websocket.send(JSON.stringify({"reload": true}));
                        } else {
                            this.fetchTxDetails(false);
                        }
                        NotificationsManager.success(
                          <FormattedMessage id="instance-status-changed" defaultMessage="Instance status updated!"/>
                        );
                    })
                    .catch(error => NotificationsManager.error(
                        <FormattedMessage id="instance-update-failed" defaultMessage="Instance status update failed!"/>,
                        error.message
                      )
                    )
                : this.fetchTxDetails(false)
            )
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="instance-update-failed" defaultMessage="Instance status update failed!"/>,
                error.message
              )
            )
    }

    caseUpdated() {
        NotificationsManager.success(
            <FormattedMessage id="case-updated" defaultMessage="Case updated!"/>
        );
        if(USE_WS) {
            this.websocket && this.websocket.send(JSON.stringify({"reload": true}));
        } else {
            this.fetchTxDetails(false);
        }
    }

    caseUpdateFailure(error) {
        NotificationsManager.error(
            <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!"/>,
            error.message
        );
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
        const {
            error,
            tx,
            request,
            events,
            logs,
            activeTab,
            replaying,
            messages,
            subrequests,
            messageShown,
            subrequests_pagination,
            externalCallbacks,
            manualActions,
            timers,
            subrequestsFilter,
            showActionForm,
            activities,
        } = this.state;
        const {user_info} = this.props;

        const original_event_id = events && ((request && request.event_id) || (events[0] && events[0].event_id));
        const raw_event = events && (request ? events.filter(e => e.event_id === request.event_id)[0] : events[0]);

        let alerts = [];
        if(error) {
            alerts.push(
                <Alert bsStyle="danger" key='fail-fetch-tx'>
                    <p>{error.message || error}</p>
                </Alert>
            );
        }
        if(tx && tx.status === 'ACTIVE' && manualActions.length !== 0) {
            manualActions
                .filter(a => !a.output && user_info.roles.find(ur => ur.id === a.role_id))
                .map(a => alerts.push(
                    <Alert bsStyle="warning" key={`request-action-${a.id}`}>
                        Action required for {user_info.roles.find(ur => ur.id === a.role_id).name}<br/>
                        {a.description} <br/>
                        <ButtonToolbar>
                            {
                            a.possible_outputs.split(",").map(o => (
                                <Button
                                    onClick={
                                        () => {
                                            !a.input_form ?
                                              triggerManualAction(tx.id, a.id, o, undefined, () => this.fetchTxDetails(false)) :
                                              this.setState({showActionForm: [a, o]})
                                        }}>
                                    {o}
                                </Button>
                            ))
                            }
                        </ButtonToolbar>
                        <ManualActionInputForm
                            show={showActionForm !== undefined}
                            action={showActionForm ? showActionForm[0]: {}}
                            output={showActionForm && showActionForm[1]}
                            onHide={() => this.setState({showActionForm: undefined})}
                            onTrigger={(a, output, values) => {
                                triggerManualAction(tx.id, a.id, output, values, () => {
                                    this.setState({showActionForm: undefined});
                                    this.fetchTxDetails(false);
                                })
                            }}
                            />
                    </Alert>
                ))
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
                  {
                    tx.super_instance_chain &&
                      <Button
                        style={{marginLeft: '5px', marginRight: '5px'}}
                        bsSize={"xsmall"}
                        onClick={() => this.setState({showParentsChain: !this.state.showParentsChain})}
                      >
                        <Glyphicon glyph={`menu-${this.state.showParentsChain?"up":"down"}`}/>
                      </Button>
                  }
                  {
                    this.state.showParentsChain && tx.super_instance_chain.reduce((f, p) =>
                      <ul className="tree">
                        <li>
                          <Link to={`/transactions/${p.id}`}>{p.id} - {p.status}</Link>
                          {f}
                        </li>
                      </ul>,
                      <ul className="tree">
                          <li>{tx.id} (current)</li>
                      </ul>
                    )
                  }
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
            <>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <LinkContainer to={`/transactions/list`}>
                        <Breadcrumb.Item><FormattedMessage id="apio-requests" defaultMessage="APIO Requests"/></Breadcrumb.Item>
                    </LinkContainer>
                    {
                        tx.super_instance_chain && tx.super_instance_chain.map(sup_i => (
                            <LinkContainer to={`/transactions/${sup_i.id}`} key={`sup-${sup_i.id}`}>
                                <Breadcrumb.Item>{sup_i.id}</Breadcrumb.Item>
                            </LinkContainer>
                        ))
                    }
                    <Breadcrumb.Item active>{tx.id}</Breadcrumb.Item>
                </Breadcrumb>
                {alerts}
                <ReplayingSubInstancesModal show={replaying}/>
                <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({activeTab: e})} id="request-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
                        <Col xs={12} sm={6} md={8} lg={8} style={{marginTop: '10px'}}>
                            <Panel>
                                <Panel.Body>
                                {
                                    raw_event ?
                                      <RequestBody content={raw_event.content} /> :
                                      (request && request.details) && <ReactJson name={null} src={request.details}/>
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
                                    {
                                        request &&
                                            <Button
                                                onClick={() => {
                                                    const target = request.details ?
                                                        `/api/v01/apio/requests/${tx.original_request_id}?as=csv` :
                                                        `/api/v01/transactions/${this.props.match.params.txId}/events/${original_event_id}?as=csv`
                                                    AuthServiceManager.getValidToken().then(token => {
                                                        window.location=`${target}&auth_token=${token}`
                                                    })
                                                }}
                                            >
                                                <FormattedMessage id="request-as-csv" defaultMessage="Request as CSV"/>
                                            </Button>
                                    }
                                    {
                                        this.props.match.params.txId &&
                                          user_info.is_system &&
                                            <Button
                                                onClick={() => {
                                                    fetchInstanceContext(
                                                      this.props.match.params.txId,
                                                      c => downloadJson(`template_context_${this.props.match.params.txId}`, c)
                                                    )
                                                }}
                                            >
                                                <FormattedMessage id="context-as-json" defaultMessage="Context as JSON"/>
                                            </Button>
                                    }
                                    <Button onClick={() => this.setState({autoRefresh: !this.state.autoRefresh})} active={this.state.autoRefresh}>Auto-refresh</Button>
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
                                    <Comments req_id={tx.id} userInfo={user_info} />
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
                                <TxTable tx={tx} request={request} userInfo={user_info} activities={activities}/>
                            </Panel.Body>
                        </Panel>

                        <Panel>
                            <Panel.Heading>
                                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <TransactionFlow definition={tx.definition} states={tx.tasks} activityId={tx.activity_id} />
                                <TasksTable
                                    tasks={tx.tasks}
                                    definition={JSON.parse(tx.definition)}
                                    onReplay={this.onReplay}
                                    onRollback={this.onRollback}
                                    user_can_replay={can_act && tx.status === 'ACTIVE' && !replaying}
                                    tx_id={tx.id}
                                    userInfo={user_info}
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
                                            userInfo={user_info}
                                        />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            (subrequests.length !== 0 || subrequestsFilter !== "all") && (
                                <Panel>
                                    <Panel.Heading>
                                        <Panel.Title>
                                            <FormattedMessage id="sub-instances" defaultMessage="Sub instances"/>
                                            <select
                                                className="pull-right"
                                                value={subrequestsFilter}
                                                onChange={e => this.refreshSubInstances(undefined, e.target.value)}
                                            >
                                                <option value="all">all</option>
                                                <option value="active">active</option>
                                                <option value="blocked">active & blocked</option>
                                            </select>
                                            <select
                                                className="pull-right"
                                                value=""
                                                onChange={e => this.onGlobalActionSubInstances(e.target.value, subrequests)}
                                            >
                                                <option value="">*global action*</option>
                                                <option value="replay">replay</option>
                                                <option value="skip">skip</option>
                                                <option value="force-close">force close</option>
                                            </select>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body>
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
                            manualActions.length !== 0 && (
                                <Panel defaultExpanded={false}>
                                    <Panel.Heading>
                                        <Panel.Title toggle><FormattedMessage id="manual-actions" defaultMessage="Manual actions" /></Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <ManualActions actions={manualActions} tasks={tx.tasks}/>
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
                                        <Events events={events} logs={logs} userInfo={user_info}/>
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                        {
                            timers.length !== 0 && (
                                <Panel defaultExpanded={true}>
                                    <Panel.Heading>
                                        <Panel.Title toggle>
                                            <FormattedMessage id="timers" defaultMessage="Timers"/>
                                        </Panel.Title>
                                    </Panel.Heading>
                                    <Panel.Body collapsible>
                                        <Timers timers={timers} onUpdate={() => this.fetchTxDetails(false, true)} />
                                    </Panel.Body>
                                </Panel>
                            )
                        }
                    </Tab>
                </Tabs>
            </>)
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
        fetch_get(`/api/v01/apio/requests/${this.props.match.params.reqId}`)
            .then(data => !this.cancelLoad && this.setState({request: data.request}))
            .catch(error =>
                !this.cancelLoad && NotificationsManager.error(
                    <FormattedMessage id="fetch-req-failed" defaultMessage="Fetch request failed!" />,
                    error.message
                )
            );

        fetch_get(`/api/v01/apio/requests/${this.props.match.params.reqId}/traces?details=1`)
            .then(data => !this.cancelLoad && this.setState({messages: data.traces}))
            .catch(error =>
                !this.cancelLoad && NotificationsManager.error(
                    <FormattedMessage id="fetch-messages-failed" defaultMessage="Fetch request traces failed!" />,
                    error.message,
                )
            );
    }

    componentDidMount() {
        document.title = `Request - ${this.props.match.params.reqId}`;
        this.fetchDetails();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        const {request, messages} = this.state;
        const {auth_token, user_info} = this.props;

        if (!request) {
            return <div><FormattedMessage id='loading' defaultMessage='Loading...'/></div>
        }

        // devnote: done this way to continue to support Orange API (with request_entities separated)
        const request_entity = request.entities === undefined ? request : request.entities[0];
        const raw_event = request_entity.details;

        const request_ = Object.keys(raw_event).filter(k => !["response", "user"].includes(k)).reduce(
            (obj, key) => {
                obj[key] = raw_event[key];
                return obj;
            }, {}
        );
        const response_ = raw_event.response;
        const username = raw_event.user || request.owner;

        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="Requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <LinkContainer to={`/transactions/list`}>
                        <Breadcrumb.Item><FormattedMessage id="requests" defaultMessage="requests"/></Breadcrumb.Item>
                    </LinkContainer>
                    <Breadcrumb.Item active>{request.request_id}</Breadcrumb.Item>
                </Breadcrumb>
                {
                    request.instance_id && (
                        <Alert bsStyle="info" key='instance'>
                            <FormattedMessage id="instance-link" defaultMessage="The request is part of the instance: "/>
                            <Link to={`/transactions/${request.instance_id}`}>{request.instance_id}</Link>
                        </Alert>
                    )
                }
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
                                    <tr>
                                        <th><FormattedMessage id="request-id" defaultMessage="Request ID" /></th>
                                        <td>
                                            { request.request_id }
                                            <Button
                                                bsStyle="link"
                                                onClick={() => {
                                                  AuthServiceManager.getValidToken().then(token => {
                                                    window.location=`${API_URL_PREFIX}/api/v01/apio/requests/${request.request_id}?as=csv&auth_token=${token}`
                                                  })
                                                }}
                                            >
                                                csv
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr><th><FormattedMessage id="request-status" defaultMessage="Request status" /></th><td>{ request.status }</td></tr>
                                    <tr><th><FormattedMessage id="username" defaultMessage="Username" /></th><td>{ username }</td></tr>
                                    <tr><th><FormattedMessage id="target-type" defaultMessage="Target type" /></th><td>{ request_entity.entity_type }</td></tr>
                                    <tr><th><FormattedMessage id="creation-date" defaultMessage="Creation date" /></th><td>{ userLocalizeUtcDate(moment.utc(request.created_on), user_info).format() }</td></tr>
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
                                        userInfo={user_info}
                                    />
                                </Panel.Body>
                            </Panel>
                        )
                    }
                </Col>
            </>
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


export const needActionCriteria = {
    // action_status: {model: 'tasks', value: 'WAIT', op: 'eq'}
    role_id: { model: 'manual_actions', op: 'is_not_null', value: '' }
};


const AutoRefreshTime = 10;

export class Requests extends Component{
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            filter_criteria: Requests.criteria_from_params(this.props.location.search),
            paging_info: {
                page_number: 1, page_size: 50
            },
            sorting_spec : [{
                model: 'requests', field: 'created_on', direction: 'desc'
            }],

            requests: [],
            selected_reqs: [],
            pagination: {
                page_number: 1,
                num_pages: 1,
            },
            error: undefined,
            auto_refresh: false,
            auto_refresh_remaining: AutoRefreshTime,
            proxy_hosts: [],
            roles: [],
        };
        this._refresh = this._refresh.bind(this);
        this._load_proxy_hosts = this._load_proxy_hosts.bind(this);
        this._prepare_url = this._prepare_url.bind(this);
        this._onCloseAll = this._onCloseAll.bind(this);
        this._onClose = this._onClose.bind(this);
    }

    static default_criteria() {
        return {
            activity_id: { model: 'instances', value: '', op: 'eq' },
            tenant_id: { model: 'requests', value: '', op: 'eq' },
            site_id: { model: 'requests', value: '', op: 'eq' },
            number: { model: 'requests', value: '', op: 'like' },
            status: { model: 'instances', value: '', op: 'eq' },
            kind: { model: 'instances', value: '', op: 'eq' },
            created_on: { model: 'requests', value: '', op: 'ge' },
            request_status: { model: 'requests', value: '', op: 'eq' },
            label: { model: 'bulks', value: '', op: 'eq' },
            proxied_username: { model: 'requests', value: '', op: 'eq' },
            proxied_method: { model: 'requests', value: '', op: 'eq' },
            proxied_url: { model: 'requests', value: '', op: 'eq' },
            proxied_status: { model: 'processing_traces', value: '', op: 'eq' },
            proxy_gateway_host: { model: 'requests', value: '', op: 'eq' },
            role_id: { model: 'manual_actions', value: '', op: 'eq' },
            task_status: undefined,
            action_status: undefined,
            end_task_status: undefined,
        }
    }

    static criteria_from_params(url_params) {
        const params = queryString.parse(url_params);
        let custom_params = {};
        if (params.filter !== undefined) {
            try {
                custom_params = JSON.parse(params.filter);
            } catch (e) { console.error(e) }
        }
        return update(
            Requests.default_criteria(),
            {$merge: custom_params}
        );
    }

    componentDidMount() {
        document.title = "Requests";
        fetchRoles(roles => this.setState({roles: roles}));
        fetchActivities(activities => this.setState({activities: activities}))
        this._load_proxy_hosts();
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
                filter_criteria: Requests.criteria_from_params(nextProps.location.search)
            });
        }
    }

    _load_proxy_hosts() {
        fetch_get('/api/v01/gateways')
        .then(data =>
            !this.cancelLoad &&
            this.setState({proxy_hosts: Object.keys(data.gateways).map(k => { return {name: k, url: data.gateways[k].url}})}))
    }

    _prepare_url(paging_spec, sorting_spec, format, action) {
        const url = new URL(`${API_URL_PREFIX}/api/v01/apio/requests/${action?action:"search"}`);
        // filter
        const {filter_criteria} = this.state;
        const request_data_model = this.props.user_info.modules.includes(modules.orange) ? 'request_entities' : 'requests';
        const filter_spec = Object.keys(filter_criteria)
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
                            model: request_data_model,
                            field: 'numbers',
                            op: filter_criteria[f].op,
                            value: '%' + filter_criteria[f].value.trim() + '%'
                        };
                    case 'proxied_method':
                        return {
                            model: filter_criteria[f].model,
                            field: 'details',
                            json_field: 'method',
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    case 'proxied_url':
                        return {
                            model: filter_criteria[f].model,
                            field: 'details',
                            json_field: 'url',
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    case 'proxied_username':
                        return {"or": [
                            {
                              model: filter_criteria[f].model,
                              field: 'details',
                              json_field: 'user',
                              op: filter_criteria[f].op,
                              value: filter_criteria[f].value
                            },
                            {
                              model: filter_criteria[f].model,
                              field: 'owner',
                              op: filter_criteria[f].op,
                              value: filter_criteria[f].value
                            }
                        ]};
                    case 'proxied_status':
                    case 'task_status':
                    case 'action_status':
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
                    case 'tenant_id':
                    case 'site_id':
                        return {
                            model: request_data_model,
                            field: f,
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value
                        };
                    case 'created_on':
                        return {
                            model: filter_criteria[f].model,
                            field: f,
                            op: filter_criteria[f].op,
                            value: moment.parseZone(filter_criteria[f].value).utc().format()
                        };
                    case 'role_id':
                        return { "and": [
                            {
                                model: filter_criteria[f].model,
                                field: f,
                                op: filter_criteria[f].op,
                                value: filter_criteria[f].value
                            },
                            {
                                model: "manual_actions",
                                field: "output",
                                op: "is_null"
                            }
                        ]};
                    default:
                        return {
                            model: filter_criteria[f].model, // needed in multi-model query
                            field: f,
                            op: filter_criteria[f].op,
                            value: filter_criteria[f].value.trim()
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
        // export_url.searchParams.append('auth_token', this.props.auth_token);
        // get the force close URL
        const close_instances_url = this._prepare_url(undefined, undefined, undefined, "close");

        //reset collection
        this.setState({requests: undefined, selected_reqs: []});

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
                     requests: data.requests,
                     pagination: {
                         page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                         page_size: data.pagination[1],
                         num_pages: data.pagination[2],
                         total_results: data.pagination[3],
                     },
                     sorting_spec: data.sorting || [],
                     export_url: export_url.href,
                     close_instances_url: close_instances_url,
                });
            })
            .catch(error => !this.cancelLoad && this.setState({error: error}));
    }

    _onClose() {
        const {selected_reqs, requests} = this.state;
        if(selected_reqs.length === 0) {
            return this._onCloseAll();
        } else {
            const reqs_ = requests.filter(r => r.request_id && r.status === "ACTIVE" && selected_reqs.includes(r.instance_id));
            if(reqs_.length === 0) {
                NotificationsManager.success(<FormattedMessage id="nothing-to-do"
                                                               defaultMessage="Nothing to be done."/>);
                return
            }
            this.setState({updating_requests: true});
            Promise.all(
                reqs_.map(
                    r => fetch_put(`/api/v01/apio/requests/${r.request_id}?close=1`, {status: "ERROR"}, this.props.auth_token)
                )
            ).then(() => {
                NotificationsManager.success(<FormattedMessage id="instance-status-changed"
                                                               defaultMessage="Instance status updated!"/>);
                this.setState({updating_requests: false});
                this._refresh();
            })
            .catch(error => {
                NotificationsManager.error(
                    <FormattedMessage id="instance-update-failed" defaultMessage="Instance status update failed!"/>,
                    error.message
                );
                this.setState({updating_requests: false});
                this._refresh();
            });
        }
    }

    _onCloseAll() {
        const {close_instances_url} = this.state;
        this.setState({updating_requests: true});
        NotificationsManager.success(<FormattedMessage id="closing-all_requests" defaultMessage="Closing requests..."/>);
        fetch_put(close_instances_url, {}, this.props.auth_token)
            .then(() => {
                !this.cancelLoad && this.setState({updating_requests: false});
                NotificationsManager.success(<FormattedMessage id="done" defaultMessage="Done"/>);
                this._refresh();
            })
            .catch(error => {
                !this.cancelLoad && this.setState({updating_requests: false});
                NotificationsManager.error(
                    <FormattedMessage id="global-action-failed" defaultMessage="Global action failed!"/>,
                    error.message
                );
            })
    }

    render() {
        const { filter_criteria, requests, activities, export_url, auto_refresh, sorting_spec, selected_reqs, proxy_hosts, roles} = this.state;
        const { user_info } = this.props;
        const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value).isValid();
        const request_entities = user_info.modules && user_info.modules.includes(modules.orange) ? "request_entities" : "requests";
        const proxy_activated = user_info.modules && user_info.modules.includes(modules.proxy);
        const manualActions = user_info.modules && user_info.modules.includes(modules.manualActions);

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                </Breadcrumb>
                <Panel defaultExpanded={true} >
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

                            <SavedFiltersFormGroup
                                onChange={filter => {
                                    let newState = {selectedFilter: filter};
                                    if(filter && filter.value.filter) {
                                      newState["filter_criteria"] = update(
                                          Requests.default_criteria(),
                                          {$merge: filter.value.filter}
                                      )
                                    }
                                    this.setState(newState);
                                }}
                                currentFilter={() => filter_criteria}
                                entity={"request"}
                                />

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
                                            activities && activities.sort(
                                              (a, b) => a.name.localeCompare(b.name)
                                            ).map(
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

                            {
                                manualActions &&
                                    <FormGroup>
                                        <Col componentClass={ControlLabel} sm={2}>
                                            <FormattedMessage id="pending-action-role" defaultMessage="Pending action role" />
                                        </Col>

                                        <Col sm={1}>
                                            <FormControl
                                                componentClass="select"
                                                value={filter_criteria.role_id.op}
                                                onChange={e => this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        { role_id: { $merge: { op: e.target.value } } })
                                                })}>
                                                <option value="eq">==</option>
                                                <option value="ne">!=</option>
                                                <option value="is_not_null">*any*</option>
                                            </FormControl>
                                        </Col>

                                        <Col sm={8}>
                                            <FormControl
                                                componentClass="select"
                                                disabled={filter_criteria.role_id.op === "is_not_null"}
                                                value={filter_criteria.role_id.value}
                                                onChange={e => this.setState({
                                                    filter_criteria: update(filter_criteria,
                                                        { role_id: { $merge: { value: e.target.value && parseInt(e.target.value, 10) } } })
                                                })} >
                                                <option value=""/>
                                                {
                                                    roles.map(r => <option key={`role-${r.id}`} value={r.id}>{r.name}</option>)
                                                }
                                            </FormControl>
                                        </Col>
                                    </FormGroup>
                            }

                            {
                                proxy_activated &&
                                <>
                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="owner" defaultMessage="Owner" />
                                    </Col>

                                    <Col sm={1}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxied_username.op}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    { proxied_username: { $merge: { op: e.target.value } } })
                                            })}>
                                            <option value="eq">==</option>
                                            <option value="ne">!=</option>
                                        </FormControl>
                                    </Col>

                                    <Col sm={8}>
                                        <FormControl componentClass="input" value={filter_criteria.proxied_username.value}
                                            onChange={e => this.setState({
                                                filter_criteria: update(filter_criteria,
                                                    { proxied_username: { $merge: { value: e.target.value } } })
                                            })} />
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="proxy-host" defaultMessage="Proxy host" />
                                    </Col>

                                    <Col sm={1}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxy_gateway_host.op}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    { proxy_gateway_host: { $merge: { op: e.target.value } } })
                                            })}>
                                            <option value="eq">==</option>
                                            <option value="ne">!=</option>
                                        </FormControl>
                                    </Col>

                                    <Col sm={8}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxy_gateway_host.value}
                                            onChange={e => this.setState({
                                                filter_criteria: update(filter_criteria,
                                                    { proxy_gateway_host: { $merge: { value: e.target.value } } })
                                            })} >
                                            <option value="" />
                                            {
                                                proxy_hosts.map((h, i) => <option key={`phost-${i}-${h.url}`} value={h.url}>{h.name}</option>)
                                            }
                                        </FormControl>
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="proxy-status" defaultMessage="Proxy status" />
                                    </Col>

                                    <Col sm={1}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxied_status.op}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    { proxied_status: { $merge: { op: e.target.value } } })
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
                                        <FormControl componentClass="input" value={filter_criteria.proxied_status.value}
                                            onChange={e => this.setState({
                                                filter_criteria: update(filter_criteria,
                                                    { proxied_status: { $merge: { value: e.target.value && parseInt(e.target.value) } } })
                                            })} />
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="proxy-URL" defaultMessage="Proxy URL" />
                                    </Col>

                                    <Col sm={1}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxied_url.op}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    { proxied_url: { $merge: { op: e.target.value } } })
                                            })}>
                                            <option value="eq">==</option>
                                            <option value="ne">!=</option>
                                            <option value="like">like</option>
                                        </FormControl>
                                    </Col>

                                    <Col sm={8}>
                                        <FormControl componentClass="input" value={filter_criteria.proxied_url.value}
                                            onChange={e => this.setState({
                                                filter_criteria: update(filter_criteria,
                                                    { proxied_url: { $merge: { value: e.target.value } } })
                                            })} />
                                    </Col>
                                </FormGroup>

                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="proxy-method" defaultMessage="Proxy method" />
                                    </Col>

                                    <Col sm={1}>
                                        <FormControl
                                            componentClass="select"
                                            value={filter_criteria.proxied_method.op}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    {proxied_method: {$merge: {op: e.target.value}}})
                                            })}>
                                            <option value="eq">==</option>
                                            <option value="ne">!=</option>
                                        </FormControl>
                                    </Col>

                                    <Col sm={8}>
                                        <FormControl componentClass="select" value={filter_criteria.proxied_method.value}
                                            onChange={e => this.setState({
                                                filter_criteria: update(this.state.filter_criteria,
                                                    {proxied_method: {$merge: {value: e.target.value}}})
                                            })}>
                                            <option value='' />
                                            <option value="get">get</option>
                                            <option value="post">post</option>
                                            <option value="put">put</option>
                                            <option value="delete">delete</option>
                                        </FormControl>
                                    </Col>
                                </FormGroup>
                                </>
                            }

                            <FormGroup validationState={invalid_created_on ? "error" : null}>
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
                                        selected={filter_criteria.created_on.value.length !== 0?userLocalizeUtcDate(moment(filter_criteria.created_on.value), user_info).toDate():null}
                                        onChange={d => {
                                            this.setState({
                                                filter_criteria: update(
                                                    this.state.filter_criteria,
                                                    {created_on: {$merge: {value: d || ""}}})
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
                            sorting_spec={sorting_spec}
                            headers={[
                                {
                                    title: '',
                                    render: n =>
                                        n.instance_id && <Checkbox checked={selected_reqs.includes(n.instance_id)} onChange={e => {
                                            if(e.target.checked) {
                                                this.setState({selected_reqs: update(selected_reqs, {"$push": [n.instance_id]})})
                                            } else {
                                                this.setState({selected_reqs: update(selected_reqs, {"$splice": [[selected_reqs.indexOf(n.instance_id), 1]]})})
                                            }
                                        }} />,
                                    style: {width: '30px'}
                                },
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
                                    render: n => {
                                        if(activities && n.activity_id) {
                                            const a = activities.find(a => a.id === n.activity_id);
                                            if(a) {
                                                return a.name;
                                            }
                                        }
                                        return "-";
                                    }
                                },
                                {
                                    title: <FormattedMessage id="tenant" defaultMessage="Tenant" />,
                                    field: 'tenant_id', model: request_entities,
                                },
                                {
                                    title: <FormattedMessage id="site" defaultMessage="Site" />,
                                    field: 'site_id', model: request_entities,
                                },
                                {
                                    title: <FormattedMessage id="user-s" defaultMessage="User(s)" />,
                                    field: 'numbers', model: request_entities,
                                    style: {
                                        //whiteSpace: 'nowrap',
                                        //width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        overflowWrap: 'unset',
                                        wordWrap:'normal'
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
                                    render: n => userLocalizeUtcDate(moment.utc(n.created_on), user_info).format(),
                                    field: 'created_on', model: 'requests', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: <FormattedMessage id="updated-on" defaultMessage="Updated on" />,
                                    render: n => userLocalizeUtcDate(moment.utc(n.updated_on), user_info).format(),
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
                        <ButtonToolbar>
                            <Button
                                bsStyle="primary"
                                onClick={() => {
                                  export_url && AuthServiceManager.getValidToken().then(token => {
                                    window.location=`${export_url}&auth_token=${token}`
                                  })
                                }}
                                disabled={export_url === undefined}
                            >
                                <FormattedMessage id="export-as-csv" defaultMessage="Export as CSV"/>
                            </Button>
                            <Button
                                    bsStyle="danger"
                                    onClick={this._onClose}
                                    disabled={this.state.updating_requests || this.props.user_info.ui_profile !== "admin"}
                                >
                                <FormattedMessage id="force-close-all" defaultMessage="Force close "/>
                                {
                                    selected_reqs.length === 0?
                                        <FormattedMessage id="all" defaultMessage="all"/>:
                                        <FormattedMessage id="selected" defaultMessage="selected: {n}" values={{n: selected_reqs.length}}/>
                                }
                            </Button>
                        </ButtonToolbar>
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
            roles: [],
        };
        this._refresh = this._refresh.bind(this);
        this._prepare_url = this._prepare_url.bind(this);
    }

    static default_criteria(ui_profile) {
        return {
            status: {value: '', op: 'eq'},
            created_on: {value: '', op: 'ge'},
            method: {model: 'events', value: '', op: 'eq'},
            url: {model: 'events', value: '', op: 'like'},
            cron: undefined,
            user: {value: '', op: 'eq'},
            task_status: undefined,
            role_id: {model: 'manual_actions', value: '', op: 'eq'},
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
        document.title = "Requests";
        fetchRoles(roles => this.setState({roles: roles}));
        fetchActivities(activities => this.setState({activities: activities}));
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

    _prepare_url(paging_spec, sorting_spec, format) {
        const url = new URL(API_URL_PREFIX + '/api/v01/custom_instances/search');
        // filter
        const {filter_criteria} = this.state;
        const filter_spec = Object.keys(filter_criteria)
            .filter(f =>
                filter_criteria[f] &&
                (
                    (filter_criteria[f].value && filter_criteria[f].op) ||
                    filter_criteria[f].or || filter_criteria[f].and || filter_criteria[f].op === 'is_not_null' || filter_criteria[f].op === 'is_null' || typeof(filter_criteria[f].value) === 'boolean'
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
                        const value = ["like", "ne"].includes(criteria.op) ? "% %" + criteria.value + "%" : "% " + criteria.value;
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
                    case 'cron':
                        return {
                            model: 'events',
                            field: 'source_entity',
                            op: criteria.op,
                            value: 'cron'
                        }
                    case 'created_on':
                        return {
                            model: criteria.model,
                            field: f,
                            op: criteria.op,
                            value: moment.parseZone(criteria.value).utc().format()
                        };
                    case 'role_id':
                        return { "and": [
                            {
                                model: criteria.model,
                                field: f,
                                op: criteria.op,
                                value: criteria.value
                            },
                            {
                                model: "manual_actions",
                                field: "output",
                                op: "is_null"
                            }
                        ]};
                    default:
                        return {
                            model: criteria.model, // needed in multi-model query
                            field: f,
                            op: criteria.op,
                            value: criteria.value.trim()
                        };
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
        // export_url.searchParams.append('auth_token', this.props.auth_token);

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
                        filter_criteria[f].op === 'is_not_null')
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
                     requests: data.instances,
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
        const {filter_criteria, requests, activities, export_url, auto_refresh, roles} = this.state;
        const { user_info } = this.props;
        const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value).isValid();
        const manualActions =  user_info.modules && user_info.modules.includes(modules.manualActions);

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="cron-requests" defaultMessage="Cron requests"/></Breadcrumb.Item>
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

                            {
                                manualActions &&
                                    <FormGroup>
                                        <Col componentClass={ControlLabel} sm={2}>
                                            <FormattedMessage id="pending-action-role" defaultMessage="Pending action role" />
                                        </Col>

                                        <Col sm={1}>
                                            <FormControl
                                                componentClass="select"
                                                value={filter_criteria.role_id.op}
                                                onChange={e => this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        { role_id: { $merge: { op: e.target.value } } })
                                                })}>
                                                <option value="eq">==</option>
                                                <option value="ne">!=</option>
                                                <option value="is_not_null">*any*</option>
                                            </FormControl>
                                        </Col>

                                        <Col sm={8}>
                                            <FormControl
                                                componentClass="select"
                                                disabled={filter_criteria.role_id.op === "is_not_null"}
                                                value={filter_criteria.role_id.value}
                                                onChange={e => this.setState({
                                                    filter_criteria: update(filter_criteria,
                                                        { role_id: { $merge: { value: e.target.value && parseInt(e.target.value, 10) } } })
                                                })} >
                                                <option value=""/>
                                                {
                                                    roles.map(r => <option key={`role-${r.id}`} value={r.id}>{r.name}</option>)
                                                }
                                            </FormControl>
                                        </Col>
                                    </FormGroup>
                            }

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
                                        selected={filter_criteria.created_on.value.length !== 0?userLocalizeUtcDate(moment.utc(filter_criteria.created_on.value), user_info).toDate():null}
                                        onChange={d => this.setState({
                                            filter_criteria: update(
                                                this.state.filter_criteria,
                                                {created_on: {$merge: {value: d || ""}}})
                                        })}
                                        dateFormat="dd/MM/yyyy HH:mm"
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
                                        checked={filter_criteria.cron && filter_criteria.cron.value === 'cron'}
                                        onChange={e => (
                                            e.target.checked ?
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$merge:  {cron: {model: 'events', value: 'cron', op: 'eq'}}})
                                                }) :
                                                this.setState({
                                                    filter_criteria: update(this.state.filter_criteria,
                                                        {$unset: ['cron']})
                                                })
                                        )} >
                                        <FormattedMessage id="cron-jobs" defaultMessage="Cron jobs" />
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
                                    render: n => activities && n.activity_id && activities.find(a => a.id === n.activity_id)?.name || "-"
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
                                    render: n => userLocalizeUtcDate(moment.utc(n.created_on), user_info).format(),
                                    field: 'created_on', model: 'instances', sortable: true, style: {width: '200px'}
                                },
                                {
                                    title: <FormattedMessage id="updated-on" defaultMessage="Updated on" />,
                                    render: n => userLocalizeUtcDate(moment.utc(n.updated_on), user_info).format(),
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
                            onClick={() => {
                              export_url && AuthServiceManager.getValidToken().then(token => {
                                window.location=`${export_url}&auth_token=${token}`
                              })
                            }}
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
