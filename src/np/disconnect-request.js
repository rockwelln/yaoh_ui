import React, { Component } from 'react';
import { API_URL_PREFIX, fetch_get, fetch_post, parseJSON, NotificationsManager } from "../utils";
import { RangeInput } from "./utils";
import { fetchOperators } from "./data/operator_mgm";

import Panel from 'react-bootstrap/lib/Panel';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import FormGroup from 'react-bootstrap/lib/FormGroup';

import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import { StaticControl } from "../utils/common";
import { DEFAULT_RECIPIENT } from "./np-requests";

const MIN_NUMBER_LENGTH_LOOKUP = 6;
const MAX_NUMBER_LENGTH_LOOKUP = 15;


export class NPDisconnectRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: undefined, operators: [],

      ranges: [{ from: '', to: '', codedId: '' }], donor: '',
    };

    this.cancelLoad = false;
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    fetchOperators(this.props.auth_token,
      data => !this.cancelLoad && this.setState({ operators: data }),
      error => !this.cancelLoad && NotificationsManager.error(
        <FormattedMessage id="fetch-operators-failed" defaultMessage="Failed to fetch operators" />,
        error.message
      )
    );
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  onSubmit(e) {
    e.preventDefault();
    const { donor, ranges, operators } = this.state;
    fetch_post(
      '/api/v01/voo/np_requests/disconnect',
      {
        donor_id: parseInt(donor.id, 10),
        recipient_id: operators.filter(o => o.short_name === DEFAULT_RECIPIENT)[0].id,
        ranges: ranges,
      },
      this.props.auth_token
    )
      .then(parseJSON)
      .then(data => {
        this.setState({ redirect: data.id });
        NotificationsManager.success(
          <FormattedMessage id="voo-disc-created" defaultMessage="disconnect request created!" />,
        )
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="voo-disc-failed" defaultMessage="Failed to create disconnect request" />,
        error.message
      ))
  }

  getInvalidRanges() {
    return this.state.ranges.map((r, index) => {
      if (r.from.length === 0) return index;
      if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
      if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
      return null;
    }).filter(e => e !== null);
  }

  resolveDonor(number) {
    let url = new URL(API_URL_PREFIX + '/api/v01/voo/number_porting/search');
    let filter_spec = {
      field: 'number',
      op: 'eq',
      value: number.trim()
    };
    url.searchParams.append('filter', JSON.stringify(filter_spec));
    this.setState({ donor: undefined, donor_error: undefined });
    if (number.length < MIN_NUMBER_LENGTH_LOOKUP || number.length >= MAX_NUMBER_LENGTH_LOOKUP) return;

    fetch_get(url, this.props.auth_token)
      .then(data => {
        if (data.numbers.length === 0) {
          throw new Error('No case found');
        }
        this.setState({ donor: this.state.operators.find(o => o.id === data.numbers[0].donor_id) })
      })
      .catch(error => this.setState({ donor_error: error }))
  }

  render() {
    const { ranges, redirect, donor, donor_error } = this.state;
    let alerts = [];

    const validRanges = ranges.length === 1 && ranges[0].from === '' && ranges[0].to === '' ? null : this.getInvalidRanges().length === 0 ? "success" : "error";
    const validForm = this.getInvalidRanges().length === 0 && donor && !donor_error;

    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title><FormattedMessage id="disconnect-request" defaultMessage="Disconnect request" /></Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <Form horizontal>
            {alerts.map((a, i) => <div key={i}>{a}</div>)}

            <FormGroup validationState={validRanges}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="ranges" defaultMessage="Ranges" />
              </Col>

              <Col sm={9}>
                <RangeInput
                  onChange={ranges => {
                    this.setState({ ranges: ranges });
                    this.resolveDonor(ranges[0].from);
                  }}
                  ranges={ranges}
                  multipleRanges={false} />
              </Col>
            </FormGroup>

            <StaticControl
              label={<FormattedMessage id='donor' defaultMessage='Donor' />}
              value={(donor_error && donor_error.message) || (donor && donor.name) || null}
              validationState={donor_error ? "error" : null} />

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button type="submit" onClick={this.onSubmit} disabled={!validForm}>
                  <FormattedMessage id="submit" defaultMessage="Submit" />
                </Button>
              </Col>
            </FormGroup>

          </Form>
          {
            redirect && <Redirect to={`/transactions/${redirect}`} />
          }
        </Panel.Body>
      </Panel>
    )
  }
}