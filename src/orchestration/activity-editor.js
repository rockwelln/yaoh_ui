import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {Redirect} from "react-router";
import draw_editor, {addNode, getDefinition, isValid, updateGraphModel} from "./editor";
import {fetch_post, fetch_get, fetch_delete, fetch_put, NotificationsManager} from "../utils";

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import Table from 'react-bootstrap/lib/Table';
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';

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
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import {SimulatorPanel} from "./simulator";
import Checkbox from "react-bootstrap/lib/Checkbox";
import {fetchConfiguration, Param2Input} from "./nodeInputs";


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


function NewCellModal(props)  {
    const {show, onHide, cells, entities, activity} = props;
    const [name, setName] = useState("");
    const [definition, setDefinition] = useState({});
    const [staticParams, setStaticParams] = useState({});
    const [customOutputs, setCustomOutputs] = useState([]);

    useEffect(() => {
      if(!show) {
        setName("");
        setDefinition({});
        setStaticParams({});
        setCustomOutputs([]);
      }
    }, [show]);

    const params = definition && definition.params && definition
      .params
      .map(param => {
        const n = param.name || param;
        const error = isValid(param, staticParams[n] || "");

        return (
          <FormGroup key={n} validationState={error === null?null:"error"}>
            <Col componentClass={ControlLabel} sm={2}>{n}</Col>
            <Col sm={9}>
              <Param2Input
                param={param}
                cells={cells}
                activity={activity}
                value={staticParams[n]}
                onChange={(e, outputs) => {
                  setStaticParams(update(staticParams, {$merge: {[n]: e}}));
                  if(outputs !== undefined) {
                    setCustomOutputs(outputs);
                  }
                }} />
              {
                param.help && <HelpBlock>{param.help}</HelpBlock>
              }
              {
                error && <HelpBlock>{error}</HelpBlock>
              }
            </Col>
          </FormGroup>
        )
    });

    const duplicateName = activity && Object.keys(activity.definition.cells).includes(name);
    const validName = name && name.length !== 0 && (!activity || !duplicateName);
    const invalidParams = definition && definition.params && definition
      .params
      .filter(p => isValid(p, staticParams[p.name || p] || "") !== null) || [];

    return (
        <Modal show={show} onHide={() => onHide(null)} bsSize={"large"}>
            <Modal.Header closeButton>
                <Modal.Title>New cell</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup validationState={duplicateName?"error":null}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="name" defaultMessage="Name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={name}
                                onChange={e => setName(e.target.value)}/>
                          { duplicateName &&
                            <HelpBlock>Duplicate name in the workflow</HelpBlock>
                          }
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="implementation" defaultMessage="Implementation" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="select"
                                value={definition.original_name}
                                onChange={e => setDefinition(cells.find(c => c.original_name === e.target.value))}>
                                <option value=""/>
                              {
                                entities && entities.length !== 0 &&
                                  <optgroup label="Entities">
                                    {
                                      entities.map(e => <option value={e.name}>{e.name}</option>)
                                    }
                                  </optgroup>
                              }
                              {
                                Object.entries(cells
                                  .sort((a, b) => a.category.localeCompare(b.category))
                                  .reduce((o, item) => {
                                    const key = item["category"] || "direct processing";
                                    if (!o.hasOwnProperty(key)) {
                                      o[key] = [];
                                    }
                                    o[key].push(item);
                                    return o
                                  }, {}))
                                  .map(([category, cells])=> (
                                    <optgroup label={category} key={category}>
                                      { cells.map(c => <option value={c.original_name} key={c.original_name}>{c.original_name}</option>)}
                                    </optgroup>
                                    ))
                                  })
                              }

                            </FormControl>
                            {
                                definition && definition.doc && <HelpBlock>{definition.doc}</HelpBlock>
                            }
                        </Col>
                    </FormGroup>

                    { params }

                    <FormGroup>
                      <Col smOffset={2} sm={10}>
                          <Button
                            onClick={() => {
                              onHide({def:definition, name:name, params:staticParams, isEntity:false, customOutputs: customOutputs});
                            }}
                            disabled={!validName || invalidParams.length !== 0}
                          >
                              Save
                          </Button>
                      </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


const defaultDragState = {
  column: -1,
  row: -1,
  startPoint: null,
  direction: "",
  dropIndex: -1 // drag target
};


function offsetIndex(from, to, arr = []) {
  if (from < to) {
    let start = arr.slice(0, from),
      between = arr.slice(from + 1, to + 1),
      end = arr.slice(to + 1);
    return [...start, ...between, arr[from], ...end];
  }
  if (from > to) {
    let start = arr.slice(0, to),
      between = arr.slice(to, from),
      end = arr.slice(from + 1);
    return [...start, arr[from], ...between, ...end];
  }
  return arr;
}


function OutputsTable(props) {
  let {rows, usedRows, onDragEnd} = props;
  const [dragState, setDragState] = useState({...defaultDragState});
  const preview = useRef(null);

  if (dragState.direction === "row") {
    rows = offsetIndex(dragState.row, dragState.dropIndex, rows);
  }
  return (
    <>
      <Table>
        <tbody>
        {
          rows.map((output, i) => {
            return (
              <tr
                key={i}
                draggable
                style={{
                  cursor: dragState.direction ? "move" : "grab",
                  opacity: dragState.dropIndex === i ? 0.5 : 1
                }}
                onDragStart={e => {
                  e.dataTransfer.setDragImage(preview.current, 0, 0);
                  setDragState({
                    ...dragState,
                    row: i,
                    startPoint: {
                      x: e.pageX,
                      y: e.pageY
                    }
                  });
                }}
                onDragEnd={() => {
                  onDragEnd(rows);
                  setDragState({ ...defaultDragState });
                }}
                onDragEnter={e => {
                  if (!dragState.direction) {
                    setDragState({
                      ...dragState,
                      direction: "row",
                      dropIndex: i
                    });
                    return;
                  }

                  if (i !== dragState.dropIndex) {
                    setDragState({
                      ...dragState,
                      dropIndex: i
                    });
                  }
                }}
              >
                <td style={{width: 20}}><Glyphicon glyph={"menu-hamburger"}/></td>
                <td style={{width: 20}}>
                  <Checkbox
                    checked={output.visible}
                    onChange={e => onDragEnd(update(rows, {[i]: {$merge: {visible: e.target.checked}}}))}
                    disabled={usedRows.includes(output.value) || output.custom} />
                </td>
                <td>{output.value}</td>
              </tr>
            )
          })
        }
        </tbody>
      </Table>
      <div
        ref={preview}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden"
        }}
      />
    </>
  )
}


export function EditCellModal(props) {
    const {show, cell, cells, activity, onHide, readOnly = false} = props;
    const [staticParams, setStaticParams] = useState({});
    const [outputs, setOutputs] = useState([]);

    const originalName = cell && cell.value.getAttribute('original_name');
    const name = cell && cell.value.getAttribute('label');
    const attrsStr = cell && cell.value.getAttribute('attrList');

    const cellDef = cells && cells.find(c => c.name === originalName);

    useEffect(() => {
      if(!show) {
        setStaticParams({});
        setOutputs([]);
      }
    }, [show]);
    useEffect(() => {
      if(cell) {
        if(cell.value.getAttribute("attrList")) {
          setStaticParams(cell.value.getAttribute('attrList').split(",").reduce((o, a) => {
            o[a] = cell.value.getAttribute(a);
            return o;
          }, {}))
        }
        if(cell.value.getAttribute("outputs") && cellDef) {
          /*
          merge visible outputs and outputs from the definition
          and filter out duplicates (if any).
           */
          setOutputs(
            cell.value.getAttribute("outputs")
              .split(",")
              .concat(cellDef.outputs || [])
              .reduce((o, e) => {
                if(!o.includes(e)) o.push(e);
                return o;
              }, [])
              .reduce((o, e) => {
                o.push({
                  value: e,
                  custom: cellDef.outputs?!cellDef.outputs.includes(e):true,
                  visible: cell.value.getAttribute("outputs").split(",").includes(e)
                })
                return o;
              }, [])
          );
        }
      }
    }, [cell, activity]);

    if(!cell) return <div/>

    const usedRows = activity && activity.definition.transitions.map(t => t[0]).reduce((o, e) => {
      const [task, output] = e.split(".");
      if(task === name) {
        o.push(output);
      }
      return o;
    }, []);

    const defAttrList = cellDef && cellDef.params?cellDef.params.map(p => p.name || p):[];
    const attrList = attrsStr ? attrsStr.split(',') : [];
    const paramsList = defAttrList.concat(attrList.filter(e => !defAttrList.includes(e)));

    const params = paramsList
      // get the param definition (if possible)
      .map(p => (cellDef && cellDef.params.find(param => (param.name || param) === p)) || p)
      .map(param => {
        const n = param.name || param;
        const error = isValid(param, staticParams[n] || "");

        return (
          <FormGroup key={n} validationState={error === null?null:"error"}>
            <Col componentClass={ControlLabel} sm={2}>{n}</Col>
            <Col sm={9}>
              <Param2Input
                param={param}
                cells={cells}
                activity={activity}
                value={staticParams[n]}
                onChange={(e, outputs) => {
                  if(readOnly) return;

                  setStaticParams(update(staticParams, {$merge: {[n]: e}}));
                  if(outputs !== undefined) {
                    setOutputs(outs => outs.filter(o => !o.custom || outputs.includes(o.value)).concat(outputs.filter(o => !outs.map(t => t.value).includes(o)).map(o => { return {value: o, custom: true, visible: true} })));
                  }
                }} />
              {
                param.help && <HelpBlock>{param.help}</HelpBlock>
              }
              {
                error && <HelpBlock>{error}</HelpBlock>
              }
            </Col>
          </FormGroup>
        )
      })

    const invalidParams = cellDef && cellDef.params && cellDef
      .params
      .filter(p => isValid(p, staticParams[p.name || p] || "") !== null) || [];

    return (
      <Modal show={show} onHide={() => onHide(null)} bsSize="large">
        <Modal.Header closeButton>
          <Modal.Title>{cell.value.getAttribute("label")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="implementation" defaultMessage="Implementation" />
                </Col>

                <Col sm={9}>
                    <FormControl
                        componentClass="input"
                        value={originalName}
                        readOnly />
                </Col>
            </FormGroup>
            <p><i>{ cellDef && cellDef.doc }</i></p>

            { params }

            <hr/>
            {outputs && outputs.length !== 0 &&
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="outputs" defaultMessage="Outputs"/>
                </Col>

                <Col sm={9}>
                  <OutputsTable
                    rows={outputs} /* visible + invisible */
                    usedRows={usedRows} /* used are checked and disabled */
                    onDragEnd={setOutputs}/>
                </Col>
              </FormGroup>
            }

            {!readOnly &&
              <FormGroup>
                <Col smOffset={2} sm={10}>
                  <Button
                    disabled={invalidParams.length !== 0}
                    onClick={() => {
                      onHide({
                        name: cell.value.getAttribute("label"),
                        originalName: originalName,
                        params: staticParams,
                        isEntity: false,
                        outputs: outputs.filter(o => o.visible).map(o => o.value),
                      });
                    }}
                  >
                    Save
                  </Button>
                </Col>
              </FormGroup>
            }
          </Form>
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
    const [newCell, showNewCell] = useState(false);
    const [editedCell, setEditedCell] = useState(undefined);

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
                onEdit: cell => setEditedCell(cell),
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
        editor && editor.addAction('add_process', () =>
            showNewCell(true)
        );
    }, [editor]);

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

            <NewCellModal
                show={newCell}
                cells={cells}
                entities={entities}
                activity={editor && getDefinition(editor).activity}
                onHide={c => {
                  showNewCell(false);
                  if(c) {
                    // merge the output(s) if needed
                    if(c.customOutputs) {
                      c.def.outputs = c.def.outputs.concat(c.customOutputs).reduce((u, i) => u.includes(i) ? u : [...u, i], []);
                    }
                    addNode(editor, c.def, c.name, c.params, c.isEntity);
                  }
                }}
            />

            <EditCellModal
                show={editedCell !== undefined}
                cell={editedCell}
                cells={cells}
                activity={editor && getDefinition(editor).activity}
                onHide={c => {
                  setEditedCell(undefined);
                  if(c === null) return;

                  const activity = editor && getDefinition(editor).activity;
                  activity.definition.cells[c.name]["params"] = c.params;
                  if(c.outputs !== undefined) {
                    activity.definition.cells[c.name]["outputs"] = c.outputs;
                  }
                  updateGraphModel(editor, activity, {clear: true, nofit: true});
                }} />
        </>
    );
}
