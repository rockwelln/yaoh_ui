import React, { Component } from 'react';
import { ApioDatatable } from "../utils/datatable";

import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Modal from 'react-bootstrap/lib/Modal';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import update from "immutability-helper/index";
import { DATE_FORMAT } from "./np-requests";
import { Search, StaticControl } from "../utils/common";


class MobileEventsActions extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { entry } = this.props;
    return (
      <div>
        <Button onClick={() => this.setState({ showDetails: true })} bsStyle="primary">
          <Glyphicon glyph="search" />
        </Button>
        {
          this.state.showDetails && (
            <Modal
              show={this.state.showDetails}
              onHide={() => this.setState({ showDetails: false })}
              backdrop={false}>
              <Modal.Header closeButton>
                <Modal.Title><FormattedMessage id="details" defaultMessage="Details" /></Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form horizontal>
                  <StaticControl label={<FormattedMessage id='number' defaultMessage='Number' />} value={entry.number} />
                  <StaticControl label={<FormattedMessage id='function' defaultMessage='Function' />} value={entry.function} />
                  <StaticControl label={<FormattedMessage id='routing-info' defaultMessage='Routing info' />} value={entry.routing_info} />
                  <StaticControl label={<FormattedMessage id='processing-result' defaultMessage='Processing result' />} value={entry.processing_result} />
                  <StaticControl label={<FormattedMessage id='message-date' defaultMessage='Message date' />} value={entry.message_date} />
                  <StaticControl label={<FormattedMessage id='created-on' defaultMessage='Created on' />} value={entry.created_on} />
                  <StaticControl label={<FormattedMessage id='content' defaultMessage='Content' />} value={entry.content} />
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => this.setState({ showDetails: false })}><FormattedMessage id="close" defaultMessage="Close" /></Button>
              </Modal.Footer>
            </Modal>
          )
        }
      </div>
    );
  }
}


export class MobileEventsManagement extends Search {
  static defaultProps = update(Search.defaultProps, {
    '$merge': {
      searchUrl: '/api/v01/voo/mobile_events/search',
      collectionName: 'events',
      defaultCriteria: {
        number: { value: '', op: 'eq' },
        routing_info: { value: '', op: 'eq' },
        created_on: { value: '', op: 'ge' },
      }
    }
  });

  _normalizeResource(r) {
    r.created_on = moment(r.created_on).format(DATE_FORMAT);
    return r;
  }

  render() {
    const { filter_criteria, resources } = this.state;
    const invalid_created_on = filter_criteria.created_on.value.length !== 0 && !moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm").isValid();

    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests" /></Breadcrumb.Item>
          <Breadcrumb.Item active><FormattedMessage id="mobile-events" defaultMessage="Mobile Events" /></Breadcrumb.Item>
        </Breadcrumb>
        <Panel defaultExpanded={false} >
          <Panel.Heading>
            <Panel.Title toggle><FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" /></Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <Form horizontal>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="number" defaultMessage="Number" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.number.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    value={filter_criteria.number.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { number: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="routing-info" defaultMessage="Routing info" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.routing_info.op}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { routing_info: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="eq">==</option>
                    <option value="ne">!=</option>
                    <option value="like">like</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <FormControl
                    type="input"
                    value={filter_criteria.routing_info.value}
                    onChange={(e) => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { routing_info: { $merge: { value: e.target.value } } })
                    })} />
                </Col>
              </FormGroup>

              <FormGroup validationState={invalid_created_on ? "error" : null}>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="created-on" defaultMessage="Created on" />
                </Col>

                <Col sm={1}>
                  <FormControl
                    componentClass="select"
                    value={filter_criteria.created_on.op}
                    onChange={e => this.setState({
                      filter_criteria: update(this.state.filter_criteria,
                        { created_on: { $merge: { op: e.target.value } } })
                    })}>
                    <option value="gt">&gt;</option>
                    <option value="ge">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="le">&lt;=</option>
                  </FormControl>
                </Col>

                <Col sm={8}>
                  <DatePicker
                    className="form-control"
                    selected={filter_criteria.created_on.value.length !== 0 ? moment(filter_criteria.created_on.value, "DD/MM/YYYY HH:mm") : null}
                    onChangeRaw={d => {
                      this.setState({
                        filter_criteria: update(
                          this.state.filter_criteria,
                          { created_on: { $merge: { value: d.target.value } } })
                      });
                      d.target.value.length === 0 && d.preventDefault();
                    }}
                    onChange={d => this.setState({
                      filter_criteria: update(
                        this.state.filter_criteria,
                        { created_on: { $merge: { value: d.format("DD/MM/YYYY HH:mm") } } })
                    })}
                    dateFormat="DD/MM/YYYY HH:mm"
                    locale="fr-fr"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60} />
                  <HelpBlock><FormattedMessage id="The date has to be formatted as DD/MM/YYYY HH:mm" /></HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup>
                <Col smOffset={1} sm={1}>
                  <Button bsStyle="info" onClick={() => this._refresh({ page_number: 1 })} disabled={invalid_created_on}>
                    <FormattedMessage id="search" defaultMessage="Search" />
                  </Button>
                </Col>
              </FormGroup>
            </Form>
          </Panel.Body>
        </Panel>

        <Panel>
          <Panel.Body>
            <ApioDatatable
              sorting_spec={this.state.sorting_spec}
              headers={[
                { title: <FormattedMessage id="number" defaultMessage="Number" />, field: 'number', sortable: true },
                { title: <FormattedMessage id="routing-info" defaultMessage="Routing info" />, field: 'routing_info', sortable: true },
                { title: <FormattedMessage id="function" defaultMessage="Function" />, field: 'function', sortable: true },
                { title: <FormattedMessage id="created-on" defaultMessage="Created on" />, field: 'created_on', sortable: true },
                {
                  title: '', render: n => (
                    <MobileEventsActions
                      onClose={force_refresh => force_refresh && this._refresh()}
                      entry={n}
                      {...this.props}
                    />
                  )
                },
              ]}
              pagination={this.state.pagination}
              data={resources}
              onSort={s => this._refresh(undefined, s)}
              onPagination={p => this._refresh(p)}
            />
          </Panel.Body>
        </Panel>
      </div>)
  }
}