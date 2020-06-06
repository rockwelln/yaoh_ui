import React, {useState, useEffect} from 'react';
import ReactJson from 'react-json-view';
import Button from 'react-bootstrap/lib/Button';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Tabs from "react-bootstrap/lib/Tabs";
import Alert from "react-bootstrap/lib/Alert";
import Tab from "react-bootstrap/lib/Tab";

import {FormattedMessage} from 'react-intl';

import {fetch_get, fetch_put, NotificationsManager} from "../utils";
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
  check: false
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
              </FormControl>

            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="login-url" defaultMessage="Login url"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.login_url}
                onChange={e => setEntry(update(entry, {$merge: {login_url: e.target.value}}))}/>
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
                        </FormControl>

                      </Col>
                    </FormGroup>

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
  const {gui, onChange} = props;

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
                  ["orange", "orchestration", "bulk", "provisioning", "telenet", "proxy", "manualActions"].map(m =>
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
          </Form>
        </Panel.Body>
      </Panel>
    </>
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
  const {prov, onChange} = props;
  const [showNew, setShowNew] = useState(false);

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

  useEffect(() => fetchConfiguration(setConfig), []);
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
        <Tab eventKey={7} title="Raw">
          {
            activeKey === 7 && config.content &&
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
      <FormattedMessage id='last-edit' defaultMessage='Last edit'/>{`: ${config.created_on}`}
    </>
  );
}
