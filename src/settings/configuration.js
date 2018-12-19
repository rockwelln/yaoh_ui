import React from 'react';
import ReactJson from 'react-json-view';
import Button from 'react-bootstrap/lib/Button';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import {FormattedMessage} from 'react-intl';

import {fetch_get, fetch_put} from "../utils";
import update from 'immutability-helper';
import ajv from 'ajv';


export class ConfigManagement extends React.Component {
    constructor(props) {
        super(props);
        this.ajv = new ajv();
        this.validator = null;
        this.state = {
            config: {},
        };
        this.onEdit = this.onEdit.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    componentDidMount() {
        fetch_get('/api/v01/system/configuration', this.props.auth_token)
            .then(data => this.setState({config: data}))
            .catch(error => 
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-config-fail" defaultMessage="Fail configuration fetch"/>,
                    message: error.message,
                    level: 'error',
                })
            );
        fetch_get('/api/v01/system/configuration/validate', this.props.auth_token)
            .then(data => {
                this.validator = this.ajv.compile(data);
            })
            .catch(error => 
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-config-schema-fail" defaultMessage="Fail configuration schema fetch"/>,
                    message: error.message,
                    level: 'error',
                })
            );
    }

    onSave() {
        fetch_put('/api/v01/system/configuration', this.state.config.content, this.props.auth_token)
            .then(() => 
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="configuration-saved" defaultMessage="Configuration saved!"/>,
                    level: 'success',
                })
            )
            .catch(error => {
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="fetch-config-fail" defaultMessage="Update configuration failed"/>,
                    message: error.message,
                    level: 'error',
                })
            }
        );
    } 

    onEdit(e) {
        console.log(e);
        if(this.validator) {
            const valid = this.validator(e.updated_src);
            if(!valid) {
                this.setState({validationMessage: this.validator.errors[0].message});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="invalid-update" defaultMessage="Invalid update"/>,
                    message:
                        <div>
                            {this.validator.errors.map(e => <span>{e.dataPath} {e.message}</span>)}
                        </div>
                    ,
                    level: 'error',
                });
                return false;
            }
        } else {
            return false; 
        }
        this.setState({config: update(this.state.config, {$merge: {content: e.updated_src}})});
    }

    render() {
        const {config} = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="configuration" defaultMessage="Configuration"/></Breadcrumb.Item>
                </Breadcrumb>
                {config.content &&
                    <ReactJson
                        src={config.content}
                        onEdit={this.onEdit}
                        validationMessage={this.state.validationMessage}
                    />
                }
                <Button onClick={this.onSave}><FormattedMessage id='save' defaultMessage='save'/></Button>
                <br/>
                <FormattedMessage id='id' defaultMessage='ID'/>{`: ${config.config_id}`}<br/>
                <FormattedMessage id='last-edit' defaultMessage='Last edit'/>{`: ${config.created_on}`}
            </div>
        );
    }
}