import React, {useState, useEffect, useRef, useLayoutEffect} from 'react';
import ReactDOM from 'react-dom';
import {Redirect} from "react-router";
import {
  fetch_post,
  fetch_get,
  fetch_delete,
  fetch_put,
  NotificationsManager,
  AuthServiceManager,
  API_URL_PREFIX, userLocalizeUtcDate, downloadJson
} from "../utils";

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
import SplitButton from "react-bootstrap/lib/SplitButton";
import MenuItem from "react-bootstrap/lib/MenuItem";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp, faBell, faBellSlash,
  faBolt,
  faChartBar, faCog,
  faCopy, faDatabase, faDirections,
  faDownload, faEnvelope, faFileCsv, faFileExcel, faFileMedicalAlt, faHome, faPaste, faPlay, faPowerOff, faSearch,
  faSpinner, faStop, faStopwatch, faStream,
  faUserCog, faUsers
} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import Checkbox from "react-bootstrap/lib/Checkbox";
import {fetchConfiguration, Param2Input} from "./nodeInputs";
import Ajv from "ajv";
import Select from "react-select";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import moment from "moment";
import deepEqual from "../utils/deepEqual";
import { readFile } from './startup_events';
import { useDropzone } from 'react-dropzone';


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

export function fetchCells(onSuccess) {
    fetch_get('/api/v01/cells')
        .then(data => onSuccess(data.cells))
        .catch(console.error);
}

export function fetchActivities(onSuccess) {
    fetch_get('/api/v01/activities')
        .then(data => onSuccess(data.activities))
        .catch(console.error);
}

export function fetchActivity(activityId, cb) {
    fetch_get('/api/v01/activities/' + activityId)
        .then(data => cb(data.activity))
        .catch(console.error);
}

export function deleteActivity(activityId, cb) {
    fetch_delete(`/api/v01/activities/${activityId}`)
        .then(r => r.json())
        .then(data =>{
            cb && cb(data);
            NotificationsManager.success("Activity deleted");
        })
        .catch(error => {
            if(error.response.status === 404) {
              console.log(`activity ${activityId} not found`)
              return
            }
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

function updateVersion(activity_id, version_id, diff) {
  return fetch_put(`/api/v01/activities/${activity_id}/versions/${version_id}`, diff);
}

function fetchActivityUsage(id, onSuccess) {
    fetch_get(`/api/v01/activities/${id}/usage`)
        .then(resp => onSuccess(resp))
        .catch(error => {
            NotificationsManager.error("Failed to fetch usage", error.message);
        });
}

function fetchActivityVersions(id, onSuccess) {
    fetch_get(`/api/v01/activities/${id}/versions`)
        .then(resp => onSuccess(resp.activity_versions))
        .catch(error => {
            console.error("Failed to fetch versions", error);
        });
}

function deleteVersion(id, versionId, onSuccess) {
    fetch_delete(`/api/v01/activities/${id}/versions/${versionId}`)
        .then(resp => {
            NotificationsManager.success(`Version ${versionId} deleted`)
            onSuccess && onSuccess()
        })
        .catch(error => {
            NotificationsManager.error(`Failed to delete the version ${versionId}`, error.message);
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

function downloadActivity(id, definitionOnly) {
    AuthServiceManager
      .getValidToken()
      .then(token => window.location = `${API_URL_PREFIX}/api/v01/activities/${id}/export?def_only=${definitionOnly?1:0}&auth_token=${token}`)
}

function downloadActivityVersions(id) {
    AuthServiceManager
      .getValidToken()
      .then(token => window.location = `${API_URL_PREFIX}/api/v01/activities/${id}/versions/export?auth_token=${token}`)
}

export function NewActivity(props) {
    const {show, onClose, onCreated} = props;
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
                                autoFocus
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
                                        saveActivity(newActivity, a => {
                                          setRedirect(a.id);
                                          onCreated && onCreated(a.id);
                                        });
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

function SearchBar({onSearch, size}) {
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

function CommitActivities({show, onHide, count, onCommit}) {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => setLabel(""), [show]);

  return (
    <Modal show={show} onHide={() => onHide(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{`Commit ${count} activities`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={e => {
          e.preventDefault();
          onCommit(label, message, () => onHide(true))
        }} horizontal>
          <Alert bsStyle={"info"}>
            You are about to commit the current working version of these workflows.<br/>
            When committed, these versions cannot be modified anymore.
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
                <FormControl
                  componentClass="textarea"
                  value={message}
                  placeholder={"Some description..."}
                  autoFocus
                  onChange={e => setMessage(e.target.value)} />
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

export function Activities({user_info}) {
    const [activities, setActivities] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [showCommit, setShowCommit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [duplicateActivity, setDuplicateActivity] = useState();
    const [selected, setSelected] = useState([]);
    const [showImport, setShowImport] = useState(false);

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

    const filteredActivities = activities.filter(a => filter.length === 0 || a.name.includes(filter));

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="activity-editor" defaultMessage="Activities"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <Button bsStyle='primary' onClick={() => setShowNew(true)}>
                            <FormattedMessage id="new" defaultMessage="New" />
                        </Button>

                        <Button
                          bsStyle="primary"
                          onClick={() => setShowCommit(true)}
                          disabled={selected.length === 0 || activities.filter(a => selected.includes(a.id) && a.version_label).length !== 0}>
                          <FormattedMessage id="commit" defaultMessage="Commit"/>
                        </Button>

                        <DeleteConfirmButton
                          button={"Delete"}
                          disabled={selected.length === 0}
                          resourceName={`${selected.length} activities`}
                          onConfirm={() => {
                            selected.map(s => deleteActivity(s, () => fetchActivities(setActivities)));
                            setSelected([]);
                          }}>
                          <FormattedMessage id="delete" defaultMessage="Delete" />
                        </DeleteConfirmButton>

                        <Button bsStyle='primary' onClick={() => setShowImport(true)}>
                            <FormattedMessage id="import" defaultMessage="Import" />
                        </Button>
                    </ButtonToolbar>

                    <NewActivity
                        show={showNew}
                        onClose={() => setShowNew(false)} />

                    <CommitActivities
                        show={showCommit}
                        onHide={() => setShowCommit(false)}
                        count={selected.length}
                        onCommit={(label, message) => selected.map(s => {
                          commitVersion(s, label, message,() => fetchActivities(setActivities));
                          setSelected([]);
                        })} />
                </Panel.Body>
            </Panel>

            <Panel>
                <Panel.Body>
                    <SearchBar onSearch={s => {
                      setFilter(s);
                      setSelected([]);
                    }} />
                    <Table>
                        <thead>
                            <tr>
                                <th>
                                  <Checkbox
                                    checked={selected.length === filteredActivities.length}
                                    onChange={e =>
                                      e.target.checked ? setSelected(filteredActivities.map(a => a.id)) : setSelected([])
                                    } />
                                </th>
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
                            filteredActivities
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(a => (
                                    <tr key={a.id}>
                                        <td>
                                          <Checkbox
                                            checked={selected.includes(a.id)}
                                            onChange={e =>
                                              e.target.checked?
                                                setSelected([...selected, a.id]):
                                                setSelected(selected.filter(s => s !== a.id))
                                            } />
                                        </td>
                                        <td>{a.name}</td>
                                        <td>{a.version_label || WORKING_VERSION_LABEL}</td>
                                        <td>{userLocalizeUtcDate(moment.utc(a.created_on), user_info).format()}</td>

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

                                                <SplitButton
                                                  id={"export-activity"}
                                                  bsStyle="primary"
                                                  title={<FontAwesomeIcon icon={faDownload}/>}
                                                  onClick={() => downloadActivity(a.id)}>
                                                    <MenuItem
                                                      id={"export-activity-versions"}
                                                      onClick={() => downloadActivityVersions(a.id)}>
                                                      <FormattedMessage
                                                        id="all-versions"
                                                        defaultMessage="All versions" />
                                                    </MenuItem>
                                                    <MenuItem
                                                      id={"export-activity-definition-only"}
                                                      onClick={() => downloadActivity(a.id, true)}>
                                                      <FormattedMessage
                                                        id="definition-only"
                                                        defaultMessage="Def. only (compat. <0.18)" />
                                                    </MenuItem>
                                                </SplitButton>
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
                            if(!name) {
                              setDuplicateActivity(undefined);
                              return;
                            }
                            fetchActivity(duplicateActivity, a => {
                              a.name = name;
                              delete a.id;
                              try {
                                a.definition = JSON.parse(a.definition);
                              } catch (e) {
                                console.log(e)
                              }
                              saveActivity(a, () => {
                                setDuplicateActivity(undefined);
                                loadActivities();
                              });
                            })
                        }} />
                    <ImportActivitiesModal
                      show={showImport}
                      onHide={() => setShowImport(false)} />
                </Panel.Body>
            </Panel>
        </>
    )
}

async function importActivity(data, options) {
  const url = new URL(API_URL_PREFIX + `/api/v01/activities/import`);
  Object.entries(options).map(([k, v]) => url.searchParams.append(k, v));
  return fetch_post(url, data);
}

async function importActivities(inputFiles, options, onSuccess, onError) {
  for(let i = 0; i <inputFiles.length; i++) {
    const inputFile = inputFiles[i];

    try {
      const c = await readFile(inputFile);
      const body = JSON.parse(c);
      // if the exports contains all versions, only import the active one
      if(body.activity !== undefined && body.versions !== undefined) {
        body=body.activity;
      }
      await importActivity(body, options);

      onSuccess(i)
    } catch(e) {
      console.error("failed to import route", e)
      onError && onError(i, e)
    }
  }
}

function ImportActivitiesModal({show, onHide}) {
  const [errors, setErrors] = useState([]);
  const [loaded, setLoaded] = useState([]);
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
  } = useDropzone({accept: 'application/json'});
  const [options, setOptions] = useState({activateNewVersion: true});

  useEffect(() => {
    if(!show) {
      setErrors([]);
      setLoaded([]);
      setOptions({activateNewVersion: true});
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
    <Modal show={show} onHide={() => {
      onHide(true);
      setErrors([]);
      setLoaded([]);
    }} backdrop={false} bsSize="large">
      <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage id="import" defaultMessage="Import"/>
          </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <section className="dropcontainer" >
              <div {...getRootProps({className: 'dropzone'})} >
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Rejected
            </Col>
            <Col sm={9}>
              <ul style={{color: "red"}}>{fileRejectionItems}</ul>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Files
            </Col>
            <Col sm={9}>
              <ul>{acceptedFileItems}</ul>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              Merging options
            </Col>
            <Col sm={9}>
              <Checkbox
                checked={options.replaceWorkingVersion}
                onChange={e => setOptions(update(options, {$merge: {replaceWorkingVersion: e.target.checked}}))}>
                <FormattedMessage
                  id="replace-working-version"
                  defaultMessage='Replace working versions'/>
              </Checkbox>
              <HelpBlock>
                Replace the working version in-place.
                Otherwise if no matching definition is found, the import is rejected
              </HelpBlock>

              <Checkbox
                disabled={!options.replaceWorkingVersion}
                checked={options.commitCurrentWorkingVersion}
                onChange={e => setOptions(update(options, {$merge: {commitCurrentWorkingVersion: e.target.checked}}))}>
                <FormattedMessage
                  id="commit-current-working-version"
                  defaultMessage='Commit current working version'/>
                <FormControl
                  disabled={!options.commitCurrentWorkingVersion}
                  componentClass="input"
                  value={options.commitCurrentWorkingVersionLabel || ""}
                  onChange={e => setOptions(update(options, {$merge: {commitCurrentWorkingVersionLabel: e.target.value}}))}
                  placeholder="commit label" />
              </Checkbox>
              <HelpBlock>
                Save the current working version in a commit.
                (The saved version remain activated)
              </HelpBlock>

              <Checkbox
                checked={options.activateNewVersion}
                onChange={e => setOptions(update(options, {$merge: {activateNewVersion: e.target.checked}}))}>
                <FormattedMessage
                  id="activate-new-version"
                  defaultMessage='Activate new version'/>
              </Checkbox>
              <HelpBlock>
                Activate the new working version if not yet active.
              </HelpBlock>
            </Col>
          </FormGroup>

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

                    importActivities(
                      acceptedFiles,
                      options,
                      i => setLoaded(l => update(l, {$push: [i]})),
                      (i, e) => setErrors(es => update(es, {$push: [{id: i, error: e.message}]})),
                    )
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


function ActivityStatsModal({show, onHide, id}) {
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

function EditVersionModal({show, activityID, version, onHide}) {
  const [diff, setDiff] = useState({});

  const localVersion = update(version, {$merge: diff});

  return (
    <Modal show={show} onHide={() => {
      setDiff({});
      onHide();
    }}>
      <Modal.Header closeButton>
        <Modal.Title>Edit version</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal onSubmit={e =>  {
          e.preventDefault();
          updateVersion(activityID, version.id, diff).then(() => {
            setDiff({});
            onHide(true);
          }).catch(e => {
            NotificationsManager.error(
              <FormattedMessage
                id="edit-version-error" 
                defaultMessage="Error while editing version: {error}"
                values={{error: e.message}}/>,
              e.message
            );
          });
        }}>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="label" defaultMessage="Label" />
            </Col>
            <Col sm={10}>
              <FormControl
                type="text"
                value={localVersion.label}
                onChange={e => setDiff(update(diff, {$merge: {label: e.target.value}}))} />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="message" defaultMessage="Message" />
            </Col>
            <Col sm={10}>
              <FormControl
                type="text"
                value={localVersion.message}
                onChange={e => setDiff(update(diff, {$merge: {message: e.target.value}}))} />
            </Col>
          </FormGroup>
          
          <FormGroup>
            <Col smOffset={2} sm={10}>
              <Button type={"submit"} >
                Save
              </Button>
            </Col>
          </FormGroup>
        </Form>
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

const sortedNodes = [
  "start",
  "end",
  "http_call",
  "rest_call",
  "json_call",
  "async_json_call",
  "xml_call",
  "bsft_call",
  "proxy_session_call",
  "proxy_call",
  "tcp_call",
  "context_setter",
  "multi_context_setter",
  "sync_response",
  "callback_response",
  "trigger_manual_action",
  "cancel_manual_action",
  "send_email_template",
  "send_sms",
  "sql_exec",
  "sql_exec_with_return",
  "sql_select",
  "boolean_expression",
  "switch",
  "or_outputs",
  "sync_outputs",
  "timer",
  "context_timer",
  "stop_timer",
  "generate_ott",
  "generate_random_string",
  "set_request_status",
  "set_task_status",
  "macro",
  "trigger_subworkflows",
  "create_user",
  "update_user",
  "delete_user",
  "get_owner",
  "search_transactions",
  "create_csv",
  "create_excel_sheet",
  "powershell",
  "ftp",
  "entity",
];

function nodeLabel(name, size) {
  let s = {style:{}, label: name, name: name};
  switch(size) {
    case "big":
      s.style = {fontSize: '40px'}
      break;
  }

  switch(name) {
    case "start":
      s.style.color = "blue";
      s.icon=faPlay;
      s.label = "Start";
      break;
    case "end":
      s.style.color = "blue";
      s.icon=faPowerOff;
      s.label = "End";
      break;
    case "rest_call":
      s.style.color = "blue";
      s.icon=faStream;
      s.label = "REST call";
      break;
    case "json_call":
      s.style.color = "blue";
      s.icon=faStream;
      s.label = "JSON call [deprecated]";
      break;
    case "async_json_call":
      s.style.color = "blue";
      s.icon=faStream;
      s.label = "Asynchronous JSON call";
      break;
    case "http_call":
      s.style.color = "blue";
      s.icon=faStream;
      s.label = "HTTP call";
      break;
    case "xml_call":
      s.style.color = "blue";
      s.icon=faStream;
      s.label = "XML call";
      break;
    case "bsft_call":
      s.style.color = "orange";
      s.icon=faStream
      s.label = "Broadsoft XSP/ADP call [experimental]";
      break;
    case "proxy_session_call":
      s.style.color = "orange";
      s.icon=faStream
      s.label = "Broadsoft proxy session call";
      break;
    case "proxy_call":
      s.style.color = "blue";
      s.icon=faStream
      s.label = "Proxy HTTP call";
      break;
    case "tcp_call":
      s.style.color = "purple";
      s.icon=faStream
      s.label = "TCP call [experimental]";
      break;
    case "context_setter":
      s.style.color = "purple";
      s.icon=faPaste;
      s.label = "Context setter";
      break;
    case "sync_response":
      s.style.color = "purple";
      s.icon=faPaste;
      s.label = "Synchronous response";
      break;
    case "callback_response":
      s.style.color = "purple";
      s.icon=faPaste;
      s.label = "Callback response";
      break;
    case "multi_context_setter":
      s.style.color = "purple";
      s.icon=faPaste;
      s.label = "Multiple context setter";
      break;
    case "cancel_manual_action":
      s.style.color = "green";
      s.icon=faBellSlash;
      s.label = "Cancel manual action";
      break;
    case "trigger_manual_action":
      s.style.color = "green";
      s.icon=faBell;
      s.label = "Trigger manual action";
      break;
    case "send_email_template":
      s.style.color = "blue";
      s.icon=faEnvelope;
      s.label = "Send email";
      break;
    case "send_sms":
      s.style.color = "blue";
      s.icon=faEnvelope;
      s.label = "Send SMS";
      break;
    case "sql_exec":
      s.style.color = "cyan";
      s.icon=faDatabase;
      s.label = "SQL Exec";
      break;
    case "sql_exec_with_return":
      s.style.color = "cyan";
      s.icon=faDatabase;
      s.label = "SQL Exec with return";
      break;
    case "sql_select":
      s.style.color = "cyan";
      s.icon=faDatabase;
      s.label = "SQL Select";
      break;
    case "boolean_expression":
      s.style.color = "#FF8C00";
      s.icon = faDirections;
      s.label ="Boolean expression";
      break;
    case "switch":
      s.style.color = "#FF8C00";
      s.icon = faDirections;
      s.label ="Switch";
      break;
    case "or_outputs":
      s.style.color = "#2F4F4F";
      s.icon = faCog;
      s.label= "Or";
      break;
    case "sync_outputs":
      s.style.color = "#2F4F4F";
      s.icon = faCog;
      s.label= "Join";
      break;
    case "timer":
      s.style.color = "#E5D83DFF";
      s.icon = faStopwatch;
      s.label = "Timer";
      break;
    case "stop_timer":
      s.style.color = "#E5D83DFF";
      s.icon = faStop;
      s.label = "Stop timer";
      break;
    case "context_timer":
      s.style.color = "#E5D83DFF";
      s.icon = faStopwatch;
      s.label ="Context timer";
      break;
    case "generate_ott":
      s.style.color = "#5ce53d";
      s.icon = faCog;
      s.label = "Generate OTT";
      break;
    case "generate_random_string":
      s.style.color = "#5ce53d";
      s.icon = faCog;
      s.label = "Generate random string";
      break;
    case "set_request_status":
      s.style.color = "#5ce53d";
      s.icon = faCog;
      s.label = "Set request status";
      break;
    case "set_task_status":
      s.style.color = "#5ce53d";
      s.icon = faCog;
      s.label = "Set task status";
      break;
    case "macro":
      s.style.color = "blue";
      s.icon = faCog;
      s.label = "Macro";
      break;
    case "trigger_subworkflows":
      s.style.color = "blue";
      s.icon = faCog;
      s.label = "Suborkflow";
      break;
    case "create_user":
      s.style.color = "red";
      s.icon = faUsers;
      s.label = "Create user";
      break;
    case "update_user":
      s.style.color = "red";
      s.icon = faUsers;
      s.label = "Update user";
      break;
    case "delete_user":
      s.style.color = "red";
      s.icon = faUsers;
      s.label = "Delete user";
      break;
    case "get_owner":
      s.style.color = "purple";
      s.icon = faUserCog;
      s.label = "Get Owner";
      break;
    case "search_transactions":
      s.style.color = "pink";
      s.icon = faSearch;
      s.label = "Search transactions";
      break;
    case "create_csv":
      s.style.color = "green";
      s.icon = faFileCsv;
      s.label = "CSV file";
      break;
    case "create_excel_sheet":
      s.style.color = "green";
      s.icon = faFileExcel;
      s.label = "Excel file";
      break;
    case "powershell":
      s.style.color = "blue";
      s.icon = faBolt;
      s.label = "Powershell";
      break;
    case "ftp":
      s.style.color = "green";
      s.icon = faFileMedicalAlt;
      s.label = "sFTP";
      break;
    case "entity":
      s.style.color = "blue";
      s.icon = faHome;
      s.label = "Entity";
      break;
  }

  return (
    <>
      <div>
        <FontAwesomeIcon icon={s.icon} style={s.style} />
      </div>
      {s.label}
      {size === "big" && <div className={"pull-right"} style={{opacity: "0.5"}}>[{s.name}]</div>}
    </>
  );
}

const miscDefs = {
  entity: {original_name: "entity", params: [{"name": "events", "nature": "outputs"}], outputs: []},
}

function NewCellModal({show, onHide, cells, activity})  {
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

    useEffect(() => {
      if(name.length === 0 && definition && ["or_outputs", "sync_outputs"].includes(definition.original_name)) {
        setName(definition.original_name.split("_")[0] + "_" + crypto.randomUUID())
      }
    }, [definition, name])

    const params = definition && definition.params && definition
      .params
      .sort((a, b) => a.ui_order - b.ui_order)
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
                staticParams={staticParams}
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
    let currentDefinition = undefined;
    if(definition.original_name || definition.name) {
      currentDefinition = {
        value: definition.original_name || definition.name,
        label: nodeLabel(definition.original_name || definition.name, "small")
      }
    }

    const nodes = Object.values(cells
      .sort((a, b) => sortedNodes.indexOf(a.original_name) - sortedNodes.indexOf(b.original_name))
      .map(cell => ({value: cell.original_name, label: nodeLabel(cell.original_name, "big")})
    ))
    nodes.push({value: "entity", label: nodeLabel("entity", "big")});

    return (
        <Modal show={show} onHide={() => onHide(null)} bsSize={"large"}>
            <Modal.Header closeButton>
                <Modal.Title>New cell</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={e => {
                  e.preventDefault();
                  onHide({def:definition, name:name, params:staticParams, customOutputs: customOutputs});
                }} horizontal>
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
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                value={currentDefinition}
                                isSearchable={true}
                                name="nodes"
                                onChange={(value, action) => {
                                  if(action.action === "select-option") {
                                    const cellDef = cells.find(c => c.original_name === value.value);
                                    setDefinition(cellDef ? cellDef : miscDefs[value.value])
                                  }
                                }}
                                options={nodes}
                            />
                            {
                              definition?.doc && <HelpBlock>{ definition.doc.split("\n").map(m => <>{m}<br/></>) }</HelpBlock>
                            }
                        </Col>
                    </FormGroup>

                    { params }

                    <FormGroup>
                      <Col smOffset={2} sm={10}>
                          <Button
                            type="submit"
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


function StyleItems({data, disabled, onChange}) {
  return (
    <>
      <Table>
        <tbody>
          <tr>
            <td>Background color</td>
            <td>
              <input
              type="color"
              id="color-picker"
              defaultValue='#8CCDF5'
              value={data.background_color}
              disabled={disabled}
              onChange={e => onChange && onChange({...data, background_color: e.target.value})} /></td>
          </tr>
        </tbody>
      </Table>
    </>
  )
}


function OutputsTable({rows, usedRows, onDragEnd, readOnly}) {
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
                draggable={!readOnly}
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
                    disabled={readOnly || usedRows.includes(output.value) || output.custom} />
                </td>
                <td>{output.value}</td>
                <td>
                  <Checkbox
                    checked={output.errorPath}
                    disabled={readOnly}
                    onChange={e => onDragEnd(update(rows, {[i]: {$merge: {errorPath: e.target.checked}}}))} >
                    Error path
                  </Checkbox>
                </td>
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


export function EditCellModal({show, cell, cells, activity, onHide, readOnly = false}) {
    const [staticParams, setStaticParams] = useState({});
    const [name, setName] = useState("");
    const [outputs, setOutputs] = useState([]);
    const [style, setStyle] = useState({});

    const originalName = cell && cell.value.getAttribute('original_name');
    const attrsStr = cell && cell.value.getAttribute('attrList');

    let cellDef = cells && cells.find(c => c.name === originalName);
    if(!cellDef) {
      cellDef = miscDefs[originalName];
    }

    useEffect(() => {
      if(!show) {
        setStaticParams({});
        setOutputs([]);
        setStyle({});
      }
    }, [show]);
    useEffect(() => {
      if(cell) {
        if(cell.value.getAttribute('label')) {
          setName(cell.value.getAttribute('label'));
        }
        if(cell.value.getAttribute("attrList")) {
          setStaticParams(cell.value.getAttribute('attrList').split(",").reduce((o, a) => {
            o[a] = cell.value.params[a];
            return o;
          }, {}))
        }
        if(cell.value.getAttribute("style")) {
          setStyle(JSON.parse(cell.value.getAttribute('style')));
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
                  visible: cell.value.getAttribute("outputs").split(",").includes(e),
                  errorPath: cell.value.getAttribute("error_outputs")?.split(",").includes(e)
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
      if(task === cell.value.getAttribute('label')) {
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
      .sort((a, b) => a.ui_order - b.ui_order)
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
                staticParams={staticParams}
                readOnly={readOnly}
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
                <Col smOffset={2} sm={9}>
                  {nodeLabel(originalName, "big")}
                </Col>
            </FormGroup>

            { cellDef?.doc &&
              <FormGroup>
                <Col smOffset={2} sm={9}>
                  <p><i>{ cellDef.doc.split("\n").map(m => <>{m}<br/></>) }</i></p>
                </Col>
              </FormGroup>
            }

            <hr/>

            <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="name" defaultMessage="Name" />
                </Col>

                <Col sm={9}>
                    <FormControl
                        componentClass="input"
                        readOnly={readOnly}
                        value={name}
                        onChange={e => setName(e.target.value)} />
                </Col>
            </FormGroup>

            { params }

            <hr/>
            {outputs && outputs.length !== 0 &&
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="outputs" defaultMessage="Outputs"/>
                </Col>

                <Col sm={9}>
                  <OutputsTable
                    readOnly={readOnly}
                    rows={outputs} /* visible + invisible */
                    usedRows={usedRows} /* used are checked and disabled */
                    onDragEnd={setOutputs}/>
                </Col>
              </FormGroup>
            }

            <hr/>
            { originalName !== "start" && originalName !== "end" &&
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="style" defaultMessage="Style"/>
                </Col>

                <Col sm={9}>
                  <StyleItems
                    disabled={readOnly}
                    onChange={setStyle}
                    data={style} />
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
                        name: name,
                        oldName: cell.value.getAttribute('label'),
                        originalName: originalName,
                        params: staticParams,
                        outputs: outputs.filter(o => o.visible).map(o => o.value),
                        errorPaths: outputs.filter(o => o.errorPath).map(o => o.value),
                        style: style,
                      });
                    }}
                  >
                    Apply
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

function commitVersion(id, label, message, onSuccess) {
  fetch_post(`/api/v01/activities/${id}/versions`, {label: label, message: message})
    .then(onSuccess)
    .catch(error => NotificationsManager.error("Failed to commit.", error.message))
}

function CommitVersionModal({show, onHide, id}) {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");

  return (
    <Modal show={show} onHide={() => onHide(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Commit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={e => {
          e.preventDefault();
          commitVersion(id, label, message,() => onHide(true))
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
                <FormControl
                  componentClass="textarea"
                  value={message}
                  placeholder={"Some description..."}
                  autoFocus
                  onChange={e => setMessage(e.target.value)} />
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
  downloadJson(activity.name, activity.definition);
}

function compareActivitiesDef(a, b) {
  return (b.definition &&
    (
      typeof b.definition === "string" &&
        !deepEqual(JSON.parse(a.definition), JSON.parse(b.definition)) ||
      typeof b.definition === "object" &&
        !deepEqual(JSON.parse(a.definition), b.definition)
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


export const WORKING_VERSION_LABEL = "*working*";

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
    const [showVersion, setShowVersion] = useState();
    const [usage, setUsage] = useState({});
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
            fetchActivityUsage(activityId, setUsage)
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
    const canSave = canCommit;

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
                <Breadcrumb.Item style={{textTransform: "none"}} active>
                  {(currentActivity && currentActivity.name) || activityId}
                </Breadcrumb.Item>
            </Breadcrumb>
            <Row>
              <Col sm={11}>
                <p style={descriptionStyle}>
                  { currentActivity && (currentActivity.description || "no description").split("\n").map((d, i) => <React.Fragment key={`desc-line-${i}`}>{d}<br/></React.Fragment>) }
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
                            <Button onClick={() => editor?.execute("add_process")} disabled={!canSave} title={"add a node"}>+</Button>
                            <Button onClick={() => editor?.execute("clone_process")} disabled={!canSave} title={"clone a node"}>🐑</Button>
                            <Button onClick={() => editor?.execute("delete")} disabled={!canSave} title={"delete"}>✘</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor?.execute("undo")} disabled={!canSave} title={"undo"}>⤾</Button>
                            <Button onClick={() => editor?.execute("redo")} disabled={!canSave} title={"redo"}>⤿</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor?.execute("zoomIn")} title={"zoom in"}>🔍 +</Button>
                            <Button onClick={() => editor?.execute("zoomOut")} title={"zoom out"}>🔍 -</Button>
                        </ButtonGroup>
                        <ButtonGroup style={{paddingLeft: '1rem'}}>
                            <Button onClick={() => editor?.execute("fit")}>fit</Button>
                            <Button onClick={() => editor?.execute("show")} title={"show"}>👓</Button>
                            <Button onClick={() => editor?.execute("showDefinition")} >txt</Button>
                            <Button onClick={() => {
                              editor && downloadDefinition(editor.getDefinition(ReactDOM.findDOMNode(titleRef.current).value).activity);
                            }} title={"download definition"}>
                              <FontAwesomeIcon icon={faArrowDown} />
                            </Button>
                            <Button onClick={() => editor?.execute("upload_definition")} disabled={!canSave} title={"upload definition"}>
                              <FontAwesomeIcon icon={faArrowUp} />
                            </Button>
                            <Button onClick={() => setShowStats(true)} title={"show stats"}>
                              <FontAwesomeIcon icon={faChartBar} />
                            </Button>
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
                    <div ref={editorRef} style={{overflow: 'hidden', backgroundImage: `url(${GridPic})`}} />
                </Col>
            </Row>
            <hr />
            <Row>
                <Col sm={12}>
                    <Table>
                        <thead>
                            <tr>
                              <th colSpan={2}>Used By</th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                          usage.routes?.map(r => (
                            <tr key={`${r.method}${r.route}`}>
                              <td>{r.method.toUpperCase()}</td>
                              <td>{r.route}</td>
                            </tr>
                          ))
                        }
                        {
                          usage.parents?.map(p => (
                            <tr key={p.id}>
                              <td>{p.id}</td>
                              <td><Link to={`/transactions/config/activities/editor/${p.id}`}>{p.name}</Link></td>
                            </tr>
                          ))
                        }
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <hr />
            <Row>
                <Col sm={12}>
                    <Table>
                      <thead>
                        <tr>
                          <th colSpan={5}>History</th>
                        </tr>
                        <tr>
                          <th>#</th>
                          <th>Label</th>
                          <th>Message</th>
                          <th>Username</th>
                          <th>Date</th>
                          <th/>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        versions.sort((a, b) => b.id - a.id).map((v, i) => (
                          <tr key={`version-${i}`}>
                            <td>{i+1}</td>
                            <td>{v.label || WORKING_VERSION_LABEL}</td>
                            <td>{v.message ? v.message.split("\n").map(m => <>{m}<br/></>) : "-"}</td>
                            <td>{v.username ? `${v.username} (${v.email})` : "-"}</td>
                            <td>{userLocalizeUtcDate(moment.utc(v.updated_on), props.user_info).format()}</td>
                            <td>
                              { v.label &&
                                <ButtonGroup>
                                  <Button 
                                    onClick={() => setShowVersion(v)}
                                    bsStyle="primary">
                                    <Glyphicon glyph="pencil"/>
                                  </Button>
                                  <DeleteConfirmButton
                                    onConfirm={() => deleteVersion(activityId, v.id, () => {
                                      fetchActivityVersions(activityId, r => {
                                        setVersions(r);
                                        setVersionId((r.find(v => v.active) || {}).id);
                                      });
                                    })}
                                    resourceName={`version labelled ${v.label}`} />
                                </ButtonGroup>
                              }
                            </td>
                          </tr>
                        ))
                      }
                      </tbody>
                    </Table>
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
                    import("./editor").then(e => e.addNode(editor.graph, c_def, c.name, c.params));
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
                        c_def.error_outputs = (cell.getAttribute('error_outputs') || "").split(",");
                        c_def.x = cell.geometry.x + 10;
                        c_def.y = cell.geometry.y + 10;
                        c_def.style = cell.getAttribute('style') || "";
                        const params = (cell.getAttribute('attrList') || "").split(",").reduce((xa, a) => {xa[a] = cell.value.params[a]; return xa;}, {});
                        e.addNode(editor.graph, c_def, newName, params);
                    }
                })} />
            
            <EditVersionModal
              show={showVersion !== undefined}
              activityID={activityId}
              version={showVersion || {}}
              onHide={refresh => {
                if(refresh) {
                  fetchActivityVersions(activityId, r => {
                    setVersions(r);
                    setVersionId((r.find(v => v.active) || {}).id);
                  });
                }
                setShowVersion(undefined);
              }}
              />

            <EditCellModal
                cell={editedCell}
                show={editedCell !== undefined}
                cells={cells}
                activity={editor && editor.getDefinition().activity}
                readOnly={!canSave}
                onHide={c => {
                  setEditedCell(undefined);
                  if(c === null) return;

                  const activity = editor && editor.getDefinition().activity;
                  if(c.originalName === "entity") {
                    const i = activity.definition.entities.findIndex(e => e.name === c.oldName)
                    activity.definition.entities[i]["params"] = c.params;
                    if(c.outputs !== undefined) {
                      activity.definition.entities[i]["outputs"] = c.outputs;
                    }
                    if(c.errorPaths !== undefined) {
                      activity.definition.entities[i]["error_outputs"] = c.errorPaths;
                    }
                  } else {
                    activity.definition.cells[c.oldName]["params"] = c.params;
                    if(c.outputs !== undefined) {
                      activity.definition.cells[c.oldName]["outputs"] = c.outputs;
                    }
                    if(c.errorPaths !== undefined) {
                      activity.definition.cells[c.oldName]["error_outputs"] = c.errorPaths;
                    }
                    if(c.style !== undefined) {
                      activity.definition.cells[c.oldName]["style"] = c.style;
                    }
                  }
                  if(c.name !== c.oldName) {
                    console.log("cell name has changed", c.name, c.oldName);
                    if(c.originalName === "entity") {
                      activity.definition.entities.push(c);
                      const i = activity.definition.entities.findIndex(e => e.name === c.oldName);
                      activity.definition.entities.splice(i, 1);
                    } else {
                      activity.definition.cells[c.name] = activity.definition.cells[c.oldName];
                      delete activity.definition.cells[c.oldName];
                    }
                    // adapt transitions
                    activity.definition.transitions = activity.definition.transitions.map(([s, d, extra]) => {
                      if(d === c.oldName) {
                        d = c.name;
                      }
                      const i = s.lastIndexOf(".");
                      const n = s.substring(0, i)
                      if(n === c.oldName) {
                        s = c.name + s.substring(i)
                      }
                      return [s, d, extra];
                    })
                  }
                  import("./editor").then(e => e.updateGraphModel(editor, activity, {clear: true, nofit: true}));
                }} />
        </>
    );
}
