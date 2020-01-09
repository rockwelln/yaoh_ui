import React, { Component, useState, useEffect } from 'react';

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

import {FormattedMessage} from 'react-intl';

import 'font-awesome/css/font-awesome.min.css';
import update from 'immutability-helper';

import {fetch_post, fetch_get, fetch_delete, fetch_put, NotificationsManager} from "../utils";
import {ApioDatatable} from "../utils/datatable";
import { LinkContainer } from 'react-router-bootstrap';
import {INTERNAL_HELP_LINKS} from "../async-apio-help";
import {Search, StaticControl} from "../utils/common";
import {CallbackHandler} from "./callbacks";


// helper functions

function updateLocalUser(data, onSuccess) {
    const updatable_field = k => ['language', 'password'].includes(k);
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


// React components

export function LocalUserProfile(props) {
    const {user_info} = props;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileName, setProfileName] = useState('');
    const [language, setLanguage] = useState(user_info.language);

    const delta = {};
    if(newPassword.length !== 0) {
        delta.password = newPassword;
    }
    if(language !== user_info.language) {
        delta.language = language;
    }
    useEffect(() => {
        fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfileName(data.profiles.find(p => p.id === user_info.profile_id).name))
    }, [user_info.profile_id]);
    const validPassword = (newPassword === '')?null:(newPassword.length >= 7)?"success":"error";
    const validRepPassword = (newPassword === '')?null:(confirmPassword === newPassword)?"success":"error";
    const validForm = validPassword !== 'error' && validRepPassword !== 'error' && Object.keys(delta).length !== 0;

    return (
        <Panel>
            <Panel.Heading>
                <Panel.Title><FormattedMessage id="user-profile" defaultMessage="User Profile" /> {user_info.username} </Panel.Title>
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
                                    <option value="fr">fr</option>
                                    <option value="nl">nl</option>
                                    <option value="en">en</option>
                                </FormControl>
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
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col smOffset={2} sm={9}>
                                <Button bsStyle="primary" onClick={() => updateLocalUser(delta, props.onUserInfoChanged)} disabled={!validForm}>
                                    <FormattedMessage id="save" defaultMessage="Save" />
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                 </Tab>
                 <Tab eventKey={2} title={<FormattedMessage id="callbacks" defaultMessage="Callbacks" />}>
                     <CallbackHandler userId={user_info.id} />
                 </Tab>
             </Tabs>
            </Panel.Body>
        </Panel>
    )
}


function UpdateUser(props) {
    const [user, setUser] = useState({});
    const [diffUser, setDiffUser] = useState({});
    const [profiles, setProfiles] = useState([]);
    useEffect(() => {
        props.show && fetch_get(`/api/v01/system/users/${props.user.id}`)
            .then(user => setUser(user))
            .catch(console.error)
    }, [props.user.id, props.show]);
    useEffect(() => {
        props.show && fetch_get("/api/v01/system/user_profiles")
            .then(data => setProfiles(data.profiles))
    }, [props.show]);
    const localUser = update(user, {$merge: diffUser});
    const delta = {...diffUser};
    if(delta.newPassword) {
        delta.password = delta.newPassword;
        delete delta.newPassword;
        delete delta.confirmPassword;
    }
    const onClose = () => props.onClose && props.onClose();

    // a valid username is at least 4 characters long
    const validUsername = (localUser.username === user.username) ? null : (localUser.username.length >= 4) ? "success" : "error";
    // email has to contain @
    const validEmail = (localUser.email === user.email) ? null : (localUser.email.indexOf('@') !== -1) ? "success" : "error";
    // a password is at least 8 characters long
    const validPassword = (diffUser.newPassword === '' || diffUser.newPassword === undefined) ? null : (diffUser.newPassword.length >= 7) ? "success" : "error";
    const validRepPassword = (diffUser.confirmPassword === '' || diffUser.newPassword === undefined) ? null : (diffUser.confirmPassword === diffUser.newPassword) ? "success" : "error";

    const validForm = validUsername !== 'error' && validEmail !== 'error' && validPassword !== 'error' && validRepPassword !== 'error' && Object.keys(diffUser).length !== 0;

    return (
        <Modal show={props.show} onHide={onClose} backdrop={false} bsSize="large">
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
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                    <option value="provisioning">Provisioning</option>
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
                                    <option value="fr">fr</option>
                                    <option value="nl">nl</option>
                                    <option value="en">en</option>
                                </FormControl>
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
                                    value={localUser.confirmPassword || ''}
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {confirmPassword: e.target.value}}))}/>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="token-expiry" defaultMessage="Token expiry" />
                            </Col>

                            <Col sm={9}>
                                <Checkbox
                                    checked={localUser.token_expiry || false}
                                    readOnly={!props.user_info.is_system} // only "system" user may change it.
                                    onChange={e => setDiffUser(update(diffUser, {$merge: {token_expiry: e.target.checked}}))}/>
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
                                            <Button onClick={() => revokeUser(props.user.id, true, onClose)} bsStyle="danger">
                                                <FormattedMessage id="allow" defaultMessage="Allow again"/>
                                            </Button> :
                                            <Button onClick={() => revokeUser(props.user.id, false, onClose)} bsStyle="danger">
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
                                    <Button onClick={() => updateUser(user.user_id, delta, onClose)} bsStyle="primary" disabled={!validForm}>
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
                        <CallbackHandler userId={props.user.id} />
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    )
}


class NewUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: NewUser._emptyUser(),
            show: false
        };
        this.onClose = this.onClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    static _emptyUser() {
        return {
            username: '',
            email: '',
            is_system: false,
            ui_profile: 'user',
            language: 'en',
            groups: [],
            password: '',
            repeated_password: '',
            token_expiry: true,
        }
    }

    onClose() {
        this.setState({show: false, user: NewUser._emptyUser(), creating: false});
        this.props.onClose && this.props.onClose();
    }

    onSubmit() {
        const {user} = this.state;
        let user_data = Object.assign({}, user);
        delete user_data.repeated_password;
        if(user_data.password.length===0) {
            delete user_data.password;
        }
        this.setState({creating: true});

        fetch_post('/api/v01/system/users', user_data, this.props.auth_token)
            .then(this.onClose)
            .catch(error => this.setState({error: error, creating: false}))
    }

    render() {
        const {user, show, error} = this.state;

        // email has to contain @
        const validEmail = (user.email.length === 0) ? null : (user.email.indexOf('@') !== -1) ? "success" : "error";
        // a password is at least 8 characters long
        const validPassword = user.password.length === 0 ? null : (user.password.length >= 8) ? "success" : "error";
        const validRepPassword = user.password.length === 0 ? null : user.repeated_password === user.password ? "success" : "error";

        const validForm = !this.state.creating && validEmail === 'success' && ((validPassword === null && validRepPassword === null) || (validPassword === 'success' && validRepPassword === 'success'));

        error && setTimeout(() => this.setState({error: false}), 2000);

        return (
            <div>
                <Button bsStyle='primary' onClick={() => this.setState({show: true})}>
                    <FormattedMessage id="add-user" defaultMessage="Add user" />
                </Button>
                <Modal show={show} onHide={this.onClose} backdrop={false} bsSize="large">
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="create-a-user" defaultMessage="Create a user" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            error &&
                                <Alert bsStyle="danger">
                                    <FormattedMessage id="fail-to-create-the-user" defaultMessage="Fail to create the user" /><br/>{error.message}
                                </Alert>
                        }
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="username" defaultMessage="Username" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={user.username}
                                        onChange={e => this.setState({user: update(user, {$merge: {username: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup validationState={validEmail}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="email" defaultMessage="Email" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={user.email}
                                        onChange={e => this.setState({user: update(user, {$merge: {email: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="system" defaultMessage="System" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={user.is_system}
                                        readOnly={!this.props.user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
                                        onChange={e => this.setState({user: update(user, {$merge: {is_system: e.target.checked}})})}/>

                                    <HelpBlock><FormattedMessage id="app.user.is_system.label"
                                                                 defaultMessage="This is the 'full-access' flag, you can't set it if you don't have it already."/></HelpBlock>
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
                                        onChange={e => this.setState({user: update(user, {$merge: {ui_profile: e.target.value}})})}>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                        <option value="provisioning">Provisioning</option>
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
                                        onChange={e => this.setState({user: update(user, {$merge: {language: e.target.value}})})}>
                                        <option value="fr">fr</option>
                                        <option value="nl">nl</option>
                                        <option value="en">en</option>
                                    </FormControl>
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
                                        value={user.password}
                                        onChange={e => this.setState({user: update(user, {$merge: {password: e.target.value}})})}/>
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
                                        value={user.repeated_password}
                                        onChange={e => this.setState({user: update(user, {$merge: {repeated_password: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="token-expiry" defaultMessage="Token expiry" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={user.token_expiry || false}
                                        readOnly={!this.props.user_info.is_system} // only "system" user may change it.
                                        onChange={e => this.setState({diff_user: update(user, {$merge: {token_expiry: e.target.checked}})})}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onSubmit} bsStyle="primary" disabled={!validForm}>
                            <FormattedMessage id="create" defaultMessage="Create" />
                        </Button>
                        <Button onClick={this.onClose}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
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
                <Button onClick={() => deleteUser(props.user.user_id, props.onClose)} bsStyle="danger"><FormattedMessage id="delete" defaultMessage="Delete" /></Button>
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

    render() {
        const {resources, error, sorting_spec, pagination, filter_criteria} = this.state;
        const {user_info, auth_token} = this.props;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="users" defaultMessage="Users"/></Breadcrumb.Item>
                </Breadcrumb>
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

                <Panel>
                    <Panel.Body>
                        <ButtonToolbar>
                            <NewUser
                                onClose={() => this._refresh()}
                                user_info={user_info}
                                auth_token={auth_token} />
                            <LinkContainer to={"/system/users/profiles"}>
                                <Button bsStyle='primary'>
                                    <FormattedMessage id="profiles" defaultMessage="Profiles"/>
                                </Button>
                            </LinkContainer>
                            <LinkContainer to={"/system/users/audit"}>
                                <Button bsStyle='danger'>
                                    <FormattedMessage id="audit" defaultMessage="Audit"/>
                                </Button>
                            </LinkContainer>
                        </ButtonToolbar>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
