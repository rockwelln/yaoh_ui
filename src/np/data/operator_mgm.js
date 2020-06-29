import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Col from 'react-bootstrap/lib/Col';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import { FormattedMessage } from 'react-intl';

import { fetch_delete, fetch_post, fetch_put, fetch_get } from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import { access_levels, isAllowed, pages } from "../../utils/user";
import { Search } from "../../utils/common";
import update from "immutability-helper/index";


export function fetchOperators(token, onSuccess, onError) {
    fetch_get('/api/v01/voo/operators', token)
        .then(data => (
            onSuccess && onSuccess(data.operators.sort((a, b) => (a.name < b.name) ? -1 : 1))
        ))
        .catch(error => onError && onError(error));
}


class Operator extends Component {
    static defaultProps = {
        button: <Glyphicon glyph="pencil" />,
        title: <FormattedMessage id="update-operator" defaultMessage="Update operator" />,
        operator: { short_name: null, name: null },
        bsStyle: 'primary',
    };

    constructor(props) {
        super(props);
        this.state = {
            show: false,
            operator: this.props.operator,
        };
        this.onClose = this.onClose.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    onSave(e) {
        e.preventDefault();
        const { operator } = this.state;
        fetch_put(
            `/api/v01/voo/operators/${this.props.operator.id}`,
            {
                'name': operator.name,
                'short_name': operator.short_name,
                'contact_email': operator.contact_email,
            },
            this.props.auth_token
        )
            .then(() => {
                this.onClose();
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="operator-updated" defaultMessage="Operator saved!" />,
                    level: 'success'
                });
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="operator-update-failed" defaultMessage="Failed to save" />,
                message: error.message,
                level: 'error'
            }));
    }

    onClose() {
        this.setState({ show: false, operator: this.props.operator });
        this.props.onClose && this.props.onClose();
    }

    render() {
        const { show, operator } = this.state;
        const { title, button, bsStyle } = this.props;
        return (
            <div>
                <Button bsStyle={bsStyle} onClick={() => this.setState({ show: true })}>{button}</Button>
                <Modal show={show} onHide={this.onClose} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>{title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="short-name" defaultMessage="Short name" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={operator.short_name}
                                        onChange={e => this.setState({ operator: update(operator, { '$merge': { short_name: e.target.value } }) })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="system-name" defaultMessage="System name" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={operator.name}
                                        onChange={e => this.setState({ operator: update(operator, { '$merge': { name: e.target.value } }) })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="contact-email" defaultMessage="Contact email" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={operator.contact_email}
                                        onChange={e => this.setState({ operator: update(operator, { '$merge': { contact_email: e.target.value } }) })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col smOffset={2} sm={10}>
                                    <Button bsStyle="primary" onClick={this.onSave}>
                                        <FormattedMessage id="save" defaultMessage="Save" />
                                    </Button>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
        )
    }
}

class NewOperator extends Operator {
    static defaultProps = update(Operator.defaultProps, {
        '$merge': {
            button: <FormattedMessage id="add-operator" defaultMessage="Add operator" />,
            title: <FormattedMessage id="new-operator" defaultMessage="New operator" />,
            bsStyle: 'primary',
        }
    });

    onSave(e) {
        e.preventDefault();
        fetch_post(
            '/api/v01/voo/operators',
            this.state.operator,
            this.props.auth_token
        )
            .then(() => {
                this.onClose();
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="operator-saved" defaultMessage="New operator saved!" />,
                    level: 'success'
                })
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="operator-failed" defaultMessage="Failed to save" />,
                message: error.message,
                level: 'error'
            }));
    }
}

export default class SearchOperators extends Search {
    static defaultProps = update(Search.defaultProps, {
        '$merge': {
            searchUrl: '/api/v01/voo/operators',
            collectionName: 'operators',
        }
    });

    constructor(props) {
        super(props);
        this.onDelete = this.onDelete.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
    }

    onFilterChange(f) {
        this.setState({
            filter_criteria: {
                'or': [
                    {
                        field: 'short_name',
                        op: 'like',
                        value: '%' + f + '%'
                    },
                    {
                        field: 'name',
                        op: 'like',
                        value: '%' + f + '%'
                    },
                    {
                        field: 'contact_email',
                        op: 'like',
                        value: '%' + f + '%'
                    }
                ]
            }
        })
    }

    _filterCriteriaAsSpec(filter_criteria) {
        return filter_criteria;
    }

    onDelete(e, opId) {
        e.preventDefault();
        fetch_delete(`/api/v01/voo/operators/${opId}`, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="operator-deleted" defaultMessage="Operator deleted!" />,
                    level: 'success'
                });
                this._refresh()
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="operator-delete-failed" defaultMessage="Failed to delete" />,
                message: error.message,
                level: 'error'
            }));
    }

    render() {
        const { pagination, sorting_spec, resources, filter_criteria } = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="operators" defaultMessage="Operators" /></Breadcrumb.Item>
                </Breadcrumb>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="operators" defaultMessage="Operators" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <ApioDatatable
                            sorting_spec={sorting_spec}
                            headers={[
                                { title: <FormattedMessage id="short-name" defaultMessage="Short name" />, field: 'short_name', sortable: true },
                                { title: <FormattedMessage id="name" defaultMessage="Name" />, field: 'name', sortable: true },
                                { title: <FormattedMessage id="email" defaultMessage="Email" />, field: 'contact_email', sortable: true },
                                {
                                    title: '', style: { width: '120px' }, render: n => (
                                        isAllowed(this.props.user_info.ui_profile, pages.npact_operators, access_levels.modify) &&
                                        <ButtonToolbar>
                                            <Operator
                                                onClose={() => this._refresh()}
                                                operator={n}
                                                {...this.props} />

                                            <Button onClick={e => this.onDelete(e, n.id)} bsStyle="danger">
                                                <Glyphicon glyph="remove-sign" />
                                            </Button>
                                        </ButtonToolbar>
                                    )
                                },
                            ]}
                            pagination={pagination}
                            data={resources}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            filter={filter_criteria.or && filter_criteria.or[0].value.replace(/%/g, '')}
                            onFilterChange={this.onFilterChange}
                            onSearch={() => this._refresh()}
                        />
                    </Panel.Body>
                </Panel>
                {isAllowed(this.props.user_info.ui_profile, pages.npact_operators, access_levels.modify) &&
                    <Panel>
                        <Panel.Body>
                            <NewOperator
                                onClose={() => this._refresh()}
                                {...this.props} />
                        </Panel.Body>
                    </Panel>
                }
            </div>
        )
    }
}
