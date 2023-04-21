import React, { useEffect, useState } from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import { FormattedMessage } from "react-intl";
import {Link} from 'react-router-dom';
import { NotificationsManager, fetch_get } from "../../../../utils";
import { StaticControl } from "../../../../utils/common";
import update from "immutability-helper";

function getCustomers() {
  return fetch_get("/api/v01/custom/sfr/nemo/reports")
}

function getReports(customerID) {
  return fetch_get(`/api/v01/custom/sfr/nemo/reports/${customerID}`)
}

function ListReports({customerID}) {
  const [reports, setReports] = useState();

  useEffect(() => {
    getReports(customerID).then(r => setReports(r.reports)).catch(e => NotificationsManager.error("Failed to fetch customer reports", e.message))
  }, [customerID]);

  return (
    <Panel>
      <Panel.Body>
        <Table>
          <thead>
            <tr>
              <td>#</td>
              <td>Name</td>
              <td>Status</td>
              <td>Date</td>
              <td>Instance</td>
              <td/>
            </tr>
          </thead>
          <tbody>
          {
            reports?.map((r, i) => (
              <tr key={`rept-${i}`}>
                <td>{r.id}</td>
                <td>{r.filename}</td>
                <td>{r.status}</td>
                <td>{r.creation_date}</td>
                <td><Link to={`/transactions/${r.instance_id}`}>{r.instance_id}</Link></td>
                <td>
                  <Button>Resend</Button>
                </td>
              </tr>
            ))
          }
          </tbody>
        </Table>
      </Panel.Body>
    </Panel>
  )
}

function CustomerDetails({customerID, name}) {
  const [newName, setNewName] = useState();

  useEffect(() => {setNewName(name)}, [name]);

  return (
    <>
      <Panel>
        <Panel.Body>
          <Form>
            <StaticControl label={"#"} value={customerID} />
            
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="name" defaultMessage="Name" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)} />
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>

      <SftpConfig />

      <Reports />
    </>
  )
}

function SftpConfig({config}) {
  const [diff, setDiff] = useState({});

  const localChan = update(config, {$merge: diff})
  return (
    <Panel>
      <Panel.Body>
        <Form>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="host" defaultMessage="Host" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={localChan.host || ""}
                placeholder="10.23.45.56:22"
                onChange={e => setDiff(update(diff, {$merge: {host: e.target.value}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="username" defaultMessage="Username" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={localChan.username || ""}
                onChange={e => setDiff(update(diff, {$merge: {username: e.target.value}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="password" defaultMessage="Password" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={localChan.password || ""}
                onChange={e => setDiff(update(diff, {$merge: {password: e.target.value}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="private-key" defaultMessage="Private key" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="textarea"
                rows={4}
                value={localChan.private_key || ""}
                onChange={e => setDiff(update(diff, {$merge: {private_key: e.target.value}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="location" defaultMessage="Location" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={localChan.location || ""}
                onChange={e => setDiff(update(diff, {$merge: {location: e.target.value}}))} />
            </Col>
          </FormGroup>
          <FormGroup>
            <Button>Save</Button>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

function Reports() {
  return (
    <Panel>
      <Panel.Body>

      </Panel.Body>
    </Panel>
  )
}

export function SfrNemoCustomer({customerID, name}) {
  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="provisioning" defaultMessage="Provisioning" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="externals" defaultMessage="Externals" /></Breadcrumb.Item>
        <LinkContainer to={`/externals/nemo/customers`}>
          <Breadcrumb.Item><FormattedMessage id="nemo-cust" defaultMessage="NEMO cust." /></Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>{name}</Breadcrumb.Item>
      </Breadcrumb>

      <CustomerDetails />
      
      <ListReports customerID={customerID} />
    </>
  )
}

export function SfrNemoCustomers() {
  const [customers, setCustomers] = useState([{id: 1, name: "c1"}]);

  useEffect(() => {
    document.title = "[ext-SFR] NEMO cust."
    getCustomers().then(c => setCustomers(c.customers)).catch(e => NotificationsManager.error("Failed to fetch customers", e.message))
  }, []);

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="provisioning" defaultMessage="Provisioning" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="externals" defaultMessage="Externals" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="nemo-cust" defaultMessage="NEMO cust." /></Breadcrumb.Item>
      </Breadcrumb>
      <Panel>
        <Panel.Body>
          <Table>
            <thead>
              <tr>
                <th>#</th>
                <th>name</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {
                customers === undefined && (
                  <tr>
                    <td colSpan={3}>
                      <FormattedMessage id='loading' defaultMessage='Loading...' />
                    </td>
                  </tr>
                )
              }
              {
                customers?.map((c, i) => (
                  <tr key={`cust-${i}`}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>
                      <Button>Edit</Button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        </Panel.Body>
      </Panel>
    </>
  )
}