import React, {useEffect, useState} from 'react';

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
import {fetch_get, fetch_put, NotificationsManager} from '../utils';
import {useLocation} from "react-router";


function fetchConfig(name, onSuccess) {
    fetch_get(`/api/v01/gateways/${name}/config`)
        .then(d => onSuccess(d.configuration))
        .catch(console.error);
}

function saveConfig(name, config) {
    fetch_put(`/api/v01/gateways/${name}/config`, {configuration: config})
        .then(() => NotificationsManager.success(
          <FormattedMessage id="gateway-config-saved" defaultMessage="Configuration saved!"/>,
        ))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="gateway-save-failed" defaultMessage="Failed to save gateway configuration"/>,
            error.message
        ));
}

function GatewayConfig({name}) {
    const [config, setConfig] = useState("");

    useEffect(() => {
      setTimeout(() => fetchConfig(name, setConfig), 300);
    }, [name]);

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
                                     value={config}
                                     style={{ height: 200 }}
                                     onChange={e => setConfig(e.target.value)} />
                    </FormGroup>
                    <FormGroup>
                        <Button onClick={() => saveConfig(name, config)} bsStyle="primary">
                            <FormattedMessage id="save" defaultMessage="Save"/>
                        </Button>
                    </FormGroup>
                </Form>
            </Panel.Body>
        </Panel>
    )
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
                <FormattedMessage id="apio-async" defaultMessage="APIO Async"/>
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

function saveGatewayUrl(name, url, onSuccess) {
    fetch_put(`/api/v01/gateways/${name}`, {url: url})
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="gateway-url-saved" defaultMessage="URL saved!"/>
            );
            onSuccess && onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="gateway-save-url-failed" defaultMessage="Failed to save gateway url"/>,
            error.message
        ))
}

function GatewayTab({name, onEditUrl, info, remainingSecs}) {
    const [url, setUrl] = useState(undefined);
    const [showEditUrl, setShowEditUrl] = useState("");

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
                            <Button bsStyle="primary" onClick={() => setShowEditUrl(true)}>
                                <Glyphicon glyph="pencil"/>
                            </Button>
                        </th>
                    </tr>
                    <tr>

                    </tr>
                </tbody>
            </Table>
            <Modal show={showEditUrl} onHide={() => {
              setShowEditUrl(false);
              onEditUrl();
            }}>
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
                                    onChange={e => setUrl(e.target.value)} />
                                <HelpBlock>
                                    <FormattedMessage id='gateway-url-help' defaultMessage='The url needs to include the port (even if the service run on the default scheme port)'/>
                                </HelpBlock>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle="primary" onClick={() => saveGatewayUrl(name, url, r => {
                      setShowEditUrl(false);
                      setUrl(undefined);
                      onEditUrl && onEditUrl();
                    })} disabled={validGwUrl !== 'success'}>
                        <FormattedMessage id="save" defaultMessage="Save" />
                    </Button>
                    <Button onClick={() => {
                      setShowEditUrl(false);
                      onEditUrl();
                    }}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </Modal.Footer>
            </Modal>
            {info.error && (
                <Alert bsStyle="danger">
                    <Glyphicon glyph="remove-circle" />
                    {' '}{info.error}
                </Alert>
            )}
            {info.gateway_connected && <GatewayConfig name={name} />}
        </div>
    )
}


const REFRESH_CYCLE = 10; // in seconds

function fetch_gateways(onSuccess, onError) {
    fetch_get('/api/v01/gateways')
        .then(data => {
            onSuccess(data.gateways);
        })
        .catch(error => {
            onError && onError(error.message)
        })
}


export default function Gateways(props) {
    const [gateways, setGateways] = useState([]);
    const [remainingSecs, setRemainingSecs] = useState(0);

    useEffect(() => {
      fetch_gateways(setGateways);
      setRemainingSecs(REFRESH_CYCLE);
      document.title = "Gateways";

      const refreshHandler = setInterval(() => {
        fetch_gateways(setGateways);
        setRemainingSecs(REFRESH_CYCLE);
      }, REFRESH_CYCLE * 1000);
      const countDown = setInterval(() => {
        setRemainingSecs(r => r - 1);
      }, 1000);

      return () => {
        clearInterval(refreshHandler);
        clearInterval(countDown);
      }
    }, []);

    const { hash } = useLocation();

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="gateways" defaultMessage="Gateways"/></Breadcrumb.Item>
            </Breadcrumb>
            <Tabs defaultActiveKey={hash ? hash.substring(1) : Object.keys(gateways)[0]} id="gateways-tabs">
            {
                Object.keys(gateways).map((g, i) => (
                    <Tab eventKey={g} title={g} key={g}>
                        <GatewayTab
                            name={g}
                            info={gateways[g]}
                            remainingSecs={remainingSecs}
                            onEditUrl={() => fetch_gateways(setGateways)}
                            {...props}
                        />
                    </Tab>
                ))
            }
            </Tabs>
        </div>
    )
}
