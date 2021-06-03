import React, {useState, useEffect} from 'react';
import {LinkContainer} from 'react-router-bootstrap';
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import {
  fetch_delete,
  fetch_get,
  fetch_post,
  fetch_put,
  NotificationsManager,
  AuthServiceManager,
  API_URL_PREFIX,
  ProvProxiesManager
} from "../utils";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Table from "react-bootstrap/lib/Table";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Alert from "react-bootstrap/lib/Alert";
import Papa from "papaparse";
import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import {DeleteConfirmButton} from "../utils/deleteConfirm";


// few helper functions

function fetchProfileDetails(profile_id) {
    return fetch_get(`/api/v01/system/user_profiles/${profile_id}`)
        .catch(error => NotificationsManager.error(<FormattedMessage id="get-profile-failed" defaultMessage="Failed to get the profile"/>, error.message))
}


export function fetchProfiles(onSuccess) {
    return fetch_get("/api/v01/system/user_profiles")
        .then(data => onSuccess(data.profiles))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="failed-fetch-profiles" defaultMessage="Failed to fetch user profiles"/>,
            error.message
        ))
}

function deleteProfile(profile_id, onSuccess) {
    return fetch_delete(`/api/v01/system/user_profiles/${profile_id}`)
        .then(r => {
            NotificationsManager.success(<FormattedMessage id="deleted" defaultMessage="Deleted"/>);
            onSuccess && onSuccess();
            return r;
        })
        .catch(error => NotificationsManager.error(<FormattedMessage id="delete-failed" defaultMessage="Failed to delete"/>, error.message))
}


function updateProfile(profile_id, data, onSuccess) {
    const data_ = Object.keys(data).reduce((a, b) => {
            if(["name", "available", "see_own_instances", "see_others_instances", "accesses", "home"].includes(b)) {
                a[b] = data[b];
            }
            return a;
        }, {}
    );
    data_.api_rules = data.api_rules.map(r => Object.keys(r).reduce((a, b) => {
            if(["method", "url", "allowed", "name"].includes(b)) {
                a[b] = r[b];
            }
            return a;
        }, {}
    ));
    return fetch_put(`/api/v01/system/user_profiles/${profile_id}`, data_)
        .then(r => {
            NotificationsManager.success(<FormattedMessage id="updated" defaultMessage="Updated"/>);
            onSuccess && onSuccess();
            return r;
        }, error =>
            NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Failed to update"/>, error.message)
        )
}


function rules_from_csv_file(f, onLoaded, onError) {
    Papa.parse(f,
        {
            complete: (results, file) => {
                results.data = results.data
                    .filter(r => Object.keys(r).includes("method") && Object.keys(r).includes("url"))
                    .filter((e, i) => !results.errors.map(e => e.row).includes(i));
                onLoaded(results, file);
            },
            error: onError,
            header: true,
            transform: (v, name) => name === "allowed" ? v === "true" : v,
        }
    );
}


// react components

function UploadFileModal(props) {
    const [error, setError] = useState(undefined);
    const [sourceFile, setSourceFile] = useState(undefined);
    const onClose_ = () => {props.onClose(); setSourceFile(undefined); setError(undefined);};

    return (
        <Modal show={props.show} onHide={() => onClose_()} backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="upload-api-rules" defaultMessage="Upload API rules"/>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                { error && <Alert bsStyle="danger">{error}</Alert> }
                <Form horizontal>
                    <FormGroup validationState={error ? "error" : null}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="source" defaultMessage="Source" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                type="file"
                                accept=".csv"
                                onChange={e => setSourceFile(e.target.files[0])} />
                                <HelpBlock style={{color: 'grey'}}>
                                    <FormattedMessage
                                        id="csv-format"
                                        defaultMessage="The file has to contains the headers (method, url and allowed)." />
                                </HelpBlock>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    bsStyle="primary"
                    onClick={() =>
                        rules_from_csv_file(sourceFile, (r, f) => {props.onLoad(r, f); onClose_();}, e => setError(e))
                    }
                    disabled={!sourceFile}
                >
                    <FormattedMessage id="load" defaultMessage="Load"/>
                </Button>
                <Button onClick={() => onClose_()}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
            </Modal.Footer>
        </Modal>
    )
}

const new_profile = {
  name: "",
  available: true,
  home: undefined,
  accesses: [],
  api_rules: []
};

function NewProfile(props) {
    const [show, setShow] = useState(false);
    const [profile, setProfile] = useState(new_profile);

    const onClose_ = () => {setShow(false); setProfile(new_profile); props.onClose();};
    const validName = profile.name.length !== 0 ? "success" : null;

    const hasAccess = (right) => profile.accesses && profile.accesses.includes(right)

    const toggleAccess = (right, checked) =>
      checked ?
        setProfile(update(profile, {accesses: {$push: [right]}})) :
        setProfile(update(profile, {accesses: {$splice: [[profile.accesses.findIndex(a => a === right), 1]]}}));

    return (
        <div>
            <Button bsStyle='primary' onClick={() => setShow(true)}>
                <FormattedMessage id="add-profile" defaultMessage="Add profile" />
            </Button>
            <Modal show={show} onHide={onClose_} backdrop={false} bsSize="large">
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="create-a-user-profile" defaultMessage="Create a user profile" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <FormGroup validationState={validName}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="name" defaultMessage="Name" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="input"
                                    value={profile.name}
                                    onChange={e => setProfile(update(profile, {$merge: {name: e.target.value}}))} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="publicly-available" defaultMessage="Publicly available" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={profile.available}
                                    onChange={e => setProfile(update(profile, {$merge: {available: e.target.checked}}))} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="home" defaultMessage="Home" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="input"
                                    value={profile.home}
                                             placeholder={"/"}
                                    onChange={e => setProfile(update(profile, {$merge: {home: e.target.value}}))} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="rules" defaultMessage="rules" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th><FormattedMessage id="method" defaultMessage="method" /></th>
                                            <th>url</th>
                                            <th><FormattedMessage id="allowed" defaultMessage="allowed" /></th>
                                            <th><FormattedMessage id="name" defaultMessage="name" /></th>
                                            <th/>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        profile.api_rules.map((r, i) => (
                                            <tr key={`rule_${i}`}>
                                                <td>
                                                    <FormControl componentClass="select"
                                                        value={r.method}
                                                        onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {method: e.target.value}}}}))} >
                                                        <option value="get">get</option>
                                                        <option value="post">post</option>
                                                        <option value="put">put</option>
                                                        <option value="delete">delete</option>
                                                    </FormControl>
                                                </td>
                                                <td>
                                                    <FormControl componentClass="input"
                                                        value={r.url}
                                                        placeholder="/api/v01/p1/*"
                                                        onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {url: e.target.value}}}}))} />
                                                </td>
                                                <td>
                                                    <Checkbox
                                                        checked={r.allowed}
                                                        onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {allowed: e.target.checked}}}}))} />
                                                </td>
                                                <td>
                                                    <FormControl componentClass="input"
                                                        value={r.name}
                                                        onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {name: e.target.value}}}}))} />
                                                </td>
                                                <td><Button bsStyle="danger" onClick={() => setProfile(update(profile, {api_rules: {$splice: [[i, 1]]}}))}><Glyphicon glyph="remove-sign"/></Button></td>
                                            </tr>
                                        ))
                                    }
                                    {
                                        <tr key="new_rule">
                                            <td colSpan={4}>
                                                <Button bsStyle="primary" onClick={() => setProfile(update(profile, {api_rules: {$push: [{method: "get", url: "", allowed: true}]}}))}><Glyphicon glyph="plus"/></Button>
                                            </td>
                                        </tr>
                                    }
                                    </tbody>
                                </Table>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="accesses" defaultMessage="Accesses" />
                            </Col>

                            <Col sm={9}>

                                <Checkbox
                                  checked={hasAccess("requests")}
                                  onChange={e => toggleAccess("requests", e.target.checked)}>
                                  requests
                                  <Checkbox
                                    checked={hasAccess("requests.others_requests")}
                                    onChange={e => toggleAccess("requests.others_requests", e.target.checked)}>
                                    from others
                                  </Checkbox>
                                </Checkbox>

                                <Checkbox
                                  checked={hasAccess("cron_requests")}
                                  onChange={e => toggleAccess("cron_requests", e.target.checked)}>
                                  cron requests
                                </Checkbox>

                                <Checkbox
                                  checked={hasAccess("bulks")}
                                  onChange={e => toggleAccess("bulks", e.target.checked)}>
                                  bulks
                                  <Checkbox
                                    checked={hasAccess("bulks.actions")}
                                    onChange={e => toggleAccess("bulks.actions", e.target.checked)}>
                                    actions
                                  </Checkbox>
                                </Checkbox>
                                <Checkbox
                                  checked={hasAccess("provisioning")}
                                  onChange={e => toggleAccess("provisioning", e.target.checked)}>
                                  provisioning
                                  {
                                    ProvProxiesManager.listProxies().map((p, i) =>
                                      <Checkbox
                                        key={`provisioning.${p.name}`}
                                        checked={hasAccess(`provisioning.${p.name}`)}
                                        onChange={e => toggleAccess(`provisioning.${p.name}`, e.target.checked)}>
                                        {p.name}
                                      </Checkbox>
                                    )
                                  }
                                </Checkbox>
                                <Checkbox
                                  checked={hasAccess("settings")}
                                  onChange={e => toggleAccess("settings", e.target.checked)}>
                                  settings
                                  <Checkbox
                                    checked={hasAccess("settings.users")}
                                    onChange={e => toggleAccess("settings.users", e.target.checked)}>
                                    users
                                  </Checkbox>
                                  <Checkbox
                                    checked={hasAccess("settings.configuration")}
                                    onChange={e => toggleAccess("settings.configuration", e.target.checked)}>
                                    configuration
                                  </Checkbox>
                                  <Checkbox
                                    checked={hasAccess("settings.alarms")}
                                    onChange={e => toggleAccess("settings.alarms", e.target.checked)}>
                                    alarms
                                  </Checkbox>
                                </Checkbox>
                                <Checkbox
                                  checked={hasAccess("orchestration")}
                                  onChange={e => toggleAccess("orchestration", e.target.checked)}>
                                  orchestration
                                </Checkbox>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => {
                        fetch_post("/api/v01/system/user_profiles", profile)
                            .then(() => {
                                NotificationsManager.success(<FormattedMessage id="profile-created" defaultMessage="User profile created"/>);
                                onClose_();
                            })
                            .catch(error => NotificationsManager.error(<FormattedMessage id="fail-save-profile" defaultMessage="Failed to save profile"/>, error.message))
                    }} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                    <Button onClick={onClose_}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}


function UpdateProfile(props) {
    const [profile, setProfile] = useState(props.profile);
    const [loadErrors, setLoadErrors] = useState([]);
    const [showUploadRulesDialog, setShowUploadRulesDialog] = useState(false);
    const refresh = () => fetchProfileDetails(props.profile.id).then(data => setProfile(data.profile));
    const validName = null;

    const hasAccess = (right) => profile.accesses && profile.accesses.includes(right)

    const toggleAccess = (right, checked) =>
      checked ?
        setProfile(update(profile, {accesses: {$push: [right]}})) :
        setProfile(update(profile, {accesses: {$splice: [[profile.accesses.findIndex(a => a === right), 1]]}}));

    return (
        <Panel
            defaultExpanded={false}
            onToggle={expanded => expanded && refresh()}>
            <Panel.Heading>
                <Panel.Title toggle>
                    {props.profile.name}
                </Panel.Title>
            </Panel.Heading>
            <Panel.Body collapsible>
                <Tabs defaultActiveKey={0}>
                    <Tab title={"details"} key={"details"} eventKey={0}>
                        <Form horizontal style={{marginTop: "10px"}}>
                            <FormGroup validationState={validName}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="name" defaultMessage="Name" />
                                </Col>

                                <Col sm={9}>
                                    <div>
                                        <FormControl componentClass="input"
                                            value={profile.name}
                                            onChange={e => setProfile(update(profile, {$merge: {name: e.target.value}}))} />
                                    </div>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="home" defaultMessage="Home" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl componentClass="input"
                                        value={profile.home}
                                        placeholder={"/"}
                                        onChange={e => setProfile(update(profile, {$merge: {home: e.target.value}}))} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="publicly-available" defaultMessage="Publicly available" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={profile.available}
                                        onChange={e => setProfile(update(profile, {$merge: {available: e.target.checked}}))} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="accesses" defaultMessage="Accesses" />
                                </Col>

                                <Col sm={9}>

                                    <Checkbox
                                      checked={hasAccess("dashboard")}
                                      onChange={e => toggleAccess("dashboard", e.target.checked)}>
                                      dashboard
                                    </Checkbox>

                                    <Checkbox
                                      checked={hasAccess("requests")}
                                      onChange={e => toggleAccess("requests", e.target.checked)}>
                                      requests
                                      <Checkbox
                                        checked={hasAccess("requests.others_requests")}
                                        onChange={e => toggleAccess("requests.others_requests", e.target.checked)}>
                                        from others
                                      </Checkbox>
                                      <Checkbox
                                        checked={hasAccess("cron_requests")}
                                        onChange={e => toggleAccess("cron_requests", e.target.checked)}>
                                        cron requests
                                      </Checkbox>
                                    </Checkbox>

                                    <Checkbox
                                      checked={hasAccess("bulks")}
                                      onChange={e => toggleAccess("bulks", e.target.checked)}>
                                      bulks
                                      <Checkbox
                                        checked={hasAccess("bulks.actions")}
                                        onChange={e => toggleAccess("bulks.actions", e.target.checked)}>
                                        actions
                                      </Checkbox>
                                    </Checkbox>
                                    <Checkbox
                                      checked={hasAccess("provisioning")}
                                      onChange={e => toggleAccess("provisioning", e.target.checked)}>
                                      provisioning
                                      {
                                        ProvProxiesManager.listProxies().map((p, i) =>
                                          <Checkbox
                                            key={`provisioning.${p.name}`}
                                            checked={hasAccess(`provisioning.${p.name}`)}
                                            onChange={e => toggleAccess(`provisioning.${p.name}`, e.target.checked)}>
                                            {p.name}
                                          </Checkbox>
                                        )
                                      }
                                    </Checkbox>
                                    <Checkbox
                                      checked={hasAccess("data")}
                                      onChange={e => toggleAccess("data", e.target.checked)}>
                                      data
                                    </Checkbox>
                                    <Checkbox
                                      checked={hasAccess("settings")}
                                      onChange={e => toggleAccess("settings", e.target.checked)}>
                                      settings
                                      <Checkbox
                                        checked={hasAccess("settings.users")}
                                      onChange={e => toggleAccess("settings.users", e.target.checked)}>
                                        users
                                      </Checkbox>
                                      <Checkbox
                                        checked={hasAccess("settings.configuration")}
                                      onChange={e => toggleAccess("settings.configuration", e.target.checked)}>
                                        configuration
                                      </Checkbox>
                                      <Checkbox
                                        checked={hasAccess("settings.alarms")}
                                        onChange={e => toggleAccess("settings.alarms", e.target.checked)}>
                                        alarms
                                      </Checkbox>
                                    </Checkbox>
                                    <Checkbox
                                      checked={hasAccess("orchestration")}
                                      onChange={e => toggleAccess("orchestration", e.target.checked)}>
                                      orchestration
                                    </Checkbox>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Tab>
                    <Tab title={"proxy"} key={"proxy"} eventKey={1}>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="rules" defaultMessage="rules" />
                                </Col>

                                <Col sm={9}>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th><FormattedMessage id="method" defaultMessage="method" /></th>
                                                <th>url</th>
                                                <th><FormattedMessage id="allowed" defaultMessage="allowed" /></th>
                                                <th><FormattedMessage id="name" defaultMessage="name" /></th>
                                                <th/>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            profile.api_rules && profile.api_rules.map((r, i) => (
                                                <tr key={`rule_${i}`}>
                                                    <td>
                                                        <FormControl componentClass="select"
                                                            value={r.method}
                                                            onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {method: e.target.value}}}}))} >
                                                            <option value="get">get</option>
                                                            <option value="post">post</option>
                                                            <option value="put">put</option>
                                                            <option value="delete">delete</option>
                                                        </FormControl>
                                                    </td>
                                                    <td>
                                                        <FormControl componentClass="input"
                                                            value={r.url}
                                                            placeholder="/api/v01/p1/*"
                                                            onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {url: e.target.value}}}}))} />
                                                    </td>
                                                    <td>
                                                        <Checkbox
                                                            checked={r.allowed}
                                                            onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {allowed: e.target.checked}}}}))} />
                                                    </td>
                                                    <td>
                                                        <FormControl componentClass="input"
                                                            value={r.name}
                                                            onChange={e => setProfile(update(profile, {api_rules: {[i]: {$merge: {name: e.target.value}}}}))} />
                                                    </td>
                                                    <td><Button bsStyle="danger" onClick={() => setProfile(update(profile, {api_rules: {$splice: [[i, 1]]}}))}><Glyphicon glyph="remove-sign"/></Button></td>
                                                </tr>
                                            ))
                                        }
                                        {
                                            <tr key="new_rule">
                                                <td colSpan={4}>
                                                    <Button bsStyle="primary" onClick={() => setProfile(update(profile, {api_rules: {$push: [{method: "get", url: "", allowed: true}]}}))}><Glyphicon glyph="plus"/></Button>
                                                </td>
                                            </tr>
                                        }
                                        </tbody>
                                    </Table>
                                    {
                                        loadErrors.map((e, i) => <Alert key={i} bsStyle="danger">{e.message} {e.row && `on row ${e.row}`}</Alert>)
                                    }
                                    <ButtonToolbar>
                                        <Button
                                          onClick={() => {
                                            AuthServiceManager.getValidToken().then(token => {
                                                window.location=`${API_URL_PREFIX}/api/v01/system/user_profiles/${profile.id}?as=csv&auth_token=${token}`
                                              })
                                          }}
                                        ><Glyphicon glyph="save"/></Button>
                                        <Button onClick={() => setShowUploadRulesDialog(true)}>
                                            <Glyphicon glyph="open"/>
                                        </Button>
                                    </ButtonToolbar>
                                </Col>
                            </FormGroup>
                            <UploadFileModal
                                show={showUploadRulesDialog}
                                onClose={() => setShowUploadRulesDialog(false)}
                                onLoad={(results, file) => {
                                    setProfile(update(profile, {$merge: {api_rules: results.data}}));
                                    NotificationsManager.success(`${results.data.length} records loaded from ${file && file.name} with ${results.errors.length} errors`);
                                    results.errors && setLoadErrors(results.errors)
                                }}
                            />
                        </Form>
                    </Tab>
                </Tabs>
                <ButtonToolbar>
                    <Button
                        bsStyle="primary"
                        onClick={() => updateProfile(props.profile.id, profile, props.onUpdate)}
                    >
                        <FormattedMessage id="save" defaultMessage="Save"/>
                    </Button>
                    <DeleteConfirmButton
                      resourceName={props.profile.name}
                      button={"Delete"}
                      onConfirm={() => deleteProfile(props.profile.id, props.onDelete)}>
                        <FormattedMessage id="delete" defaultMessage="Delete"/>
                    </DeleteConfirmButton>
                    <Button onClick={refresh}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
                </ButtonToolbar>
            </Panel.Body>
        </Panel>
    )
}

export default function UserProfiles() {
    const [profiles, setProfiles] = useState([]);
    const refresh = () => {
      fetchProfiles(setProfiles);
      document.title = "Profiles";
    };
    useEffect(refresh, []);

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <LinkContainer to={"/system/users"}>
                    <Breadcrumb.Item><FormattedMessage id="users" defaultMessage="Users"/></Breadcrumb.Item>
                </LinkContainer>
                <Breadcrumb.Item active><FormattedMessage id="profiles" defaultMessage="Profiles"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <NewProfile onClose={refresh} />
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>

            {
                profiles.sort(
                    (a, b) => a.id - b.id
                ).map(
                    (p, i) => <UpdateProfile profile={p} onDelete={refresh} onUpdate={refresh} key={i}/>
                )
            }
        </div>
    )
}