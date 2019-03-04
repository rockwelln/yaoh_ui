import "babel-polyfill";
import "url-polyfill";
import React, { Component } from 'react';

import Alert from 'react-bootstrap/lib/Alert';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Panel from 'react-bootstrap/lib/Panel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Row from 'react-bootstrap/lib/Row';
import Nav from 'react-bootstrap/lib/Nav';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';

import {BrowserRouter as Router, Link, Route, Switch, Redirect} from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import NotificationSystem from 'react-notification-system';

import { withCookies } from 'react-cookie';
import {FormattedMessage} from 'react-intl';

import AsyncApioHelp from './async-apio-help';
import Dashboard from './dashboard';
import {Requests, Transaction} from './orange/requests';
import {BulkActions} from "./orange/bulk";
import {TenantsManagement} from "./data_apio/tenants";
import {GroupsManagement} from "./data_apio/groups";
import {NumbersManagement} from "./data_apio/numbers";
import UserManagement, { LocalUserProfile } from './system/user_mgm';
import {StartupEvents} from './startup_events';
import ActivityEditor from './activity-editor';
import {ConfigManagement} from './settings/configuration';
import {Reporting} from "./settings/reporting.jsx";
import Gateways from "./system/gateways_mgm";
import {API_URL_PREFIX, fetch_get, checkStatus, parseJSON} from "./utils";
import Databases from "./system/databases_mgm";
import {AuditLogs} from "./system/audit";
import {isAllowed, pages} from "./utils/user";
import {LoginOpenIdConnect, AuthCallback, AuthSilentCallback} from "./sso/login";
import {ResetPasswordPage, RESET_PASSWORD_PREFIX} from "./reset_password";

import './App.css';
import loading from './loading.gif';
import {sso_auth_service} from "./sso/auth_service";

const ListItemLink = ({to, children}) => (
    <Route path={to} children={({match}) => (
        <li role="presentation" className={match ? 'active' : ''}>
            <Link to={to} role="button">{children}</Link>
        </li>
  )} />
);

const Loading = () => (
    <div>
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}>
            <img src={loading} width="200" height="200" alt="please wait..." />
        </div>
    </div>
);


class LoginForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '', password: '',
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onResetPassword = this.onResetPassword.bind(this);
    }

    onSubmit(e) {
        e.preventDefault();
        fetch(API_URL_PREFIX + '/api/v01/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
            }),
        }).then(checkStatus)
            .then(parseJSON)
            .then(data => this.props.updateToken(data.token))
            .catch(() => {
                this.setState({
                    error: {
                        message: (
                            <div>
                                <h4>
                                    <FormattedMessage id="Oh snap! You failed to login!" />
                                </h4>
                                <p>
                                    <FormattedMessage id="Invalid username or password." />
                                </p>
                            </div>
                        )
                    }
                });
                setTimeout(() => this.setState({error: undefined}), 3000);
            })
    }

    onResetPassword(e) {
        fetch(API_URL_PREFIX + '/api/v01/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: this.state.username,
            }),
        }).then(checkStatus)
        .then(() => {
            this.setState({reset_sent: true});
            setTimeout(() => this.setState({reset_sent: undefined}), 3000);
        })
        .catch(error => {
            this.setState({error: error});
            setTimeout(() => this.setState({error: undefined}), 3000);
        })
    }

    render() {
        return (
            <Form horizontal>
                {
                    this.state.error &&
                        <Alert bsStyle="danger">
                            {this.state.error.message}
                        </Alert>
                }
                {
                    this.state.reset_sent &&
                        <Alert bsStyle="success">
                            <FormattedMessage id="password-reset-mail-sent" defaultMessage="A mail to reset your password has been sent to your mailbox." />
                        </Alert>
                }
                <FormGroup validationState={this.state.errors === undefined?null:"error"}>
                    <Col componentClass={ControlLabel} sm={3}>
                        <FormattedMessage id="username" defaultMessage="Username" />
                    </Col>

                    <Col sm={8}>
                        <FormControl
                            type="text"
                            value={this.state.username}
                            onChange={(e) => this.setState({username: e.target.value, errors: undefined})}
                        />
                    </Col>
                </FormGroup>
                <FormGroup validationState={this.state.errors === undefined?null:"error"}>
                    <Col componentClass={ControlLabel} sm={3}>
                        <FormattedMessage id="password" defaultMessage="Password" />
                    </Col>

                    <Col sm={8}>
                        <FormControl
                            type="password"
                            value={this.state.password}
                            onChange={(e) => this.setState({password: e.target.value, errors: undefined})}
                        />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col smOffset={3} sm={10}>
                        <ButtonToolbar>
                            <Button type="submit" onClick={this.onSubmit}>
                                <FormattedMessage id="sign-in" defaultMessage="Sign in" />
                            </Button>
                            <Button onClick={this.onResetPassword} bsStyle="link">
                                <FormattedMessage id="reset-password" defaultMessage="Reset password"/>
                            </Button>
                        </ButtonToolbar>
                    </Col>
                </FormGroup>
            </Form>)
    }
}

const AsyncApioNavBar = ({user_group, logoutUser, database_status, ...props}) => (
  <Navbar staticTop collapseOnSelect inverse>
    <Navbar.Header>
        { database_status && database_status.env === 'TEST' &&
            <Navbar.Brand style={{color: '#ef0803', fontWeight: 'bold',}}>TEST</Navbar.Brand>
        }
        <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
          <ListItemLink to={"/dashboard"}>
              <Glyphicon glyph="dashboard"/> {' '}
              <FormattedMessage id="dashboard" defaultMessage="Dashboard" />
          </ListItemLink>

          {isAllowed(user_group, pages.requests_nprequests) &&
          <NavDropdown title={
              <span>
                  <Glyphicon glyph="send"/> {' '}
                  <FormattedMessage id="requests" defaultMessage="Requests"/>
              </span>
          } id="nav-requests">

              <LinkContainer to={"/transactions/list"}>
                  <MenuItem>
                      <FormattedMessage id="requests" defaultMessage="Requests"/>
                  </MenuItem>
              </LinkContainer>
              <MenuItem divider/>
              <LinkContainer to={"/transactions/bulk"}>
                  <MenuItem>
                      <FormattedMessage id="bulk" defaultMessage="Bulk"/>
                  </MenuItem>
              </LinkContainer>

              {isAllowed(user_group, pages.requests_startup_events) &&
              <MenuItem divider/>
              }

              {isAllowed(user_group, pages.requests_startup_events) &&
              <LinkContainer to={"/transactions/config/startup_events"}>
                  <MenuItem>
                      <FormattedMessage id="startup-events" defaultMessage="Startup Events"/>
                  </MenuItem>
              </LinkContainer>
              }
              {isAllowed(user_group, pages.requests_workflow_editor) &&
              <LinkContainer to={"/transactions/config/activities/editor"}>
                  <MenuItem>
                      <FormattedMessage id="editor" defaultMessage="Editor"/>
                  </MenuItem>
              </LinkContainer>
              }
          </NavDropdown>
          }

          { isAllowed(user_group, pages.data) &&
              <NavDropdown eventKey={4} title={
                <span>
                    <Glyphicon glyph="hdd" /> {' '}
                    <FormattedMessage id='data' defaultMessage='Data'/>
                </span>
                } id="nav-data-apio">
                  <LinkContainer to={"/apio/tenants"}>
                      <MenuItem>
                          <FormattedMessage id="tenants" defaultMessage="Tenants"/>
                      </MenuItem>
                  </LinkContainer>
              </NavDropdown>
          }

          { isAllowed(user_group, pages.system) &&
              <NavDropdown eventKey={4} title={
                <span>
                    <Glyphicon glyph="cog" /> {' '}
                    <FormattedMessage id='settings' defaultMessage='Settings'/>
                </span>
                } id="nav-system-settings">
                  { isAllowed(user_group, pages.system_users) &&
                      <LinkContainer to={"/system/users"}>
                          <MenuItem>
                              <FormattedMessage id="users" defaultMessage="Users"/>
                          </MenuItem>
                      </LinkContainer>
                  }
                  {/* isAllowed(user_group, pages.system_plugins_config) &&
                      <LinkContainer to={"/system/plugins/config"}>
                          <MenuItem>
                              <FormattedMessage id="plugins-settings" defaultMessage="Plugins Settings"/>
                          </MenuItem>
                      </LinkContainer>
                  */}
                  { isAllowed(user_group, pages.system_config) &&
                      <LinkContainer to={"/system/config"}>
                          <MenuItem>
                              <FormattedMessage id="configuration" defaultMessage="Configuration"/>
                          </MenuItem>
                      </LinkContainer>
                  }
                  { isAllowed(user_group, pages.system_gateways) &&
                      <MenuItem divider/>
                  }
                  { isAllowed(user_group, pages.system_gateways) &&
                      <LinkContainer to={"/system/gateways"}>
                          <MenuItem>
                              <FormattedMessage id="gateways" defaultMessage="Gateways"/>
                          </MenuItem>
                      </LinkContainer>
                  }
                  { isAllowed(user_group, pages.system_databases) &&
                      <LinkContainer to={"/system/databases"}>
                          <MenuItem>
                              <FormattedMessage id="databases" defaultMessage="Databases"/>
                          </MenuItem>
                      </LinkContainer>
                  }
                  { isAllowed(user_group, pages.system_reporting) &&
                      <MenuItem divider/>
                  }
                  { isAllowed(user_group, pages.system_reporting) &&
                      <LinkContainer to={"/system/reporting"}>
                          <MenuItem>
                              <FormattedMessage id="reporting" defaultMessage="Reporting"/>
                          </MenuItem>
                      </LinkContainer>
                  }
              </NavDropdown>
          }

        <NavDropdown title={<Glyphicon glyph="user" />} id="nav-local-user">
          <LinkContainer to={"/user/profile"}>
              <MenuItem>
                  <FormattedMessage id="profile" defaultMessage="Profile" />
              </MenuItem>
          </LinkContainer>
          <MenuItem divider />
          <MenuItem onClick={logoutUser}>
              <FormattedMessage id="logout" defaultMessage="Logout" />
          </MenuItem>
        </NavDropdown>

        <ListItemLink to={"/help"}>
            <Glyphicon glyph="question-sign" />
        </ListItemLink>
      </Nav>
      <Navbar.Text
          pullRight
          style={{
              color: (database_status && database_status.env === 'TEST')?'#ef0803':'#777',
              fontWeight: (database_status && database_status.env === 'TEST')?'bold':'normal',
          }}>
          {
              (database_status && database_status.env) ? database_status.env : "unknown"
          }
      </Navbar.Text>
    </Navbar.Collapse>
  </Navbar>
);


const NotFound = ({match}) => (
    <div>
        <FormattedMessage
            id="app.route.notFound"
            defaultMessage="Sorry, this page doesn't exist (yet)!" />
    </div>
);

const NotAllowed = ({match}) => (
    <div>
        <FormattedMessage
            id="app.route.notAllowed"
            defaultMessage="Sorry, you are not allowed to see this page!" />
    </div>
);

const LoginPage = ({updateToken, error_msg, standby_alert}) => (
    <div>
        <Row style={{height: "20px", display: "block"}}/>
        <Row style={{height: "100%", display: "block"}}>
            <Col xsOffset={1} xs={10} mdOffset={4} md={4}>
                {
                    standby_alert
                }
                <Panel >
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="welcome" defaultMessage="Welcome!" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        {
                            error_msg && (
                                <Alert bsStyle="danger">
                                    <p>{error_msg}</p>
                                </Alert>
                            )
                        }
                        <LoginOpenIdConnect />
                        <hr/>
                        <LoginForm updateToken={updateToken}/>
                    </Panel.Body>
                </Panel>
            </Col>
        </Row>
    </div>
);

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            auth_token: this.props.cookies.get("auth_token"),
            user_info: undefined,
            error_msg: undefined,
        };
        // this._auth_token = this.props.cookies.get("auth_token");
        this._notificationSystem = React.createRef();

        this.getUserInfo = this.getUserInfo.bind(this);
        this.updateToken = this.updateToken.bind(this);
        this.logout = this.logout.bind(this);

        sso_auth_service.manager.events.addUserSignedOut(() => this.logout());
        sso_auth_service.manager.events.addUserLoaded(this.ssoTokenToLocalToken.bind(this));
        sso_auth_service.manager.events.addAccessTokenExpired(this.onSsoTokenExpired.bind(this));

        sso_auth_service.manager.events.addAccessTokenExpiring(() => console.log("token expiring"));
    }

    onSsoTokenExpired() {
        if(window.location.pathname.endsWith('callback')) {
            return;
        }
        console.log(`token expired: ${window.location}`);
        // sso_auth_service.manager.signinSilent();
        sso_auth_service.manager._signinSilentIframe({}).catch(e => {
            console.error(e);
            if(e.error === "login_required") {
                this.logout();
            } /*else if (e.message === "Frame window timed out") {
                setTimeout(this.onSsoTokenExpired, 1100);
            }*/
        })
    }

    getUserInfo(auth_token) {
        fetch_get('/api/v01/system/users/local', auth_token)
            .then(data => {
                this.setState({user_info: data});
                this.props.onLanguageUpdate(data.language);
            })
            .catch(error => {
                if(error.response !== undefined && error.response.status === 401) {  // unauthorized
                    //this.logout()
                } else {
                    this.setState({error_msg: <FormattedMessage id="app.no_connection" defaultMessage="Connection issue: Refresh the page or contact the site admin." /> })
                }
            })
    }

    getDatabaseStatus() {
        fetch_get('/api/v01/system/database/status')
            .then(data =>
                (!this.state.database_status || data.is_master !== this.state.database_status.is_master) &&
                this.setState({database_status: data})
            )
            .catch(console.error);
    }

    componentWillUpdate() {
        if(this.isAuthenticated() && !this.state.user_info && this.state.auth_token) {
            this.getUserInfo(this.state.auth_token);
        }
        /*
        this.getDatabaseStatus();
        */
    }

    componentDidMount() {
        this.getDatabaseStatus();
    }

    updateToken(token) {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate()+1);
        this.setState({auth_token: token, error_msg: undefined});
        this.props.cookies.set('auth_token', token, {expires: tomorrow, path: '/'});  // maxAge = 24hours
    }

    logout() {
        this.setState({auth_token: undefined, user_info: undefined});
        console.log('logout');
        this.props.cookies.remove("auth_token", { path: '/' });
        this.props.cookies.remove("user_language", { path: '/' });
        sso_auth_service.removeUser().then(() => this.props.onLanguageUpdate(undefined));
    }

    ssoTokenToLocalToken(user) {
        if(this.state.auth_token) {
            return;
        }

        console.log(`user loaded`);
        return fetch(API_URL_PREFIX + '/api/v01/auth/login_oidc', {
            method: 'post',
            content_type: 'application/json',
            body: JSON.stringify({
                token_type: user.token_type,
                access_token: user.access_token,
            })
        })
            .then(checkStatus)
            .then(parseJSON)
            .then(r => {
                const internal_token = r.token;
                console.log("got access token");
                this.updateToken(internal_token);
                return r;
            })
            .then(r => this.getUserInfo(r.token))
            .catch(console.error);
    }

    isAuthenticated() {
        const local_auth = this.state.auth_token !== undefined;
        const sso_auth = sso_auth_service.isLoggedIn();

        console.log(`local_auth status: ${local_auth}, sso_auth status: ${sso_auth}`);
        return local_auth || sso_auth;
    }

    render() {
        const {auth_token, database_status, error_msg, user_info} = this.state;
        const authenticated = this.isAuthenticated();
        const is_reset_password = window.location.pathname.substr(0, RESET_PASSWORD_PREFIX.length) === RESET_PASSWORD_PREFIX;
        const standby_alert = database_status && !database_status.is_master && (
            <Alert bsStyle="danger">
                <FormattedMessage id="standby-db-alert" defaultMessage="You are working on a Standby database!"/>
            </Alert>
        );

        // reset password
        if(is_reset_password) {
            return <ResetPasswordPage standby_alert={standby_alert}/>
        }

        // need to login first
        if(!authenticated || error_msg !== undefined) {
            return (
                <Router>
                    <Switch>
                        <Route path="/auth-callback" component={AuthCallback} exact/>
                        <Route path="/auth-silent-callback" component={AuthSilentCallback} exact/>
                        <Route path="/" exact>
                            <Redirect to="/dashboard" />
                        </Route>
                        <Route component={() => (
                            <LoginPage updateToken={this.updateToken} error_msg={error_msg} standby_alert={standby_alert}/>
                        )} />
                    </Switch>
                </Router>
            )

            //return <LoginPage updateToken={this.updateToken} error_msg={error_msg} standby_alert={standby_alert}/>
        } else if (user_info === undefined) { // get the right level of the user (pages allowance)
            return <Loading/>
        }

        const ui_profile = user_info.ui_profile;

        return (
          <Router>
            <div className="App">
                <NotificationSystem ref={this._notificationSystem}/>
                {
                    standby_alert
                }
                <div className="App-header">
                  <AsyncApioNavBar
                      user_group={ui_profile}
                      database_status={database_status}
                      logoutUser={this.logout}
                      auth_token={auth_token} />
                </div>
                <Col mdOffset={1} md={10}>
                    <Switch>
                        <Route path="/help"
                               component={props => (
                                   <AsyncApioHelp {...props} />
                               )}
                               exact />
                        <Route path="/dashboard"
                               component={props => (
                                   <Dashboard
                                       auth_token={auth_token}
                                       notifications={this._notificationSystem.current}
                                       {...props} />
                               )}
                               exact />
                        <Route path="/transactions/list"
                               component={props => (
                                   isAllowed(ui_profile, pages.requests_nprequests) ?
                                   <Requests
                                       auth_token={auth_token}
                                       user_info={user_info}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/bulk"
                               component={props => (
                                   isAllowed(ui_profile, pages.requests_nprequests) ?
                                   <BulkActions
                                       auth_token={auth_token}
                                       notifications={this._notificationSystem.current}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/apio/tenants"
                               component={props => (
                                   isAllowed(ui_profile, pages.data_tenants) ?
                                   <TenantsManagement
                                       auth_token={auth_token}
                                       notifications={this._notificationSystem.current}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/apio/tenants/:tenantId/groups"
                               component={props => (
                                   isAllowed(ui_profile, pages.data_tenants) ?
                                   <GroupsManagement
                                       auth_token={auth_token}
                                       notifications={this._notificationSystem.current}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/apio/tenants/:tenantId/groups/:siteId/numbers"
                               component={props => (
                                   isAllowed(ui_profile, pages.data_tenants) ?
                                   <NumbersManagement
                                       auth_token={auth_token}
                                       notifications={this._notificationSystem.current}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/config/startup_events"
                               component={props => (
                                   isAllowed(ui_profile, pages.requests_startup_events) ?
                                       <StartupEvents
                                           auth_token={auth_token}
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/config/activities/editor"
                               component={props => (
                                   isAllowed(ui_profile, pages.requests_workflow_editor) ?
                                       <ActivityEditor auth_token={auth_token} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/:txId"
                               component={props => (
                                   isAllowed(ui_profile, pages.requests_nprequests) ?
                                       <Transaction
                                           auth_token={auth_token}
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )} />
                        <Route path="/system/users"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_users) ?
                                       <UserManagement
                                           auth_token={auth_token}
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/users/audit"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_users) ?
                                       <AuditLogs
                                           auth_token={auth_token}
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/reporting"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_reporting)?
                                       <Reporting
                                           auth_token={auth_token}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/gateways"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_gateways) ?
                                       <Gateways
                                           auth_token={auth_token}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/databases"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_databases) ?
                                       <Databases
                                           auth_token={auth_token}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/user/profile"
                               component={props => (
                                   <LocalUserProfile
                                       user_info={user_info}
                                       auth_token={auth_token}
                                       onUserInfoChanged={()=> this.setState({user_info:undefined})}
                                       notifications={this._notificationSystem.current}
                                       {...props} />
                               )}
                               exact />
                        <Route path="/system/config"
                               component={props => (
                                   isAllowed(ui_profile, pages.system_config) ?
                                       <ConfigManagement
                                           auth_token={auth_token}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/auth-silent-callback" component={AuthSilentCallback} exact/>
                        <Route path="/" exact>
                            <Redirect to="/dashboard" />
                        </Route>
                        <Route component={NotFound} />
                    </Switch>
                </Col>
            </div>
          </Router>
        );
    }
}

export default withCookies(App);
