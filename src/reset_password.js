import React, {Component, useEffect, useState} from "react";
import Row from "react-bootstrap/lib/Row";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import FormControl from "react-bootstrap/lib/FormControl";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Button from "react-bootstrap/lib/Button";
import Col from "react-bootstrap/lib/Col";
import Alert from "react-bootstrap/lib/Alert";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import {FormattedMessage} from "react-intl";
import {API_URL_PREFIX, checkStatus} from "./utils";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";

const RESET_PASSWORD_TOKEN_LENGTH = 64;
export const RESET_PASSWORD_PREFIX = '/reset-password/';


function triggerResetPassword(username, onSuccess, onError) {
    fetch(API_URL_PREFIX + '/api/v01/auth/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
        }),
    }).then(checkStatus)
    .then(() => onSuccess())
    .catch(onError);
}

export class ResetPasswordForm extends Component {
    constructor(props) {
        super(props);
        this.state = {password: '', confirm: '', error: undefined, success: false}
    }

    onSubmit(e) {
        e.preventDefault();

        fetch(API_URL_PREFIX + '/api/v01/auth/reset-password/' + window.location.href.substr(- RESET_PASSWORD_TOKEN_LENGTH), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: this.state.password,
            }),
        })
            .then(checkStatus)
            .then(() => this.setState({success: true, error: undefined}))
            .catch(error => this.setState({error: error.response.statusText}))
    }

    render() {
        const {success, password, error, confirm} = this.state;

        if(success) {
            setTimeout(() => window.location.href = "/", 2000);
            return (
                <Alert bsStyle="success">
                    <FormattedMessage id="password-reset" defaultMessage="Your password has been reset."/>
                </Alert>
            );
        }

        const validPassword = (password === '')?null:(password.length >= 8)?"success":"error";
        const validConfirm = (password === '')?null:(confirm === password)?"success":"error";
        const validForm = (validPassword === "success" && validConfirm === "success");

        return (
            <Form horizontal>
                {error && (
                    <Alert bsStyle="danger">
                        <FormattedMessage id="fail-password-reset" defaultMessage="Failed to reset the password." />
                        {` (${error})`}
                    </Alert>
                )}
                <FormGroup validationState={validPassword}>
                    <Col componentClass={ControlLabel} sm={3}>
                        <FormattedMessage id="password" defaultMessage="Password" />
                    </Col>

                    <Col sm={8}>
                        <FormControl
                            type="password"
                            value={password}
                            onChange={(e) => this.setState({password: e.target.value, error: undefined})}
                        />
                        <HelpBlock><FormattedMessage id="Your password must be at least 8 characters long."/></HelpBlock>
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
                            onChange={(e) => this.setState({confirm: e.target.value, error: undefined})}
                        />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col smOffset={3} sm={10}>
                        <Button type="submit" onClick={this.onSubmit.bind(this)} disabled={!validForm}>
                            <FormattedMessage id="submit" defaultMessage="Submit" />
                        </Button>
                    </Col>
                </FormGroup>
            </Form>)
    }
}

export function ResetPasswordRequestForm(props) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const {onReset} = props;

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
