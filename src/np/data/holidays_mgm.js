import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Col from 'react-bootstrap/lib/Col';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import { FormattedMessage } from 'react-intl';

import moment from 'moment';

import { parseJSON, fetch_delete, fetch_post, NotificationsManager } from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import { Search } from "../../utils/common";
import update from 'immutability-helper';


class NewPublicHoliday extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    componentWillReceiveProps() {
        this.setState({ when: moment().add(1, "days").format('DD/MM/YYYY'), description: '' });
    }

    onSave(e) {
        e.preventDefault();
        fetch_post(
            '/api/v01/voo/public_holidays',
            {
                when: moment(this.state.when, 'DD/MM/YYYY').format(),
                description: this.state.description
            },
            this.props.auth_token
        )
            .then(parseJSON)
            .then(() => {
                NotificationsManager.success(
                    <FormattedMessage id="new-holiday-saved" defaultMessage="New holiday saved!" />,
                );
                this.onClose();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="new-holiday-failed" defaultMessage="Failed to save" />,
                error.message
            ));
    }

    onClose() {
        this.setState({ when: undefined, description: undefined, show: false });
        this.props.onClose && this.props.onClose();
    }

    render() {
        const { when, description, show } = this.state;

        const invalidDateFormat = !moment(when, 'DD/MM/YYYY').isValid();
        const dateBeforeNow = !moment(when, 'DD/MM/YYYY').isAfter(moment());
        const validDate = invalidDateFormat || dateBeforeNow ? "error" : null;

        return (
            <div>
                <Button bsStyle="primary" onClick={() => this.setState({ show: true })}>
                    <FormattedMessage id="add-public-holiday" defaultMessage="Add holiday" />
                </Button>
                <Modal show={show} onHide={this.onClose} backdrop={false}>
                    <Modal.Header closeButton>
                        <Modal.Title><FormattedMessage id="new-public-holiday" defaultMessage="New Holiday" /></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup validationState={validDate}>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="when" defaultMessage="When" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={this.state.when}
                                        onChange={e => this.setState({ when: e.target.value })}
                                    />
                                    {invalidDateFormat &&
                                        <HelpBlock>
                                            <FormattedMessage id="date-format-DD-MM-YYYY" defaultMessage="The date should be formatted as DD/MM/YYYY" />
                                        </HelpBlock>
                                    }
                                    {dateBeforeNow &&
                                        <HelpBlock>
                                            <FormattedMessage id="date-before-now" defaultMessage="The date has to be in the future." />
                                        </HelpBlock>
                                    }
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="description" defaultMessage="Description" />
                                </Col>

                                <Col sm={9}>
                                    <FormControl type="text" value={description} placeholder='...'
                                        onChange={e => this.setState({ description: e.target.value })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col smOffset={2} sm={10}>
                                    <Button bsStyle="primary" onClick={this.onSave} disabled={validDate === "error"}>
                                        <FormattedMessage id="save" defaultMessage="Save" />
                                    </Button>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}

export class PublicHolidays extends Search {
    static defaultProps = update(Search.defaultProps, {
        '$merge': {
            searchUrl: '/api/v01/voo/public_holidays',
            collectionName: 'holidays',
            defaultSortingSpec: [{ field: 'when', direction: 'desc' }],
        }
    });

    constructor(props) {
        super(props);
        this.onDelete = this.onDelete.bind(this);
    }

    onDelete(e, hId) {
        e.preventDefault();
        fetch_delete(`/api/v01/voo/public_holidays/${hId}`, this.props.auth_token)
            .then(() => {
                NotificationsManager.success(
                    <FormattedMessage id="holiday-deleted" defaultMessage="Holiday deleted!" />,
                );
                this._refresh();
            })
            .catch(error => NotificationsManager.error(
                <FormattedMessage id="new-holiday-save-failed" defaultMessage="Failed to save" />,
                error.message
            ));
    }

    render() {
        const { resources, sorting_spec } = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="data" defaultMessage="Data" /></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="public-holidays" defaultMessage="Public holidays" /></Breadcrumb.Item>
                </Breadcrumb>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title><FormattedMessage id="public-holidays" defaultMessage="Public holidays" /></Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <ApioDatatable
                            sorting_spec={sorting_spec}
                            headers={[
                                { title: <FormattedMessage id="#" />, field: 'id', sortable: true },
                                { title: <FormattedMessage id="when" defaultMessage="When" />, field: 'when', sortable: true },
                                { title: <FormattedMessage id="description" defaultMessage="Description" />, field: 'description' },
                                {
                                    title: '', render: n => (
                                        <Button onClick={e => this.onDelete(e, n.id)} bsStyle="danger">
                                            <Glyphicon glyph="remove-sign" />
                                        </Button>
                                    )
                                },
                            ]}
                            data={resources}
                            onSort={s => this._refresh(undefined, s)}
                        />
                    </Panel.Body>
                </Panel>
                <Panel>
                    <Panel.Body>
                        <NewPublicHoliday
                            onClose={() => this._refresh()}
                            {...this.props} />
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
