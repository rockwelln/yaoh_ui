import React, {useState, useEffect, Component} from "react";
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import Form from 'react-bootstrap/lib/Form';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import {Link, Redirect} from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import update from 'immutability-helper';
import { fetchOperators } from "../data/operator_mgm";
import { fetchRoutes } from "../data/routing_info_mgm";
import {
  NotificationsManager,
  fetch_get,
  fetch_post,
  parseJSON,
  fetch_put,
  API_URL_PREFIX,
  userLocalizeUtcDate
} from "../../utils";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import DatePicker from 'react-datepicker';
import Modal from "react-bootstrap/lib/Modal";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Popover from "react-bootstrap/lib/Popover";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import Alert from "react-bootstrap/lib/Alert";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {
  Attachments,
  Comments,
  Errors, Events, ManualActions, ReplayingSubInstancesModal, SavingModal,
  TasksTable,
  TransactionFlow,
  triggerManualAction,
  TxTable
} from "../../requests/requests";
import {access_levels, isAllowed, pages} from "../../utils/user";
import Row from "react-bootstrap/lib/Row";
import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Badge from "react-bootstrap/lib/Badge";
import {StaticControl} from "../../utils/common";
import {SyncMessagesDetails, SyncMessagesFlow} from "./citc-sa";
import moment from "moment";
import {ManualActionInputForm} from "../../dashboard/manualActions";
import {ContextTable} from "../../requests/components";
import {SubTransactionsPanel} from "../../requests/components";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {LinkContainer} from "react-router-bootstrap";
import {fetchActivities} from "../../orchestration/activity-editor";

// export const DEFAULT_RECIPIENT = "MTNBSGNP";
export const rejection_codes = [];
// const RECIPIENTS = [
//   DEFAULT_RECIPIENT,
// ];



function updateRequest(requestId, diffEntry, onSuccess) {
  fetch_put(`/api/v01/npact/np_requests/${requestId}`, diffEntry)
    .then(data => onSuccess())
    .catch(error => NotificationsManager.error("Failed to update request", error.message));
}

function updateRequestRange(requestId, rangeId, diffEntry, onSuccess) {
  fetch_put(`/api/v01/npact/np_requests/${requestId}/ranges/${rangeId}`, diffEntry)
    .then(data => onSuccess())
    .catch(error => NotificationsManager.error("Failed to update range", error.message));
}

function newRequest(request, onSuccess, onError) {
  fetch_post(
    '/api/v01/npact/np_requests/port_in',
    {
      crdc_id: request.crdc_id || undefined,
      ranges: request.ranges,
      recipient_id: request.recipient,
      service_type: request.service_type,
      port_req_form_id: request.port_req_form_id,
      routing_info: request.routing_info,
      subscriber_data: request.subscriber_data,
      due_date: request.due_date,
      change_addr_installation_porting_id: request.change_addr_installation_porting_id,
      label: request.label,
      contact_email: request.contact_email,
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
      if(error.message === "duplicate request still running") {
        NotificationsManager.error(
          <FormattedMessage id="create-portin-duplicated" defaultMessage="Duplicate port-in"/>,
          <Link to={`/transactions/${error.body?.id}`}>{error.body?.crdc_id}</Link>
        );
      } else {
        NotificationsManager.error(
          <FormattedMessage id="create-portin-failed" defaultMessage="Failed to start port-in"/>,
          error.message
        );
      }
      onError && onError();
    });
}

export function RangeOrNumbersInput({ ranges, onChange, multipleRanges }) {
  const rangeNumbers = (r) => {
    if(r.to.length <= 0) return 1;
    const t = parseInt(r.to, 10);
    const f = parseInt(r.from, 10);
    if (f > t) {
      return "invalid";
    }
    return t - f +1;
  }
  return (
    <>
      <Table>
        <thead>
        <tr>
          <th><FormattedMessage id="from" defaultMessage="From"/></th>
          <th><FormattedMessage id="to" defaultMessage="To"/></th>
          <th/>
          <th/>
        </tr>
        </thead>
        <tbody>
        {
          ranges.map((range, index) => {
            return (
              <tr key={index}>
                <td>
                  <FormControl value={range.from}
                               onChange={e => (
                                 (e.target.value === "" || /^\d+$/.test(e.target.value)) && onChange(update(ranges,
                                   {[index]: {$merge: {from: e.target.value}}}
                                 )))
                               }/>
                </td>
                <td>
                  <FormControl disabled={ranges.length > 1}
                               value={range.to}
                               onChange={e => (
                                 (e.target.value === "" || /^\d+$/.test(e.target.value)) && onChange(update(ranges,
                                   {[index]: {$merge: {to: e.target.value}}}
                                 )))
                               }/>
                </td>
                <td>
                  {
                    range.from.length > 0 && <FormattedMessage id="numbers" defaultMessage="{n} numbers" values={{n: rangeNumbers(range)}}/>
                  }
                </td>
                {multipleRanges && ranges.length > 1 && (
                  <td>
                    <Button
                      onClick={() => {
                      onChange(update(ranges,
                        {$splice: [[index, 1]]}
                      ))
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
                disabled={ranges.length > 0 && ranges[0].to.length > 0 && ranges[0].from !== ranges[0].to}
                onClick={() =>
                  onChange(update(ranges, {$push: [{from: '', to: '', data_number: '', fax_number: ''}]}))
                }>
                +
              </Button>
            </td>
          </tr>
        )}
        </tbody>
      </Table>
      <HelpBlock>
        <FormattedMessage
          id="range-one-number-note"
          defaultMessage="CRDB accepts a set of numbers or a *single* number range."/>
      </HelpBlock>
    </>
  )
}

function validateRanges(ranges) {
  return ranges.map((r, index) => {
    if (r.from.length === 0) return index;
    if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
    if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
    return null;
  }).filter(e => e !== null);
}

function generateNewPortId(prefix="", suffix="") {
  const now = (new Date()).toISOString().slice(0,19).replace(/-/g,"").replace(/T/g,"").replace(/:/g,"")
  return `${prefix}${now}MTNBSGNP${suffix}${Math.floor(Math.random()*10000)}`
}

const emptyRequest = {
  ranges: [{ from: '', to: '' }],
  donor: '',
  change_addr_installation_porting_id: '',
  isB2B: false,
  crdc_id: generateNewPortId(),
  service_type: 'GEOGRAPHIC',
  routing_info: '',
  subscriber_data: {
    AccountType: "GNPAccount",
    AccountNum: "",
    ProcessType: "Individual",
  },
  due_date: moment.utc().add(1, "days").toISOString(),
}

export function NPPortInRequest({userInfo, defaultRecipient}) {
  const [operators, setOperators] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [request, setRequest] = useState(emptyRequest);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rangeError, setRangeError] = useState(undefined);

  useEffect(() => {
    document.title = "New port-in";
    fetchOperators(null, setOperators);
    fetchRoutes(setRoutes);
  }, []);
  useEffect(() => {
    const o = operators && operators.find(o => o.name === defaultRecipient);
    if (o) {
      setRequest(r => update(r, { $merge: { recipient: o.id, donor: o.id } }))
    }
  }, [operators]);

  const validRanges = request.ranges.length === 1 && request.ranges[0].from === '' && request.ranges[0].to === '' ? "error" : validateRanges(request.ranges).length === 0 && rangeError === undefined ? "success" : "error";
  const validRecipient = request.recipient !== null && request.recipient !== undefined && request.recipient !== "" ? "success" : null;
  const validAccountNum = request.subscriber_data.AccountPayType === "PostPaid" && (request.subscriber_data.AccountNum === undefined || request.subscriber_data.AccountNum.length === 0 || request.subscriber_data.AccountNum.length > 20) ? "error" : null;
  const validManagedPerson = request.subscriber_data.ProcessType === "Individual" || (request.subscriber_data.ProcessType === "Managed" && request.subscriber_data.ManagedContactPerson !== undefined && request.subscriber_data.ManagedContactPerson.length !== 0) ? "success" : "error";
  const validManagedPhone = request.subscriber_data.ProcessType === "Individual" || (request.subscriber_data.ProcessType === "Managed" && request.subscriber_data.ManagedContactPhone !== undefined && request.subscriber_data.ManagedContactPhone.length !== 0) ? "success" : "error";

  const validAccountRegNum = (
    (request.subscriber_data.AccountID !== undefined && request.subscriber_data.AccountID.length !== 0) ||
    (request.subscriber_data.RegNum !== undefined && request.subscriber_data.RegNum.length !== 0)
  );

  const validForm = (
    validateRanges(request.ranges).length === 0 &&
    validRecipient === "success" &&
    request.routing_info !== "" &&
    request.due_date && request.due_date !== "" &&
    validAccountNum === null &&
    validManagedPerson !== "error" &&
    validManagedPhone !== "error" &&
    validAccountRegNum
  );
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
          <FormattedMessage id="port-id" defaultMessage="Port ID" />
        </Col>

        <Col sm={9}>
          <FormControl
            type="text"
            value={request.crdc_id}
            onChange={e => setRequest(update(request, { $merge: { crdc_id: e.target.value } }))} />
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
          <RangeOrNumbersInput
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
              operators.filter(o => o.short_name === defaultRecipient).map(o => <option key={o.id} value={o.id}>{o.name}</option>)
            }
          </FormControl>
        </Col>
      </FormGroup>

      <FormGroup validationState={request.routing_info !== ""?"success":"error"}>
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


      <FormGroup validationState={request.due_date && request.due_date !== "" ? "success" : null}>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="port-date-time" defaultMessage="Port date time" />{"*"}
        </Col>

        <Col sm={9}>
          <DatePicker
            className="form-control"
            selected={request.due_date ? userLocalizeUtcDate(moment.utc(request.due_date), userInfo).toDate() : null}
            onChange={d => {
              setRequest(update(request, {$merge: { due_date: d.toISOString() }}));
            }}
            dateFormat="yyyy-MM-dd HH:mm"
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={60} />
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

      <FormGroup validationState={validAccountRegNum?null:"error"}>
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
          <FormGroup validationState={validAccountRegNum?null:"error"}>
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
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="label-tenant-id" defaultMessage="Label (tenant id)" />
        </Col>

        <Col sm={9}>
          <FormControl
            type="text"
            value={request.label}
            onChange={e => setRequest(update(request, {
              $merge: {label: e.target.value || undefined}
            }))}
          />
        </Col>
      </FormGroup>

      <FormGroup>
        <Col componentClass={ControlLabel} sm={2}>
          <FormattedMessage id="contact-email" defaultMessage="Contact email" />
        </Col>

        <Col sm={9}>
          <FormControl
            type="text"
            value={request.contact_email}
            onChange={e => setRequest(update(request, {
              $merge: {contact_email: e.target.value || undefined}
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
  {"id": "SP003", "summary": "For a postpaid subscriber, the MSISDN, account number, and account holder id number do not match."},
  {"id": "SP004", "summary": "The classification of the account does not match."},
  {"id": "SP005", "summary": "Subscriber in suspension of outgoing or incoming calls due to failure to pay a bill"},
  {"id": "SP006", "summary": "MSISDN or DN/DN Range not valid on SP."},
  {"id": "SP007", "summary": "MSISDN, Account Number, Corporate Registration Number do not match, or Port Request is unauthorized."},
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
  {"id": "SP026", "summary": "Installation address is outside the geographic area associated with the DNs/DN Ranges specified in the request."},
  {"id": "SP027", "summary": "DN Range is not exclusively used by the operator requesting the port."},
  {"id": "SP028", "summary": "DN(s) or DN Range are excluded from porting under Regulation 3."},
  {"id": "SP029", "summary": "Account Number is not the account number used by the donor operator for the DN(s) or DN Range for which porting is requested."},
];

const errorCodes = [...rejectionReasonCodes, ...abortReasonCodes];


function CancelPortRequest(props) {
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


function AbortPortRequest(props) {
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


function disabledAction(action, output, request) {
  if(!request) {
    return true;
  }
  switch (action.description) {
    case "Plan port":
      return !request.due_date || request.due_date.length === 0;
    default:
      return false;
  }
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

function RequestTable(props) {
  const {onChangeRequest, onChangeRange, actions, request, events, userInfo} = props;
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
  const subscriberData = request.subscriber_data? update(request.subscriber_data, {$merge: diffSubscriberData}): {};

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
                        r.reject_code ?
                          <td style={{ color: "red" }}>
                            <OverlayTrigger
                              trigger="hover"
                              placement="right"
                              overlay={
                                <Popover id="popover-error-code-desc" title={r.reject_code}>
                                  <p>{errorCodes.find(e => e.id === r.reject_code) && errorCodes.find(e => e.id === r.reject_code).summary}</p>
                                </Popover>
                              }>
                              <p>{r.reject_code}</p>
                            </OverlayTrigger>
                          </td> : <td/>
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
                      selected={req.due_date ? userLocalizeUtcDate(moment.utc(req.due_date), userInfo).toDate() : null}
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
              <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td colSpan={rangeNbCols}>{userLocalizeUtcDate(moment.utc(req.created_on), userInfo).format()}</td></tr>
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
              <tr><th><FormattedMessage id="external-id" defaultMessage="External id" /></th><td colSpan={rangeNbCols}>{req.external_id}</td></tr>
              <tr><th><FormattedMessage id="label" defaultMessage="Label" /></th><td colSpan={rangeNbCols}>{req.label}</td></tr>
              <tr><th><FormattedMessage id="contact-email" defaultMessage="Contact email" /></th><td colSpan={rangeNbCols}>{req.contact_email}</td></tr>
            </tbody>
          </Table>
        </Panel.Body>
      </Panel>
  )
}


class RejectionReason extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onClose = this.onClose.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    this.props.onSubmit(JSON.stringify({ reason: this.state.rej }), 'API.reject');
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
    document.title = "New Disconnect"
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
    const {defaultRecipient} = this.props;
    fetch_post(
      '/api/v01/npact/np_requests/disconnect',
      {
        donor_id: parseInt(donor.id, 10),
        recipient_id: operators.filter(o => o.short_name === defaultRecipient)[0].id,
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

    fetch_get(url)
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
                <RangeOrNumbersInput
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


function CrdbMessages(props) {
  const {messages, userInfo} = props;
  const [seeDetails, setSeeDetails] = useState(false);
  let errors = [];
  let listOfMessages = messages
    .sort((a, b) => a.processing_trace_id - b.processing_trace_id)
    .reduce((l, m) => {
      var o, i;
      try {
        o = JSON.parse(m.output || "{}");
      } catch (e) {
        // console.error("failed to parse m.output: ", e, m.output);
        o = {"message": m.output};
      }
      try {
        i = m.input ? JSON.parse(m.input) : null;
      } catch (e) {
        console.error("failed to parse m.input: ", e, m.input);
        i = null;
      }
      const matchMessage = /<NPCMessages>\s*<([^>]*)>/gm.exec(o.request);
      const matchMessageID = /<MessageID>(\d+)<\/MessageID>/gm.exec(o.request);

      const message = matchMessage?matchMessage[1]:"-";
      const messageID = matchMessageID?matchMessageID[1]:"-";

      if(i && i.event) {
        const matchMessageID = /MessageID>(\d+)&/gm.exec(i.event.raw);
        const messageID = matchMessageID?matchMessageID[1]:"-";

        l.push({
          id: `${m.processing_trace_id}-01`,
          endpoint: "APIO",
          source: i.peer,
          type: "event",
          created_on: m.created_on,
          summary: `${i.event.summary} (${messageID})`,
          raw: i.event.raw,
          protocol: i.protocol || "",
          // ...i.event
        });
      }

      if((!o.response || seeDetails) && i && i.method && i.url) {
        l.push({
          id: `${m.processing_trace_id}-01`,
          endpoint: i.host || "?",
          source: "APIO",
          type: "call",
          created_on: m.created_on,
          summary: `${i.method.toUpperCase()} ${i.url}`,
          protocol: "HTTP",
          raw: m.input,
        });
        l.push({
          id: `${m.processing_trace_id}-02`,
          endpoint: "APIO",
          source: i.host || "?",
          type: "response",
          created_on: m.created_on,
          summary: m.status,
          protocol: "HTTP",
          raw: m.output,
        });
      }
      if(o.request) {
        l.push({
          id: `${m.processing_trace_id}-00`,
          endpoint: "CRDB",
          source: (seeDetails && i && i.host)?i.host:"APIO",
          summary: `${message} (${messageID})`,
          type: "request",
          created_on: m.created_on,
          protocol: "SOAP",
          raw: o.request
        });
      }
      if(o.response) {
        l.push({
          id: `${m.processing_trace_id}-01`,
          endpoint: (seeDetails && i && i.host)?i.host:"APIO",
          source: "CRDB",
          summary: o.status,
          type: "response",
          created_on: m.created_on,
          status: m.status === 200 ? o.status : m.status,
          raw: o.response,
          ...o.response
        });
      }
      if(o.errors) {
        errors.push(...o.errors)
      }
      if(o.error) {
        errors.push(o.error)
      }
      return l;
    }, [])
    ;

  return (
    <Tabs defaultActiveKey={1} id="syn-messages-flow">
      <Tab eventKey={1} title={<FormattedMessage id="flows" defaultMessage="Flows" />}>
        <Row>
          <SyncMessagesFlow
            data={listOfMessages}
            getEndpoint={m => m.endpoint.toUpperCase()}
            getSource={m => m.source ? m.source.toUpperCase() : m.endpoint === "APIO" ? "CRDB" : "APIO"}
            userInfo={userInfo}
          />
        </Row>
        <Row style={{ textAlign: "center" }}>
          <Checkbox checked={seeDetails} onChange={e => setSeeDetails(e.target.checked)}>
            <i>See details</i>
          </Checkbox>
        </Row>
        <Row style={{ textAlign: "center" }}>
          {errors.map((e, i) => <Alert bsStyle="danger">{e}</Alert>)}
        </Row>
      </Tab>
      <Tab eventKey={2} title={<FormattedMessage id="messages" defaultMessage="Messages" />}>
        <SyncMessagesDetails data={listOfMessages} userInfo={userInfo} />
      </Tab>
    </Tabs>
  )
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
      messages: [],
      showCancel: false,
      showAbort: false,
      messageShown: true,
      activities: [],
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
    this.refreshMessages = this.refreshMessages.bind(this);
  }

  fetchTxDetails(reload, onSuccess, onError) {
    this.setState({ error: undefined });
    const txId = this.props.match.params.txId;
    fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`)
      .then(data => {
        if (this.cancelLoad) {
          onSuccess && onSuccess();
          return;
        }

        const diffState = { tx: data };
        if(!this.state.tx && data.callback_task_id) {
          diffState.activeTab = 2;
        }
        this.setState(diffState);

        !data.callback_task_id && fetch_get(`/api/v01/npact/np_requests/${data.original_request_id}`)
          .then(data => {
            !this.cancelLoad && this.setState({ request: data });
            document.title = `Request ${data.crdc_id}`;
          })
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

        this.refreshMessages();

        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX);
        onSuccess && onSuccess();
      })
      .catch(error => {
        onError && onError();
        if (this.cancelLoad)
          return;
        let error_msg = undefined;
        reload && setTimeout(() => this.fetchTxDetails(true), RELOAD_TX / 2);
        if (error.response === undefined) {
          this.setState({ error: error });
          return
        }
        switch (error.response.status) {
          case 404: error_msg = "Unknown transaction."; break;
          case 403: error_msg = "You are not allowed to see this transaction."; break;
          default: error_msg = `Unknown error: ${error.response.status}`;
        }
        this.setState({ error: new Error(error_msg) });
      });
  }

  componentDidMount() {
    this.fetchTxDetails(true);
    fetchActivities(a => this.setState({activities: a}));
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(prevState.tx !== undefined && prevProps.match.params.txId !== this.props.match.params.txId) {
      this.setState({
        activeTab: 1,
        tx: undefined,
        request: undefined,
        logs: [],
        events: [],
        externalCallbacks: [],
        manualActions: [],
        messages: [],
      });
      this.fetchTxDetails(false);
    }
  }

  onReplay(activity_id, task_id) {
    this.setState({replaying: true});
    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {})
      .then(() => {
        !this.cancelLoad && this.setState({replaying: false});
        NotificationsManager.success(
          <FormattedMessage id="task-replayed" defaultMessage="Task replayed!" />,
        )
      })
      .catch(error => {
        !this.cancelLoad && this.setState({replaying: false});
        NotificationsManager.error(
          <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!" />,
          error.message
        )
      })
  }

  onRollback(activity_id, task_id, replay_behaviour) {
    this.setState({replaying: true});
    const meta = JSON.stringify({replay_behaviour: replay_behaviour});
    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}?meta=${meta}`, {})
      .then(() => {
        !this.cancelLoad && this.setState({replaying: false});
        this.fetchTxDetails(false);
        NotificationsManager.success(
          <FormattedMessage id="rollback-triggered" defaultMessage="{action} triggered!" values={{action: replay_behaviour}}/>,
        );
      })
      .catch(error => {
        !this.cancelLoad && this.setState({replaying: false});
        NotificationsManager.error(
          <FormattedMessage id="rollback-failed" defaultMessage="{action} failed!" values={{action: replay_behaviour}}/>,
          error.message
        );
      })
  }

  changeTxStatus(new_status) {
    fetch_put(`/api/v01/transactions/${this.state.tx.id}`, { status: new_status }, this.props.auth_token)
      .then(() => {
        this.fetchTxDetails(false);
        NotificationsManager.success(
          <FormattedMessage id="task-status-changed" defaultMessage="Task status updated!" />,
        );
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="task-update-failed" defaultMessage="Task status update failed!" />,
        error.message
      ))
  }

  caseUpdated() {
    NotificationsManager.success(
      <FormattedMessage id="case-updated" defaultMessage="Case updated!" />,
    );
    this.fetchTxDetails(false);
  }

  caseUpdateFailure(error) {
    NotificationsManager.error(
      <FormattedMessage id="case-update-failure" defaultMessage="Case update failure!" />,
      error.message
    );
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
      `/api/v01/npact/np_requests/${this.state.tx.original_request_id}`,
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

  onEdit() {
    this.setState({ edit_request: true })
  }

  refreshMessages() {
    fetch_get(`/api/v01/transactions/${this.state.tx.id}/traces?details=1`)
      .then(data => {
        const missing_messages = data.traces.filter(
          t => this.state.messages.findIndex(m => m.processing_trace_id === t.processing_trace_id) === -1
        );

        !this.cancelLoad && this.setState({
          messages: update(
            this.state.messages, {
              '$push': missing_messages,
            })
        });
      })
      .catch(error => console.error(error));
  }

  actionList() {
    const { tx, request } = this.state;

    const is_active = tx.status === 'ACTIVE';
    const edited = this.state.edit_request === true;
    const is_portin = request && request.kind === 'PortIn';
    // const is_portout = request && request.kind === 'PortOut';
    const fnp_exec_sent = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Set accepted' && t.status === 'OK') !== -1;
    const port_notification = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Port Notification' && t.status === 'OK') !== -1;
    const port_activated = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Port activated' && t.status === 'OK') !== -1;

    let can_edit = false; // is_active && !is_portout;
    if (can_edit && is_portin) {
      const fnp_request_sent = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send FNPRequest' && t.status === 'OK') !== -1;
      const fnp_accept_recv = tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'Send InDueDate' || t.cell_id === 'Set accepted') !== -1;

      can_edit = !fnp_exec_sent && (!fnp_request_sent || fnp_accept_recv);
    }
    const can_close = is_active;
    const can_reopen = !is_active;
    // condition for voo: const can_cancel = is_active && is_portin && !fnp_exec_sent;
    const can_cancel = is_active && is_portin && port_notification && !port_activated;
    const can_abort = is_portin && port_activated;

    return (
      <ButtonGroup vertical block>
        {can_edit && <Button onClick={() => this.onEdit()} disabled={edited}><FormattedMessage id="edit" defaultMessage="Edit" /></Button>}
        {can_close && <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>}
        {can_reopen && <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>}
        {can_cancel && <Button onClick={() => this.setState({showCancel: true})}><FormattedMessage id="trigger-cancel" defaultMessage="Trigger cancel" /></Button>}
        {can_abort && <Button onClick={() => this.setState({showAbort: true})}><FormattedMessage id="trigger-abort" defaultMessage="Trigger abort" /></Button>}
      </ButtonGroup>
    )
  }

  render() {
    const { sending, error, tx, request, activeTab, manualActions, events, logs, replaying, messages, messageShown, showActionForm, activities } = this.state;
    const {user_info} = this.props;
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

    if (tx && tx.status === 'ACTIVE' && manualActions.length !== 0) {
      manualActions
          .filter(a => !a.output && user_info.roles.find(ur => ur.id === a.role_id))
          .map(a => alerts.push(
              <Alert bsStyle="warning" key={`request-action-${a.id}`}>
                  Action required for {user_info.roles.find(ur => ur.id === a.role_id).name}<br/>
                  {a.description} <br/>
                  <ButtonToolbar>
                      {
                      a.possible_outputs.split(",").map(o => (
                          <Button
                              onClick={
                                  () => {
                                      !a.input_form ?
                                        triggerManualAction(tx.id, a.id, o, undefined, () => this.fetchTxDetails(false)) :
                                        this.setState({showActionForm: [a, o]})
                                  }}>
                              {o}
                          </Button>
                      ))
                      }
                  </ButtonToolbar>
                  <ManualActionInputForm
                      show={showActionForm !== undefined}
                      action={showActionForm ? showActionForm[0]: {}}
                      output={showActionForm && showActionForm[1]}
                      onHide={() => this.setState({showActionForm: undefined})}
                      onTrigger={(a, output, values) => {
                          triggerManualAction(tx.id, a.id, output, values, () => {
                              this.setState({showActionForm: undefined});
                              this.fetchTxDetails(false);
                          })
                      }}
                      />
              </Alert>
          ))
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
      <>
        <Breadcrumb>
          <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
          <LinkContainer to={`/transactions/list`}>
            <Breadcrumb.Item><FormattedMessage id="apio-requests" defaultMessage="Ports"/></Breadcrumb.Item>
          </LinkContainer>
          {
            tx.super_instance_chain && tx.super_instance_chain.map(sup_i => (
              <LinkContainer to={`/transactions/${sup_i.id}`} key={`sup-${sup_i.id}`}>
                <Breadcrumb.Item>{sup_i.id}</Breadcrumb.Item>
              </LinkContainer>
            ))
          }
          <Breadcrumb.Item active>{(request && request.crdc_id) ? request.crdc_id : tx.id}</Breadcrumb.Item>
        </Breadcrumb>
        {alerts}
        <Row>
          {can_act && tx.status === 'ACTIVE' && actions_required.map((a, i) => <div key={i}>{a}</div>)}
        </Row>
        <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => this.setState({ activeTab: e })} id="np-request-tabs">
          <Tab eventKey={1} title={<FormattedMessage id="request" defaultMessage="Request" />}>
            <Col xs={12} sm={6} md={8} lg={8}>
              <RequestTable
                request={request}
                actions={manualActions}
                events={events}
                onChangeRequest={r => {
                  this.setState({sending: true})
                  updateRequest(request.id, r, () => this.fetchTxDetails(false, () => this.setState({sending: false}), () => this.setState({sending: false})));
                }}
                onChangeRange={(range_id, r) => {
                  updateRequestRange(request.id, range_id, r, () => this.fetchTxDetails(false));
                }}
                userInfo={user_info}
              />

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
                  <Panel.Title><FormattedMessage id="attachments" defaultMessage="Attachments" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Attachments txId={tx.id}/>
                </Panel.Body>
              </Panel>
            </Col>
            <Col xs={12} sm={12} md={12} lg={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title><FormattedMessage id="comments" defaultMessage="Comments" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Comments req_id={tx.id} userInfo={user_info} />
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
                <TxTable tx={tx} request={request} userInfo={user_info} activities={activities}/>
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="tasks" defaultMessage="Tasks" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TransactionFlow definition={tx.definition} states={tx.tasks} activityId={tx.activity_id} />
                <TasksTable
                  tasks={tx.tasks}
                  definition={JSON.parse(tx.definition)}
                  onReplay={this.onReplay}
                  onRollback={this.onRollback}
                  user_can_replay={can_act && tx.status === 'ACTIVE' && !replaying}
                  tx_id={tx.id}
                  userInfo={user_info}
                />
              </Panel.Body>
            </Panel>

            {
              messages.length !== 0 && (
                <Panel
                  expanded={messageShown}
                  onToggle={e => {
                    this.setState({messageShown: e});
                    e && this.refreshMessages();
                  }}
                >
                  <Panel.Heading>
                    <Panel.Title toggle>
                      <FormattedMessage id="messages" defaultMessage="Messages"/>
                    </Panel.Title>
                  </Panel.Heading>
                  <Panel.Body collapsible>
                    <CrdbMessages
                      messages={messages}
                      userInfo={user_info}
                    />
                  </Panel.Body>
                </Panel>
              )
            }

            <SubTransactionsPanel
              txId={tx.id}
              tasks={tx.tasks}
              onReplay={() => {
                this.setState({replaying: true});
                return () => this.setState({replaying: false});
              }}
            />

            {tx.errors && tx.errors.length !== 0 &&
              <Panel bsStyle="danger">
                <Panel.Heading>
                  <Panel.Title><FormattedMessage id="errors" defaultMessage="Errors"/></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Errors errors={tx.errors} user_info={this.props.user_info}/>
                </Panel.Body>
              </Panel>
            }

            {
                manualActions.length !== 0 && (
                    <Panel defaultExpanded={false}>
                        <Panel.Heading>
                            <Panel.Title toggle><FormattedMessage id="manual-actions" defaultMessage="Manual actions" /></Panel.Title>
                        </Panel.Heading>
                        <Panel.Body collapsible>
                            <ManualActions actions={manualActions} tasks={tx.tasks}/>
                        </Panel.Body>
                    </Panel>
                )
            }

            {
              (events.length !== 0 || logs.length !== 0) && (
                <Panel defaultExpanded={false}>
                  <Panel.Heading>
                    <Panel.Title toggle><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
                  </Panel.Heading>
                  <Panel.Body collapsible>
                    <Events events={events} logs={logs} userInfo={user_info} />
                  </Panel.Body>
                </Panel>
              )
            }

          </Tab>
        </Tabs>

        <CancelPortRequest
          show={this.state.showCancel}
          ranges={(request && request.ranges) || []}
          instanceId={tx && tx.id}
          onHide={r => {
            this.setState({showCancel: false});
            r && this.fetchTxDetails(false);
          }} />

        <AbortPortRequest
          show={this.state.showAbort}
          ranges={(request && request.ranges) || []}
          instanceId={tx && tx.id}
          onHide={r => {
            this.setState({showAbort: false});
            r && this.fetchTxDetails(false);
          }} />

        <ReplayingSubInstancesModal show={replaying}/>
        <SavingModal show={sending}/>

      </>)
  }
}