import React, {useState, useEffect} from "react";
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
import { fetchRoutes } from "../data/routing_info_mgm";
import { RangeInput } from "../utils";
import {NotificationsManager, fetch_get, fetch_post, parseJSON} from "../../utils";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import DatePicker from 'react-datepicker';
import Modal from "react-bootstrap/lib/Modal";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Popover from "react-bootstrap/lib/Popover";

export const DEFAULT_RECIPIENT = "MTNBSGNP";
export const rejection_codes = [];
const RECIPIENTS = [
  DEFAULT_RECIPIENT,
];


function newRequest(request, onSuccess, onError) {
  fetch_post(
    '/api/v01/voo/np_requests/port_in',
    {
      ranges: request.ranges,
      recipient_id: request.recipient,
      service_type: request.service_type,
      port_req_form_id: request.port_req_form_id,
      routing_info: request.routing_info,
      subscriber_data: request.subscriber_data,
      change_addr_installation_porting_id: request.change_addr_installation_porting_id,
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
  change_addr_installation_porting_id: '',
  isB2B: false,
  service_type: 'GEOGRAPHIC',
  routing_info: '',
  subscriber_data: {
    AccountType: "GNPAccount",
    AccountNum: "",
    ProcessType: "Individual",
  },
}

export function NPPortInRequest(props) {
  const [operators, setOperators] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [request, setRequest] = useState(emptyRequest);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rangeError, setRangeError] = useState(undefined);

  useEffect(() => {
    fetchOperators(null, setOperators);
    fetchRoutes(setRoutes);
  }, []);
  useEffect(() => {
    const o = operators && operators.find(o => o.name === DEFAULT_RECIPIENT);
    if (o) {
      setRequest(r => update(r, { $merge: { recipient: o.id, donor: o.id } }))
    }
  }, [operators]);

  const validRanges = request.ranges.length === 1 && request.ranges[0].from === '' && request.ranges[0].to === '' ? null : validateRanges(request.ranges).length === 0 && rangeError === undefined ? "success" : "error";
  const validRecipient = request.recipient !== null && request.recipient !== undefined && request.recipient !== "" ? "success" : null;
  const validAccountNum = request.subscriber_data.AccountPayType === "PostPaid" && (request.subscriber_data.AccountNum === undefined || request.subscriber_data.AccountNum.length === 0 || request.subscriber_data.AccountNum.length > 20) ? "error" : null;
  const validManagedPerson = request.subscriber_data.ProcessType === "Individual" || (request.subscriber_data.ProcessType === "Managed" && request.subscriber_data.ManagedContactPerson !== undefined && request.subscriber_data.ManagedContactPerson.length !== 0) ? "success" : "error";
  const validManagedPhone = request.subscriber_data.ProcessType === "Individual" || (request.subscriber_data.ProcessType === "Managed" && request.subscriber_data.ManagedContactPhone !== undefined && request.subscriber_data.ManagedContactPhone.length !== 0) ? "success" : "error";

  const validForm = (
    validateRanges(request.ranges).length === 0 &&
    validRecipient === "success" &&
    request.routing_info != "" &&
    request.subscriber_data.AccountNum.length !== 0 &&
    validManagedPerson !== "error" &&
    validManagedPhone !== "error" &&
    (
      (request.subscriber_data.AccountID !== undefined && request.subscriber_data.AccountID.length !== 0) ||
      (request.subscriber_data.RegNum !== undefined && request.subscriber_data.RegNum.length !== 0)
    )
  );
  console.log("subs", request);
  return (
    <Form horizontal>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="service-type" defaultMessage="Service type" />{"*"}
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
                      ProcessType: e.target.value === "MOBILE" ? undefined : "Managed",
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

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="ChgInstallAddrTransID" defaultMessage="Change installation addr. port ID" />
        </Col>

        <Col sm={9}>
          <FormControl
            type="text"
            value={request.change_addr_installation_porting_id}
            onChange={e => setRequest(update(request, { $merge: { change_addr_installation_porting_id: e.target.value } }))} />
        </Col>
      </FormGroup>

      <FormGroup validationState={validRanges}>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="ranges" defaultMessage="Ranges" />{"*"}
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
          <FormattedMessage id="recipient" defaultMessage="Recipient" />{"*"}
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
          <FormattedMessage id="route" defaultMessage="Route" />{"*"}
        </Col>

        <Col sm={9}>
          <FormControl
            componentClass="select"
            value={request.routing_info}
            onChange={e => setRequest(update(request, { $merge: { routing_info: e.target.value } }))}>
            <option value=""></option>
            {
              routes.filter(r => r.operator_id === request.recipient).map(o => <option key={o.routing_id} value={o.routing_id}>{o.routing_info}</option>)
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

      <FormGroup validationState={validAccountNum}>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="account-number" defaultMessage="Account number" />
          {"*"}
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

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="process-type" defaultMessage="Process type" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={request.subscriber_data.ProcessType}
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
                <option value="Managed">managed</option>
                <option value="Individual">individual</option>
              </FormControl>
            </Col>
          </FormGroup>

          {
            request.subscriber_data.ProcessType === "Managed" &&
            <>
              <FormGroup validationState={validManagedPerson}>
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
              <FormGroup validationState={validManagedPhone}>
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


function cancelPort(instanceId, ranges, reasonCode, onSuccess) {
  fetch_post(
      `/api/v01/transactions/${instanceId}/events`,
      {
        key: 'API.cancel',
        value: JSON.stringify({reason_code: reasonCode, ranges: ranges}),
      }
    )
      .then(() => onSuccess && onSuccess())
      .catch(error => NotificationsManager.error("Failed to cancel request", error.message));
}


function abortPort(instanceId, ranges, reasonCode, onSuccess) {
  fetch_post(
      `/api/v01/transactions/${instanceId}/events`,
      {
        key: 'API.abort',
        value: JSON.stringify({reason_code: reasonCode, ranges: ranges}),
      }
    )
      .then(() => onSuccess && onSuccess())
      .catch(error => NotificationsManager.error("Failed to abort request", error.message));
}


const cancelReasonCodes = [
  {"id": "SP001", "summary": "The MSISDN or DN/DN Range is not valid on the donor operator network."},
  {"id": "SP002", "summary": "The MSISDN or DN/DN Range is excluded from number portability."},
  {"id": "SP004", "summary": "The classification of the account does not match."},
  {"id": "SP005", "summary": "Subscriber in suspension of outgoing or incoming calls due to failure to pay a bill"},
  {"id": "SP006", "summary": "MSISDN or DN/DN Range not valid on SP."},
  {"id": "SP008", "summary": "Port Request is for an inter-SP port; for this NO, inter-SP ports are handled outside the CRDB."},
  {"id": "SP009", "summary": "Other reasons."},
];

const abortReasonCodes = [
  {"id": "SP009", "summary": "Other reasons."},
  {"id": "SP010", "summary": "Porting back."},
  {"id": "SP011", "summary": "Malicious."},
  {"id": "SP012", "summary": "Fraudulent."},
  {"id": "SP013", "summary": "Ported in error."},
];

const rejectionReasonCodes = [
  ...cancelReasonCodes,
  {"id": "SP027", "summary": "DN Range is not exclusively used by the operator requesting the port."},
  {"id": "SP028", "summary": "DN(s) or DN Range are excluded from porting under Regulation 3."},
  {"id": "SP029", "summary": "Account Number is not the account number used by the donor operator for the DN(s) or DN Range for which porting is requested."},
];

export function CancelPortRequest(props) {
  const {show, onHide, instanceId, ranges} = props;
  const [reasonCode, setReasonCode] = useState("");
  const [cancelledRanges, setCancelledRanges] = useState([]);

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title><FormattedMessage id="cancel" defaultMessage="Cancel" /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Select the ranges for which the porting process needs to be cancelled.
        </p>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="ranges-to-cancel" defaultMessage="Ranges to cancel" />
            </Col>

            <Col sm={9}>
              <Table condensed>
                <thead>
                  <tr>
                    <th>Range</th>
                    <th><Checkbox checked={cancelledRanges.length === ranges.length} onChange={e => {
                      if(e.target.checked) {
                        setCancelledRanges(ranges.map(r => r.range_from));
                      } else {
                        setCancelledRanges([]);
                      }
                    }} >all/none</Checkbox></th>
                  </tr>
                </thead>
                <tbody>
                {
                  ranges.map((r, i) => (
                    <tr key={`${i}-${r.range_from}`}>
                      <td>{r.range_from} {' - '} {r.range_to}</td>
                      <td>
                        <Checkbox checked={cancelledRanges.includes(r.range_from)} onChange={e => {
                          if(e.target.checked) {
                            setCancelledRanges(update(cancelledRanges, {$push: [r.range_from]}));
                          } else {
                            setCancelledRanges(update(cancelledRanges, {$splice: [[cancelledRanges.findIndex(e => e === r.range_from), 1]]}));
                          }
                        }}/>
                      </td>
                    </tr>
                  ))
                }
                </tbody>
              </Table>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reason" defaultMessage="Reason" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)} >
                <option value={null} />
                {
                  cancelReasonCodes.map(r => <option key={r.id} value={r.id}>{r.id} - {r.summary}</option>)
                }
              </FormControl>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => cancelPort(instanceId, cancelledRanges, reasonCode, () => onHide(true))} bsStyle="primary" disabled={cancelledRanges.length === 0 || reasonCode.length === 0}>
          <FormattedMessage id="trigger" defaultMessage="Trigger" />
        </Button>
        <Button onClick={() => onHide(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
      </Modal.Footer>
    </Modal>
  )
}


export function AbortPortRequest(props) {
  const {show, onHide, instanceId, ranges} = props;
  const [reasonCode, setReasonCode] = useState("");
  const [abortRanges, setAbortRanges] = useState([]);

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title><FormattedMessage id="abort" defaultMessage="Abort" /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Select the ranges for which the porting process needs to be aborted (reverted).
        </p>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="ranges-to-abort" defaultMessage="Ranges to abort" />
            </Col>

            <Col sm={9}>
              <Table condensed>
                <thead>
                  <tr>
                    <th>Range</th>
                    <th><Checkbox checked={abortRanges.length === ranges.length} onChange={e => {
                      if(e.target.checked) {
                        setAbortRanges(ranges.map(r => r.range_from));
                      } else {
                        setAbortRanges([]);
                      }
                    }} >all/none</Checkbox></th>
                  </tr>
                </thead>
                <tbody>
                {
                  ranges.map((r, i) => (
                    <tr key={`${i}-${r.range_from}`}>
                      <td>{r.range_from} {' - '} {r.range_to}</td>
                      <td>
                        <Checkbox checked={abortRanges.includes(r.range_from)} onChange={e => {
                          if(e.target.checked) {
                            setAbortRanges(update(abortRanges, {$push: [r.range_from]}));
                          } else {
                            setAbortRanges(update(abortRanges, {$splice: [[abortRanges.findIndex(e => e === r.range_from), 1]]}));
                          }
                        }}/>
                      </td>
                    </tr>
                  ))
                }
                </tbody>
              </Table>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reason" defaultMessage="Reason" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="select"
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)} >
                <option value={null} />
                {
                  abortReasonCodes.map(r => <option key={r.id} value={r.id}>{r.id} - {r.summary}</option>)
                }
              </FormControl>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => abortPort(instanceId, abortRanges, reasonCode, () => onHide(true))} bsStyle="primary" disabled={abortRanges.length === 0 || reasonCode.length === 0}>
          <FormattedMessage id="trigger" defaultMessage="Trigger" />
        </Button>
        <Button onClick={() => onHide(false)}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
      </Modal.Footer>
    </Modal>
  )
}


export function disabledAction(action, output, request) {
  if(!request) {
    return true;
  }
  switch (action.description) {
    case "Plan port":
      return !request.due_date || request.due_date.length === 0;
  }
  return false;
}

function getRangeFlags(actions, ranges) {
  const canAccept = actions.find(a => a.output === null && a.description.toLowerCase() === "port-out approval") !== undefined;
  const canNotif = actions.find(a => a.output === null && a.description.toLowerCase() === "plan port") !== undefined;
  const canActivate = actions.find(a => a.output === null && a.description.toLowerCase() === "activate numbers") !== undefined;
  const canCancel = false;
  const canAcceptAddrChange = false;

  let cols = []
  if (canAccept || ranges.find(r => r.accepted !== null)){
    let col = {header: "Acc.", disabled: !canAccept, flag: "accepted"};
    if(canAccept) {
      col["rejectCodes"] = rejectionReasonCodes;
    }
    cols.push(col);
  }
  if (canNotif || ranges.find(r => r.notif_ordered !== null)) cols.push({header: "Notif. ordered", disabled: !canNotif, flag: "notif_ordered"});
  if (canActivate || ranges.find(r => r.activated !== null)) cols.push({header: "Act.", disabled: !canActivate, flag: "activated"});
  if (canCancel || ranges.find(r => r.cancelled !== null)) cols.push({header: "Can.", disabled: !canCancel, flag: "cancelled"});
  if (canAcceptAddrChange || ranges.find(r => r.change_addr_accepted !== null)) cols.push({header: "Change add. accepted", disabled: !canAcceptAddrChange, flag: "change_addr_accepted"});

  if ( ranges.find(r => r.reversed !== null)) cols.push({header: "Rev.", disabled: true, flag: "reversed"});
  if ( ranges.find(r => r.reversal_accepted !== null)) cols.push({header: "Rev. accepted", disabled: true, flag: "reversal_accepted"});
  if ( ranges.find(r => r.reversal_activated !== null)) cols.push({header: "Rev. activated", disabled: true, flag: "reversal_activated"});

  return cols;
}

export function RequestTable(props) {
  const {onChangeRequest, onChangeRange, actions, request, events} = props;
  const [operators, setOperators] = useState([]);
  const [diffSubscriberData, setDiffSubscriberData] = useState({});

  useEffect(() => {
    fetchOperators(null, setOperators);
  }, []);

  if (request === undefined || operators === undefined) {
    return <div><FormattedMessage id="loading" defaultMessage="Loading..." /></div>;
  }

  const req = request;
  const donor = operators.find(d => d.id === parseInt(req.donor_id, 10));
  const recipient = operators.find(d => d.id === parseInt(req.recipient_id, 10));
  const rangeFlags = getRangeFlags(actions, req.ranges);
  const activeFlag = rangeFlags.find(rf => !rf.disabled && rf.rejectCodes);
  // const activeRejectCodes = rangeFlags.find(rf => !rf.disabled && rf.rejectCodes) && rangeFlags.find(rf => !rf.disabled && rf.rejectCodes).rejectCodes;
  const rangeNbCols = 2 + rangeFlags.length;
  const subscriberData = update(request.subscriber_data, {$merge: diffSubscriberData});

  return (
      <Panel>
        <Panel.Body>
          <Table condensed>
            <tbody>
              <tr><th><FormattedMessage id="id" defaultMessage="ID" /></th><td colSpan={rangeNbCols}>{req.id}</td></tr>
              <tr><th><FormattedMessage id="kind" defaultMessage="Kind" /></th><td colSpan={rangeNbCols}>{req.kind}</td></tr>
              <tr><th><FormattedMessage id="status" defaultMessage="Status" /></th><td colSpan={rangeNbCols}>{req.status}</td></tr>
              <tr><th><FormattedMessage id="port-id" defaultMessage="Port ID" /></th><td colSpan={rangeNbCols}>{req.crdc_id}</td></tr>
              <tr>
                <th><FormattedMessage id="ChgInstallAddrTransID" defaultMessage="Change installation addr. port ID" /></th>
                <td colSpan={rangeNbCols}>{req.change_addr_installation_porting_id}</td>
              </tr>
              <tr><th><FormattedMessage id="ranges" defaultMessage="Ranges" /></th>
                {
                  rangeFlags.map(rf => <th key={rf.header}>{rf.header}</th>)
                }
                {
                  (req.ranges.find(r => r.reject_code) || rangeFlags.find(rf => rf.rejectCodes)) && <th>Reject Code</th>
                }
                <td>
                  <OverlayTrigger
                    trigger="click"
                    placement="right"
                    overlay={
                      <Popover id="popover-trigger-click" title="Range flags">
                        <ul>
                          <li>Acc. - Port accepted</li>
                          <li>Notif. ordered - Port notification ordered</li>
                          <li>Can. - Range cancelled</li>
                          <li>Act. - Port activated</li>
                          <li>Rev. - Port reversal requested</li>
                          <li>Rev. accepted - Port reversal accepted</li>
                          <li>Rev. activated - Port reversal activated</li>
                          <li>Change add. accepted - change address of installation accepted</li>
                        </ul>
                      </Popover>
                    }>
                    <Glyphicon glyph="question-sign"/>
                  </OverlayTrigger>
                </td>
              </tr>
              {
                req.ranges.sort((a, b) => a.id - b.id).map((r, i) => (
                  <tr key={i}><td>{r.range_from} {' - '} {r.range_to}</td>
                    {
                      rangeFlags.map(rf =>
                        <td>
                        <Checkbox style={{push: "left"}} key={`${i}-${rf.flag}`} checked={r[rf.flag]} onChange={e => onChangeRange(r.id, {[rf.flag]: e.target.checked})} disabled={rf.disabled} />
                        </td>
                      )
                    }
                    {
                      activeFlag !== undefined && activeFlag.rejectCodes !== undefined ?
                        <td>
                          <select
                            value={r.reject_code || ""}
                            style={{maxWidth: 100}}
                            onChange={e => {
                              onChangeRange(r.id, {reject_code: e.target.value, [activeFlag.flag]: e.target.value.length === 0})
                            }}
                          >
                            <option value={""}></option>
                            {
                              activeFlag.rejectCodes.map(rc => <option value={rc.id}>{rc.id} - {rc.summary}</option>)
                            }
                          </select>
                        </td>
                      :
                        r.reject_code ? <td style={{ color: "red" }}>{r.reject_code}</td> : <td/>
                    }
                    <td/>
                  </tr>
                ))
              }
              <tr><th><FormattedMessage id="donor" defaultMessage="Donor" /></th><td colSpan={rangeNbCols}>{ donor !== undefined ? donor.name : '-' }</td></tr>
              <tr><th><FormattedMessage id="recipient" defaultMessage="Recipient" /></th><td colSpan={rangeNbCols}>{recipient !== undefined ? recipient.name : '-'}</td></tr>
              <tr><th><FormattedMessage id="service-type" defaultMessage="Service type" /></th><td colSpan={rangeNbCols}>{req.service_type}</td></tr>
              <tr><th><FormattedMessage id="routing-info" defaultMessage="Routing info" /></th><td colSpan={rangeNbCols}>{req.routing_info}</td></tr>
              <tr><th><FormattedMessage id="port-req-form-id" defaultMessage="Port request form ID" /></th><td colSpan={rangeNbCols}>{req.port_req_form_id}</td></tr>
              {
                req.street && <tr><th><FormattedMessage id="address" defaultMessage="Address" /></th><td colSpan={rangeNbCols}>{req.street}</td></tr>
              }
              <tr>
                <th><FormattedMessage id="port-date-time" defaultMessage="Port date time" /></th>
                <td colSpan={rangeNbCols}>
                  { rangeFlags.find(rf => rf.flag === "notif_ordered" && !rf.disabled) ?
                    <DatePicker
                      className="form-control"
                      selected={req.due_date ? new Date(req.due_date) : null}
                      onChange={d => {
                        onChangeRequest({ due_date: d.toISOString() });
                      }}
                      dateFormat="yyyy-MM-dd HH:mm"
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={60} />
                    : req.due_date}
                </td>
              </tr>
              <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td colSpan={rangeNbCols}>{req.created_on}</td></tr>
              {
                req.subscriber_data && Object.keys(req.subscriber_data).map(d => {
                  if(d === "ProcessType" && rangeFlags.find(rf => rf.flag === "accepted" && !rf.disabled)) {
                    return (
                      <tr key={d}>
                        <th>{d}</th>
                        <td colSpan={rangeNbCols}>
                          <select
                            value={req.subscriber_data[d]}
                            onChange={e => {
                              e.target.value === "Managed" ?
                                onChangeRequest({
                                  subscriber_data: update(
                                    request.subscriber_data,
                                    {$merge: {
                                      ProcessType: e.target.value,
                                      ManagedContactPerson: request.subscriber_data.ManagedContactPerson || "",
                                      ManagedContactPhone: request.subscriber_data.ManagedContactPhone || ""
                                    }}
                                  )
                                }):
                                onChangeRequest({
                                  subscriber_data: update(request.subscriber_data,
                                    {$merge: {ProcessType: e.target.value}}
                                  )
                                });
                            }}
                          >
                            <option value="Managed">Managed</option>
                            <option value="Individual">Individual</option>
                          </select>
                          { events.find(e => e.key === "crdb.PortRequest" && !e.content.includes(req.subscriber_data[d])) &&
                            <HelpBlock>This value has been updated</HelpBlock>
                          }
                        </td>
                      </tr>
                    );
                  }
                  if(
                    (d === "ManagedContactPerson" || d === "ManagedContactPhone") && req.subscriber_data.ProcessType === "Managed" &&
                    rangeFlags.find(rf => rf.flag === "accepted" && !rf.disabled) &&
                    events.find(e => e.key === "crdb.PortRequest" && e.content.includes("Individual"))
                  ) {
                    return (
                      <tr key={d}>
                        <th>{d}</th>
                        <td colSpan={rangeNbCols}>
                          <input
                            value={subscriberData[d]}
                            onChange={e => setDiffSubscriberData(update(diffSubscriberData, {$merge: {[d]: e.target.value}}))}
                            onBlur={e => onChangeRequest({
                              subscriber_data: update(request.subscriber_data,
                                {$merge: diffSubscriberData}
                              )
                            })}
                          />
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={d}>
                      <th>{d}</th>
                      <td colSpan={rangeNbCols}>{req.subscriber_data[d]}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </Table>
        </Panel.Body>
      </Panel>
  )
}