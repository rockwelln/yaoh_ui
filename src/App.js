import "core-js/stable";
import "regenerator-runtime/runtime";

import "url-polyfill";
import "isomorphic-fetch";
import React, {Component, Suspense, useEffect, useState} from 'react';

import Alert from 'react-bootstrap/lib/Alert';
import Col from 'react-bootstrap/lib/Col';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Nav from 'react-bootstrap/lib/Nav';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';

import {BrowserRouter as Router, Link, Redirect, Route, Switch} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import NotificationSystem from 'react-notification-system';

import {FormattedMessage} from 'react-intl';

import AsyncApioHelp from './help/async-apio-help';
import Dashboard from './dashboard';
import {CustomRequests, Request, Requests, Transaction} from './requests/requests';
import Timers from './requests/timers';
import {Bulks} from "./requests/bulk";
import {BulkActions} from "./system/bulk_actions";
import {NdgHistory} from "./requests/ndg_history";
import UserManagement, {LocalUserProfile} from './system/user_mgm';
import {StartupEvents} from './orchestration/startup_events';
import {Activities, ActivityEditor} from './orchestration/activity-editor';
import CronTimers from './orchestration/cron_timers';
import Configuration from './settings/configuration';
import {Reporting} from "./settings/reporting.jsx";
import Gateways from "./system/gateways_mgm";
import LocalQueues from "./system/queues";
import {
    API_URL_PREFIX,
    AuthServiceManager,
    checkStatus,
    createCookie,
    fetch_get,
    getCookie,
    NotificationsManager,
    parseJSON,
    ProvProxiesManager,
    removeCookie,
    UiFlavourService,
} from "./utils";
import Databases from "./system/databases_mgm";
import {AuditLogs} from "./system/audit";
import {accesses, limited_menu, localUser, modules, pages, supportedModule} from "./utils/user";
import {NotAllowed} from "./utils/common";
import {AuthCallback, AuthSilentCallback} from "./sso/login";

import './App.css';
import apio_brand from "./images/apio.png";
import apio_logo from "./images/logo.png";
import loading from './loading.gif';
import {sso_auth_service} from "./sso/auth_service";
import {Webhooks} from "./system/webhooks";
import LogsManagement from "./system/logs";
import UserProfiles from "./system/user_profiles";
import Templates from "./system/templates";
import {UserRoles} from "./system/user_roles";
// specifics for NP
import {NPRequests} from "./np/np-requests";
import {NPTransaction, NPPortInRequest, NPDisconnectRequest} from "./np/requests";
import {NPUpdateRequest} from "./np/update-request";
import {NPChangeInstallationAddressRequest} from "./np/change-install-addr-request";
import {MobileEventsManagement} from "./np/mobile_events";
import OperatorManagement from "./np/data/operator_mgm";
import {PublicHolidays} from "./np/data/holidays_mgm";
import RangesManagement from "./np/data/range_mgm";
import RoutingInfoManagement from "./np/data/routing_info_mgm";
import SearchPortingCases from "./np/number_porting";
import SearchMVNO from "./np/mvno_mgm";
import {LoginPage, LoginForm, fetchPlatformDetails} from "./login";
import {RESET_PASSWORD_PREFIX, ResetPasswordRequestForm, ResetPasswordForm} from "./reset_password";
import {NPEmergencyNotificationRequest} from "./np/emergency-notification";
import TemplatePlayground from "./help/templatePlayground";

const ListProvisioningGateways=React.lazy(() => import("./provisioning/ListProvisioningGateways"))

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

const AsyncApioNavBar = ({user_info, logoutUser, database_status, ...props}) => {
  if(limited_menu(user_info.ui_profile)) {
    return (
      <Navbar staticTop collapseOnSelect inverse>
        <Navbar.Header>
          <Navbar.Brand style={{color: '#ef0803', fontWeight: 'bold',}}>
            <img src={apio_brand}
                 width="38"
                 height="42"
                 className="d-inline-block align-top"
                 style={{padding: 0}}
                 alt="apio"/>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            {(!user_info.modules || user_info.modules.includes(modules.provisioning)) && localUser.isAllowed(accesses.provisioning) &&
            <NavDropdown
              eventKey={4}
              title={
                <span>
                  <Glyphicon glyph="hdd"/>{" "}
                  <FormattedMessage
                    id="provisioning"
                    defaultMessage="Provisioning"
                  />
                </span>
              }
              id="nav-data-apio"
            >
              {
                ProvProxiesManager.listProxies().map((p, i) =>
                  <LinkContainer to={"/provisioning/" + p.id + "/tenants"} key={i}>
                    <MenuItem>
                      {p.name}
                    </MenuItem>
                  </LinkContainer>
                )
              }
            </NavDropdown>
            }
          </Nav>
          <Nav pullRight>
            <NavDropdown title={<Glyphicon glyph="user"/>} id="nav-local-user">
              <LinkContainer to={"/user/profile"}>
                <MenuItem>
                  <FormattedMessage id="profile" defaultMessage="Profile"/>
                </MenuItem>
              </LinkContainer>
              <MenuItem divider/>
              <MenuItem onClick={logoutUser}>
                <FormattedMessage id="logout" defaultMessage="Logout"/>
              </MenuItem>
            </NavDropdown>

            <Navbar.Text
              style={{
                color: (database_status && database_status.env === 'TEST') ? '#ef0803' : '#777',
                fontWeight: (database_status && database_status.env === 'TEST') ? 'bold' : 'normal',
              }}>
              {
                (database_status && database_status.env) ? database_status.env : "unknown"
              }
            </Navbar.Text>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  } else {
    return (
      <Navbar staticTop collapseOnSelect inverse>
        <Navbar.Header>
          <Navbar.Brand style={{color: '#ef0803', fontWeight: 'bold',}}>
            <img src={apio_brand}
                 width="38"
                 height="42"
                 className="d-inline-block align-top"
                 style={{padding: 0}}
                 alt="apio"/>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            {localUser.isAllowed(accesses.dashboard) &&
            <ListItemLink to={"/dashboard"}>
              <Glyphicon glyph="dashboard"/> {' '}
              <FormattedMessage id="dashboard" defaultMessage="Dashboard"/>
            </ListItemLink>
            }

            {user_info.modules && supportedModule(modules.npact, user_info.modules) && localUser.isAllowed(accesses.requests) &&
            <NavDropdown title={
              <span>
                <Glyphicon glyph="send"/> {' '}
                <FormattedMessage id="requests" defaultMessage="Requests"/>
              </span>
            } id="nav-requests">

              <LinkContainer to={"/transactions/new_portin"}>
                <MenuItem>
                  <FormattedMessage id="new-port-in" defaultMessage="New Port-in"/>
                </MenuItem>
              </LinkContainer>
              {supportedModule(modules.npact_crdc, user_info.modules) &&
              <LinkContainer to={"/transactions/new_update"}>
                <MenuItem>
                  <FormattedMessage id="new-update" defaultMessage="New Update"/>
                </MenuItem>
              </LinkContainer>
              }
              <LinkContainer to={"/transactions/new_disconnect"}>
                <MenuItem>
                  <FormattedMessage id="new-disconnect" defaultMessage="New Disconnect"/>
                </MenuItem>
              </LinkContainer>
              {supportedModule(modules.npact_crdb, user_info.modules) &&
              <LinkContainer to={"/transactions/new_install_address"}>
                <MenuItem>
                  <FormattedMessage id="new-addess" defaultMessage="New Address Change"/>
                </MenuItem>
              </LinkContainer>
              }
              {supportedModule(modules.npact_crdb, user_info.modules) &&
              <LinkContainer to={"/transactions/emergency_notification"}>
                <MenuItem>
                  <FormattedMessage id="emergency-notification" defaultMessage="New Emergency Notification"/>
                </MenuItem>
              </LinkContainer>
              }

              <MenuItem divider/>

              {supportedModule(modules.npact_crdc, user_info.modules) &&
              <LinkContainer to={"/transactions/mobile_events"}>
                <MenuItem>
                  <FormattedMessage id="mobile-events" defaultMessage="Mobile Events"/>
                </MenuItem>
              </LinkContainer>
              }

              <LinkContainer to={"/transactions/list"}>
                <MenuItem>
                  <FormattedMessage id="porting-requests" defaultMessage="Porting Requests"/>
                </MenuItem>
              </LinkContainer>

            </NavDropdown>
            }

            {(!user_info.modules || !supportedModule(modules.npact, user_info.modules)) && localUser.isAllowed(accesses.requests) &&
            <NavDropdown title={
              <span>
                <Glyphicon glyph="send"/> {' '}
                <FormattedMessage id="requests" defaultMessage="Requests"/>
              </span>
            } id="nav-requests">

              <LinkContainer to={"/transactions/list"}>
                <MenuItem>
                  <FormattedMessage id="apio-requests" defaultMessage="APIO Requests"/>
                </MenuItem>
              </LinkContainer>
              {(!user_info.modules || user_info.modules.includes(modules.orchestration)) &&
              [
                <LinkContainer to={"/custom-transactions/list"} key="custom-requests">
                  <MenuItem>
                    <FormattedMessage id="scheduled-jobs" defaultMessage="Scheduled jobs"/>
                  </MenuItem>
                </LinkContainer>,
                <LinkContainer to={"/transactions/timers"} key="timers">
                  <MenuItem>
                    <FormattedMessage id="timers" defaultMessage="Timers"/>
                  </MenuItem>
                </LinkContainer>,
              ]
              }
              {(!user_info.modules || user_info.modules.includes(modules.orange)) && localUser.canSee(pages.requests_ndg) &&
              [
                <MenuItem key="divider-1" divider/>,
                <LinkContainer key="ndg-history" to={"/requests/ndg"}>
                  <MenuItem>
                    <FormattedMessage id="ndg-history" defaultMessage="NDG history"/>
                  </MenuItem>
                </LinkContainer>,
              ]
              }
            </NavDropdown>
            }

            {(!user_info.modules || user_info.modules.includes(modules.bulk)) && localUser.isAllowed(accesses.bulks) &&
            <NavDropdown title={
              <span>
                <Glyphicon glyph="equalizer"/> {' '}
                <FormattedMessage id="bulks" defaultMessage="Bulks"/>
              </span>
            } id="nav-bulks">
              <LinkContainer to={"/transactions/bulk"}>
                <MenuItem>
                  <FormattedMessage id="bulk" defaultMessage="Bulk"/>
                </MenuItem>
              </LinkContainer>
              {localUser.isAllowed(accesses.bulks_actions) &&
              <LinkContainer to={"/system/bulk_actions"}>
                <MenuItem>
                  <FormattedMessage id="bulk-actions" defaultMessage="Bulk actions"/>
                </MenuItem>
              </LinkContainer>
              }
            </NavDropdown>
            }

            {(!user_info.modules || user_info.modules.includes(modules.provisioning)) && localUser.isAllowed(accesses.provisioning) &&
            <NavDropdown
              eventKey={4}
              title={
                <span>
                  <Glyphicon glyph="hdd"/>{" "}
                  <FormattedMessage
                    id="provisioning"
                    defaultMessage="Provisioning"
                  />
                </span>
              }
              id="nav-data-apio"
            >
              {
                ProvProxiesManager.listProxies().map((p, i) =>
                  <LinkContainer to={"/provisioning/" + p.id + "/tenants"} key={i}>
                    <MenuItem>
                      {p.name}
                    </MenuItem>
                  </LinkContainer>
                )
              }
            </NavDropdown>
            }

            {(!user_info.modules || supportedModule(modules.npact, user_info.modules)) && localUser.isAllowed(accesses.data) &&
            <NavDropdown eventKey={4} title={
              <span>
                <Glyphicon glyph="hdd"/> {' '}
                <FormattedMessage id="data" defaultMessage="Data"/>
              </span>
            } id="nav-system-data">
              {localUser.canSee(pages.npact_operators) &&
              <LinkContainer to={"/system/operators"}>
                <MenuItem>
                  <FormattedMessage id="operators" defaultMessage="Operators"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.npact_ranges) &&
              <LinkContainer to={"/system/ranges"}>
                <MenuItem>
                  <FormattedMessage id="ranges" defaultMessage="Ranges"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.npact_routing_info) &&
              <LinkContainer to={"/system/routing_info"}>
                <MenuItem>
                  <FormattedMessage id="routing-info" defaultMessage="Routing info"/>
                </MenuItem>
              </LinkContainer>
              }
              <MenuItem divider/>
              {localUser.canSee(pages.npact_porting_cases) &&
              <LinkContainer to={"/system/porting_cases"}>
                <MenuItem>
                  <FormattedMessage id="np-database" defaultMessage="NP database"/>
                </MenuItem>
              </LinkContainer>
              }
              {user_info.modules.includes(modules.npact_crdc) && localUser.canSee(pages.npact_mvno_numbers) &&
              <LinkContainer to={"/system/mvno_numbers"}>
                <MenuItem>
                  <FormattedMessage id="mvno-numbers" defaultMessage="MVNO Numbers"/>
                </MenuItem>
              </LinkContainer>
              }
              {user_info.modules.includes(modules.npact_crdc) && localUser.canSee(pages.npact_holidays) &&
              <>
                <MenuItem divider/>
                <LinkContainer to={"/system/public_holidays"}>
                  <MenuItem>
                    <FormattedMessage id="public-holidays" defaultMessage="Public holidays"/>
                  </MenuItem>
                </LinkContainer>
              </>
              }
            </NavDropdown>
            }

            {localUser.isAllowed(accesses.settings) &&
            <NavDropdown eventKey={4} title={
              <span>
                <Glyphicon glyph="signal"/> {' '}
                <FormattedMessage id='settings' defaultMessage='Settings'/>
              </span>
            } id="nav-system-settings">
              {localUser.isAllowed(accesses.settings_users) &&
              <LinkContainer to={"/system/users"}>
                <MenuItem>
                  <FormattedMessage id="users" defaultMessage="Users"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.isAllowed(accesses.settings_configuration)  &&
              [
                <LinkContainer to={"/system/webhooks"} key="webhooks">
                  <MenuItem>
                    <FormattedMessage id="webhooks" defaultMessage="Webhooks"/>
                  </MenuItem>
                </LinkContainer>,
                <LinkContainer to={"/system/config"} key={"configuration"}>
                  <MenuItem>
                    <FormattedMessage id="configuration" defaultMessage="Configuration"/>
                  </MenuItem>
                </LinkContainer>
              ]
              }
              {localUser.canSee(pages.system_gateways) &&
              [
                <MenuItem key="divider-2" divider/>,
                <LinkContainer to={"/system/gateways"} key="gateways">
                  <MenuItem>
                    <FormattedMessage id="gateways" defaultMessage="Gateways"/>
                  </MenuItem>
                </LinkContainer>
              ]
              }
              {localUser.canSee(pages.system_databases) &&
              <LinkContainer to={"/system/databases"}>
                <MenuItem>
                  <FormattedMessage id="databases" defaultMessage="Databases"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.system_queues) &&
              <LinkContainer to={"/system/queues"}>
                <MenuItem>
                  <FormattedMessage id="queues" defaultMessage="Queues"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.system_reporting) &&
              [
                <MenuItem key="divider-3" divider/>,
                <LinkContainer to={"/system/reporting"} key="reports">
                  <MenuItem>
                    <FormattedMessage id="reporting" defaultMessage="Reporting"/>
                  </MenuItem>
                </LinkContainer>
              ]
              }
              {localUser.canSee(pages.system_templates) &&
              [
                <MenuItem key="divider-4" divider/>,
                <LinkContainer to={"/system/templates"} key="templates">
                  <MenuItem>
                    <FormattedMessage id="templates" defaultMessage="Templates"/>
                  </MenuItem>
                </LinkContainer>
              ]
              }
              {localUser.canSee(pages.system_logs) &&
              [
                <LinkContainer to={"/system/logs"} key="logs">
                  <MenuItem>
                    <FormattedMessage id="logs" defaultMessage="Logs"/>
                  </MenuItem>
                </LinkContainer>
              ]
              }
            </NavDropdown>
            }
            {(!user_info.modules || user_info.modules.includes(modules.orchestration)) && localUser.isAllowed(accesses.orchestration) &&
            <NavDropdown eventKey={4} title={
              <span>
                <Glyphicon glyph="cog"/> {' '}
                <FormattedMessage id='orchestration' defaultMessage='Orchestration'/>
              </span>
            } id="nav-orch">
              {localUser.canSee(pages.requests_startup_events) &&
              <LinkContainer to={"/transactions/config/startup_events"}>
                <MenuItem>
                  <FormattedMessage id="startup-events" defaultMessage="Startup Events"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.requests_workflow_editor) &&
              <LinkContainer to={"/transactions/config/activities/editor"}>
                <MenuItem>
                  <FormattedMessage id="editor" defaultMessage="Editor"/>
                </MenuItem>
              </LinkContainer>
              }
              {localUser.canSee(pages.requests_workflow_editor) &&
              <LinkContainer to={"/transactions/config/cron_timers"}>
                <MenuItem>
                  <FormattedMessage id="job-scheduler" defaultMessage="Job scheduler"/>
                </MenuItem>
              </LinkContainer>
              }
            </NavDropdown>
            }

          </Nav>
          <Nav pullRight>
            <NavDropdown title={<Glyphicon glyph="user"/>} id="nav-local-user">
              <LinkContainer to={"/user/profile"}>
                <MenuItem>
                  <FormattedMessage id="profile" defaultMessage="Profile"/>
                </MenuItem>
              </LinkContainer>
              <MenuItem divider/>
              <MenuItem onClick={logoutUser}>
                <FormattedMessage id="logout" defaultMessage="Logout"/>
              </MenuItem>
            </NavDropdown>

            <ListItemLink to={"/help"}>
              <Glyphicon glyph="question-sign"/>
            </ListItemLink>

            <Navbar.Text
              style={{
                color: (database_status && database_status.env === 'TEST') ? '#ef0803' : '#777',
                fontWeight: (database_status && database_status.env === 'TEST') ? 'bold' : 'normal',
              }}>
              {
                (database_status && database_status.env) ? database_status.env : "unknown"
              }
            </Navbar.Text>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
};


const NotFound = () => (
    <div>
        <FormattedMessage
            id="app.route.notFound"
            defaultMessage="Sorry, this page doesn't exist (yet)!" />
    </div>
);

const DemoWatermark = () => (
    <>
      <div
        style={{
           position:"fixed",
           bottom:"5px",
           right:"5px",
           opacity:0.5,
           zIndex:99,
           color:"black",
        }}>This version is not fully activated (only for DEMO)! Contact support@netaxis.be for full activation.</div>
      <div
        style={{
           position:"fixed",
           top:"50px",
           right:"5px",
           opacity:0.5,
           zIndex:99,
           color:"black",
        }}>This version is not fully activated (only for DEMO)! Contact support@netaxis.be for full activation.</div>
    </>
);

function addDays(base, nbDays) {
  var date = new Date(base.valueOf());
  date.setDate(date.getDate() + nbDays);
  return date;
}

const LicenseAlert = () => {
  const [health, setHealth] = useState({});

  useEffect(() => {
    fetchBackendHealth(setHealth);
    const i = setInterval(() => { fetchBackendHealth(setHealth) }, 120_000);
    return () => clearInterval(i);
  }, []);

  const validUntil = health.valid_until && new Date(health.valid_until);
  const watermark = health.demo ? <DemoWatermark/> : <div/>;

  if(validUntil < addDays(new Date(), 30) && validUntil >= new Date()) {
    return (
      <Alert bsStyle="warning">This instance run a {health.demo?'demo ':''}license which will expire soon ({ validUntil.toLocaleString() }) - Take contact with support@netaxis.be before it's too late.
      </Alert>
    )
  } else if(validUntil < new Date()) {
    return (
      <Alert bsStyle="danger">This instance run an invalid license - Take contact with support@netaxis.be to activate your
        instance.
      </Alert>
    )
  } else {
    return watermark;
  }
};

function fetchBackendHealth(onSuccess) {
    return fetch("/api/v01/health")
      .then(r => {
        if (r.status < 400) {
          return r
        } else {
          throw new Error(r.statusText)
        }
      })
      .then(r => r.json())
      .then(onSuccess)
      .catch(console.log);
}

function logoutUser() {
    return fetch_get(`/api/v01/auth/logout?sign=${AuthServiceManager.getLogoutSignature()}`)
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user_info: undefined,
            error_msg: undefined,
            provisioningRoutes: <Route path="/provisioning" component={Loading} />,
            health: {},
        };
        this._notificationSystem = React.createRef();
        NotificationsManager.setRef(this._notificationSystem);
        AuthServiceManager.loadJwtTokensFromLocation()

        this.getUserInfo = this.getUserInfo.bind(this);
        this.updateToken = this.updateToken.bind(this);
        this.logout = this.logout.bind(this);
    }

    getUserInfo() {
        fetch_get('/api/v01/system/users/local')
            .then(data => {
                localUser.fromObject(data);
                localStorage.setItem("userProfile", data.ui_profile);

                if(data.modules && supportedModule(modules.provisioning, data.modules)) {
                    import("./provisioning").then(prov => {
                      this.setState({provisioningRoutes: prov.provisioningRoutes(data.ui_profile)})
                    }).then(() => ProvProxiesManager.fetchConfiguration())
                      .then(() => this.setState({proxy_fetch: true, user_info: data}))
                      .catch(console.log);
                } else {
                    this.setState({user_info: data});
                }
            })
            .catch(error => {
                if(error.response !== undefined && (error.response.status === 401 || error.response.status === 403)) {  // unauthorized
                    this.logout()
                } else {
                    console.error("fetch user profile error", error)
                    this.setState({error_msg: <FormattedMessage id="app.no_connection" defaultMessage="Connection issue: Refresh the page or contact the site admin." /> })
                }
            })
    }

    getDatabaseStatus() {
        fetch_get('/api/v01/system/database/status')
            .then(data => {
                if (!this.state.database_status || data.is_master !== this.state.database_status.is_master) {
                   this.setState({database_status: data})
                }
            })
            .catch(console.error);
    }

    getPlatformDetails() {
        fetchPlatformDetails(data => {
          if (data.modules) {
              UiFlavourService.updateFlavourFromModules(data.modules);
              document.title = UiFlavourService.getWindowTitle();
          }
        })
    }

    componentWillUpdate() {
        if(this.isAuthenticated() && !this.state.user_info && AuthServiceManager.isAuthenticated()) {
            this.getUserInfo();
        }
    }

    componentDidMount() {
        if(!window.location.href.includes("/auth-callback/")){
          this.getDatabaseStatus();
          this.getPlatformDetails();
          getCookie('auth_sso') === '1' && !sso_auth_service.isLoggedIn() && sso_auth_service.signinSilent();

          if(this.isAuthenticated() && !this.state.user_info && AuthServiceManager.isAuthenticated()) {
              this.getUserInfo();
          }
        }
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const needUpdate = (nextState.database_status && !nextState.database_status.is_master) ||
          this.state.error_msg !== nextState.error_msg ||
          JSON.stringify(this.state.user_info) !== JSON.stringify(nextState.user_info) ||
          this.state.proxy_fetch !== nextState.proxy_fetch;

        return needUpdate;
    }

  updateToken(token, sso_auth) {
      const {user_info} = this.state;
        AuthServiceManager.loadApiToken(token);
        // user_info.modules && supportedModule(modules.provisioning, user_info.modules) && ProvProxiesManager.fetchConfiguration().then(() => this.setState({proxy_fetch: true})).catch(console.log);
        createCookie("auth_sso", sso_auth?'1':'0', 1, '/');  // maxAge = 24hours
        // this.setState({user_info: this.state.user_info});
        this.getUserInfo();
    }

    updateTokens(accessToken, refreshToken) {
        AuthServiceManager.loadJwtTokens(accessToken, refreshToken);
        // ProvProxiesManager.fetchConfiguration().then(() => this.setState({proxy_fetch: true})).catch(console.log);
        // this.setState({user_info: this.state.user_info});
        this.getUserInfo();
    }

    logout() {
        this.setState({user_info: undefined});
        console.log('logout');
        AuthServiceManager.logout();
        localStorage.removeItem("userProfile");
        removeCookie("auth_sso");
        sso_auth_service.removeUser(); // .then(() => this.props.onLanguageUpdate(undefined));
        window.location.reload();
    }

    ssoTokenToLocalToken(user) {
        if(AuthServiceManager.isAuthenticated()) {
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
                this.updateToken(internal_token, true);
                return r;
            })
            .then(r => this.getUserInfo(r.token))
            .catch(console.error);
    }

    isAuthenticated() {
        const local_auth = AuthServiceManager.isAuthenticated();
        if(localStorage.getItem("auth_sso")) {
          sso_auth_service.enableOidc();
          sso_auth_service.manager.events.addUserSignedOut(() => this.logout());
          sso_auth_service.manager.events.addUserLoaded(this.ssoTokenToLocalToken.bind(this));
        }
        const sso_auth = sso_auth_service.isLoggedIn();

        console.log(`local_auth status: ${local_auth}, sso_auth status: ${sso_auth}`);
        return local_auth || sso_auth;
    }

    render() {
        const {database_status, error_msg, user_info, provisioningRoutes} = this.state;
        const is_reset_password = window.location.pathname.substr(0, RESET_PASSWORD_PREFIX.length) === RESET_PASSWORD_PREFIX;
        const standby_alert = database_status && !database_status.is_master && (
            <Alert bsStyle="danger">
                <FormattedMessage id="standby-db-alert" defaultMessage="You are working on a Standby database!"/>
            </Alert>
        );

        // reset password
        if(is_reset_password) {
            return (
                <LoginPage
                    logo={UiFlavourService.isApio() ? apio_logo : null}
                    standby_alert={standby_alert}>
                    <ResetPasswordForm />
                </LoginPage>
            )
        }

        const authenticated = this.isAuthenticated();

        // need to login first
        if(!authenticated || error_msg !== undefined) {
            return (
                <Router>
                    <NotificationSystem ref={this._notificationSystem}/>
                    <Switch>
                        <Route
                            path="/auth-callback/:name"
                            component={props =>
                                <AuthCallback
                                    onLogin={r => {
                                        if (r.access_token) {
                                          this.updateTokens(r.access_token, r.refresh_token);
                                        }
                                    }}
                                    {...props} />
                            }
                            exact/>
                        <Route path="/auth-silent-callback" component={AuthSilentCallback} exact/>
                        <Route path="/" exact>
                            <Redirect to="/dashboard" />
                        </Route>
                        <Route
                            path="/reset-password"
                            component={() => (
                                <LoginPage
                                    error_msg={error_msg}
                                    logo={UiFlavourService.isApio() ? apio_logo : null}
                                    standby_alert={standby_alert} >
                                    <ResetPasswordRequestForm />
                                </LoginPage>
                            )}
                            exact/>
                        <Route
                            component={() => (
                                <LoginPage
                                    error_msg={error_msg}
                                    logo={UiFlavourService.isApio() ? apio_logo : null}
                                    standby_alert={standby_alert} >
                                    <LoginForm
                                        sso={this.state.SSO}
                                        onLogin={r => {
                                            if(r.access_token) {
                                                this.updateTokens(r.access_token, r.refresh_token);
                                            }
                                    }}/>
                                </LoginPage>
                            )} />
                    </Switch>
                </Router>
            )

            //return <LoginPage updateToken={this.updateToken} error_msg={error_msg} standby_alert={standby_alert}/>
        } else if (user_info === undefined) { // get the right level of the user (pages allowance)
            return <Loading/>
        }

        return (
          <Router>
            <div className="App">
                <NotificationSystem ref={this._notificationSystem}/>
                {
                    standby_alert
                }
                <LicenseAlert />
                <div className="App-header">
                    <AsyncApioNavBar
                        user_info={user_info}
                        database_status={database_status}
                        logoutUser={() => logoutUser().catch(console.error).then(this.logout)}/>
                </div>

                <Col mdOffset={1} md={10}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Switch>
                        <Route path="/help"
                               component={props => (
                                   <AsyncApioHelp {...props} />
                               )}
                               exact />
                        <Route path="/help/template-playground"
                               component={props => (
                                   <TemplatePlayground {...props} />
                               )}
                               exact />
                        <Route path="/dashboard"
                               component={props => (
                                   localUser.isAllowed(accesses.dashboard) ?
                                   <Dashboard
                                       user_info={user_info}
                                       notifications={this._notificationSystem.current}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/list"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                   (!user_info.modules || supportedModule(modules.npact, user_info.modules)) ?
                                    <NPRequests
                                        user_info={user_info}
                                        {...props} /> :
                                    <Requests
                                       user_info={user_info}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/custom-transactions/list"
                               component={props => (
                                   localUser.isAllowed(accesses.cron_requests) ?
                                   <CustomRequests
                                       user_info={user_info}
                                       {...props} /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/timers"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                   <Timers /> :
                                   <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/bulk"
                               component={props => (
                                   localUser.isAllowed(accesses.bulks) ?
                                   <Bulks userInfo={user_info}/> :
                                   <NotAllowed/>
                               )}
                               exact />

                        <Route path="/transactions/config/startup_events"
                               component={props => (
                                   localUser.isAllowed(accesses.orchestration) ?
                                       <StartupEvents
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/config/activities/editor"
                               component={props => (
                                   localUser.isAllowed(accesses.orchestration) ?
                                       <Activities user_info={user_info} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/config/activities/editor/:activityId"
                               component={props => (
                                   localUser.isAllowed(accesses.orchestration) ?
                                       <ActivityEditor {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/config/cron_timers"
                               component={props => (
                                   localUser.isAllowed(accesses.orchestration) ?
                                       <CronTimers /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/requests/ndg"
                               component={props => (
                                   localUser.canSee(pages.requests_ndg)?
                                       <NdgHistory
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/requests/:reqId"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <Request
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )} />
                        <Route path="/system/users"
                               component={props => (
                                   localUser.isAllowed(accesses.settings_users) ?
                                       <UserManagement
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/users/audit"
                               component={props => (
                                   localUser.isAllowed(accesses.settings_users) ?
                                       <AuditLogs
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/users/profiles"
                               component={props => (
                                   localUser.isAllowed(accesses.settings_users) ?
                                       <UserProfiles />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/users/roles"
                               component={props => (
                                   localUser.isAllowed(accesses.settings_users) ?
                                       <UserRoles />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/reporting"
                               component={props => (
                                   localUser.canSee(pages.system_reporting)?
                                       <Reporting
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/gateways"
                               component={props => (
                                   localUser.canSee(pages.system_gateways) ?
                                       <Gateways />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/databases"
                               component={props => (
                                   localUser.canSee(pages.system_databases) ?
                                       <Databases
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/queues"
                               component={props => (
                                   localUser.canSee(pages.system_queues) ?
                                       <LocalQueues {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/bulk_actions"
                               component={props => (
                                   localUser.isAllowed(accesses.bulks_actions) ?
                                       <BulkActions {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/templates"
                               component={props => (
                                   localUser.canSee(pages.system_templates) ?
                                       <Templates />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/logs"
                               component={props => (
                                   localUser.canSee(pages.system_logs) ?
                                       <LogsManagement />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/user/profile"
                               component={props => (
                                   <LocalUserProfile
                                       user_info={user_info}
                                       onUserInfoChanged={()=> window.location.reload()} />
                               )}
                               exact />
                        <Route path="/system/config"
                               component={props => (
                                   localUser.isAllowed(accesses.settings) ?
                                       <Configuration userInfo={user_info} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/webhooks"
                               component={props => (
                                   localUser.isAllowed(accesses.settings) ?
                                       <Webhooks
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/public_holidays"
                               component={props => (
                                   localUser.canSee(pages.npact_holidays)?
                                       <PublicHolidays
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/mvno_numbers"
                               component={props => (
                                   localUser.canSee(pages.npact_mvno_numbers) ?
                                       <SearchMVNO
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/porting_cases"
                               component={props => (
                                   localUser.canSee(pages.npact_porting_cases) ?
                                       <SearchPortingCases
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/operators"
                               component={props => (
                                   localUser.canSee(pages.npact_operators) ?
                                       <OperatorManagement
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/ranges"
                               component={props => (
                                   localUser.canSee(pages.npact_ranges) ?
                                       <RangesManagement
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/system/routing_info"
                               component={props => (
                                   localUser.canSee(pages.npact_routing_info) ?
                                       <RoutingInfoManagement
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} />:
                                       <NotAllowed />
                               )}
                               exact />
                        <Route path="/transactions/mobile_events"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <MobileEventsManagement {...props} /> :
                                       <NotAllowed/>
                               )} exact />
                        <Route path="/transactions/new_portin"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <NPPortInRequest
                                           notifications={this._notificationSystem}
                                           user_info={user_info}
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/new_update"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <NPUpdateRequest {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/new_disconnect"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <NPDisconnectRequest
                                           notifications={this._notificationSystem}
                                           user_info={user_info}
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/new_install_address"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                       <NPChangeInstallationAddressRequest
                                           {...props} /> :
                                       <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/emergency_notification"
                               component={() => (
                                    localUser.isAllowed(accesses.requests) ?
                                        <NPEmergencyNotificationRequest /> :
                                        <NotAllowed/>
                               )}
                               exact />
                        <Route path="/transactions/:txId"
                               component={props => (
                                   localUser.isAllowed(accesses.requests) ?
                                   (!user_info.modules || supportedModule(modules.npact, user_info.modules)) ?
                                       <NPTransaction
                                           user_info={user_info}
                                           notifications={this._notificationSystem}
                                           {...props} /> :
                                       <Transaction
                                           user_info={user_info}
                                           notifications={this._notificationSystem.current}
                                           {...props} /> :
                                       <NotAllowed/>
                               )} />
                        <Route path="/auth-silent-callback" component={AuthSilentCallback} exact/>
                        <Route path="/" exact>
                            <Redirect to={localUser.getHomePage()} />
                        </Route>
                        <Route path="/provisioning/list"
                               component={
                                ListProvisioningGateways
                               } exact/>
                        {/*================ Provisioning UI routes ==============*/
                            provisioningRoutes
                        }
                        <Route
                            component={() => <FormattedMessage
                                id="notFound"
                                defaultMessage="Sorry, this page doesn't exist (yet)!" />}
                        />
                    </Switch>
                  </Suspense>
                </Col>
            </div>
          </Router>
        );
    }
}

export default App;
