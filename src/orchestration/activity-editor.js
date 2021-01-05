import React, {useState, useEffect, useRef, useLayoutEffect} from 'react';
import ReactDOM from 'react-dom';
import {Redirect} from "react-router";
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
import Alert from "react-bootstrap/lib/Alert";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import update from "immutability-helper";
import InputGroup from "react-bootstrap/lib/InputGroup";
import InputGroupButton from "react-bootstrap/lib/InputGroupButton";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowDown, faArrowUp, faChartBar, faCopy, faSpinner} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import {SimulatorPanel} from "./simulator";
import Checkbox from "react-bootstrap/lib/Checkbox";
import {fetchConfiguration, Param2Input} from "./nodeInputs";
import Ajv from "ajv";
import Select from "react-select";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";


const NEW_ACTIVITY = {
    name: '',
    status: 'ACTIVE',
    definition: {
        cells: {'start': {name: 'start', original_name: 'start', outputs: ['ok'], params: []}},
        entities: [],
        transitions: [],
    },
};

function isValid(p, v) {
    if(p.mandatory && v.length === 0) {
      return `The element ${p.name || p} is mandatory`;
    } else if(v.length === 0) {
      return null;
    }
    switch (p.validation) {
        case 'int':
            if(!/\d+/.test(v)) {
                return `Invalid number: ${v}`;
            }
            break;
        case 'timeout':
            if(!/\d+ (business|)\s*(hours|days)/.test(v)) {
                return `Invalid timeout: ${v} - should be "(number) (business|) (hours|days)"`;
            }
            break;
        case 'email':
            if(!/.+@.+\.[a-z]+/.test(v)) {
                return `Invalid email: ${v}`;
            }
            break;
        default:
            break;
    }
    if(p.schema && v) {
        const ajv = Ajv();
        const v_ = ajv.validate(p.schema, p.nature === "outputs"?v.split(","):v);
        if(!v_) {
            return `Invalid ${p.name}: ${ajv.errors.map(e => e.message).join(", ")}`;
        }
        return null;
    }
    return null;
}

function fetchCells(onSuccess) {
    fetch_get('/api/v01/cells')
        .then(data => onSuccess(data.cells))
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
            'description': activity.description,
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

function fetchActivityVersions(id, onSuccess) {
    fetch_get(`/api/v01/activities/${id}/versions`)
        .then(resp => onSuccess(resp.activity_versions))
        .catch(error => {
            NotificationsManager.error("Failed to fetch versions", error.message);
        });
}

function activateVersion(id, versionId, onSuccess) {
    fetch_put(`/api/v01/activities/${id}/versions/${versionId}/activate`)
        .then(resp => {
          NotificationsManager.success(`Version activated`)
          onSuccess && onSuccess()
        })
        .catch(error => {
            NotificationsManager.error(`Failed to activate the version ${versionId}`, error.message);
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
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [duplicateActivity, setDuplicateActivity] = useState();

    const loadActivities = () => {
      setLoading(true);
      fetchActivities(a => {
          setActivities(a);
          setLoading(false);
      });
    }

    useEffect(() => {
        loadActivities();
        document.title = "Activities";
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
                                <th>Version</th>
                                <th>Created on</th>
                                <th/>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            loading &&
                                <tr><td colSpan={4}><FontAwesomeIcon icon={faSpinner} aria-hidden="true" style={{'fontSize': '24px'}} spin /></td></tr>
                        }
                        {
                            activities
                                .filter(a => filter.length === 0 || a.name.includes(filter))
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(a => (
                                    <tr key={a.id}>
                                        <td>{a.name}</td>
                                        <td>{a.version_label || WORKING_VERSION_LABEL}</td>
                                        <td>{a.created_on}</td>

                                        <td>
                                            <ButtonToolbar>
                                                <LinkContainer to={`/transactions/config/activities/editor/${a.id}`}>
                                                    <Button bsStyle="primary">
                                                        <Glyphicon glyph="pencil"/>
                                                    </Button>
                                                </LinkContainer>
                                                <DeleteConfirmButton
                                                    resourceName={a.name}
                                                    style={{marginLeft: '5px'}}
                                                    onConfirm={() => deleteActivity(a.id, () => fetchActivities(setActivities))} />
                                                <Button
                                                  bsStyle="primary"
                                                  style={{marginLeft: '5px'}}
                                                  onClick={() => setDuplicateActivity(a.id)}>
                                                    <FontAwesomeIcon icon={faCopy}/>
                                                </Button>
                                            </ButtonToolbar>
                                        </td>
                                    </tr>
                                )
                            )
                        }
                        </tbody>
                    </Table>
                    <NewNameModal
                        show={duplicateActivity !== undefined}
                        isValidName={name => !activities.map(a => a.name).includes(name)}
                        title={"Duplicate"}
                        onHide={name => {
                            fetchActivity(duplicateActivity, a => {
                              a.name = name;
                              delete a.id;
                              a.definition = JSON.parse(a.definition);
                              saveActivity(a, () => {
                                setDuplicateActivity(undefined);
                                loadActivities();
                              });
                            })
                        }} />
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


function NewNameModal(props) {
    const {show, title, onHide, isValidName} = props;
    const [name, setName] = useState("");

    useEffect(() => {
      !show && setName("");
    }, [show]);

    const duplicateName = !isValidName(name);
    const validName = name && name.length !== 0 && !duplicateName;

    return (
        <Modal show={show} onHide={() => onHide(null)} bsSize={"large"}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={e => {e.preventDefault(); onHide(name);}} horizontal>
                    <FormGroup validationState={duplicateName?"error":null}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="name" defaultMessage="Name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                autoFocus
                                componentClass="input"
                                value={name}
                                onChange={e => setName(e.target.value)}/>
                          { duplicateName &&
                            <HelpBlock>Duplicate name</HelpBlock>
                          }
                        </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col smOffset={2} sm={10}>
                          <Button disabled={!validName} type={"submit"} >
                              Save
                          </Button>
                      </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

const miscDefs = {
  entity: {original_name: "entity", params: [{"name": "events", "nature": "outputs"}], outputs: []},
}

function NewCellModal(props)  {
    const {show, onHide, cells, activity} = props;
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
                                value={definition.original_name || definition.name}
                                onChange={e => {
                                  const cellDef = cells.find(c => c.original_name === e.target.value);
                                  setDefinition(cellDef?cellDef:miscDefs[e.target.value])
                                }}>
                                <option value=""/>
                                <optgroup label="Misc.">
                                  <option value={"entity"}>Entity</option>
                                </optgroup>
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
                              onHide({def:definition, name:name, params:staticParams, customOutputs: customOutputs});
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

    let cellDef = cells && cells.find(c => c.name === originalName);
    if(!cellDef) {
      cellDef = miscDefs[originalName];
    }

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
        if(cell.value.getAttribute("outputs") !== undefined && cellDef) {
          /*
          merge visible outputs and outputs from the definition
          and filter out duplicates (if any).
           */
          setOutputs(
            cell.value.getAttribute("outputs")
              .split(",")
              .concat(cellDef.outputs || [])
              .reduce((o, e) => {
                if(!o.includes(e) && e) o.push(e);
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

function EditDescriptionModal({show, value, onChange, onHide}) {
    return (
      <Modal show={show} onHide={() => onHide(false)} bsSize="large">
        <Modal.Header closeButton>
          <Modal.Title>Description</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup>
              <Col sm={12}>
                <FormControl componentClass="textarea"
                 value={value || ""}
                 rows={15}
                 placeholder={"Description or website"}
                 autoFocus
                 onChange={onChange} />
             </Col>
            </FormGroup>
            <FormGroup>
              <Col sm={12}>
                <Button onClick={() => onHide(true)} bsStyle={"primary"}>
                  Save
                </Button>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
      </Modal>
    )
}

function commitVersion(id, label, onSuccess) {
  fetch_post(`/api/v01/activities/${id}/versions`, {label: label})
    .then(onSuccess)
    .catch(error => NotificationsManager.error("Failed to commit.", error.message))
}

function CommitVersionModal({show, onHide, id}) {
  const [label, setLabel] = useState("");

  return (
    <Modal show={show} onHide={() => onHide(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Commit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={e => {
          e.preventDefault();
          commitVersion(id, label, () => onHide(true))
        }} horizontal>
          <Alert bsStyle={"info"}>
            You are about to commit the current working version of this workflow.<br/>
            When committed, this version cannot be modified anymore.
          </Alert>
          <FormGroup>
            <Col sm={12}>
                <FormControl
                  componentClass="input"
                  value={label}
                  placeholder={"Some reference"}
                  autoFocus
                  onChange={e => setLabel(e.target.value)} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col sm={12}>
              <Button
                disabled={!label.length}
                type={"submit"}
                bsStyle={"primary"}>
                Commit
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

function downloadDefinition(activity) {
  let element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activity.definition, null, 2)));
  element.setAttribute('download', `${activity.name}.json`);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function compareActivitiesDef(a, b) {
  return (b.definition &&
    (
      typeof b.definition === "string" &&
        JSON.stringify(JSON.parse(a.definition)) !== JSON.stringify(JSON.parse(b.definition)) ||
      typeof b.definition === "object" &&
        JSON.stringify(JSON.parse(a.definition)) !== JSON.stringify(b.definition)
    )
  )
}

const DefaultDescriptionStyle = {
    height: 25,
    overflowY: 'hidden',
    textOverflow: 'ellipsis'
};

const ExpandedDescriptionStyle= {
    textOverflow: 'ellipsis'
};


export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}


const WORKING_VERSION_LABEL = "*working*";

export function ActivityEditor(props) {
    const [cells, setCells] = useState([]);
    const [configuration, setConfiguration] = useState({});
    const [currentActivity, setCurrentActivity] = useState(null);
    const [newActivity, setNewActivity] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [editor, setEditor] = useState(null);
    const [newCell, showNewCell] = useState(false);
    const [newName, showNewName] = useState(false);
    const [editedCell, setEditedCell] = useState(undefined);
    const [alertNewVersion, setAlertNewVersion] = useState(false);
    const [showEditDescription, setShowEditDescription] = useState(false);
    const [showCommit, setShowCommit] = useState(false);
    const [description, setDescription] = useState("");
    const [descriptionStyle, setDescriptionStyle] = useState(DefaultDescriptionStyle);
    const [versionId, setVersionId] = useState();
    const [versions, setVersions] = useState([]);
    const [width, height] = useWindowSize();

    useEffect(() => {
        fetchConfiguration(setConfiguration);
        fetchCells(setCells);
        document.title = "Editor";
    }, []);

    const editorRef = useRef(null);
    const titleRef = useRef(null);
    const activityId = props.match.params.activityId;

    useEffect(() => {
        import("./editor").then(editor => {
          if(editorRef.current === null) return;

          const e = editor.default(
            ReactDOM.findDOMNode(editorRef.current),
            // newActivity ? NEW_ACTIVITY : currentActivity,
            {
              onEdit: cell => setEditedCell(cell),
            },
            {
              title: ReactDOM.findDOMNode(titleRef.current),
            },
            {
              configuration: configuration,
              cells: cells,
            }
          );
          e.getDefinition = function(titleNode) {
            const r = editor.getDefinition(this, titleNode);
            Object.keys(r.activity.definition.cells).map(c => delete r.activity.definition.cells[c].name);
            return r;
          }
          currentActivity && editor.updateGraphModel(e, currentActivity, {title: ReactDOM.findDOMNode(titleRef.current)});
          setEditor(e);
        })
    }, [editorRef, titleRef, currentActivity, newActivity, cells]);

    useEffect(() => {
      // force the width of the container
      if (editor && editorRef.current) {
        import("./editor").then(e => e.fitEditor(editor.graph, ReactDOM.findDOMNode(editorRef.current)));
      }
    }, [height, width, editor, editorRef]);

    useEffect(() => {
        editor && editor.addAction('add_process', () =>
            showNewCell(true)
        );
        editor && editor.addAction('clone_process', () => {
            const cell = editor.graph.getSelectionCell();
            if(cell) {
              showNewName(true);
            }
        });

    }, [editor]);

    useEffect(() => {
        if(activityId) {
            fetchActivity(
                activityId,
                activity => {
                    setCurrentActivity(activity);
                    setDescription(activity.description);
                    setNewActivity(false);
                    document.title = `Editor - ${activity.name}`;
                }
            );
            fetchActivityVersions(activityId, r => { setVersions(r); setVersionId((r.find(v => v.active) || {}).id); })
        }
    }, [activityId]);

    useEffect(() => {
      if(versionId) {
        fetchActivityVersions(activityId, r => {
          setVersions(r);
          const v = r.find(v => v.id === versionId);
          setNewActivity(false);
          setCurrentActivity(a => ({...a, definition: v.definition, working: v.label === null}));
        })
      }
    }, [versionId]);

    const versionsOptions = versions.map(ov => {
      const v = Object.assign({}, ov);
      v.value = v.label || "";
      if(v.label === null) {v.label = WORKING_VERSION_LABEL; v.working=true;}
      if(v.active) {v.label = <i>{`${v.label} (active)`}</i>;}
      return v;
    });
    const currentVersion = versionsOptions.find(v => v.id === versionId);
    const canCommit = currentVersion && !currentVersion.value;
    const canSave = currentActivity && currentActivity.working;

    useEffect(() => {
      if(currentVersion && currentVersion.working) {
        const i = setInterval(() => {
          fetchActivityVersions(activityId, r => {
            const v = r.find(v => v.id === currentVersion.id);
            setAlertNewVersion(compareActivitiesDef(v, currentVersion));
          })
        }, 3000);
        return () => clearInterval(i);
      }
    }, [activityId, currentVersion]);

    const save = () => {
      const r = editor.getDefinition(ReactDOM.findDOMNode(titleRef.current).value);
      if(!r.hasAStart) {
          alert("the workflow need a `start`");
          return false;
      }
      const {activity} = r;
      if(activity.name.length === 0) {
        alert("The workflow need a name");
        return false;
      }
      Object.keys(activity.definition.cells).map(c => delete activity.definition.cells[c].name);
      activity.id = currentActivity.id;
      saveActivity(
        activity,
        resp => {
          editor.graph.getDefaultParent().originalActivity = activity;
          activity.id = resp.id;
          setCurrentActivity(activity);
          setNewActivity(false);
          fetchActivityVersions(activityId, setVersions);
        }
      )
      return true;
    }

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                <LinkContainer to={`/transactions/config/activities/editor`}>
                    <Breadcrumb.Item><FormattedMessage id="activity-editor" defaultMessage="Activities"/></Breadcrumb.Item>
                </LinkContainer>
                <Breadcrumb.Item active>
                  {(currentActivity && currentActivity.name) || activityId}
                  {' '}
                </Breadcrumb.Item>
            </Breadcrumb>
            <Row>
              <Col sm={11}>
                <p style={descriptionStyle}>
                  { currentActivity && (currentActivity.description || "no description").split("\n").map(d => <>{d}<br/></>) }
                </p>
                {descriptionStyle.height ?
                  <Button bsStyle={"link"} onClick={() => setDescriptionStyle(ExpandedDescriptionStyle)}>show
                    all</Button> :
                  <Button bsStyle={"link"} onClick={() => setDescriptionStyle(DefaultDescriptionStyle)}>show
                    less</Button>
                }
              </Col>
              <Col sm={1}>
                <Button onClick={() => setShowEditDescription(true)}>Edit</Button>
                <EditDescriptionModal
                  show={showEditDescription}
                  onChange={e => setDescription(e.target.value)}
                  value={description}
                  onHide={save =>
                    save ? saveActivity(
                      {id: currentActivity.id, description: description},
                      () => {
                        setCurrentActivity(a => update(a, {$merge: {description: description}}));
                        setShowEditDescription(false);
                      }
                    ) :
                      setShowEditDescription(false)
                  }
                />
              </Col>
            </Row>
            <hr />
            <Row>
                <Col sm={3}>
                    <FormControl componentClass="input" placeholder="Name" ref={titleRef}/>
                </Col>
                <Col md={8}>
                    <ButtonToolbar>
                        <ButtonGroup>
                            <Button onClick={() => save()} disabled={!canSave}>Save</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor && editor.execute("add_process")} disabled={!canSave}>+</Button>
                            <Button onClick={() => editor && editor.execute("clone_process")} disabled={!canSave}>🐑</Button>
                            <Button onClick={() => editor && editor.execute("delete")} disabled={!canSave}>✘</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor && editor.execute("undo")} disabled={!canSave}>⤾</Button>
                            <Button onClick={() => editor && editor.execute("redo")} disabled={!canSave}>⤿</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor && editor.execute("zoomIn")}>🔍 +</Button>
                            <Button onClick={() => editor && editor.execute("zoomOut")}>🔍 -</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor && editor.execute("fit")}>fit</Button>
                            <Button onClick={() => editor && editor.execute("show")}>👓</Button>
                            <Button onClick={() => editor && editor.execute("showDefinition")}>txt</Button>
                            <Button onClick={() => {
                              editor && downloadDefinition(editor.getDefinition(ReactDOM.findDOMNode(titleRef.current).value).activity);
                            }}>
                              <FontAwesomeIcon icon={faArrowDown} />
                            </Button>
                            <Button onClick={() => editor && editor.execute("upload_definition")} disabled={!canSave}>
                              <FontAwesomeIcon icon={faArrowUp} />
                            </Button>
                            <Button onClick={() => setShowStats(true)}><FontAwesomeIcon icon={faChartBar} /></Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </Col>
            </Row>
            <Row>
                <Col sm={3}>
                    <Select
                      className="basic-single"
                      classNamePrefix="select"
                      value={currentVersion}
                      isSearchable={true}
                      name="activity-version"
                      onChange={(value, action) => {
                          if(["select-option"].includes(action.action)) {
                            if(compareActivitiesDef(currentVersion, editor.getDefinition().activity)) {
                              if(window.confirm("You have pending / unsaved changes, do you want to lose them?")) {
                                setVersionId(value.id);
                              }
                            } else {
                              setVersionId(value.id);
                            }
                          }
                      }}
                      options={versionsOptions} />
              </Col>
              <Col md={8}>
                <Button disabled={!canCommit} onClick={() => {
                  save() && setShowCommit(true)
                }}>Commit</Button>
                <Button
                  disabled={!currentVersion || currentVersion.active}
                  onClick={() => activateVersion(currentActivity.id, versionId, () => {
                    fetchActivityVersions(activityId, r => {
                      setVersions(r);
                      setVersionId((r.find(v => v.active) || {}).id);
                    });
                  })}>Activate</Button>
              </Col>
            </Row>
            {
              alertNewVersion &&
                <Alert bsStyle={"danger"}>
                  A new version has been saved in the meantime.<br/>
                  Refresh to have the very last version.
                </Alert>
            }
            <Row>
                <Col sm={12}>
                    <div ref={editorRef} style={{backgroundImage: `url(${GridPic})`}} />
                </Col>
            </Row>
            <hr />
            <Row>
                <Col>
                    <SimulatorPanel activity={() => {
                        let a = editor.getDefinition(ReactDOM.findDOMNode(titleRef.current).value).activity;
                        Object.keys(a.definition.cells).map(c => delete a.definition.cells[c].name);
                        return a;
                    }} />
                </Col>
            </Row>

            <CommitVersionModal
                show={showCommit}
                onHide={c => {
                  c && fetchActivityVersions(activityId, r => {
                    setVersions(r);
                    setVersionId((r.find(v => v.active) || {}).id);
                  });
                  setShowCommit(false);
                }}
                id={activityId} />

            <ActivityStatsModal
                show={showStats}
                onHide={() => setShowStats(false)}
                id={activityId} />

            <NewCellModal
                show={newCell}
                cells={cells}
                activity={editor && editor.getDefinition().activity}
                onHide={c => {
                  showNewCell(false);
                  if(c) {
                    // merge the output(s) if needed
                    // clone c.def before changing it.
                    const c_def = JSON.parse(JSON.stringify(c.def));
                    if(c.customOutputs) {
                      c_def.outputs = c.def.outputs.concat(c.customOutputs).reduce((u, i) => u.includes(i) ? u : [...u, i], []);
                    }
                    import("./editor").then(e => e.addNode(editor, c_def, c.name, c.params));
                  }
                }}
            />

            <NewNameModal
                show={newName}
                title={"New cell"}
                isValidName={name => editor && !Object.keys(editor.getDefinition().activity.definition.cells).includes(name)}
                onHide={newName => import("./editor").then(e => {
                    showNewName(false);
                    if(!newName) return;
                    const cell = editor.graph.getSelectionCell();
                    const cDef = cells.find(c => c.original_name === cell.getAttribute("original_name"));
                    if(cDef) {
                        const c_def = JSON.parse(JSON.stringify(cDef));
                        c_def.outputs = (cell.getAttribute('outputs') || "").split(",");
                        const params = (cell.getAttribute('attrList') || "").split(",").reduce((xa, a) => {xa[a] = cell.getAttribute(a); return xa;}, {});
                        e.addNode(editor, c_def, newName, params);
                    }
                })} />

            <EditCellModal
                cell={editedCell}
                show={editedCell !== undefined}
                cells={cells}
                activity={editor && editor.getDefinition().activity}
                onHide={c => {
                  setEditedCell(undefined);
                  if(c === null) return;

                  const activity = editor && editor.getDefinition().activity;
                  if(c.originalName === "entity") {
                    const i = activity.definition.entities.findIndex(e => e.name === c.name)
                    activity.definition.entities[i]["params"] = c.params;
                    if(c.outputs !== undefined) {
                      activity.definition.entities[i]["outputs"] = c.outputs;
                    }
                  } else {
                    activity.definition.cells[c.name]["params"] = c.params;
                    if(c.outputs !== undefined) {
                      activity.definition.cells[c.name]["outputs"] = c.outputs;
                    }
                  }
                  import("./editor").then(e => e.updateGraphModel(editor, activity, {clear: true, nofit: true}));
                }} />
        </>
    );
}
