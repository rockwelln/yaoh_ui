import React, {useState, useEffect, useCallback} from "react";

import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import Table from "react-bootstrap/lib/Table";
import {fetch_get, NotificationsManager} from "../utils";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import {Link} from "react-router-dom";
import queryString from "query-string";
import {activeCriteria, needActionCriteria} from "../requests/requests";
import {DashboardCard} from "./dashboard-tiles";


function fetchManualActions(onSuccess) {
    fetch_get("/api/v01/system/users/local/manual_actions?pending=1", null, 5000)
        .then(r => onSuccess(r.manual_actions_per_role, r.manual_actions))
        .catch(error => console.error("Failed to get manual actions", error))
}

function fetchManualActionsNP(onSuccess) {
    fetch_get("/api/v01/npact/manual_actions?pending=1")
        .then(r => onSuccess(r.manual_actions_per_role))
        .catch(error => NotificationsManager.error("Failed to get manual actions", error.message))
}


function ManualActionsModal({actions, role, show, onHide}) {
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

function NPManualActionsModal({actions, role, show, onHide}) {
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
                            <td>Port ID</td>
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
                                    {a.crdc_id}
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


export default function ManualActionsBox() {
    const [actions, setActions] = useState({});
    const [userActions, setUserActions] = useState([]);
    const [showRole, setShowRole] = useState(undefined);

    const refresh_ = useCallback(() => fetchManualActions((actionsPerRoles, actions) => {
        setActions(actionsPerRoles);
        setUserActions(actions);
    }), []);

    useEffect(() => {
        refresh_();
        let h = setInterval(() => refresh_(), 5 * 1000);
        return () => clearInterval(h);
    }, []);

    return (
        <DashboardPanel title={<FormattedMessage id='manual-tasks' defaultMessage='Manual tasks'/>}>
            <Table condensed>
                <thead>
                    <tr>
                        <th>Transaction</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                {
                    userActions?.map(a => (
                        <tr key={`i-${a.instance_id}`}>
                            <td>
                                <Link to={`/transactions/${a.instance_id}`}>{a.instance_id}</Link>
                            </td>
                            <td>
                                {a.description || "No description"}
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </Table>
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
                                <a href="#" onClick={() => setShowRole(r)} bsStyle="link">
                                {r}
                                </a>
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


export function NPManualActionsBox() {
    const [actions, setActions] = useState({});
    const [showRole, setShowRole] = useState(undefined);

    useEffect(() => {
        fetchManualActionsNP(setActions);
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
            <NPManualActionsModal
                role={showRole}
                actions={actions[showRole]}
                show={showRole !== undefined}
                onHide={() => setShowRole(undefined)} />
        </DashboardPanel>
    )
}

const countActions = (actions, actionsPerRoles) => {
    const c = Object.keys(actionsPerRoles).reduce((r, o) => r + actionsPerRoles[o].length, 0);
    return c + actions.length;
}

export function ManualActionsTile() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(() => fetchManualActions((actionsPerRoles, actions) => setCount(countActions(actions, actionsPerRoles)), []));

    useEffect(() => {
      fetchCount();
      let h = setInterval(() => fetchCount(), 5 * 1000);
      return () => clearInterval(h);
    }, []);

    return (
      <Link to={{
          pathname: "/transactions/list", search: queryString.stringify({
            filter: JSON.stringify({...needActionCriteria, ...activeCriteria})
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
