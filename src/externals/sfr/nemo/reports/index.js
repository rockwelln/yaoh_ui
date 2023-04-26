import React, { useEffect, useState } from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Row from "react-bootstrap/lib/Row";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import { FormattedMessage } from "react-intl";
import {Link} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import { NotificationsManager, fetch_delete, fetch_get, fetch_put } from "../../../../utils";
import { StaticControl } from "../../../../utils/common";
import update from "immutability-helper";
import { DeleteConfirmButton } from "../../../../utils/deleteConfirm";
import Select from "react-select";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const COLUMNS = {
  users: ["acd", "name", "col1", "col2"],
};
const MOCK_CUSTOMERS = [{id: 1, name: "c1"}, {id: 2, name: "c2"}];
const MOCK_REPORTS = [
  {id: 1, kind: "users", columns: ["name", "acd"], schedule: [1, 2, 3, 4, 5], period_days: 1, sent_c: 0, last_sent: null, location: "/some/path", file_prefix: "report_"},
  {id: 2, kind: "users", columns: ["name", "acd"], schedule: [6, 7], period_days: 1, sent_c: 3, last_sent: "2023/03/23", location: "/some/path", file_prefix: "users_"},
];
const MOCK_HISTORY = [
  {id: 1, filename: "report_1234.csv", status: "sent", creation_date: "2023/01/02", instance_id: 123456},
  {id: 2, filename: "report_2345.csv", status: "sent", creation_date: "2023/01/01", instance_id: 123457},
];

function getCustomers() {
  return Promise.resolve({customers: MOCK_CUSTOMERS})
  return fetch_get("/api/v01/custom/sfr/nemo/customers")
}

function deleteCustomer(id) {
  return fetch_delete(`/api/v01/custom/sfr/nemo/customers/${id}`)
}

function getReports(customerID) {
  return Promise.resolve({reports: MOCK_REPORTS});
  return fetch_get(`/api/v01/custom/sfr/nemo/reports/${customerID}`)
}

function updateReport(customerID, id, o) {
  return fetch_put(`/api/v01/custom/sfr/nemo/customers/${customerID}/reports/${id}`, o)
}

function deleteReport(customerID, id) {
  return fetch_delete(`/api/v01/custom/sfr/nemo/customers/${customerID}/reports/${id}`)
}

function getHistory(customerID) {
  return Promise.resolve({reports: MOCK_HISTORY});
  return fetch_get(`/api/v01/custom/sfr/nemo/customers/${customerID}reports`)
}

function HistoryReports({customerID}) {
  const [reports, setReports] = useState();

  useEffect(() => {
    getHistory(customerID).then(r => setReports(r.reports)).catch(e => NotificationsManager.error("Failed to fetch customer reports", e.message))
  }, [customerID]);

  return (
    <Panel>
      <Panel.Body>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Date</th>
              <th>Instance</th>
              <th/>
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
                  <Button bsStyle="primary">
                    <Glyphicon glyph="repeat"/>{" "}
                    Resend
                  </Button>
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

function CustomerDetails({customerID}) {
  const [diff, setDiff] = useState({});
  const [cust, setCust] = useState({});

  useEffect(() => {
    getCustomers().then(b => {
      const cust = b.customers.find(c => c.id === customerID);
      if(!cust) {
        NotificationsManager.error("Failed to fetch customer details")
      } else {
        setCust(cust);
      }
    })
  }, [customerID]);

  const localDiff = update(cust, {$merge: diff})

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="provisioning" defaultMessage="Provisioning" /></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="externals" defaultMessage="Externals" /></Breadcrumb.Item>
        <LinkContainer to={`/externals/nemo/customers`}>
          <Breadcrumb.Item><FormattedMessage id="nemo-cust" defaultMessage="NEMO cust." /></Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>{cust.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Panel>
        <Panel.Body>
          <Form horizontal>
            <StaticControl label={"#"} value={customerID} />
            
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="name" defaultMessage="Name" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="input"
                  value={localDiff.name || ""}
                  onChange={e => setDiff(update(diff, {$merge: {name: e.target.value}}))} />
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>
    </>
  )
}

function Reports({customerID}) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getReports(customerID).then(r => setReports(r.reports)).catch(e => NotificationsManager.error("Failed to fetch customer reports", e.message))
  }, [customerID]);

  return (
    <Panel>
      <Panel.Heading>
        <Panel.Title><FormattedMessage id="reports" defaultMessage="Reports" /></Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        {
          reports.map((r, i) => (
            <>
              <Report customerID={customerID} report={r} key={`r-${i}`} onDelete={() => getReports(customerID).then(r => setReports(r.reports))} />
              <hr/>
            </>
          ))
        }
        <Button bsStyle="primary">New Report</Button>
      </Panel.Body>
    </Panel>
  )
}

function Report({customerID, report, onDelete}) {
  const [diff, setDiff] = useState({});
  const localDiff = update(report, {$merge: diff});

  const validLocation = localDiff.location?.length !== 0;
  const validCols = localDiff.columns?.length !== 0;
  const validSched = localDiff.schedule?.length !== 0;
  const validPeriod = localDiff.period_days > 0;
  const validForm = validLocation && validCols && validSched && validPeriod;

  return (
    <>
      <Form horizontal>
        <StaticControl
          label={<FormattedMessage id='type' defaultMessage='Type' />}
          value={localDiff.kind}/>
        <FormGroup validationState={validCols?null:"error"}>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="columns" defaultMessage="Columns" />
          </Col>
          <Col sm={9}>
            <Select
              isMulti
              value={localDiff.columns?.map(c => ({value: c, label: c}))}
              options={COLUMNS[localDiff.kind].map(d => ({value: d, label: d}))}
              onChange={v => {
                v && setDiff(update(diff, {$merge: {columns: v.map(v => v.value)}}))
              }}
              />
          </Col>
        </FormGroup>
        <FormGroup validationState={validSched?null:"error"}>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="schedule" defaultMessage="Schedule" />
          </Col>
          <Col sm={9}>
            <Select
              isMulti
              value={DAYS.map((d, i) => ({value: i+1, label: d})).filter(d => localDiff.schedule?.includes(d.value))}
              options={DAYS.map((d, i) => ({value: i+1, label: d}))}
              onChange={(v, a) => {
                v && setDiff(update(diff, {$merge: {schedule: v.map(v => v.value)}}))
              }}
              />
          </Col>
        </FormGroup>
        <FormGroup validationState={validPeriod?null:"error"}>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="period" defaultMessage="Period (days)" />
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={localDiff.period_days}
              onChange={e => setDiff(update(diff, {$merge: {period_days: e.target.value ? parseInt(e.target.value) : 0}}))} />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="file-prefix" defaultMessage="File prefix" />
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={localDiff.file_prefix}
              onChange={e => setDiff(update(diff, {$merge: {file_prefix: e.target.value}}))} />
          </Col>
        </FormGroup>
        <FormGroup validationState={validLocation? null: "error"}>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="location" defaultMessage="Location" />
          </Col>
          <Col sm={9}>
            <FormControl
              componentClass="input"
              value={localDiff.location}
              onChange={e => setDiff(update(diff, {$merge: {location: e.target.value}}))} />
          </Col>
        </FormGroup>
        <StaticControl label={<FormattedMessage id='sent_counter' defaultMessage='Sent counter'/>} value={0}/>
        <StaticControl label={<FormattedMessage id='first_sent' defaultMessage='First sent'/>} value={report.first_sent || "-"}/>
        <StaticControl label={<FormattedMessage id='last_sent' defaultMessage='Last sent'/>} value={report.last_sent || "-"}/>
      </Form>
      <ButtonToolbar>
        <Button bsStyle="primary" disabled={Object.keys(diff).length === 0 || !validForm}>Save</Button>
        <DeleteConfirmButton
          style={{width: '40px'}}
          action={"Delete"}
          onConfirm={() => deleteReport(customerID, report.id).then(onDelete)} />
      </ButtonToolbar>
    </>
  )
}

export function SfrNemoCustomer({customerID}) {
  const cID = parseInt(customerID);
  return (
    <>
      <CustomerDetails customerID={cID} />

      <Reports customerID={cID} />

      <HistoryReports customerID={cID} />
    </>
  )
}

export function SfrNemoCustomers() {
  const [customers, setCustomers] = useState();

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
        <Panel.Body style={{ align: "center"}}>
          <Button bsStyle="primary">New Customer</Button>
          <Row>
            <Col mdOffset={1} md={10} lgOffset={3} lg={6}>
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
                        <td style={{ width: '30%'}}>
                          <ButtonToolbar>
                            <LinkContainer to={`/externals/nemo/customers/${c.id}`}>
                              <Button bsStyle="primary" style={{marginLeft: '5px', marginRight: '5px'}}>
                                <Glyphicon glyph="pencil"/>
                              </Button>
                            </LinkContainer>
                            <DeleteConfirmButton
                              resourceName={c.name}
                              style={{width: '40px'}}
                              onConfirm={() => deleteCustomer(c.id, () => getCustomers().then(c => setCustomers(c.customers)))} />
                          </ButtonToolbar>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            </Col>
          </Row>
        </Panel.Body>
      </Panel>
    </>
  )
}