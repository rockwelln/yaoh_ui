import React, {Component} from 'react';
import {Link} from "react-router-dom";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Table from "react-bootstrap/lib/Table";
import Modal from "react-bootstrap/lib/Modal";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Alert from "react-bootstrap/lib/Alert";

import {FormattedMessage} from "react-intl";

import {API_URL_PROXY_PREFIX, fetch_delete, fetch_get} from "../utils";


class Numbers extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            numbers: [],
            deleting: false,
            loading: false,
        };
        this._fetchNumbers = this._fetchNumbers.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    _fetchNumbers() {
        this.setState({loading: true});
        fetch_get(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/${this.props.tenantId}/groups/${this.props.siteId}/numbers/`, this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({numbers: data.numbers, loading: false}))
            .catch(error => {
                console.error(error);
                !this.cancelLoad && this.setState({loading: false});
            })
    }

    componentDidMount() {
        this._fetchNumbers();
    }

    onDelete(number) {
        this.setState({deleting: true});
        fetch_delete(`${API_URL_PROXY_PREFIX}/api/v1/orange/tenants/${this.props.tenantId}/groups/${this.props.siteId}/numbers/${number}/`, this.props.auth_token)
            .then(() => {
                if(this.cancelLoad) return;
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="delete-number-ok" defaultMessage="Number deleted"/>,
                    level: 'success',
                });
                this.setState({confirmDelete: undefined, deleting: false});
                this._fetchNumbers();
            })
            .catch(error => {
                this.setState({deleting: false});
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="delete-number-fail" defaultMessage="Fail delete number"/>,
                    //message: error.message,
                    level: 'error',
                })
            })
    }

    render() {
        const {numbers, confirmDelete, deleting, loading} = this.state;
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
                            <th style={{width: '80%'}}><FormattedMessage id="number" defaultMessage="Number"/></th>
                            <th style={{width: '20%'}}/>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        numbers.map(n => (
                            <tr key={n.phoneNumber}>
                                <td>{n.phoneNumber}</td>
                                <td>
                                    <ButtonToolbar>
                                        {/*
                                        <Button onClick={() => this.setState({show: true})} bsStyle="primary">
                                            <Glyphicon glyph="pencil"/>
                                        </Button>
                                        */}
                                        <Button onClick={() => this.setState({confirmDelete: n.phoneNumber})} bsStyle="danger">
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
                        <p><FormattedMessage id="confirm-delete-warning" defaultMessage={`You are about to delete the number ${confirmDelete}!`}/></p>
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

export const NumbersManagement = ({match, ...props}) => (
    <div>
        <Breadcrumb>
            <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data"/></Breadcrumb.Item>
            <Breadcrumb.Item as="div"><Link to='/apio/tenants'><FormattedMessage id="tenants" defaultMessage="Tenants"/></Link></Breadcrumb.Item>
            <Breadcrumb.Item active>{match.params.tenantId}</Breadcrumb.Item>
            <Breadcrumb.Item as="div"><Link to={`/apio/tenants/${match.params.tenantId}/groups`}><FormattedMessage id="groups" defaultMessage="Groups"/></Link></Breadcrumb.Item>
            <Breadcrumb.Item href='#'>{match.params.siteId}</Breadcrumb.Item>
            <Breadcrumb.Item active><FormattedMessage id="numbers" defaultMessage="Numbers"/></Breadcrumb.Item>
        </Breadcrumb>

        <Numbers tenantId={match.params.tenantId} siteId={match.params.siteId} {...props}/>
    </div>
);
