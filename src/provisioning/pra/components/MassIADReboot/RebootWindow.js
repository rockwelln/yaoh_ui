import React, { useState } from "react";
import { withRouter } from "react-router";
import { useDispatch } from "react-redux";

import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import ControlLabel from "react-bootstrap/lib/ControlLabel";

import { FormattedMessage } from "react-intl";
import { removeEmpty } from "../remuveEmptyInObject";

import { fetchPutMassIADsReboot } from "../../store/actions";

const RebootWindow = props => {
  const [rebootLater, setRebootLater] = useState("now");
  const [requestedTime, setRequestedTime] = useState("");

  const dispatch = useDispatch();
  const promiseArray = [];

  const fillPromiseArray = data => {
    promiseArray.push(dispatch(fetchPutMassIADsReboot(data)));
  };

  const rebootIads = () => {
    const iads = [...props.iads];

    const objIads = iads.reduce((objIads, iad) => {
      const indexStartGRP = iad.indexOf("GRP");
      let iadEntGr = iad.slice(0, indexStartGRP); // TG_ENTxxxxxxxGRPyy-IADzz
      objIads = {
        ...objIads,
        [iadEntGr]: objIads[iadEntGr] ? [...objIads[iadEntGr], iad] : [iad]
      };
      return objIads;
    }, {});
    const time =
      rebootLater === "later"
        ? requestedTime
        : rebootLater === "now"
        ? Date.now()
        : "";
    Object.values(objIads).forEach(iads => {
      const indexStartEntID = iads[0].indexOf("ENT");
      const indexStartGRP = iads[0].indexOf("GRP");
      const indexEndGRP = iads[0].indexOf("-");
      const dataForUpdate = {
        tenantId: iads[0].slice(indexStartEntID, indexStartGRP),
        groupId: iads[0].slice(indexStartEntID, indexEndGRP),
        iads,
        rebootRequest: {
          requestedTime: time
        }
      };

      const clearData = removeEmpty(dataForUpdate);
      fillPromiseArray(clearData);
    });
    Promise.all(promiseArray).then(() => {
      props.onClose();
    });
  };

  return (
    <Modal show={props.show} onHide={() => props.onClose()}>
      <Modal.Header closeButton>
        <Modal.Title></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* <p>
            <FormattedMessage
              id="confirm-reboot-iads"
              defaultMessage={`To be effective, these changes require a reboot of the IAD`}
            />
          </p> */}
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              <ControlLabel>
                <FormattedMessage id="reboot" defaultMessage="Reboot" />
              </ControlLabel>
            </div>
            <div className={"margin-right-1 flex flex-basis-33"}>
              <FormControl
                componentClass="select"
                value={rebootLater}
                onChange={e => {
                  setRebootLater(e.target.value);
                }}
              >
                <option value={"now"}>Reboot now</option>
                <option value={"later"}>Reboot later</option>
                <option value={"notReboot"}>Do not reboot</option>
              </FormControl>
            </div>
          </Col>
        </Row>
        {rebootLater === "later" && (
          <Row className={"margin-top-1"}>
            <Col md={12} className={"flex align-items-center"}>
              <div className={"margin-right-1 flex flex-basis-16"}>
                <ControlLabel>
                  <FormattedMessage
                    id="requestedTime"
                    defaultMessage="Requested Time"
                  />
                </ControlLabel>
              </div>
              <div className={"margin-right-1 flex flex-basis-33"}>
                <FormControl
                  type="time"
                  step={1800}
                  onChange={e => setRequestedTime(e.target.value)}
                ></FormControl>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={rebootIads}
          disabled={rebootLater === "later" && !requestedTime}
        >
          <FormattedMessage id="ok" defaultMessage="Ok" />
        </Button>
        <Button onClick={() => props.onClose()}>
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default withRouter(RebootWindow);
