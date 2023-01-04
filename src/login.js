import React, {useEffect, useState} from "react";
import Alert from "react-bootstrap/lib/Alert";
import {FormattedMessage} from "react-intl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Form from "react-bootstrap/lib/Form";
import {LinkContainer} from "react-router-bootstrap";
import {API_URL_PREFIX, AuthServiceManager, fetch_get, parseJSON} from "./utils";
import Row from "react-bootstrap/lib/Row";
import Panel from "react-bootstrap/lib/Panel";
import Modal from "react-bootstrap/lib/Modal";
import Checkbox from "react-bootstrap/lib/Checkbox";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";


function signIn(username, password, onSuccess, onError) {
    fetch(API_URL_PREFIX + '/api/v01/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    }).then(response => {
        if(response.status >= 200 && response.status < 300) {
            return response;
        }
        const contentType = response.headers.get("content-type");
        if(contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function(json) {
              const message =
                  (json.errors && json.errors[0] && json.errors[0].message) ?
                      `${json.errors[0].message}. Status Code: ${response.status}` :
                      (json.error || response.statusText);
              let error = new Error(message);
              error.response = response;
              if(json.errors) {
                  error.errors = json.errors;
              }
              throw error;
            });
        }
        if(response.status === 401) {
            throw new Error("invalid credentials");
        }

        let error = new Error(response.statusText);
        error.response = response;
        throw error;
    })
        .then(parseJSON)
        .then(data => onSuccess(data))
        .catch(e => onError(e))
}


function check2fa(code, payload, trust, onSuccess, onError) {
    fetch(API_URL_PREFIX + '/api/v01/auth/2fa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: code,
            trust: trust,
            "2fa_payload": payload,
        }),
    }).then(response => {
        if(response.status >= 200 && response.status < 300) {
            return response;
        }
        const contentType = response.headers.get("content-type");
        if(contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function(json) {
              const message =
                  (json.errors && json.errors[0] && json.errors[0].message) ?
                      `${json.errors[0].message}. Status Code: ${response.status}` :
                      (json.error || response.statusText);
              let error = new Error(message);
              error.response = response;
              if(json.errors) {
                  error.errors = json.errors;
              }
              throw error;
            });
        }

        let error = new Error(response.statusText);
        error.response = response;
        throw error;
    })
        .then(parseJSON)
        .then(data => onSuccess(data))
        .catch(e => onError(e))
}


export function fetchPlatformDetails(onSuccess) {
    fetch_get('/api/v01/system/configuration/public')
        .then(data => onSuccess && onSuccess(data))
        .catch(console.error);
}


function TwoFaModal(props) {
    const [code, setCode] = useState("");
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [trust, setTrust] = useState(false);

    const {show, onSuccess, onError, loginResp} = props;

    return (
        <Modal show={show}>
            <Modal.Header>
                <Modal.Title><FormattedMessage id="2FA" defaultMessage="Please confirm your credentials" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    error &&
                        <Alert bsStyle="danger">
                            {error.message}
                        </Alert>
                }
                <p>
                    An email containing a validation code has been sent to your email address.
                </p>
                <Form horizontal>
                    <FormGroup validationState={error === undefined?null:"error"}>
                        <Col componentClass={ControlLabel} sm={3}>
                            <FormattedMessage id="validation code" defaultMessage="Validation code" />
                        </Col>

                        <Col sm={8}>
                            <FormControl
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                number
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup validationState={error === undefined?null:"error"}>
                        <Col sm={8} smOffset={3}>
                            <Checkbox
                              checked={trust}
                              onChange={e => setTrust(e.target.checked)}>
                                Trust this machine.
                            </Checkbox>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col smOffset={3} sm={10}>
                            <ButtonToolbar>
                                <Button type="submit" onClick={e => {
                                    e.preventDefault();
                                    setLoading(true);
                                    setError(undefined);
                                    check2fa(
                                        code,
                                        loginResp["2fa_payload"],
                                        trust,
                                        r => {
                                            setLoading(false);
                                            onSuccess({...loginResp, ...r});
                                        },
                                        e => {setLoading(false); setError(e);}
                                    );
                                }} disabled={code.length === 0 || loading}>
                                    <FormattedMessage id="sign-in" defaultMessage="Sign in" />
                                </Button>
                            </ButtonToolbar>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


export function LoginForm({onLogin}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [loginResp, setLoginResp] = useState(null);
    const [sso, setSso] = useState([]);

    useEffect(() => {
      fetchPlatformDetails(data => {
         data.auth && data.auth.SSO && setSso(data.auth.SSO)
      })
    }, []);

    useEffect(() => {setError(undefined);}, [username, password]);

    return (
        <>
          { sso.length > 0 && (
            <Row>
              <Col smOffset={1} sm={10}>
                <ButtonGroup vertical block>
                  {
                    sso.map(provider => {
                      return <Button
                          key={provider.name}
                          onClick={() => {
                            setError(undefined);
                            AuthServiceManager.logout();
                            // 1. fetch the login request signed (loc => window.location.href, to return to the same page)
                            fetch_get(`/api/v01/auth/${provider.protocol}/loginRequest?name=${provider.name}&state=${window.location.href}`)
                              .then(r => {
                                // SAML implementation in Keycloak require the url to stay encoded
                                // but OIDC OAM require the URL to be decoded
                                if(r.url.includes("SAML")) {
                                  window.location = r.url
                                } else {
                                  window.location = decodeURIComponent(r.url)
                                }
                              })
                              .catch(e => setError(e))
                          }}
                          bsStyle="primary">Login with {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}</Button>
                    })
                  }
                </ButtonGroup>
                <hr/>
              </Col>
            </Row>
          )}
          <Row>
            <Form horizontal>
                {
                    error &&
                        <Alert bsStyle="danger">
                            {error.message}
                        </Alert>
                }
                <FormGroup validationState={error === undefined?null:"error"}>
                    <Col componentClass={ControlLabel} sm={3}>
                        <FormattedMessage id="username" defaultMessage="Username" />
                    </Col>

                    <Col sm={8}>
                        <FormControl
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                        />
                    </Col>
                </FormGroup>
                <FormGroup validationState={error === undefined?null:"error"}>
                    <Col componentClass={ControlLabel} sm={3}>
                        <FormattedMessage id="password" defaultMessage="Password" />
                    </Col>

                    <Col sm={8}>
                        <FormControl
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col smOffset={3} sm={10}>
                        <ButtonToolbar>
                            <Button type="submit" onClick={e => {
                                e.preventDefault();
                                setLoading(true);
                                setError(undefined);
                                setLoginResp(null);
                                signIn(
                                    username,
                                    password,
                                    r => {
                                        setLoading(false);
                                        if (r["2fa_payload"] !== undefined) {
                                            setLoginResp(r);
                                        } else {
                                            onLogin(r);
                                        }
                                    },
                                    e => {setLoading(false); setError(e);}
                                );
                            }} disabled={username.length === 0 || password.length === 0 || loading}>
                                <FormattedMessage id="sign-in" defaultMessage="Sign in" />
                            </Button>
                            <LinkContainer to={`/reset-password`}>
                                <Button bsStyle="link">
                                    <FormattedMessage id="reset-password" defaultMessage="Reset password"/>
                                </Button>
                            </LinkContainer>
                        </ButtonToolbar>
                    </Col>
                </FormGroup>
                <TwoFaModal
                    show={loginResp !== null && loginResp["2fa_payload"]}
                    loginResp={loginResp}
                    onSuccess={r => onLogin(r)}
                    onError={error => setError(error)} />
            </Form>
          </Row>
        </>
    )
}


export function LoginPage({error_msg, standby_alert, logo, children}) {
    return (
        <div>
            <Row style={{height: "20px", display: "block"}}/>
            <Row style={{height: "100%", display: "block"}}>
                <Col xsOffset={1} xs={10} mdOffset={4} md={4}>
                    {
                        standby_alert
                    }
                    <Panel>
                        <Panel.Body>
                            {logo &&
                            <Row>
                                <Col xsOffset={3} xs={6} mdOffset={3} md={7}>
                                    <img src={logo}
                                         width={"100%"}
                                         height={"100%"}
                                         style={{padding: 0}}
                                         alt="apio"/>
                                </Col>
                            </Row>
                            }
                            <Row>
                                <Col xsOffset={1} xs={10} mdOffset={0} md={12}>
                                    {
                                        error_msg && (
                                            <Alert bsStyle="danger">
                                                <p>{error_msg}</p>
                                            </Alert>
                                        )
                                    }
                                    { /* <LoginOpenIdConnect /> */}
                                    <hr/>
                                    {children}
                                </Col>
                            </Row>
                        </Panel.Body>
                    </Panel>
                </Col>
            </Row>
        </div>
    )
}
