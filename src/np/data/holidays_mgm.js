import React, { useState } from 'react';

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

import { fetch_delete, fetch_post, NotificationsManager } from "../../utils";
import { ApioDatatable } from "../../utils/datatable";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import { Search } from "../../utils/common";
import update from 'immutability-helper';


// helpers

function createHoliday(entry, onSuccess, onError) {
    fetch_post(
        '/api/v01/voo/public_holidays',
        {
            when: moment(entry.when, 'DD/MM/YYYY').format(),
            description: entry.description
        }
    )
        .then(() => onSuccess())
        .catch(error => onError && onError(error.message));
}


function deleteHoliday(hId, onSuccess) {
    fetch_delete(`/api/v01/voo/public_holidays/${hId}`)
        .then(() => {
            NotificationsManager.success(
                <FormattedMessage id="holiday-deleted" defaultMessage="Holiday deleted!" />,
            );
            onSuccess();
        })
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="new-holiday-save-failed" defaultMessage="Failed to save" />,
            error.message
        ));
}


const newHoliday = { when: moment().add(1, "days").format('DD/MM/YYYY'), description: '' };


// components

function NewPublicHolidayModal(props) {
    const { show, onHide } = props;
    const [entry, setEntry] = useState(newHoliday);

    const invalidDateFormat = !moment(entry.when, 'DD/MM/YYYY').isValid();
    const dateBeforeNow = !moment(entry.when, 'DD/MM/YYYY').isAfter(moment());
    const validDate = invalidDateFormat || dateBeforeNow ? "error" : null;

    return (
        <Modal show={show} onHide={onHide} backdrop={false}>
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
                            <FormControl type="text" value={entry.when}
                                onChange={e => setEntry(update(entry, { $merge: { when: e.target.value } }))}
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
                            <FormControl
                                type="text"
                                value={entry.description}
                                placeholder='...'
                                onChange={e => setEntry(update(entry, { $merge: { description: e.target.value } }))}
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col smOffset={2} sm={10}>
                            <Button
                                bsStyle="primary"
                                onClick={() => createHoliday(
                                    entry,
                                    () => {
                                        NotificationsManager.success(<FormattedMessage id="holiday-saved" defaultMessage="Holiday saved" />);
                                        onHide(true);
                                    },
                                    error => NotificationsManager.error(<FormattedMessage id="failed-save-holiday" defaultMessage="Failed to save" />, error))
                                }
                                disabled={validDate === "error"} >
                                <FormattedMessage id="save" defaultMessage="Save" />
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
            </Modal.Body>
        </Modal>
    )
}


export class PublicHolidays extends Search {
    static defaultProps = update(Search.defaultProps, {
        '$merge': {
            searchUrl: '/api/v01/voo/public_holidays',
            collectionName: 'holidays',
            defaultSortingSpec: [{ field: 'when', direction: 'desc' }],
        }
    });

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
                                        <Button onClick={e => deleteHoliday(n.id, () => this._refresh())} bsStyle="danger">
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
                        <Button onClick={() => this.setState({ showNew: true })} bsStyle="primary">
                            <FormattedMessage id="add-public-holiday" defaultMessage="Add holiday" />
                        </Button>
                        <NewPublicHolidayModal
                            onHide={r => {
                                r && this._refresh();
                                this.setState({ showNew: false });
                            }}
                            show={this.state.showNew} />
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}
