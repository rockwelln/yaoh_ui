import React, { useState, useEffect } from "react";
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import update from 'immutability-helper';
import { fetchOperators } from "../data/operator_mgm";
import { RangeInput } from "../utils";
import { NotificationsManager, fetch_get, fetch_post, parseJSON } from "../../utils";

export const DEFAULT_RECIPIENT = "MTN";
export const rejection_codes = [];
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

    fetch_post(
      '/api/v01/voo/np_requests/port_in',
      {
        ranges: request.ranges,
        donor_id: request.donor,
        recipient_id: request.recipient,
        sub_type: request.sub_type,
        service_type: request.service_type,
        port_req_form_id: request.port_req_form_id,
        subscriber_data: request.subscriber_data,
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

function validateRanges(ranges) {
  return ranges.map((r, index) => {
    if (r.from.length === 0) return index;
    if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
    if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
    return null;
  }).filter(e => e !== null);
}

const emptyRequest = {
  ranges: [{ from: '', to: '' }],
  donor: '',
  accountNumber: '',
  isB2B: false,
  sub_type: '',
  service_type: 'MOBILE',
  subscriber_data: {},
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
      setRequest(r => update(r, { $merge: { recipient: o.id, donor: o.id } }))
    }
  }, [operators]);

  const validRanges = request.ranges.length === 1 && request.ranges[0].from === '' && request.ranges[0].to === '' ? null : validateRanges(request.ranges).length === 0 && rangeError === undefined ? "success" : "error";
  const validRecipient = request.recipient !== null && request.recipient !== undefined && request.recipient !== "" ? "success" : null;
  const validAccountNum = request.subscriber_data.AccountPayType === "PostPaid" && (request.subscriber_data.AccountNum === undefined || request.subscriber_data.AccountNum.length === 0) ? "error" : null;

  const validForm = validateRanges(request.ranges).length === 0 && validRecipient === "success";
  return (
    <Form horizontal>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="service-type" defaultMessage="Service type" />
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="select"
            value={request.service_type}
            onChange={e => {
              setRequest(
                update(request, {
                  $merge: {
                    service_type: e.target.value,
                    subscriber_data: {
                      AccountType: e.target.value === "MOBILE" ? "ConsumerAccount" : "GNPAccount",
                      ProcessType: e.target.value === "MOBILE" ? undefined : "managed",
                    }
                  }
                })
              );
            }}>
            <option value="MOBILE">MOBILE</option>
            <option value="GEOGRAPHIC">GEOGRAPHIC</option>
          </FormControl>
        </Col>
      </FormGroup>

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

      <hr />

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="account-type" defaultMessage="Account type" />
          {'*'}
        </Col>

        <Col sm={5}>
          <FormControl componentClass="select"
            value={request.subscriber_data.AccountType}
            onChange={e => (
              setRequest(update(request, {
                $merge: {
                  subscriber_data: {
                    AccountType: e.target.value
                  }
                }
              }))
            )} >
            {
              request.service_type === "MOBILE" ?
                <>
                  <option value="ConsumerAccount">Consumer</option>
                  <option value="CorporateAccount">Corporate</option>
                </> :
                <option value="GNPAccount">GNP</option>
            }

          </FormControl>
        </Col>
      </FormGroup>

      {
        request.subscriber_data.AccountType === "GNPAccount" &&
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>
            <FormattedMessage id="process-type" defaultMessage="Process type" />
          </Col>

          <Col sm={9}>
            <FormControl
              componentClass="select"
              value={request.ProcessType}
              onChange={e => setRequest(update(request, {
                $merge: {
                  subscriber_data:
                    update(request.subscriber_data, {
                      $merge: {
                        ProcessType: e.target.value,

                      }
                    })
                }
              }))} >
              <option value="managed">managed</option>
              <option value="individual">individual</option>
            </FormControl>
          </Col>
        </FormGroup>
      }

      <FormGroup validationState={validAccountNum}>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="account-number" defaultMessage="Account number" />
        </Col>

        <Col sm={9}>
          <FormControl type="text"
            value={request.subscriber_data.AccountNum}
            onChange={e => setRequest(update(request, {
              $merge: {
                subscriber_data:
                  update(request.subscriber_data, {
                    $merge: {
                      AccountNum: e.target.value
                    }
                  })
              }
            }))}
          />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="account-id" defaultMessage="Account ID" />
        </Col>

        <Col sm={9}>
          <FormControl type="text"
            value={request.subscriber_data.AccountID}
            onChange={e => setRequest(update(request, {
              $merge: {
                subscriber_data:
                  update(request.subscriber_data, {
                    $merge: {
                      AccountID: e.target.value
                    }
                  })
              }
            }))}
          />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="account-pay-type" defaultMessage="Account pay type" />
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="select"
            value={request.subscriber_data.AccountPayType || ""}
            onChange={e => setRequest(update(request, {
              $merge: {
                subscriber_data:
                  update(request.subscriber_data, {
                    $merge: {
                      AccountPayType: e.target.value
                    }
                  })
              }
            }))}
          >
            <option value=""></option>
            <option value="PrePaid">pre-paid</option>
            <option value="PostPaid">post-paid</option>
          </FormControl>
        </Col>
      </FormGroup>

      {
        request.subscriber_data.AccountType === "GNPAccount" &&
        <>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reg-num" defaultMessage="Reg. number" />
            </Col>

            <Col sm={9}>
              <FormControl type="text"
                value={request.subscriber_data.RegNum}
                onChange={e => setRequest(update(request, {
                  $merge: {
                    subscriber_data:
                      update(request.subscriber_data, {
                        $merge: {
                          RegNum: e.target.value
                        }
                      })
                  }
                }))}
              />
            </Col>
          </FormGroup>
          {
            request.subscriber_data.ProcessType === "managed" &&
            <>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="managed-contact-person" defaultMessage="Managed contact person" />
                </Col>

                <Col sm={9}>
                  <FormControl type="text"
                    value={request.subscriber_data.ManagedContactPerson}
                    onChange={e => setRequest(update(request, {
                      $merge: {
                        subscriber_data:
                          update(request.subscriber_data, {
                            $merge: {
                              ManagedContactPerson: e.target.value
                            }
                          })
                      }
                    }))}
                  />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                  <FormattedMessage id="managed-contact-phone" defaultMessage="Managed contact phone" />
                </Col>

                <Col sm={9}>
                  <FormControl type="text"
                    value={request.subscriber_data.ManagedContactPhone}
                    onChange={e => setRequest(update(request, {
                      $merge: {
                        subscriber_data:
                          update(request.subscriber_data, {
                            $merge: {
                              ManagedContactPhone: e.target.value
                            }
                          })
                      }
                    }))}
                  />
                </Col>
              </FormGroup>
            </>
          }
        </>
      }

      {
        request.subscriber_data.AccountType === "CorporateAccount" &&
        <>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="corp-reg-num" defaultMessage="Corporate reg. number" />
            </Col>

            <Col sm={9}>
              <FormControl type="text"
                value={request.subscriber_data.CorporateRegNum}
                onChange={e => setRequest(update(request, {
                  $merge: {
                    subscriber_data:
                      update(request.subscriber_data, {
                        $merge: {
                          CorporateRegNum: e.target.value
                        }
                      })
                  }
                }))}
              />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="corp-contact-person" defaultMessage="Corporate contact person" />
            </Col>

            <Col sm={9}>
              <FormControl type="text"
                value={request.subscriber_data.CorpContactPerson}
                onChange={e => setRequest(update(request, {
                  $merge: {
                    subscriber_data:
                      update(request.subscriber_data, {
                        $merge: {
                          CorpContactPerson: e.target.value
                        }
                      })
                  }
                }))}
              />
            </Col>
          </FormGroup>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="corp-contact-phone" defaultMessage="Corporate contact phone" />
            </Col>

            <Col sm={9}>
              <FormControl type="text"
                value={request.subscriber_data.CorpContactPhone}
                onChange={e => setRequest(update(request, {
                  $merge: {
                    subscriber_data:
                      update(request.subscriber_data, {
                        $merge: {
                          CorpContactPhone: e.target.value
                        }
                      })
                  }
                }))}
              />
            </Col>
          </FormGroup>
        </>
      }

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
    </Form >
  )
}