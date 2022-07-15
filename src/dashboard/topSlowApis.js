import React, {useState, useEffect} from "react";

import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import Table from "react-bootstrap/lib/Table";
import {fetch_get, NotificationsManager} from "../utils";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import DatePicker from "react-datepicker";
import update from 'immutability-helper';
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import Label from "react-bootstrap/lib/Label";
import Select from "react-select";
import {localUser} from "../utils/user";
import moment from "moment";

const REFRESH_CYCLE = 60;

function fetchSlowApis({from, to, limit, method}, onSuccess) {
    fetch_get(`/api/v02/statistics/top_slow_api?f=${from.toISOString()}&t=${to.toISOString()}&l=${limit}&m=${method}`)
        .then(r => onSuccess(r))
        .catch(error => NotificationsManager.error("Failed to get slow API's", error.message))
}

function Settings({show, filter, onChange, onHide}) {
  const [diff, setDiff] = useState({});

  useEffect(() => setDiff({}), [show]);

  const localFilter = update(filter, {$merge: diff});
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage id='top-slow-api-settings' defaultMessage='Top slow APIs'/>
          </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="start" defaultMessage="Start" />
            </Col>

            <Col sm={9}>
              <DatePicker
                className="form-control"
                selected={localFilter.from}
                onChange={d => setDiff(update(diff, {$merge: {from: d}}))}
                dateFormat="dd/MM/yyyy"
                locale="fr-fr" />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="end" defaultMessage="End" />
            </Col>

            <Col sm={9}>
              <DatePicker
                className="form-control"
                selected={localFilter.to}
                onChange={d => setDiff(update(diff, {$merge: {to: d}}))}
                dateFormat="dd/MM/yyyy"
                locale="fr-fr" />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="method" defaultMessage="Method" />
            </Col>

            <Col sm={9}>
              <Select
                value={{value: localFilter.method, label: localFilter.method}}
                name="method"
                options={["get", "post", "put", "delete"].map(k => ({value: k, label: k}))}
                onChange={v => {
                  setDiff(update(diff, {$merge: {method: v.value}}))
                }}
                className="basic-select"
                classNamePrefix="select" />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="limit" defaultMessage="Limit" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={localFilter.limit}
                onChange={e => {
                  const i = parseInt(e.target.value, 10);
                  if(!isNaN(i)) {
                    setDiff(update(diff, {$merge: {limit: i}}))
                  }
                }}/>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
          <Button onClick={() => {
            onChange(localFilter);
            onHide();
          }}>
              <FormattedMessage id="apply" defaultMessage="Apply"/>
          </Button>
      </Modal.Footer>
    </Modal>
  );
}

function getMethodLabel(m) {
  let s = "default";
  switch(m) {
    case "get":
      s = "success";
      break
    case "post":
      s = "primary";
      break
    case "put":
      s = "warning";
      break
    case "delete":
      s = "danger";
      break
  }
  return (
    <Label bsStyle={s}>{m.toUpperCase()}</Label>
  )
}

export default function ({props}) {
  const now = new Date();
  let yesterday = new Date(now.getTime());
  yesterday.setDate(now.getDate() - 1);
  const [stats, setStats] = useState([]);
  const [filter, setFilter] = useState({
    from: yesterday,
    to: now,
    limit: 5,
    method: "get",
  });
  const [showSettings, setShowSettings] = useState(false);

  const _refresh = () => fetchSlowApis(filter, setStats);

  useEffect(() => {
    _refresh();
    const h = setTimeout(() => _refresh(), REFRESH_CYCLE * 1000);
    return () => clearTimeout(h);
  }, [filter]);

  return (
    <DashboardPanel
      title={
        <FormattedMessage
          id='top-slop-apis'
          defaultMessage="Top {limit} slow API's ({method})"
          values={{limit: filter.limit, method: filter.method}} />
      }
      onSettings={() => setShowSettings(true)}>

      <Table condensed>
        <tbody>
        {
          stats.length === 0 && <tr><td style={{textAlign: "center"}}>* no match *</td></tr>
        }
        {
          stats.map((stat, i) => (
            <>
            <tr>
              <td>{getMethodLabel(stat.method)}</td>
              <td style={{wordBreak: "break-word"}}>{stat.url}</td>
              <td/>
            </tr>
            <tr>
              <td/>
              <td>{stat.duration} secs</td>
              <td>{localUser.localizeUtcDate(moment.utc(stat.created_on)).format()}</td>
            </tr>
            </>
          ))
        }
        </tbody>
      </Table>
      <Settings
        show={showSettings}
        filter={filter}
        onChange={f => setFilter(f)}
        onHide={() => {
          setShowSettings(false);
        }}/>
    </DashboardPanel>
  );
}