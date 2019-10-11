import React, { Component } from 'react';

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

import {fetch_post, fetch_get, fetch_delete, fetch_put} from "../utils";
import {ApioDatatable} from "../utils/datatable";
import { LinkContainer } from 'react-router-bootstrap';
import {INTERNAL_HELP_LINKS} from "../async-apio-help";
import {Search, StaticControl} from "../utils/common";
import {CallbackHandler} from "./callbacks";

import PropTypes from 'prop-types';


export class LocalUserProfile extends Component {
    static updatable_field = k => ['language', 'password'].includes(k);

    static propTypes = {
        user_info: PropTypes.shape(
            {
                id: PropTypes.number.isRequired,
                language: PropTypes.string,
                username: PropTypes.string,
                email: PropTypes.string,
                is_system: PropTypes.bool
            }
        ).isRequired,
        auth_token: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = Object.assign(
            {password: '', repeated_password: '', error: undefined, success: undefined},
            this.props.user_info
        );
        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit() {
        let data = Object.assign({}, this.state);
        if(this.state.password === '') {
            delete data.password;
            delete data.repeated_password;
        }

        this.setState({error: undefined, success: undefined});
        fetch_put(
            '/api/v01/system/users/local',
            Object.keys(data).filter(LocalUserProfile.updatable_field).reduce(
                (obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {}
            ),
            this.props.auth_token
        )
        .then(() => {
            this.setState({
                success: <FormattedMessage id="user-updated" defaultMessage="User updated" />
            });
            // delay the trigger to let the alert being shown (before full redraw)
            setTimeout(this.props.onUserInfoChanged, 1000);
        })
        .catch((error) => {
            console.log('request failed', error);
            this.setState({
                error: <div>
                    <FormattedMessage id="request-failed" defaultMessage="Request failed" /><br/>
                    {error.message}
                </div>
            })
        })
    }

    render() {
        const {password, repeated_password, error, username, success, email, is_system, ui_profile, groups, registered_on, language, local_user} = this.state;
        const {user_info} = this.props;
        const validPassword = (password === '')?null:(password.length >= 8)?"success":"error";
        const validRepPassword = (password === '')?null:(repeated_password === password)?"success":"error";
        const validForm = validPassword !== 'error' && validRepPassword !== 'error';

        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="user-profile" defaultMessage="User Profile" /> {username} </Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                {error !== undefined ? <Alert bsStyle="danger">{error}</Alert>:
                 success !== undefined ? <Alert bsStyle="success">{success}</Alert> :''}
                 <Tabs defaultActiveKey={1} id="local-user-tabs">
                     <Tab eventKey={1} title={<FormattedMessage id="details" defaultMessage="Details" />}>
                        <Form horizontal style={{paddingTop: 10}}>
                            <StaticControl
                                    label={<FormattedMessage id='username' defaultMessage='Username' />}
                                    value={username}/>
                            <StaticControl
                                    label={<FormattedMessage id='email' defaultMessage='Email' />}
                                    value={email}/>
                            <StaticControl
                                    label={<FormattedMessage id='system' defaultMessage='System' />}
                                    value={
                                        is_system?
                                            <FormattedMessage id="yes" defaultMessage="Yes" />:
                                            <FormattedMessage id="no" defaultMessage="No" />
                                    }/>
                            <StaticControl label={<FormattedMessage id='ui-profile' defaultMessage='UI Profile'/>} value={ui_profile}/>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="groups" defaultMessage="Groups" />
                                </Col>

                                <Col sm={9}>
                                    {
                                        groups.map(g => (
                                            <FormControl.Static key={g.name}>
                                                {g.name}
                                                <FormattedMessage id="as" defaultMessage=" as " />
                                                {g.level}
                                            </FormControl.Static>
                                        ))
                                    }
                                </Col>
                            </FormGroup>
                            <StaticControl label={<FormattedMessage id='registered-on' defaultMessage='Registered on'/>} value={registered_on}/>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="language" defaultMessage="Language" />
                                </Col>

                                <Col sm={2}>
                                    <FormControl
                                        componentClass="select"
                                        value={language}
                                        onChange={(e) => this.setState({language: e.target.value})}>
                                        <option value="fr">fr</option>
                                        <option value="nl">nl</option>
                                        <option value="en">en</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            { local_user && (
                                <FormGroup validationState={validPassword}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="password" defaultMessage="Password" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            placeholder="Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => this.setState({password: e.target.value})} />
                                    </Col>
                                </FormGroup>
                            )}
                            { local_user && (
                                <FormGroup validationState={validRepPassword}>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        <FormattedMessage id="repeat-password" defaultMessage="Repeat password" />
                                    </Col>

                                    <Col sm={9}>
                                        <FormControl
                                            componentClass="input"
                                            placeholder="Repeat password"
                                            type="password"
                                            value={repeated_password}
                                            onChange={(e) => this.setState({repeated_password: e.target.value})} />
                                    </Col>
                                </FormGroup>
                            )}
                            <FormGroup>
                                <Col smOffset={2} sm={9}>
                                    <Button bsStyle="primary" onClick={this.onSubmit} disabled={!validForm}>
                                        <FormattedMessage id="save" defaultMessage="Save" />
                                    </Button>
                                </Col>
                            </FormGroup>
                        </Form>
                     </Tab>
                     <Tab eventKey={2} title={<FormattedMessage id="callbacks" defaultMessage="Callbacks" />}>
                         {this.props.notifications && <CallbackHandler userId={user_info.id} {...this.props} />}
                     </Tab>
                 </Tabs>
                </Panel.Body>
            </Panel>
        )
    }
}


class UpdateUser extends Component {
    static propTypes = {
        onClose: PropTypes.func,
        auth_token: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {diff_user: {}, user: null, show: false};
        this.onClose = this.onClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this._fetchUserDetails = this._fetchUserDetails.bind(this);
        this._updateModal = this._updateModal.bind(this);
    }

    onClose() {
        this.setState({show: false, diff_user: {}, user: null});
        this.props.onClose && this.props.onClose();
    }

    onSubmit() {
        const {diff_user} = this.state;
        const {user, auth_token} = this.props;
        fetch_put(`/api/v01/system/users/${user.id}`, diff_user, auth_token)
            .then(() => {
                !this.cancelLoad && this.onClose();
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="user-updated" defaultMessage="User saved!" />,
                    level: 'success'
                });
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="user-update-failed" defaultMessage="User update failed!" />,
                message: error.message,
                level: 'error'
            }))
    }

    onRevoke(unblock) {
        const {user, auth_token} = this.props;
        fetch_put(`/api/v01/auth/${user.id}/${unblock?'un':''}revoke`, {}, auth_token)
        .then(() => {
            !this.cancelLoad && this.onClose();
            this.props.notifications.addNotification({
                message: <FormattedMessage id="user-updated" defaultMessage="User saved!" />,
                level: 'success'
            });
        })
        .catch(error => this.props.notifications.addNotification({
            title: <FormattedMessage id="user-revoke-failed" defaultMessage="User access update failed!" />,
            message: error.message,
            level: 'error'
        }))
    }

    _fetchUserDetails() {
        const {user, auth_token} = this.props;
        fetch_get(`/api/v01/system/users/${user.id}`, auth_token)
            .then(user => !this.cancelLoad && this.setState({user: user, diff_user: {}}))
            .catch(console.error)
    }

    componentWillUpdate(nextProps, nextState) {
        if(nextState.show === true && this.state.show === false) {
            this._fetchUserDetails();
        }
    }

    _updateModal() {
        const {diff_user, user} = this.state;
        if(user === null) return null;

        const user_ = update(user, {$merge: diff_user});

        // a valid username is at least 4 characters long
        const validUsername = (user_.username === user.username) ? null : (user_.username.length >= 4) ? "success" : "error";
        // email has to contain @
        const validEmail = (user_.email === user.email) ? null : (user_.email.indexOf('@') !== -1) ? "success" : "error";
        // a password is at least 8 characters long
        const validPassword = (user_.password === '' || user_.password === undefined) ? null : (user_.password.length >= 8) ? "success" : "error";
        const validRepPassword = (user_.password === '' || user_.password === undefined) ? null : (user_.repeated_password === user_.password) ? "success" : "error";

        const validForm = validUsername !== 'error' && validEmail !== 'error' && validPassword !== 'error' && validRepPassword !== 'error';

        this.state.success && setTimeout(() => this.setState({success: false}), 2000);
        this.state.error && setTimeout(() => this.setState({error: false}), 2000);

        return (
            <Modal show={this.state.show} onHide={this.onClose} backdrop={false} bsSize="large">
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="update-a-user" defaultMessage="Update a user" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        this.state.success &&
                            <Alert bsStyle="success">
                                <FormattedMessage id="saved" defaultMessage="Saved" />
                            </Alert>
                    }
                    {
                        this.state.error &&
                            <Alert bsStyle="danger">
                                <FormattedMessage id="fail-to-save-the-user" defaultMessage="Fail to save the user" /><br/>{this.state.error.message}
                            </Alert>
                    }
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
                                        value={user_.username}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {username: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup validationState={validEmail}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="email" defaultMessage="Email" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl
                                        componentClass="input"
                                        value={user_.email}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {email: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="system" defaultMessage="System" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={user_.is_system || false}
                                        readOnly={!this.props.user_info.is_system} // if the user logged is system, then he can create other "system" user(s), otherwise, not.
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {is_system: e.target.checked}})})}/>

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
                                        value={user_.ui_profile}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {ui_profile: e.target.value}})})}>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
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
                                        value={user_.language}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {language: e.target.value}})})}>
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
                                        value={user_.password || ''}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {password: e.target.value}})})}/>
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
                                        value={user_.repeated_password || ''}
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {repeated_password: e.target.value}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="token-expiry" defaultMessage="Token expiry" />
                                </Col>

                                <Col sm={9}>
                                    <Checkbox
                                        checked={user_.token_expiry || false}
                                        readOnly={!this.props.user_info.is_system} // only "system" user may change it.
                                        onChange={e => this.setState({diff_user: update(this.state.diff_user, {$merge: {token_expiry: e.target.checked}})})}/>
                                </Col>
                            </FormGroup>
                            <FormGroup validationState={"error"}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="danger-zone" defaultMessage="Dangerous zone" />
                                </Col>

                                <Col sm={9}>
                                    <ButtonToolbar>
                                        {
                                            user_.status === "REVOKED" ?
                                                <Button onClick={() => this.onRevoke(true)} bsStyle="danger">
                                                    <FormattedMessage id="allow" defaultMessage="Allow again"/>
                                                </Button> :
                                                <Button onClick={() => this.onRevoke(false)} bsStyle="danger">
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
                                        <Button onClick={this.onSubmit} bsStyle="primary" disabled={!validForm}>
                                            <FormattedMessage id="update" defaultMessage="Update" />
                                        </Button>
                                        <Button onClick={this.onClose}>
                                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                                        </Button>
                                    </ButtonToolbar>
                                </Col>
                            </FormGroup>
                        </Form>
                        </Tab>
                        <Tab eventKey={2} title={<FormattedMessage id="callbacks" defaultMessage="Callbacks" />}>
                            {this.props.notifications && <CallbackHandler userId={user.user_id} {...this.props} />}
                        </Tab>
                    </Tabs>
                </Modal.Body>
            </Modal>
        )
    }

    render() {
        return (
            <div>
                <Button onClick={() => this.setState({show: true})} bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="pencil"/>
                </Button>
                { this._updateModal() }
            </div>
        )
    }
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

class DeleteUser extends Component {
    static propTypes = {
        onClose: PropTypes.func,
        user: PropTypes.object.isRequired,
        auth_token: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {};
        this.onClose = this.onClose.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onDelete() {
        const {user, auth_token} = this.props;
        fetch_delete(`/api/v01/system/users/${user.id}`)
            .then(this.onClose)
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="user-update-failed" defaultMessage="User update failed!" />,
                message: error.message,
                level: 'error'
            }));
    }

    onClose() {
        this.setState({show: false});
        this.props.onClose && this.props.onClose();
    }

    render() {
        return (
            <div>
                <Button onClick={() => this.setState({show: true})} bsStyle="danger" style={{marginLeft: '5px', marginRight: '5px'}}>
                    <Glyphicon glyph="remove-sign"/>
                </Button>
                <Modal show={this.state.show} onHide={this.onClose} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="confirm" defaultMessage="Confirm" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <StaticControl label={<FormattedMessage id='username' defaultMessage='Username'/>} value={this.props.user.username}/>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.onDelete} bsStyle="danger"><FormattedMessage id="delete" defaultMessage="Delete" /></Button>
                        <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}


const UserActions = ({onUserUpdate, onUserDelete, ...props}) => (
    <ButtonToolbar>
        <UpdateUser onClose={onUserUpdate} {...props}/>
        <DeleteUser onClose={onUserDelete} {...props} />
    </ButtonToolbar>
);


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
