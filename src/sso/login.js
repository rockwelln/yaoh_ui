import React, {Component, useEffect} from "react";
import {Redirect} from 'react-router-dom';
import {sso_auth_service} from "./auth_service";
import loading from "../loading.gif";
import {NotificationsManager, parseJSON} from "../utils";


// const local_base_url = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
export function AuthCallback(props) {
    const name = props.match.params.name;
    useEffect(() => {
        fetch(`/api/v01/auth/login_${name}${window.location.search}`, {method: "post"})
          .then(r => {
            if (r.status >= 200 && r.status < 300) {
                return r
            } else if (r.status === 401) {
                throw new Error(r.statusText);
            }
          })
          .then(parseJSON)
          .then(r => {
            props.onLogin(r);
            if(r.redirect_to) {
              window.location = r.redirect_to || "/";
            } else {
              window.location = "/";
            }
          })
          .catch(error => {
              NotificationsManager.error("Failed to authenticate you", error.message);
              setTimeout(() => window.location = "/", 3000);
          })
    }, []);

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

export class AuthCallback_ extends Component {
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