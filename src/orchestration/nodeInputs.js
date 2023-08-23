import React, {useEffect, useState} from "react";
import FormControl from "react-bootstrap/lib/FormControl";
import {fetchRoles} from "../system/user_roles";
import {fetchProfiles} from "../system/user_profiles";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import update from "immutability-helper";
import {fetchActivities, fetchActivity} from "./activity-editor";
import {fetch_get} from "../utils";
import {MentionExample} from "./templateEditor";
import Creatable from 'react-select/creatable';
import Select from "react-select";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import HelpBlock from "react-bootstrap/lib/HelpBlock";


function BasicInput(props) {
  return (
    <FormControl
        componentClass="input"
        {...props} />
  )
}


export function fetchConfiguration(onSuccess) {
    fetch_get('/api/v01/system/configuration')
        .then(data => onSuccess(data.content))
        .catch(console.error);
}

function  DataStoreInput({value, onChange, readOnly}) {
  const [stores, setStores] = useState([]);
  useEffect(() => {
    fetchConfiguration(
      c => c.datastores &&
        setStores(c.datastores.map(h => h.name)
          .sort((a, b) => a.localeCompare(b))
        )
    )
  }, []);
  return (
    <Creatable
      value={{value: value, label: value}}
      isClearable
      isSearchable
      name="data-store"
      onChange={(value, action) => {
        if(["select-option", "create-option", "clear"].includes(action.action)) {
          onChange(value && value.value);
        }
      }}
      options={stores.map(h => ({value: h, label: h}))} />
  )
}

function SessionHolderInput({value, readOnly, onChange}) {
  const [holders, setHolders] = useState([]);
  useEffect(() => {
    fetchConfiguration(
      c => c.gateways &&
        setHolders(Object.entries(c.gateways)
          .map(([name, params]) => params.session_holder)
          .filter(s => s !== undefined)
          .sort((a, b) => a.localeCompare(b))
        )
    )
  }, []);
  return (
    <Creatable
      value={{value: value, label: value}}
      isClearable={!readOnly}
      isSearchable={!readOnly}
      name="session-holder"
      onChange={(value, action) => {
        if(["select-option", "create-option", "clear"].includes(action.action) && !readOnly) {
          onChange(value && value.value);
        }
      }}
      options={holders.map(h => ({value: h, label: h}))} />
  )
}

function TcpSessionHolderInput({value, onChange, readOnly}) {
  const [holders, setHolders] = useState([]);
  useEffect(() => {
    fetchConfiguration(
      c => c.gateways_tcp &&
        setHolders(Object.entries(c.gateways_tcp)
          .map(([name, params]) => params.session_holder)
          .filter(s => s !== undefined)
          .sort((a, b) => a.localeCompare(b))
        )
    )
  }, []);
  return (
    <Creatable
      value={{value: value, label: value}}
      isClearable
      isSearchable
      name="session-holder"
      onChange={(value, action) => {
        if(["select-option", "create-option", "clear"].includes(action.action)) {
          onChange(value?.value);
        }
      }}
      options={holders.map(h => ({value: h, label: h}))} />
  )
}

function FtpSessionHolderInput({value, onChange, readOnly}) {
  const [holders, setHolders] = useState([]);
  useEffect(() => {
    fetchConfiguration(
      c => c.gateways_tcp &&
        setHolders(Object.entries(c.gateways_tcp)
          .filter(([name, params]) => params.url.startsWith("sftp") || params.url.startsWith("ssh"))
          .map(([name, params]) => params.session_holder)
          .filter(s => s !== undefined)
          .sort((a, b) => a.localeCompare(b))
        )
    )
  }, []);
  return (
    <Creatable
      value={{value: value, label: value}}
      isClearable
      isSearchable
      name="session-holder"
      onChange={(value, action) => {
        if(["select-option", "create-option", "clear"].includes(action.action)) {
          onChange(value?.value);
        }
      }}
      options={holders.map(h => ({value: h, label: h}))} />
  )
}

function TaskInput({cells, value, onChange, readOnly}) {
  return (
    <FormControl
        componentClass="select"
        value={value}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        Object.keys(cells)
          .filter(t => !["or_outputs", "sync_outputs", "note", "goto", "start"].includes(cells[t].original_name))
          .sort((a, b) => a.localeCompare(b))
          .map(t => <option value={t} key={t}>{t}</option>)
      }
    </FormControl>
  )
}


function ActivityInput({value, onChange, readOnly}) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivities(setActivities)
  }, []);

  const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.name, label: a.name, id: a.id}));
  const activity = value ? activitiesOptions.find(a => a.value === value): null;

  return (
    <InputGroup>
      <Creatable
          value={{value: value, label: value}}
          isClearable
          isSearchable
          name="activity"
          onChange={(value, action) => {
              if(["select-option", "create-option", "clear"].includes(action.action)) {
                onChange(value?value.value:"");
              }
          }}
          options={activitiesOptions} />
      <InputGroup.Button>
          <Button
              disabled={!value || !activity}
              bsStyle="primary"
              onClick={() => {
                window.open(`/transactions/config/activities/editor/${activity?.id}`, '_blank').focus();
              }}
              style={{marginLeft: '5px'}}
          >
              <Glyphicon glyph="eye-open"/>
          </Button>
      </InputGroup.Button>
    </InputGroup>
  )
}


function UserRoleInput({value, onChange, readOnly}) {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles(roles => setRoles(roles.map(a => a.name).sort((a, b) => a.localeCompare(b))))
  }, []);

  return (
    <FormControl
        componentClass="select"
        value={value}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        roles
          .map(a => <option value={a} key={a}>{a}</option>)
      }
    </FormControl>
  )
}


function UserProfileInput({value, onChange, readOnly}) {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    fetchProfiles(p => setProfiles(p.map(a => a.name).sort((a, b) => a.localeCompare(b))))
  }, []);

  return (
    <FormControl
        componentClass="select"
        value={value}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        profiles
          .map(p => <option value={p} key={p}>{p}</option>)
      }
    </FormControl>
  )
}


function ListInput({options, value, onChange, readOnly}) {
    return (
      <FormControl
          componentClass="select"
          value={value}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={e => onChange(e.target.value)}
      >
        <option value={""}/>
        {
          options
            .map(p => <option value={p} key={p}>{p}</option>)
        }
      </FormControl>
    )
}


function TextareaInput({value, onChange, cells, rows, readOnly}) {
  // todo can become a "list" of key (string) + value (jinja code)
  return (
    <FormControl
        componentClass={MentionExample}
        cells={cells}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        rows={rows}
    />
  )
}


function ContextKey({value, onChange, readOnly}) {
  const invalidOutput = value && value.includes(" ");

  let cleanupFlag = false;
  let key = value;
  if(value) {
    try {
      const o = JSON.parse(value);
      cleanupFlag = o.cleanup;
      key = o.key;
    } catch (e) {
      console.log("old processing for the context key", value, e);
    }
  }

  return (
    <>
      <FormControl
        style={{color: invalidOutput?"red":"black"}}
        value={key}
        disabled={readOnly}
        onChange={e => onChange(JSON.stringify({key: e.target.value, cleanup: cleanupFlag}))} />
      <Checkbox checked={cleanupFlag} onChange={e => onChange(JSON.stringify({key: key, cleanup: e.target.checked}))} disabled={readOnly}>
        Delete key on workflow ending
      </Checkbox>
    </>
  )
}


function ContextKeyValues({value, onChange, readOnly}) {
  const [newEntry, setNewEntry] = useState({key: "", value: "", cleanup: false});

  const addNewEntry = () => {
    const es = [...value || [], newEntry];
    onChange(es)
    setNewEntry({key: "", value: "", cleanup: false});
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>key</th>
          <th>value</th>
          <th>cl.</th>
          <th/>
        </tr>
      </thead>
      <tbody>
      {
        value?.map((e, i) =>
          <tr>
            <td style={{width: "40%"}}>
              {e.key}
            </td>
            <td style={{width: "40%"}}>
              <pre>{e.value}</pre>
            </td>
            <td style={{width: "15%"}}>
              {e.cleanup?"✔️":""}
            </td>
            {!readOnly &&
              <td>
                <Button onClick={() => {
                  onChange(update(value, {$splice: [[i, 1]]}))
                }}>{"-"}</Button>
              </td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td style={{width: "40%"}}>
            <FormControl
              value={newEntry.key}
              onChange={e => setNewEntry(update(newEntry, {$merge: {key: e.target.value}}))} />
          </td>
          <td style={{width: "40%"}}>
            <FormControl
              componentClass="textarea"
              rows={4}
              value={newEntry.value}
              onChange={e => setNewEntry(update(newEntry, {$merge: {value: e.target.value}}))}
              style={{resize: "both"}} />
          </td>
          <td style={{width: "15%"}}>
            <Checkbox
              checked={newEntry.cleanup}
              onChange={e => setNewEntry(update(newEntry, {$merge: {cleanup: e.target.checked}}))} />
          </td>
          <td>
            <Button
              onClick={() => addNewEntry()}
              disabled={newEntry.key.length === 0}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}


export function HttpHeaders({value, onChange, readOnly}) {
  const [newHeader, setNewHeader] = useState(["", ""])

  let headers = [];
  try {
    headers = JSON.parse(value);
  } catch(e) {
    // console.log(e);
  }
  const addNewEntry = () => {
    const hs = [...headers, newHeader];
    onChange(JSON.stringify(hs));
    setNewHeader(["", ""]);
  }

  return (
    <Table>
      <tbody>
      {
        headers.map((head, i) =>
          <tr key={i}>
            <td style={{width: "20%"}}>{head[0]}</td>
            <td>{" : "}</td>
            <td style={{width: "70%"}}>{head[1]}</td>
            {
              !readOnly && <td><Button onClick={() => {
                const hs = headers.filter(h => h[0] !== head[0] && h[1] !== head[1]);
                onChange(JSON.stringify(hs))
              }}>{"-"}</Button></td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td style={{width: "20%"}}>
            <FormControl
              value={newHeader[0]}
              onChange={e => setNewHeader(update(newHeader, {$merge: {[0]: e.target.value}}))} />
          </td>
          <td>{" : "}</td>
          <td style={{width: "70%"}}>
            <FormControl
              value={newHeader[1]}
              onChange={e => setNewHeader(update(newHeader, {$merge: {[1]: e.target.value}}))}
              onKeyDown={e => (e.keyCode === 13 && newHeader[0] && newHeader[1]) ? addNewEntry() : null} />
          </td>
          <td>
            <Button
              onClick={() => addNewEntry()}
              disabled={!newHeader[0] || !newHeader[1]}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}


function TimerInput({cells, cellsDef, value, onChange, readOnly}) {
  const allTimers = cellsDef.filter(c => c.category === "timers" && c.name !== "stop_timer").map(c => c.name);

  return (
    <FormControl
        componentClass="select"
        value={value}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        Object.entries(cells)
          .filter(([,d]) => allTimers.includes(d.original_name))
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([t]) => <option value={t} key={t}>{t}</option>)
      }
    </FormControl>
  )
}


function BoolInput({value, defaultChecked, onChange, readOnly}) {
  return (
    <Checkbox
      checked={(value !== undefined && value !== "")?value === "true":defaultChecked}
      disabled={readOnly}
      onChange={e => onChange(e.target.checked?"true":"false")} />
  )
}


function WorkflowEnds({value, onChange, workflow, readOnly}) {
  const [newOutput, setNewOutput] = useState("");
  const [ends, setEnds] = useState([]);
  const outputs = value ? value.split(",") : [];

  useEffect(() => {
    workflow && fetchActivities(activities => {
      const a = activities.find(a => a.name === workflow);
      a && fetchActivity(
        a.id,
        activity => setEnds(
          Object.entries(activity.definition.cells)
            .filter(([_, c]) => c.original_name === "end")
            .map(([name, _]) => name)
        )
      )
    })
  }, [workflow]);

  return (
    <>
      <Table>
        <tbody>
        {
          outputs.map(o =>
            <tr key={o}>
              <td>{o}</td>
              {!readOnly && <td><Button onClick={() => {
                  onChange(outputs.filter(output => output !== o).join(","), outputs.filter(output => output !== o))
                }}>{"-"}</Button></td>
              }
            </tr>)
        }
        {!readOnly &&
          <tr>
            <td style={{width: "250px"}}>
              <FormControl
                value={newOutput}
                onChange={e => setNewOutput(e.target.value)} />
              {" "}
            </td>
            <td>
              <Button
                onClick={() => {
                  onChange([...outputs, newOutput].join(","), [...outputs, newOutput])
                  setNewOutput("");
                }}
              >{"+"}</Button>
            </td>
          </tr>
        }
        </tbody>
      </Table>
      <HelpBlock>
        The terminations are the "names" of the "end" nodes of the target workflow.<br/>
        The workflow associated currently defines the following ends:
        <p style={{color: "blue"}}>{ends.join(", ")}</p>
      </HelpBlock>
    </>
  )
}


function Strings({value, onChange, regexp, readOnly}) {
  const [newEntry, setNewEntry] = useState("");
  const values = value ? value.split(",") : [];
  const isInvalid = regexp && !newEntry.match(regexp);

  return (
    <Table>
      <tbody>
      {
        values.map(o =>
          <tr key={o}>
            <td>{o}</td>
            { !readOnly && <td><Button onClick={() => {
                onChange(values.filter(output => output !== o).join(","), values.filter(output => output !== o))
              }}>{"-"}</Button></td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td style={{width: "250px"}}>
            <FormControl
              style={{color: isInvalid?"red":"black"}}
              value={newEntry}
              onChange={e => setNewEntry(e.target.value)} />
            {" "}
          </td>
          <td>
            <Button
              onClick={() => {
                onChange([...values, newEntry].join(","), [...values, newEntry])
                setNewEntry("");
              }}
              disabled={isInvalid}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}

function TypedValues({value, onChange, readOnly}) {
  const [newValue, setNewValue] = useState({value: "", type: "string"});

  const addNewEntry = () => {
    const es = [...value || [], newValue];
    onChange(es)
    setNewValue({value: "", type: "string"});
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>value</th>
          <th>type</th>
          <th/>
        </tr>
      </thead>
      <tbody>
      {
        value?.map((e, i) =>
          <tr>
            <td style={{width: "70%"}}>
              {e.value}
            </td>
            <td style={{width: "30%"}}>
              {e.type}
            </td>
            { !readOnly &&
              <td>
                <Button onClick={() => {
                  onChange(update(value, {$splice: [[i, 1]]}))
                }}>{"-"}</Button>
              </td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td style={{width: "70%"}}>
            <FormControl
              value={newValue.value}
              onChange={e => setNewValue(update(newValue, {$merge: {value: e.target.value}}))} />
          </td>
          <td style={{width: "30%"}}>
            <Select
              value={{value: newValue.type, label: newValue.type}}
              name={"type"}
              onChange={e => setNewValue(update(newValue, {$merge: {type: e.target.value}}))}
              options={["int", "string", "float", "bool"].map(e => ({value: e, label: e}))} />
          </td>
          <td>
            <Button
              onClick={() => addNewEntry()}
              disabled={newValue.value.length === 0}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}

function SwitchOutputs({value, onChange, readOnly}) {
  const [newExpression, setNewExpression] = useState(["", ""]);
  let expressions = [];
  try {
    expressions = JSON.parse(value);
  } catch(e) {
    // console.log(e);
  }

  const addNewEntry = () => {
    const es = [...expressions, newExpression];
    onChange(JSON.stringify(es), es.map(e => e[1]))
    setNewExpression(["", ""]);
  }

  return (
    <Table>
      <tbody>
      {
        expressions.map((exp, i) =>
          <tr key={i}>
            <td>{"case "}</td>
            <td style={{width: "50%"}}>{exp[0]}</td>
            <td>{" : "}</td>
            <td style={{width: "80px"}}>{exp[1]}</td>
            { !readOnly &&
              <td><Button onClick={() => {
                const es = expressions.filter(e => e[0] !== exp[0] && e[1] !== exp[1]);
                onChange(
                  JSON.stringify(es),
                  es.map(e => e[1]),
                )
              }}>{"-"}</Button></td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td>{"case "}</td>
          <td style={{width: "50%"}}>
            <FormControl
              value={newExpression[0]}
              onChange={e => setNewExpression(update(newExpression, {$merge: {[0]: e.target.value}}))} />
          </td>
          <td>{" : "}</td>
          <td style={{width: "80px"}}>
            <FormControl
              value={newExpression[1]}
              onChange={e => setNewExpression(update(newExpression, {$merge: {[1]: e.target.value}}))}
              onKeyDown={e => (e.keyCode === 13 && newExpression[0] && newExpression[1]) ? addNewEntry() : null} />
          </td>
          <td>
            <Button
              onClick={() => addNewEntry()}
              disabled={!newExpression[0] || !newExpression[1]}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}


function JsonSchemaFormFields({value, onChange, readOnly}) {
  const [newField, setNewField] = useState(["", {type: "string", minLength: 1}, false]);
  let fields = {
    "$schema": "http://json-schema.org/schema#",
    type: "object",
    properties: {},
    additionalProperties: false,
    required: [],
  };
  try {
    fields = JSON.parse(value);
  } catch(e) {
    // console.log(e);
  }

  const addNewField = () => {
    if(newField[2]) {
      if(fields.required) {
        onChange(JSON.stringify(update(fields, {properties: {$merge: {[newField[0]]: newField[1]}}, required: {$push: [newField[0]]}})))
      } else {
        onChange(JSON.stringify(update(fields, {properties: {$merge: {[newField[0]]: newField[1]}}, required: {$set: [newField[0]]}})))
      }
    } else {
      onChange(JSON.stringify(update(fields, {properties: {$merge: {[newField[0]]: newField[1]}}})))
    }
    setNewField(["", {type: "string", minLength: 1}, false]);
  }

  return (
    <Table>
      <tbody>
      {
        Object.entries(fields.properties).map(([name, props]) =>
          <tr key={name}>
            <td style={{width: "50%"}}>{name}</td>
            <td style={{width: "40%"}}>
              <FormControl
                componentClass="select"
                disabled={readOnly}
                readOnly={readOnly}
                value={props.format || props.type}
                onChange={e => {
                  let prop = {};
                  switch(e.target.value) {
                    case "string":
                      prop = {type: e.target.value, minLength: 1};
                      break;
                    case "boolean":
                      prop = {type: e.target.value, enum: [true]};
                      break;
                    case "date-time":
                      prop = {type: "string", format: "date-time"};
                      break;
                    default:
                      prop = {type: e.target.value};
                      break;
                  }
                  onChange(JSON.stringify(update(fields, {properties: {[name]: {$merge: prop}}})))
                }}>
                    <option value="string">string</option>
                    <option value="boolean">boolean</option>
                    <option value="date-time">datetime</option>
              </FormControl>
            </td>
            <td>{fields.required && fields.required.includes(name)?"*":""}</td>
            { !readOnly &&
              <td><Button onClick={() => {
                if(fields.required && fields.required.includes(name)) {
                  onChange(JSON.stringify(update(fields, {properties: {$unset: [name]}, required: {$splice: [[fields.required.findIndex(e => e===name), 1]]}})))
                } else {
                  onChange(JSON.stringify(update(fields, {properties: {$unset: [name]}})))
                }
              }}>{"-"}</Button></td>
            }
          </tr>)
      }
      { !readOnly &&
        <tr>
          <td style={{width: "50%"}}>
            <FormControl
              value={newField[0]}
              onChange={e => setNewField(update(newField, {$merge: {[0]: e.target.value}}))} />
          </td>
          <td style={{width: "40%"}}>
            <FormControl
              componentClass="select"
              value={newField[1]?.format || newField[1]?.type}
              onChange={e => {
                let prop = {};
                  switch(e.target.value) {
                  case "string":
                    prop = {type: e.target.value, minLength: 1};
                    break;
                  case "boolean":
                    prop = {type: e.target.value, enum: [true]};
                    break;
                  case "date-time":
                    prop = {type: "string", format: "date-time"};
                    break;
                  default:
                    prop = {type: e.target.value};
                    break;
                }
                setNewField(update(newField, {$merge: {[1]: prop}}))
              }} >
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="date-time">datetime</option>
            </FormControl>
          </td>
          <td style={{width: "40%"}}>
            <Checkbox
              checked={newField[2]}
              onChange={e => setNewField(update(newField, {$merge: {[2]: e.target.checked}}))} >
                Required?
            </Checkbox>
          </td>
          <td>
            <Button
              onClick={() => addNewField()}
              disabled={!newField[0] || !newField[1]}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}


export function Param2Input({param, activity, staticParams, cells, value, readOnly, onChange}) {
  let i;
  switch(param.nature) {
    case 'session_holder':
      i = <SessionHolderInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'tcp_session_holder':
      i = <TcpSessionHolderInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'ftp_session_holder':
      i = <FtpSessionHolderInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'datastore':
      i = <DataStoreInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'typed_values':
      i = <TypedValues value={value || []} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'task':
      i = <TaskInput cells={activity.definition.cells} readOnly={readOnly} value={value} onChange={e => onChange(e)} />
      break;
    case 'activity':
      i = <ActivityInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'user_role':
      i = <UserRoleInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'user_profile':
      i = <UserProfileInput value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'timer':
      i = <TimerInput cells={activity.definition.cells} readOnly={readOnly} cellsDef={cells} value={value} onChange={e => onChange(e)} />
      break;
    case 'list':
      i = <ListInput options={param.values} readOnly={readOnly} value={value} onChange={e => onChange(e)} />
      break;
    case 'smtp_config':
      i = <TextareaInput rows={1} value={value} readOnly={readOnly} onChange={e => onChange(e)} cells={activity.definition.cells} />
      break;
    case 'jinja':
    case 'python':
    case 'python_bool':
    case 'user_properties':
    case 'json':
    case 'xml':
      i = <TextareaInput rows={10} value={value} readOnly={readOnly} onChange={e => onChange(e)} cells={activity.definition.cells} />
      break;
    case 'jsonschema_form_fields':
      i = <JsonSchemaFormFields value={value} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'boolean':
      i = <BoolInput value={value} defaultChecked={param.default} readOnly={readOnly} onChange={e => onChange(e)} />
      break;
    case 'python_switch':
      i = <SwitchOutputs
        value={value}
        readOnly={readOnly}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'outputs':
      i = <Strings
        value={value}
        readOnly={readOnly}
        regexp={param.regexp || (param.schema && param.schema.items.pattern)}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'strings':
      i = <Strings
        value={value}
        readOnly={readOnly}
        regexp={param.regexp || (param.schema && param.schema.items.pattern)}
        onChange={e => onChange(e)} />
      break;
    case 'workflow_ends':
      i = <WorkflowEnds
        value={value}
        readOnly={readOnly}
        workflow={staticParams && staticParams[param.origin || 'workflow']}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'http_headers':
      i = <HttpHeaders value={value} onChange={e => onChange(e)} readOnly={readOnly} />
      break;
    case 'context_key':
      i = <ContextKey value={value} onChange={e => onChange(e)} readOnly={readOnly} />
      break;
    case 'context_keys':
      i = <ContextKeyValues value={value} onChange={e => onChange(e)} readOnly={readOnly} />
      break;
    default:
      i = <BasicInput value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly} />
      break;
  }
  return i;
}