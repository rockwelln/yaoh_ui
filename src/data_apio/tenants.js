import React, {Component} from "react";
import {Link} from "react-router-dom";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Table, {thead, tbody} from "react-bootstrap/lib/Table";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Alert from "react-bootstrap/lib/Alert";
import Checkbox from "react-bootstrap/lib/Checkbox";
import {FormattedMessage} from "react-intl";
import {fetch_get, fetch_delete, API_URL_PROXY_PREFIX} from "../utils";


class Tenants extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            tenants: [],
            loading: false,
            deleting: false,
            deleteNonEmpty: false,
        };
        this.onDelete = this.onDelete.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    _fetchTenants() {
        this.setState({loading: true});
        fetch_get(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({tenants: data.tenants, loading: false}))
            .catch(error => {
                console.error(error);
                !this.cancelLoad && this.setState({loading: false})
            })
    }

    componentDidMount() {
        this._fetchTenants();
    }

    onDelete(tenantId) {
        const {deleteNonEmpty} = this.state;
        this.setState({deleting: true});
        fetch_delete(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/${tenantId}/?deleteNonEmpty=${deleteNonEmpty?1:0}`, this.props.auth_token)
            .then(() => {
                if(this.cancelLoad) return;
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="delete-tenant-ok" defaultMessage="Tenant deleted"/>,
                    level: 'success',
                });
                this.setState({confirmDelete: undefined, deleting: false});
                this._fetchTenants();
            })
            .catch(error => {
                this.setState({deleting: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="delete-tenant-fail" defaultMessage="Fail delete tenant"/>,
                    //message: error.message,
                    level: 'error',
                })
            })
    }

    render() {
        const {tenants, confirmDelete, deleting, loading, deleteNonEmpty} = this.state;
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
                            <th style={{width: '20%'}}><FormattedMessage id="tenant-id" defaultMessage="Tenant ID"/></th>
                            <th style={{width: '30%'}}><FormattedMessage id="name" defaultMessage="Name"/></th>
                            <th style={{width: '30%'}}><FormattedMessage id="type" defaultMessage="Type"/></th>
                            <th style={{width: '20%'}}/>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        tenants.map(t => (
                            <tr key={t.tenantId}>
                                <td><Link to={`/apio/tenants/${t.tenantId}/groups`}>{t.tenantId}</Link></td>
                                <td>{t.name}</td>
                                <td>{t.type}</td>
                                <td>
                                    <ButtonToolbar>
                                        {/*
                                        <Button onClick={() => this.setState({show: true})} bsStyle="primary">
                                            <Glyphicon glyph="pencil"/>
                                        </Button>
                                        */}
                                        <Button onClick={() => this.setState({confirmDelete: t.tenantId})} bsStyle="danger">
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
                        <p><FormattedMessage id="confirm-delete-warning" defaultMessage={`You are about to delete the tenant ${confirmDelete}!`}/></p>
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


export const TenantsManagement = (props) => (
    <div>
        <Breadcrumb>
            <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data"/></Breadcrumb.Item>
            <Breadcrumb.Item active><FormattedMessage id="tenants" defaultMessage="Tenants"/></Breadcrumb.Item>
        </Breadcrumb>

        <Tenants {...props}/>
    </div>
);
