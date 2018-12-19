import React, {Component} from 'react';

import Tab from 'react-bootstrap/lib/Tab';
import Badge from 'react-bootstrap/lib/Badge';
import Panel from 'react-bootstrap/lib/Panel';
import Tabs from 'react-bootstrap/lib/Tabs';
import Button from 'react-bootstrap/lib/Button';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Alert from 'react-bootstrap/lib/Alert';
import FormControl from 'react-bootstrap/lib/FormControl';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';
import Table from 'react-bootstrap/lib/Table';
import Modal from 'react-bootstrap/lib/Modal';
import Col from 'react-bootstrap/lib/Col';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';

import {FormattedMessage} from 'react-intl';
import {fetch_get, fetch_put} from '../utils';


class GatewayConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.cancelLoad = false;
        this._loadConfig = this._loadConfig.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    _loadConfig() {
        if(this.cancelLoad) return;
        const {name, auth_token} = this.props;
        fetch_get(`/api/v01/gateways/${name}/config`, auth_token)
            .then(d => this.setState({config: d.configuration}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="gateway-fetch-failed" defaultMessage="Failed to fetch gateway information"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onSave() {
        const {name, auth_token} = this.props;
        fetch_put(`/api/v01/gateways/${name}/config`, {configuration: this.state.config}, auth_token)
            .then(() => this.props.notifications.addNotification({
                message: <FormattedMessage id="gateway-config-saved" defaultMessage="Configuration saved!"/>,
                level: 'success',
            }))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="gateway-save-failed" defaultMessage="Failed to save gateway configuration"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentDidMount() {
        setTimeout(this._loadConfig, 300);
    }

    render() {
        return (
            <Panel defaultExpanded={false}>
                <Panel.Heading>
                    <Panel.Title toggle>
                        <FormattedMessage id="config" defaultMessage="Configuration" />
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    <Form>
                        <FormGroup>
                            <FormControl componentClass="textarea"
                                         value={this.state.config}
                                         style={{ height: 200 }}
                                         onChange={e => this.setState({config: e.target.value})} />
                        </FormGroup>
                        <FormGroup>
                            <Button onClick={this.onSave} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save"/></Button>
                        </FormGroup>
                    </Form>
                </Panel.Body>
            </Panel>
        )
    }
}


const connected_badge = (connected) => (
    <Badge bsClass={connected?"label label-success":"label label-danger"}>
    {
        connected?<FormattedMessage id='connected'/>:<FormattedMessage id='disconnected'/>
    }
    </Badge>
)

const active_badge = (active) => (
    active === undefined?
    '':active?
    <Badge bsClass="label label-success"><FormattedMessage id='active'/></Badge>:
    <Badge bsClass="label label-danger"><FormattedMessage id='inactive'/></Badge>
)

const GatewaySituation = ({info, name}) => {
    const gatewayColor = !info.gateway_connected?"red":info.active?"green":"orange";
    const endpointColor = gatewayColor !== "green"?"inherit":info.connected?"green":"red";
    return (
        <ul className="list-inline" style={{marginTop: "10px"}}>
            <li>
                <Glyphicon glyph="map-marker" style={{fontSize: "500%", color: "green", display: "block", textAlign: "center"}} />
                <FormattedMessage id="npact2" defaultMessage="APIO Async"/>
            </li>
            <li style={{paddingLeft: "5%", paddingRight: "5%"}}>
                <span>
                    <Glyphicon glyph="arrow-right" style={{fontSize: "200%", color: "grey"}} />
                </span>
            </li>
            <li>
                <Glyphicon glyph="transfer" style={{fontSize: "500%", color: gatewayColor, display: "block", textAlign: "center"}} />
                {name} <FormattedMessage id="gateway" defaultMessage="gateway"/>
            </li>
            <li style={{paddingLeft: "5%", paddingRight: "5%"}}>
                <Glyphicon glyph="arrow-right" style={{fontSize: "200%", color: "grey"}} />
            </li>
            <li>
                <Glyphicon glyph="tasks" style={{fontSize: "500%", color: endpointColor, display: "block", textAlign: "center"}} />
                {name}
            </li>
        </ul>
    );
}

class GatewayTab extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onSave = this.onSave.bind(this);
        this.onEditClose = this.onEditClose.bind(this);
    }

    onSave() {
        const {name, auth_token} = this.props;
        fetch_put(`/api/v01/gateways/${name}`, {url: this.state.url}, auth_token)
            .then(() => {
                    this.props.notifications.addNotification({
                    message: <FormattedMessage id="gateway-url-saved" defaultMessage="URL saved!"/>,
                    level: 'success',
                });
                this.onEditClose(true);
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="gateway-save-url-failed" defaultMessage="Failed to save gateway url"/>,
                message: error.message,
                level: 'error'
            }));
    }

    onEditClose(refreshStatus) {
        refreshStatus && this.props.onEditUrl && this.props.onEditUrl();
        this.setState({showEditUrl: false, url: undefined});
    }

    render() {
        const {name, info, remainingSecs} = this.props;
        const {url} = this.state;
        const editUrl = url === undefined?info.url:url;
        const validGwUrl = (editUrl && editUrl.match(/(http|https):\/\/.*:\d+/))?'success':'error';
        return (
            <div>
                <div style={{textAlign: 'center'}}>
                    <p style={{textAlign: "right"}}>
                        <FormattedMessage id="refresh-in" defaultMessage="refresh in"/>
                        {' '}{remainingSecs} secs
                    </p>
                    
                    <GatewaySituation name={name} info={info} />
                </div>
                <br/>
                <Table>
                    <tbody>
                        <tr>
                            <th style={{width: "10%"}}>
                                <FormattedMessage id='gateway-url' defaultMessage='gateway url'/>
                            </th>
                            <td style={{width: "80%"}}>
                                {info.url}{' '}
                                {connected_badge(info.connected)}{' '}
                                {info.connected && active_badge(info.active)}
                            </td>
                            <th style={{width: "10%"}}>
                                <Button bsStyle="primary" onClick={() => this.setState({showEditUrl: true})}>
                                    <Glyphicon glyph="pencil"/>
                                </Button>
                            </th>
                        </tr>
                        <tr>
                            
                        </tr>
                    </tbody>
                </Table>
                <Modal show={this.state.showEditUrl} onHide={this.onEditClose}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="edit" defaultMessage="Edit" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup validationState={validGwUrl}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="gateway-url" defaultMessage="Gateway URL" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={editUrl}
                                        onChange={e => this.setState({url: e.target.value})} />
                                    <HelpBlock>
                                        <FormattedMessage id='gateway-url-help' defaultMessage='The url needs to include the port (even if the service run on the default scheme port)'/>
                                    </HelpBlock>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button bsStyle="primary" onClick={this.onSave} disabled={validGwUrl !== 'success'}>
                            <FormattedMessage id="save" defaultMessage="Save" />
                        </Button>
                        <Button onClick={this.onEditClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                    </Modal.Footer>
                </Modal>
                {info.error && (
                    <Alert bsStyle="danger">
                        <Glyphicon glyph="remove-circle" />
                        {' '}{info.error}
                    </Alert>
                )}
                {info.gateway_connected && <GatewayConfig name={name} {...this.props} />}
            </div>
        )
    }
}


const REFRESH_CYCLE = 10; // in seconds

export default class Gateways extends Component {
    constructor(props) {
        super(props);
        this.state = {gateways: {}, remainingSecs: 0};
        this.cancelLoad = false;

        this.fetch_gateways = this.fetch_gateways.bind(this);
    }

    fetch_gateways(forceRefresh) {
        if(forceRefresh) {
            this.setState({remainingSecs: REFRESH_CYCLE});
        }
        fetch_get('/api/v01/gateways', this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                this.setState({gateways: data.gateways});
            })
            .catch(error => {
                if(this.cancelLoad) return;
                this.props.notifications && this.props.notifications.addNotification({
                    title: <FormattedMessage id="core-gateways-failed" defaultMessage="Failed to fetch gateways"/>,
                    message: error.message,
                    level: 'error'
                });
            });
    }

    componentDidMount() {
        this.fetch_gateways(true);
        
        this.refreshGatewaysHandler = setInterval(() => this.fetch_gateways(true), REFRESH_CYCLE * 1000);
        this.countDown = setInterval(() => this.setState({remainingSecs: this.state.remainingSecs - 1}), 1000);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this.refreshGatewaysHandler && clearInterval(this.refreshGatewaysHandler);
        this.countDown && clearInterval(this.countDown);
    }

    render() {
        const {gateways} = this.state;

        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="gateways" defaultMessage="Gateways"/></Breadcrumb.Item>
                </Breadcrumb>
                <Tabs defaultActiveKey={0} id="gateways-tabs">
                {
                    Object.keys(gateways).map((g, i) => (
                        <Tab eventKey={i} title={g} key={i}>
                            <GatewayTab
                                name={g}
                                info={gateways[g]}
                                remainingSecs={this.state.remainingSecs}
                                onEditUrl={() => this.fetch_gateways(false)}
                                {...this.props}
                            />
                        </Tab>
                    ))
                }
                </Tabs>
            </div>
        )
    }
}