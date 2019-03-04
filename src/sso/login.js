import React, {Component} from "react";
import {Redirect} from 'react-router-dom';
import Button from "react-bootstrap/lib/Button";

import {FormattedMessage} from "react-intl";
import {sso_auth_service} from "./auth_service";
import loading from "../loading.gif";


export class LoginOpenIdConnect extends Component {
    static onLoginButtonClick() {
        sso_auth_service.startAuthentication();
    }

    render() {
        return (
            <Button bsStyle="primary" size="lg" block onClick={LoginOpenIdConnect.onLoginButtonClick}>
                <FormattedMessage id="login-openid" defaultMessage="Login with OpenID Connect"/>
            </Button>
        )
    }
}

// const local_base_url = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
export class AuthCallback extends Component {
    constructor(props) {
        super(props);
        this.state = {redirect: false};
    }

    componentDidMount() {
        sso_auth_service.completeAuthentication().then(() => {
            // console.log(sso_auth_service.user);
            // window.location = `${local_base_url}/dashboard`;
            this.setState({redirect: true});
        }).catch(e => {
            console.error(e);
            this.setState({redirect: true});
            // window.location = `${local_base_url}/dashboard`;
        });
    }

    render() {
        const {redirect} = this.state;
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}>
                <img src={loading} width="200" height="200" alt="authenticating..." />
                {
                    redirect && <Redirect to="/"/>
                }
            </div>
        )
    }
}

export class AuthSilentCallback extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        sso_auth_service.manager.signinSilentCallback()
            .then(() => console.log("signin silent callback"))
            .catch(e => console.error(e));
    }

    render() {
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}>
                <img src={loading} width="200" height="200" alt="authenticating..." />
            </div>
        )
    }
}