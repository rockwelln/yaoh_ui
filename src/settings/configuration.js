import React, {useState, useEffect} from 'react';
import ReactJson from 'react-json-view';
import Button from 'react-bootstrap/lib/Button';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";

import {FormattedMessage} from 'react-intl';

import {fetch_get, fetch_post, fetch_put, NotificationsManager, userLocalizeUtcDate} from "../utils";
import update from 'immutability-helper';
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
import Select from "react-select";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Table from "react-bootstrap/lib/Table";
import {useLocation} from "react-router";
import {HttpHeaders} from "../orchestration/nodeInputs";
import { fetchActivities } from '../orchestration/activity-editor';


function fetchConfiguration(raw, onSuccess) {
  var u = '/api/v01/system/configuration';
  if (raw) {
    u += '?r=true';
  }
  return fetch_get(u)
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
  backup_urls: [],
  timeout: 10,
  session_holder: "",
  auth: "default",
  tls_verify: true,
  login_url: "/api/v1/login/",
  check: false,
  check_url: "/health",
  client_tls_cert: null,
  client_tls_key: null,
};

function NewGatewayModal(props) {
  const {show, onHide} = props;
  const [entry, setEntry] = useState(newGateway);
  const [newProp, setNewProp] = useState({key: "", value: ""});
  const [newBackupUrl, setNewBackupUrl] = useState("");

  useEffect(() => {
    if(!show) {
      setEntry(newGateway)
      setNewProp({key: "", value: ""});
    }
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false} bsSize={"large"}>
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
              <FormattedMessage id="backup-urls" defaultMessage="Backup URL's"/>
            </Col>

            <Col sm={9}>
              <Table>
                <tbody>
                  {
                    entry.backup_urls.map((u, i) => (
                      <tr key={`${u}-${i}`}>
                        <td>
                          {u}
                        </td>
                        <td>
                          <Button onClick={() => {
                            setEntry(update(entry, {$merge: {backup_urls: {$splice: [[i, 1]]}}}))
                            }}>-</Button>
                        </td>
                      </tr>
                    ))
                  }
                  <tr>
                    <td>
                      <FormControl
                        componentClass="input"
                        value={newBackupUrl}
                        placeholder="backup url"
                        onChange={e => setNewBackupUrl(e.target.value)}/>
                    </td>
                    <td>
                      <Button 
                        disabled={newBackupUrl.length === 0 || entry.backup_urls.length >= 3}
                        onClick={() => {
                          setEntry(update(entry, {$merge: {backup_urls: {$push: [newBackupUrl]}}}));
                        setNewBackupUrl("");
                      }}>+</Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <HelpBlock>
                Backup url's are used in order following a network error event.<br/>
                There is no retry mechanism in place (as we can't assume the operation was succesful or not).
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="tls-verify" defaultMessage="TLS verify"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={entry.tls_verify}
                onChange={e => setEntry(update(entry, {$merge: {tls_verify: e.target.checked}}))}/>
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
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="proxy" defaultMessage="Proxy"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                placeholder="http://proxy_host:8080/"
                value={entry.proxies}
                onChange={e => setEntry(update(entry, {$merge: {proxies: e.target.value}}))}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="headers" defaultMessage="Headers"/>
            </Col>

            <Col sm={9}>
              <HttpHeaders
                value={entry.headers}
                onChange={e => setEntry(update(entry, {$merge: {headers: e}}))} />
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
                  <option value="oauth1">oauth1</option>
                  <option value="oauth2">oauth2</option>
                  <option value="basic">basic</option>
                  <option value="hawk">hawk</option>
                  <option value="oracle-sbc">oracle sbc</option>
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
              (entry.auth === "oauth2" || entry.auth === "oauth1") &&
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
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="grant-type" defaultMessage="Grant type"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      placeholder={"password"}
                      value={entry.grant_type || ""}
                      onChange={e => setEntry(update(entry, {$merge: {grant_type: e.target.value}}))}/>
                  </Col>
                </FormGroup>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="extra-params" defaultMessage="Extra params"/>
                  </Col>

                  <Col sm={9}>
                    <Table>
                      <tbody>
                        {
                          entry.extra_params && Object.entries(entry.extra_params).map(([key, value]) => (
                            <tr key={`extra-p-${key}`}>
                              <td>{key}</td>
                              <td>{value}</td>
                              <td><Button onClick={() => {
                                  setEntry(update(entry, {extra_params: {$unset: [key]}}))
                              }}>-</Button></td>
                            </tr>
                          ))
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
                                    if(entry.extra_params === undefined) {
                                      setEntry(update(entry, {$merge: {extra_params: {[newProp.key]: newProp.value}}}))
                                    } else {
                                      setEntry(update(entry, {extra_params: {$merge: {[newProp.key]: newProp.value}}}))
                                    }
                                    setNewProp({key: "", value: ""});
                                }}>+</Button>
                            </td>
                        </tr>
                      </tbody>
                    </Table>
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

          {
            entry.url.startsWith("https") && <>
              <hr/>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="tls client cert" defaultMessage="TLS client certificate"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="textarea"
                    rows={10}
                    placeholder={"fill only to use mTLS"}
                    style={{resize: "vertical"}}
                    value={entry.client_tls_cert || ""}
                    onChange={e => setEntry(update(entry, {$merge: {client_tls_cert: e.target.value}}))}/>
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="tls client key" defaultMessage="TLS client key"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="textarea"
                    rows={10}
                    placeholder={"fill only to use mTLS"}
                    style={{resize: "vertical"}}
                    value={entry.client_tls_key || ""}
                    onChange={e => setEntry(update(entry, {$merge: {client_tls_key: e.target.value}}))}/>
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
  const [newProp, setNewProp] = useState({key: "", value: ""});
  const [newBackupUrl, setNewBackupUrl] = useState("");

  return (
    <>
      <HelpBlock>
        This panel contains information about gateways. And allow to configure their monitoring and
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
                        <FormattedMessage id="backup-urls" defaultMessage="Backup URL's"/>
                      </Col>

                      <Col sm={9}>
                        <Table>
                          <tbody>
                            {
                              gateway.backup_urls?.map((u, i) => (
                                <tr key={`${u}-${i}`}>
                                  <td>
                                    {u}
                                  </td>
                                  <td>
                                    <Button onClick={() => {
                                      onChange(update(gateways, {[g]: {backup_urls: {$splice: [[i, 1]]}}}))
                                      }}>-</Button>
                                  </td>
                                </tr>
                              ))
                            }
                            <tr>
                              <td>
                                <FormControl
                                  componentClass="input"
                                  value={newBackupUrl}
                                  placeholder="backup url"
                                  onChange={e => setNewBackupUrl(e.target.value)}/>
                              </td>
                              <td>
                                <Button 
                                  disabled={newBackupUrl.length === 0 || gateway.backup_urls?.length >= 3}
                                  onClick={() => {
                                  if(gateway.backup_urls === undefined) {
                                    onChange(update(gateways, {[g]: {$merge: {backup_urls: [newBackupUrl]}}}))
                                  } else {
                                    onChange(update(gateways, {[g]: {backup_urls: {$push: [newBackupUrl]}}}))
                                  }
                                  setNewBackupUrl("");
                                }}>+</Button>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                        <HelpBlock>
                          Backup url's are used in order following a network error event.<br/>
                          There is no retry mechanism in place (as we can't assume the operation was succesful or not).
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="tls-verify" defaultMessage="TLS verify"/>
                      </Col>

                      <Col sm={9}>
                        <Checkbox
                          checked={gateway.tls_verify}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {tls_verify: e.target.checked}}}))}/>
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
                          placeholder="/health"
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

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="proxy" defaultMessage="Proxy"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          placeholder="http://proxy_host:8080/"
                          value={gateway.proxies}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {proxies: e.target.value}}}))}/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="headers" defaultMessage="Headers"/>
                      </Col>

                      <Col sm={9}>
                        <HttpHeaders
                          value={gateway.headers}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {headers: e}}}))} />
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
                            <option value="oauth1">oauth1</option>
                            <option value="oauth2">oauth2</option>
                            <option value="basic">basic</option>
                            <option value="hawk">hawk</option>
                            <option value="oracle-sbc">oracle sbc</option>
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
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="password" defaultMessage="Password"/>
                            </Col>

                            <Col sm={9}>
                              <HiddenField
                                value={gateway.password}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {password: e.target.value}}}))}/>

                            </Col>
                          </FormGroup>
                        </>
                    }

                    {
                      (gateway.auth === "oauth2" || gateway.auth === "oauth1") &&
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
                            <HiddenField
                              value={gateway.client_secret}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {client_secret: e.target.value}}}))}/>
                          </Col>
                        </FormGroup>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="grant-type" defaultMessage="Grant type"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="input"
                              placeholder={"password"}
                              value={gateway.grant_type || ""}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {grant_type: e.target.value}}}))}/>
                          </Col>
                        </FormGroup>
                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="extra-params" defaultMessage="Extra params"/>
                          </Col>

                          <Col sm={9}>
                            <Table>
                              <tbody>
                                {
                                  gateway.extra_params && Object.entries(gateway.extra_params).map(([key, value]) => (
                                    <tr key={`extra-p-${key}`}>
                                      <td>{key}</td>
                                      <td>{value}</td>
                                      <td><Button onClick={() => {
                                          onChange(update(gateways, {[g]: {extra_params: {$unset: [key]}}}))
                                      }}>-</Button></td>
                                    </tr>
                                  ))
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
                                            if(gateway.extra_params === undefined) {
                                              onChange(update(gateways, {[g]: {$merge: {extra_params: {[newProp.key]: newProp.value}}}}))
                                            } else {
                                              onChange(update(gateways, {[g]: {extra_params: {$merge: {[newProp.key]: newProp.value}}}}))
                                            }
                                            setNewProp({key: "", value: ""});
                                        }}>+</Button>
                                    </td>
                                </tr>
                              </tbody>
                            </Table>
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

                    {
                      gateway.url.startsWith("https") && <>
                        <hr/>

                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="tls client cert" defaultMessage="TLS client certificate"/>
                          </Col>

                          <Col sm={9}>
                            <FormControl
                              componentClass="textarea"
                              rows={10}
                              placeholder={"fill only to use mTLS"}
                              style={{resize: "vertical"}}
                              value={gateway.client_tls_cert || ""}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {client_tls_cert: e.target.value}}}))}/>
                          </Col>
                        </FormGroup>

                        <FormGroup>
                          <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="tls client key" defaultMessage="TLS client key"/>
                          </Col>

                          <Col sm={9}>
                            <HiddenTextarea
                              rows={10}
                              placeholder={"fill only to use mTLS"}
                              style={{resize: "vertical"}}
                              value={gateway.client_tls_key || ""}
                              onChange={e => onChange(update(gateways, {[g]: {$merge: {client_tls_key: e.target.value}}}))}/>
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

const newTcpGw = {
  name: "",
  url: "",
  timeout: 10,
  session_holder: "",
  auth: "",
  tls_verify: false,
  client_tls_cert: null,
  client_tls_key: null,
};

function NewTcpGwModal({show, onHide}) {
  const [entry, setEntry] = useState(newTcpGw);

  useEffect(() => {
    if(!show) {
      setEntry(newTcpGw);
    }
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false} bsSize={"large"}>
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
              <FormattedMessage id="tls-verify" defaultMessage="TLS verify"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={entry.tls_verify}
                onChange={e => setEntry(update(entry, {$merge: {tls_verify: e.target.checked}}))}/>
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
                Timeout in seconds
              </HelpBlock>
            </Col>
          </FormGroup>
          {
            entry.url.startsWith("ssh") &&
              <>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="username" defaultMessage="Username"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.username}
                      onChange={e => setEntry(update(entry, {$merge: {username: e.target.value}}))}/>
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
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="private-key" defaultMessage="Private key"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="textarea"
                      rows={10}
                      style={{resize: "vertical"}}
                      value={entry.client_tls_key || ""}
                      onChange={e => setEntry(update(entry, {$merge: {client_tls_key: e.target.value}}))}/>
                  </Col>
                </FormGroup>
              </>
          }
          {
            entry.url.startsWith("oci") &&
              <>
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    <FormattedMessage id="username" defaultMessage="Username"/>
                  </Col>

                  <Col sm={9}>
                    <FormControl
                      componentClass="input"
                      value={entry.username}
                      onChange={e => setEntry(update(entry, {$merge: {username: e.target.value}}))}/>
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
            entry.url.startsWith("ocips") &&
            <>
              <hr/>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="tls client cert" defaultMessage="TLS client certificate"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="textarea"
                    rows={10}
                    placeholder={"fill only to use mTLS"}
                    style={{resize: "vertical"}}
                    value={entry.client_tls_cert || ""}
                    onChange={e => setEntry(update(entry, {$merge: {client_tls_cert: e.target.value}}))}/>
                </Col>
              </FormGroup>

              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="tls client key" defaultMessage="TLS client key"/>
                </Col>

                <Col sm={9}>
                  <FormControl
                    componentClass="textarea"
                    rows={10}
                    placeholder={"fill only to use mTLS"}
                    style={{resize: "vertical"}}
                    value={entry.client_tls_key || ""}
                    onChange={e => setEntry(update(entry, {$merge: {client_tls_key: e.target.value}}))}/>
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

function TcpGwsPanel({onChange, gateways}) {
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <HelpBlock>
        This panel contains information about TCP gateways.
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
                          URL scheme refer the protocol to use (e.g tcp, ssh, ocip, ocips, ...)
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="tls-verify" defaultMessage="TLS verify"/>
                      </Col>

                      <Col sm={9}>
                        <Checkbox
                          checked={gateway.tls_verify}
                          onChange={e => onChange(update(gateways, {[g]: {$merge: {tls_verify: e.target.checked}}}))}/>
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
                          Timeout in seconds
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    {
                      gateway.url.startsWith("ssh") &&
                        <>
                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="username" defaultMessage="Username"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="input"
                                value={gateway.username}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {username: e.target.value}}}))}/>
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="password" defaultMessage="Password"/>
                            </Col>

                            <Col sm={9}>
                              <HiddenField
                                value={gateway.password}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {password: e.target.value}}}))}/>

                            </Col>
                          </FormGroup>
                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="private-key" defaultMessage="Private key"/>
                            </Col>

                            <Col sm={9}>
                              <HiddenTextarea
                                rows={10}
                                style={{resize: "vertical"}}
                                value={gateway.client_tls_key || ""}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {client_tls_key: e.target.value}}}))}/>
                            </Col>
                          </FormGroup>
                        </>
                    }
                    {
                      gateway.url.startsWith("oci") &&
                        <>
                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="username" defaultMessage="Username"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="input"
                                value={gateway.username}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {username: e.target.value}}}))}/>
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="password" defaultMessage="Password"/>
                            </Col>

                            <Col sm={9}>
                              <HiddenField
                                value={gateway.password}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {password: e.target.value}}}))}/>

                            </Col>
                          </FormGroup>
                        </>
                    }
                    {
                      gateway.url.startsWith("ocips") &&
                        <>
                          <hr/>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="tls client cert" defaultMessage="TLS client certificate"/>
                            </Col>

                            <Col sm={9}>
                              <FormControl
                                componentClass="textarea"
                                rows={10}
                                placeholder={"fill only to use mTLS"}
                                style={{resize: "vertical"}}
                                value={gateway.client_tls_cert || ""}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {client_tls_cert: e.target.value}}}))}/>
                            </Col>
                          </FormGroup>

                          <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                              <FormattedMessage id="tls client key" defaultMessage="TLS client key"/>
                            </Col>

                            <Col sm={9}>
                              <HiddenTextarea
                                rows={10}
                                placeholder={"fill only to use mTLS"}
                                style={{resize: "vertical"}}
                                value={gateway.client_tls_key || ""}
                                onChange={e => onChange(update(gateways, {[g]: {$merge: {client_tls_key: e.target.value}}}))}/>
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
          <NewTcpGwModal
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


function GuiForm({ gui, onChange }) {
  const [activities, setActivities] = useState([]);
  if (gui.modules === undefined) {
    gui.modules = [];
  }

  useEffect(() => {
    fetchActivities(setActivities);
  }, []);

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
                <FormattedMessage id="reset-password-request-workflow"
                                  defaultMessage="Reset password notification workflow"/>
              </Col>

              <Col sm={9}>
                <Select
                  isClearable
                  value={{label: gui.reset_password_request_workflow || "", value: gui.reset_password_request_workflow || ""}}
                  onChange={e => onChange({...gui, reset_password_request_workflow: e?.value})}
                  onClear={() => onChange(update(gui, {$unset: ["reset_password_request_workflow"]}))}
                  options={activities.map(a => ({label: a.name, value: a.name}))}
                />
                <HelpBlock>
                  When a user launch a reset password, a token is generated and sent to the
                  user by email using the default SMTP configuration. When a workflow is set, the mail is not sent and
                  the workflow is called with the following parameters: username, token and email. The workflow is
                  responsible to provide the user with the appropriate token.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="reset-password-workflow"
                                  defaultMessage="Post-reset password workflow"/>
              </Col>

              <Col sm={9}>
                <Select
                  isClearable
                  value={{label: gui.reset_password_workflow || "", value: gui.reset_password_workflow || ""}}
                  onChange={e => onChange({...gui, reset_password_workflow: e?.value})}
                  onClear={() => onChange(update(gui, {$unset: ["reset_password_workflow"]}))}
                  options={activities.map(a => ({label: a.name, value: a.name}))}
                />
                <HelpBlock>
                  The workflow is triggered when a user reset his password. The workflow is called with the following
                  parameters: username and password. Note that the workflow is called when the password is changed already, so
                  the workflow can't change the password, and it can't be used to validate the new password.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="activate 2fa" defaultMessage="Force 2-factor auth."/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={(gui["2fa"] || {}).active}
                  onChange={e => onChange(update(gui, {$merge: {"2fa": update(gui["2fa"] || {}, {$merge: {active: e.target.checked}})}}))}/>
                <HelpBlock>
                  Force 2-factor auth. by email for all local users with a known email.
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

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="totp-issuer" defaultMessage="2-factor auth. TOTP issuer"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={(gui["2fa"] || {}).totp_issuer}
                  onChange={e => onChange(update(gui, {$merge: {"2fa": update(gui["2fa"] || {}, {$merge: {totp_issuer: e.target.value}})}}))}/>
                <HelpBlock>
                  The 2-factor auth. process using TOTP require an issuer (visible in the auth. app).
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="allowed-origins" defaultMessage="Allowed origins"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  readOnly
                  componentClass="input"
                  value={gui.allowed_origins || ""} />
                <HelpBlock>
                  RFU: the default setup use an NGINX as reverse proxy in front of the application server.
                  Therefore, it must be configured in the NGINX settings using the command
                  'add_header Access-Control-Allow-Origin ...domain...' with the appropriate value
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="max-idle-timeout" defaultMessage="Max session idle timeout (minutes)"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={gui.max_idle_timeout || ""}
                  onChange={e => onChange(update(gui, {$merge: {"max_idle_timeout": e.target.value && parseInt(e.target.value, 10)}}))}/>
                <HelpBlock>
                  Number of minutes the user can keep his session idle. (note: background API calls reset the idle timer)
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="webauthn-enabled" defaultMessage="Enable Webauthn passkeys"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={(gui["webauthn"] || {}).enabled}
                  onChange={e => onChange(update(gui, {$merge: {"webauthn": update(gui["webauthn"] || {}, {$merge: {enabled: e.target.checked}})}}))}/>
                <HelpBlock>
                  Webauthn allow (local) users only to use passkeys instead of passwords if their device supports it.
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="webauthn-display_name" defaultMessage="Webauthn display name"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={(gui["webauthn"] || {}).display_name}
                  onChange={e => onChange(update(gui, {$set: {"webauthn": update(gui["webauthn"] || {}, {$merge: {display_name: e.target.value}})}}))}/>
                <HelpBlock>
                  Display name [RFU]
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="webauthn-rp_id" defaultMessage="Webauthn RP ID"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={(gui["webauthn"] || {}).rp_id}
                  onChange={e => onChange(update(gui, {$set: {"webauthn": update(gui["webauthn"] || {}, {$merge: {rp_id: e.target.value}})}}))}/>
                <HelpBlock>
                  Relying party ID
                </HelpBlock>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="webauthn-rp_origins" defaultMessage="Webauthn RP Origins"/>
              </Col>

              <Col sm={9}>
                <WebauthnAllowedOrigins
                  origins={(gui["webauthn"] || {}).rp_origins}
                  onChange={origins => (
                    onChange(update(gui, {$set: {"webauthn": update(gui["webauthn"] || {}, {$merge: {rp_origins: origins}})}}))
                  )} />
                <HelpBlock>
                  Relying party origins allowed
                </HelpBlock>
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>
    </>
  )
}

function WebauthnAllowedOrigins({origins, onChange}) {
  const [newOrigin, setNewOrigin] = useState("");

  return (
    <Table>
      <tbody>
        {
          (origins?.map((o, i) => (
            <tr key={o}>
              <td>{o}</td>
              <td><Button
                onClick={() => (
                  onChange(update(origins || [], {$splice: [[i, 1]]}))
                )}
                bsStyle="danger">-</Button></td>
            </tr>
          )))
        }
        <tr>
          <td>
            <FormControl
              componentClass="input"
              value={newOrigin || ""}
              onChange={e => setNewOrigin(e.target.value)}
              />
          </td>
          <td>
            <Button
              disabled={newOrigin.length === 0}
              onClick={() => {
                onChange(update(origins || [], {$push: [newOrigin]}));
                setNewOrigin("");
              }}
              bsStyle="primary">
              +
            </Button>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

function UserCreationRules({entries, onChange}) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Condition</th>
          <th>Profile</th>
          <th>Ui Profile</th>
          <th>Is system</th>
          <th/>
        </tr>
      </thead>
      <tbody>
      {
        entries.map((entry, i) => (
          <tr key={`user-crea-rules-${i}`}>
            <td>
              <FormControl
                componentClass="input"
                value={entry.rule}
                onChange={e => onChange(update(entries, {[i]: {$merge: {rule: e.target.value}}}))}/>
            </td>
            <td>
              <FormControl
                componentClass="input"
                value={entry.user_profile}
                onChange={e => onChange(update(entries, {[i]: {$merge: {user_profile: e.target.value}}}))}/>
            </td>
            <td>
              <FormControl
                componentClass="input"
                value={entry.ui_profile}
                onChange={e => onChange(update(entries, {[i]: {$merge: {ui_profile: e.target.value}}}))}/>
            </td>
            <td>
              <Checkbox
                checked={entry.is_system}
                onChange={e => onChange(update(entries, {[i]: {$merge: {is_system: e.target.checked}}}))}/>
            </td>
            <td>
              <Button
                onClick={() => onChange(update(entries, {$splice: [[i, 1]]}))}>
                {"-"}
              </Button>
            </td>
          </tr>
        ))
      }
      </tbody>
      <tfoot>
        <tr>
          <td>
            <Button
              onClick={() => onChange(update(entries, {$push: [{"rule": "true", "ui_profile": "", "user_profile": "", "is_system": false}]}))}>
              {"+"}
            </Button>
          </td>
          <td colSpan={4}/>
        </tr>
      </tfoot>
    </Table>
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

const default_saml_v2 = {
  "sp": {
    "entityId": "https://sp.example.com/saml2/metadata",
    "assertionConsumerService": {"url": "https://sp.example.com/saml2/acs"},
    "privateKey": "",
    "x509cert": ""
  },
  "idp": {
    "metadata": "<EntityDescriptor...>",
  },
  "validRedirects": []
}

const default_saml_v1 = {
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
}

const newSso = {
  name: "",
  enabled: false,
  show_login: true,
  protocol: "oidc",
  extra_auth_rules: [],
  auto_create_user: false,
  parameters: {},
  authorisation_handler: {},
}

function NewSsoModal({show, onHide, gateways, enabledMods}) {
  const [entry, setEntry] = useState(newSso);
  const defaultSaml = enabledMods.includes(modules.npact) ? default_saml_v1 : default_saml_v2;

  let authenticationParams;
  switch (entry.protocol) {
    case "oidc":
      authenticationParams =
        <OidcParameters
          params={entry.parameters}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/>
      break;
    case "saml":
      authenticationParams = enabledMods.includes(modules.npact) ?
        <SamlParametersV1
          params={entry.parameters}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/> :
        <SamlParametersV2
          params={entry.parameters}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/>
      break;
    case "webseal":
      authenticationParams =
        <WebSealParameters
          params={entry.parameters}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/>
      break;
    case "soap-token":
      authenticationParams =
        <SoapTokenParameters
          params={entry.parameters}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/>
      break;
    case "broadsoft":
      authenticationParams =
        <BroadsoftIdpParameters
          params={entry.parameters}
          gateways={gateways}
          onChange={e => setEntry(update(entry, {$merge: {parameters: e}}))}/>
      break;
  }

  let authorisationParams;
  switch((entry.authorisation_handler || {}).name) {
    case "AuthoriseBroadsoft":
      authorisationParams =
        <BsftAuthorisationParameters
          params={entry.authorisation_handler}
          onChange={e => setEntry(update(entry, {$merge: {authorisation_handler: e}}))}/>
      break;
  }

  useEffect(() => {
    !show && setEntry(newSso);
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false} bsSize="large">
      <Modal.Header closeButton>
        <Modal.Title>
          New Single Sign On provider
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
              <FormattedMessage id="protocol" defaultMessage="Protocol"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={entry.protocol}
                onChange={e => setEntry(update(entry, {$merge: {protocol: e.target.value, parameters: e.target.value === "saml"?defaultSaml:{}}}))}>
                <option value=""/>
                <option value="oidc">Open IDConnect</option>
                <option value="saml">SAML</option>
                <option value="webseal">WebSeal</option>
                <option value="soap-token">Soap Token</option>
                <option value="broadsoft">Broadsoft</option>
              </FormControl>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enabled" defaultMessage="Enabled"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={entry.enabled}
                onChange={e => setEntry(update(entry, {$merge: {enabled: e.target.checked}}))}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="show-on-login" defaultMessage="Show on login page"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={entry.show_login}
                onChange={e => setEntry(update(entry, {$merge: {show_login: e.target.checked}}))}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="extra-rules" defaultMessage="Extra rules"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.extra_auth_rules && entry.extra_auth_rules[0]}
                onChange={e => setEntry(update(entry, {$merge: {extra_auth_rules: e.target.value.length === 0 ? [] : [e.target.value]}}))}/>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="user-creation-rules" defaultMessage="Users creation rules"/>
            </Col>

            <Col sm={9}>
              <UserCreationRules
                entries={entry.user_creation_rules || []}
                onChange={e => setEntry(update(entry, {$merge: {user_creation_rules: e}}))}/>
              <HelpBlock>
                If the user is <b>not</b> known, the rules are checked one-by-one to find a match and auto-create the user with
                the appropriate profile.<br/>
                The condition rule is a boolean expression which can use the token response body.
                (ref. <a href={"https://github.com/expr-lang/expr/blob/master/docs/Language-Definition.md"}>language definition</a>)<br/>
                If no match is found, the authentication is rejected as the user is unknown.
              </HelpBlock>
            </Col>
          </FormGroup>

          <hr />

          {authenticationParams}

          <hr />

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="authorisation-handler" defaultMessage="Authorisation handler"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={entry.authorisation_handler && entry.authorisation_handler.name}
                onChange={e => setEntry(update(entry, {$merge: {authorisation_handler: {name: e.target.value || undefined}}}))}>
                <option value="">none</option>
                <option value="AuthoriseBroadsoft">map to broadsoft user</option>
              </FormControl>
            </Col>
          </FormGroup>

          {authorisationParams}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(entry)}
                disabled={!entry.name || entry.name.length === 0}
                bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
        <Button onClick={() => onHide(undefined)}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
      </Modal.Footer>
    </Modal>
  )
}

function SoapTokenParameters({params, onChange}) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="http-header" defaultMessage="HTTP header with client IP"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.ip_http_header}
            onChange={e => onChange(update(params, {$merge: {ip_http_header: e.target.value || null}}))}/>
            <HelpBlock>
              Used to get the client IP address when the instance is behind some reverse proxy.
              (e.g X-Real-IP or X-FORWARDED-FOR)
            </HelpBlock>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="url" defaultMessage="Token service URL"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.url}
            onChange={e => onChange(update(params, {$merge: {url: e.target.value || null}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="specifics" defaultMessage="Specifics"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="select"
            value={params.specifics}
            onChange={e => onChange(update(params, {$merge: {specifics: e.target.value || null}}))}>
            <option value={""}>*none*</option>
            <option value={"sfr"}>SFR</option>
          </FormControl>
        </Col>
      </FormGroup>
    </>
  )
}

function ProxyGateways({value, gateways, onChange}) {
  return (
    <>
    <Table>
      <thead>
        <tr>
          <th><FormattedMessage id="proxy name" defaultMessage="proxy name" /></th>
          <th><FormattedMessage id="gateway name" defaultMessage="gateway name" /></th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          value && Object.entries(value).map(([px, gw], i) => {
            return (
              <tr key={i}>
                <td>
                  <FormControl type="input"
                    value={px}
                    onChange={e => (
                      onChange(update(value,
                        { $merge: { [e.target.value]: gw }, $unset: [px] }
                      )))
                    } />
                </td>
                <td>
                  <FormControl type="input"
                    value={gw}
                    onChange={e => (
                      onChange(update(value,
                        { $merge: { [px]: e.target.value } }
                      )))
                    } />
                </td>
                <td>
                  <Button onClick={() => {
                    onChange(update(value,
                      { $unset: [px] }
                    ))
                  }}>-</Button>
                </td>
              </tr>
            )
          })
        }
        <tr>
          <td colSpan={3}>
            <Button
              onClick={() => (
                onChange(update(value,
                  { $merge: { "": "" } }
                ))
              )}
            >
              +
            </Button>
          </td>
        </tr>
      </tbody>
    </Table>
    </>
  )
}

function BroadsoftIdpParameters({params, gateways, onChange}) {
  let v;
  if(params.proxies instanceof Array) {
    v = (
      <Select
        isClearable
        isMulti
        value={params.proxies.map(p => ({value: p, label: p}))}
        options={Object.keys(gateways).map(g => ({value: g, label: g}))}
        onChange={v => v && onChange(update(params, {$merge: {proxies: v.map(e => e.value)}}))}
        clearValue={() => onChange(update(params, {$merge: {proxies: []}}))}
      />
    )
  } else {
    v = (
      <ProxyGateways
        value={params.proxies || {}}
        gateways={gateways}
        onChange={prxs =>
          params.proxies === undefined ?
          onChange(update(params, {$merge: {proxies: prxs}})) :
          onChange(update(params, {$set: {proxies: prxs}}))
        }
      />
    )
  }
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="proxies" defaultMessage="Proxies"/>
        </Col>

        <Col sm={9}>
          {v}
          <HelpBlock>
            Those proxy gateways are trusted and allowed to authenticate users.
          </HelpBlock>
        </Col>
      </FormGroup>
    </>
  )
}

function WebSealParameters({params, onChange}) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="http-header" defaultMessage="HTTP header with client IP"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.ip_http_header}
            onChange={e => onChange(update(params, {$merge: {ip_http_header: e.target.value || null}}))}/>
            <HelpBlock>
              Used to fetch the (webseal) client IP address when the instance is behind some reverse proxy.
              (e.g X-Real-IP)
            </HelpBlock>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="trusted-ips" defaultMessage="Trusted source IPs"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.trusted_ips}
            onChange={e => onChange(update(params, {$merge: {trusted_ips: e.target.value || null}}))}/>
            <HelpBlock>
              Comma separated IP's of the webseal instances.
            </HelpBlock>
        </Col>
      </FormGroup>
    </>
  )
}

function OidcParameters({params, onChange}) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="auth-endpoint" defaultMessage="Auth. endpoint"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.auth_endpoint}
            onChange={e => onChange(update(params, {$merge: {auth_endpoint: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="scope" defaultMessage="Scope"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            placeholder={"openid profile email"}
            value={params.scope}
            onChange={e => onChange(update(params, {$merge: {scope: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="token-endpoint" defaultMessage="Token endpoint"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.token_endpoint}
            onChange={e => onChange(update(params, {$merge: {token_endpoint: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="client-id" defaultMessage="Client ID"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.client_id}
            onChange={e => onChange(update(params, {$merge: {client_id: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="client-secret" defaultMessage="Client secret"/>
        </Col>

        <Col sm={9}>
          <HiddenField
            value={params.client_secret}
            onChange={e => onChange(update(params, {$merge: {client_secret: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="redirect-uri" defaultMessage="Redirect uri"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.redirect_uri}
            onChange={e => onChange(update(params, {$merge: {redirect_uri: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="token-issuer" defaultMessage="Token issuer"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.token_issuer}
            onChange={e => onChange(update(params, {$merge: {token_issuer: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="provider" defaultMessage="Provider"/>
        </Col>

        <Col sm={9}>
          <Select
            isClearable
            value={{label: params.provider, value: params.provider}}
            options={["oidc", "oam"].map(o => ({value: o, label: o}))}
            onChange={v => onChange(update(params, {$merge: {provider: v?.value}}))} />
        </Col>
      </FormGroup>
      { params.provider === "oam" &&
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="domain" defaultMessage="Domain"/>
          </Col>

          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={params.domain}
              onChange={e => onChange(update(params, {$merge: {domain: e.target.value}}))}/>
          </Col>
        </FormGroup>
      }
    </>
  )
}

function SamlParametersV2({params, onChange}) {
  const [newRedirect, setNewRedirect] = useState("");
  return (
    <>
      <h4>IDP</h4>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="metadata" defaultMessage="Metadata"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="textarea"
            rows={10}
            value={params.idp.metadata}
            onChange={e => onChange(update(params, {idp: {$merge: {metadata: e.target.value}}}))}/>
          <HelpBlock>
            Must be an XML document like &lt;EntityDescriptor ...&gt;
          </HelpBlock>
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
            value={params.sp.entityId}
            onChange={e => onChange(update(params, {sp: {$merge: {entityId: e.target.value}}}))}/>
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="acs-url" defaultMessage="Assertion Consumer Service Url"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.sp.assertionConsumerService.url}
            onChange={e => onChange(update(params, {sp: {assertionConsumerService: {$merge: {url: e.target.value}}}}))}/>
          <HelpBlock>
            Endpoint visible from the IdP with the structure https://&lt;host&gt;/api/v01/auth/login_&lt;sso name&gt;
          </HelpBlock>
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="x509-certificate" defaultMessage="x509 certificate"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="textarea"
            rows={10}
            value={params.sp.x509cert}
            onChange={e => onChange(update(params, {sp: {$merge: {x509cert: e.target.value}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="x509-private-key" defaultMessage="x509 private key"/>
        </Col>

        <Col sm={9}>
          <HiddenTextarea
            rows={10}
            value={params.sp.privateKey}
            onChange={e => onChange(update(params, {sp: {$merge: {privateKey: e.target.value}}}))} />
        </Col>
      </FormGroup>

      <h4>Misc</h4>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="valid-redirects" defaultMessage="Valid Redirects"/>
        </Col>

        <Col sm={9}>
          <Table>
            <thead>
              <tr>
                <th>prefix</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {
                params.validRedirects?.map((r, i) =>
                  <tr key={`saml-params${i}`}>
                    <td>{r}</td>
                    <td>
                      <Button
                        onClick={() => onChange(update(params, {validRedirects: {$splice: [[i, 1]]}}))}
                      >{"-"}</Button>
                    </td>
                  </tr>
                )
              }
              <tr>
                <td>
                  <FormControl
                    componentClass="input"
                    value={newRedirect || ""}
                    onChange={e => setNewRedirect(e.target.value)}
                    />
                </td>
                <td>
                  <Button
                    disabled={newRedirect.length === 0}
                    onClick={() => {
                      onChange(update(params, {validRedirects: {$push: [newRedirect]}}))
                      setNewRedirect("")
                    }}
                    >{"+"}</Button>
                </td>
              </tr>
            </tbody>
          </Table>

          <HelpBlock>
            Endpoints hosts visible from the users with the structure https://&lt;visible-host&gt;.<br/>
            The first valid redirect is used to redirect the user at the end of the authentication process when the RelayState is missing.
          </HelpBlock>
        </Col>
      </FormGroup>
    </>
  )
}

function SamlParametersV1({params, onChange}) {
  const [idpRemoteMetadataUrl, setIdpRemoteMetadataUrl] = useState("");
  const [loadError, setLoadError] = useState("");

  return (
    <>
      <h4>IDP</h4>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="entity-id" defaultMessage="Entity ID"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.idp.entityId}
            onChange={e => onChange(update(params, {idp: {$merge: {entityId: e.target.value}}}))}/>
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
            value={params.idp.singleSignOnService.url}
            onChange={e => onChange(update(params, {idp: {singleSignOnService: {$merge: {url: e.target.value}}}}))}/>
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
            value={params.idp.singleSignOnService.binding}
            onChange={e => onChange(update(params, {idp: {singleSignOnService: {$merge: {binding: e.target.value}}}}))}>
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
            value={params.idp.singleLogoutService.url}
            onChange={e => onChange(update(params, {idp: {singleLogoutService: {$merge: {url: e.target.value}}}}))}/>
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
            value={params.idp.singleLogoutService.binding}
            onChange={e => onChange(update(params, {idp: {singleLogoutService: {$merge: {binding: e.target.value}}}}))}>
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
            value={params.idp.x509cert}
            onChange={e => onChange(update(params, {idp: {$merge: {x509cert: e.target.value}}}))} />
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
              .then(r => onChange(update(params, {$set: mergeDeep(params, r)})))
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
            value={params.sp.entityId}
            onChange={e => onChange(update(params, {sp: {$merge: {entityId: e.target.value}}}))}/>
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
            value={params.sp.NameIDFormat}
            onChange={e => onChange(update(params, {sp: {$merge: {NameIDFormat: e.target.value}}}))}/>
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="acs-url" defaultMessage="Assertion Consumer Service Url"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.sp.assertionConsumerService.url}
            onChange={e => onChange(update(params, {sp: {assertionConsumerService: {$merge: {url: e.target.value}}}}))}/>
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
            value={params.sp.assertionConsumerService.binding}
            onChange={e => onChange(update(params, {sp: {assertionConsumerService: {$merge: {binding: e.target.value}}}}))}>
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
            value={params.sp.singleLogoutService.url}
            onChange={e => onChange(update(params, {sp: {singleLogoutService: {$merge: {url: e.target.value}}}}))}/>
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
            value={params.sp.singleLogoutService.binding}
            onChange={e => onChange(update(params, {sp: {singleLogoutService: {$merge: {binding: e.target.value}}}}))}>
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
            value={params.sp.x509cert}
            onChange={e => onChange(update(params, {sp: {$merge: {x509cert: e.target.value}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="x509-private-key" defaultMessage="x509 private key"/>
        </Col>

        <Col sm={9}>
          <HiddenTextarea
            value={params.sp.privateKey}
            onChange={e => onChange(update(params, {sp: {$merge: {privateKey: e.target.value}}}))} />
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
            checked={params.security.authnRequestsSigned}
            onChange={e => onChange(update(params, {security: {$merge: {authnRequestsSigned: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantAssertionsSigned" defaultMessage="Want Assertions Signed"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantAssertionsSigned}
            onChange={e => onChange(update(params, {security: {$merge: {wantAssertionsSigned: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="nameIdEncrypted" defaultMessage="nameId Encrypted"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.nameIdEncrypted}
            onChange={e => onChange(update(params, {security: {$merge: {nameIdEncrypted: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="logoutRequestSigned" defaultMessage="logoutRequest Signed"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.logoutRequestSigned}
            onChange={e => onChange(update(params, {security: {$merge: {logoutRequestSigned: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="logoutResponseSigned" defaultMessage="logoutResponse Signed"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.logoutResponseSigned}
            onChange={e => onChange(update(params, {security: {$merge: {logoutResponseSigned: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="signMetadata" defaultMessage="Sign Metadata"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.signMetadata}
            onChange={e => onChange(update(params, {security: {$merge: {signMetadata: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantMessagesSigned" defaultMessage="Want Messages Signed"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantMessagesSigned}
            onChange={e => onChange(update(params, {security: {$merge: {wantMessagesSigned: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantNameId" defaultMessage="Want Name Id"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantNameId}
            onChange={e => onChange(update(params, {security: {$merge: {wantNameId: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantAssertionsEncrypted" defaultMessage="Want Assertions Encrypted"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantAssertionsEncrypted}
            onChange={e => onChange(update(params, {security: {$merge: {wantAssertionsEncrypted: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantNameIdEncrypted" defaultMessage="Want Name Id Encrypted"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantNameIdEncrypted}
            onChange={e => onChange(update(params, {security: {$merge: {wantNameIdEncrypted: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="wantAttributeStatement" defaultMessage="Want Attribute Statement"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.wantAttributeStatement}
            onChange={e => onChange(update(params, {security: {$merge: {wantAttributeStatement: e.target.checked}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="requestedAuthnContext" defaultMessage="Requested AuthnContext"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.requestedAuthnContext}
            onChange={e => onChange(update(params, {security: {$merge: {requestedAuthnContext: e.target.checked}}}))} />
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
            value={params.security.requestedAuthnContextComparison}
            onChange={e => onChange(update(params, {security: {$merge: {requestedAuthnContextComparison: e.target.value}}}))} />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="failOnAuthnContextMismatch" defaultMessage="Fail On AuthnContext Mismatch"/>
        </Col>

        <Col sm={9}>
          <Checkbox
            disabled
            checked={params.security.failOnAuthnContextMismatch}
            onChange={e => onChange(update(params, {security: {$merge: {failOnAuthnContextMismatch: e.target.checked}}}))} />
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
            value={params.security.signatureAlgorithm}
            onChange={e => onChange(update(params, {security: {$merge: {signatureAlgorithm: e.target.value}}}))} >
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
            value={params.security.digestAlgorithm}
            onChange={e => onChange(update(params, {security: {$merge: {digestAlgorithm: e.target.value}}}))} >
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
            value={params.default_email_host}
            onChange={e => onChange(update(params, {$merge: {default_email_host: e.target.value}}))} />
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
            value={params.default_user_profile}
            onChange={e => onChange(update(params, {$merge: {default_user_profile: e.target.value}}))} />
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
            value={params.default_user_ui_profile}
            onChange={e => onChange(update(params, {$merge: {default_user_ui_profile: e.target.value}}))} />
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
            checked={params.security.default_user_is_system}
            onChange={e => onChange(update(params, {security: {$merge: {default_user_is_system: e.target.checked}}}))} />
        </Col>
      </FormGroup>
    </>
  )
}

function BsftAuthorisationParameters({params, onChange}) {
  return (
    <>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="username-template" defaultMessage="Username mapping template"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.username_template}
            onChange={e => onChange(update(params, {$merge: {username_template: e.target.value}}))}/>
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="gateway-session-holder" defaultMessage="Gateway session holder"/>
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="input"
            value={params.gateway}
            onChange={e => onChange(update(params, {$merge: {gateway: e.target.value}}))}/>
        </Col>
      </FormGroup>
    </>
  )
}

function SSOPanel({sso, gateways, onChange, enabledMods}) {
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <HelpBlock>
        This panel contains Single Sign On configuration.
        This configuration may expose your platform to security breaches, so check it carefully and only use trusted sources.
      </HelpBlock>

      {
        sso
          .sort((a, b) => {
            if(a === null || b === null) return -1;
            return a.name.localeCompare(b.name)
          })
          .map(
            (p, i) => {
              if(p === null) return <div/>

              let authenticationParams;
              switch (p.protocol) {
                case "oidc":
                  authenticationParams =
                    <OidcParameters
                      params={p.parameters || {}}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/>
                  break;
                case "saml":
                  authenticationParams = enabledMods.includes(modules.npact) ?
                    <SamlParametersV1
                      params={p.parameters || {}}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/> :
                    <SamlParametersV2
                      params={p.parameters || {}}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/>
                  break;
                case "webseal":
                  authenticationParams =
                    <WebSealParameters
                      params={p.parameters || {}}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/>
                  break;
                case "soap-token":
                  authenticationParams =
                    <SoapTokenParameters
                      params={p.parameters || {}}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/>
                  break;
                case "broadsoft":
                  authenticationParams =
                    <BroadsoftIdpParameters
                      params={p.parameters || {}}
                      gateways={gateways}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {parameters: e}}}))}/>
                  break;
              }
              let authorisationParams;
              switch((p.authorisation_handler || {}).name) {
                case "AuthoriseBroadsoft":
                  authorisationParams =
                    <BsftAuthorisationParameters
                      params={p.authorisation_handler}
                      onChange={e => onChange(update(sso, {[i]: {$merge: {authorisation_handler: e}}}))}/>
                  break;
              }
              return <Panel key={`sso-${p.name}`}>
                <Panel.Heading>
                  <Panel.Title toggle>{p.name}</Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible={!p.enabled}>
                  <Form horizontal>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="name" defaultMessage="Name"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={p.name}
                          readOnly/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="protocol" defaultMessage="Protocol"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="select"
                          value={p.protocol}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {protocol: e.target.value}}}))}>
                          <option value=""/>
                          <option value="oidc">Open IDConnect</option>
                          <option value="saml">SAML</option>
                          <option value="webseal">WebSeal</option>
                          <option value="soap-token">Soap Token</option>
                          <option value="broadsoft">Broadsoft</option>
                        </FormControl>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="enabled" defaultMessage="Enabled"/>
                      </Col>

                      <Col sm={9}>
                        <Checkbox
                          checked={p.enabled}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {enabled: e.target.checked}}}))}/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="show-on-login" defaultMessage="Show on login page"/>
                      </Col>

                      <Col sm={9}>
                        <Checkbox
                          checked={p.show_login}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {show_login: e.target.checked}}}))}/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="extra-rules" defaultMessage="Extra rules"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={p.extra_auth_rules && p.extra_auth_rules[0]}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {extra_auth_rules: e.target.value.length === 0 ? [] : [e.target.value]}}}))}/>
                        <HelpBlock>
                          When the authentication is confirmed, this rule can be applied to validate the request with custom specifications.<br/>
                          The IdP authentication token is decoded and directly available in the rule eval. context. The request query string is also available in a variable named "qs".<br/>
                          e.g check the group_id in the query string is in the allowed_group_ids from the IdP token: `qs["group_id"] in allowed_group_ids`<br/>
                          e.g check the user belongs to a particular company: `hd == "netaxis.be"`
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="user-creation-rules" defaultMessage="Users creation rules"/>
                      </Col>

                      <Col sm={9}>
                        <UserCreationRules
                          entries={p.user_creation_rules || []}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {user_creation_rules: e}}}))}/>
                        <HelpBlock>
                          If the user is <b>not</b> known, the rules are checked one-by-one to find a match and auto-create the user with
                          the appropriate profile.<br/>
                          The condition rule is a boolean expression which can use the token response body.
                          (ref. <a href={"https://github.com/expr-lang/expr/blob/master/docs/Language-Definition.md"}>language definition</a>)<br/>
                          If no match is found, the authentication is rejected as the user is unknown.
                        </HelpBlock>
                      </Col>
                    </FormGroup>

                    <hr />

                    {authenticationParams}

                    <hr />

                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="authorisation-handler" defaultMessage="Authorisation handler"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="select"
                          value={p.authorisation_handler && p.authorisation_handler.name}
                          onChange={e => onChange(update(sso, {[i]: {$merge: {authorisation_handler: {name: e.target.value || undefined}}}}))}>
                          <option value="">none</option>
                          <option value="AuthoriseBroadsoft">map to broadsoft user</option>
                        </FormControl>
                      </Col>
                    </FormGroup>

                    {authorisationParams}

                    <FormGroup>
                      <Col smOffset={2} sm={9}>
                        <ButtonToolbar>
                          <Button bsStyle="danger"
                                  onClick={() => onChange(update(sso, {$splice: [[i, 1]]}))}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                          </Button>
                        </ButtonToolbar>
                      </Col>
                    </FormGroup>
                  </Form>
                </Panel.Body>
              </Panel>
            })
      }

      <Panel>
        <Panel.Body>
          <ButtonToolbar>
            <Button onClick={() => setShowNew(true)} bsStyle="primary">
              <FormattedMessage id="new" defaultMessage="New"/>
            </Button>
          </ButtonToolbar>
          <NewSsoModal
            show={showNew}
            gateways={gateways}
            enabledMods={enabledMods}
            onHide={newEntry => {
              setShowNew(false);
              if (newEntry !== undefined) {
                onChange(update(sso, {$push: [newEntry]}))
              }
            }}
          />
        </Panel.Body>
      </Panel>
    </>
  )
}

function ThresholdFormGroup({alarms, alarm, label, level, onChange}) {
  let thresholds;
  const al = alarms?.alarms;
  if(al !== undefined && al.hasOwnProperty(alarm)) {
    thresholds = al[alarm]?.thresholds;
  }
  const value = thresholds?.find(t => t.level === level)?.threshold;
  const p = thresholds?.findIndex(t => t.level === level);

  return (
    <FormGroup>
      <Col componentClass={ControlLabel} sm={2}>
        {label}
      </Col>

      <Col sm={9}>
        <FormControl
          componentClass="input"
          value={value}
          onChange={e => (!e.target.value || !isNaN(e.target.value)) && onChange(
            update(
              alarms,
              {
                alarms: {
                  [alarm]: {
                    thresholds: {[p]: {$merge: {threshold: e.target.value && parseFloat(e.target.value)}}}
                  }
                }
              }
            )
          )} />

        <Button bsStyle="info" disabled>
          <Glyphicon glyph="plus"/> Add handler
        </Button>
      </Col>
    </FormGroup>
  )
}

function AlarmsPanel({alarms, onChange}) {
  return (
    <>
      <HelpBlock>
        This panel contains information about alarms definition.
      </HelpBlock>

      <Panel>
        <Panel.Heading>
          <Panel.Title toggle>Default handler</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <HelpBlock>Any alarm would trigger this handler</HelpBlock>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="handler" defaultMessage="Handler"/>
              </Col>

              <Col sm={9}>
                <Select
                  isClearable
                  value={{label: alarms.default_handler?.handler, value: alarms.default_handler?.handler}}
                  options={["email",].map(o => ({value: o, label: o}))}
                  onChange={v => onChange(update(alarms, {default_handler: {$merge: {handler: v?.value}}}))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="template" defaultMessage="Template"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={alarms.default_handler?.template}
                  onChange={e => onChange(update(alarms, {default_handler: {$merge: {template: e.target.value}}}))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="distribution-list" defaultMessage="Distribution list"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={alarms.default_handler?.distribution_list}
                  onChange={e => onChange(update(alarms, {default_handler: {$merge: {distribution_list: e.target.value}}}))}
                />
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading>
          <Panel.Title toggle>Northbound errors</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <HelpBlock>
            Northbound HTTP status greater or equal to 500.
          </HelpBlock>

          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="support-system-clear" defaultMessage="Support system clear"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={alarms.alarms?.http_success_rate?.system_clear}
                  onChange={e => onChange(update(alarms, {alarms: {http_success_rate: {$merge: {system_clear: e.target.checked}}}}))}
                />
              </Col>
            </FormGroup>

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_success_rate"
              label={<FormattedMessage id="info-threshold" defaultMessage="Informative threshold"/>}
              level={"info"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_success_rate"
              label={<FormattedMessage id="major-threshold" defaultMessage="Major threshold"/>}
              level={"major"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_success_rate"
              label={<FormattedMessage id="critical-threshold" defaultMessage="Critical threshold"/>}
              level={"critical"}
              onChange={onChange} />
          </Form>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading>
          <Panel.Title toggle>Southbound http errors</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <HelpBlock>
            Southbound HTTP status greater or equal to 500.
          </HelpBlock>

          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="support-system-clear" defaultMessage="Support system clear"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={alarms.alarms?.http_south_success_rate?.system_clear}
                  onChange={e => onChange(update(alarms, {alarms: {http_south_success_rate: {$merge: {system_clear: e.target.checked}}}}))}
                />
              </Col>
            </FormGroup>

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_south_success_rate"
              label={<FormattedMessage id="info-thresholds" defaultMessage="Informative threshold"/>}
              level={"info"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_south_success_rate"
              label={<FormattedMessage id="major-thresholds" defaultMessage="Major threshold"/>}
              level={"major"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="http_south_success_rate"
              label={<FormattedMessage id="critical-thresholds" defaultMessage="Critical threshold"/>}
              level={"critical"}
              onChange={onChange} />
          </Form>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Heading>
          <Panel.Title toggle>Network issues</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <HelpBlock>Number of network issues (timeout, connection, etc...) per gateway</HelpBlock>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="support-system-clear" defaultMessage="Support system clear"/>
              </Col>

              <Col sm={9}>
                <Checkbox
                  checked={alarms.alarms?.network_issues?.system_clear}
                  onChange={e => onChange(update(alarms, {alarms: {network_issues: {$merge: {system_clear: e.target.checked}}}}))}
                />
              </Col>
            </FormGroup>

            <ThresholdFormGroup
              alarms={alarms}
              alarm="network_issues"
              label={<FormattedMessage id="info-threshold" defaultMessage="Informative threshold"/>}
              level={"info"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="network_issues"
              label={<FormattedMessage id="major-threshold" defaultMessage="Major threshold"/>}
              level={"major"}
              onChange={onChange} />

            <ThresholdFormGroup
              alarms={alarms}
              alarm="network_issues"
              label={<FormattedMessage id="critical-threshold" defaultMessage="Critical threshold"/>}
              level={"critical"}
              onChange={onChange} />
          </Form>
        </Panel.Body>
      </Panel>
    </>
  )
}

function CleanupPanel({retention, onChange}) {
  const defaultRet = retention.monthKept || retention.default;
  
  useEffect(() => {
    const ret = retention?.monthKept;
    // update the old name to the new structure
    if(ret !== undefined) {
      onChange(update(retention, {$merge: {"default": ret}, $unset: ["monthKept"]}))
    }
  }, [retention])

  return (
    <>
      <HelpBlock>
        Configuration for data retention periods.
      </HelpBlock>

      <Panel>
        <Panel.Body>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="requests-retention" defaultMessage="Default requests retention (months)"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={defaultRet}
                  onChange={e => onChange(update(retention, {$merge: {default: e.target.value && parseInt(e.target.value, 10)}}))}/>
                
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="get-requests-retention" defaultMessage="Get requests retention (months)"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={retention.get_requests}
                  placeholder={defaultRet}
                  onChange={e => onChange(update(retention, {$merge: {get_requests: e.target.value && parseInt(e.target.value, 10)}}))}/>
                
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="scheduled-requests-retention" defaultMessage="Scheduled jobs retention (months)"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={retention.scheduled_jobs}
                  placeholder={defaultRet}
                  onChange={e => onChange(update(retention, {$merge: {scheduled_jobs: e.target.value && parseInt(e.target.value, 10)}}))}/>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="trusted-locs-retention" defaultMessage="User trusted locations (days)"/>
              </Col>
              
              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={retention.trusted_locs}
                  onChange={e => onChange(update(retention, {$merge: {trusted_locs: e.target.value && parseInt(e.target.value, 10)}}))}/>
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

function generateLicense(details, onSuccess) {
    return fetch_post("/api/v01/system/configuration/license", details)
      .then(r => r.json())
      .then(r => onSuccess(r.license))
      .catch(e => NotificationsManager.error("Failed to generate a new license", e.message))
}

function LicenseGenerator({onNewLicense}) {
    const [newLicense, setNewLicense] = useState({customer: "", days: 365})
    const [key, setKey] = useState("");

    return (
      <>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="validity" defaultMessage="Validity (days)"/>
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={newLicense.days}
              onChange={e => setNewLicense(update(newLicense, {"$merge": {days: parseInt(e.target.value ? e.target.value: "0", 10)}}))}/>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="customer-name" defaultMessage="Customer name"/>
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={newLicense.customer}
              onChange={e => setNewLicense(update(newLicense, {"$merge": {customer: e.target.value}}))} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="max-activities" defaultMessage="Max activities"/>
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={newLicense.max_activities || ""}
              onChange={e => setNewLicense(update(newLicense, {"$merge": {max_activities: e.target.value ? parseInt(e.target.value) : undefined}}))} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="license key" defaultMessage="License key"/>
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="textarea"
              rows={10}
              value={key}
              onChange={e => setKey(e.target.value)}/>
              <hr/>
            <Button
              onClick={() => {
                generateLicense(Object.assign({key: key}, newLicense), license => {
                  onNewLicense && onNewLicense(license);
                })
              }}
              bsStyle="primary" >
              Generate
            </Button>
          </Col>
        </FormGroup>
      </>
    )
}

function LicensePanel() {
    const [newLicense, setNewLicense] = useState("");
    const [newDetails, setNewDetails] = useState(null);
    const [current, setCurrent] = useState({});

    useEffect(() => {
      fetchLicenseDetails(setCurrent).catch(console.error);
    }, []);

    return (
    <Panel>
      <Panel.Body>
        <Form horizontal>
          <StaticControl label="Valid until" value={current.valid_until || "n/a"}/>
          <StaticControl label="Assigned to" value={current.customer_name}/>
          <StaticControl label="Demo" value={current.demo ? "yes": "no"}/>
          <StaticControl label="Max activities" value={current.fields?.max_activities || "*not set*"}/>
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
          <hr/>
          {
            current.customer_name?.startsWith("netaxis") &&
              <LicenseGenerator onNewLicense={setNewLicense} />
          }
        </Form>
      </Panel.Body>
    </Panel>
    );
}

function CachePanel({cache, onChange}) {
  return (
    <Panel>
      <Panel.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="URI" defaultMessage="URI"/>
            </Col>
            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={cache.store}
                onChange={e => onChange(update(cache, {$merge: {store: e.target.value}}))}/>
              <HelpBlock>
                Samples:<br/>
                memory:// for local process, in-memory caching<br/>
                redis://localhost:6379/1 for redis remote caching
              </HelpBlock>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

function EnvVariablesPanel({env, onChange}) {
  const [newVar, setNewVar] = useState({});

  return (
    <Panel>
      <Panel.Body>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Type</th>
              <th/>
            </tr>
          </thead>
          <tbody>
          {
            Object.entries(env).map(([key, value]) => (
              <tr>
                <td>{key}</td>
                <td>
                  {
                    typeof value === "boolean" ?
                      <Checkbox
                        checked={value}
                        onChange={e => onChange(update(env, {$merge: {[key]: e.target.checked}}))}/> :
                    typeof value === "number" ?
                      <FormControl
                        componentClass="input"
                        value={value}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10);
                          if(!isNaN(v)) {
                            onChange(update(env, {$merge: {[key]: v}}))
                          }
                        }} /> :
                    <FormControl
                      componentClass="input"
                      value={value}
                      onChange={e => onChange(update(env, {$merge: {[key]: e.target.value}}))
                      } />
                  }
                </td>
                <td/>
                <td>
                  <Button onClick={() => onChange(update(env, {$unset: [key]}))}>-</Button>
                </td>
              </tr>
            ))
          }
          <tr>
            <td>
              <FormControl
                componentClass="input"
                value={newVar.key || ""}
                onChange={e => setNewVar(update(newVar, {$merge: {key: e.target.value}}))}
                />
            </td>
            <td>
              <FormControl
                componentClass="input"
                value={newVar.value || ""}
                onChange={e => setNewVar(update(newVar, {$merge: {value: e.target.value}}))}
                />
            </td>
            <td>
              <Select
                value={{value: newVar.value_type || "string", label: newVar.value_type || "string"}}
                className="basic-single"
                classNamePrefix="select"
                onChange={v => setNewVar(update(newVar, {$merge: {value_type: v.value}}))}
                options={["string", "integer", "boolean"].map(t => ({value: t, label: t}))}
              />
            </td>
            <td>
              <Button
                disabled={
                  !newVar.key || newVar.key.length === 0 ||
                  (newVar.value_type === "integer" && isNaN(parseInt(newVar.value, 10)))
                }
                onClick={e => {
                let value = newVar.value;
                switch (newVar.value_type) {
                  case "integer":
                    value = parseInt(value, 10);
                    break;
                  case "boolean":
                    value = value === "true";
                    break;
                }
                onChange(update(env, {[newVar.key]: {$set: value}}));
                setNewVar({});
              }}>+</Button>
            </td>
          </tr>
          </tbody>
        </Table>
      </Panel.Body>
    </Panel>
  )
}

function PasswordPanel({password, onChange}) {
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
              <FormattedMessage id="enforce lowercase" defaultMessage="Lowercase char."/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={
                  password.lowercase === undefined ? 0 :
                    typeof password.lowercase === "boolean" ? (password.lowercase ? 1:0) :
                    password.lowercase
                }
                onChange={e => onChange(update(password, {$merge: {lowercase: e.target.value ? parseInt(e.target.value):undefined}}))}/>
              <HelpBlock>
                The password has to contain at least n lower case characters (a-z)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce uppercase" defaultMessage="Uppercase char."/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={
                  password.uppercase === undefined ? 0 :
                    typeof password.uppercase === "boolean" ? (password.uppercase ? 1:0) :
                    password.uppercase
                }
                onChange={e => onChange(update(password, {$merge: {uppercase: e.target.value ? parseInt(e.target.value):undefined}}))}/>
              <HelpBlock>
                The password has to contain at least n upper case characters (A-Z)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce digits" defaultMessage="Digits char."/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={
                  password.digits === undefined ? 0 :
                    typeof password.digits === "boolean" ? (password.digits ? 1:0) :
                    password.digits
                }
                onChange={e => onChange(update(password, {$merge: {digits: e.target.value ? parseInt(e.target.value):undefined}}))}/>
              <HelpBlock>
                The password has to contain at least n digit (0-9)
              </HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="enforce special char" defaultMessage="Special char."/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={
                  password.special_chars === undefined ? 0 :
                    typeof password.special_chars === "boolean" ? (password.special_chars ? 1:0) :
                    password.special_chars
                }
                onChange={e => onChange(update(password, {$merge: {special_chars: e.target.value ? parseInt(e.target.value):undefined}}))}/>
              <HelpBlock>
                The password have to contain at least n special character (%()*./:;?[]_-)
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
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="cannot contain username" defaultMessage="Cannot contain the username"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.cannot_contain_username || false}
                onChange={e => onChange(update(password, {$merge: {cannot_contain_username: e.target.checked}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="cannot be an an old password reversed" defaultMessage="Cannot be an an old password reversed"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={password.cannot_reverse_old_password || false}
                onChange={e => onChange(update(password, {$merge: {cannot_reverse_old_password: e.target.checked}}))} />
              <HelpBlock>
                In the limit of the history limit check configured above
              </HelpBlock>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
    )
}


function SMTPForm({smtp, onChange}) {
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
              <HiddenField
                value={smtp.password}
                onChange={e => onChange(update(smtp, {$merge: {password: e.target.value}}))}/>
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="tls" defaultMessage="TLS"/>
            </Col>

            <Col sm={9}>
              <Checkbox
                checked={smtp.ssl === true}
                onChange={e => onChange(update(smtp, {$merge: {ssl: e.target.checked}}))}/>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

function SMPPForm({smpp, onChange}) {
  return (
    <>
      <HelpBlock>
        Configuration for SMPP service. This service is used to send SMS through an SMS gateway.
      </HelpBlock>
      <Panel>
        <Panel.Body>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="host" defaultMessage="Host"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={smpp.host || ""}
                  placeholder='localhost:2775'
                  onChange={e => onChange(update(smpp, {$merge: {host: e.target.value}}))}/>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="system-ID" defaultMessage="System ID"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={smpp.systemID || ""}
                  placeholder='169994'
                  onChange={e => onChange(update(smpp, {$merge: {systemID: e.target.value}}))}/>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="password" defaultMessage="Password"/>
              </Col>

              <Col sm={9}>
                <HiddenField
                  value={smpp.password || ""}
                  placeholder='secret'
                  onChange={e => onChange(update(smpp, {$merge: {password: e.target.value}}))}/>
              </Col>
            </FormGroup>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="system type" defaultMessage="System Type"/>
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={smpp.systemType || ""}
                  onChange={e => onChange(update(smpp, {$merge: {systemType: e.target.value}}))}/>
                <HelpBlock>
                  Optional
                </HelpBlock>
              </Col>
            </FormGroup>
            
          </Form>
        </Panel.Body>
      </Panel>
    </>
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

function DataStoresPanel({stores, onChange}) {
  const [showNew, setShowNew] = useState(false);
  if (stores === undefined) {
    stores = [];
  }

  return (
    <>
      {
        stores
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s, i) => (
            <Panel key={`store-${s.name}`}>
                <Panel.Heading>
                  <Panel.Title toggle>{s.name}</Panel.Title>
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
                          value={s.name}
                          readOnly/>
                        <HelpBlock>
                          Label to identify the store in the workflows
                        </HelpBlock>
                      </Col>
                    </FormGroup>
                    <FormGroup>
                      <Col componentClass={ControlLabel} sm={2}>
                        <FormattedMessage id="dsn" defaultMessage="Dsn"/>
                      </Col>

                      <Col sm={9}>
                        <FormControl
                          componentClass="input"
                          value={s.dsn}
                          placeholder="postgresql://user:secret@host:5432/database"
                          onChange={e => onChange(update(stores, {[i]: {$merge: {dsn: e.target.value}}}))}/>
                      </Col>
                    </FormGroup>

                    <FormGroup>
                      <Col smOffset={2} sm={9}>
                        <ButtonToolbar>
                          <Button bsStyle="danger"
                                  onClick={() => onChange(update(stores, {$splice: [[i, 1]]}))}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                          </Button>
                        </ButtonToolbar>
                      </Col>
                    </FormGroup>
                  </Form>
                </Panel.Body>
              </Panel>
          ))
      }

      <Panel>
        <Panel.Body>
          <ButtonToolbar>
            <Button onClick={() => setShowNew(true)} bsStyle="primary">
              <FormattedMessage id="new" defaultMessage="New"/>
            </Button>
          </ButtonToolbar>
          <NewDataStoreModal
            show={showNew}
            onHide={newEntry => {
              setShowNew(false);
              if (newEntry !== undefined) {
                onChange(update(stores, {$push: [newEntry]}))
              }
            }}
          />
        </Panel.Body>
      </Panel>
    </>
  );
}

const newDataStore = {
  name: "",
  dsn: "",
};

function NewDataStoreModal({show, onHide}) {
  const [entry, setEntry] = useState(newDataStore);

  useEffect(() => {
    !show && setEntry(newDataStore)
  }, [show]);

  return (
    <Modal show={show} onHide={() => onHide(undefined)} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          New data store
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
              <FormattedMessage id="dsn" defaultMessage="DSN"/>
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={entry.dsn}
                onChange={e => setEntry(update(entry, {$merge: {dsn: e.target.value}}))}/>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(entry)}
                disabled={!entry.name || entry.dsn.length === 0 || entry.name.length === 0}
                bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
        <Button onClick={() => onHide(undefined)}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
      </Modal.Footer>
    </Modal>
  );
}

const newProvisioningGateway = {
  name: "",
  prefix: ""
};

function NewProvisioningGatewayModal({show, onHide}) {
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

function ProvisioningPanels({prov, onChange}) {
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

function HiddenField({value, onChange}) {
  return (
    <FormControl
      componentClass="input"
      value={
        value?.startsWith("## SECRET ##") ?
          "" :
          value
      }
      placeholder={
        value?.startsWith("## SECRET ##") ?
          "********" :
          ""
      }
      onChange={onChange}/>
  )
}

function HiddenTextarea({value, placeholder, rows, style, onChange}) {
  return (
    <FormControl
      componentClass="textarea"
      rows={rows}
      style={style}
      value={
        value?.startsWith("## SECRET ##") ?
          "" :
          value
      }
      placeholder={
        value?.startsWith("## SECRET ##") ?
          "********" :
          placeholder
      }
      onChange={onChange}/>
  )
}

export default function Configuration({userInfo, history}) {
  const [activeKey, setActiveKey] = useState("Gateways");
  const [config, setConfig] = useState({});
  const { hash, search } = useLocation();

  useEffect(() => {
    hash && hash.length > 1 && setActiveKey(hash.substring(1));
  }, [hash]);

  const searchQuery = new URLSearchParams(search);

  useEffect(() => {
    fetchConfiguration(searchQuery.get("r")=="true", setConfig);
  }, [searchQuery.get("r")]);

  useEffect(() => {
    document.title = `Configuration - ${activeKey}`;
  }, [activeKey]);

  const editConfig = e => setConfig(update(config, {$merge: {content: e.updated_src}}));

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
      <Tabs defaultActiveKey={hash ? hash.substring(1) : "Gateways"} onSelect={key => {
        setActiveKey(key);
        history.replace("#" + key);
      }} id="config-tabs">
        <Tab eventKey={"Gateways"} title="Gateways">
          <GatewaysPanel
            gateways={config.content.gateways}
            onChange={v => setConfig(update(config, {content: {gateways: {$set: v}}}))}/>
        </Tab>
        <Tab eventKey={"TCP"} title="TCP">
          <TcpGwsPanel
            gateways={config.content.gateways_tcp || {} }
            onChange={v => setConfig(update(config, {content: {gateways_tcp: {$set: v}}}))}/>
        </Tab>
        <Tab eventKey={"Datastore"} title="Data Stores">
          <DataStoresPanel
            stores={config.content.datastores}
            onChange={v => setConfig(update(config, {content: {datastores: {$set: v}}}))}/>
        </Tab>
        <Tab eventKey={"Gui"} title="Gui">
          <GuiForm
            gui={config.content.gui}
            onChange={v => setConfig(update(config, {content: {gui: {$merge: v}}}))}/>
        </Tab>
        <Tab eventKey={"SMTP"} title="SMTP">
          <SMTPForm
            smtp={config.content.smtp}
            onChange={v => setConfig(update(config, {content: {smtp: {$merge: v}}}))}
          />
        </Tab>
        <Tab eventKey={"SMPP"} title="SMPP">
          <SMPPForm
            smpp={config.content.smpp || {}}
            onChange={v => setConfig(update(config, {content: {smpp: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"Provisioning"} title="Provisioning">
          <ProvisioningPanels
            prov={config.content.provisioning || {}}
            onChange={v => setConfig(update(config, {content: {provisioning: {$merge: v}}}))}
          />
        </Tab>
        <Tab eventKey={"Logs"} title="Logs">
          <LogsPanel
            logs={config.content.logs || {}}
            onChange={v => setConfig(update(config, {content: {logs: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"Password"} title="Password">
          <PasswordPanel
            password={config.content.password || {}}
            onChange={v => setConfig(update(config, {content: {password: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"SSO"} title="SSO">
          <SSOPanel
            sso={config.content.SSO || []}
            gateways={config.content.gateways}
            enabledMods={config.content.gui?.modules || []}
            onChange={v => setConfig(update(config, {content: {SSO: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"Alarms"} title="Alarms">
          <AlarmsPanel
            alarms={config.content.alarms || {}}
            onChange={v => setConfig(update(config, {content: {alarms: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"Cleanup"} title="Cleanup">
          <CleanupPanel
            retention={config.content.retention || {}}
            onChange={v => setConfig(update(config, {content: {retention: {$set: v}}}))}
          />
        </Tab>
        <Tab eventKey={"License"} title="License">
          <LicensePanel />
        </Tab>
        <Tab eventKey={"Env"} title="Env.">
          {
            activeKey === "Env" && config.content &&
            <EnvVariablesPanel
              env={config.content.env || {}}
              onChange={v => setConfig(update(config, {content: {env: {$set: v}}}))}
            />
          }
        </Tab>
        <Tab eventKey={"Cache"} title="Cache">
          {
            activeKey === "Cache" && config.content &&
            <CachePanel
              cache={config.content.cache || {}}
              onChange={v => setConfig(update(config, {content: {cache: {$set: v}}}))}
            />
          }
        </Tab>
        <Tab eventKey={"Raw"} title="Raw">
          {
            activeKey === "Raw" && config.content &&
            <ReactJson
              name={null}
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
