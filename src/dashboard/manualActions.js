import React, {useState, useEffect} from "react";

import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import Table from "react-bootstrap/lib/Table";
import {fetch_get, NotificationsManager} from "../utils";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import {Link} from "react-router-dom";
import queryString from "query-string";
import {needActionCriteria} from "../requests/requests";
import {Tile, TileHeader} from "./dashboard-tiles";


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

export function ManualActionsTile(props) {
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
          filter: JSON.stringify(needActionCriteria)
        })
      }}>
        <Tile className="warning">
          <TileHeader>
            <div className="count">{count}</div>
            <div className="title"><FormattedMessage id="cases-need-actions" defaultMessage="Case(s) need actions" /></div>
          </TileHeader>
        </Tile>
      </Link>
    )
}