import React, {useCallback, useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import FormControl from "react-bootstrap/lib/FormControl";
import {fetchRoles} from "../system/user_roles";
import {fetchProfiles} from "../system/user_profiles";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import update from "immutability-helper";
import {fetchActivities, fetchActivity, offsetIndex} from "./activity-editor";
import {fetch_get} from "../utils";
// import {MentionExample} from "./templateEditor";
import Creatable from 'react-select/creatable';
import Select from "react-select";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Alert from "react-bootstrap/lib/Alert";
import ToggleButton from "react-bootstrap/lib/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/lib/ToggleButtonGroup";
import Prism from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-django';
import { FormattedMessage } from "react-intl";

import "./editor.css";


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


function HttpBodyInput({staticParams, field, onChange, readOnly, cells}) {
  const name = field?.name;
  const formatKey = name + "#format";
  const formKey = name + "#form";
  const multipartKey = name + "#multipart";

  const format = staticParams[formatKey];
  let body;

  switch (format) {
    case "form":
      body = (
        <HttpBodyForm
          readOnly={readOnly}
          value={staticParams[formKey] ? staticParams[formKey] : []}
          onChange={v => onChange(formKey, v)} />
      )
      break;

    case "multipart":
      body = (
        <HttpBodyForm
          readOnly={readOnly}
          value={staticParams[multipartKey] ? staticParams[multipartKey] : []}
          onChange={v => onChange(multipartKey, v)} />
      )
      break;
  
    case "default":
    default:
      body = <JinjaTextareaInput
        value={staticParams[name] ? staticParams[name] : ""}
        onChange={v => onChange(name, v)}
        readOnly={readOnly}
        cells={cells} />
      break;
  }

  return (
    <>
      <ToggleButtonGroup name="body_format" type="radio" value={format || "default"} onChange={e => onChange(formatKey, e)}>
        <ToggleButton value="default">Default</ToggleButton>
        <ToggleButton value="form">Form</ToggleButton>
        <ToggleButton value="multipart">Multipart</ToggleButton>
      </ToggleButtonGroup>

      { body }
      
    </>
  )
}

function HttpBodyForm({value, onChange, readOnly}) {
  const [newEntry, setNewEntry] = useState({key: "", value: ""});

  const addNewEntry = () => {
    onChange([...value || [], [newEntry.key, newEntry.value]])
    setNewEntry({key: "", value: ""});
  }

  const dropEntry = (i) => {
    value.splice(i, 1);
    onChange([...value]);
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          {!readOnly && <th/>}
        </tr>
      </thead>
      <tbody>
        { value?.map(([field, v], i) =>
          <tr>
            <td>{field}</td>
            <td>{v}</td>
            {!readOnly &&
              <td>
                <Button onClick={() => dropEntry(i)}>{"-"}</Button>
              </td>
            }
          </tr>
        )}

        { !readOnly &&
          <tr>
            <td>
              <FormControl
                value={newEntry.key}
                onChange={e => setNewEntry({...newEntry, key: e.target.value})} />
            </td>
            <td>
            <FormControl
                value={newEntry.value}
                onChange={e => setNewEntry({...newEntry, value: e.target.value})} />
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
  );
}


const contextBuiltIns = [
  "get",
  "items",
  "keys",
  "values",
  "update",
];

function TextareaInput({value, onChange, readOnly, cells, multi}) {
  const [language, setLanguage] = useState("jinja2");

  useEffect(() => {
    if(value?.lang) {
      setLanguage(value.lang);
    }
  }, [value]);

  const onValueChange = useCallback((v, language) => {
    if(language === "jinja2" || !language) {
      onChange(v);
    } else {
      onChange(({lang: language, value: v}));
    }
  }, [onChange]);

  let textInput = null;
  switch(language) {
    case "jinja2":
    case "pongo2":
    default:
      textInput = <JinjaTextareaInput value={value?.value || value || ""} onChange={v => onValueChange(v, language)} readOnly={readOnly} cells={cells} />;
      break;
  }

  return (
  <>
    { textInput }
    {
      multi && <Select
        value={{label: language, value: language}}
        options={["jinja2", "pongo2"].map(l => ({label: l, value: l}))}
        onChange={e => setLanguage(e.value)} />
    }
    {
      multi && language && language !== "jinja2" && <Alert bsStyle="danger">
        <strong>Warning!</strong> This node is using a multi-language input. Be sure the destination platform supports it.
      </Alert>
    }
  </>
  );
}


function JinjaTextareaInput({value, onChange, readOnly, cells}) {
  const fieldRef = useRef(null);
  const editorRef = useRef(null);
  const outputRef = useRef(null);
  const [contextVars, setContextVars] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(value === undefined) return
    const outputNode = ReactDOM.findDOMNode(outputRef.current);
    outputNode.innerHTML = renderOutput(value);
    Prism.highlightElement(outputNode);
  }, [editorRef, outputRef, value]);

  useEffect(() => {
    const contextVars = [];
    if(cells) {
      Object.values(cells).forEach(options => {
        let v = null;
        if(options.original_name === "context_setter") {
          v = options.params.key;
        } else if(options.params?.output_context_key) {
          v = options.params.output_context_key;
        }

        if(v) {
          contextVars.push(v[0] === "{" ? JSON.parse(v).key : v)
        }
      });
    }
    setContextVars(contextVars);
  }, [cells]);

  useEffect(() => {
    // check:
    // - there is the same number of {{ and }} in the template
    // - there is the same number of {% and %} in the template
    // - there is the same number of { and } in the template

    setError(null);
    if(value === undefined) return;
    const nbOpenBraces = (value.match(/{/g) || []).length;
    const nbCloseBraces = (value.match(/}/g) || []).length;
    const nbOpenDjango = (value.match(/{%/g) || []).length;
    const nbCloseDjango = (value.match(/%}/g) || []).length;
    const nbOpenJinja = (value.match(/{{/g) || []).length;
    const nbCloseJinja = (value.match(/}}/g) || []).length;

    if(nbOpenBraces !== nbCloseBraces) {
      setError("The number of '{' and '}' must be the same");
    } else if(nbOpenDjango !== nbCloseDjango) {
      setError("The number of '{%' and '%}' must be the same");
    } else if(nbOpenJinja !== nbCloseJinja) {
      setError("The number of '{{' and '}}' must be the same");
    }

    // search for unknown context keys
    const re = /context\.([a-zA-Z0-9_\-]+)/g;
    let m;
    while ((m = re.exec(value)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === re.lastIndex) re.lastIndex++;
      if(!contextBuiltIns.includes(m[1]) && !contextVars.includes(m[1])) {
        setError(`'${m[1]}' seems not known (yet?)`);
        return;
      }
    }
  }, [value]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const node = ReactDOM.findDOMNode(editorRef.current);
      const outputNode = ReactDOM.findDOMNode(outputRef.current);
      // align the size of the output div
      outputNode.parentElement.scrollTop = node.scrollTop;
      outputNode.parentElement.scrollLeft = node.scrollLeft;
      outputNode.parentElement.style.height = node.style.height;
      outputNode.parentElement.style.width = node.style.width;
      // align the size of the parent div
      node.parentElement.style.height = node.style.height;
      node.parentElement.style.width = node.style.width;
    });
    resizeObserver.observe(ReactDOM.findDOMNode(editorRef.current));

    return () => {
      resizeObserver.disconnect();
    };
  }, [editorRef]);

  const onScroll = useCallback(() => {
    const node = ReactDOM.findDOMNode(editorRef.current);
    const outputNode = ReactDOM.findDOMNode(outputRef.current);
    outputNode.parentElement.scrollTop = node.scrollTop;
    outputNode.parentElement.scrollLeft = node.scrollLeft;
  }, []);

  return (
    <>
      <div className="editor">
        <FormControl
          componentClass="textarea"
          className="code-input"
          ref={editorRef}
          onChange={e => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          value={value}
          onScroll={onScroll} >
        </FormControl>
        <pre className="code-output">
          <code ref={outputRef} className="language-django">
            
          </code>
        </pre>
      </div>
      {error && <div style={{color: "red"}}>{error}</div>}
    </>
  )
}

function renderOutput(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
				.replace(/>/g, "&gt;") + "\n";
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
              <FormControl
                componentClass="input"
                disabled={readOnly}
                value={e.key}
                onChange={e => onChange(update(value, {[i]: {$merge: {key: e.target.value}}}))} />
            </td>
            <td style={{width: "50%"}}>
              <FormControl
                componentClass="textarea"
                disabled={readOnly}
                rows={4}
                value={e.value}
                onChange={e => onChange(update(value, {[i]: {$merge: {value: e.target.value}}}))}
                style={{resize: "both"}} />
            </td>
            <td style={{width: "10%"}}>
              <Checkbox
                checked={e.cleanup}
                disabled={readOnly}
                onChange={e => onChange(update(value, {[i]: {$merge: {cleanup: e.target.checked}}}))} />
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
              onChange={e => setNewEntry({...newEntry, key: e.target.value})} />
          </td>
          <td style={{width: "40%"}}>
            <FormControl
              componentClass="textarea"
              rows={4}
              value={newEntry.value}
              onChange={e => setNewEntry({...newEntry, value: e.target.value})}
              style={{resize: "both"}} />
          </td>
          <td style={{width: "15%"}}>
            <Checkbox
              checked={newEntry.cleanup}
              onChange={e => setNewEntry({...newEntry, cleanup: e.target.checked})} />
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


function Retry({value, onChange, readOnly, conditionOptions}) {
  return (
    <>
      <Table>
        <tbody>
          <tr>
            <th>
              <FormattedMessage id="condition" defaultMessage="Conditions" />
            </th>
            <td>
              <Select
                isMulti
                isClearable
                placeholder=""
                name="retry-conditions"
                value={value?.conditions?.map(c => ({value: c, label: c}))}
                onChange={(vv, action) => {
                  if(["select-option", "create-option", "clear", "remove-value"].includes(action.action)) {
                    onChange(update(value || {}, {$merge: {conditions: vv?vv.map(v => v.value):[]}}));
                  }
                }}
                options={conditionOptions.map(e => ({value: e, label: e}))} />
            </td>
          </tr>
          <tr>
            <th>
              <FormattedMessage id="delay" defaultMessage="Delay" />
            </th>
            <td>
              <Select
                isClearable
                placeholder="time between 2 attempts"
                name="retry-delay"
                value={{value: value?.delay, label: value?.delay}}
                onChange={(vv, action) => {
                  if(["select-option", "create-option", "clear"].includes(action.action)) {
                    onChange(update(value || {}, {$merge: {delay: vv?vv.value:""}}));
                  }
                }}
                options={["immediate", "10s", "5m", "10m", "30m", "1h", "24h"].map(e => ({value: e, label: e}))} />
            </td>
          </tr>
          <tr>
            <th>
              <FormattedMessage id="max" defaultMessage="Max time" />
            </th>
            <td>
            <FormControl
              value={value?.max}
              onChange={e => onChange(update(value || {}, {$merge: {max: e.target.value && parseInt(e.target.value, 10)}}))} />
            </td>
          </tr>
        </tbody>
      </Table>
      <HelpBlock>
        This node support some retry policy.<br/>
        If the delay between 2 attempts is not "immediate", the processing is deffered using a timer.<br/>
        (meaning, the processing may continue on a different processing node, !this is not suitable for "synchronous" routes!)
        The max time is the maximum time the node can be in retry mode.<br/>
      </HelpBlock>
    </>
  );
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
              <FormControl
                disabled={readOnly}
                value={e.value}
                onChange={e => onChange(update(value, {[i]: {$merge: {value: e.target.value}}}))} />
            </td>
            <td style={{width: "30%"}}>
              <Select
                value={{value: e.type, label: e.type}}
                name={"type"}
                disabled={readOnly}
                onChange={e => onChange(update(value, {[i]: {$merge: {type: e.value}}}))}
                options={["int", "string", "float", "bool", "int-list", "string-list"].map(e => ({value: e, label: e}))} />
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
              onChange={e => setNewValue(update(newValue, {$merge: {"type": e.value}}))}
              options={["int", "string", "float", "bool", "int-list"].map(e => ({value: e, label: e}))} />
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

const defaultDragState = {
  column: -1,
  row: -1,
  startPoint: null,
  direction: "",
  dropIndex: -1 // drag target
};

function SwitchOutputs({value, onChange, readOnly}) {
  const [newExpression, setNewExpression] = useState(["", ""]);
  const [dragState, setDragState] = useState({...defaultDragState});
  const preview = useRef(null);
  let expressions = [];
  try {
    expressions = JSON.parse(value);
  } catch(e) {
    // console.log(e);
  }

  if (dragState.direction === "row") {
    expressions = offsetIndex(dragState.row, dragState.dropIndex, expressions);
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
        expressions.map(([exp, output], i) =>
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
              onChange(JSON.stringify(expressions), expressions.map(e => e[1]));
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
            <td><Glyphicon glyph={"menu-hamburger"}/></td>
            <td style={{width: "50%"}}>
              <FormControl
                value={exp}
                readOnly={readOnly}
                onChange={e => {
                  const es = update(expressions, {[i]: {$merge: {[0]: e.target.value}}});
                  onChange(JSON.stringify(es), es.map(e => e[1]))
                }} />
            </td>
            <td>{" : "}</td>
            <td style={{width: "80px"}}>{output}</td>
            { !readOnly &&
              <td><Button onClick={() => {
                // remove the entry i from the expression list
                expressions.splice(i, 1);
                onChange(JSON.stringify(expressions), expressions.map(e => e[1]));
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
      <div
        ref={preview}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden"
        }}
      />
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
      i = <TextareaInput multi rows={10} value={value} readOnly={readOnly} onChange={e => onChange(e)} cells={activity.definition.cells} />
      break;
    case 'http_body':
      i = <HttpBodyInput
        staticParams={staticParams}
        field={param}
        readOnly={readOnly}
        onChange={(field, e) => onChange(e, undefined, field)}
        cells={activity.definition.cells} />
      break;
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
    case 'retry':
      i = <Retry 
        value={value} 
        readOnly={readOnly}
        conditionOptions={param.values}
        onChange={e => onChange(e)} />
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