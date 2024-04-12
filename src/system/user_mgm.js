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
import Row from 'react-bootstrap/lib/Row';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Tab from 'react-bootstrap/lib/Tab';
import Tabs from 'react-bootstrap/lib/Tabs';
import Table from 'react-bootstrap/lib/Table';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import InputGroupButton from 'react-bootstrap/lib/InputGroupButton';
import {Link} from "react-router-dom";

import {FormattedMessage} from 'react-intl';

// import 'font-awesome/css/font-awesome.min.css';
import update from 'immutability-helper';

import {fetch_post, fetch_get, fetch_delete, fetch_put, NotificationsManager, userLocalizeUtcDate} from "../utils";
import {ApioDatatable} from "../utils/datatable";
import { LinkContainer } from 'react-router-bootstrap';
import {Search, StaticControl} from "../utils/common";
import {CallbackHandler} from "./callbacks";
import {get_ui_profiles, modules, localUser as localUserMod} from "../utils/user";
import {TrustedLocationsTable} from "./user_trusted_locs";
import Select from "react-select";
import { deletePasskey, deleteUserPasskey, getWebauthnOptions, isWebauthnAvailable, registerWebauthn } from '../utils/webauthn';
import { DeleteConfirmButton } from '../utils/deleteConfirm';
import moment from 'moment';
import queryString from 'query-string';
import UserLoginAttempts from './user_login_attempts';


// helper functions

function updateLocalUser(data, onSuccess) {
    const updatable_field = k => ['language', 'password', 'old_password', 'timezone', 'two_fa_option'].includes(k);
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
    fetch_put(`/api/v01/system/users/${user_id}/${unblock?'un':''}revoke`, {})
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


function refreshLocalUserApiToken(expDate, onSuccess) {
    var body = {
        token: true,
        token_expiry_date: expDate
    };

    fetch_put(`/api/v01/system/users/local`, body)
      .then(() => {
        NotificationsManager.success(<FormattedMessage id="user-updated" defaultMessage="User updated" />);
        onSuccess && onSuccess();
    })
    .catch(error =>
        NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Update failed" />, error.message)
    )
}

function clearLocalUserApiToken(onSuccess) {
    fetch_put(`/api/v01/system/users/local`, {token: null})
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
    const [currentPassword, setCurrentPassword] = useState('');
    const [onePassword, setOnePassword] = useState('');
    const [fakePassword, _] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [language, setLanguage] = useState(user_info.language);
    const [timezone, setTimezone] = useState(user_info.timezone);
    const [twoFaOption, setTwoFaOption] = useState(user_info.two_fa_option);
    const [showTotpModal, setShowTotpModal] = useState(false);
    const [enableWebAuthn, setEnableWebAuthn] = useState(false);
    const [newPasskey, setNewPasskey] = useState("");

    const delta = {};
    if(onePassword.length !== 0) {
        delta.password = onePassword;
    }
    if(currentPassword.length !== 0) {
        delta.old_password = currentPassword;
    }
    if(language !== user_info.language) {
        delta.language = language;
    }
    if(timezone !== user_info.timezone) {
        delta.timezone = timezone;
    }
    if(twoFaOption !== user_info.two_fa_option) {
        delta.two_fa_option = twoFaOption;
    }
    useEffect(() => {
      fetchLocalUser(setUserInfo);
      document.title = "User";

      isWebauthnAvailable().then(a => a && setEnableWebAuthn(true));
    }, []);
    useEffect(() => {
      setLanguage(user_info.language);
      setTimezone(user_info.timezone);
      setTwoFaOption(user_info.two_fa_option);
    }, [user_info]);
    const validPassword = (onePassword === '')?null:(onePassword.length >= 7)?"success":"error";
    const validRepPassword = (onePassword === '')?null:(confirmPassword === onePassword)?"success":"error";
    const validCurrentPassword = (onePassword === '')?null:currentPassword.length > 0?"success":"error";
    const validTwoFaOption = (delta.two_fa_option === ''?null:delta.two_fa_option === "email" && user_info.email?.length === 0?"error":"success")
    const validForm = validPassword !== 'error' && validRepPassword !== 'error' && validCurrentPassword !== "error" && Object.keys(delta).length !== 0;
    return (
        <Panel>
            <Panel.Heading>
                <Panel.Title><FormattedMessage id="user" defaultMessage="User" /> {user_info.username} </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
                <Tabs defaultActiveKey={1} id="local-user-tabs">
                    <Tab eventKey={1} title={<FormattedMessage id="details" defaultMessage="Details" />}>
                    <Form horizontal style={{paddingTop: 10}}>
                        {
                            user_info.need_password_change &&
                            <Alert bsStyle="danger">
                                <FormattedMessage id="need-change-password" defaultMessage="You need to change your password" />
                            </Alert>
                        }
                        <StaticControl
                                label={<FormattedMessage id='username' defaultMessage='Username' />}
                                value={user_info.username}/>
                        <StaticControl
                                label={<FormattedMessage id='firstname' defaultMessage='First name' />}
                                value={user_info.first_name}/>
                        <StaticControl
                                label={<FormattedMessage id='lastname' defaultMessage='Last name' />}
                                value={user_info.last_name}/>
                        <StaticControl
                                label={<FormattedMessage id='mobilenumber' defaultMessage='Mobile number' />}
                                value={user_info.mobile_number}/>
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
                        <StaticControl label={<FormattedMessage id='profile' defaultMessage='Profile'/>} value={user_info.profile && user_info.profile.name}/>
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
                                    value={timezone || ""}
                                    onChange={(e) => setTimezone(e.target.value)}>
                                    <option value="">* local *</option>
                                    {
                                        ["+01:00", "+02:00", "+03:00"].map(t => <option value={t} key={t}>{t}</option>)
                                    }
                                </FormControl>
                            </Col>
                        </FormGroup>
                        { localUserMod.isModuleEnabled(modules.draas) && <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="administrator-of" defaultMessage="Administrator of" />
                                </Col>

                                <Col sm={2}>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Level</th>
                                                <th>Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {
                                          user_info.admin_of?.map(a => <tr>
                                            <td>{a.level}</td>
                                            <td>{a.reference}</td>
                                          </tr>)
                                        }
                                        </tbody>
                                    </Table>
                                </Col>
                            </FormGroup>
                        }
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
                                <FormattedMessage id="new-password" defaultMessage="New password" />
                            </Col>

                            <Col sm={9}>
                              { /* fakePassword tricks firefox to prevent prefill */ }
                                <FormControl
                                    style={{display: "none"}}
                                    value={fakePassword}
                                    type="password" />
                                <FormControl
                                    componentClass="input"
                                    type="password"
                                    value={onePassword}
                                    onChange={e => setOnePassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validRepPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="repeat-password" defaultMessage="Repeat password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validCurrentPassword}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="current-password" defaultMessage="Current password" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id='m2m-token' defaultMessage='M2M Token' />
                            </Col>

                            <Col sm={9}>
                                <UserToken
                                    value={user_info.token || "* not set *"}
                                    expiryDate={user_info.token_expiry_date}
                                    onClear={() => clearLocalUserApiToken(() => fetchLocalUser(setUserInfo))}
                                    onRefresh={(expDate) => refreshLocalUserApiToken(expDate, () => fetchLocalUser(setUserInfo))} />
                            </Col>
                        </FormGroup>
                        <FormGroup validationState={validTwoFaOption}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="two-fa-option" defaultMessage="2FA option" />
                            </Col>

                            <Col sm={9} lg={2}>
                                <Select
                                    isClearable
                                    placeholder={"not set"}
                                    value={twoFaOption && {label: twoFaOption, value: twoFaOption}}
                                    options={["email", "totp"].map(o => ({label: o, value: o}))}
                                    onChange={v => {
                                        if(v?.value === "totp" && user_info.two_fa_option !== "totp") {
                                            setShowTotpModal(true)
                                        } else {
                                            setTwoFaOption(v?.value || null)
                                        }
                                    }}
                                    />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="passkeys" defaultMessage="Passkeys" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th className='visible-lg'>Object</th>
                                            <th>Registration</th>
                                            <th>Last use</th>
                                            <th/>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        user_info.passkeys?.sort((a, b) => a.id - b.id).map(
                                            r => <tr key={r.id}>
                                                <td>{r.credential_id}</td>
                                                <td>{r.name}</td>
                                                <td className='visible-lg'>
                                                    <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                                                        {JSON.stringify(JSON.parse(r.credential_object), null, 2)}
                                                    </pre>
                                                </td>
                                                <td>{userLocalizeUtcDate(moment.utc(r.created_on), user_info).format()}</td>
                                                <td>{userLocalizeUtcDate(moment.utc(r.last_use), user_info).format()}</td>
                                                <td>
                                                    <DeleteConfirmButton
                                                        resourceName={`passkey ${r.credential_id}`}
                                                        style={{width: '40px'}}
                                                        onConfirm={() => deletePasskey(r.id).then(() => onUserInfoChanged())} />
                                                </td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </Table>
                                <Col sm={12} md={4}>
                                {
                                    user_info.local_user && (
                                    <InputGroup>
                                        <FormControl
                                            type="text"
                                            value={newPasskey}
                                            placeholder="access name"
                                            onChange={e => setNewPasskey(e.target.value)} />
                                        <InputGroupButton>
                                            <Button 
                                                disabled={!enableWebAuthn || newPasskey.length === 0}
                                                onClick={() => {
                                                    getWebauthnOptions().then(o =>
                                                        navigator.credentials.create(o)
                                                    ).then(cred => registerWebauthn(newPasskey, cred))
                                                    .then(() => setNewPasskey(""))
                                                    .then(() => onUserInfoChanged())
                                                    .catch(err => {
                                                        console.error(err);
                                                    });
                                            }}>Register</Button>
                                        </InputGroupButton>
                                    </InputGroup>
                                    )
                                }
                                {
                                    !enableWebAuthn &&
                                    <HelpBlock>Sadly, your browser doesn't support passkeys.</HelpBlock>
                                }
                                </Col>
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
                <Tab eventKey={"login-attempts"} title={<FormattedMessage id="login-attempts" defaultMessage="Login Attempts" />}>
                     <UserLoginAttempts
                        attempts={userInfo.login_attempts} />
                </Tab>
            </Tabs>
            </Panel.Body>
            <TotpRegistrationModal
                show={showTotpModal}
                onHide={r => {
                    r && onUserInfoChanged();
                    setShowTotpModal(false);
                }} />
        </Panel>
    )
}

function fetchTotpKey(onSuccess, onError) {
    return fetch_get('/api/v01/system/users/local/totp')
    .then(r => onSuccess && onSuccess(r))
    .catch(error => onError && onError(error.message))
}

function registerTotp(url, code, hmac) {
    return fetch_put('/api/v01/system/users/local/totp', {code: code, url: url, hmac: hmac})
}

function getSecretFromTotpUrl(url) {
    if(url === undefined || url.length === 0) {
        return ""
    }

    const u = new URL(url)
    return u.searchParams.get("secret")
}

function TotpRegistrationModal({show, onHide}) {
    const [key, setKey] = useState({});
    const [twoFaCode, setTwoFaCode] = useState("");
    const [error, setError] = useState()

    useEffect(() => {
        if(show) {
            fetchTotpKey(setKey);
            setTwoFaCode("");
            setError();
        }
    }, [show]);

    useEffect(() => {
        if(twoFaCode.length === 6) {
            registerTotp(key?.url, twoFaCode, key?.hmac).then(() => {
                NotificationsManager.success("Registration succesful");
                onHide(true);
            }).catch(e => setError(e.message))
        }
    }, [twoFaCode]);

    return (
        <Modal show={show} onHide={() => onHide(false)} bsSize="lg" backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FormattedMessage id="update-a-user" defaultMessage="Register your app" />
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <FormControl.Static>
                        Use a phone app like 1Password, Authy, Google authenticator, or Microsoft Authenticator etc. to get 2FA codes when prompted during sign-in.
                    </FormControl.Static>
                    <FormControl.Static>
                        <b>Scan the QR code</b>
                        <p>Use the authenticator app from your phone to scan. If you are unable to scan, enter {getSecretFromTotpUrl(key?.url)} instead.</p>
                    </FormControl.Static>
                    <FormControl.Static>
                        <img src={ "data:image/png;base64,"+key?.img }></img>
                    </FormControl.Static>
                    <FormControl.Static>
                        Complete your registration, enter your 2FA code:
                    </FormControl.Static>
                    <FormGroup>
                        {
                        error && <Alert bsStyle="danger">{error}</Alert>
                        }
                        <FormControl
                            componentClass="input"
                            value={twoFaCode}
                            onChange={e => setTwoFaCode(e.target.value)}
                            placeholder="your 2FA code" />
                    </FormGroup>
                    <FormGroup>
                        <Button onClick={() => onHide(false)}>Cancel</Button>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

const DefaultExpiryDays = 7;

function UserToken({value, expiryDate, onRefresh, onClear}) {
    const [showRefreshModal, setShowRefreshModal] = useState(false);
    const [newExpiryDate, setNewExpiryDate] = useState();

    useEffect(() => {
        if(showRefreshModal) {
            const exp = new Date();
            exp.setDate(exp.getDate() + DefaultExpiryDays);
            setNewExpiryDate(exp.toISOString().split('T')[0]);
        }
    }, [showRefreshModal]);

    let expired = false;
    if(expiryDate) {
        expiryDate = new Date(expiryDate).toISOString().split('T')[0];
        expired = new Date(expiryDate) < new Date();
    }

    return (
        <>
            <UserTokenInput value={value} onRefresh={() => setShowRefreshModal(true)} onClear={onClear} />
                <HelpBlock>
                    <i>
                    {
                    expiryDate && !expired ?
                        <><FormattedMessage id="expires-on" defaultMessage="Expires on" /> {expiryDate}</> :
                        !expired && <FormattedMessage id="no-expiry-date" defaultMessage="No expiry date" />
                    }
                    {
                        expired && <Alert bsStyle="warning"><FormattedMessage id="expired" defaultMessage="Expired since" /> {expiryDate}</Alert>
                    }
                    </i>
                </HelpBlock>

            <Modal show={showRefreshModal} onHide={() => setShowRefreshModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="refresh-token" defaultMessage="Refresh token" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        {/* propose to set an expiry date optionally */}
                        <FormGroup as={Row}>
                            <Col smOffset={2} sm={9}>
                                <Checkbox
                                    checked={newExpiryDate !== ""}
                                    onChange={e => {
                                        if(e.target.checked) {
                                            const exp = new Date();
                                            exp.setDate(exp.getDate() + DefaultExpiryDays);
                                            return setNewExpiryDate(exp.toISOString().split('T')[0]);
                                        }
                                        return setNewExpiryDate("");
                                    }}>
                                    <FormattedMessage id="set-expiry-date" defaultMessage="Set an expiry date" />
                                </Checkbox>
                                <FormControl
                                    componentClass="input"
                                    value={newExpiryDate}
                                    onChange={e => setNewExpiryDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    type="date" />
                            </Col>
                        </FormGroup>
                        <FormGroup as={Row}>
                            <Col smOffset={2} sm={9}>
                                {
                                    newExpiryDate === "" && <Alert bsStyle="warning">
                                        <FormattedMessage id="no-expiry-date-warning" defaultMessage="The token will never expire." />
                                    </Alert>
                                }
                            </Col>
                        </FormGroup>
                        <FormGroup as={Row}>
                            <Col smOffset={2} sm={9}>
                                <Button bsStyle="primary" onClick={() => {
                                    setShowRefreshModal(false);
                                    onRefresh(newExpiryDate === "" ? null : newExpiryDate+"T00:00:00Z");
                                }}>
                                    <FormattedMessage id="refresh" defaultMessage="Refresh" />
                                </Button>
                                {" "}
                                <Button onClick={() => setShowRefreshModal(false)}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

function UserTokenInput({value, onRefresh, onClear}) {
  const [copied, setCopied] = useState(false);
  if(value === true) {
    value = "* generated *"
  } else if (value === false) {
    value = "* not set *"
  }

  const canCopy = value?.length > 20;
  const canClear = value !== "* not set *";

  return (
      <FormControl.Static>
          {value}
          {" "}
          {
              canCopy && <Button onClick={() => {
                  navigator.clipboard.writeText(value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
              }}>
                  {
                      copied ?
                        <Glyphicon glyph={"ok"} style={{color: "green"}}/> :
                        <Glyphicon glyph={"copy"}/>
                  }
              </Button>
          }
          {" "}
          <Button onClick={() => onRefresh()}>
              <Glyphicon glyph={"refresh"}/>
          </Button>
          {" "}
          {
            canClear && <Button onClick={() => onClear()}>
                <Glyphicon glyph={"ban-circle"}/>
            </Button>
          }
      </FormControl.Static>
  )
}


function UpdateUser({show, user, onClose, user_info}) {
    const [fullUser, setFullUser] = useState({});
    const [diffUser, setDiffUser] = useState({});
    const [profiles, setProfiles] = useState([]);
    const [roles, setRoles] = useState([]);
    const [newProp, setNewProp] = useState({key: "", value: ""});
    // specific to DRAAS
    const [newAdmin, setNewAdmin] = useState({level: "", reference: ""});
    const [alertPasswordDisabled, setAlertPasswordDisabled] = useState(false);

    useEffect(() => {
        if(diffUser.password_disabled) {
            setAlertPasswordDisabled(true);
        }
    }, [diffUser.password_disabled]);

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

                    { !fullUser.local_user &&
                      <Alert bsStyle="warning">
                        <FormattedMessage id="non-local-user-warning" defaultMessage="This user is not managed locally. Any change should be applied in its host platform." />
                      </Alert>
                    }

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
                                <FormattedMessage id="firstname" defaultMessage="First name" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localUser.first_name}
                                    autoComplete="off"
                                    name="firstname"
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {first_name: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="lastname" defaultMessage="Last name" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localUser.last_name}
                                    autoComplete="off"
                                    name="lastname"
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {last_name: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="mobile number" defaultMessage="Mobile number" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="input"
                                    value={localUser.mobile_number}
                                    autoComplete="off"
                                    name="mobilenumber"
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {mobile_number: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="system" defaultMessage="System" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={localUser.is_system || false}
                                    readOnly={!user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
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
                                        get_ui_profiles(user_info.modules).map((p, i) => <option value={p} key={i}>{p}</option>)
                                    }
                                </FormControl>
                                <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                             defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
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
                      { localUserMod.isModuleEnabled(modules.draas) &&
                          <FormGroup>
                              <Col componentClass={ControlLabel} sm={2}>
                                  <FormattedMessage id="administrator-of" defaultMessage="Administrator of" />
                              </Col>

                              <Col sm={9}>
                                  <Table>
                                      <thead>
                                          <tr>
                                              <th>Level</th>
                                              <th>Reference</th>
                                              <th/>
                                          </tr>
                                      </thead>
                                      <tbody>
                                        {
                                          localUser.admin_of && localUser.admin_of.map((a, i) =>
                                            <tr>
                                              <td>{a.level}</td>
                                              <td>{a.reference}</td>
                                              <td>
                                                <Button onClick={() => {
                                                  let n = {...diffUser};
                                                  if(diffUser.admin_of === undefined) {
                                                      n = update(diffUser, {admin_of: {$set: localUser.admin_of}})
                                                  }
                                                  setDiffUser(update(n, {admin_of: {$splice: [[i, 1]]}}))
                                                }}>-</Button>
                                              </td>
                                            </tr>
                                          )
                                        }
                                        <tr>
                                            <td>
                                                <Select
                                                  value={{value: newAdmin.level, label: newAdmin.level}}
                                                  options={["system", "group", "distributor", "reseller", "tenant"].map(r => ({value: r, label: r}))}
                                                  onChange={v => setNewAdmin(update(newAdmin, {$merge: {level: v.value}}))}
                                                  />
                                            </td>
                                            <td>
                                                <FormControl
                                                  componentClass="input"
                                                  value={newAdmin.reference}
                                                  onChange={e => setNewAdmin(update(newAdmin, {$merge: {reference: e.target.value}}))}/>
                                            </td>
                                            <td>
                                                <Button onClick={() => {
                                                    let n = {...diffUser};
                                                    if(diffUser.admin_of === undefined) {
                                                        n = update(diffUser, {admin_of: {$set: localUser.admin_of}})
                                                    }
                                                    setDiffUser(update(n, {admin_of: {$push: [newAdmin]}}))

                                                    setNewAdmin({level: "", reference: ""})
                                                }}>+</Button>
                                            </td>
                                        </tr>
                                      </tbody>
                                  </Table>
                              </Col>
                          </FormGroup>
                        }
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
                                                    <FormControl
                                                        componentClass="input"
                                                        value={localUser.properties[p]}
                                                        placeholder="value"
                                                        onChange={e => setDiffUser(update(diffUser, {properties: {$merge: {[p]: e.target.value}}}))}/>
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
                                            <FormControl
                                              componentClass="input"
                                              value={newProp.key}
                                              placeholder="key"
                                              onChange={e => setNewProp(update(newProp, {$merge: {key: e.target.value}}))}/>
                                        </td>
                                        <td>
                                            <FormControl
                                              componentClass="input"
                                              value={newProp.value}
                                              placeholder="value"
                                              onChange={e => setNewProp(update(newProp, {$merge: {value: e.target.value}}))}/>
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
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="password-disabled" defaultMessage="Password disabled" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={localUser.password_disabled}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {password_disabled: e.target.checked}}))}
                                    disabled={!localUser.local_user}/>
                                <HelpBlock>
                                    <FormattedMessage id="password-disabled-label" defaultMessage="This flag prevent a local user using the login API."/>
                                </HelpBlock>
                                {
                                    diffUser.password_disabled === false && <Alert bsStyle="warning">
                                        <FormattedMessage id="password-disabled-help" defaultMessage="A password need to be set to enable it again."/>
                                    </Alert>
                                }
                            </Col>

                            <Modal show={alertPasswordDisabled} onHide={() => setAlertPasswordDisabled(false)}>
                                <Modal.Header closeButton>
                                    <Modal.Title><FormattedMessage id="password-disabled" defaultMessage="Password disabled" /></Modal.Title>
                                </Modal.Header>

                                <Modal.Body>
                                    <Alert bsStyle="warning">
                                        <FormattedMessage id="password-disabled-help" defaultMessage="The user will not be able to login anymore."/>
                                    </Alert>
                                </Modal.Body>

                                <Modal.Footer>
                                    <Button onClick={() => setAlertPasswordDisabled(false)}>
                                        <FormattedMessage id="close" defaultMessage="Close" />
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="force-change-password" defaultMessage="Force change password" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={localUser.need_password_change || false}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {need_password_change: e.target.checked}}))}
                                    disabled={!localUser.local_user}/>
                                <HelpBlock>
                                    <FormattedMessage id="need-change-password-label" defaultMessage="This flag forces the user to change its password at next login."/>
                                </HelpBlock>
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
                                    disabled={!fullUser.local_user || localUser.password_disabled}
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
                                    disabled={!fullUser.local_user || localUser.password_disabled}
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
                                    <UserToken
                                      value={localUser.token}
                                      expiryDate={localUser.token_expiry_date}
                                      onClear={() => updateUser(user.id, {token: null, token_expiry_date: null}, () => loadFullUser(user.id))}
                                      onRefresh={(expDate) => updateUser(user.id, {token: true, token_expiry_date: expDate}, () => loadFullUser(user.id))} />
                                </FormControl.Static>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="passkeys" defaultMessage="Passkeys" />
                            </Col>

                            <Col sm={9}>
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Registration</th>
                                            <th>Last use</th>
                                            <th/>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        localUser.passkeys?.sort((a, b) => a.id - b.id).map(
                                            r => <tr key={r.id}>
                                                <td>{r.credential_id}</td>
                                                <td>{r.name}</td>
                                                <td>{userLocalizeUtcDate(moment.utc(r.created_on), localUser).format()}</td>
                                                <td>{userLocalizeUtcDate(moment.utc(r.last_use), localUser).format()}</td>
                                                <td>
                                                    <DeleteConfirmButton
                                                        resourceName={`passkey ${r.credential_id} of user ${user.username}`}
                                                        style={{width: '40px'}}
                                                        onConfirm={() => deleteUserPasskey(user.id, r.id).then(() => onClose())} />
                                                </td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </Table>
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
                    <Tab eventKey={"login-attempts"} title={<FormattedMessage id="login-attempts" defaultMessage="Login Attempts" />}>
                        <UserLoginAttempts
                            attempts={fullUser.login_attempts} />
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    )
}


function NewUser({user_info, show, onClose}) {
    const [user, setUser] = useState({
        username: '',
        first_name: '',
        last_name: '',
        mobile_number: '',
        email: '',
        is_system: false,
        profile_id: null,
        ui_profile: 'user',
        language: 'en',
        timezone: null,
        groups: [],
        entity: null,
        properties: {},
        need_password_change: false,
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [newProp, setNewProp] = useState({key: "", value: ""});
    useEffect(() => {
        show && fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfiles(data.profiles))
    }, [show]);

    // email has to contain @
    const validEmail = (user.email.length === 0) ? null : (user.email.indexOf('@') !== -1) ? "success" : "error";
    // a password is at least 8 characters long
    const validPassword = user.password === undefined || user.password.length === 0 ? null : (user.password.length >= 7) ? "success" : "error";
    const validRepPassword = user.password === undefined || user.password.length === 0 ? null : confirmPassword === user.password ? "success" : "error";

    const validForm = validEmail === 'success' && (user.password_disabled || (validPassword === null && validRepPassword === null) || (validPassword === 'success' && validRepPassword === 'success'));

    return (
        <Modal show={show} onHide={onClose} backdrop={false} bsSize="large">
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
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="firstname" defaultMessage="First name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={user.first_name}
                                autoComplete="off"
                                name="firstname"
                                onChange={e => setUser(update(user, {$merge: {first_name: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="lastname" defaultMessage="Last name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={user.last_name}
                                autoComplete="off"
                                name="lastname"
                                onChange={e => setUser(update(user, {$merge: {last_name: e.target.value}}))}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="mobile number" defaultMessage="Mobile number" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={user.mobile_number}
                                autoComplete="off"
                                name="mobilenumber"
                                onChange={e => setUser(update(user, {$merge: {mobile_number: e.target.value}}))}/>
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
                                readOnly={!user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
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
                                    get_ui_profiles(user_info.modules).map((p, i) => <option value={p} key={i}>{p}</option>)
                                }
                            </FormControl>
                            <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                         defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
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
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="password-disabled" defaultMessage="Password disabled" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={user.password_disabled || false}
                                onChange={e => setUser(update(user, {$merge: {password_disabled: e.target.checked}}))}/>
                            <HelpBlock>
                                <FormattedMessage id="password-disabled-label" defaultMessage="This flag prevent a local user using the login API."/>
                            </HelpBlock>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="force-change-password" defaultMessage="Force change password" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={user.need_password_change || false}
                                disabled={user.password_disabled}
                                onChange={e => setUser(update(user, {$merge: {need_password_change: e.target.checked}}))}/>
                            <HelpBlock>
                                <FormattedMessage id="need-change-password-label" defaultMessage="This flag forces the user to change its password at next login."/>
                            </HelpBlock>
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
                                disabled={user.password_disabled}
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
                                disabled={user.password_disabled}
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
                <Button onClick={() => createUser(user, onClose)} bsStyle="primary" disabled={!validForm}>
                    <FormattedMessage id="create" defaultMessage="Create" />
                </Button>
                <Button onClick={onClose}>
                    <FormattedMessage id="cancel" defaultMessage="Cancel" />
                </Button>
            </Modal.Footer>
        </Modal>
    )
}


function DeleteUser({show, onClose, user}) {
    return (
        <Modal show={show} onHide={onClose} backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="confirm" defaultMessage="Confirm" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={user.username}/>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => deleteUser(user.id, onClose)} bsStyle="danger"><FormattedMessage id="delete" defaultMessage="Delete" /></Button>
                <Button onClick={onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
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
                <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify({'owner': {model: 'instances', value: props.user.username, op: 'eq'}})
                    })
                  }} role="button">
                    <Button bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                        <Glyphicon glyph="send"/>
                    </Button>
                </Link>
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
                                {title: <FormattedMessage id="firstname" defaultMessage="First name" />, field: 'first_name', sortable: true},
                                {title: <FormattedMessage id="lastname" defaultMessage="Last name" />, field: 'last_name', sortable: true},
                                {title: <FormattedMessage id="email" defaultMessage="Email" />, field: 'email', sortable: true},
                                {title: <FormattedMessage id="status" defaultMessage="Status" />, field: 'status', sortable: true},
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
