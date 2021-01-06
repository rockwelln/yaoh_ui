import React, {useState, useEffect} from 'react';
import ReactJson from 'react-json-view';
import Button from 'react-bootstrap/lib/Button';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Tabs from "react-bootstrap/lib/Tabs";
import Alert from "react-bootstrap/lib/Alert";
import Tab from "react-bootstrap/lib/Tab";

import {FormattedMessage} from 'react-intl';

import {fetch_get, fetch_put, NotificationsManager, userLocalizeUtcDate} from "../utils";
import update from 'immutability-helper';
//import Ajv from 'ajv';
import {Panel} from "react-bootstrap";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Modal from "react-bootstrap/lib/Modal";
import {modules} from "../utils/user";

import moment from 'moment';
import {StaticControl} from "../utils/common";


function fetchConfiguration(onSuccess) {
  fetch_get('/api/v01/system/configuration')
    .then(data => onSuccess(data))
    .catch(error =>
      NotificationsManager.error(
        <FormattedMessage id="fetch-config-fail" defaultMessage="Fail configuration fetch"/>,
        error.message
      )
    )
}

function saveConfiguration(entry, onSuccess) {
  fetch_put('/api/v01/system/configuration', entry)
    .then(() => {
        NotificationsManager.success(<FormattedMessage id="config-saved" defaultMessage="Configuration saved"/>)
        onSuccess && onSuccess();
      }
    )
    .catch(error => {
        NotificationsManager.error(
          <FormattedMessage id="fetch-config-fail" defaultMessage="Update configuration failed"/>,
          error.message
        )
      }
    )
}

const newGateway = {
  name: "",
  url: "",
  timeout: 10,
  session_holder: "",
  auth: "default",
  login_url: "/api/v1/login/",
  check: false,
  check_url: "/health",
};

function NewGatewayModal(props) {
  const {show, onHide} = props;
  const [entry, setEntry] = useState(newGateway);

  useEffect(() => {
    !show && setEntry(newGateway)
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          New gateway
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="name" defaultMessage="Name"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.name}
                onChange={e => setEntry(update(entry, {$merge: {name: e.target.value}}))}/>

            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="url" defaultMessage="URL"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.url}
                onChange={e => setEntry(update(entry, {$merge: {url: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="timeout" defaultMessage="Timeout"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.timeout}
                onChange={e => setEntry(update(entry, {$merge: {timeout: e.target.value && parseInt(e.target.value)}}))}/>
              <HelpBlock>
                Timeout in seconds for the connection
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="session-holder" defaultMessage="Session holder"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.session_holder}
                onChange={e => setEntry(update(entry, {$merge: {session_holder: e.target.value}}))}/>
              <HelpBlock>
                A session holder is a name letting workflows getting a prepared session (with auto-login etc...)
                to make some calls.
              </HelpBlock>
            </Col>
          </FormGroup>
          <hr/>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="auth" defaultMessage="Auth"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={entry.auth || "default"}
                onChange={e => setEntry(update(entry, {$merge: {auth: e.target.value}}))}>
                  <option value="default">default</option>
                  <option value="oauth2">oauth2</option>
                  <option value="basic">basic</option>
                  <option value="hawk">hawk</option>
              </FormControl>

            </Col>
          </FormGroup>

          {
            entry.auth !== "hawk" &&
              <>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="login-url" defaultMessage="Login url"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.login_url}
                      onChange={e => setEntry(update(entry, {$merge: {login_url: e.target.value}}))}/>
                    <HelpBlock>
                      Ignored for basic auth
                    </HelpBlock>
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="username" defaultMessage="Username"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.username}
                      onChange={e => setEntry(update(entry, {$merge: {username: e.target.value}}))}/>
                    <HelpBlock>
                      Empty the username to disable the authentication
                    </HelpBlock>
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="password" defaultMessage="Password"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.password}
                      onChange={e => setEntry(update(entry, {$merge: {password: e.target.value}}))}/>
                  </Col>
                </FormGroup>
              </>
          }

            {
              entry.auth === "oauth2" &&
              <>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="client-id" defaultMessage="Client id"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.client_id || ""}
                      onChange={e => setEntry(update(entry, {$merge: {client_id: e.target.value}}))}/>

                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="client-secret" defaultMessage="Client secret"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.client_secret || ""}
                      onChange={e => setEntry(update(entry, {$merge: {client_secret: e.target.value}}))}/>

                  </Col>
                </FormGroup>
              </>
          }

          {
            entry.auth === "hawk" &&
            <>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="app-id" defaultMessage="Application id"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="input"
                    value={entry.id}
                    onChange={e => setEntry(update(entry, {$merge: {id: e.target.value}}))}/>

                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="app-key" defaultMessage="Application secret"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="input"
                    value={entry.key}
                    onChange={e => setEntry(update(entry, {$merge: {key: e.target.value}}))}/>

                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="algo" defaultMessage="Algo."/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="input"
                    value={entry.algorithm || "sha256"}
                    disabled
                    />
                </Col>
              </FormGroup>
            </>
          }

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(entry)}
                disabled={!entry.name || entry.url.length === 0 || entry.name.length === 0}
                bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
        <Button onClick={() => onHide(undefined)}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
      </Modal.Footer>
    </Modal>
  )
}

function GatewaysPanel(props) {
  const {onChange, gateways} = props;
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <HelpBlock>
        This pane contains information about gateways. And allow to configure their monitoring and
        if their session is available to the workflows.
      </HelpBlock>
      {
        Object
          .keys(gateways)
          .sort((a, b) => a.localeCompare(b))
          .map(g => {
            const gateway = gateways[g];
            return (
              <Panel key={`gw-${g}`}>
                <Panel.Heading>
                  <Panel.Title toggle>{g}</Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <Form horizontal>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="url" defaultMessage="URL"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={gateway.url}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {url: e.target.value}}}))}/>
                        <HelpBlock>
                          URL with the '/' at end to reach the gateway
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="timeout" defaultMessage="Timeout"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={gateway.timeout}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {timeout: e.target.value && parseInt(e.target.value)}}}))}/>
                        <HelpBlock>
                          Timeout in seconds for the connection
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="check" defaultMessage="Check"/>
                      </Col>

                      <Col sm={9}>
                        <Checkbox
                          checked={gateway.check}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {check: e.target.checked}}}))
                          }
                        />
                        <HelpBlock>
                          Monitor the status of the gateway and present it to the dashboard.
                          (The gateway has to support some protocols to be integrated properly)
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="check-url" defaultMessage="Check url"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          placeHolder="/health"
                          value={gateway.check_url}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {check_url: e.target.value || undefined}}}))}/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="session-holder" defaultMessage="Session holder"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={gateway.session_holder}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {session_holder: e.target.value}}}))}/>
                        <HelpBlock>
                          A session holder is a name letting workflows getting a prepared session (with auto-login
                          etc...)
                          to make some calls.
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <hr/>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="auth" defaultMessage="Auth"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="select"
                          value={gateway.auth || "default"}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {auth: e.target.value}}}))}>
                            <option value="default">default</option>
                            <option value="oauth2">oauth2</option>
                            <option value="basic">basic</option>
                            <option value="hawk">hawk</option>
                        </FormControl>

                      </Col>
                    </FormGroup>

                    {
                      gateway.auth !== "hawk" &&
                        <>
                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="login-url" defaultMessage="Login url"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="input"
                                value={gateway.login_url}
                                placeholder="/auth/login"
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {login_url: e.target.value}}}))}/>
                              <HelpBlock>
                                Ignored for basic auth.
                              </HelpBlock>
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="username" defaultMessage="Username"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="input"
                                value={gateway.username}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {username: e.target.value}}}))}/>
                                <HelpBlock>
                                  Empty the username to disable the authentication
                                </HelpBlock>
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="password" defaultMessage="Password"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="input"
                                value={gateway.password}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {password: e.target.value}}}))}/>

                            </Col>
                          </FormGroup>
                        </>
                    }

                    {
                      gateway.auth === "oauth2" &&
                      <>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="client-id" defaultMessage="Client id"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              value={gateway.client_id}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {client_id: e.target.value}}}))}/>

                          </Col>
                        </FormGroup>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="client-secret" defaultMessage="Client secret"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              value={gateway.client_secret}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {client_secret: e.target.value}}}))}/>

                          </Col>
                        </FormGroup>
                      </>
                    }

                    {
                      gateway.auth === "hawk" &&
                      <>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="app-id" defaultMessage="Application id"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              value={gateway.id}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {id: e.target.value}}}))}/>

                          </Col>
                        </FormGroup>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="app-key" defaultMessage="Application secret"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              value={gateway.key}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {key: e.target.value}}}))}/>

                          </Col>
                        </FormGroup>

                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="algo" defaultMessage="Algo."/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              value={gateway.algorithm || "sha256"}
                              disabled
                              />
                          </Col>
                        </FormGroup>
                      </>
                    }

                    <FormGroup>
                      <Col smOffset={2} sm={9}>
                        <ButtonToolbar>
                          <Button bsStyle="danger" onClick={() => onChange(update(gateways, {$unset: [g]}))}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                          </Button>
                        </ButtonToolbar>
                      </Col>
                    </FormGroup>

                  </Form>
                </Panel.Body>
              </Panel>
            );
          })
      }

      <Panel>
        <Panel.Body>
          <ButtonToolbar>
            <Button onClick={() => setShowNew(true)} bsStyle="primary">
              <FormattedMessage id="new" defaultMessage="New"/>
            </Button>
          </ButtonToolbar>
          <NewGatewayModal
            show={showNew}
            onHide={newEntry => {
              setShowNew(false);
              if (newEntry !== undefined) {
                const name = newEntry.name;
                delete newEntry.name;
                onChange(update(gateways, {[name]: {$set: newEntry}}))
              }
            }}
          />
        </Panel.Body>
      </Panel>
    </>
  )
}


function GuiForm(props) {
  const { gui, onChange } = props;
  if (gui.modules === undefined) {
    gui.modules = [];
  }

  return (
    <>
      <Panel>
        <Panel.Body>
          <Form>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="is-prod" defaultMessage="Is prod?"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={gui.prod}
                  onChange={e => onChange(update(gui, {$merge: {prod: e.target.checked}}))}/>
                <HelpBlock>
                  Indicate if the platform is used in a Live environment or Lab test.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="modules" defaultMessage="Modules"/>
              </Col>

              <Col sm={9}>
                {
                  Object.keys(modules).map(m =>
                    <Checkbox
                      key={`modules-${m}`}
                      checked={gui.modules.includes(m)}
                      onChange={e => {
                        e.target.checked ?
                          onChange(update(gui, {modules: {$push: [m]}})) :
                          onChange(update(gui, {modules: {$splice: [[gui.modules.findIndex(mod => mod === m), 1]]}}))
                      }}>{m}</Checkbox>
                  )
                }
                <HelpBlock>
                  List of active modules drives features available in the GUI
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="welcome-mail-template" defaultMessage="Default welcome mail template"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={gui.welcome_mail_template}
                  onChange={e => onChange(update(gui, {$merge: {welcome_mail_template: e.target.value}}))}/>
                <HelpBlock>
                  The template used for new users created in the workflow engine datamodel.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="reset-password-mail-template"
                                  defaultMessage="Default reset password mail template"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={gui.reset_password_mail_template}
                  onChange={e => onChange(update(gui, {$merge: {reset_password_mail_template: e.target.value}}))}/>
                <HelpBlock>
                  The template used for new reset password mail created for users defined in the workflow engine
                  datamodel.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="activate 2fa" defaultMessage="Activate 2-factor auth."/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={(gui["2fa"] || {}).active}
                  onChange={e => onChange(update(gui, {$merge: {"2fa": update(gui["2fa"] || {}, {$merge: {active: e.target.checked}})}}))}/>
                <HelpBlock>
                  Activating the 2-factor auth. requires a mail template to be properly set.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="email-template" defaultMessage="2-factor auth. email template"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={(gui["2fa"] || {}).email_template}
                  onChange={e => onChange(update(gui, {$merge: {"2fa": update(gui["2fa"] || {}, {$merge: {email_template: e.target.value}})}}))}/>
                <HelpBlock>
                  Refer to the "templates" sub-menu
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="http-header" defaultMessage="2-factor auth. HTTP header"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={(gui["2fa"] || {}).http_header}
                  onChange={e => onChange(update(gui, {$merge: {"2fa": update(gui["2fa"] || {}, {$merge: {http_header: e.target.value}})}}))}/>
                <HelpBlock>
                  The 2-factor auth. process use the client IP, if the platform is behind a proxy, the client IP has be forwarded in an HTTP header (e.g X-FORWARDED-FOR-IP). Otherwise, use the request source IP.
                </HelpBlock>
              </Col>
            </FormGroup>

          </Form>
        </Panel.Body>
      </Panel>
    </>
  )
}


function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

const default_sso = {
  protocol: "",
  saml: {
    strict: true,
    idp: {
      'entityId': '',
      'singleSignOnService': {
        'url': '',
        'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
      },
      'singleLogoutService': {
        'url': '',
        'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
      },
      'x509cert': '',
      'certFingerprint': '',
      'certFingerprintAlgorithm': 'sha1'
      },
    sp: {
      'assertionConsumerService': {
          'url': 'http://localhost:5000/api/v01/auth/login_saml',
          'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
      },
      'singleLogoutService': {
          'url': 'http://localhost:5000/api/v01/auth/saml?sls',
          'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
      },
      'NameIDFormat': 'urn:oasis:names:tc:SAML:2.0:nameid-format:unspecified',
      'entityId': 'http://localhost:5000',
      'x509cert': '',
      'privateKey': ''
    },
    security: {
      'authnRequestsSigned': true,
      'wantAssertionsSigned': false,
      'nameIdEncrypted': false,
      'metadataValidUntil': null,
      'metadataCacheDuration': null,
      'logoutRequestSigned': true,
      'logoutResponseSigned': false,
      'signMetadata': false,
      'wantMessagesSigned': false,
      'wantNameId': true,
      'wantAssertionsEncrypted': false,
      'wantNameIdEncrypted': false,
      'signatureAlgorithm': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
      'digestAlgorithm': 'http://www.w3.org/2001/04/xmlenc#sha512',
      'wantAttributeStatement': true,
      'requestedAuthnContext': true,
      'requestedAuthnContextComparison': 'exact',
      'failOnAuthnContextMismatch': false
    },
    default_email_host: "",
    default_user_profile: "",
    default_user_ui_profile: "user",
    default_user_is_system: false,
    contactPerson: {
      "support": {
          "givenName": "support",
          "emailAddress": "support@netaxis.be"
      }
    },
    organization: {
      "en-US": {
        "name": "Netaxis SA",
        "displayname": "Netaxis (APIO)",
        "url": "https://www.netaxis.be"
      }
    }
  },
  oidc: {
    claim_url: "",
  }
}

function SSOPanel(props) {
  const {sso, onChange} = props;
  const [idpRemoteMetadataUrl, setIdpRemoteMetadataUrl] = useState("");
  const [loadError, setLoadError] = useState("");

  const sso_ = mergeDeep(default_sso, sso);

  return (
    <>
      <Panel>
        <Panel.Body>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="protocol" defaultMessage="Protocol"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={sso_.protocol}
                  onChange={e => onChange(update(sso_, {$merge: {protocol: e.target.value}}))}>
                  <option value=""/>
                  <option value="oidc">Open IDConnection</option>
                  <option value="saml">SAML</option>
                </FormControl>
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>
      <Panel>
        <Panel.Heading>
          <Panel.Title>OIDC</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
        </Panel.Body>
      </Panel>
      <Panel>
        <Panel.Heading>
          <Panel.Title>SAML</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <Form horizontal>
            <h4>IDP</h4>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="entity-id" defaultMessage="Entity ID"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.idp.entityId}
                  onChange={e => onChange(update(sso_, {saml: {idp: {$merge: {entityId: e.target.value}}}}))}/>
                <HelpBlock>
                  Must be a URI
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sso-url" defaultMessage="SSO Url"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.idp.singleSignOnService.url}
                  onChange={e => onChange(update(sso_, {saml: {idp: {singleSignOnService: {$merge: {url: e.target.value}}}}}))}/>
                <HelpBlock>
                  Must be a URI
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sso-binding" defaultMessage="SSO Binding"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={sso_.saml.idp.singleSignOnService.binding}
                  onChange={e => onChange(update(sso_, {saml: {idp: {singleSignOnService: {$merge: {binding: e.target.value}}}}}))}>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect">HTTP redirect</option>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">POST</option>
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sls-url" defaultMessage="SLS Url"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.idp.singleLogoutService.url}
                  onChange={e => onChange(update(sso_, {saml: {idp: {singleLogoutService: {$merge: {url: e.target.value}}}}}))}/>
                <HelpBlock>
                  Must be a URI
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="SLS-binding" defaultMessage="SLS Binding"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={sso_.saml.idp.singleLogoutService.binding}
                  onChange={e => onChange(update(sso_, {saml: {idp: {singleLogoutService: {$merge: {binding: e.target.value}}}}}))}>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect">HTTP redirect</option>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">POST</option>
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="x509-certificate" defaultMessage="x509 certificate"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="textarea"
                  value={sso_.saml.idp.x509cert}
                  onChange={e => onChange(update(sso_, {saml: {idp: {$merge: {x509cert: e.target.value}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="import-metadata" defaultMessage="Load remote metadata"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={idpRemoteMetadataUrl}
                  onChange={e => setIdpRemoteMetadataUrl(e.target.value)} />
                <Button bsStyle="primary" onClick={() => {
                  setLoadError("");
                  fetch_get(`/api/v01/auth/saml/metadata_2_json?url=${idpRemoteMetadataUrl}`)
                    .then(r => onChange(update(sso_, {saml: {$set: mergeDeep(sso_.saml, r)}})))
                    .catch(e => setLoadError(e.message))
                }}>
                  Fetch
                </Button>
                {loadError && <p style={{color: "red"}}>{loadError}</p>}
              </Col>
            </FormGroup>

            <h4>SP</h4>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="entity-id" defaultMessage="Entity ID"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.sp.entityId}
                  onChange={e => onChange(update(sso_, {saml: {sp: {$merge: {entityId: e.target.value}}}}))}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="NameIDFormat" defaultMessage="NameID Format"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  disabled
                  value={sso_.saml.sp.NameIDFormat}
                  onChange={e => onChange(update(sso_, {saml: {sp: {$merge: {NameIDFormat: e.target.value}}}}))}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="acs-url" defaultMessage="Assertion Consumer Service Url"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.sp.assertionConsumerService.url}
                  onChange={e => onChange(update(sso_, {saml: {sp: {assertionConsumerService: {$merge: {url: e.target.value}}}}}))}/>
                <HelpBlock>
                  Only the base URI should be changed
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="acs-binding" defaultMessage="Assertion Consumer Service Binding"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  disabled
                  value={sso_.saml.sp.assertionConsumerService.binding}
                  onChange={e => onChange(update(sso_, {saml: {sp: {assertionConsumerService: {$merge: {binding: e.target.value}}}}}))}>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect">HTTP redirect</option>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">POST</option>
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sls-url" defaultMessage="SLS Url"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.sp.singleLogoutService.url}
                  onChange={e => onChange(update(sso_, {saml: {sp: {singleLogoutService: {$merge: {url: e.target.value}}}}}))}/>
                <HelpBlock>
                  Must be a URI
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="SLS-binding" defaultMessage="SLS Binding"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  disabled
                  value={sso_.saml.sp.singleLogoutService.binding}
                  onChange={e => onChange(update(sso_, {saml: {sp: {singleLogoutService: {$merge: {binding: e.target.value}}}}}))}>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect">HTTP redirect</option>
                  <option value="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">POST</option>
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="x509-certificate" defaultMessage="x509 certificate"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="textarea"
                  value={sso_.saml.sp.x509cert}
                  onChange={e => onChange(update(sso_, {saml: {sp: {$merge: {x509cert: e.target.value}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="x509-private-key" defaultMessage="x509 private key"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="textarea"
                  value={sso_.saml.sp.privateKey}
                  onChange={e => onChange(update(sso_, {saml: {sp: {$merge: {privateKey: e.target.value}}}}))} />
              </Col>
            </FormGroup>

            <h4>Security</h4>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="authnRequestsSigned" defaultMessage="AuthnRequests Signed"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.authnRequestsSigned}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {authnRequestsSigned: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantAssertionsSigned" defaultMessage="Want Assertions Signed"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantAssertionsSigned}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantAssertionsSigned: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="nameIdEncrypted" defaultMessage="nameId Encrypted"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.nameIdEncrypted}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {nameIdEncrypted: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="logoutRequestSigned" defaultMessage="logoutRequest Signed"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.logoutRequestSigned}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {logoutRequestSigned: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="logoutResponseSigned" defaultMessage="logoutResponse Signed"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.logoutResponseSigned}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {logoutResponseSigned: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="signMetadata" defaultMessage="Sign Metadata"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.signMetadata}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {signMetadata: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantMessagesSigned" defaultMessage="Want Messages Signed"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantMessagesSigned}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantMessagesSigned: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantNameId" defaultMessage="Want Name Id"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantNameId}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantNameId: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantAssertionsEncrypted" defaultMessage="Want Assertions Encrypted"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantAssertionsEncrypted}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantAssertionsEncrypted: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantNameIdEncrypted" defaultMessage="Want Name Id Encrypted"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantNameIdEncrypted}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantNameIdEncrypted: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="wantAttributeStatement" defaultMessage="Want Attribute Statement"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.wantAttributeStatement}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {wantAttributeStatement: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="requestedAuthnContext" defaultMessage="Requested AuthnContext"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.requestedAuthnContext}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {requestedAuthnContext: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="requestedAuthnContextComparison" defaultMessage="Requested AuthnContext Comparison"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  disabled
                  value={sso_.saml.security.requestedAuthnContextComparison}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {requestedAuthnContextComparison: e.target.value}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="failOnAuthnContextMismatch" defaultMessage="Fail On AuthnContext Mismatch"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  disabled
                  checked={sso_.saml.security.failOnAuthnContextMismatch}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {failOnAuthnContextMismatch: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="signatureAlgorithm" defaultMessage="Signature Algorithm"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  disabled
                  value={sso_.saml.security.signatureAlgorithm}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {signatureAlgorithm: e.target.value}}}}))} >
                  <option value="http://www.w3.org/2001/04/xmldsig-more#rsa-sha512">RSA-SHA512</option>
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="digestAlgorithm" defaultMessage="Digest Algorithm"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  disabled
                  value={sso_.saml.security.digestAlgorithm}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {digestAlgorithm: e.target.value}}}}))} >
                  <option value="http://www.w3.org/2001/04/xmlenc#sha512">SHA512</option>
                </FormControl>
              </Col>
            </FormGroup>

            <h4>Misc</h4>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="default_email_host" defaultMessage="Default email hostname"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.default_email_host}
                  onChange={e => onChange(update(sso_, {saml: {$merge: {default_email_host: e.target.value}}}))} />
                <HelpBlock>
                  In case the email is not provided by the IdP, the email field will be composed as (email)@(default email host).
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="default_user_profile" defaultMessage="Default user profile"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.default_user_profile}
                  onChange={e => onChange(update(sso_, {saml: {$merge: {default_user_profile: e.target.value}}}))} />
                <HelpBlock>
                  When a new user is logged in, it's created with this user profile (must be defined in the user profiles).
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="default_user_ui_profile" defaultMessage="Default user UI profile"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={sso_.saml.default_user_ui_profile}
                  onChange={e => onChange(update(sso_, {saml: {$merge: {default_user_ui_profile: e.target.value}}}))} />
                <HelpBlock>
                  When a new user is logged in, it's created with this user UI profile (e.g user, admin, etc...).
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="default_user_is_system" defaultMessage="Default user is system flag"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={sso_.saml.security.default_user_is_system}
                  onChange={e => onChange(update(sso_, {saml: {security: {$merge: {default_user_is_system: e.target.checked}}}}))} />
              </Col>
            </FormGroup>

          </Form>
        </Panel.Body>
      </Panel>
      </>
  )
}


function fetchLicenseDetails(onSuccess) {
    return fetch_get("/api/v01/system/configuration/license")
      .then(onSuccess)
}

function loadLicense(value, onSuccess) {
    return fetch_put("/api/v01/system/configuration/license", {"license": value})
      .then(onSuccess)
}

function LicensePanel(props) {
    const [newLicense, setNewLicense] = useState("");
    const [newDetails, setNewDetails] = useState(null);
    const [current, setCurrent] = useState({});

    useEffect(() => {
      fetchLicenseDetails(setCurrent);
    }, []);

    return (
    <Panel>
      <Panel.Body>
        <Form horizontal>
          <StaticControl label="Valid until" value={current.valid_until}/>
          <StaticControl label="Assigned to" value={current.customer_name}/>
          <StaticControl label="Demo" value={current.demo ? "yes": "no"}/>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="new_license" defaultMessage="New license"/>
            </Col>
            <Col sm={9}>
              <FormControl
                componentClass="textarea"
                rows={10}
                value={newLicense}
                onChange={e => setNewLicense(e.target.value)}/>
              {newDetails &&
                <HelpBlock>
                {`new license valid until ${newDetails.valid_until} for ${newDetails.customer_name} (don't forget to save and refresh your page to actually see the license beeing taken into account)`}
                </HelpBlock>
              }
              <Button
                onClick={() => {
                  setNewDetails(null);
                  loadLicense(newLicense, details => {
                    // onChange(update(license, {$set: newLicense}));
                    setNewDetails(details);
                    window.location.reload(); // refresh the page to cleanup possible alerts
                  }).catch(e => NotificationsManager.error("Failed to load a new license", e.message))
                }}
                bsStyle="primary" >
                Load
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
    );
}

function PasswordPanel(props) {
    const {password, onChange} = props;

    return (
    <Panel>
      <Panel.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="min length" defaultMessage="Min. length"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={password.min_length || ""}
                onChange={e => onChange(update(password, {$merge: {min_length: e.target.value?parseInt(e.target.value, 10):""}}))}/>
              <HelpBlock>
                Minimal length for a new password.
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce lowercase" defaultMessage="Enforce use of lowercase char."/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.lowercase === undefined ? true : password.lowercase}
                onChange={e => onChange(update(password, {$merge: {lowercase: e.target.checked}}))}/>
              <HelpBlock>
                The password have to contain at least 1 lower case characters (a-z)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce uppercase" defaultMessage="Enforce use of uppercase char."/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.uppercase}
                onChange={e => onChange(update(password, {$merge: {uppercase: e.target.checked}}))}/>
              <HelpBlock>
                The password have to contain at least 1 upper case characters (A-Z)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce digits" defaultMessage="Enforce use of digits char."/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.digits}
                onChange={e => onChange(update(password, {$merge: {digits: e.target.checked}}))}/>
              <HelpBlock>
                The password have to contain at least 1 digit (0-9)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce special char" defaultMessage="Enforce use of special char."/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.special_chars}
                onChange={e => onChange(update(password, {$merge: {special_chars: e.target.checked}}))}/>
              <HelpBlock>
                The password have to contain at least 1 special character (%()*./:;?[]_-)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="History" defaultMessage="History"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={password.duplicate_limit || ""}
                onChange={e => onChange(update(password, {$merge: {duplicate_limit: e.target.value?parseInt(e.target.value, 10):""}}))}/>
              <HelpBlock>
                Check for duplicate password amongst the n previous password(s)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce entropy" defaultMessage="Min. entropy"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={password.min_entropy || ""}
                onChange={e => onChange(update(password, {$merge: {min_entropy: e.target.value?parseInt(e.target.value, 10):""}}))}/>
              <HelpBlock>
                Enforce the minimal entropy of new password (formula: length(password) * log2(length(&lt;all alphabets represented in the password&gt;)))
              </HelpBlock>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
    )
}


function SMTPForm(props) {
  const {smtp, onChange} = props;

  return (
    <Panel>
      <Panel.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="from" defaultMessage="From"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={smtp.from}
                onChange={e => onChange(update(smtp, {$merge: {from: e.target.value}}))}/>
              <HelpBlock>
                Sender address to be used in the mails sent by the platform.
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="host" defaultMessage="Host"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={smtp.host}
                onChange={e => onChange(update(smtp, {$merge: {host: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="port" defaultMessage="Port"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={smtp.port}
                onChange={e => onChange(update(smtp, {$merge: {port: e.target.value && parseInt(e.target.value)}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="username" defaultMessage="Username"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={smtp.username}
                onChange={e => onChange(update(smtp, {$merge: {username: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="password" defaultMessage="Password"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={smtp.password}
                onChange={e => onChange(update(smtp, {$merge: {password: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="ssl" defaultMessage="SSL"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={smtp.ssl}
                onChange={e => onChange(update(smtp, {$merge: {ssl: e.target.checked}}))}/>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

const newLog = {
  name: "",
  filename: ""
};

function NewLogModal(props) {
  const {show, onHide} = props;
  const [entry, setEntry] = useState(newLog);

  useEffect(() => {
    !show && setEntry(newLog)
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          New Log entry
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="name" defaultMessage="Name"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.name}
                onChange={e => setEntry(update(entry, {$merge: {name: e.target.value}}))}/>

            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="filename" defaultMessage="Filename"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.filename}
                onChange={e => setEntry(update(entry, {$merge: {filename: e.target.value}}))}/>

            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(entry)}
                disabled={!entry.name || entry.filename.length === 0 || entry.name.length === 0}
                bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
        <Button onClick={() => onHide(undefined)}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
      </Modal.Footer>
    </Modal>
  );
}


function LogsPanel(props) {
  const {logs, onChange} = props;
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      {
        Object
          .keys(logs)
          .sort((a, b) => a.localeCompare(b))
          .map(l => {
            const log = logs[l];
            return (
              <Panel key={`lg-${l}`}>
                <Panel.Heading>
                  <Panel.Title toggle>
                    {l}
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <Form horizontal>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="filename" defaultMessage="Filename"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={log.filename}
                          onChange={e => onChange(update(logs, {[l]: {$merge: {filename: e.target.value}}}))}/>
                        <HelpBlock>
                          filename prefix to be served.
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col smOffset={2} sm={9}>
                        <ButtonToolbar>
                          <Button bsStyle="danger" onClick={() => onChange(update(logs, {$unset: [l]}))}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                          </Button>
                        </ButtonToolbar>
                      </Col>
                    </FormGroup>
                  </Form>
                </Panel.Body>
              </Panel>
            )
          })
      }

      <Panel>
        <Panel.Body>
          <ButtonToolbar>
            <Button onClick={() => setShowNew(true)} bsStyle="primary">
              <FormattedMessage id="new" defaultMessage="New"/>
            </Button>
          </ButtonToolbar>
          <NewLogModal
            show={showNew}
            onHide={newEntry => {
              setShowNew(false);
              if (newEntry !== undefined) {
                const name = newEntry.name;
                delete newEntry.name;
                onChange(update(logs, {[name]: {$set: newEntry}}));
              }
            }}
          />
        </Panel.Body>
      </Panel>
    </>
  )
}

const newProvisioningGateway = {
  name: "",
  prefix: ""
};

function NewProvisioningGatewayModal(props) {
  const {show, onHide} = props;
  const [entry, setEntry] = useState(newProvisioningGateway);

  useEffect(() => {
    !show && setEntry(newProvisioningGateway)
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          New gateway
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="name" defaultMessage="Name"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.name}
                onChange={e => setEntry(update(entry, {$merge: {name: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="prefix" defaultMessage="Prefix"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.prefix}
                placeholder="/api/v01/p1"
                onChange={e => setEntry(update(entry, {$merge: {prefix: e.target.value}}))}/>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(entry)}
                disabled={!entry.name || entry.prefix.length === 0 || entry.name.length === 0}
                bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
        <Button onClick={() => onHide(undefined)}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
      </Modal.Footer>
    </Modal>
  );
}

function ProvisioningPanels(props) {
  const { prov, onChange } = props;
  const [showNew, setShowNew] = useState(false);
  if (prov.gateways === undefined) {
    prov.gateways = [];
  }

  return (
    <>
      {
        prov.gateways
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((g, i) => (
              <Panel key={`prov-gw-${g.name}`}>
                <Panel.Heading>
                  <Panel.Title toggle>{g.name}</Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <Form horizontal>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="name" defaultMessage="Name"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={g.name}
                          readOnly/>
                        <HelpBlock>
                          Label to identify the provisioning gateway in the GUI menu
                        </HelpBlock>
                      </Col>
                    </FormGroup>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="prefix" defaultMessage="Prefix"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={g.prefix}
                          placeholder="/api/v01/p1"
                          onChange={e => onChange(update(prov, {gateways: {[i]: {$merge: {prefix: e.target.value}}}}))}/>
                        <HelpBlock>
                          Indicate the unique API prefix used to target the proxy gateway.
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col smOffset={2} sm={9}>
                        <ButtonToolbar>
                          <Button bsStyle="danger"
                                  onClick={() => onChange(update(prov, {gateways: {$splice: [[i, 1]]}}))}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                          </Button>
                        </ButtonToolbar>
                      </Col>
                    </FormGroup>
                  </Form>
                </Panel.Body>
              </Panel>
            )
          )
      }

      <Panel>
        <Panel.Body>
          <ButtonToolbar>
            <Button onClick={() => setShowNew(true)} bsStyle="primary">
              <FormattedMessage id="new" defaultMessage="New"/>
            </Button>
          </ButtonToolbar>
          <NewProvisioningGatewayModal
            show={showNew}
            onHide={newEntry => {
              setShowNew(false);
              if (newEntry !== undefined) {
                onChange(update(prov, {gateways: {$push: [newEntry]}}))
              }
            }}
          />
        </Panel.Body>
      </Panel>
    </>
  );
}

export default function Configuration(props) {
  const [activeKey, setActiveKey] = useState(1);
  const [config, setConfig] = useState({});
  const {userInfo} = props;

  useEffect(() => {
    fetchConfiguration(setConfig);
    document.title = "Configuration"
  }, []);
  const editConfig = e => setConfig(update(config, {$merge: {content: e.updated_src}}));

  // const ajv = new Ajv();

  if (config.content === undefined) {
    return <div/>
  }

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="configuration"
                                                  defaultMessage="Configuration"/></Breadcrumb.Item>
      </Breadcrumb>
      <Tabs defaultActiveKey={1} onSelect={key => setActiveKey(key)} id="config-tabs">
        <Tab eventKey={1} title="Gateways">
          <GatewaysPanel
            gateways={config.content.gateways}
            onChange={v => setConfig(update(config, {content: {gateways: {$set: v}}}))}/>
        </Tab>
        <Tab eventKey={2} title="Gui">
          <GuiForm
            gui={config.content.gui}
            onChange={v => setConfig(update(config, {content: {gui: {$merge: v}}}))}/>
        </Tab>
        <Tab eventKey={3} title="SMTP">
          <SMTPForm
            smtp={config.content.smtp}
            onChange={v => setConfig(update(config, {content: {smtp: {$merge: v}}}))}
          />
        </Tab>
        <Tab eventKey={4} title="Reports">
          <Alert bsStyle="danger">
            Use the configuration page for reports.
          </Alert>
        </Tab>
        <Tab eventKey={5} title="Provisioning">
          <ProvisioningPanels
            prov={config.content.provisioning || {}}
            onChange={v => setConfig(update(config, {content: {provisioning: {$merge: v}}}))}
          />
        </Tab>
        <Tab eventKey={6} title="Logs">
          <LogsPanel
            logs={config.content.logs || {}}
            onChange={v => setConfig(update(config, {content: {logs: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={7} title="Password">
          <PasswordPanel
            password={config.content.password || {}}
            onChange={v => setConfig(update(config, {content: {password: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={8} title="SSO">
          <SSOPanel
            sso={config.content.SSO || {}}
            onChange={v => setConfig(update(config, {content: {SSO: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={9} title="License">
          <LicensePanel />
        </Tab>
        <Tab eventKey={10} title="Raw">
          {
            activeKey === 10 && config.content &&
            <ReactJson
              src={config.content}
              onEdit={editConfig}
              onAdd={editConfig}
              onDelete={editConfig}
            />
          }
        </Tab>
      </Tabs>
      <Button onClick={() => saveConfiguration(config.content)}>
        <FormattedMessage id='save' defaultMessage='save'/>
      </Button>
      <br/>
      <FormattedMessage id='id' defaultMessage='ID'/>{`: ${config.config_id}`}<br/>
      <FormattedMessage id='last-edit' defaultMessage='Last edit'/>{`: ${userLocalizeUtcDate(moment.utc(config.created_on), userInfo).format()}`}
    </>
  );
}
