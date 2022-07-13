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

function  DataStoreInput({value, onChange}) {
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

function SessionHolderInput({value, onChange}) {
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
      isClearable
      isSearchable
      name="session-holder"
      onChange={(value, action) => {
        if(["select-option", "create-option", "clear"].includes(action.action)) {
          onChange(value && value.value);
        }
      }}
      options={holders.map(h => ({value: h, label: h}))} />
  )
}


function TaskInput(props) {
  const {cells, value, onChange} = props;

  return (
    <FormControl
        componentClass="select"
        value={value}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        Object.keys(cells)
          .sort((a, b) => a.localeCompare(b))
          .map(t => <option value={t} key={t}>{t}</option>)
      }
    </FormControl>
  )
}


function ActivityInput(props) {
  const {value, onChange} = props;
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivities(setActivities)
  }, []);

  const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.name, label: a.name, id: a.id}));

  return (
    <InputGroup>
      <Select
          className="basic-single"
          classNamePrefix="select"
          value={value && activitiesOptions.find(a => a.value === value)}
          isClearable={true}
          isSearchable={true}
          name="activity"
          onChange={(value, action) => {
              if(["select-option", "clear"].includes(action.action)) {
                onChange(value?value.value:"");
              }
          }}
          options={activitiesOptions} />
      <InputGroup.Button>
          <Button
              disabled={!value}
              bsStyle="primary"
              onClick={() => {
                window.open(`/transactions/config/activities/editor/${activitiesOptions.find(a => a.value === value).id}`, '_blank').focus();
              }}
              style={{marginLeft: '5px'}}
          >
              <Glyphicon glyph="eye-open"/>
          </Button>
      </InputGroup.Button>
    </InputGroup>
  )
}


function UserRoleInput(props) {
  const {value, onChange} = props;
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles(roles => setRoles(roles.map(a => a.name).sort((a, b) => a.localeCompare(b))))
  }, []);

  return (
    <FormControl
        componentClass="select"
        value={value}
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


function UserProfileInput(props) {
  const {value, onChange} = props;
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    fetchProfiles(p => setProfiles(p.map(a => a.name).sort((a, b) => a.localeCompare(b))))
  }, []);

  return (
    <FormControl
        componentClass="select"
        value={value}
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


function ListInput(props) {
    const {options, value, onChange} = props;
    return (
      <FormControl
          componentClass="select"
          value={value}
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


function TextareaInput(props) {
  // todo can become a "list" of key (string) + value (jinja code)
  const {value, onChange, cells, rows} = props;
  return (
    <FormControl
        componentClass={MentionExample}
        cells={cells}
        value={value}
        onChange={onChange}
        rows={rows}
    />
  )
}


function ContextKey({value, onChange}) {
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
        onChange={e => onChange(JSON.stringify({key: e.target.value, cleanup: cleanupFlag}))} />
      <Checkbox checked={cleanupFlag} onChange={e => onChange(JSON.stringify({key: key, cleanup: e.target.checked}))}>
        Delete key on workflow ending
      </Checkbox>
    </>
  )
}


function ContextKeyValues({value, onChange}) {
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
            <td>
              <Button onClick={() => {
                onChange(update(value, {$splice: [[i, 1]]}))
              }}>{"-"}</Button>
            </td>
          </tr>)
      }
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
      </tbody>
    </Table>
  )
}


export function HttpHeaders(props) {
  const {value, onChange} = props;
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
            <td><Button onClick={() => {
              const hs = headers.filter(h => h[0] !== head[0] && h[1] !== head[1]);
              onChange(JSON.stringify(hs))
            }}>{"-"}</Button></td>
          </tr>)
      }
      {
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


const TIMER = 2;
function TimerInput(props) {
  const {cells, cellsDef, value, onChange} = props;
  const allTimers = cellsDef.filter(c => c.type === TIMER).map(c => c.name);

  return (
    <FormControl
        componentClass="select"
        value={value}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        Object.keys(cells)
          .filter(allTimers.includes)
          .sort((a, b) => a.localeCompare(b))
          .map(t => <option value={t} key={t}>{t}</option>)
      }
    </FormControl>
  )
}


function BoolInput(props) {
  const {value, defaultChecked, onChange} = props;
  return (
    <Checkbox
      checked={(value !== undefined && value !== "")?value === "true":defaultChecked}
      onChange={e => onChange(e.target.checked?"true":"false")} />
  )
}


function WorkflowEnds({value, onChange, workflow}) {
  const [newOutput, setNewOutput] = useState("");
  const [ends, setEnds] = useState([]);
  const outputs = value ? value.split(",") : [];

  useEffect(() => {
    workflow && fetchActivities(activities => {
      const a = activities.find(a => a.name === workflow);
      a && fetchActivity(
        a.id,
        activity => setEnds(
          Object.entries(JSON.parse(activity.definition).cells)
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
              <td><Button onClick={() => {
                onChange(outputs.filter(output => output !== o).join(","), outputs.filter(output => output !== o))
              }}>{"-"}</Button></td>
            </tr>)
        }
        {
          <tr>
            <td style={{width: "100px"}}>
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


function DynamicOutputs(props) {
  const {value, onChange, regexp} = props;
  const [newOutput, setNewOutput] = useState("");
  const outputs = value ? value.split(",") : [];
  const invalidOutput = regexp && !newOutput.match(regexp);

  return (
    <Table>
      <tbody>
      {
        outputs.map(o =>
          <tr key={o}>
            <td>{o}</td>
            <td><Button onClick={() => {
              onChange(outputs.filter(output => output !== o).join(","), outputs.filter(output => output !== o))
            }}>{"-"}</Button></td>
          </tr>)
      }
      {
        <tr>
          <td style={{width: "100px"}}>
            <FormControl
              style={{color: invalidOutput?"red":"black"}}
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
              disabled={invalidOutput}
            >{"+"}</Button>
          </td>
        </tr>
      }
      </tbody>
    </Table>
  )
}

function TypedValues({value, onChange}) {
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
            <td>
              <Button onClick={() => {
                onChange(update(value, {$splice: [[i, 1]]}))
              }}>{"-"}</Button>
            </td>
          </tr>)
      }
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
      </tbody>
    </Table>
  )
}

function SwitchOutputs({value, onChange}) {
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
            <td><Button onClick={() => {
              const es = expressions.filter(e => e[0] !== exp[0] && e[1] !== exp[1]);
              onChange(
                JSON.stringify(es),
                es.map(e => e[1]),
              )
            }}>{"-"}</Button></td>
          </tr>)
      }
      {
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


function JsonSchemaFormFields(props) {
  const {value, onChange} = props;

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
            <td><Button onClick={() => {
              if(fields.required && fields.required.includes(name)) {
                onChange(JSON.stringify(update(fields, {properties: {$unset: [name]}, required: {$splice: [[fields.required.findIndex(e => e===name), 1]]}})))
              } else {
                onChange(JSON.stringify(update(fields, {properties: {$unset: [name]}})))
              }
            }}>{"-"}</Button></td>
          </tr>)
      }
      {
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


export function Param2Input({param, activity, staticParams, cells, value, onChange}) {
  let i;
  switch(param.nature) {
    case 'session_holder':
      i = <SessionHolderInput value={value} onChange={e => onChange(e)} />
      break;
    case 'datastore':
      i = <DataStoreInput value={value} onChange={e => onChange(e)} />
      break;
    case 'typed_values':
      i = <TypedValues value={value || []} onChange={e => onChange(e)} />
      break;
    case 'task':
      i = <TaskInput cells={activity.definition.cells} value={value} onChange={e => onChange(e)} />
      break;
    case 'activity':
      i = <ActivityInput value={value} onChange={e => onChange(e)} />
      break;
    case 'user_role':
      i = <UserRoleInput value={value} onChange={e => onChange(e)} />
      break;
    case 'user_profile':
      i = <UserProfileInput value={value} onChange={e => onChange(e)} />
      break;
    case 'timer':
      i = <TimerInput cells={activity.definition.cells} cellsDef={cells} value={value} onChange={e => onChange(e)} />
      break;
    case 'list':
      i = <ListInput options={param.values} value={value} onChange={e => onChange(e)} />
      break;
    case 'jinja':
    case 'python':
    case 'python_bool':
    case 'user_properties':
    case 'json':
    case 'xml':
      i = <TextareaInput rows={10} value={value} onChange={e => onChange(e)} cells={activity.definition.cells} />
      break;
    case 'jsonschema_form_fields':
      i = <JsonSchemaFormFields value={value} onChange={e => onChange(e)} />
      break;
    case 'boolean':
      i = <BoolInput value={value} defaultChecked={param.default} onChange={e => onChange(e)} />
      break;
    case 'python_switch':
      i = <SwitchOutputs
        value={value}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'outputs':
      i = <DynamicOutputs
        value={value}
        regexp={param.regexp || (param.schema && param.schema.items.pattern)}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'workflow_ends':
      i = <WorkflowEnds
        value={value}
        workflow={staticParams && staticParams[param.origin || 'workflow']}
        onChange={(e, outputs) => {
          onChange(e, outputs);
        }} />
      break;
    case 'http_headers':
      i = <HttpHeaders value={value} onChange={e => onChange(e)} />
      break;
    case 'context_key':
      i = <ContextKey value={value} onChange={e => onChange(e)} />
      break;
    case 'context_keys':
      i = <ContextKeyValues value={value} onChange={e => onChange(e)} />
      break;
    default:
      i = <BasicInput value={value} onChange={e => onChange(e.target.value)} />
      break;
  }
  return i;
}