import React, { Component } from 'react';

import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Panel from 'react-bootstrap/lib/Panel';
import Radio from 'react-bootstrap/lib/Radio';
import Checkbox from 'react-bootstrap/lib/Checkbox';

import moment from 'moment';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import {
    API_URL_PREFIX,
    fetch_post,
    fetch_get,
    parseJSON
} from "../utils";

import {RangeInput} from "./utils";
import {fetchOperators} from "./data/operator_mgm";

import 'react-datepicker/dist/react-datepicker.css';
import { DEFAULT_RECIPIENT } from "./np-requests";
import update from 'immutability-helper';

const RECIPIENTS = [
    DEFAULT_RECIPIENT,
];


export class NPPortInRequest extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;

        this.state = {
            complexityClass: 'Simple',
            ranges: [{ from: '', to: '', codedId: '' }],
            donor: '', customer_type: 'Residential', dueDate: null,
            zipCode: '', houseNumber: '', street: '',
            Id: '', vat: '', accountNumber: '', isB2B: false,
            sub_type: 'GEOGRAPHIC', service_type: 'MOBILE', port_req_form_id: 'form-123', subscriber_data: { NationalIDNumber: "", ContactPhone: "" },

            personIDType: "NationalIDNumber",

            operators: [],
            redirect: false
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.getInvalidRanges = this.getInvalidRanges.bind(this);
    }

    componentDidMount() {
        fetchOperators(this.props.auth_token,
            data => {
                if (this.cancelLoad) return;

                let impact = { operators: data };
                if (!this.state.donor && data.length > 0) {
                    impact.donor = data[0].id;
                }
                if (!this.state.recipient && data.length > 0) {
                    impact.recipient = data.filter(o => RECIPIENTS.indexOf(o.short_name) !== -1)[0].id;
                }
                this.setState(impact);
            },
            error => !this.cancelLoad && this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-operators-failed" defaultMessage="Failed to fetch operators" />,
                message: error.message,
                level: 'error'
            })
        );
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({ range_error: undefined, loading: true });
        Promise.all(this.state.ranges.map(r => {
            return fetch_get('/api/v01/voo/number/' + r.from, this.props.auth_token)
        })).then(details => {
            const other_donors = details.filter(d => d.operator && d.operator.id !== parseInt(this.state.donor, 10));
            if (other_donors.length !== 0) {
                this.setState({
                    loading: false,
                    range_error:
                        <div>
                            <FormattedMessage id="number-ownership-mismatch" defaultMessage="Some number(s) doesn't belong to the donor (encoding error?)" />
                            <ul>
                                {
                                    other_donors.map((d, i) => <li key={i}>{d.number}: {d.operator.name}</li>)
                                }
                            </ul>
                        </div>
                });
                this.props.notifications.addNotification({
                    title: <FormattedMessage id="create-portin-failed" defaultMessage="Failed to create request" />,
                    message: <FormattedMessage id="number-ownership-mismatch" defaultMessage="Some number(s) doesn't belong to the donor (encoding error?)" />,
                    level: 'error'
                });
                return;
            }

            const subscriber_data = [
                'CompanyFlag',
                'SurnameORCompanyName',
                'FirstName',
                'NationalIDNumber',
                'IqamaNumber',
                'CommRegNumber',
                'GccId',
                'BorderId',
                'UnifiedEntityId',
                'ContactPhone',
                'Fax',
                'City',
                'Street',
                'Number',
                'Locality',
                'PostCode',
                'IDNumber',
                'SIMCardNum'
            ]
                .filter(k => this.state.subscriber_data[k] !== undefined && this.state.subscriber_data[k] !== "")
                .reduce((p, o) => { p[o] = this.state.subscriber_data[o]; return p; }, {});

            fetch_post(
                '/api/v01/voo/np_requests/port_in',
                {
                    ranges: this.state.ranges,
                    donor_id: parseInt(this.state.donor, 10),
                    recipient_id: parseInt(this.state.recipient, 10),
                    sub_type: this.state.sub_type,
                    service_type: this.state.service_type,
                    port_req_form_id: this.state.port_req_form_id,
                    subscriber_data: subscriber_data,
                },
                this.props.auth_token
            )
                .then(parseJSON)
                .then(data => {
                    this.setState({ redirect: data.id, loading: false });
                    this.props.notifications.addNotification({
                        message: <FormattedMessage id="request-created" defaultMessage="Request created: {tx_id}" values={{ tx_id: data.id }} />,
                        level: 'success'
                    })
                })
                .catch(error => {
                    this.setState({ loading: false });
                    this.props.notifications.addNotification({
                        title: <FormattedMessage id="create-portin-failed" defaultMessage="Failed to create request" />,
                        message: error.message,
                        level: 'error'
                    });
                })
        }).catch(error => {
            this.setState({ loading: false });
            this.props.notifications.addNotification({
                title: <FormattedMessage id="create-portin-failed" defaultMessage="Failed to create request" />,
                message: error.message,
                level: 'error'
            });
        });
    }

    getInvalidRanges() {
        return this.state.ranges.map((r, index) => {
            if (r.from.length === 0) return index;
            if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
            if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
            return null;
        }).filter(e => e !== null);
    }

    render() {
        const {
            ranges,
            range_error,
            operators,
            service_type,
            sub_type,
            port_req_form_id,
            subscriber_data,
            personIDType,
            donor, recipient
        } = this.state;
        const validRanges = ranges.length === 1 && ranges[0].from === '' && ranges[0].to === '' ? null : this.getInvalidRanges().length === 0 && range_error === undefined ? "success" : "error";

        const validContactPhone = subscriber_data.ContactPhone.length === 0 ? null : "success";
        const validContactID = subscriber_data[personIDType].length === 0 ? null : (personIDType === "GccId" && (subscriber_data[personIDType].length < 8 || subscriber_data[personIDType].length > 12)) || subscriber_data[personIDType].length !== 10 ? "error": "success";
        const validPortReqFormID = port_req_form_id.length === 0 ? null : "success";
        const validRecipient = recipient !== null && recipient !== undefined && recipient !== "" ? "success" : null;

        const validForm = this.getInvalidRanges().length === 0 && validContactPhone === "success" && validContactID === "success" && validPortReqFormID === "success" && validRecipient === "success";
        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="new-portin" defaultMessage="New port-in" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Form horizontal>
                        <FormGroup validationState={validRanges}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="ranges" defaultMessage="Ranges" />
                            </Col>

                            <Col sm={9}>
                                <RangeInput
                                    onChange={ranges => this.setState({ ranges: ranges })}
                                    ranges={ranges}
                                    multipleRanges />
                                {range_error && <HelpBlock>{range_error}</HelpBlock>}
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="donor" defaultMessage="Donor" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="select" value={donor}
                                    onChange={e => this.setState({ donor: e.target.value })}>
                                    {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </FormControl>
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validRecipient}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="recipient" defaultMessage="Recipient" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={recipient}
                                    onChange={e => this.setState({ recipient: e.target.value })}>
                                    <option value=""></option>
                                    {
                                        operators.filter(o => RECIPIENTS.indexOf(o.short_name) !== -1).map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                                    }
                                </FormControl>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="service-type" defaultMessage="Service type" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={service_type}
                                    onChange={e => this.setState({ service_type: e.target.value })}>
                                    <option value="MOBILE">MOBILE</option>
                                    <option value="FIXED">FIXED</option>
                                </FormControl>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="sub-type" defaultMessage="Sub type" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    componentClass="select"
                                    value={sub_type}
                                    onChange={e => this.setState({ sub_type: e.target.value })} >
                                    <option value="NOMADIC">NOMADIC</option>
                                    <option value="GEOGRAPHIC">GEOGRAPHIC</option>
                                    <option value="FREE PHONE">FREE PHONE</option>
                                    <option value="UNIFIED CALLING">UNIFIED CALLING</option>
                                </FormControl>
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validPortReqFormID}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="port_req_form_id" defaultMessage="Port req form ID" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    type="text"
                                    value={port_req_form_id}
                                    onChange={e => this.setState({ port_req_form_id: e.target.value })} />
                            </Col>
                        </FormGroup>

                        <hr />

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="company-flag" defaultMessage="Company flag" />
                            </Col>
                            <Col sm={9}>
                                <Checkbox
                                    checked={subscriber_data.CompanyFlag === "TRUE"}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    CompanyFlag: e.target.checked.toString().toUpperCase()
                                                }
                                            })
                                    })} />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="surname-company-name" defaultMessage="Surname or Company name" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text"
                                    value={subscriber_data.SurnameOrCompanyName}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    SurnameOrCompanyName: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="firstname" defaultMessage="Firstname" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text"
                                    value={subscriber_data.FirstName}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    FirstName: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validContactID}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormControl componentClass="select"
                                    value={this.state.personIDType}
                                    onChange={e => this.setState({
                                        personIDType: e.target.value,
                                        subscriber_data: update(subscriber_data, {
                                            $merge: {
                                                [this.state.personIDType]: "",
                                                [e.target.value]: "",
                                            }
                                        })
                                    })}
                                >
                                    <option value="NationalIDNumber">National ID number</option>
                                    <option value="IqamaNumber">Iqama Number</option>
                                    <option value="CommRegNumber">Commercial Reg. Number</option>
                                    <option value="GccId">GCC ID</option>
                                    <option value="BorderId">Border ID number</option>
                                    <option value="UnifiedEntityId">Unified Entity ID</option>
                                </FormControl>{'*'}
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text"
                                    value={subscriber_data[this.state.personIDType]}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    [this.state.personIDType]: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup validationState={validContactPhone}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="contact-phone" defaultMessage="Contact phone" />{'*'}
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.ContactPhone}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    ContactPhone: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="fax" defaultMessage="Fax" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.Fax}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    Fax: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="city" defaultMessage="City" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.City}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    City: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="street" defaultMessage="Street" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.Street}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    Street: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="number" defaultMessage="Number" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.Number}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    Number: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="locality" defaultMessage="Locality" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.Locality}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    Locality: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="post-code" defaultMessage="Port code" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.PostCode}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    PostCode: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="id-number" defaultMessage="ID number" />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.IDNumber}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    IDNumber: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="sim-card-num" defaultMessage="SIM card num." />
                            </Col>

                            <Col sm={9}>
                                <FormControl type="text" value={subscriber_data.SIMCardNum}
                                    onChange={e => this.setState({
                                        subscriber_data:
                                            update(subscriber_data, {
                                                $merge: {
                                                    SIMCardNum: e.target.value
                                                }
                                            })
                                    })}
                                />
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col smOffset={2} sm={10}>
                                <Button type="submit" onClick={this.onSubmit} disabled={!validForm || this.state.loading}>
                                    <FormattedMessage id="submit" defaultMessage="Submit" />
                                </Button>
                            </Col>
                        </FormGroup>
                        {this.state.redirect && <Redirect to={`/transactions/${this.state.redirect}`} />}
                    </Form>
                </Panel.Body>
            </Panel >)
    }
}