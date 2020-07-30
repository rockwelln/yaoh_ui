import React, { useState, useEffect } from "react";
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import update from 'immutability-helper';
import { fetchOperators } from "../data/operator_mgm";
import { NotificationsManager, fetch_get, fetch_post, parseJSON } from "../../utils";

export const DEFAULT_RECIPIENT = "ITC";
export const rejection_codes = [
  { id: "SP01", summary: "ID number is wrong or missing." },
];
const RECIPIENTS = [
  DEFAULT_RECIPIENT,
];


function newRequest(request, onSuccess, onError) {
  Promise.all(request.ranges.map(r => {
    return fetch_get('/api/v01/voo/number/' + r.from)
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
      '/api/v01/voo/np_requests/port_in',
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
  service_type: 'MOBILE',
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
  )
}