import React, {useState, useEffect, Component, useRef} from "react";
import ReactDOM from "react-dom";
import Button from 'react-bootstrap/lib/Button';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Table, {tbody, th, tr} from 'react-bootstrap/lib/Table';
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
import {
  NotificationsManager,
  fetch_get,
  fetch_post,
  fetch_put,
  parseJSON,
  userLocalizeUtcDate
} from "../../utils";
import Panel from "react-bootstrap/lib/Panel";
import {access_levels, isAllowed, localUser, pages} from "../../utils/user";
import {
  Comments,
  Errors,
  Events,
  ReplayingSubInstancesModal,
  TasksTable,
  TransactionFlow,
  TxTable,
  pp_output, ManualActions, triggerManualAction, Attachments,
} from "../../requests/requests";
import {ContextTable, SubTransactionsPanel} from "../../requests/components";
import moment from 'moment';
import {fetchActivities} from "../../orchestration/activity-editor";
import {ManualActionInputForm} from "../../dashboard/manualActions";
import Select from "react-select";
import {fetchUpdateContext} from "../../requests/utils";
import DatePicker from "react-datepicker";

export const rejection_codes = [
  { id: "??", summary: "..." },
];

function newRequest(request, onSuccess, onError) {
    const subscriber_data = [
      'lastname',
      'companyname',
      'housenr',
      'housenrext',
      'postcode',
      'customerid',
      'contract',
      'note',
    ]
      .filter(k => request.subscriber_data[k] !== undefined && request.subscriber_data[k] !== "")
      .reduce((p, o) => { p[o] = request.subscriber_data[o]; return p; }, {});

    fetch_post(
      '/api/v01/npact/np_requests/port_in',
      {
        crdc_id: request.crdc_id,
        ranges: request.ranges,
        service_type: request.service_type,
        sub_type: request.sub_type,
        zip_code: request.zip_code,
        house_number: request.house_number,
        contact_email: request.contact_email,
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
}

const RangeInput = ({ ranges, onChange, multipleRanges }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th><FormattedMessage id="from" defaultMessage="From" /></th>
          <th><FormattedMessage id="to" defaultMessage="To" /></th>
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
                {multipleRanges && (
                  <td>
                    <Button onClick={() => {
                      onChange(update(ranges, {$splice: [[index, 1]]}));
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
                  onChange(update(ranges, { $push: [{ from: '', to: '' }] }))
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

function newPortID() {
  const d = new Date();
  let seconds = Math.round(d.getTime() / 1000);
  let r = `WECO-${seconds}`;
  while (r.length-5 < 11) {
    r += String(Math.floor(Math.random()*10));
  }
  return r
}

const emptyRequest = {
  crdc_id: newPortID(),
  complexityClass: 'Simple',
  ranges: [{ from: '', to: '' }],
  customer_type: 'Residential',
  dueDate: null,
  zip_code: '',
  house_number: '',
  street: '',
  isB2B: false,
  sub_type: 'GEOGRAPHIC',
  service_type: 'FIXED',
  subscriber_data: {
    // lastname
    // companyname
    // housenr
    // housenrext
    // postcode
    // customerid
    contract: "EARLY_TERMINATION",
    // note
  },
}

export function NPPortInRequest() {
  const [request, setRequest] = useState(emptyRequest);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rangeError, setRangeError] = useState(undefined);

  useEffect(() => {
    document.title = "New port-in request";
    setRequest(update(request, {$merge: {crdc_id: newPortID()}}));
  }, []);

  const validRanges = request.ranges.length === 1 && request.ranges[0].from === '' && request.ranges[0].to === '' ? null : validateRanges(request.ranges).length === 0 && rangeError === undefined ? "success" : "error";
  const validPortID = /WECO-[0-9ABD-Z][0-9A-Z]{0,11}/.test(request.crdc_id)?null:"error";
  const validHouseNr = request.house_number.length > 0?"success":null;
  const validPostcode = /[0-9]{4}[A-Z]{2}/.test(request.zip_code)?"success":null;
  const validForm = validateRanges(request.ranges).length === 0 && validPortID !== "error" && validHouseNr === "success" && validPostcode === "success";

  return (
    <Panel>
        <Panel.Heading>
          <Panel.Title><FormattedMessage id="port-in-request" defaultMessage="Port-in request" /></Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <Form horizontal>
            <FormGroup validationState={validPortID}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="port-id" defaultMessage="Port ID" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.crdc_id}
                  onChange={e => setRequest(update(request, {
                    $merge: {crdc_id: e.target.value}
                  }))}
                />
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

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="service-type" defaultMessage="Service type" />
              </Col>

              <Col sm={9}>
                <FormControl
                  componentClass="select"
                  value={request.service_type}
                  onChange={e =>
                    setRequest(update(request, { $merge: {service_type: e.target.value} }))
                  }>
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
                  <option value="OTHER">OTHER</option>
                </FormControl>
              </Col>
            </FormGroup>

            <hr />

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="lastname" defaultMessage="Lastname" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.lastname}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            lastname: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="companyname" defaultMessage="Companyname" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.companyname}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            companyname: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup validationState={validHouseNr}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="housenr" defaultMessage="House nr.*" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.housenr}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      house_number: e.target.value,
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            housenr: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="housenrext" defaultMessage="House nr. ext." />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.housenrext}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            housenrext: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup validationState={validPostcode}>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="postcode" defaultMessage="post code*" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.postcode}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      zip_code: e.target.value,
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            postcode: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="customerid" defaultMessage="Customer ID" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.customerid}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            customerid: e.target.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="contact-email" defaultMessage="Contact email" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.contact_email}
                  onChange={e => setRequest(update(request, {
                    $merge: {contact_email: e.target.value}
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="contract" defaultMessage="Contract" />
              </Col>

              <Col sm={9}>
                <Select
                  value={{value: request.subscriber_data.contract, label: request.subscriber_data.contract}}
                  options={["EARLY_TERMINATION", "CONTINUATION"].map(e => ({value: e, label: e}))}
                  onChange={(v) => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            contract: v.value
                          }
                        })
                    }
                  }))}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="note" defaultMessage="Note" />
              </Col>

              <Col sm={9}>
                <FormControl type="text" value={request.subscriber_data.note}
                  onChange={e => setRequest(update(request, {
                    $merge: {
                      subscriber_data:
                        update(request.subscriber_data, {
                          $merge: {
                            note: e.target.value
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

class RequestTable extends Component {
  constructor(props) {
    super(props);
    this.cancelLoad = false;
    this.state = {
      operators: undefined,
      diff_req: {},
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
    fetch_put(`/api/v01/voo/np_requests/${this.props.request.id}`, diff_req)
      .then(parseJSON)
      .then(data => {
        this.setState({ request_crdc: data.event_sent, saving: false });
        if (data.request_crdc) {
          NotificationsManager.success(
            <FormattedMessage id="request-updated-with-crdc" defaultMessage="Update request sent to CRDC!" />,
          )
        } else {
          NotificationsManager.success(
            <FormattedMessage id="request-updated" defaultMessage="Request updated!" />,
          )
        }
        this.onClose();
      })
      .catch(error => {
          this.setState({ saving: false });
          NotificationsManager.error(
            <FormattedMessage id="request-update-failed" defaultMessage="Request update failed!" />,
            error.message,
          );
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
            <tr><th><FormattedMessage id="final-status" defaultMessage="Status" /></th><td>{req.status}</td></tr>
            <tr><th><FormattedMessage id="port-id" defaultMessage="Port ID" /></th><td>{req.crdc_id}</td></tr>
            <tr><th><FormattedMessage id="duedate" defaultMessage="Due date" /></th><td>{req.due_date && localUser.localizeUtcDate(moment.utc(req.due_date)).format()}</td></tr>
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
            <tr><th><FormattedMessage id="service-type" defaultMessage="Service type" /></th><td>{req.service_type}</td></tr>
            <tr><th><FormattedMessage id="sub-type" defaultMessage="Sub type" /></th><td>{req.sub_type}</td></tr>
            <tr><th><FormattedMessage id="zip-code" defaultMessage="Postal code" /></th><td>{req.zip_code}</td></tr>
            <tr><th><FormattedMessage id="house-nr" defaultMessage="House nr." /></th><td>{req.house_number}</td></tr>
            <tr><th><FormattedMessage id="contact-email" defaultMessage="Contact email" /></th><td>{req.contact_email}</td></tr>
            <tr><th><FormattedMessage id="created" defaultMessage="Created" /></th><td>{req.created_on?userLocalizeUtcDate(moment.utc(req.created_on)).format():""}</td></tr>
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

function CancelModal({show, onHide}) {
  const [note, setNote] = useState("");

  return (
    <Modal show={show} onHide={() => onHide(null)} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title><FormattedMessage id="cancel-port" defaultMessage="Cancel" /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reason" defaultMessage="Reason" />
            </Col>

            <Col sm={9}>
              <FormControl
                componentClass="input"
                value={note}
                placeholder={"optional"}
                onChange={e => setNote(e.target.value) } >
              </FormControl>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onHide(note)} bsStyle="primary">
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

function ApprovalModal({show, onHide, onSubmit}) {
  const [fpd, setFPD] = useState(null);

  useEffect(() => setFPD(moment.utc().add(1, "days")), [show]);

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title><FormattedMessage id="approve-title" defaultMessage="Approve" /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="first-possible-date" defaultMessage="First possible date" />
            </Col>

            <Col sm={9}>
              <DatePicker
                className="form-control"
                selected={fpd ? localUser.localizeUtcDate(moment.utc(fpd)).toDate() : null}
                onChange={d => setFPD(d)}
                dateFormat="yyyy-MM-dd" />
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => {onSubmit(fpd.toISOString()); onHide();}} bsStyle="primary">
          <FormattedMessage id="approve" defaultMessage="Approve" />
        </Button>
        <Button onClick={() => onHide()}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
      </Modal.Footer>
    </Modal>
  );
}

function DelayModal({show, onHide, onSubmit}) {
  const [fpd, setFPD] = useState(null);

  useEffect(() => setFPD(moment.utc().add(1, "days")), [show]);

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Header closeButton>
        <Modal.Title><FormattedMessage id="delay-title" defaultMessage="Delay" /></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="first-possible-date" defaultMessage="First possible date" />
            </Col>

            <Col sm={9}>
              <DatePicker
                className="form-control"
                selected={fpd ? localUser.localizeUtcDate(moment.utc(fpd)).toDate() : null}
                onChange={d => setFPD(d)}
                dateFormat="yyyy-MM-dd" />
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => {onSubmit(fpd.toISOString()); onHide();}} bsStyle="primary">
          <FormattedMessage id="delay" defaultMessage="Delay" />
        </Button>
        <Button onClick={() => onHide()}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
      </Modal.Footer>
    </Modal>
  );
}

function RejectionModal({show, onHide, onSubmit}) {
  const [rej, setRej] = useState("");

  useEffect(() => setRej(""), [show]);

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
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
                componentClass="input"
                placeholder="optional"
                value={rej}
                onChange={e => setRej(e.target.value)} >
              </FormControl>
            </Col>
          </FormGroup>

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => {onSubmit(rej); onHide();}} bsStyle="primary">
          <FormattedMessage id="reject" defaultMessage="Reject" />
        </Button>
        <Button onClick={() => onHide()}><FormattedMessage id="cancel" defaultMessage="Cancel" /></Button>
      </Modal.Footer>
    </Modal>
  );
}


export function SyncMessagesFlow({data, getEndpoint, getSource, userInfo}) {
  const vSpacing = 30;
  const [boundingRect, setBoundingRect] = useState(
    {
        height: 250,
        width: 800,
    }
  );
  const chartRef = useRef(null);

  useEffect(
    () => {
      const boundingRect_ = chartRef.current?ReactDOM.findDOMNode(chartRef.current).getBoundingClientRect():null;

      if(boundingRect_ && boundingRect_.width !== boundingRect.width) {
          setBoundingRect(boundingRect_);
      }
    });

  const endpoints = Array.from(new Set(["APIO", ...data.map(getEndpoint).filter(n => n !== "APIO"), ...data.map(getSource).filter(n => n !== "APIO")]))
  const flowWidth = boundingRect.width - 260;
  const endpointsHSpacing = flowWidth / Math.max(endpoints.length - 1, 1);
  const messageWidth = m => {
    return Math.max(endpoints.indexOf(getEndpoint(m)), 0) * endpointsHSpacing;
  }
  const sourceX = m => {
    return Math.max(endpoints.indexOf(getSource ? getSource(m) : ""), 0) * endpointsHSpacing;
  }
  const vLineHeight = (data.length + 2) * vSpacing;

  return (
    <svg className="flow" width="100%" height={vLineHeight+15} ref={chartRef}>
      <marker id="end" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M0,-5L10,0L0,5"/>
      </marker>
      <g transform="translate(200,10)">

        <g transform="translate(0,30)">
          {
            data.map(
              (d, i) =>
                <line
                  key={`message_line_${i}`}
                  x1={sourceX(d)}
                  x2={messageWidth(d)}
                  y1={vSpacing * (i+1)}
                  y2={vSpacing * (i+1)}
                  stroke={
                    d.type === "request"?"blue":
                      d.type === "event"?"orange":
                        d.status >= 400 && d.type === "response" ? "red":
                          "green"
                  }
                  markerEnd={`url(#end)`}
                  className="path"
                />
            )
          }
        </g>
        <g transform="translate(0,30)">
          {
            data.map(
              (d, i) => (
                <text
                  key={`data-text-${i}`}
                  textAnchor="middle"
                  x={Math.min(messageWidth(d), sourceX(d)) + Math.abs(messageWidth(d) - sourceX(d)) / 2}
                  y={(vSpacing * (i+1)) - 10}
                  fill="#1f77b4"
                  fillOpacity={1}
                  className="message-label">
                  {String(d.summary).substring(0, 40) + (String(d.summary).length > 40?"...":"")}
                </text>
              )
            )
          }
        </g>
        <g transform="translate(0,30)">
          {
            data.map(
              (d, i) =>
                <text
                  key={`timeline_${i}`}
                  textAnchor="end"
                  x="-10"
                  y={vSpacing * (i+1)}
                  fillOpacity={1}
                  className="timestamp">
                  {userLocalizeUtcDate(moment.utc(d.created_on), userInfo).format()}
                </text>
            )
          }
          {
            data.map(
              (d, i) =>
                <line
                  key={`message_o_line_${i}`}
                  x1={0}
                  x2={flowWidth}
                  y1={vSpacing * (i+1)}
                  y2={vSpacing * (i+1)}
                  stroke="black"
                  strokeOpacity="0.05"
                />
            )
          }
        </g>
        <g>
          {
            endpoints.map(
              (e, i) =>
                <line
                  key={`endpoint_line_${i}`}
                  x1={endpointsHSpacing * i}
                  x2={endpointsHSpacing * i}
                  y1={15}
                  y2={vLineHeight}
                  stroke="black"
                />
            )
          }

          {
            endpoints.map(
              (e, i) =>
                <text
                  key={`endpoint_text_${i}`}
                  textAnchor="middle"
                  x={endpointsHSpacing * i}
                  y={10}
                  fill="black"
                  fillOpacity={1}
                >{e}</text>
            )
          }
        </g>
      </g>
    </svg>
  )
}

function SyncMessagesDetails({data}) {
  return (
    <Table>
      <thead>
      <tr>
        <th><FormattedMessage id="time" defaultMessage="Time" /></th>
        <th><FormattedMessage id="protocol" defaultMessage="Protocol" /></th>
        <th><FormattedMessage id="type" defaultMessage="Type" /></th>
        <th><FormattedMessage id="id" defaultMessage="Id" /></th>
        <th><FormattedMessage id="content" defaultMessage="Content" /></th>
      </tr>
      </thead>
      <tbody>
      {
        data.map(
          (d, i) =>
            <tr key={`sync_msg_${i}`}>
              <td>{localUser.localizeUtcDate(moment.utc(d.created_on)).format()}</td>
              <td>{d.protocol}</td>
              <td>{d.type}</td>
              <td>{d.id}</td>
              <td>
                <pre style={{wordWrap: 'break-word', whiteSpace: 'pre-wrap'}}>
                    {pp_output(d.protocol, d.raw)}
                </pre>
              </td>
            </tr>
        )
      }
      </tbody>
    </Table>
  )
}


function CoinMessages({messages, userInfo}) {
  const entity = "COIN";
  const [seeDetails, setSeeDetails] = useState(false);
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

      if(i && i.event) {
        l.push({
          id: `${m.processing_trace_id}-01`,
          endpoint: "APIO",
          source: i.peer,
          type: "event",
          created_on: m.created_on,
          summary: `${i.event.summary}`,
          raw: i.event.raw,
          protocol: i.protocol || "",
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
          endpoint: entity,
          source: (seeDetails && i && i.host)?i.host:"APIO",
          summary: i && i.body ? i.body.url : "-",
          type: "request",
          created_on: m.created_on,
          raw: o.request
        });
      }
      if(o.response) {
        l.push({
          id: `${m.processing_trace_id}-01`,
          endpoint: (seeDetails && i && i.host)?i.host:"APIO",
          source: entity,
          summary: o.status,
          type: "response",
          created_on: m.created_on,
          status: m.status === 200 ? o.status : m.status, ...o.response
        });
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
            getSource={m => m.source ? m.source.toUpperCase() : m.endpoint === "APIO" ? entity : "APIO"}
            userInfo={userInfo}
          />
        </Row>
        <Row style={{ textAlign: "center" }}>
          <Checkbox checked={seeDetails} onChange={e => setSeeDetails(e.target.checked)}>
            <i>See details</i>
          </Checkbox>
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
      messageShown: true,
      activities: [],
      showCancel: false,
    };
    this.cancelLoad = false;

    this.onReplay = this.onReplay.bind(this);
    this.onRollback = this.onRollback.bind(this);
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

  fetchTxDetails(reload) {
    this.setState({ error: undefined });
    const txId = this.props.match.params.txId;
    fetch_get(`/api/v01/transactions/${this.props.match.params.txId}`)
      .then(data => {
        if (this.cancelLoad)
          return;

        const diffState = { tx: data };
        if(!this.state.tx && data.callback_task_id) {
          diffState.activeTab = 2;
        }
        this.setState(diffState);

        document.title = `Instance ${txId}`;

        data.original_request_id && fetch_get(`/api/v01/npact/np_requests/${data.original_request_id}`)
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
          case 404: error_msg = "Unknown transaction."; break;
          case 403: error_msg = "You are not allowed to see this transaction."; break;
          default: error_msg = `Unknown error: ${error.response.status}`;
        }
        this.setState({ error: new Error(error_msg) })
      });
  }

  componentDidMount() {
    this.fetchTxDetails(true);
    fetchActivities(a => this.setState({activities: a}))
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
      if(prevState.tx !== undefined && prevProps.match.params.txId !== this.props.match.params.txId) {
          document.title = `Instance - ${this.props.match.params.txId}`;
          this.setState({
              activeTab: 1,
              tx: undefined,
              request: undefined,
              logs: [],
              events: [],
              externalCallbacks: [],
              manualActions: [],
              messages: [],
              showCance: false,
          });
          this.fetchTxDetails(false);
      }
  }

  onReplay(activity_id, task_id) {
    this.setState({replaying: true});

    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}`, {})
        .then(() => {
            !this.cancelLoad && this.setState({replaying: false});
            this.fetchTxDetails(false);

            NotificationsManager.success(
              <FormattedMessage id="task-replayed" defaultMessage="Task replayed!"/>,
            );
        })
        .catch(error => {
            !this.cancelLoad && this.setState({replaying: false});
            NotificationsManager.error(
                <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!"/>,
                error.message,
            );
        })
  }

  onRollback(activity_id, task_id, replay_behaviour) {
    const meta = JSON.stringify({replay_behaviour: replay_behaviour});

    this.setState({replaying: true});

    fetch_put(`/api/v01/transactions/${activity_id}/tasks/${task_id}?meta=${meta}`, {})
      .then(() => {
        !this.cancelLoad && this.setState({replaying: false});
        this.fetchTxDetails(false);

        NotificationsManager.success(
          <FormattedMessage id="rollback-triggered" defaultMessage="{action} triggered!"
                            values={{action: replay_behaviour}}/>,
        );
      })
      .catch(error => {
        !this.cancelLoad && this.setState({replaying: false});
        NotificationsManager.error(
          <FormattedMessage id="rollback-failed" defaultMessage="{action} failed!" values={{action: replay_behaviour}}/>,
          error.message
        );
      });
  }

  changeTxStatus(new_status) {
    fetch_put(`/api/v01/transactions/${this.state.tx.id}`, { status: new_status })
      .then(() => {
        this.fetchTxDetails(false);
        NotificationsManager.success(
          <FormattedMessage id="task-status-changed" defaultMessage="Task status updated!" />,
        );
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="task-update-failed" defaultMessage="Task status update failed!" />,
        error.message,
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
      error.message,
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
      }
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

  // updateContext(key, value) {
  //   this.setState({ sending: true });
  //   fetch_put(
  //     `/api/v01/transactions/${this.state.tx.id}/context`,
  //     {
  //       key: key,
  //       value: value,
  //     }
  //   )
  //     .then(() => {
  //       this.caseUpdated();
  //       setTimeout(() => this.setState({ sending: false }), RELOAD_TX);
  //     })
  //     .catch(error => {
  //       this.caseUpdateFailure(error);
  //       this.setState({ sending: false });
  //     });
  // }

  onApproveHold(proposed_due_date) {
    this.setState({ sending: true });
    fetch_put(
      `/api/v01/voo/np_requests/${this.state.tx.original_request_id}`,
      {
        due_date: proposed_due_date
      }
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

  actionList() {
    const { tx, request } = this.state;

    const is_active = tx.status === 'ACTIVE';
    const is_portin = request && request.kind === 'PortIn';
    // const is_portout = request && request.kind === 'PortOut';
    const due_date_waiting = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'wait for due date' && t.status === 'WAIT') !== -1;
    const activation_waiting = is_portin && tx.tasks && tx.tasks.findIndex(t => t.cell_id === 'wait for activation' && t.status === 'WAIT') !== -1;

    const can_close = is_active;
    const can_reopen = !is_active;
    const can_cancel = is_active && is_portin && (due_date_waiting || activation_waiting);
    const can_activate = is_active && is_portin && activation_waiting;

    return (
      <ButtonGroup vertical block>
        {can_close && <Button onClick={() => this.onForceClose()}><FormattedMessage id="force-close" defaultMessage="Force close" /></Button>}
        {can_reopen && <Button onClick={() => this.onReopen()}><FormattedMessage id="reopen" defaultMessage="Reopen" /></Button>}
        {can_cancel && <Button onClick={() => this.setState({showCancel: true})}><FormattedMessage id="trigger-cancel" defaultMessage="Trigger cancel" /></Button>}
        {can_activate && <Button onClick={() => this.sendEvent('', 'API.activate')}><FormattedMessage id="trigger-activate" defaultMessage="Trigger activate" /></Button>}
      </ButtonGroup>
    )
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

  render() {
    const { sending, error, tx, request, activeTab, events, logs, replaying, messages, messageShown, activities, manualActions, showActionForm, showCancel } = this.state;
    const { user_info } = this.props;
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

    if(tx && tx.status === 'ACTIVE' && manualActions.length !== 0) {
      manualActions
        .filter(a => !a.output && user_info.roles.find(ur => ur.id === a.role_id))
        .filter(a => a.description !== "Approve the port")
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

    if (manualActions.find(a => !a.output && user_info.roles.find(ur => ur.id === a.role_id) && a.description === "Approve the port") !== undefined) {
      actions_required.push(<Alert bsStyle="warning">
        <FormattedMessage id="request-need-approval" defaultMessage="This request need your approval" />
        {can_act &&
        <ButtonToolbar>
          {/* this.sendEvent('donor_approval', 'API.accept') */}
          <Button bsSize="xsmall" onClick={() => this.setState({ showApproval: true })} disabled={sending}>
            <FormattedMessage id="approve" defaultMessage="approve" />
          </Button>
          <Button bsSize="xsmall" onClick={() => this.setState({ showRejectReason: true })} disabled={sending}>
            <FormattedMessage id="reject" defaultMessage="reject" />
          </Button>
          <Button bsSize="xsmall" onClick={() => this.setState({ showDelay: true })} disabled={sending}>
            <FormattedMessage id="reject" defaultMessage="delay" />
          </Button>
        </ButtonToolbar>
        }
        <RejectionModal
          show={this.state.showRejectReason}
          onHide={() => this.setState({ showRejectReason: false })}
          onSubmit={note => {
            this.sendEvent(JSON.stringify({"reason": note}), 'API.reject')
          }} />
        <ApprovalModal
          show={this.state.showApproval}
          onHide={() => this.setState({ showApproval: false })}
          onSubmit={firstPossibleDate => {
            this.sendEvent(JSON.stringify({"firstpossibledate": firstPossibleDate}), 'API.approve')
          }} />
        <DelayModal
          show={this.state.showDelay}
          onHide={() => this.setState({ showDelay: false })}
          onSubmit={firstPossibleDate => {
            this.sendEvent('donor_approval', 'API.delay', JSON.stringify({"firstpossibledate": firstPossibleDate}))
          }} />
      </Alert>);
    }

    return (
      <div>
        {alerts}
        <ReplayingSubInstancesModal show={replaying}/>
        <CancelModal show={showCancel} onHide={note => {
          this.setState({showCancel: false});
          if (note !== null) {
            fetchUpdateContext(tx.id, "cancel_note", note,
              () => this.sendEvent(JSON.stringify({ note: note }), 'API.cancel')
            );
          }
        }}/>
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
                  <Panel.Title><FormattedMessage id="attachments" defaultMessage="Attachments" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                  <Attachments txId={tx.id} userInfo={user_info}/>
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
                <TransactionFlow definition={tx.definition} states={tx.tasks} />
                <TasksTable
                  tasks={tx.tasks}
                  definition={JSON.parse(tx.definition)}
                  onReplay={this.onReplay}
                  onRollback={this.onRollback}
                  user_can_replay={can_act && tx.status === 'ACTIVE'}
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
                    <CoinMessages
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

            <Panel>
              <Panel.Heading>
                <Panel.Title><FormattedMessage id="events" defaultMessage="Events" /></Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <Events events={events} logs={logs} userInfo={user_info}/>
              </Panel.Body>
            </Panel>
          </Tab>
        </Tabs>
      </div>)
  }
}
