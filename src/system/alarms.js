import React, {useCallback, useEffect, useState} from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Panel from "react-bootstrap/lib/Panel";
import {FormattedMessage} from "react-intl";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Table from "react-bootstrap/lib/Table";
import Form from "react-bootstrap/lib/Form";
import {API_URL_PREFIX, API_WS_URL, AuthServiceManager, fetch_get, fetch_put, NotificationsManager} from "../utils";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Select from "react-select";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {LinkContainer} from 'react-router-bootstrap';
import DatePicker from "react-datepicker";
import {localUser} from "../utils/user";
import queryString from "query-string";
import moment from "moment";
import {Pagination} from "../utils/datatable";


export function fetchAlarms(criteria, paging, sorting, onDone, onSuccess, onError) {
  const url = new URL(API_URL_PREFIX + "/api/v01/alarms");
  if(criteria) {
    url.searchParams.append("filter", JSON.stringify(criteria));
  }
  if(paging) {
    url.searchParams.append("paging", JSON.stringify(paging));
  }
  if(sorting) {
    url.searchParams.append("sorting", JSON.stringify(sorting));
  }
  fetch_get(url)
    .then(r => {
      onDone && onDone();
      onSuccess && onSuccess(r);
    })
    .catch(error => {
      onDone && onDone();
      onError && onError(error);
    })
}

export function AlarmCounters() {
  const [socket, setSocket] = useState(null);
  const [counters, setCounters] = useState({info: 0, major: 0, critical: 0});
  const [workedOnce, setWorkedOnce] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if(!socket) return;

    socket.onmessage = event => {
      let cc = {info: 0, major: 0, critical: 0}
      event.data.split(";").forEach(d => {
        const elts = d.split("=")
        cc[elts[0]] = parseInt(elts[1])
      });
      setCounters(cc);
    };
    
    return () => socket.close();
  }, [socket]);

  useEffect(() => {
    if(!socket) return;

    socket.onopen = () => {
      console.log("alarms ws connected");
      setWorkedOnce(true);
    };

    socket.onerror = e => {
      console.log("error on alarms ws", e);
      if(!workedOnce) {
        setFallback(true);
        setSocket(null);
      }
    }

    socket.onclose = e => {
      console.log("closing alarms ws", e);
      if(workedOnce) {
        setTimeout(() => setReconnect(e => !e), 5000);
      }
    };

  }, [socket, workedOnce]);

  useEffect(() => {
    if(!fallback) return;

    const handler = setTimeout(() => {
      fetchAlarms(
        {field: "active", op: "eq", value: true},
        null, 
        null,
        null,
        a => {
          let cc = {info: 0, major: 0, critical: 0} ;
          a.alarms.forEach(a => {cc[a.level]++});
          setCounters(cc);
        },
        () => setCounters({...counters})
      )
    }, 5000);
    return () => clearTimeout(handler);
  }, [fallback, counters])

  useEffect(() => {
    AuthServiceManager.getValidToken().then(
      token => {
        const s = new WebSocket(`${API_WS_URL}/api/v01/alarms/active/ws?auth_token=${token}`);
        setSocket(s);
      }
    ).catch(() => {
      setTimeout(() => setReconnect(e => !e), 5000);
    })
  }, [reconnect]);

  return (
    <ButtonToolbar>
      <LinkContainer to={
        `/system/alarms?filter=${JSON.stringify({
          active: {"value": true, "op": "eq"},
          level: {"value": "info", "op": "eq"}
        })}&t=${moment.utc().unix()}`
      }>
        <Button>
          {counters["info"]}
        </Button>
      </LinkContainer>
      <LinkContainer to={
        `/system/alarms?filter=${JSON.stringify({
          active: {"value": true, "op": "eq"},
          level: {"value": "major", "op": "eq"}
        })}&t=${moment.utc().unix()}`
      }>
        <Button bsStyle="warning">
          {counters["major"]}
        </Button>
      </LinkContainer>
      <LinkContainer to={
        `/system/alarms?filter=${JSON.stringify({
          active: {"value": true, "op": "eq"},
          level: {"value": "critical", "op": "eq"}
        })}&t=${moment.utc().unix()}`
      }>
        <Button bsStyle="danger">
          {counters["critical"]}
        </Button>
      </LinkContainer>
    </ButtonToolbar>
  )
}

function clearAlarm(aID, onSuccess) {
  fetch_put(`/api/v01/alarms/${aID}`)
    .then(r => {
      onSuccess && onSuccess();
    })
    .catch(error => {
      NotificationsManager.error("Failed to clear alarm", error.message);
    })
}

function fetchAlarmKeys(onSuccess) {
  fetch_get("/api/v01/alarms/keys")
    .then(r => {
      onSuccess && onSuccess(r.keys);
    })
    .catch(error => {
      NotificationsManager.error("Failed to fetch alarm keys", error.message);
    })
}


function criteriaFromParams() {
  const params = queryString.parse(window.location.search);
  if (params.filter !== undefined) {
    try {
      return JSON.parse(params.filter);
    } catch (e) { console.error(e) }
  }
  return {};
}

function pagingFromParams() {
  const params = queryString.parse(window.location.search);
  if (params.paging !== undefined) {
    try {
      return JSON.parse(params.paging);
    } catch (e) { console.error(e) }
  }
  return {};
}

function expandCrit(c) {
  if(typeof c === "object" && !c.field) {
    return Object.entries(c).map(([key, f]) => {
      return {field: key, ...f}
    }).filter(e => e.value || ["is_null", "is_not_null"].includes(e.op))
  }
  return c;
}

function replacePaging(loc, newPaging) {
  const params = queryString.parse(loc.search);
  params.paging = newPaging;
  loc.search = queryString.stringify(params);
  return loc;
}

const newCriteria = Object.freeze({
  key: {op: "eq", value: ""},
  active: {op: "eq", value: ""},
  level: {op: "eq", value: ""},
  first_occurrence: {op: "eq", value: ""},
  last_occurrence: {op: "eq", value: ""},
});

const defaultPaging = {"page_number":1,"page_size":50};

export default function AlarmManagement({history, location}) {
  const [keys, setKeys] = useState([]);
  const [alarms, setAlarms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingCriteria, setPendingCriteria] = useState(newCriteria);

  useEffect(() => {
    document.title = "Alarms"
    fetchAlarmKeys(setKeys);
  }, []);

  const refresh = useCallback(() => {
    const crit = update(newCriteria, {$merge: criteriaFromParams()});
    setPendingCriteria(crit);
    const paging = update(defaultPaging, {$merge: pagingFromParams()});
    setLoading(true);
    fetchAlarms(
      expandCrit(crit),
      paging,
      {field: "last_occurrence", direction: "desc"},
      () => setLoading(false),
      setAlarms,
      error => NotificationsManager.error("Failed to fetch alarms", error.message),
    );
  }, [])

  useEffect(() => {refresh();}, [location.search]);

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
        <Breadcrumb.Item active><FormattedMessage id="alarms" defaultMessage="Alarms"/></Breadcrumb.Item>
      </Breadcrumb>

      <Panel>
        <Panel.Heading>
          <Panel.Title toggle>
            <FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" />
          </Panel.Title>
        </Panel.Heading>

        <Panel.Body collapsible>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="type" defaultMessage="Type" />
              </Col>

              <Col sm={1}>
                <FormControl
                    componentClass="select"
                    value={pendingCriteria.key.op}
                    onChange={e => setPendingCriteria(
                      update(pendingCriteria, {key: {$merge: {op: e.target.value}}})
                    )}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                    <option value="not_like">not like</option>
                </FormControl>
              </Col>

              <Col sm={8}>
                  <Select
                    isClearable
                    value={{
                      value: pendingCriteria.key.value,
                      label: pendingCriteria.key.value,
                    }}
                    options={keys.map(k => ({label: k, value: k}))}
                    onChange={v => setPendingCriteria(
                      update(pendingCriteria, {key: {$merge: {value: v?.value}}})
                    )}
                    name={"type"}
                    className="basic-select"
                    classNamePrefix="select" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="status" defaultMessage="Status" />
              </Col>

              <Col sm={1}>
                <FormControl
                    componentClass="select"
                    value={pendingCriteria.active.op}
                    onChange={e => setPendingCriteria(
                      update(pendingCriteria, {active: {$merge: {op: e.target.value}}})
                    )}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                </FormControl>
              </Col>

              <Col sm={8}>
                  <Select
                    isClearable
                    value={{
                      value: pendingCriteria.active.value,
                      label: pendingCriteria.active.value ?
                        "active" :
                        pendingCriteria.active.value===false ?
                          "inactive" : ""
                    }}
                    options={[
                      {value: true, label: "active"},
                      {value: false, label: "inactive"},
                    ]}
                    onChange={v => setPendingCriteria(
                      update(pendingCriteria, {active: {$merge: {value: v?.value}}})
                    )}
                    name={"active"}
                    className="basic-select"
                    classNamePrefix="select" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="level" defaultMessage="Level" />
              </Col>

              <Col sm={1}>
                <FormControl
                    componentClass="select"
                    value={pendingCriteria.level.op}
                    onChange={e => setPendingCriteria(
                      update(pendingCriteria, {level: {$merge: {op: e.target.value}}})
                    )}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                </FormControl>
              </Col>

              <Col sm={8}>
                  <Select
                    isClearable
                    value={{value: pendingCriteria.level.value, label: pendingCriteria.level.value}}
                    options={["info", "major", "critical"].map(o => ({value: o, label: o}))}
                    onChange={v => setPendingCriteria(
                      update(pendingCriteria, {level: {$merge: {value: v?.value}}})
                    )}
                    name={"level"}
                    className="basic-select"
                    classNamePrefix="select" />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="first-occurrence" defaultMessage="First occurrence" />
              </Col>

              <Col sm={1}>
                <FormControl
                    componentClass="select"
                    value={pendingCriteria.first_occurrence.op}
                    onChange={e => setPendingCriteria(
                      update(pendingCriteria, {first_occurrence: {$merge: {op: e.target.value}}})
                    )}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="gt">&gt;</option>
                    <option value="lt">&lt;</option>
                </FormControl>
              </Col>

              <Col sm={8}>
                <DatePicker
                  className="form-control"
                  selected={pendingCriteria.first_occurrence.value.length !== 0?localUser.localizeUtcDate(pendingCriteria.first_occurrence.value).toDate():null}
                  onChange={d => setPendingCriteria(
                    update(pendingCriteria, {first_occurrence: {$merge: {value: d || ""}}})
                  )}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={60}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="last-occurrence" defaultMessage="Last occurrence" />
              </Col>

              <Col sm={1}>
                <FormControl
                    componentClass="select"
                    value={pendingCriteria.last_occurrence.op}
                    onChange={e => setPendingCriteria(
                      update(pendingCriteria, {last_occurrence: {$merge: {op: e.target.value}}})
                    )}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="gt">&gt;</option>
                    <option value="lt">&lt;</option>
                </FormControl>
              </Col>

              <Col sm={8}>
                <DatePicker
                  className="form-control"
                  selected={pendingCriteria.last_occurrence.value.length !== 0?localUser.localizeUtcDate(pendingCriteria.last_occurrence.value).toDate():null}
                  onChange={d => setPendingCriteria(
                    update(pendingCriteria, {last_occurrence: {$merge: {value: d || ""}}})
                  )}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={60}/>
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={1} sm={1}>
                <Button bsStyle="info" onClick={() => {
                  history.replace(location.pathname + `?filter=${encodeURIComponent(JSON.stringify(pendingCriteria))}&t=${moment.utc().unix()}`);
                }}>
                  <FormattedMessage id="search" defaultMessage="Search" />
                </Button>
              </Col>
            </FormGroup>
          </Form>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Body>
          <Pagination
            onChange={p => history.replace(replacePaging(location, JSON.stringify(p)))}
            page_number={alarms?.pagination[0]}
            num_pages={alarms?.pagination[2]}
            total_results={alarms?.pagination[3]} />
          <Table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Message</th>
                <th>Status</th>
                <th>Value</th>
                <th>Level</th>
                <th>Fist occurrence</th>
                <th>Last occurrence</th>
                <th/>
              </tr>
            </thead>
            <tbody>
            {
              loading ? (
                <tr>
                  <td colSpan={6}>
                    <FormattedMessage id='loading' defaultMessage='Loading...'/>
                  </td>
                </tr>
              ) : (
                alarms?.alarms.map((a, i) => (
                  <tr key={`alarm-${i}`}>
                    <td>{a.key}</td>
                    <td>{a.message}</td>
                    <td>{a.active?"active":"inactive"}</td>
                    <td>{a.value}</td>
                    <td><span className={`label alarm alarm-${a.level}`}>{a.level}</span></td>
                    <td>{a.first_occurrence && localUser.localizeUtcDate(moment.utc(a.first_occurrence)).format()}</td>
                    <td>{a.last_occurrence && localUser.localizeUtcDate(moment.utc(a.last_occurrence)).format()}</td>
                    <td>
                      {
                        a.active &&
                        <Button
                          bsStyle="primary"
                          onClick={() => clearAlarm(a.id, () => refresh())}>
                          <FormattedMessage id="clear" defaultMessage="Clear"/>
                        </Button>
                      }
                    </td>
                  </tr>
                ))
              )
            }
            </tbody>
          </Table>
          <Pagination
            onChange={p => history.replace(replacePaging(location, JSON.stringify(p)))}
            page_number={alarms?.pagination[0]}
            num_pages={alarms?.pagination[2]}
            total_results={alarms?.pagination[3]} />
        </Panel.Body>
      </Panel>
    </>
  )
}