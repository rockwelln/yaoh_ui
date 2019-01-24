import React, {Component} from 'react';
import {Link} from "react-router-dom";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Table from "react-bootstrap/lib/Table";
import Modal from "react-bootstrap/lib/Modal";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Alert from "react-bootstrap/lib/Alert";
import Checkbox from "react-bootstrap/lib/Checkbox";

import {FormattedMessage} from "react-intl";

import {API_URL_PROXY_PREFIX, fetch_delete, fetch_get} from "../utils";


class Groups extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            groups: [],
            deleting: false,
            loading: false,
            deleteNonEmpty: false,
        };
        this._fetchGroups = this._fetchGroups.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    _fetchGroups() {
        this.setState({loading: true});
        fetch_get(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/${this.props.tenantId}/groups/`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({groups: data.groups, loading: false}))
            .catch(error => {
                console.error(error);
                !this.cancelLoad && this.setState({loading: false});
            })
    }

    componentDidMount() {
        this._fetchGroups();
    }

    onDelete(groupId) {
        const {deleteNonEmpty} = this.state;
        this.setState({deleting: true});
        fetch_delete(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/${this.props.tenantId}/groups/${groupId}?deleteNonEmpty=${deleteNonEmpty?1:0}`, this.props.auth_token)
            .then(() => {
                if(this.cancelLoad) return;
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="delete-group-ok" defaultMessage="Group deleted"/>,
                    level: 'success',
                });
                this.setState({confirmDelete: undefined, deleting: false});
                this._fetchGroups();
            })
            .catch(error => {
                this.setState({deleting: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="delete-group-fail" defaultMessage="Fail delete group"/>,
                    //message: error.message,
                    level: 'error',
                })
            })
    }

    render() {
        const {groups, confirmDelete, deleting, loading, deleteNonEmpty} = this.state;
        const closeDelete = () => this.setState({"confirmDelete": undefined});

        if(loading) {
            return (
                <div style={{textAlign: 'center'}}>
                    <i className="fa fa-spinner fa-spin" aria-hidden="true" style={{'fontSize': '24px'}}/>
                </div>
            )
        }
        return (
            <div>
                <Table>
                    <thead>
                        <tr>
                            <th style={{width: '20%'}}><FormattedMessage id="group-id" defaultMessage="Group ID"/></th>
                            <th style={{width: '30%'}}><FormattedMessage id="name" defaultMessage="Name"/></th>
                            <th style={{width: '20%'}}/>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        groups.map(g => (
                            <tr key={g.groupId}>
                                <td><Link to={`/apio/tenants/${this.props.tenantId}/groups/${g.groupId}/numbers`}>{g.groupId}</Link></td>
                                <td>{g.groupName}</td>
                                <td>
                                    <ButtonToolbar>
                                        {/*
                                        <Button onClick={() => this.setState({show: true})} bsStyle="primary">
                                            <Glyphicon glyph="pencil"/>
                                        </Button>
                                        */}
                                        <Button onClick={() => this.setState({confirmDelete: g.groupId})} bsStyle="danger">
                                            <Glyphicon glyph="remove-sign"/>
                                        </Button>
                                    </ButtonToolbar>
                                </td>
                            </tr>
                        ))
                    }
                    </tbody>
                </Table>
                <Modal show={confirmDelete !== undefined} onHide={closeDelete} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="confirm-delete" defaultMessage="Are you sure?"/></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            deleting && <Alert bsStyle="info"><FormattedMessage id="deleting" defaultMessage="Deleting..."/></Alert>
                        }
                        <p><FormattedMessage id="confirm-delete-warning" defaultMessage={`You are about to delete the group ${confirmDelete}!`}/></p>
                        <Checkbox checked={deleteNonEmpty} onChange={e => this.setState({deleteNonEmpty: e.target.checked})}>
                            <FormattedMessage id="delete-if-not-empty" defaultMessage="Delete even if not empty"/>
                        </Checkbox>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => this.onDelete(confirmDelete)} bsStyle="danger" disabled={deleting}>
                            <FormattedMessage id="delete" defaultMessage="Delete"/>
                        </Button>
                        <Button onClick={closeDelete} disabled={deleting}>
                            <FormattedMessage id="cancel" defaultMessage="Cancel"/>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export const GroupsManagement = ({match, ...props}) => (
    <div>
        <Breadcrumb>
            <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data"/></Breadcrumb.Item>
            <Breadcrumb.Item as="div"><Link to='/apio/tenants'><FormattedMessage id="tenants" defaultMessage="Tenants"/></Link></Breadcrumb.Item>
            <Breadcrumb.Item active>{match.params.tenantId}</Breadcrumb.Item>
            <Breadcrumb.Item active><FormattedMessage id="groups" defaultMessage="Groups"/></Breadcrumb.Item>
        </Breadcrumb>

        <Groups tenantId={match.params.tenantId} {...props}/>
    </div>
);
