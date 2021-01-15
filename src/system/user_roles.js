import React, {useEffect, useState} from "react";
import {LinkContainer} from 'react-router-bootstrap';
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Table from "react-bootstrap/lib/Table";
import Modal from "react-bootstrap/lib/Modal";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Form from "react-bootstrap/lib/Form";


export function fetchRoles(onSuccess) {
    fetch_get("/api/v01/system/user_roles")
        .then(r => onSuccess(r.roles))
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-fetch-roles" defaultMessage="Failed to fetch user roles"/>, error.message))
}

function deleteRole(roleId, onSuccess) {
    fetch_delete(`/api/v01/system/user_roles/${roleId}`)
        .then(r => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-delete-role" defaultMessage="Failed to delete user role"/>, error.message))
}

function updateRole(roleId, entry, onSuccess) {
    fetch_put(`/api/v01/system/user_roles/${roleId}`, entry)
        .then(r => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-update-role" defaultMessage="Failed to update user role"/>, error.message))
}

function newRole(entry, onSuccess) {
    fetch_post("/api/v01/system/user_roles", entry)
        .then(r => onSuccess())
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-create-role" defaultMessage="Failed to create user role"/>, error.message))
}

const new_role = {name: "", description: ""};

function NewRoleModal(props) {
    const {show, onHide} = props;
    const [entry, setEntry] = useState(new_role);

    useEffect(() => {setEntry(new_role)}, [show]);

    return (
        <Modal show={show} onHide={() => onHide(false)} bsSize="lg" backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title>Create</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="name" defaultMessage="Name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="input"
                                value={entry.name}
                                onChange={e => setEntry(update(entry, {$merge: {name: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="description" defaultMessage="Description" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="input"
                                value={entry.description}
                                onChange={e => setEntry(update(entry, {$merge: {description: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => newRole(entry, () => onHide(true))} disabled={entry.name.length === 0} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                <Button onClick={() => onHide(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
            </Modal.Footer>
        </Modal>
    )
}

function UpdateRoleModal(props) {
    const {show, entry, onHide} = props;
    const [diffEntry, setDiffEntry] = useState({});

    useEffect(() => {
        setDiffEntry({});
    }, [show]);

    const localEntry = update(entry, {$merge: diffEntry});

    return (
        <Modal show={show} onHide={() => onHide(false)} bsSize="lg" backdrop={false}>
            <Modal.Header closeButton>
                <Modal.Title>Update {entry.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form horizontal>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="name" defaultMessage="Name" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="input"
                                value={localEntry.name}
                                onChange={e => setDiffEntry(update(diffEntry, {$merge: {name: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="description" defaultMessage="Description" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="input"
                                value={localEntry.description}
                                onChange={e => setDiffEntry(update(diffEntry, {$merge: {description: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => updateRole(entry.id, diffEntry, () => onHide(true))} bsStyle="primary"><FormattedMessage id="save" defaultMessage="Save" /></Button>
                <Button onClick={() => onHide(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
            </Modal.Footer>
        </Modal>
    )
}

export function UserRoles(props) {
    const [roles, setRoles] = useState([]);
    const [role, setRole] = useState(undefined);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        fetchRoles(setRoles);
        document.title = "Roles";
    }, []);

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <LinkContainer to={"/system/users"}>
                    <Breadcrumb.Item><FormattedMessage id="users" defaultMessage="Users"/></Breadcrumb.Item>
                </LinkContainer>
                <Breadcrumb.Item active><FormattedMessage id="roles" defaultMessage="Roles"/></Breadcrumb.Item>
            </Breadcrumb>
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="roles" defaultMessage="Roles" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Table>
                        <thead>
                            <tr>
                                <th><FormattedMessage id="name" defaultMessage="Name" /></th>
                                <th><FormattedMessage id="created-on" defaultMessage="Created on" /></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            roles.sort((a, b) => a.id - b.id).map(r =>
                                <tr key={r.id}>
                                    <td>{r.name}</td>
                                    <td>{r.created_on}</td>
                                    <td>
                                        <ButtonToolbar>
                                            <Button onClick={() => setRole(r)} bsStyle="primary"
                                                    style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="pencil"/>
                                            </Button>
                                            <Button onClick={() => deleteRole(r.id, () => fetchRoles(setRoles))} bsStyle="danger"
                                                    style={{marginLeft: '5px', marginRight: '5px'}}>
                                                <Glyphicon glyph="remove-sign"/>
                                            </Button>
                                        </ButtonToolbar>
                                        <UpdateRoleModal
                                            show={role !== undefined}
                                            entry={role || {}}
                                            onHide={refresh => {
                                                setRole(undefined);
                                                refresh && fetchRoles(setRoles);
                                            }} />
                                    </td>
                                </tr>
                            )
                        }
                        </tbody>
                    </Table>
                </Panel.Body>
            </Panel>

            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <Button onClick={() => setShowNew(true)} bsStyle="primary">
                            <FormattedMessage id="new" defaultMessage="New" />
                        </Button>
                    </ButtonToolbar>
                    <NewRoleModal
                        show={showNew}
                        onHide={refresh => {
                            setShowNew(false);
                            refresh && fetchRoles(setRoles);
                        }}
                    />
                </Panel.Body>
            </Panel>
        </>
    )
}