import React, {useState, useEffect} from "react";
import {API_WS_URL, AuthServiceManager} from "../utils";
import Form from "react-bootstrap/lib/Form";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";
import Table from "react-bootstrap/lib/Table";
import {FormattedMessage} from "react-intl";
import Button from "react-bootstrap/lib/Button";
import {Panel} from "react-bootstrap";
import update from "immutability-helper";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Alert from "react-bootstrap/lib/Alert";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

function messages2instance(messages) {
    let o = {
        id: null,
        tasks: [],
        subinstances: [],
        final_report: null,
    };
    let m = messages.find(m => m.event === "simulation started");
    if(m) {
        o.id = m.instance_id;
    }
    m = messages.find(m => m.event === "simulation ended");
    if(m) {
        o.final_report = Object.assign({}, m.instance);
    }
    o.tasks = messages.filter(m => m.event.startsWith("tasks:") && m.instance_id === o.id).reduce(
        (tasks, m) => {
            if(m.event === "tasks:started") {
                tasks.push({
                    cell_id: m.cell_id,
                    task_id: m.task_id,
                    status: 'running...',
                    context: {},
                    traces: [],
                    subinstances: [],  // to be filled!!
                    errors: [],
                });
            } else if (m.event.startsWith("tasks:")) {
                const t = tasks.find(t => t.task_id === m.task_id);
                if(t) {
                    switch(m.event) {
                      case 'tasks:ended':
                        t.status = 'completed';
                        break;
                      case 'tasks:blocking_error':
                        t.status = 'error';
                        break;
                      default:
                        t.status = 'waiting...'
                    }
                    t.output = m.output;
                    if(m.context) {
                        t.context = m.context;
                    }
                    if(m.trace) {
                        t.traces = update(t.traces, {$push: [m.trace]});
                    }
                    if(m.event === "tasks:blocking_error") {
                        t.errors = update(t.errors, {$push: [m.message]});
                    }
                }
            }
            return tasks;
        }
    , []);
    return o;
}

function TaskEntry(props) {
  const {task} = props;
  const [expanded, setExpanded] = useState(false);

  const expandable = Object.keys(task.context).length !== 0 || task.errors.length !== 0;
  const expIco = !expandable ? null : expanded?<Glyphicon glyph="chevron-down"/>:<Glyphicon glyph="chevron-right"/>;

  return (
    <>
      <tr>
          <td style={{width: '100px'}} onClick={() => expandable && setExpanded(!expanded)}>{expIco} {task.task_id}</td>
          <td>{task.cell_id}</td>
          <td>{task.status}</td>
      </tr>
      {
        expanded && task.errors && (
          <tr>
            <td/>
            <td colSpan={2}>
              <Table>
                <tbody>
                {
                  task.errors.map((e, i) => <tr key={`error-${task.task_id}-${i}`}>
                    <td colSpan={3}>
                      <Alert bsStyle="danger">{e}</Alert>
                    </td>
                  </tr>)
                }
                </tbody>
              </Table>
            </td>
          </tr>
        )
      }
      {
        expanded && false && (
          <tr>
            <td/>
            <td colSpan={2}>
              <Tabs defaultActiveKey={0} id={`tasks_tabs-${task.task_id}`}>
                <Tab title="details" eventKey={0}>
                  <Table>
                    <tbody>
                    <tr>
                      <th>Context (after run)</th>
                      <td>
                        <Table>
                          <tbody>
                          {
                            task.context && Object.keys(task.context).map(key => <tr key={`context-${task.task_id}-${key}`}><th>{key}</th><td>{task.context[key]}</td></tr>)
                          }
                          </tbody>
                        </Table>
                      </td>
                    </tr>
                    <tr>
                      <th>Traces</th>
                      <td>
                        <Table>
                          <tbody>
                          {
                            task.traces && task.traces.map((t, i) => <tr key={`trace-${task.task_id}-${i}`}><pre>{JSON.stringify(t, undefined, 2)}</pre></tr>)
                          }
                          </tbody>
                        </Table>
                      </td>
                    </tr>
                    </tbody>
                  </Table>
                </Tab>
                <Tab title="sub-workflows" eventKey={1}>
                </Tab>
              </Tabs>
            </td>
          </tr>
        )
      }
    </>
  )
}


export function SimulatorPanel(props) {
    const {activity} = props;
    const [connectionStatus, setConnectionStatus] = useState("");
    const [messages, setMessages] = useState([]);
    const [serverError, setServerError] = useState(null);
    const [inputBody, setInputBody] = useState({method: "get", url: "", body: ""});
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if(!socket) return;

        socket.onmessage = event => {
          const msg = JSON.parse(event.data);
          setMessages(m => m.concat(msg));
          if (msg.event === "simulation started") {
            setConnectionStatus("started...");
          }
          else if (msg.event === "simulation ended") {
            setConnectionStatus("connected");
          } else {
            connectionStatus === "started..." && setConnectionStatus(`running... (${messages.length})`);
          }
        };
        socket.onopen = () => {
            setConnectionStatus("connected");
        };
        socket.onclose = e => {
            setConnectionStatus("Worker disconnected...");
            console.log("closing ...", e);
            // setTimeout(() => setReconnect(true), 5000);
        };
    });
    useEffect(() => {
        const s = new WebSocket(`${API_WS_URL}/api/v01/activities/simulation/ws?auth_token=${AuthServiceManager.getToken()}`);
        setSocket(s);
        return () => s.close();
    }, []);

    const instance = messages2instance(messages);

    return (
        <Panel>
            <Panel.Body>
                {serverError && <Alert bsStyle="danger">Internal error: <br/><pre>{serverError}</pre></Alert>}
                <Form horizontal>
                    <FormGroup>
                        <Col sm={2}>
                            <FormControl
                                componentClass="select"
                                value={inputBody.method}
                                onChange={e => setInputBody(update(inputBody, {$merge: {method: e.target.value}}))}>
                                <option value={"get"}>get</option>
                                <option value={"post"}>post</option>
                                <option value={"put"}>put</option>
                                <option value={"delete"}>delete</option>
                            </FormControl>
                        </Col>

                        <Col sm={7}>
                            <FormControl
                                componentClass="input"
                                placeholder="/api/v01/some/path"
                                value={inputBody.url}
                                onChange={e => setInputBody(update(inputBody, {$merge: {url: e.target.value}}))} />
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="body" defaultMessage="Body" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="textarea"
                                rows="10"
                                placeholder="{}"
                                value={inputBody.body}
                                onChange={e => setInputBody(update(inputBody, {$merge: {body: e.target.value}}))} />
                        </Col>
                    </FormGroup>

                    <Button onClick={() => {
                        setServerError(null);
                        setMessages([]);
                        const a = activity();
                        let input = Object.assign({}, inputBody);
                        try {
                          input.body = JSON.parse(input.body);
                        } catch {
                          console.log("failed to turn the body into a JSON", input.body);
                        }
                        socket.send(JSON.stringify({name: a.name, definition: a.definition, body: input}));
                    }} disabled={socket === null || connectionStatus !== "connected"}>
                        <FormattedMessage id="go" defaultMessage="Go" />
                    </Button>
                </Form>
                <h4>Running status: {connectionStatus}</h4>
                <Tabs defaultActiveKey={0} id="events_tabs">
                    <Tab title="Tasks" eventKey={0}>
                        <Table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>cell</th>
                                    <th>status</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                instance.tasks.map(t => <TaskEntry task={t} key={`task-${t.task_id}`} />)
                            }
                            </tbody>
                        </Table>
                    </Tab>
                    <Tab title="Context" eventKey={1} disabled={!instance || !instance.final_report}>
                      <Table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>key</th>
                                <th>value</th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                          instance.final_report && instance.final_report.context.map((c, i) => (
                            <tr key={c.key}><th>{ c.key }</th><td>{ c.value }</td></tr>
                          ))
                        }
                        </tbody>
                      </Table>
                    </Tab>
                    <Tab title="Raw events" eventKey={2}>
                        <Table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>event</th>
                                    <th>raw event</th>
                                    <th>time</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                messages.map((e, i) =>
                                    <tr key={`event-${i}`}>
                                        <td>{i + 1}</td>
                                        <td>{e.event}</td>
                                        <td><p>{JSON.stringify(e)}</p></td>
                                        <td>{e.time}</td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </Table>
                    </Tab>
                </Tabs>
            </Panel.Body>
        </Panel>
    )
}