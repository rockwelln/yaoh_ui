import React, { Component } from 'react';

import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Col from 'react-bootstrap/lib/Col';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Button from 'react-bootstrap/lib/Button';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Row from 'react-bootstrap/lib/Row';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import {FormattedMessage} from 'react-intl';
import update from 'immutability-helper';

import {fetch_get, fetch_put} from "../utils";


export class ConfigManagement extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {config: {}, category: undefined, errors: []};
        this.onSubmit = this.onSubmit.bind(this);
        this.sortFields = this.sortFields.bind(this);
        this.getInputField = this.getInputField.bind(this);
    }

    componentDidMount() {
        const {notifications} = this.props;
        fetch_get(this.props.uri, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({config: data}))
            .catch(error => {
                !this.cancelLoad && notifications.addNotification({
                    title: <FormattedMessage id="fetch-config-fail" defaultMessage="Fail configuration fetch"/>,
                    message: error.message,
                    level: 'error',
                });
            }
        );
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onSubmit() {
        const {uri, auth_token} = this.props;
        fetch_put(uri, this.state.config, auth_token)
            .then(() => this.props.notifications.addNotification({
                message: <FormattedMessage id="saved" defaultMessage="Saved!"/>,
                level: 'success',
            }))
            .catch(error => {
                console.log(error);
                this.setState({errors: error.errors})
            });
    }

    validateEntry(entry, name) {
        let error_message = this.state.errors.find(e => (e[0] === this.state.category && e[1] === name));
        if (error_message !== undefined) {
            return "error"
        }
        return null;
    }

    sortFields() {  // here we have a chance to put the fields in the right order for the user.
        let r = Object.keys(this.state.config[this.state.category]);
        switch(this.state.category) {
            case 'SMTP':
                const remaining = r.filter(e => e !== 'Host' && e !== 'Port' && e !== 'SSL' && e !== 'Username' && e !== 'Password' && e !== 'From');
                r = ['Host', 'Port', 'SSL', 'Username', 'Password', 'From'].concat(remaining);
                break;
            default: break;
        }
        if(r.length !== Object.keys(this.state.config[this.state.category]).length) {
            console.warn("hey some fields were filtered out!!!")
        }
        return r;
    }

    getInputField(entry, p) {
        let t = undefined;
        switch(entry.type || entry.definition.type) {
            case 'gateway-url':
            case 'url':
            case 'str': t = 'text'; break;
            case 'int': t = 'number'; break;
            case 'bool':
                return (<Checkbox checked={entry.value === "true"} onChange={(e) => this.setState({
                        config: update(this.state.config,
                                {[this.state.category]: {[p]: {$merge: {value: e.target.checked?"true":"false"}}}}
                            )
                    })}
                />);
            default: t = entry.type; break;  // password, email...
        }
        return (
            <FormGroup>
                <FormControl type={t} value={entry.value}
                    onChange={e => this.setState({
                        config: update(this.state.config,
                                {[this.state.category]: {[p]: {$merge: {value: e.target.value}}}}
                            ),
                    })}
                />
                {entry.help && (
                    <HelpBlock>
                        {entry.help}
                    </HelpBlock>)
                }
            </FormGroup>
        )
    }

    render() {
        return <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active>{this.props.menu}</Breadcrumb.Item>
            </Breadcrumb>
            <Row>
            <Col sm={2}>
                <Nav bsSize="small" bsStyle="pills" stacked>
                    {Object.keys(this.state.config).map((a) => (
                        <NavItem key={a} onClick={() => this.setState({category:a})}>{a}</NavItem>)
                    )}
                </Nav>
            </Col>
            <Col sm={9}>
                <Form horizontal>
                    { this.state.category && this.sortFields().map((p) => {
                        let entry = this.state.config[this.state.category][p];
                        return (<FormGroup key={p} validationState={this.validateEntry(entry, p)}>
                            <Col componentClass={ControlLabel} sm={2}>{p}</Col>

                            <Col sm={9}>
                                {this.getInputField(entry, p)}
                            </Col>
                        </FormGroup>)
                    })}
                    { this.state.category && (
                        <FormGroup>
                            <Col smOffset={2} sm={10}>
                                <Button onClick={this.onSubmit} bsStyle="primary">
                                    <FormattedMessage id="save" defaultMessage="Save"/>
                                </Button>
                            </Col>
                        </FormGroup>
                    )}
                </Form>
            </Col>
            </Row>
        </div>
    }
}
