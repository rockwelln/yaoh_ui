import React, {useState, useEffect, useRef} from "react";
import {API_WS_URL, AuthServiceManager, NotificationsManager} from "../utils";
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

function messages2instance(messages) {
    let o = {
        id: null,
        tasks: [],
        subinstances: [],
    };
    let m = messages.find(m => m.event === "simulation started");
    if(m) {
        o.id = m.instance_id;
    }
    messages.filter(m => m.event.startsWith("tasks:") && m.instance_id === o.id).reduce(
        (m, tasks) => {
            if(m.event === "tasks:started") {
                tasks.push(m)
            } else {
                t = tasks.find(t => t.cell_id === m.cell_id)
                t.
            }
            return tasks;
        }
    , []);
    return o;
}

export function SimulatorPanel(props) {
    const {activity, onStop} = props;
    const [connectionStatus, setConnectionStatus] = useState("");
    const [messages, setMessages] = useState([]);
    const [serverError, setServerError] = useState(null);
    const [inputBody, setInputBody] = useState({method: "get", url: "", body: ""});
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if(!socket) return;
        socket.onmessage = event => {
            const msg = JSON.parse(event.data);
            if(msg.event === "simulation started") setConnectionStatus("started...");
            if(msg.event === "simulation ended") setConnectionStatus("connected");
            setMessages(messages.concat([msg]));
        };
        socket.onopen = () => {
            setConnectionStatus("connected");
        };
        socket.onclose = event => {
            setConnectionStatus("closed");
            switch (event.code) {
                case 1000:	// CLOSE_NORMAL
                    console.log("WebSocket: closed");
                    break;
                default:	// Abnormal closure
                    setConnectionStatus(`abnormal closure (${event.code})`);
                    break;
            }
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
                        socket.send(JSON.stringify({name: a.name, definition: a.definition, body: inputBody}));
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
                                </tr>
                            </thead>
                            <tbody>
                            {
                                instance.tasks.map(t => <tr key={`task-${t.task_id}`}>
                                    <td>{t.task_id}</td>
                                    <td>{t.task_name}</td>
                                </tr>)
                            }
                            </tbody>
                        </Table>
                    </Tab>
                    <Tab title="Raw events" eventKey={1}>
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