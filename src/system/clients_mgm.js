import React, {useEffect, useState} from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import {useLocation} from "react-router";
import {fetch_get} from "../utils";
import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Table from "react-bootstrap/lib/Table";

const REFRESH_CYCLE = 10; // in seconds

function fetchClients(onSuccess, onError) {
  fetch_get('/api/v01/gateways')
    .then(data => {
      onSuccess(data.gateways);
    })
    .catch(error => {
      onError && onError(error.message)
    })
}

function Situation({details: {name, url, checked, is_connected, is_healthy, is_gateway, gateway_status}}) {
  let elts = [];
  let nextColor = !checked?"inherit":!is_connected?"red":is_healthy?"green":"orange";
  if(is_gateway) {
    elts.push(
      <li>
        <Glyphicon glyph="transfer" style={{fontSize: "500%", color: nextColor, display: "block", textAlign: "center"}} />
        {name} <FormattedMessage id="gateway" defaultMessage="gateway"/>
        <br/><i>{url}</i>
      </li>
    )
    elts.push(
      <li style={{paddingLeft: "5%", paddingRight: "5%"}}>
        <Glyphicon glyph="arrow-right" style={{fontSize: "200%", color: "grey"}} />
      </li>
    )
    nextColor = is_connected && gateway_status === "inter-connected"?"green":
      gateway_status === "not inter-connected"?"red":"inherit";
  }

  elts.push(
    <li>
      <Glyphicon glyph="tasks" style={{fontSize: "500%", color: nextColor, display: "block", textAlign: "center"}} />
      {name}<br/>{!is_gateway && <i>{url}</i>}
    </li>
  )

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
      {elts}
    </ul>
  )
}

function Flag({v}) {
  return v?<Glyphicon glyph={"ok"} style={{color: "green"}}/>:
    <Glyphicon glyph={"remove-sign"} style={{color: "red"}}/>;
}

function Summary({details: {summary, is_connected, is_healthy, url, checked, is_gateway, gateway_status, ts}}) {
  return (
    <Table>
      <tbody>
        <tr>
          <th style={{width: "10%"}}>Summary</th>
          <td style={{textAlign: "left"}}>{summary}</td>
        </tr>
        <tr>
          <th style={{width: "10%"}}>Url</th>
          <td style={{textAlign: "left"}}>{url}</td>
        </tr>
        <tr>
          <th style={{width: "10%"}}>Checked</th>
          <td style={{textAlign: "left"}}>
            <Flag v={checked} />
          </td>
        </tr>
        <tr>
          <th style={{width: "10%"}}>Connected</th>
          <td style={{textAlign: "left"}}>
            <Flag v={is_connected} />
          </td>
        </tr>
        <tr>
          <th style={{width: "10%"}}>Healthy</th>
          <td style={{textAlign: "left"}}>
            <Flag v={is_healthy} />
          </td>
        </tr>
        <tr>
          <th style={{width: "10%"}}>Gateway</th>
          <td style={{textAlign: "left"}}>
            <Flag v={is_gateway} />
          </td>
        </tr>
        <tr>
          <th style={{width: "20%"}}>Gateway status</th>
          <td style={{textAlign: "left"}}>{gateway_status}</td>
        </tr>
        <tr>
          <th style={{width: "20%"}}>Timestamp</th>
          <td style={{textAlign: "left"}}>{ts}</td>
        </tr>
      </tbody>
    </Table>
  )
}

function ClientTab({details, remainingSecs}) {
  return (
    <div>
      <div style={{textAlign: 'center'}}>
        <p style={{textAlign: "right"}}>
            <FormattedMessage id="refresh-in" defaultMessage="refresh in"/>
            {' '}{remainingSecs} secs
        </p>
          <Situation details={details} />
      </div>
      <br/>
      <Summary details={details} />
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [remainingSecs, setRemainingSecs] = useState(0);

  useEffect(() => {
    fetchClients(setClients);
    setRemainingSecs(REFRESH_CYCLE);
    document.title = "Clients";

    const refreshHandler = setInterval(() => {
      fetchClients(setClients);
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
          <Breadcrumb.Item active><FormattedMessage id="clients" defaultMessage="Clients"/></Breadcrumb.Item>
      </Breadcrumb>
      <Tabs defaultActiveKey={hash ? hash.substring(1) : Object.keys(clients)[0]} id="clients-tabs">
        {
          clients.sort((a, b) => a.name.localeCompare(b.name)).map((c, i) => (
            <Tab eventKey={c.name} title={c.name} key={c.name}>
              <ClientTab
                details={c}
                remainingSecs={remainingSecs}
              />
            </Tab>
          ))
        }
      </Tabs>
    </div>
  )
}