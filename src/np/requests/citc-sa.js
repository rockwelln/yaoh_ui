import React, {useState, useEffect, Component} from "react";
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Table from 'react-bootstrap/lib/Table';
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Alert from 'react-bootstrap/lib/Alert';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Badge from 'react-bootstrap/lib/Badge';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Modal from 'react-bootstrap/lib/Modal';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import update from 'immutability-helper';
import { fetchOperators } from "../data/operator_mgm";
import {NotificationsManager, fetch_get, fetch_post, fetch_put, parseJSON, API_URL_PREFIX} from "../../utils";
import Panel from "react-bootstrap/lib/Panel";
import {access_levels, isAllowed, pages} from "../../utils/user";
import {StaticControl} from "../../utils/common";
import {
  Comments,
  ContextTable, Errors, Events, ReplayingSubInstancesModal, SavingModal,
  TasksTable,
  TransactionFlow,
  triggerManualAction,
  TxTable
} from "../../requests/requests";

export const DEFAULT_RECIPIENT = "ITC";
export const rejection_codes = [
  { id: "SP01", summary: "ID number is wrong or missing." },
];
const RECIPIENTS = [
  DEFAULT_RECIPIENT,
];


function newRequest(request, onSuccess, onError) {
  Promise.all(request.ranges.map(r => {
    return fetch_get('/api/v01/npact/number/' + r.from)
  })).then(details => {
    const other_donors = details.filter(d => d.operator && d.operator.id !== parseInt(request.donor, 10));
    if (other_donors.length !== 0) {
      onError({
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
      NotificationsManager.error(
        <FormattedMessage id="create-portin-failed" defaultMessage="Error on number ownership" />,
        <FormattedMessage id="number-ownership-mismatch" defaultMessage="Some number(s) doesn't belong to the donor (encoding error?)" />
      );
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
      .filter(k => request.subscriber_data[k] !== undefined && request.subscriber_data[k] !== "")
      .reduce((p, o) => { p[o] = request.subscriber_data[o]; return p; }, {});

    fetch_post(
      '/api/v01/npact/np_requests/port_in',
      {
        ranges: request.ranges,
        donor_id: request.donor,
        recipient_id: request.recipient,
        sub_type: request.sub_type,
        service_type: request.service_type,
        port_req_form_id: request.port_req_form_id,
        subscriber_data: subscriber_data,
      }
    )
      .then(parseJSON)
      .then(data => {
        onSuccess(data.id);
        NotificationsManager.success(
          <FormattedMessage id="request-created" defaultMessage="Request created: {tx_id}" values={{ tx_id: data.id }} />
        )
      })
      .catch(error => {
        NotificationsManager.error(
          <FormattedMessage id="create-portin-failed" defaultMessage="Failed to start port-in" />,
          error.message
        );
        onError && onError();
      })
  }).catch(error => {
    NotificationsManager.error(
      <FormattedMessage id="create-portin-failed" defaultMessage="Failed to create request" />,
      error.message
    );
    onError && onError();
  });
}

const RangeInput = ({ ranges, onChange, multipleRanges }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th><FormattedMessage id="from" defaultMessage="From" /></th>
          <th><FormattedMessage id="to" defaultMessage="To" /></th>
          <th><FormattedMessage id="data-number" defaultMessage="Data number" /></th>
          <th><FormattedMessage id="fax-number" defaultMessage="Fax number" /></th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          ranges.map((range, index) => {
            return (
              <tr key={index}>
                <td>
                  <FormControl type="number"
                    value={range.from}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { from: e.target.value } } }
                      )))
                    } />
                </td>
                <td>
                  <FormControl type="number"
                    value={range.to}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { to: e.target.value } } }
                      )))
                    } />
                </td>
                <td>
                  <FormControl type="number"
                    value={range.data_number}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { data_number: e.target.value } } }
                      )))
                    } />
                </td>
                <td>
                  <FormControl type="number"
                    value={range.fax_number}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { fax_number: e.target.value } } }
                      )))
                    } />
                </td>
                {multipleRanges && (
                  <td>
                    <Button onClick={() => {
                      let ranges_ = ranges;
                      ranges_.splice(index, 1);
                      onChange(ranges_)
                    }}>-</Button>
                  </td>
                )}
              </tr>
            )
          })
        }

        {multipleRanges && (
          <tr>
            <td colSpan={4}>
              <Button
                onClick={() =>
                  onChange(update(ranges, { $push: [{ from: '', to: '', data_number: '', fax_number: '' }] }))
                }>
                +
                    </Button>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
    <HelpBlock>
      <FormattedMessage id="range-one-number-note" defaultMessage="To work with only 1 number, you may just put it in the from cell." />
    </HelpBlock>
  </div>
);

function validateRanges(ranges) {
  return ranges.map((r, index) => {
    if (r.from.length === 0) return index;
    if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
    if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
    return null;
  }).filter(e => e !== null);
}

const emptyRequest = {
  complexityClass: 'Simple',
  ranges: [{ from: '', to: '', codedId: '' }],
  donor: '',
  customer_type: 'Residential',
  dueDate: null,
  zipCode: '',
  houseNumber: '',
  street: '',
  Id: '',
  vat: '',
  accountNumber: '',
  isB2B: false,
  sub_type: 'GEOGRAPHIC',
  service_type: 'FIXED',
  port_req_form_id: 'form-123',
  subscriber_data: {
    NationalIDNumber: "",
    ContactPhone: ""
  },
  personIDType: "NationalIDNumber",
}

export function NPPortInRequest(props) {
  const [operators, setOperators] = useState([]);
  const [request, setRequest] = useState(emptyRequest);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rangeError, setRangeError] = useState(undefined);

  useEffect(() => fetchOperators(null, setOperators), []);
  useEffect(() => {
    const o = operators && operators.find(o => o.name === DEFAULT_RECIPIENT);
    if (o) {
      setRequest(r => update(request, { $merge: { recipient: o.id } }))
    }
  }, [operators]);

  const validRanges = request.ranges.length === 1 && request.ranges[0].from === '' && request.ranges[0].to === '' ? null : validateRanges(request.ranges).length === 0 && rangeError === undefined ? "success" : "error";

  const validContactPhone = request.subscriber_data.ContactPhone.length === 0 ? null : "success";
  const validContactID = request.subscriber_data[request.personIDType].length === 0 ? null : (request.personIDType === "GccId" && (request.subscriber_data[request.personIDType].length < 8 || request.subscriber_data[request.personIDType].length > 12)) || (request.personIDType !== "GccId" && request.subscriber_data[request.personIDType].length !== 10) ? "error" : "success";
  const validPortReqFormID = request.port_req_form_id.length === 0 ? null : "success";
  const validRecipient = request.recipient !== null && request.recipient !== undefined && request.recipient !== "" ? "success" : null;

  const validForm = validateRanges(request.ranges).length === 0 && validContactPhone === "success" && validContactID === "success" && validPortReqFormID === "success" && validRecipient === "success";
  return (
    <Panel>
        <Panel.Heading>
          <Panel.Title><FormattedMessage id="port-in-request" defaultMessage="Port-in request" /></Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <Form horizontal>
            <FormGroup validationState={validRanges}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="ranges" defaultMessage="Ranges" />
              </Col>

              <Col sm={9}>
                <RangeInput
                  onChange={ranges => setRequest(update(request, { $merge: { ranges: ranges } }))}
                  ranges={request.ranges}
                  multipleRanges />
                {rangeError && <HelpBlock>{rangeError}</HelpBlock>}
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="donor" defaultMessage="Donor" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={request.donor}
                  onChange={e => setRequest(update(request, { $merge: { donor: e.target.value && parseInt(e.target.value, 10) } }))}>
                  <option value=""></option>
                  {
                    operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
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
                  value={request.recipient}
                  onChange={e => setRequest(update(request, { $merge: { recipient: e.target.value && parseInt(e.target.value, 10) } }))}>
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
                  value={request.service_type}
                  onChange={e => setRequest(update(request, { $merge: { service_type: e.target.value } }))}>
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
                  value={request.sub_type}
                  onChange={e => setRequest(update(request, { $merge: { sub_type: e.target.value } }))} >
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
                  value={request.port_req_form_id}
                  onChange={e => setRequest(update(request, { $merge: { port_req_form_id: e.target.value } }))} />
              </Col>
            </FormGroup>

            <hr />

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="company-flag" defaultMessage="Company flag" />
              </Col>
              <Col sm={9}>
                <Checkbox
                  checked={request.subscriber_data.CompanyFlag === "TRUE"}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            CompanyFlag: e.target.checked.toString().toUpperCase()
                          }
                        })
                    }
                  }))} />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="surname-company-name" defaultMessage="Surname or Company name" />
              </Col>

              <Col sm={9}>
                <FormControl type="text"
                  value={request.subscriber_data.SurnameOrCompanyName}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            SurnameOrCompanyName: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="firstname" defaultMessage="Firstname" />
              </Col>

              <Col sm={9}>
                <FormControl type="text"
                  value={request.subscriber_data.FirstName}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            FirstName: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup validationState={validContactID}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormControl componentClass="select"
                  value={request.personIDType}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      personIDType: e.target.value,
                      subscriber_data: update(request.subscriber_data, {
                        $merge: {
                          [request.personIDType]: "",
                          [e.target.value]: "",
                        }
                      })
                    }
                  }))}
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
                  value={request.subscriber_data[request.personIDType]}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            [request.personIDType]: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup validationState={validContactPhone}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="contact-phone" defaultMessage="Contact phone" />{'*'}
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.ContactPhone}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            ContactPhone: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="fax" defaultMessage="Fax" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.Fax}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            Fax: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="city" defaultMessage="City" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.City}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            City: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="street" defaultMessage="Street" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.Street}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            Street: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="number" defaultMessage="Number" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.Number}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            Number: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="locality" defaultMessage="Locality" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.Locality}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            Locality: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="post-code" defaultMessage="Port code" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.PostCode}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            PostCode: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="id-number" defaultMessage="ID number" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.IDNumber}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            IDNumber: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="sim-card-num" defaultMessage="SIM card num." />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.SIMCardNum}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            SIMCardNum: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button
                  onClick={() => {
                    setLoading(true);
                    setRangeError(undefined);
                    newRequest(
                      request,
                      id => {
                        setLoading(false);
                        setRedirect(id);
                      },
                      error => {
                        setLoading(false);
                        if (error && error.range_error) {
                          setRangeError(error.range_error);
                        }
                      }
                    )
                  }}
                  disabled={!validForm || loading} >
                  <FormattedMessage id="submit" defaultMessage="Submit" />
                </Button>
              </Col>
            </FormGroup>
            {redirect && <Redirect to={`/transactions/${redirect}`} />}
          </Form>
        </Panel.Body>
    </Panel>
  )
}


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
      '/api/v01/npact/np_requests/disconnect',
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
    let url = new URL(API_URL_PREFIX + '/api/v01/npact/number_porting/search');
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


class RequestTable extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      operators: undefined,
      diff_req: {},
      publicHolidays: [],
      saving: false,
    };
    this.onSubmit = this.onSubmit.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
    fetchOperators(this.props.auth_token,
      data => !this.cancelLoad && this.setState({ operators: data }),
      error => !this.cancelLoad && this.setState({ error: error })
    );
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  onSubmit() {
    let { diff_req } = this.state;
    if (diff_req.due_date !== undefined && typeof diff_req.due_date !== "string") {
      diff_req.due_date = diff_req.due_date.format();
    }

    this.setState({ saving: true });
    fetch_put(`/api/v01/voo/np_requests/${this.props.request.id}`, diff_req, this.props.auth_token)
      .then(parseJSON)
      .then(data => {
        this.setState({ request_crdc: data.event_sent, saving: false });
        if (data.request_crdc) {
          this.props.notifications.addNotification({
            message: <FormattedMessage id="request-updated-with-crdc" defaultMessage="Update request sent to CRDC!" />,
            level: 'success'
          })
        } else {
          this.props.notifications.addNotification({
            message: <FormattedMessage id="request-updated" defaultMessage="Request updated!" />,
            level: 'success'
          })
        }
        //this._fetch();  // devnote: refresh the data
        this.onClose();
      })
      .catch(error => {
          this.setState({ saving: false });
          this.props.notifications.addNotification({
            title: <FormattedMessage id="request-update-failed" defaultMessage="Request update failed!" />,
            message: error.message,
            level: 'error'
          });
        }
      );
  }

  onClose() {
    this.setState({ diff_req: {}, saving: false });
    this.props.onEditEnd && this.props.onEditEnd();
  }

  render() {
    if (this.props.request === undefined || this.state.operators === undefined) {
      return <div><FormattedMessage id="loading" defaultMessage="Loading..." /></div>;
    }

    if (this.state.error !== undefined) {
      return <Alert bsStyle="danger">
        <FormattedMessage id="fail-fetch-request" defaultMessage="Failed to fetch original request." />
        {this.state.error.message}
      </Alert>
    }

    const req = update(this.props.request, { $merge: this.state.diff_req });
    const donor = this.state.operators.find(d => d.id === parseInt(req.donor_id, 10));
    const recipient = this.state.operators.find(d => d.id === parseInt(req.recipient_id, 10));
    return (
      <Panel>
        <Panel.Body>
          <Table condensed>
            <tbody>
            <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td>{req.id}</td></tr>
            <tr><th><FormattedMessage id="kind" defaultMessage="Kind" /></th><td>{req.kind}</td></tr>
            <tr><th><FormattedMessage id="complexity" defaultMessage="Complexity" /></th><td>{req.complexity_class}</td></tr>
            <tr><th><FormattedMessage id="final-status" defaultMessage="Status" /></th><td>{req.status}</td></tr>
            <tr><th><FormattedMessage id="port-id" defaultMessage="Port ID (CITC ID)" /></th><td>{req.crdc_id}</td></tr>
            <tr><th><FormattedMessage id="ranges" defaultMessage="Ranges" /></th>
              <td>{req.ranges[0].range_from} {' - '} {req.ranges[0].range_to}</td>
            </tr>
            {
              req.ranges.map((r, i) => {
                if (i === 0) return null; // the first entry has already been treated.
                return (<tr key={i}><td /><td>{r.range_from} {' - '} {r.range_to}</td></tr>)
              })
            }
            <tr><th><FormattedMessage id="donor" defaultMessage="Donor" /></th>
              <td>
                {
                  this.props.edit_mode ? (
                    <FormControl
                      componentClass="select"
                      value={req.donor_id}
                      onChange={e => this.setState({ diff_req: update(this.state.diff_req, { $merge: { donor: e.target.value } }) })}
                    >
                      {this.state.operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </FormControl>
                  ) : (
                    donor !== undefined ? donor.name : '-'
                  )
                }
              </td>
            </tr>
            <tr><th><FormattedMessage id="recipient" defaultMessage="Recipient" /></th><td>{recipient !== undefined ? recipient.name : '-'}</td></tr>
            <tr>
              <th><FormattedMessage id="routing-info" defaultMessage="Routing info" /></th>
              <td>{req.routing_info}</td>
            </tr>
            <tr><th><FormattedMessage id="service-type" defaultMessage="Service type" /></th><td>{req.service_type}</td></tr>
            <tr><th><FormattedMessage id="sub-type" defaultMessage="Sub type" /></th><td>{req.sub_type}</td></tr>
            <tr><th><FormattedMessage id="port-req-form-id" defaultMessage="Port request form ID" /></th><td>{req.port_req_form_id}</td></tr>
            <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td>{req.created_on}</td></tr>
            <tr>
              <th><FormattedMessage id="subscriber-data" defaultMessage="Subscriber data" /></th>
              <td>
                <pre>{JSON.stringify(req.subscriber_data, undefined, 4)}</pre>
              </td>
            </tr>
            </tbody>
          </Table>
          {
            this.props.edit_mode && (
              <div>
                <ButtonToolbar>
                  <Button onClick={this.onSubmit} bsStyle="primary" disabled={this.state.saving}><FormattedMessage id="save" defaultMessage="Save" /></Button>
                  <Button onClick={this.onClose} disabled={this.state.saving}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
                </ButtonToolbar>
              </div>
            )
          }
        </Panel.Body>
      </Panel>
    )
  }
}

class RejectionReason extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onClose = this.onClose.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    this.props.onSubmit('donor_approval', 'API.reject', { reason: this.state.rej });
    this.onClose();
  }

  onClose() {
    this.setState({});
    this.props.onHide && this.props.onHide();
  }

  render() {
    const { rej } = this.state;

    return (
      <Modal show={this.props.show} onHide={this.onClose} backdrop={false}>
        <Modal.Header closeButton>
          <Modal.Title><FormattedMessage id="reject-title" defaultMessage="Reject" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="reason" defaultMessage="Reason" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={rej && rej.id}
                  onChange={e => this.setState({ rej: rejection_codes.find(r => r.id === e.target.value) })} >
                  <option value={null} />
                  {
                    rejection_codes.map(r => <option key={r.id} value={r.id}>{r.id} - {r.summary}</option>)
                  }
                </FormControl>
                <HelpBlock>
                  {rej && rej.help}
                </HelpBlock>
              </Col>
            </FormGroup>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onSave} disabled={!rej} bsStyle="primary">
            <FormattedMessage id="save" defaultMessage="Save" />
          </Button>
          <Button onClick={this.onClose}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
        </Modal.Footer>
      </Modal>
    );
  }
}


const RELOAD_TX = 10 * 1000;

export class NPTransaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      sending: false,
      activeTab: 1,
      manualActions: [],
      logs: [],
      events: [],
    };
    this.cancelLoad = false;

    this.onReplay = this.onReplay.bind(this);
    this.onForceClose = this.onForceClose.bind(this);
    this.fetchTxDetails = this.fetchTxDetails.bind(this);
    this.actionList = this.actionList.bind(this);
    this.changeTxStatus = this.changeTxStatus.bind(this);
    this.onReopen = this.onReopen.bind(this);
    this.sendEvent = this.sendEvent.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.caseUpdated = this.caseUpdated.bind(this);
    this.caseUpdateFailure = this.caseUpdateFailure.bind(this);
  }

  fetchTxDetails(reload) {
    this.setState({ error: undefined });
    const txId = this.props.match.params.txId;
    fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`, this.props.auth_token)
      .then(data => {
        if (this.cancelLoad)
          return;

        this.setState({ tx: data });

        fetch_get(`/api/v01/npact/np_requests/${data.original_request_id}`, this.props.auth_token)
          .then(data => !this.cancelLoad && this.setState({ request: data }))
          .catch(error => !this.cancelLoad && this.setState({ error: error }));

        fetch_get(`/api/v01/transactions/${txId}/manual_actions`)
          .then(data => !this.cancelLoad && this.setState({manualActions: data.manual_actions}))
          .catch(console.error);

        fetch_get(`/api/v01/transactions/${txId}/events`)
          .then(data => !this.cancelLoad && this.setState({events: data.events}))
          .catch(error => !this.cancelLoad && this.setState({error: error}));

        fetch_get(`/api/v01/transactions/${txId}/logs`)
          .then(data => !this.cancelLoad && this.setState({
              logs: data.logs.map(l => {l.type='log'; l.source_entity=l.source; l.content=l.message; return l;})
          }))
          .catch(error => !this.cancelLoad && this.setState({error: error}));

        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
      })
      .catch(error => {
        if (this.cancelLoad)
          return;
        let error_msg = undefined;
        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
        if (error.response === undefined) {
          this.setState({ error: error });
          return
        }
        switch (error.response.status) {
          case 404: error_msg = <FormattedMessage id="unknown-transaction" defaultMessage="Unknown transaction." />; break;
          case 401: error_msg = <FormattedMessage id="not-allowed-transaction" defaultMessage="You are not allowed to see this transaction." />; break;
          default: error_msg = <FormattedMessage id="unknown-error" defaultMessage="Unknown error: {status}" values={{ status: error.response.status }} />;
        }
        this.setState({ error: new Error(error_msg) })
      });
  }

  componentDidMount() {
    this.fetchTxDetails(true);
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentWillReceiveProps() {
    this.setState({ activeTab: 1 });
    this.fetchTxDetails(false);
  }

  onReplay(activity_id, task_id) {
    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {}, this.props.auth_token)
      .then(() => this.props.notifications.addNotification({
          message: <FormattedMessage id="task-replayed" defaultMessage="Task replayed!" />,
          level: 'success'
        })
      )
      .catch(error => this.props.notifications.addNotification({
          title: <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!" />,
          message: error.message,
          level: 'error'
        })
      )
  }

  changeTxStatus(new_status) {
    fetch_put(`/api/v01/transactions/${this.state.tx.id}`, { status: new_status }, this.props.auth_token)
      .then(() => {
        this.fetchTxDetails(false);
        this.props.notifications.addNotification({
          message: <FormattedMessage id="task-status-changed" defaultMessage="Task status updated!" />,
          level: 'success'
        });
      })
      .catch(error => this.props.notifications.addNotification({
          title: <FormattedMessage id="task-update-failed" defaultMessage="Task status update failed!" />,
          message: error.message,
          level: 'error'
        })
      )
  }

  caseUpdated() {
    this.props.notifications.addNotification({
      message: <FormattedMessage id="case-updated" defaultMessage="Case updated!" />,
      level: 'success'
    });
    this.fetchTxDetails(false);
  }

  caseUpdateFailure(error) {
    this.props.notifications.addNotification({
      title: <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!" />,
      message: error.message,
      level: 'error'
    });
  }

  onForceClose() {
    this.changeTxStatus("CLOSED_IN_ERROR")
  }

  onReopen() {
    this.changeTxStatus("ACTIVE")
  }

  sendEvent(value, trigger_type, extra) {
    this.setState({ sending: true });
    fetch_post(
      `/api/v01/transactions/${this.state.tx.id}/events`,
      {
        key: trigger_type,
        value: value,
        ...extra,
      },
      this.props.auth_token
    )
      .then(() => {
        this.caseUpdated();
        setTimeout(() => this.setState({ sending: false }), RELOAD_TX);
      })
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  updateContext(key, value) {
    this.setState({ sending: true });
    fetch_put(
      `/api/v01/transactions/${this.state.tx.id}/context`,
      {
        key: key,
        value: value,
      },
      this.props.auth_token
    )
      .then(() => {
        this.caseUpdated();
        setTimeout(() => this.setState({ sending: false }), RELOAD_TX);
      })
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  onApproveHold(proposed_due_date) {
    this.setState({ sending: true });
    fetch_put(
      `/api/v01/voo/np_requests/${this.state.tx.original_request_id}`,
      {
        due_date: proposed_due_date
      },
      this.props.auth_token
    )
      .then(() => this.updateContext("hold", "approved"))
      .catch(error => {
        this.caseUpdateFailure(error);
        this.setState({ sending: false });
      });
  }

  onCancel() {
    this.sendEvent('', 'API.cancel');
  }

  onAbort() {
    this.sendEvent('', 'API.abort');
  }

  onEdit() {
    this.setState({ edit_request: true })
  }

  actionList() {
    const { tx, request } = this.state;

    const is_active = tx.status === 'ACTIVE';
    const edited = this.state.edit_request === true;
    const is_portin = request && request.kind === 'PortIn';
    const is_portout = request && request.kind === 'PortOut';
    const fnp_exec_sent = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Set accepted' && t.status === 'OK') !== -1;

    let can_edit = false; // is_active && !is_portout;
    if (can_edit && is_portin) {
      const fnp_request_sent = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send FNPRequest' && t.status === 'OK') !== -1;
      const fnp_accept_recv = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send InDueDate' || t.cell_id === 'Set accepted') !== -1;

      can_edit = !fnp_exec_sent && (!fnp_request_sent || fnp_accept_recv);
    }
    const can_close = is_active;
    const can_reopen = !is_active;
    const can_cancel = is_active && is_portin && !fnp_exec_sent;
    const can_abort = is_active && is_portin && fnp_exec_sent;

    return (
      <ButtonGroup vertical block>
        {can_edit && <Button onClick={() => this.onEdit()} disabled={edited}><FormattedMessage id="edit" defaultMessage="Edit" /></Button>}
        {can_close && <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>}
        {can_reopen && <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>}
        {can_cancel && <Button onClick={() => this.onCancel()}><FormattedMessage id="trigger-cancel" defaultMessage="Trigger cancel" /></Button>}
        {can_abort && <Button onClick={() => this.onAbort()}><FormattedMessage id="trigger-abort" defaultMessage="Trigger abort" /></Button>}
      </ButtonGroup>
    )
  }

  render() {
    const { sending, error, tx, request, activeTab, manualActions, events, logs, replaying } = this.state;
    let alerts = [];
    error && alerts.push(
      <Alert bsStyle="danger" key='fail-fetch-tx'>
        <p>{error.message}</p>
      </Alert>
    );
    if (!tx && error) {
      return <div>{alerts.map(e => e)}</div>
    } else if (!tx) {
      return <div><FormattedMessage id='loading' defaultMessage='Loading...' /></div>
    }

    let actions_required = [];
    // add a user profile check to see if the user *can* approve/reject/hold
    const can_act = isAllowed(this.props.user_info.ui_profile, pages.requests_nprequests, access_levels.modify);

    if (tx.context.find(c => c.key === "donor_approval" && c.value === "waiting") !== undefined) {
      actions_required.push(<Alert bsStyle="warning">
        <FormattedMessage id="request-need-approval" defaultMessage="This request need your approval" />
        {can_act &&
        <ButtonToolbar>
          <Button bsSize="xsmall" onClick={() => this.sendEvent('donor_approval', 'API.accept')} disabled={sending}>
            <FormattedMessage id="approve" defaultMessage="approve" />
          </Button>
          <Button bsSize="xsmall" onClick={() => this.setState({ showRejectReason: true })} disabled={sending}>
            <FormattedMessage id="reject" defaultMessage="reject" />
          </Button>
        </ButtonToolbar>
        }
        <RejectionReason
          show={this.state.showRejectReason}
          onHide={() => this.setState({ showRejectReason: undefined })}
          onSubmit={this.sendEvent}
          tx={tx}
          {...this.props} />
      </Alert>);
    }
    if (tx.context.find(c => c.key === "manual_rfs" && (c.value === "waiting" || c.value === "nonrfs")) !== undefined) {
      actions_required.push(
        <Alert bsStyle="warning">
          <FormattedMessage id="manual-rfs" defaultMessage="Manual RFS" />
          <ButtonToolbar>
            <Button bsSize="xsmall" onClick={() => this.sendEvent('', 'API.recipient.rfs')} disabled={!can_act || sending}><FormattedMessage id="rfs" defaultMessage="RFS" /></Button>
          </ButtonToolbar>
        </Alert>);
    }

    return (
      <div>
        {alerts}
        <Row>
          {can_act && tx.status === 'ACTIVE' && actions_required.map((a, i) => <div key={i}>{a}</div>)}
        </Row>
        <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({ activeTab: e })} id="np-request-tabs">
          <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
            <Col xs={12} sm={6} md={8} lg={8}>
              <RequestTable
                request={request}
                edit_mode={this.state.edit_request === true}
                onEditEnd={() => {
                  this.setState({ edit_request: false });
                  this.fetchTxDetails(false);
                }}
                {...this.props} />
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              {can_act &&
              <Panel>
                <Panel.Heading>
                  <Panel.Title><FormattedMessage id="actions" defaultMessage="Actions" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  {this.actionList()}
                </Panel.Body>
              </Panel>
              }
              <Panel header="Context">
                <ContextTable context={tx.context} />
              </Panel>
            </Col>
            <Col xs={12} sm={12} md={12} lg={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title><FormattedMessage id="comments" defaultMessage="Comments" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Comments req_id={tx.id} {...this.props} />
                </Panel.Body>
              </Panel>
            </Col>
          </Tab>
          <Tab
            eventKey={2}
            title={
              <div>
                <FormattedMessage id="workflow" defaultMessage="Workflow" /> <Badge>{tx.errors.length}</Badge>
              </div>
            }>
            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="summary" defaultMessage="Summary" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TxTable tx={tx} />
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TransactionFlow definition={tx.definition} states={tx.tasks} />
                <TasksTable
                  tasks={tx.tasks}
                  definition={tx.definition}
                  onReplay={this.onReplay}
                  user_can_replay={can_act && tx.status === 'ACTIVE'}
                  tx_id={tx.id}
                />
              </Panel.Body>
            </Panel>

            <Panel bsStyle="danger">
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="errors" defaultMessage="Errors" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <Errors errors={tx.errors} user_info={this.props.user_info} />
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <Events events={events} logs={logs} />
              </Panel.Body>
            </Panel>
          </Tab>
        </Tabs>
      </div>)
  }
}