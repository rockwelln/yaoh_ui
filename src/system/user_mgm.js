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

import {FormattedMessage} from 'react-intl';

import 'font-awesome/css/font-awesome.min.css';
import update from 'immutability-helper';

import {checkStatus, API_URL_PREFIX, fetch_get, fetch_delete} from "../utils";
import {ApioDatatable} from "../utils/datatable";
import { LinkContainer } from 'react-router-bootstrap';
import {INTERNAL_HELP_LINKS} from "../async-apio-help";
import {Search, StaticControl} from "../utils/common";


export class LocalUserProfile extends Component {
    static updatable_field = k => ['language', 'password'].includes(k)

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
        fetch(API_URL_PREFIX + '/api/v01/system/users/local', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.auth_token
            },
            body: JSON.stringify(
                Object.keys(data).filter(LocalUserProfile.updatable_field).reduce(
                    (obj, key) => {
                        obj[key] = data[key];
                        return obj;
                    }, {}
                )
            ),
        }).then(checkStatus)
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
        const validPassword = (this.state.password === '')?null:(this.state.password.length >= 8)?"success":"error";
        const validRepPassword = (this.state.password === '')?null:(this.state.repeated_password === this.state.password)?"success":"error";
        const validForm = validPassword !== 'error' && validRepPassword !== 'error';

        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="user-profile" defaultMessage="User Profile" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                {this.state.error !== undefined ? <Alert bsStyle="danger">{this.state.error}</Alert>:
                 this.state.success !== undefined ? <Alert bsStyle="success">{this.state.success}</Alert> :''}
                <Form horizontal>
                    <StaticControl
                            label={<FormattedMessage id='username' defaultMessage='Username' />}
                            value={this.state.username}/>
                    <StaticControl
                            label={<FormattedMessage id='email' defaultMessage='Email' />}
                            value={this.state.email}/>
                    <StaticControl
                            label={<FormattedMessage id='system' defaultMessage='System' />}
                            value={
                                this.state.is_system?
                                    <FormattedMessage id="yes" defaultMessage="Yes" />:
                                    <FormattedMessage id="no" defaultMessage="No" />
                            }/>
                    <StaticControl label={<FormattedMessage id='ui-profile' defaultMessage='UI Profile'/>} value={this.state.ui_profile}/>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="groups" defaultMessage="Groups" />
                        </Col>

                        <Col sm={9}>
                            {
                                this.state.groups.map((g) => {
                                    return (
                                        <FormControl.Static key={g.name}>
                                            {g.name}
                                            <FormattedMessage id="app.settings.user.groups.as" defaultMessage=" as " />
                                            {g.level}
                                        </FormControl.Static>
                                    )
                                })
                            }
                        </Col>
                    </FormGroup>
                    <StaticControl label={<FormattedMessage id='registered-on' defaultMessage='Registered on'/>} value={this.state.registered_on}/>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="language" defaultMessage="Language" />
                        </Col>

                        <Col sm={2}>
                            <FormControl
                                componentClass="select"
                                value={this.state.language}
                                onChange={(e) => this.setState({language: e.target.value})}>
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
                                value={this.state.password}
                                onChange={(e) => this.setState({password: e.target.value})} />
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
                                value={this.state.repeated_password}
                                onChange={(e) => this.setState({repeated_password: e.target.value})} />
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col smOffset={2} sm={9}>
                            <Button bsStyle="primary" onClick={this.onSubmit} disabled={!validForm}>
                                <FormattedMessage id="save" defaultMessage="Save" />
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
                </Panel.Body>
            </Panel>
        )
    }
}


class UpdateUser extends Component {
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
        fetch(API_URL_PREFIX + '/api/v01/system/users/' + this.props.user.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.auth_token
            },
            body: JSON.stringify(diff_user)
        }).then(checkStatus)
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

    _fetchUserDetails() {
        fetch_get('/api/v01/system/users/' + this.props.user.id, this.props.auth_token)
            .then(user => this.setState({user: user, diff_user: {}}))
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
            <Modal show={this.state.show} onHide={this.onClose} backdrop={false}>
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
                    <Form horizontal>
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
                                    <option value="porta">Porta</option>
                                    <option value="tl">TL</option>
                                    <option value="hd2">HD2</option>
                                </FormControl>
                                <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                             defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
                                <HelpBlock>
                                    <FormattedMessage id="for-more-information-about-profile-implementation-in-the-right-management-see-" defaultMessage="For more information about profile implementation in the right management see " />
                                    <a href={INTERNAL_HELP_LINKS.profile_rights.url}><FormattedMessage id={"here"}/></a>
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
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.onSubmit} bsStyle="primary" disabled={!validForm}>
                        <FormattedMessage id="update" defaultMessage="Update" />
                    </Button>
                    <Button onClick={this.onClose}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                </Modal.Footer>
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
            ui_profile: 'porta',
            language: 'en',
            groups: [],
            password: '',
            repeated_password: '',
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
        fetch(API_URL_PREFIX + '/api/v01/system/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.props.auth_token
            },
            body: JSON.stringify(user_data)
        }).then(checkStatus)
        .then(this.onClose)
        .catch(error => this.setState({error: error, creating: false}))
    }

    render() {
        const {user} = this.state;

        // email has to contain @
        const validEmail = (user.email.length === 0) ? null : (user.email.indexOf('@') !== -1) ? "success" : "error";
        // a password is at least 8 characters long
        const validPassword = user.password.length === 0 ? null : (user.password.length >= 8) ? "success" : "error";
        const validRepPassword = user.password.length === 0 ? null : user.repeated_password === user.password ? "success" : "error";

        const validForm = !this.state.creating && validEmail === 'success' && ((validPassword === null && validRepPassword === null) || (validPassword === 'success' && validRepPassword === 'success'));

        this.state.error && setTimeout(() => this.setState({error: false}), 2000);

        return (
            <div>
                <Button bsStyle='primary' onClick={() => this.setState({show: true})}>
                    <FormattedMessage id="add-user" defaultMessage="Add user" />
                </Button>
                <Modal show={this.state.show} onHide={this.onClose} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="create-a-user" defaultMessage="Create a user" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            this.state.error &&
                                <Alert bsStyle="danger">
                                    <FormattedMessage id="fail-to-create-the-user" defaultMessage="Fail to create the user" /><br/>{this.state.error.message}
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {username: e.target.value}})})}/>
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {email: e.target.value}})})}/>
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {is_system: e.target.checked}})})}/>

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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {ui_profile: e.target.value}})})}>
                                        <option value="admin">Admin</option>
                                        <option value="porta">Porta</option>
                                        <option value="tl">TL</option>
                                        <option value="hd2">HD2</option>
                                    </FormControl>
                                    <HelpBlock><FormattedMessage id="app.user.profile.help"
                                                                 defaultMessage="The profile has no influence on the rights in the application only the pages the user may see."/></HelpBlock>
                                    <HelpBlock>
                                        <FormattedMessage id="for-more-information-about-profile-implementation-in-the-right-management-see-" defaultMessage="For more information about profile implementation in the right management see " />
                                        <a href={INTERNAL_HELP_LINKS.profile_rights.url}><FormattedMessage id={"here"}/></a>
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {language: e.target.value}})})}>
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {password: e.target.value}})})}/>
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
                                        onChange={e => this.setState({user: update(this.state.user, {$merge: {repeated_password: e.target.value}})})}/>
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
    constructor(props) {
        super(props);
        this.state = {};
        this.onClose = this.onClose.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onDelete() {
        fetch_delete(`/api/v01/system/users/${this.props.user.id}`, this.props.auth_token)
            .then(this.onClose)
            .catch(error => this.setState({error: error}));
    }

    onClose() {
        this.setState({show: false, error: undefined});
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
                        {
                            this.state.error &&
                                <Alert bsSyle="danger">
                                    {this.state.error.message}
                                </Alert>
                        }
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

class UserActions extends Component {
    render() {
        return (
            <ButtonToolbar>
                <UpdateUser
                    onClose={this.props.onUserUpdate}
                    {...this.props}/>
                <DeleteUser
                    onClose={this.props.onUserDelete}
                    {...this.props} />
            </ButtonToolbar>
        )
    }
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
                    value: '%' + f + '%'
                },
                {
                    field: 'email',
                    op: 'like',
                    value: '%' + f + '%'
                }
            ]}
        })
    }

    _filterCriteriaAsSpec(filter_criteria) {
        return filter_criteria;
    }

    render() {
        const {resources, error, sorting_spec, pagination, filter_criteria} = this.state;
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
                                user_info={this.props.user_info}
                                auth_token={this.props.auth_token} />
                            <LinkContainer to={"/system/users/audit"}>
                                <Button bsStyle='danger'>
                                    <FormattedMessage id="audit_users" defaultMessage="Audit"/>
                                </Button>
                            </LinkContainer>
                        </ButtonToolbar>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
