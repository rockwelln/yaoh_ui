import React, { Component } from 'react';
import { fetch_post, parseJSON, NotificationsManager } from "../utils";
import { RangeInput } from "./utils";
import { fetchOperators } from "./data/operator_mgm";

import Panel from 'react-bootstrap/lib/Panel';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';

import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import ControlLabel from "react-bootstrap/lib/ControlLabel";


export class NPUpdateRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: undefined, operators: [],

      ranges: [{ from: '', to: '', codedId: '' }], routingInfo: '', donor: '',
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
    fetch_post(
      '/api/v01/voo/np_requests/update',
      {
        donor_id: parseInt(this.state.donor, 10),
        recipient_id: null, // this.state.operators.filter(o => o.short_name === DEFAULT_RECIPIENT)[0].id,
        ranges: this.state.ranges,
        routing_info: this.state.routingInfo,
      },
      this.props.auth_token
    )
      .then(parseJSON)
      .then(data => {
        this.setState({ redirect: data.id });
        NotificationsManager.success(
          <FormattedMessage id="voo-updt-created" defaultMessage="update request created!" />,
        )
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="voo-updt-failed" defaultMessage="Failed to create update request" />,
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

  render() {
    const ranges = this.state.ranges;
    const validDonor = this.state.donor !== '' ? "success" : null;
    const validRanges = ranges.length === 1 && ranges[0].from === '' && ranges[0].to === '' ? null : this.getInvalidRanges().length === 0 ? "success" : "error";
    const validRoutingInfo = this.state.routingInfo.length === 0 ? null : "success";

    const validForm = this.getInvalidRanges().length === 0 && validRoutingInfo !== "error" && validDonor === "success";

    return (
      <Panel header={<FormattedMessage id="update-request" defaultMessage="Update request" />}>
        <Panel.Heading>
          <Panel.Title><FormattedMessage id="update-request" defaultMessage="Update request" /></Panel.Title>
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
                  ranges={this.state.ranges}
                  multipleRanges />
              </Col>
            </FormGroup>

            <FormGroup validationState={validDonor}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="donor" defaultMessage="Donor" />
              </Col>

              <Col sm={9}>
                <FormControl componentClass="select" value={this.state.donor}
                  onChange={e => this.setState({ donor: e.target.value })}>
                  <option key={-1} value="" />
                  {this.state.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </FormControl>
              </Col>
            </FormGroup>

            <FormGroup validationState={validRoutingInfo}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="routing-info" defaultMessage="Routing info" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={this.state.routingInfo}
                  onChange={e => this.setState({ routingInfo: e.target.value })}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button type="submit" onClick={this.onSubmit} disabled={!validForm}>
                  <FormattedMessage id="submit" defaultMessage="Submit" />
                </Button>
              </Col>
            </FormGroup>

          </Form>
        </Panel.Body>
        {this.state.redirect && <Redirect to={'/transactions/' + this.state.redirect} />}
      </Panel>
    )
  }
}