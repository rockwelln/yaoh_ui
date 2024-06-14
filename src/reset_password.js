import React, {useCallback, useEffect, useState} from "react";
import { useLocation } from "react-router-dom";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import {FormattedMessage} from "react-intl";
import {API_URL_PREFIX, NotificationsManager, checkStatus} from "./utils";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";

export const RESET_PASSWORD_PREFIX = '/reset-password/';


function triggerResetPassword(username, onSuccess, onError) {
    return fetch(API_URL_PREFIX + '/api/v01/auth/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username}),
    }).then(checkStatus)
    .then(() => onSuccess())
    .catch(onError);
}

function PasswordValidationList({password, token}) {
    const [rules, setRules] = useState({});

    useEffect(() => {
        fetch(`/api/v01/auth/password-rules` + (token && `/${token}`))
        .then(checkStatus)
        .then(r => r.json())
        .then(r => setRules(r.rules))
        .catch(e => console.error("failed fetch auth rules", e))
    }, [token]);
    
    const ruleSet = rules?.system;

    return (
        <ul>
            <Rule
                show={ruleSet?.min_length > 0}
                isValid={ruleSet?.min_length <= password.length}>
                <FormattedMessage id="min-length" defaultMessage="min. length {minLength}" values={{minLength: ruleSet?.min_length}}/>
            </Rule>
            <Rule
                show={ruleSet?.min_uppercase > 0}
                isValid={ruleSet?.min_uppercase <= countUppercases(password)}>
                <FormattedMessage id="min-uppercases" defaultMessage="require {minU} uppercases" values={{minU: ruleSet?.min_uppercase}}/>
            </Rule>
            <Rule
                show={ruleSet?.min_lowercase > 0}
                isValid={ruleSet?.min_lowercase <= countLowercases(password)}>
                <FormattedMessage id="min-lowercases" defaultMessage="require {minU} lowercases" values={{minU: ruleSet?.min_lowercase}}/>
            </Rule>
            <Rule
                show={ruleSet?.min_digits > 0}
                isValid={ruleSet?.min_digits <= countDigits(password)}>
                <FormattedMessage id="min-digits" defaultMessage="require {minU} digits" values={{minU: ruleSet?.min_digits}}/>
            </Rule>
            <Rule
                show={ruleSet?.min_special_chars > 0}
                isValid={ruleSet?.min_special_chars <= countSpecialChars(password)}>
                <FormattedMessage id="min-special-chars" defaultMessage="require {minU} special characters (!@#$%&*)" values={{minU: ruleSet?.min_special_chars}}/>
            </Rule>
            <Rule show={ruleSet?.history}>
                <FormattedMessage id="cannot-contains-history" defaultMessage="cannot contain {minU} old passwords" values={{minU: ruleSet?.min_special_chars}} />
            </Rule>
            <Rule show={ruleSet?.cannot_contains_username}>
                <FormattedMessage id="cannot-contains-username" defaultMessage="cannot contain the username" />
            </Rule>
            <Rule show={ruleSet?.cannot_contains_rev_old_passwords}>
                <FormattedMessage id="cannot-contains-old-pwds-rev" defaultMessage="cannot contain old passwords" />
            </Rule>
        </ul>
    )
}

function Rule({show, isValid, children}) {
    const color = (isValid === true) ? "green" : (isValid === false) ? "red" : null
    return (
        show ? <li style={{color}}>{children}</li> : null
    )
}

const countLowercases = (s) => (s.match(/[a-z]/g) || '').length;
const countUppercases = (s) => (s.match(/[A-Z]/g) || '').length;
const countDigits = (s) => (s.match(/[0-9]/g) || '').length;
const countSpecialChars = (s) => (s.match(/[!@#$%&*]/g) || '').length;

export function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState();
    const [success, setSuccess] = useState(false);
    const {pathname} = useLocation();

    useEffect(() => {
        setPassword("");
        setConfirm("");
        setError();
        setSuccess(false)
    }, []);

    useEffect(() => {
        if(success) {
            setTimeout(() => {
                window.location = "/";
            }, 1000);
        }
    }, [success])

    useEffect(() => {
        setError();
    }, [password, confirm]);

    const token = pathname?.substr(pathname.lastIndexOf('/')+1);

    const submit = useCallback((e) => {
        e.preventDefault();
        fetch(`${API_URL_PREFIX}/api/v01/auth/reset-password/${token}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({password}),
        })
            .then(checkStatus)
            .then(() => setSuccess(true))
            .catch(e => {
                setError(e.response.statusText);
            })
    }, [password]);

    const validConfirm = (password === '')?null:(confirm === password)?"success":"error";

    return (
        <Form horizontal onSubmit={submit}>
            {error && (
                <Alert bsStyle="danger">
                    <FormattedMessage id="fail-password-reset" defaultMessage="Failed to reset the password." />
                    {` (${error})`}
                </Alert>
            )}
            {success && (
                <Alert bsStyle="success">
                    <FormattedMessage id="password-reset" defaultMessage="Your password has been reset." />
                </Alert>
            )}
            <FormGroup>
                <Col componentClass={ControlLabel} sm={3}>
                    <FormattedMessage id="password" defaultMessage="Password" />
                </Col>

                <Col sm={8}>
                    <FormControl
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <PasswordValidationList password={password} token={token} />
                    
                </Col>
            </FormGroup>
            <FormGroup validationState={validConfirm}>
                <Col componentClass={ControlLabel} sm={3}>
                    <FormattedMessage id="confirm" defaultMessage="Confirm" />
                </Col>

                <Col sm={8}>
                    <FormControl
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                    />
                </Col>
            </FormGroup>
            <FormGroup>
                <Col smOffset={3} sm={10}>
                    <Button type="submit" disabled={!validConfirm}>
                        <FormattedMessage id="submit" defaultMessage="Submit" />
                    </Button>
                </Col>
            </FormGroup>
        </Form>
    );
}

export function ResetPasswordRequestForm({onReset}) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {setError(undefined);}, [username]);

    return (
        <Form horizontal>
            {
                error &&
                    <Alert bsStyle="danger">
                        {error.message}
                    </Alert>
            }
            {
                sent &&
                    <Alert bsStyle="success">
                        <FormattedMessage id="reset-password-sent" defaultMessage="Reset password request sent!" />
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
                            triggerResetPassword(
                                username,
                                r => {setLoading(false); setSent(true); onReset && onReset(r);},
                                e => {setLoading(false); setError(e);}
                            );
                        }} disabled={username.length === 0 || loading || sent}>
                            <FormattedMessage id="reset" defaultMessage="Reset" />
                        </Button>
                    </ButtonToolbar>
                </Col>
            </FormGroup>
        </Form>
    )
}
