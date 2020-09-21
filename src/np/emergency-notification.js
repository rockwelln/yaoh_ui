import React, {useState} from "react";
import {fetch_post, NotificationsManager} from "../utils";
import Panel from "react-bootstrap/lib/Panel";
import {FormattedMessage} from "react-intl";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import Alert from "react-bootstrap/lib/Alert";
import {Redirect} from "react-router-dom";
import {LinkContainer} from "react-router-bootstrap";


function newEmergencyNotification(entry, onSuccess, onError) {
    fetch_post(
      '/api/v01/npact/np_requests/emergency',
      {subscriber_data: entry, service_type: "GEOGRAPHIC"}
    ).then(r => r.json())
      .then(r => r.id && onSuccess && onSuccess(r.id))
      .catch(error => onError && onError(error))
}


export function NPEmergencyNotificationRequest(props) {
    const [reasonCode, setReasonCode] = useState("");
    const [reasonText, setReasonText] = useState("");
    const [existingInstance, setExistingInstance] = useState(null);
    const [redirect, setRedirect] = useState(undefined);

    const validForm = reasonText.length !== 0 && reasonCode.length !== 0;

    return (
    <Panel>
      <Panel.Heading>
        <Panel.Title><FormattedMessage id="new-emergency-notification" defaultMessage="New Emergency Notification"/></Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <Form horizontal>
            {
                existingInstance &&
                  <Alert bsStyle="danger">
                      <FormattedMessage id="duplicate-instance" defaultMessage="There is already an instance running: "/>
                      <LinkContainer to={`/transactions/${existingInstance}`}>
                          <Button bsStyle="link">{existingInstance}</Button>
                      </LinkContainer>
                  </Alert>
            }

          <FormGroup validationState={reasonCode.length === 0 || reasonCode.length > 10? "error": null}>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reason-code" defaultMessage="Reason code" />
            </Col>

            <Col sm={9}>
              <FormControl
                type="text"
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)} />
            </Col>
          </FormGroup>

          <FormGroup validationState={reasonText.length === 0 || reasonText.length > 200? "error": null}>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="reason-text" defaultMessage="Reason text" />
            </Col>

            <Col sm={9}>
              <FormControl
                type="text"
                value={reasonText}
                onChange={e => setReasonText(e.target.value)} />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col smOffset={2} sm={10}>
              <Button
                onClick={() =>
                  newEmergencyNotification(
                    {reason_code:reasonCode, reason_text: reasonText},
                    setRedirect,
                    error => {
                        error.body.instance && setExistingInstance(error.body.instance);
                        NotificationsManager.error("Failed to create a new emergency notification", error.message)
                    }
                  )
                }
                disabled={!validForm}>
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