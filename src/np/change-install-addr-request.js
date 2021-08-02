import React, {useEffect, useState} from 'react';
import { fetch_post, NotificationsManager } from "../utils";
import { RangeInput } from "./utils";

import Panel from 'react-bootstrap/lib/Panel';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import FormGroup from 'react-bootstrap/lib/FormGroup';

import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";


function newChangeInstallAddressRequest(entry, onSuccess) {
  fetch_post(
    '/api/v01/npact/np_requests/change_addr',
    {...entry, service_type: "GEOGRAPHIC"}
  ).then(r => r.json())
    .then(r => r.id && onSuccess(r.id))
    .catch(error => NotificationsManager.error("Failed to create a new change installation address request", error.message))
}

function getInvalidRanges(ranges) {
  return ranges.map((r, index) => {
    if (r.from.length === 0) return index;
    if (isNaN(parseInt(r.from, 10) || (r.to.length !== 0 && isNaN(parseInt(r.to, 10))))) return index;
    if (r.to.length !== 0 && parseInt(r.from, 10) > parseInt(r.to, 10)) return index;
    return null;
  }).filter(e => e !== null);
}

export function NPChangeInstallationAddressRequest(props) {
  // const [operators, setOperators] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [address, setAddress] = useState("");
  const [redirect, setRedirect] = useState(undefined);

  const validRanges = ranges.length === 0 ? null : getInvalidRanges(ranges).length === 0 ? "success" : "error";
  const validForm = validRanges === "success" && address.length > 5;

  useEffect(() => {
    document.title = "Change inst. address request";
  }, []);

  return (
    <Panel>
      <Panel.Heading>
        <Panel.Title><FormattedMessage id="new-addess" defaultMessage="New Address Change"/></Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <Form horizontal>
          <FormGroup validationState={validRanges}>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="ranges" defaultMessage="Ranges" />
            </Col>

            <Col sm={9}>
              <RangeInput
                onChange={ranges => setRanges(ranges)}
                ranges={ranges}
                multipleRanges
              />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
              <FormattedMessage id="new-installation-address" defaultMessage="New installation address" />
            </Col>

            <Col sm={9}>
              <FormControl
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)} />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col smOffset={2} sm={10}>
              <Button onClick={() => newChangeInstallAddressRequest({ranges:ranges, address: address}, setRedirect)} disabled={!validForm}>
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