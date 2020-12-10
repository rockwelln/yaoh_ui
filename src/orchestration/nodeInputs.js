import React, {useEffect, useState} from "react";
import FormControl from "react-bootstrap/lib/FormControl";
import {fetchRoles} from "../system/user_roles";
import {fetchProfiles} from "../system/user_profiles";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import update from "immutability-helper";
import {fetchActivities} from "./activity-editor";
import {fetch_get} from "../utils";
import {MentionExample} from "./templateEditor";



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

function SessionHolderInput(props) {
  const {value, onChange} = props;
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
    <FormControl
        componentClass="select"
        value={value}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        holders.map(h => <option value={h} key={h}>{h}</option>)
      }
    </FormControl>
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
    fetchActivities(activities => setActivities(activities.map(a => a.name).sort((a, b) => a.localeCompare(b))))
  }, []);

  return (
    <FormControl
        componentClass="select"
        value={value}
        onChange={e => onChange(e.target.value)}
    >
      <option value={""}/>
      {
        activities
          .map(a => <option value={a} key={a}>{a}</option>)
      }
    </FormControl>
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


function HttpHeaders(props) {
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
  const {value, onChange} = props;
  return (
    <Checkbox
      checked={value === "true"}
      onChange={e => onChange(e.target.checked?"true":"false")} />
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


function SwitchOutputs(props) {
  const {value, onChange} = props;
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

  const [newField, setNewField] = useState(["", "string"]);
  let fields = {
    "$schema": "http://json-schema.org/schema#",
    type: "object",
    properties: {},
    additionalProperties: false,
  };
  try {
    fields = JSON.parse(value);
  } catch(e) {
    // console.log(e);
  }

  const addNewField = () => {
    onChange(JSON.stringify(update(fields, {properties: {$merge: {[newField[0]]: {type: newField[1]}}}})))
    setNewField(["", "string"]);
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
                value={props.type}
                onChange={e => onChange(JSON.stringify(update(fields, {properties: {[name]: {$merge: {type: e.target.value}}}})))}>
                   <option value="string">string</option>
              </FormControl>
            </td>
            <td><Button onClick={() => {
              onChange(JSON.stringify(update(fields, {properties: {$unset: [name]}})))
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
              value={newField[1]}
              onChange={e => setNewField(update(newField, {$merge: {[1]: e.target.value}}))} >
                <option value="string">string</option>
            </FormControl>
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


export function Param2Input({param, activity, cells, value, onChange}) {
  let i;
  switch(param.nature) {
    case 'session_holder':
      i = <SessionHolderInput value={value} onChange={e => onChange(e)} />
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
      i = <TextareaInput rows={10} value={value} onChange={e => onChange(e)} cells={activity.definition.cells} />
      break;
    case 'jsonschema_form_fields':
      i = <JsonSchemaFormFields value={value} onChange={e => onChange(e)} />
      break;
    case 'bool':
      i = <BoolInput value={value} onChange={e => onChange(e)} />
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
    case 'http_headers':
      i = <HttpHeaders value={value} onChange={e => onChange(e)} />
      break;
    default:
      i = <BasicInput value={value} onChange={e => onChange(e.target.value)} />
      break;
  }
  return i;
}