import React, {useState, useEffect} from "react";

import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import Table from "react-bootstrap/lib/Table";
import {fetch_get, NotificationsManager} from "../utils";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import {Link} from "react-router-dom";
import queryString from "query-string";
import {activeCriteria, errorCriteria, needActionCriteria} from "../requests/requests";
import {DashboardCard} from "./dashboard-tiles";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Form from "react-bootstrap/lib/Form";
import update from "immutability-helper";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Ajv from "ajv";


function fetchManualActions(onSuccess) {
    fetch_get("/api/v01/system/users/local/manual_actions?pending=1")
        .then(r => onSuccess(r.manual_actions_per_role))
        .catch(error => NotificationsManager.error("Failed to get manual actions", error.message))
}


function ManualActionsModal(props) {
    const {actions, role, show, onHide} = props;

    return (
        <Modal show={show} onHide={onHide} dialogClassName='large-modal'>
            <Modal.Header closeButton>
                <Modal.Title>
                    {`Pending manual actions for ${role}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table condensed>
                    <thead>
                        <tr>
                            <td>#</td>
                            <td>Description</td>
                            <td>Possible actions</td>
                            <td>Created on</td>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        actions && actions.map(a => (
                            <tr key={`action-${a.id}`}>
                                <td>
                                    <Link to={`/transactions/${a.instance_id}`}>{a.instance_id}</Link>
                                </td>
                                <td>
                                    {a.description}
                                </td>
                                <td>
                                    {a.possible_outputs}
                                </td>
                                <td>
                                    {a.created_on}
                                </td>
                            </tr>
                        ))
                    }
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    )
}

function ManualActionInput({type, value, onChange}) {
  switch(type) {
    case "boolean":
      return <Checkbox
        checked={value}
        onChange={e => onChange(e.target.checked)} />
    default:
      return <FormControl
        componentClass="input"
        value={value}
        onChange={e => onChange(e.target.value)} />
  }
}

export function ManualActionInputForm(props) {
    const {onTrigger, show, action, output, onHide} = props;
    const [values, setValues] = useState({});

    let input_form;
    try{
      input_form = JSON.parse(action.input_form)
    } catch(e) {}

    let ajv = Ajv({allErrors: true});
    const validInputs = input_form?ajv.validate(input_form, values):true;
    console.log(ajv.errors, input_form, values)
    return (
        <Modal show={show} onHide={onHide} dialogClassName='large-modal'>
            <Modal.Header closeButton>
                <Modal.Title>
                    {`Pending manual action: ${action.description}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Some inputs are possible/required for this action.</p>
                <Form horizontal>
                    {
                        input_form && input_form.properties && Object.entries(input_form.properties).map(([key, v]) => {
                            return (
                                <FormGroup>
                                    <Col componentClass={ControlLabel} sm={2}>
                                        {key}{ input_form.required && input_form.required.includes(key) && " *" }
                                    </Col>

                                    <Col sm={9}>
                                        {
                                            <ManualActionInput
                                                type={v.type}
                                                value={values[key]}
                                                onChange={v => setValues(
                                                    update(values,{$merge: {[key] : v}})
                                                )} />
                                        }
                                    </Col>
                                </FormGroup>
                            )
                        })
                    }
                    <FormGroup>
                        <Col smOffset={2} sm={9}>
                            <Button onClick={() => onTrigger(action, output, values)} disabled={!validInputs}>
                              {output}
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


export default function ManualActionsBox(props) {
    const [actions, setActions] = useState({});
    const [showRole, setShowRole] = useState(undefined);

    useEffect(() => {
        fetchManualActions(setActions);
    }, []);

    return (
        <DashboardPanel title={<FormattedMessage id='manual-tasks' defaultMessage='Manual tasks'/>}>
            <Table condensed>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Pending</th>
                    </tr>
                </thead>
                <tbody>
                {
                    Object.keys(actions).map(r => (
                        <tr key={`role-${r}`}>
                            <td>
                                <Button onClick={() => setShowRole(r)} bsStyle="link">
                                {r}
                                </Button>
                            </td>
                            <td>{actions[r].length}</td>
                        </tr>
                    ))
                }
                </tbody>
            </Table>
            <ManualActionsModal
                role={showRole}
                actions={actions[showRole]}
                show={showRole !== undefined}
                onHide={() => setShowRole(undefined)} />
        </DashboardPanel>
    )
}

export function ManualActionsTile() {
    const [actions, setActions] = useState({});

    useEffect(() => {
        fetchManualActions(setActions);
        const interval = setInterval(() => fetchManualActions(setActions), 5 * 1000);
        return () => clearInterval(interval);
    }, []);

    const count = Object.keys(actions).reduce((r, o) => r + actions[o].length, 0);

    return (
      <Link to={{
          pathname: "/transactions/list", search: queryString.stringify({
            filter: JSON.stringify(update(needActionCriteria, {$merge: activeCriteria}))
          })
        }}>
        <DashboardCard
          className={"bg-sand-tempest"}
          heading={"Need actions"}
          subheading={"Waiting for manual actions"}
          number={count} />
      </Link>
    )
}