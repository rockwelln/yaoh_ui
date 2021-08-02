import React, {useEffect, useState} from "react";
import {FormattedMessage} from "react-intl";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Alert from "react-bootstrap/lib/Alert";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import update from "immutability-helper";


const isValidName = name => name === ''?null:name.length < 4?"error":"success";

const JSON_SCHEMA_SAMPLE = (
`{
    "$schema": "http://json-schema.org/schema#",
    "type": "object",
    "properties": {
        "status": {
            "type": "string", "enum": ["ACTIVE", "ERROR"]
        }
    },
    "additionalProperties": false
}`
);

export const JSON_TRANS_OPTIONS_SAMPLE = (
`{
    "abc": {"infer_type": true},
    "ghi": {"infer_type": true}
}`
);


function playground(input, validation_schema, options, onError, onSuccess) {
    fetch_post(`/api/v01/bulks/actions/t_playground`,
        {
            input: input,
            validation_schema: validation_schema && JSON.parse(validation_schema),
            options: options && JSON.parse(options)
        })
        .then(resp => resp.json())
        .then(data => onSuccess(data.output))
        .catch(error => onError(error.message))
}


function Playground(props) {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");

    const onPlayground = () => {
        setError("");
        playground(input, props.validation_schema, props.options, msg => {setError(msg); setOutput("");}, setOutput);
    };

    return (
        <div>
            <Row>
                <Col sm={10}>
                    <FormControl
                        componentClass="textarea"
                        value={input || ""}
                        rows={2}
                        placeholder="input..."
                        onChange={e => setInput(e.target.value)} />
                </Col>
                <Col sm={1}>
                    <Button
                        onClick={onPlayground}
                        disabled={!input}>
                        <FormattedMessage id="try" defaultMessage="Try"/>
                    </Button>
                </Col>
            </Row>
            {
                error &&
                    <HelpBlock style={{color: "red"}}>{error}</HelpBlock>
            }
            <FormControl
                componentClass="textarea"
                value={output ? JSON.stringify(output, null, 4) : ""}
                rows={5}
                placeholder="playground output..."
                readOnly />
        </div>
    )
}


class NewAction extends React.Component {
    state = {
        show: false,
        action: NewAction.empty_action(),
        activities: [],
        playground_show: false
    };

    static empty_action() {
        return {
            name: '',
            type: "",
            options: null,
            validation_schema: null,
            sample_input: null,
            sequence_timeout: null,
        }
    }

    fetchActivities() {
        fetch_get('/api/v01/activities')
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                error.message
            ));
    }

    componentDidMount() {
        this.fetchActivities();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onSubmit() {
        const {action} = this.state;
        const diffAction = NewAction.filterFieldsOnType(action);


        fetch_post(`/api/v01/bulks/actions`,
            Object.keys(diffAction).reduce(
                (obj, key) => {
                    if(["options", "validation_schema"].includes(key)) {
                        obj[key] = JSON.parse(diffAction[key]);
                    } else {
                        obj[key] = diffAction[key];
                    }
                    return obj;
                }, {}
            )
        )
            .then(() => {
                !this.cancelLoad && this.setState({show: false, action: NewAction.empty_action()});
                NotificationsManager.success(<FormattedMessage id="action-created" defaultMessage="Action created!"/>);
                this.props.onClose && this.props.onClose();
            })
            .catch(error =>
                NotificationsManager.error(
                    <FormattedMessage id="create-action-failed" defaultMessage="Failed to create the action!"/>,
                    error.message
                )
            )
    }

    static filterFieldsOnType(action) {
        let fields = ["name", "options", "validation_schema", "sequence_timeout", "sample_input"];
        switch(action.type) {
            case "url":
                fields += ["url", "method", "header_1", "header_2", "header_3"];
                break;
            case "orchestrated":
                fields += ["activity_id"];
                break;
            default:
        }

        return Object.keys(action).filter(k => fields.includes(k) && action[k]).reduce(
            (obj, key) => {
                obj[key] = action[key];
                return obj;
            }, {}
        );
    }

    render() {
        const {show, action, activities, playground_show} = this.state;
        const onClose = () => this.setState({show: false, playground_show: false, action: NewAction.empty_action()});
        const validName = isValidName(action.name);
        let validOptions = null;
        if(action.options) {
            try {
                JSON.parse(action.options);
                validOptions = "success";
            } catch {
                validOptions = "error";
            }
        }

        let validSchema = null;
        if(action.validation_schema) {
            try {
                JSON.parse(action.validation_schema);
                validSchema = "success";
            } catch {
                validSchema = "error";
            }
        }
        const validUrl = action.type === "url" && action.url ? action.url.startsWith("http") ? "success" : "error" : null;
        const validHeader1 = null;
        const validHeader2 = null;
        const validHeader3 = null;
        const validForm = (
            validName === "success" &&
            (!validSchema || validSchema === "success") &&
            (!validOptions || validOptions === "success") &&
            action.type &&
            (
                (action.type === "url" && (action.method && validUrl === "success")) ||
                (action.type === "orchestrated" && action.activity_id)
            )
        );

        return (
            <div>
                <Button bsStyle="primary" onClick={() => this.setState({show: true})}>
                    <FormattedMessage id="action-new" defaultMessage="New action"/>
                </Button>
                <Modal show={show} onHide={onClose} backdrop={false} bsSize={"large"}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="new-action" defaultMessage="Create a new action" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup validationState={validName}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="name" defaultMessage="Name" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={action.name}
                                        onChange={e => this.setState({action: update(action, {$merge: {name: e.target.value}})})}/>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={validOptions}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="conversion-options" defaultMessage="Conversion options (optional)" />
                                </Col>

                                <Col sm={9}>
                                    <Button
                                        bsSize="small"
                                        style={{
                                            position: "absolute",
                                            right: "20px",
                                            top: "5px",
                                        }}
                                        onClick={() => this.setState({action: update(action, {$merge: {options: JSON_TRANS_OPTIONS_SAMPLE}})})}>
                                        <FormattedMessage id="sample" defaultMessage="Sample"/>
                                    </Button>
                                    <FormControl
                                        componentClass="textarea"
                                        value={action.options || ""}
                                        rows={5}
                                        placeholder={"ex: " + JSON_TRANS_OPTIONS_SAMPLE}
                                        onChange={e =>
                                            this.setState({action: update(action, {$merge: {options: e.target.value}})})
                                        } />
                                    <HelpBlock>
                                        <FormattedMessage
                                            id="bulk-action-options"
                                            defaultMessage="This is used to configure the transformation of the CSV record into JSON. (See {ref_link} for more information)"
                                            values={{ref_link: <a href="https://github.com/rockwelln/csv2json" target="_blank" rel="noopener noreferrer">csv2json</a>}}
                                        />
                                    </HelpBlock>
                                </Col>
                            </FormGroup>

                            <FormGroup validationState={validSchema}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="validation-schema" defaultMessage="Validation schema (optional)" />
                                </Col>

                                <Col sm={9}>
                                    <Button
                                        bsSize="small"
                                        style={{
                                            position: "absolute",
                                            right: "20px",
                                            top: "5px",
                                        }}
                                        onClick={() => this.setState({action: update(action, {$merge: {validation_schema: JSON_SCHEMA_SAMPLE}})})}>
                                        <FormattedMessage id="sample" defaultMessage="Sample"/>
                                    </Button>
                                    <FormControl
                                        componentClass="textarea"
                                        value={action.validation_schema || ""}
                                        rows={5}
                                        placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                        onChange={e =>
                                            this.setState({action: update(action, {$merge: {validation_schema: e.target.value}})})
                                        } />
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-action-schema" defaultMessage="When set, the body is systematically checked against the schema."/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="transformation-playground" defaultMessage="Transformation playground" />
                                </Col>

                                {
                                    playground_show ?
                                        <Col sm={9}>
                                            <Button onClick={() => this.setState({playground_show: false})} bsStyle="link">
                                                <FormattedMessage id="hide" defaultMessage="hide"/>
                                            </Button>

                                            <Playground
                                                validation_schema={action.validation_schema}
                                                options={action.options} />
                                        </Col> :
                                        <Col sm={9}>
                                            <Button onClick={() => this.setState({playground_show: true})} bsStyle="link">
                                                <FormattedMessage id="show" defaultMessage="show"/>
                                            </Button>
                                        </Col>
                                }
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="input-sample" defaultMessage="Input sample" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="textarea"
                                        className={"textarea-no-wrap"}
                                        value={action.sample_input || ""}
                                        rows={5}
                                        placeholder={"ex: a; b; c\n1; 2; 3\n"}
                                        onChange={e =>
                                            this.setState({action: update(action, {$merge: {sample_input: e.target.value}})})
                                        } />
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-input-sample" defaultMessage="Sample input available for future users of this bulk action."/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="sequence-timeout" defaultMessage="Sequence timeout" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={action.sequence_timeout || ""}
                                        onChange={e => {
                                          (!e.target.value || !isNaN(e.target.value)) &&
                                          this.setState({action: update(action, {$merge: {sequence_timeout: e.target.value ? parseFloat(e.target.value) : null}})})
                                        }} />
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-seq-timeout-sample" defaultMessage="timeout (in seconds) between entries when processed in sequence."/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>

                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="type" defaultMessage="Type" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="select"
                                        value={action.type}
                                        onChange={e => this.setState({action: update(action, {$merge: {type: e.target.value}})})}>
                                        <option value=""/>
                                        <option value="url">URL call</option>
                                        <option value="orchestrated">Orchestrated</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <hr/>

                            { action.type === "orchestrated" &&
                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="activity" defaultMessage="Activity" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="select"
                                            value={action.activity_id}
                                            onChange={e => this.setState({action: update(action, {$merge: {activity_id: e.target.value ? parseInt(e.target.value) : null}})})}>
                                            <option value=""/>
                                            {   activities.sort((a,b) => {
                                                    if(a.name > b.name) return 1;
                                                    if(a.name < b.name) return -1;
                                                    return 0;
                                                })
                                                .map(a => <option value={a.id} key={a.id}>{a.name}</option>)
                                            }
                                        </FormControl>
                                    </Col>
                                </FormGroup>
                            }

                            { action.type === "url" && [

                                <FormGroup key={1}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="method" defaultMessage="Method" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="select"
                                            value={action.method}
                                            onChange={e => this.setState({action: update(action, {$merge: {method: e.target.value}})})}>
                                            <option value=""/>
                                            <option value="get">get</option>
                                            <option value="post">post</option>
                                            <option value="put">put</option>
                                            <option value="delete">delete</option>
                                        </FormControl>
                                    </Col>
                                </FormGroup>,

                                <FormGroup  key={2} validationState={validUrl}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="url" defaultMessage="Url" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            value={action.url}
                                            onChange={e => this.setState({action: update(action, {$merge: {url: e.target.value}})})}/>
                                        <HelpBlock>
                                            <FormattedMessage id="bulk-action-url" defaultMessage="May contain placeholder for the input. Use column name starting with 'url.' (i.e url.entity_id to refer {sample_holder})" values={{sample_holder: "http://.../{entity_id}"}}/>
                                        </HelpBlock>
                                    </Col>
                                </FormGroup>,

                                <FormGroup key={3} validationState={validHeader1}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="header1" defaultMessage="Custom header 1 (optional)" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            value={action.header_1}
                                            onChange={e => this.setState({action: update(action, {$merge: {header_1: e.target.value}})})}/>
                                        <HelpBlock>
                                            <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value' (ex: Authorization={user_token})"/>
                                        </HelpBlock>
                                    </Col>
                                </FormGroup>,

                                <FormGroup key={4} validationState={validHeader2}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="header2" defaultMessage="Custom header 2 (optional)" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            value={action.header_2}
                                            onChange={e => this.setState({action: update(action, {$merge: {header_2: e.target.value}})})}/>
                                        <HelpBlock>
                                            <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value' (ex: Authorization={user_token})"/>
                                        </HelpBlock>
                                    </Col>
                                </FormGroup>,

                                <FormGroup key={5} validationState={validHeader3}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="header3" defaultMessage="Custom header 3 (optional)" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            value={action.header_3}
                                            onChange={e => this.setState({action: update(action, {$merge: {header_3: e.target.value}})})}/>
                                        <HelpBlock>
                                            <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value' (ex: Authorization={user_token})"/>
                                        </HelpBlock>
                                    </Col>
                                </FormGroup>,
                            ]}
                        </Form>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSubmit.bind(this)} bsStyle="primary" disabled={!validForm}>
                            <FormattedMessage id="create" defaultMessage="Create" />
                        </Button>
                        <Button onClick={onClose}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}


class Action extends React.Component {
    state = {
        diffAction: {},
        activities: [],
        playground_show: false
    };

    fetchActivities() {
        fetch_get('/api/v01/activities')
            .then(data => !this.cancelLoad && this.setState({activities: data.activities}))
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                error.message
            ));
    }

    componentDidMount() {
        this.fetchActivities();
    }

    onDelete() {
        fetch_delete(`/api/v01/bulks/actions/${this.props.action.id}`)
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="action-deleted" defaultMessage="Action deleted!" />);
                this.props.onDelete && this.props.onDelete();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="delete-action-failed" defaultMessage="Failed to delete action"/>, error.message
            ))
    }

    onSave() {
        const {action} = this.props;
        const {diffAction} = this.state;

        fetch_put(
            `/api/v01/bulks/actions/${action.id}`,
            Object.keys(diffAction).reduce(
                (obj, key) => {
                    if(["options", "validation_schema"].includes(key)) {
                        if(diffAction[key]) {
                            obj[key] = JSON.parse(diffAction[key])
                        } else {
                            obj[key] = null
                        }
                    } else {
                        obj[key] = diffAction[key];
                    }
                    return obj;
                }, {}
            )
        )
            .then(() => {
                NotificationsManager.success(<FormattedMessage id="action-updated" defaultMessage="Action updated!" />);
                this.props.onUpdate && this.props.onUpdate();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="update-action-failed" defaultMessage="Failed to update action"/>, error.message
            ))
    }

    render() {
        const {action} = this.props;
        const {diffAction, activities, playground_show} = this.state;
        if(!action) return <div/>;

        const localAction = update(action, {$merge: diffAction});
        const actionTypeOrchestrated = action.activity_id;
        const actionTypeUrl = !action.activity_id && action.url;
        if(localAction.validation_schema && typeof localAction.validation_schema === "object") {
            localAction.validation_schema = JSON.stringify(localAction.validation_schema);
        }
        if(localAction.options && typeof localAction.options === "object") {
            localAction.options = JSON.stringify(localAction.options);
        }

        const validName = isValidName(localAction.name);
        let validOptions = null;
        if(localAction.options) {
            try {
                JSON.parse(localAction.options);
                validOptions = "success";
            } catch {
                validOptions = "error";
            }
        }

        let validSchema = null;
        if(localAction.validation_schema) {
            try {
                JSON.parse(localAction.validation_schema);
                validSchema = "success";
            } catch {
                validSchema = "error";
            }
        }
        const validUrl = actionTypeUrl && localAction.url ? localAction.url.startsWith("http") ? "success" : "error" : null;
        const validHeader1 = null;
        const validHeader2 = null;
        const validHeader3 = null;
        const validForm = (
            validName === "success" &&
            (!validSchema || validSchema === "success") &&
            (!validOptions || validOptions === "success") &&
            (
                (actionTypeUrl && (localAction.method && validUrl === "success")) ||
                (actionTypeOrchestrated && localAction.activity_id)
            )
        );

        return (
            <Panel defaultExpanded={false}>
                <Panel.Heading>
                    <Panel.Title toggle>
                        {action.name}
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    <Form horizontal>
                        <FormGroup validationState={validName}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="name" defaultMessage="Name" />
                            </Col>

                            <Col sm={9}>
                                <div>
                                    <FormControl componentClass="input"
                                        value={localAction.name}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {name: e.target.value}})})} />
                                </div>
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validOptions}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="conversion-options" defaultMessage="Conversion options (optional)" />
                            </Col>

                            <Col sm={9}>
                                <Button
                                    bsSize="small"
                                    style={{
                                        position: "absolute",
                                        right: "20px",
                                        top: "5px",
                                    }}
                                    onClick={() => this.setState({diffAction: update(action, {$merge: {diffAction: JSON_TRANS_OPTIONS_SAMPLE}})})}>
                                    <FormattedMessage id="sample" defaultMessage="Sample"/>
                                </Button>
                                <FormControl
                                    componentClass="textarea"
                                    value={localAction.options || ""}
                                    rows={5}
                                    placeholder={"ex: " + JSON_TRANS_OPTIONS_SAMPLE}
                                    onChange={e =>
                                        this.setState({diffAction: update(diffAction, {$merge: {options: e.target.value}})})
                                    } />
                                <HelpBlock>
                                    <FormattedMessage
                                        id="bulk-action-options"
                                        defaultMessage="This is used to configure the transformation of the CSV record into JSON. (See {ref_link} for more information)"
                                        values={{ref_link: <a href="https://github.com/rockwelln/csv2json" target="_blank" rel="noopener noreferrer">csv2json</a>}}
                                    />
                                </HelpBlock>
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validSchema}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="validation-schema" defaultMessage="Validation schema (optional)" />
                            </Col>

                            <Col sm={9}>
                                <Button
                                    bsSize="small"
                                    style={{
                                        position: "absolute",
                                        right: "20px",
                                        top: "5px",
                                    }}
                                    onClick={() => this.setState({diffAction: update(diffAction, {$merge: {validation_schema: JSON_SCHEMA_SAMPLE}})})}>
                                    <FormattedMessage id="sample" defaultMessage="Sample"/>
                                </Button>
                                <FormControl
                                    componentClass="textarea"
                                    value={localAction.validation_schema || ""}
                                    rows={5}
                                    placeholder={"ex: " + JSON_SCHEMA_SAMPLE}
                                    onChange={e =>
                                        this.setState({diffAction: update(diffAction, {$merge: {validation_schema: e.target.value}})})
                                    } />
                                <HelpBlock>
                                    <FormattedMessage id="bulk-action-schema" defaultMessage="When set, the body is systematically checked against the schema."/>
                                </HelpBlock>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="transformation-playground" defaultMessage="Transformation playground" />
                            </Col>

                            {
                                playground_show ?
                                    <Col sm={9}>
                                        <Button onClick={() => this.setState({playground_show: false})} bsStyle="link">
                                            <FormattedMessage id="hide" defaultMessage="hide"/>
                                        </Button>

                                        <Playground
                                            validation_schema={localAction.validation_schema}
                                            options={localAction.options} />
                                    </Col> :
                                    <Col sm={9}>
                                        <Button onClick={() => this.setState({playground_show: true})} bsStyle="link">
                                            <FormattedMessage id="show" defaultMessage="show"/>
                                        </Button>
                                    </Col>
                            }
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="input-sample" defaultMessage="Input sample" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="textarea"
                                    className={"textarea-no-wrap"}
                                    value={localAction.sample_input || ""}
                                    rows={5}
                                    placeholder={"ex: a; b; c\n1; 2; 3\n"}
                                    onChange={e =>
                                        this.setState({diffAction: update(diffAction, {$merge: {sample_input: e.target.value}})})
                                    } />
                                <HelpBlock>
                                    <FormattedMessage id="bulk-input-sample" defaultMessage="Sample input available for future users of this bulk action."/>
                                </HelpBlock>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="sequence-timeout" defaultMessage="Sequence timeout" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localAction.sequence_timeout || ""}
                                    onChange={e => {
                                      (!e.target.value || !isNaN(e.target.value)) &&
                                      this.setState({diffAction: update(diffAction, {$merge: {sequence_timeout: e.target.value ? parseFloat(e.target.value) : null}})})
                                    }} />
                                <HelpBlock>
                                    <FormattedMessage id="bulk-seq-timeout-sample" defaultMessage="timeout (in seconds) between entries when processed in sequence."/>
                                </HelpBlock>
                            </Col>
                        </FormGroup>

                        { action.activity_id &&
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="activity" defaultMessage="Activity" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="select"
                                        value={localAction.activity_id}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {activity_id: e.target.value ? parseInt(e.target.value) : null}})})}>
                                        <option value=""/>
                                        {   activities.sort((a,b) => {
                                                if(a.name > b.name) return 1;
                                                if(a.name < b.name) return -1;
                                                return 0;
                                            })
                                            .map(a => <option value={a.id} key={a.id}>{a.name}</option>)
                                        }
                                    </FormControl>
                                </Col>
                            </FormGroup>
                        }

                        { action.url && [
                            <FormGroup key={1}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="method" defaultMessage="Method" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="select"
                                        value={localAction.method}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {method: e.target.value}})})}>
                                        <option value=""/>
                                        <option value="get">get</option>
                                        <option value="post">post</option>
                                        <option value="put">put</option>
                                        <option value="delete">delete</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>,

                            <FormGroup key={2} validationState={validUrl}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="url" defaultMessage="Url" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={localAction.url}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {url: e.target.value}})})}/>
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-action-url" defaultMessage="May contain placeholder for the input. Use column name starting with 'url.' (i.e url.entity_id to refer {sample_holder})" values={{sample_holder: "http://.../{entity_id}"}}/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>,

                            <FormGroup key={3} validationState={validHeader1}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="header1" defaultMessage="Custom header 1 (optional)" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={localAction.header_1 || ""}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {header_1: e.target.value}})})}/>
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value'"/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>,

                            <FormGroup key={4} validationState={validHeader2}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="header2" defaultMessage="Custom header 2 (optional)" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={localAction.header_2 || ""}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {header_2: e.target.value}})})}/>
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value'"/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>,

                            <FormGroup key={5} validationState={validHeader3}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="header3" defaultMessage="Custom header 3 (optional)" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={localAction.header_3 || ""}
                                        onChange={e => this.setState({diffAction: update(diffAction, {$merge: {header_3: e.target.value}})})}/>
                                    <HelpBlock>
                                        <FormattedMessage id="bulk-action-header" defaultMessage="Custom header in form 'NAME=value'"/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>,

                        ]}

                        <FormGroup>
                            <Col smOffset={2} sm={9}>
                                <ButtonToolbar>
                                    <Button bsStyle="primary" onClick={this.onSave.bind(this)} disabled={!validForm}>
                                        <FormattedMessage id="save" defaultMessage="Save" />
                                    </Button>
                                    <Button bsStyle="danger" onClick={this.onDelete.bind(this)}>
                                        <FormattedMessage id="delete" defaultMessage="Delete" />
                                    </Button>
                                    <Button onClick={() => this.setState({diffAction: {}})}>
                                        <FormattedMessage id="reset" defaultMessage="Reset" />
                                    </Button>
                                </ButtonToolbar>
                            </Col>
                        </FormGroup>
                    </Form>
                </Panel.Body>
            </Panel>
        )
    }
}

function fetchActions(onLoading, onSuccess) {
    onLoading();
    fetch_get("/api/v01/bulks/actions")
        .then(data => onSuccess(data.actions))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="list-actions-error" defaultMessage="Failed to list actions"/>,
            error.message
        ))
}

export function BulkActions(props) {
    const [actions, setActions] = useState([]);
    const fetchActions_ = () => {fetchActions(() => setActions([]), setActions)};
    useEffect(() => {
      fetchActions_();
      document.title = "Bulk actions"
    }, []);

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="bulk-actions" defaultMessage="Bulk actions"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <NewAction
                            onClose={fetchActions_}
                            {...props} />
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>

            { actions.length === 0 ?
                <Alert bsStyle="info">
                    <FormattedMessage id="no-action" defaultMessage="No action defined"/>
                </Alert>
                :
                actions.sort((a, b) => a.id - b.id).map((a, i) =>
                    <Action
                        key={i}
                        action={a}
                        onUpdate={fetchActions_}
                        onDelete={fetchActions_} />
                )
            }

        </div>
    )
}