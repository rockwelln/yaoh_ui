import React, { useState, useEffect } from 'react';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import Form from 'react-bootstrap/lib/Form';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import FormControl from 'react-bootstrap/lib/FormControl';
import Alert from 'react-bootstrap/lib/Alert';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Modal from 'react-bootstrap/lib/Modal';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Tab from 'react-bootstrap/lib/Tab';
import Tabs from 'react-bootstrap/lib/Tabs';
import Table from 'react-bootstrap/lib/Table';

import {FormattedMessage} from 'react-intl';

// import 'font-awesome/css/font-awesome.min.css';
import update from 'immutability-helper';

import {fetch_post, fetch_get, fetch_delete, fetch_put, NotificationsManager} from "../utils";
import {ApioDatatable} from "../utils/datatable";
import { LinkContainer } from 'react-router-bootstrap';
import {INTERNAL_HELP_LINKS} from "../async-apio-help";
import {Search, StaticControl} from "../utils/common";
import {CallbackHandler} from "./callbacks";
import {get_ui_profiles} from "../utils/user";
import {TrustedLocationsTable} from "./user_trusted_locs";


// helper functions

function updateLocalUser(data, onSuccess) {
    const updatable_field = k => ['language', 'password', 'timezone'].includes(k);
    fetch_put(
        '/api/v01/system/users/local',
        Object.keys(data).filter(updatable_field).reduce(
            (obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {}
        ),
    )
    .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-updated" defaultMessage="User updated" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Update failed" />, error.message)
    )
}


function updateUser(user_id, data, onSuccess) {
    fetch_put(`/api/v01/system/users/${user_id}`, data)
    .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-updated" defaultMessage="User updated" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Update failed" />, error.message)
    )
}


function revokeUser(user_id, unblock, onSuccess) {
    fetch_put(`/api/v01/auth/${user_id}/${unblock?'un':''}revoke`, {})
    .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-updated" defaultMessage="User updated" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="user-revoke-failed" defaultMessage="User access update failed!" />, error.message)
    )
}


function deleteUser(user_id, onSuccess) {
    fetch_delete(`/api/v01/system/users/${user_id}`)
    .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-deleted" defaultMessage="User deleted" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="delete-failed" defaultMessage="Delete failed" />, error.message)
    );
}


function createUser(data, onSuccess) {
    fetch_post('/api/v01/system/users', data)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="user-created" defaultMessage="User created" />);
            onSuccess && onSuccess();
        })
        .catch(error =>
            NotificationsManager.error(<FormattedMessage id="creation-failed" defaultMessage="Creation failed" />, error.message)
        );
}


function assignRole(userId, roleId, onSuccess) {
    fetch_post(`/api/v01/system/users/${userId}/roles/${roleId}`)
        .then(() => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="assignation-failed" defaultMessage="Assignation failed" />, error.message))
}


function deassignRole(userId, roleId, onSuccess) {
    fetch_delete(`/api/v01/system/users/${userId}/roles/${roleId}`)
        .then(() => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="deassignation-failed" defaultMessage="De-assignation failed" />, error.message))
}


export function fetchLocalUser(onSuccess, onError) {
    fetch_get('/api/v01/system/users/local')
      .then(r => onSuccess && onSuccess(r))
      .catch(error => onError && onError(error.message))
}


function refreshLocalUserApiToken(onSuccess) {
    fetch_put(`/api/v01/system/users/local`, {token: true})
      .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-updated" defaultMessage="User updated" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Update failed" />, error.message)
    )
}

// React components

export function LocalUserProfile({onUserInfoChanged}) {
    const [userInfo, setUserInfo] = useState({});
    const user_info = userInfo;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileName, setProfileName] = useState('');
    const [language, setLanguage] = useState(user_info.language);
    const [timezone, setTimezone] = useState(user_info.timezone);

    const delta = {};
    if(newPassword.length !== 0) {
        delta.password = newPassword;
    }
    if(language !== user_info.language) {
        delta.language = language;
    }
    if(timezone !== user_info.timezone) {
        delta.timezone = timezone;
    }
    useEffect(() => {
        user_info.profile_id && fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfileName(data.profiles.find(p => p.id === user_info.profile_id).name))
            .catch(console.error)
    }, [user_info.profile_id]);
    useEffect(() => {
      fetchLocalUser(setUserInfo);
      document.title = "User";
    }, [])
    const validPassword = (newPassword === '')?null:(newPassword.length >= 7)?"success":"error";
    const validRepPassword = (newPassword === '')?null:(confirmPassword === newPassword)?"success":"error";
    const validForm = validPassword !== 'error' && validRepPassword !== 'error' && Object.keys(delta).length !== 0;
    return (
        <Panel>
            <Panel.Heading>
                <Panel.Title><FormattedMessage id="user" defaultMessage="User" /> {user_info.username} </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
                <Tabs defaultActiveKey={1} id="local-user-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="details" defaultMessage="Details" />}>
                    <Form horizontal style={{paddingTop: 10}}>
                        <StaticControl
                                label={<FormattedMessage id='username' defaultMessage='Username' />}
                                value={user_info.username}/>
                        <StaticControl
                                label={<FormattedMessage id='email' defaultMessage='Email' />}
                                value={user_info.email}/>
                        <StaticControl
                                label={<FormattedMessage id='system' defaultMessage='System' />}
                                value={
                                    user_info.is_system?
                                        <FormattedMessage id="yes" defaultMessage="Yes" />:
                                        <FormattedMessage id="no" defaultMessage="No" />
                                }/>
                        <StaticControl label={<FormattedMessage id='profile' defaultMessage='Profile'/>} value={profileName}/>
                        <StaticControl label={<FormattedMessage id='ui-profile' defaultMessage='UI Profile'/>} value={user_info.ui_profile}/>
                        <StaticControl label={<FormattedMessage id='registered-on' defaultMessage='Registered on'/>} value={user_info.registered_on}/>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="language" defaultMessage="Language" />
                            </Col>

                            <Col sm={2}>
                                <FormControl
                                    componentClass="select"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}>
                                    <option value="en">en</option>
                                </FormControl>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="timezone" defaultMessage="Timezone" />
                            </Col>

                            <Col sm={2}>
                                <FormControl
                                    componentClass="select"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}>
                                    <option value="">* local *</option>
                                    {
                                        ["+01:00", "+02:00", "+03:00"].map(t => <option value={t} key={t}>{t}</option>)
                                    }
                                </FormControl>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="roles" defaultMessage="Roles" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Assignation time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        user_info.roles && user_info.roles.sort((a, b) => a.id - b.id).map(
                                            r => <tr key={r.id}>
                                                <td>{r.name}</td>
                                                <td>{r.created_on}</td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </Table>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="properties" defaultMessage="Properties" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        user_info.properties && Object.keys(user_info.properties).sort((a, b) => a.localeCompare(b)).map(
                                            p => <tr key={p}>
                                                <td>{p}</td>
                                                <td>{user_info.properties[p]}</td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </Table>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="password" defaultMessage="Password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    placeholder="Password"
                                    type="password"
                                    autoComplete="off"
                                    name="new-password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validRepPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="repeat-password" defaultMessage="Repeat password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    placeholder="Repeat password"
                                    type="password"
                                    autoComplete="off"
                                    name="confirm-new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validRepPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id='token' defaultMessage='Token' />
                            </Col>

                            <Col sm={9}>
                                <FormControl.Static>
                                    {user_info.token}
                                    {" "}
                                    <Button onClick={() => refreshLocalUserApiToken(() => fetchLocalUser(setUserInfo))}>
                                        <Glyphicon glyph={"refresh"}/>
                                    </Button>
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col smOffset={2} sm={9}>
                                <Button bsStyle="primary" onClick={() => updateLocalUser(delta, onUserInfoChanged)} disabled={!validForm}>
                                    <FormattedMessage id="save" defaultMessage="Save" />
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </Tab>
                <Tab eventKey={2} title={<FormattedMessage id="callbacks" defaultMessage="Callbacks" />}>
                    { user_info.id && <CallbackHandler userId={user_info.id} /> }
                </Tab>
                <Tab eventKey={"trusted-locs"} title={<FormattedMessage id="trusted-loc" defaultMessage="Trusted Loc." />}>
                     <TrustedLocationsTable
                       userId={user_info.id}
                       locations={user_info.trusted_locs}
                       userInfo={user_info}
                       onChange={onUserInfoChanged} />
                </Tab>
            </Tabs>
            </Panel.Body>
        </Panel>
    )
}


function UpdateUser(props) {
    const {show, user, onClose} = props;

    const [fullUser, setFullUser] = useState({});
    const [diffUser, setDiffUser] = useState({});
    const [profiles, setProfiles] = useState([]);
    const [roles, setRoles] = useState([]);
    const [newProp, setNewProp] = useState({key: "", value: ""});

    const loadFullUser = userId => fetch_get(`/api/v01/system/users/${userId}`)
        .then(user => setFullUser(user))
        .catch(console.error)
    useEffect(() => {
        show ? loadFullUser(user.id) : setFullUser({})
    }, [user.id, show]);

    useEffect(() => {
        show && fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfiles(data.profiles));
        show && fetch_get("/api/v01/system/user_roles")
            .then(data => setRoles(data.roles))
    }, [show]);

    const localUser = update(fullUser, {$merge: diffUser});
    const delta = {...diffUser};
    if(delta.hasOwnProperty("newPassword")) {
        if(delta.newPassword) {
            delta.password = delta.newPassword;
        }
        delete delta.newPassword;
        delete delta.confirmPassword;
    }

    // a valid username is at least 4 characters long
    const validUsername = (localUser.username === fullUser.username) ? null : (localUser.username.length >= 4) ? "success" : "error";
    // email has to contain @
    const validEmail = (localUser.email === fullUser.email) ? null : (localUser.email.indexOf('@') !== -1) ? "success" : "error";
    // a password is at least 8 characters long
    const validPassword = (diffUser.newPassword === '' || diffUser.newPassword === undefined) ? null : (diffUser.newPassword.length >= 7) ? "success" : "error";
    const validRepPassword = (diffUser.newPassword === '' || diffUser.newPassword === undefined) ? null : (diffUser.confirmPassword === diffUser.newPassword) ? "success" : "error";

    const validForm = (
      validUsername !== 'error' &&
      validEmail !== 'error' &&
      validPassword !== 'error' &&
      validRepPassword !== 'error' &&
      Object.keys(delta).length !== 0 &&
      (
        !fullUser.entity || localUser.entity
      )
    );

    return (
        <Modal show={show} onHide={onClose} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="update-a-user" defaultMessage="Update a user" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs defaultActiveKey={1} id="user-update-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="details" defaultMessage="Details" />}>

                    <Form horizontal style={{paddingTop: 10}}>
                        <FormGroup validationState={validUsername}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="username" defaultMessage="Username" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localUser.username}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {username: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validEmail}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="email" defaultMessage="Email" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localUser.email}
                                    autoComplete="off"
                                    name="new-email"
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {email: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="system" defaultMessage="System" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={localUser.is_system || false}
                                    readOnly={!props.user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {is_system: e.target.checked}}))}/>

                                <HelpBlock><FormattedMessage id="app.user.is_system.label"
                                                             defaultMessage="This is the 'full-access' flag, you can't set it if you don't have it already."/></HelpBlock>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="profile" defaultMessage="Profile" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={localUser.profile_id}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {profile_id: e.target.value && parseInt(e.target.value, 10)}}))}>
                                    <option value={null}>*none*</option>
                                    {
                                        profiles.sort((a, b) => a.id - b.id).map((p, i) => <option key={`profile${i}`} value={p.id}>{p.name}</option>)
                                    }
                                </FormControl>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="ui-profile" defaultMessage="UI Profile" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={localUser.ui_profile}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {ui_profile: e.target.value}}))}>
                                    {
                                        get_ui_profiles(props.user_info.modules).map((p, i) => <option value={p} key={i}>{p}</option>)
                                    }
                                </FormControl>
                                <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                             defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
                                <HelpBlock>
                                    <FormattedMessage id="for-more-information-about-profile-implementation-in-the-right-management-see-" defaultMessage="For more information about profile implementation in the right management see " />
                                    <a href={INTERNAL_HELP_LINKS.profile_rights.url}><FormattedMessage id="here" defaultMessage="here"/></a>
                                </HelpBlock>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="language" defaultMessage="Language" />
                            </Col>

                            <Col sm={2}>
                                <FormControl
                                    componentClass="select"
                                    value={localUser.language}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {language: e.target.value}}))}>
                                    <option value="en">en</option>
                                </FormControl>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="timezone" defaultMessage="Timezone" />
                            </Col>

                            <Col sm={2}>
                                <FormControl
                                    componentClass="select"
                                    value={localUser.timezone}
                                    onChange={(e) => setDiffUser(update(diffUser, {$merge: {timezone: e.target.value}}))}>
                                    <option value="">* local *</option>
                                    {
                                        ["+01:00", "+02:00", "+03:00"].map(t => <option key={t} value={t}>{t}</option>)
                                    }
                                </FormControl>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="properties" defaultMessage="Properties" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Value</th>
                                            <th/>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        localUser.properties && Object.keys(localUser.properties).map(
                                            (p, i) => <tr key={p}>
                                                <td>
                                                    {p}
                                                </td>
                                                <td>
                                                    <input value={localUser.properties[p]} placeholder="value" onChange={e => {
                                                        setDiffUser(update(diffUser, {properties: {$merge: {[p]: e.target.value}}}));
                                                    }} />
                                                </td>
                                                <td><Button onClick={() => {
                                                    let n = {...diffUser};
                                                    if(diffUser.properties === undefined) {
                                                        n = update(diffUser, {properties: {$set: localUser.properties}})
                                                    }
                                                    setDiffUser(update(n, {properties: {$unset: [p]}}))
                                                }}>-</Button></td>
                                            </tr>
                                        )
                                    }
                                    <tr>
                                        <td>
                                            <input value={newProp.key} placeholder="value" onChange={e => setNewProp(update(newProp, {$merge: {key: e.target.value}}))} />
                                        </td>
                                        <td>
                                            <input value={newProp.value} placeholder="value" onChange={e => setNewProp(update(newProp, {$merge: {value: e.target.value}}))} />
                                        </td>
                                        <td>
                                            <Button onClick={() => {
                                                let n = {...diffUser};
                                                if(diffUser.properties === undefined) {
                                                    n = update(diffUser, {properties: {$set: localUser.properties || {}}})
                                                }
                                                setDiffUser(update(n, {properties: {$merge: {[newProp.key]: newProp.value}}}))

                                                setNewProp({key: "", value: ""})
                                            }}>+</Button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="password" defaultMessage="Password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    placeholder="Password"
                                    type="password"
                                    autoComplete="off"
                                    name="new-password"
                                    value={localUser.newPassword || ''}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {newPassword: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validRepPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="confirm-password" defaultMessage="Confirm password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    placeholder="Confirm password"
                                    type="password"
                                    autoComplete="off"
                                    name="confirm-new-password"
                                    value={localUser.confirmPassword || ''}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {confirmPassword: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        { fullUser.entity &&
                            <FormGroup validationState={localUser.entity?null:"error"}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="entity" defaultMessage="Entity"/>
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                      componentClass="input"
                                      name="entity"
                                      value={localUser.entity || ''}
                                      onChange={e => setDiffUser(update(diffUser, {$merge: {entity: e.target.value || null}}))}/>
                                    <Alert bsStyle={"warning"}>
                                        Entity indicates the user is representing an external system. (M2M user)
                                        If the user interact with workflows as "entity", the value must match the entity name in the workflow.
                                        This field is only set at user creation time and a regular user cannot be turned into a M2M user afterwards.
                                    </Alert>
                                </Col>
                            </FormGroup>
                        }
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="token" defaultMessage="Token" />
                            </Col>

                            <Col sm={9}>
                                <FormControl.Static>
                                    {localUser.token}
                                    {" "}
                                    <Button onClick={() => updateUser(user.id, {token: true}, () => loadFullUser(user.id))}>
                                        <Glyphicon glyph={"refresh"}/>
                                    </Button>
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={"error"}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="danger-zone" defaultMessage="Dangerous zone" />
                            </Col>

                            <Col sm={9}>
                                <ButtonToolbar>
                                    {
                                        localUser.status === "REVOKED" ?
                                            <Button onClick={() => revokeUser(user.id, true, onClose)} bsStyle="danger">
                                                <FormattedMessage id="allow" defaultMessage="Allow again"/>
                                            </Button> :
                                            <Button onClick={() => revokeUser(user.id, false, onClose)} bsStyle="danger">
                                                <FormattedMessage id="revoke" defaultMessage="Revoke"/>
                                            </Button>
                                    }
                                </ButtonToolbar>
                                <HelpBlock>
                                    <FormattedMessage id="user-danger-zone-help" defaultMessage="Careful, these options may impact user access definitively!"/>
                                </HelpBlock>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col smOffset={2} sm={10}>
                                <ButtonToolbar>
                                    <Button onClick={() => updateUser(user.id, delta, onClose)} bsStyle="primary" disabled={!validForm}>
                                        <FormattedMessage id="update" defaultMessage="Update" />
                                    </Button>
                                    <Button onClick={onClose}>
                                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                    </Button>
                                </ButtonToolbar>
                            </Col>
                        </FormGroup>
                    </Form>
                    </Tab>
                    <Tab eventKey={2} title={<FormattedMessage id="callbacks" defaultMessage="Callbacks" />}>
                        <CallbackHandler userId={user.id} />
                    </Tab>
                    <Tab eventKey={3} title={<FormattedMessage id="roles" defaultMessage="Roles" />}>
                        <Form horizontal style={{paddingTop: 10}}>
                            <FormGroup>
                                <Col smOffset={1} sm={10}>
                                    {
                                        roles.sort((a, b) => a.name.localeCompare(b.name)).map(r => (
                                            <Checkbox
                                                key={r.id}
                                                onChange={e => {
                                                    e.target.checked?
                                                        assignRole(user.id, r.id, () => setFullUser(update(fullUser, {roles: {$push: [{id: r.id}]}}))):
                                                        deassignRole(user.id, r.id, () => setFullUser(update(fullUser, {roles: {$splice: [[fullUser.roles.findIndex(fur => fur.id === r.id), 1]]}})))
                                                }}
                                                checked={fullUser.roles && fullUser.roles.map(ur => ur.id).includes(r.id)}>
                                                {r.name}
                                                <HelpBlock>{r.description}</HelpBlock>
                                            </Checkbox>
                                        ))
                                    }
                                </Col>
                            </FormGroup>
                        </Form>
                    </Tab>
                    <Tab eventKey={"trusted-locs"} title={<FormattedMessage id="trusted-loc" defaultMessage="Trusted Loc." />}>
                        <TrustedLocationsTable
                          userId={user.id}
                          locations={fullUser.trusted_locs}
                          userInfo={fullUser}
                          onChange={() => loadFullUser(user.id)} />
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    )
}


function NewUser(props) {
    const [user, setUser] = useState({
        username: '',
        email: '',
        is_system: false,
        profile_id: null,
        ui_profile: 'user',
        language: 'en',
        timezone: null,
        groups: [],
        entity: null,
        properties: {},
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [newProp, setNewProp] = useState({key: "", value: ""});
    useEffect(() => {
        props.show && fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfiles(data.profiles))
    }, [props.show]);

    // email has to contain @
    const validEmail = (user.email.length === 0) ? null : (user.email.indexOf('@') !== -1) ? "success" : "error";
    // a password is at least 8 characters long
    const validPassword = user.password === undefined || user.password.length === 0 ? null : (user.password.length >= 7) ? "success" : "error";
    const validRepPassword = user.password === undefined || user.password.length === 0 ? null : confirmPassword === user.password ? "success" : "error";

    const validForm = validEmail === 'success' && ((validPassword === null && validRepPassword === null) || (validPassword === 'success' && validRepPassword === 'success'));

    return (
        <Modal show={props.show} onHide={props.onClose} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="create-a-user" defaultMessage="Create a user" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="username" defaultMessage="Username" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={user.username}
                                onChange={e => setUser(update(user, {$merge: {username: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup validationState={validEmail}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="email" defaultMessage="Email" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                autoComplete="off"
                                name="new-email"
                                value={user.email}
                                onChange={e => setUser(update(user, {$merge: {email: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="system" defaultMessage="System" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={user.is_system}
                                readOnly={!props.user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
                                onChange={e => setUser(update(user, {$merge: {is_system: e.target.checked}}))}/>

                            <HelpBlock><FormattedMessage id="app.user.is_system.label"
                                                         defaultMessage="This is the 'full-access' flag, you can't set it if you don't have it already."/></HelpBlock>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="profile" defaultMessage="Profile" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="select"
                                value={user.profile_id}
                                onChange={e => setUser(update(user, {$merge: {profile_id: e.target.value && parseInt(e.target.value, 10)}}))}>
                                <option value={null}>*none*</option>
                                {
                                    profiles.sort((a, b) => a.id - b.id).map((p, i) => <option key={`profile${i}`} value={p.id}>{p.name}</option>)
                                }
                            </FormControl>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="ui-profile" defaultMessage="UI Profile" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="select"
                                value={user.ui_profile}
                                onChange={e => setUser(update(user, {$merge: {ui_profile: e.target.value}}))}>
                                {
                                    get_ui_profiles(props.user_info.modules).map((p, i) => <option value={p} key={i}>{p}</option>)
                                }
                            </FormControl>
                            <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                         defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
                            <HelpBlock>
                                <FormattedMessage id="for-more-information-about-profile-implementation-in-the-right-management-see-" defaultMessage="For more information about profile implementation in the right management see " />
                                <a href={INTERNAL_HELP_LINKS.profile_rights.url}><FormattedMessage id="here" defaultMessage="here"/></a>
                            </HelpBlock>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="language" defaultMessage="Language" />
                        </Col>

                        <Col sm={2}>
                            <FormControl
                                componentClass="select"
                                value={user.language}
                                onChange={e => setUser(update(user, {$merge: {language: e.target.value}}))}>
                                <option value="en">en</option>
                            </FormControl>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="timezone" defaultMessage="Timezone" />
                        </Col>

                        <Col sm={2}>
                            <FormControl
                                componentClass="select"
                                value={user.timezone}
                                onChange={(e) => setUser(update(user, {$merge: {timezone: e.target.value}}))}>
                                <option value="">* local *</option>
                                {
                                    ["+01:00", "+02:00", "+03:00"].map(t => <option value={t}>{t}</option>)
                                }
                            </FormControl>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="properties" defaultMessage="Properties" />
                        </Col>

                        <Col sm={9}>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Key</th>
                                        <th>Value</th>
                                        <th/>
                                    </tr>
                                </thead>
                                <tbody>
                                {
                                    Object.keys(user.properties).map(
                                        (p, i) => <tr key={p}>
                                            <td>
                                                {p}
                                            </td>
                                            <td>
                                                <input value={user.properties[p]} placeholder="value" onChange={e => {
                                                    setUser(update(user, {properties: {$merge: {[p]: e.target.value}}}));
                                                }} />
                                            </td>
                                            <td><Button onClick={() => {
                                                setUser(update(user, {properties: {$unset: [p]}}))
                                            }}>-</Button></td>
                                        </tr>
                                    )
                                }
                                <tr>
                                    <td>
                                        <input value={newProp.key} placeholder="value" onChange={e => setNewProp(update(newProp, {$merge: {key: e.target.value}}))} />
                                    </td>
                                    <td>
                                        <input value={newProp.value} placeholder="value" onChange={e => setNewProp(update(newProp, {$merge: {value: e.target.value}}))} />
                                    </td>
                                    <td>
                                        <Button onClick={() => {
                                            setUser(update(user, {properties: {$merge: {[newProp.key]: newProp.value}}}))
                                            setNewProp({key: "", value: ""})
                                        }}>+</Button>
                                    </td>
                                </tr>
                                </tbody>
                            </Table>
                        </Col>
                    </FormGroup>
                    <FormGroup validationState={validPassword}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="password" defaultMessage="Password" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                placeholder="Password"
                                type="password"
                                autoComplete="off"
                                name="new-password"
                                value={user.password || ""}
                                onChange={e => setUser(update(user, {$merge: {password: e.target.value || undefined}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup validationState={validRepPassword}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="confirm-password" defaultMessage="Confirm password" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                placeholder="Confirm password"
                                type="password"
                                autoComplete="off"
                                name="confirm-new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="entity" defaultMessage="Entity" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                name="entity"
                                value={user.entity || ""}
                                onChange={e => setUser(update(user, {$merge: {entity: e.target.value || null}}))}/>
                            <Alert bsStyle={"warning"}>
                                Entity indicates the user is representing an external system. (M2M user)
                                If the user interact with workflows as "entity", the value must match the entity name in the workflow.
                                This field is only set at user creation time and a regular user cannot be turned into a M2M user afterwards.
                            </Alert>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => createUser(user, props.onClose)} bsStyle="primary" disabled={!validForm}>
                    <FormattedMessage id="create" defaultMessage="Create" />
                </Button>
                <Button onClick={props.onClose}>
                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                </Button>
            </Modal.Footer>
        </Modal>
    )
}


function DeleteUser(props) {
    return (
        <Modal show={props.show} onHide={props.onClose} backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="confirm" defaultMessage="Confirm" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={props.user.username}/>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => deleteUser(props.user.id, props.onClose)} bsStyle="danger"><FormattedMessage id="delete" defaultMessage="Delete" /></Button>
                <Button onClick={props.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
            </Modal.Footer>
        </Modal>
    )
}


function UserActions(props) {
    const [showUpdate, setShowUpdate] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    return (
        <div>
            <ButtonToolbar>
                <Button onClick={() => setShowUpdate(true)} bsStyle="primary"
                        style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="pencil"/>
                </Button>
                <Button onClick={() => setShowDelete(true)} bsStyle="danger"
                        style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="remove-sign"/>
                </Button>
            </ButtonToolbar>
            <UpdateUser show={showUpdate} onClose={() => {setShowUpdate(false); props.onUserUpdate();}} {...props} />
            <DeleteUser show={showDelete} onClose={() => {setShowDelete(false); props.onUserDelete();}} {...props} />
        </div>
    );
}


export default class SearchUsers extends Search {
    static defaultProps = update(Search.defaultProps, {'$merge': {
        searchUrl: '/api/v01/system/users',
        collectionName: 'users',
        defaultSortingSpec: [{field: 'username', direction: 'asc'}],
    }});

    constructor(props) {
        super(props);
        this.onFilterChange = this.onFilterChange.bind(this);
    }

    onFilterChange(f) {
        this.setState({
            filter_criteria: {'or': [
                {
                    field: 'username',
                    op: 'like',
                    value: `%${f}%`
                },
                {
                    field: 'email',
                    op: 'like',
                    value: `%${f}%`
                }
            ]}
        })
    }

    _filterCriteriaAsSpec(filter_criteria) {
        return filter_criteria;
    }

    componentDidMount() {
      document.title = "Users";
      super.componentDidMount();
    }

  render() {
        const {resources, error, sorting_spec, pagination, filter_criteria, showNew} = this.state;
        const {user_info} = this.props;
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="users" defaultMessage="Users"/></Breadcrumb.Item>
                </Breadcrumb>

                <Panel>
                    <Panel.Body>
                        <ButtonToolbar>
                            <Button bsStyle='primary' onClick={() => this.setState({showNew: true})}>
                                <FormattedMessage id="add-user" defaultMessage="Add user" />
                            </Button>
                            <LinkContainer to={"/system/users/profiles"}>
                                <Button bsStyle='primary'>
                                    <FormattedMessage id="profiles" defaultMessage="Profiles"/>
                                </Button>
                            </LinkContainer>
                            <LinkContainer to={"/system/users/roles"}>
                                <Button bsStyle='primary'>
                                    <FormattedMessage id="roles" defaultMessage="Roles"/>
                                </Button>
                            </LinkContainer>
                            <LinkContainer to={"/system/users/audit"}>
                                <Button bsStyle='danger'>
                                    <FormattedMessage id="audit" defaultMessage="Audit"/>
                                </Button>
                            </LinkContainer>
                        </ButtonToolbar>
                        <NewUser
                            show={showNew}
                            onClose={() => {this._refresh(); this.setState({showNew: false});}}
                            user_info={user_info} />
                    </Panel.Body>
                </Panel>

                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="users" defaultMessage="Users" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        {
                            error &&
                                <Alert bsStyle="danger">
                                    {error.message}
                                </Alert>
                        }
                        <ApioDatatable
                            sorting_spec={sorting_spec}
                            headers={[
                                {title: <FormattedMessage id="username" defaultMessage="Username" />, field: 'username', sortable: true},
                                {title: <FormattedMessage id="email" defaultMessage="Email" />, field: 'email', sortable: true},
                                {title: <FormattedMessage id="language" defaultMessage="Language" />, field: 'language', sortable: true},
                                {
                                    title: '', render: n => (
                                        <UserActions
                                            onUserDelete={() => this._refresh()}
                                            onUserUpdate={() => this._refresh()}
                                            user={n}
                                            {...this.props}
                                        />
                                    )
                                },
                            ]}
                            pagination={pagination}
                            data={resources}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            filter={filter_criteria.or && filter_criteria.or[0].value.replace(/%/g, '')}
                            onFilterChange={this.onFilterChange}
                            onSearch={() => this._refresh()}
                        />
                    </Panel.Body>
                </Panel>
            </>
        )
    }
}
