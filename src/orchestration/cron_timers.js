import React, {useState, useEffect, useCallback} from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Table from "react-bootstrap/lib/Table";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Select from "react-select";
import InputGroup from "react-bootstrap/lib/InputGroup";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import {fetchActivities} from "./activity-editor";


const validateCronEntry = (timer) => {
    const {minute, hour, day, month, year, day_of_week} = timer;
    if(minute && minute !== "*") {
        const m = parseInt(minute, 10);
        if(isNaN(m) || m < 0 || m > 59) return false;
    }
    if(hour && hour !== "*") {
        const h = parseInt(hour, 10);
        if(isNaN(h) || h < 0 || h > 23) return false;
    }
    if(day && day !== "*") {
        const d = parseInt(day, 10);
        if(isNaN(d) || d < 0 || d > 31) return false;
    }
    if(month && month !== "*") {
        const m = parseInt(month, 10);
        if(isNaN(m) || m < 0 || m > 12) return false;
    }
    if(year && year !== "*") {
        const y = parseInt(year, 10);
        if(isNaN(y) || y < 2000) return false;
    }
    if(day_of_week && day_of_week !== "*") {
        const d = parseInt(day_of_week, 10);
        if(isNaN(d) || d < 0 || d > 6) return false;
    }
    return true;
};

function createCronTimer(timer) {
    return fetch_post("/api/v01/timers/cron", timer)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="new-timer-created" defaultMessage="New timer created" />);
        })
        .catch(error => {
            NotificationsManager.error(
                <FormattedMessage id="new-timer-failed" defaultMessage="Failed to create new timer" />,
                error.message
            );
            throw error;
        })
}

const defaultCronTimer = {
    job_id: "",
    request_body: "",
    enabled: true,
    activity_id: null,
};

function NewCronTimerModal({show, onClose}) {
    const [timer, setTimer] = useState(defaultCronTimer);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (show) {
            setTimer(defaultCronTimer);
            fetchActivities(setActivities);
        }
    }, [show]);

    const onSubmit = useCallback(e => {
        e.preventDefault();
        createCronTimer(timer).then(() => onClose(true))
    }, [timer]);

    const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));
    const validCronEntry = validateCronEntry(timer) ? null :"error";
    const validJobId = timer.job_id?.length > 0 ? "success": null;
    const validForm = validJobId === "success" && validCronEntry !== "error" && timer.activity_id;

    return (
        <Modal show={show} onHide={() => onClose(false)} backdrop={false} onSubmit={onSubmit} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="new-timer" defaultMessage="New timer" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup validationState={validJobId}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="job-id" defaultMessage="Job id" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={timer.job_id}
                                placeholder="job label"
                                onChange={e => setTimer({...timer, job_id: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="enabled" defaultMessage="Enabled" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={timer.enabled}
                                onChange={e => setTimer({...timer, enabled: e.target.checked})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup validationState={validCronEntry}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="scheduler-entry" defaultMessage="Scheduler entry" />
                        </Col>

                        <Col sm={9}>
                            <Table>
                                <thead>
                                    <tr>
                                        <th><FormattedMessage id="minute" defaultMessage="minute (0-59)" /></th>
                                        <th><FormattedMessage id="hour" defaultMessage="hour (0-23)" /></th>
                                        <th><FormattedMessage id="day" defaultMessage="day (1-31)" /></th>
                                        <th><FormattedMessage id="month" defaultMessage="month (1-12)" /></th>
                                        <th><FormattedMessage id="year" defaultMessage="year (>2000)" /></th>
                                        <th><FormattedMessage id="dow" defaultMessage="day of week (0-6)*" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.minute || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, minute: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.hour || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, hour: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.day || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, day: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.month || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, month: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.year || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, year: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={timer.day_of_week || ""}
                                                placeholder="*"
                                                onChange={e => setTimer({...timer, day_of_week: e.target.value})}/>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                            <HelpBlock>
                                <FormattedMessage id="cron-entry-help-dow" defaultMessage="day of the week is a range going from Sunday (0) to Saturday (6)"/>
                                <br/>
                                <FormattedMessage id="cron-entry-help-cols" defaultMessage="notice the columns left empty on the right are defaulted to '*' (any) and columns left empty on the left are considered as 0"/>
                            </HelpBlock>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="activity" defaultMessage="Activity" />
                        </Col>

                        <Col sm={9}>
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                value={timer.activity_id && activitiesOptions.find(a => a.value === timer.activity_id)}
                                isClearable={true}
                                isSearchable={true}
                                name="activity"
                                onChange={(value, action) => {
                                    if(["select-option", "clear"].includes(action.action)) {
                                        setTimer({...timer, activity_id: value?.value})
                                    }
                                }}
                                options={activitiesOptions} />
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="request-body" defaultMessage="Request body" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="textarea"
                                value={timer.request_body}
                                placeholder='{"body": {"username": "fool"}}'
                                onChange={e => setTimer({...timer, request_body: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={9}>
                            <ButtonToolbar>
                                <Button
                                    type="submit"
                                    disabled={!validForm}
                                    bsStyle="primary"
                                    autoFocus >
                                    <FormattedMessage id="save" defaultMessage="Save"/>
                                </Button>
                                <Button onClick={() => onClose(false)}>
                                    <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                                </Button>
                            </ButtonToolbar>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    );
}


function updateTimer({id, diffTimer}) {
    return fetch_put(`/api/v01/timers/cron/${id}`, diffTimer)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="timer-updated" defaultMessage="Timer updated" />);
        })
        .catch(error =>
            NotificationsManager.error(
                <FormattedMessage id="timer-update-failed" defaultMessage="Failed to update timer" />,
                error.message
            )
        )
}


function UpdateTimerModal({show, onClose, timer}) {
    const [diffTimer, setDiffTimer] = useState({});
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (show) {
            setDiffTimer({});
            fetchActivities(setActivities);
        }
    }, [show]);

    const onSubmit = useCallback((e) => {
        e.preventDefault();
        updateTimer({id: timer.id, diffTimer}).then(() => onClose(true))
    }, [timer, diffTimer]);

    if (!timer) return null;

    const localTimer = {...timer, ...diffTimer};
    const validCronEntry = validateCronEntry(localTimer) ? null :"error";
    const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));

    return (
        <Modal show={show} onHide={() => onClose(false)} backdrop={false} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="update-timer" defaultMessage="Update timer" /></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal onSubmit={e => onSubmit(e)}>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="job-id" defaultMessage="Job id" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="input"
                                value={localTimer.job_id}
                                placeholder="job label"
                                onChange={e => setDiffTimer({...diffTimer, job_id: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="enabled" defaultMessage="Enabled" />
                        </Col>

                        <Col sm={9}>
                            <Checkbox
                                checked={localTimer.enabled}
                                onChange={e => setDiffTimer({...diffTimer, enabled: e.target.checked})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup validationState={validCronEntry}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="scheduler-entry" defaultMessage="Scheduler entry" />
                        </Col>

                        <Col sm={9}>
                            <Table>
                                <thead>
                                    <tr>
                                    <th><FormattedMessage id="minute" defaultMessage="minute (0-59)" /></th>
                                        <th><FormattedMessage id="hour" defaultMessage="hour (0-23)" /></th>
                                        <th><FormattedMessage id="day" defaultMessage="day (1-31)" /></th>
                                        <th><FormattedMessage id="month" defaultMessage="month (1-12)" /></th>
                                        <th><FormattedMessage id="year" defaultMessage="year (>2000)" /></th>
                                        <th><FormattedMessage id="dow" defaultMessage="day of week (0-6)*" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.minute || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, minute: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.hour || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, hour: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.day || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, day: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.month || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, month: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.year || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, year: e.target.value})}/>
                                        </td>
                                        <td>
                                            <FormControl
                                                componentClass="input"
                                                value={localTimer.day_of_week || ""}
                                                placeholder="*"
                                                onChange={e => setDiffTimer({...diffTimer, day_of_week: e.target.value})}/>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                            <HelpBlock>
                                <FormattedMessage id="cron-entry-help-dow" defaultMessage="day of the week is a range going from Sunday (0) to Saturday (6)"/>
                                <br/>
                                <FormattedMessage id="cron-entry-help-cols" defaultMessage="notice the columns left empty on the right are defaulted to '*' (any) and columns left empty on the left are considered as 0"/>
                            </HelpBlock>

                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="activity" defaultMessage="Activity" />
                        </Col>

                        <Col sm={9}>
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                value={localTimer.activity_id && activitiesOptions.find(a => a.value === localTimer.activity_id)}
                                isClearable={false}
                                isSearchable={true}
                                name="activity"
                                onChange={(value, action) => {
                                    if(["select-option", "clear"].includes(action.action)) {
                                        setDiffTimer({...diffTimer, activity_id: value.value})
                                    }
                                }}
                                options={activitiesOptions} />
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="request-body" defaultMessage="Request body" />
                        </Col>

                        <Col sm={9}>
                            <FormControl
                                componentClass="textarea"
                                value={localTimer.request_body || ""}
                                placeholder='{"body": {"username": "fool"}}'
                                onChange={e => setDiffTimer({...diffTimer, request_body: e.target.value})}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={2} sm={9}>
                            <Button
                                type="submit"
                                bsStyle="primary"
                                autoFocus >
                                <FormattedMessage id="save" defaultMessage="Save"/>
                            </Button>
                            <Button onClick={() => onClose(false)}>
                                <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    );
}


function deleteCronTimer(id, onSuccess) {
    fetch_delete(`/api/v01/timers/cron/${id}`)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="timer-deleted" defaultMessage="Timer deleted!" />);
            onSuccess && onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="timer-delete-failed" defaultMessage="Timer delete failed!" />,
            error.message
    ))
}

function fetchCronTimers(onSuccess) {
  fetch_get(`/api/v01/timers/cron`)
        .then(t => {
            onSuccess && onSuccess(t.timers);
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="timer-fetch-failed" defaultMessage="Fetch timers failed!" />,
            error.message
    ))
}

function enable(timer_id, enabled, onSuccess) {
    fetch_put(`/api/v01/timers/cron/${timer_id}`, {enabled: enabled})
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="update-schedule-done" defaultMessage="Schedule saved!"/>
            );
            onSuccess && onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="update-schedule-failed" defaultMessage="Failed to update schedule"/>,
            error.message
        ));
}

function selectActivity(timer_id, activity_id, onSuccess) {
    fetch_put(`/api/v01/timers/cron/${timer_id}`, {activity_id: activity_id?parseInt(activity_id, 10): null})
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="update-schedule-done" defaultMessage="Schedule saved!"/>
            );
            onSuccess && onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="update-schedule-failed" defaultMessage="Failed to update schedule"/>,
            error.message
        ));
}

export default function CronTimers() {
  const [timers, setTimers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);

  useEffect(() => {
    document.title = "Job scheduler";
    fetchActivities(setActivities);
    fetchCronTimers(setTimers);
  }, []);

  const _refresh = () => fetchCronTimers(setTimers);
  const activitiesOptions = activities.sort((a, b) => a.name.localeCompare(b.name)).map(a => ({value: a.id, label: a.name}));

  return (
      <div>
          <Breadcrumb>
              <Breadcrumb.Item active><FormattedMessage id="orchestration" defaultMessage="Orchestration"/></Breadcrumb.Item>
              <Breadcrumb.Item active><FormattedMessage id="job-scheduler" defaultMessage="Job scheduler"/></Breadcrumb.Item>
          </Breadcrumb>

          <Panel>
              <Panel.Body>
                  <ButtonToolbar>
                    <Button bsStyle="primary" onClick={() => setShowNew(true)}>
                        <FormattedMessage id="new-timer" defaultMessage="New timer" />
                    </Button>
                    <NewCronTimerModal show={showNew} onClose={r => {
                        r && _refresh();
                        setShowNew(false);
                    }} />
                  </ButtonToolbar>
              </Panel.Body>
          </Panel>

          <Panel>
              <Panel.Heading>
                  <Panel.Title><FormattedMessage id="job-scheduler" defaultMessage="Job scheduler" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                  <Table>
                    <thead>
                      <tr>
                        <th/>
                        <th>job id</th>
                        <th>minute</th>
                        <th>hour</th>
                        <th>day</th>
                        <th>month</th>
                        <th>year</th>
                        <th>day of week</th>
                        <th><FormattedMessage id="activity" defaultMessage="Activity"/></th>
                        <th/>
                      </tr>
                    </thead>
                    <tbody>
                    {
                      timers.sort((a, b) => a.id - b.id).map((n, i) => (
                        <tr>
                          <td>
                            <Checkbox
                              checked={n.enabled}
                              onChange={e => e.preventDefault()}
                              onClick={e => {
                                  e.preventDefault();
                                  enable(n.id, e.target.checked, _refresh);
                              }} />
                          </td>
                          <td>{n.job_id}</td>
                          <td style={{width: 70}}>{n.minute || "*"}</td>
                          <td style={{width: 70}}>{n.hour || "*"}</td>
                          <td style={{width: 70}}>{n.day || "*"}</td>
                          <td style={{width: 70}}>{n.month || "*"}</td>
                          <td style={{width: 70}}>{n.year || "*"}</td>
                          <td style={{width: 70}}>{n.day_of_week || "*"}</td>
                          <td style={{width: 300}}>
                            <InputGroup>
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    value={n.activity_id && activitiesOptions.find(a => a.value === n.activity_id)}
                                    isClearable={false}
                                    isSearchable={true}
                                    name="activity"
                                    onChange={(value, action) => {
                                        if(["select-option", "clear"].includes(action.action)) {
                                          selectActivity(n.id, value && value.value, _refresh);
                                        }
                                    }}
                                    options={activitiesOptions} />
                                <InputGroup.Button>
                                    <Button
                                        disabled={n.activity_id === null}
                                        bsStyle="primary"
                                        onClick={() => {
                                            let win = window.open(`/transactions/config/activities/editor/${n.activity_id}`, '_blank');
                                            win.focus();
                                        }}
                                        style={{marginLeft: '5px'}}
                                    >
                                        <Glyphicon glyph="eye-open"/>
                                    </Button>
                                </InputGroup.Button>
                            </InputGroup>
                          </td>
                          <td style={{width: "200px"}}>
                            <ButtonToolbar>
                                <Button
                                    bsStyle="primary"
                                    onClick={() => setShowUpdate(n)}
                                    style={{marginLeft: '5px', marginRight: '5px'}}>
                                    <Glyphicon glyph="pencil"/>
                                </Button>
                                <DeleteConfirmButton
                                    resourceName={n.job_id}
                                    style={{marginLeft: '5px', marginRight: '5px'}}
                                    onConfirm={() => deleteCronTimer(n.id, () => _refresh())} />
                            </ButtonToolbar>
                          </td>
                        </tr>
                      ))
                    }
                    </tbody>
                  </Table>
              </Panel.Body>
          </Panel>
          <UpdateTimerModal
            show={showUpdate !== null}
            onClose={r => {
                r && _refresh();
                setShowUpdate(null);
            }}
            timer={showUpdate} />
      </div>
  )
}
