import React, { useState, useEffect } from "react";

import { useParams } from "react-router";

import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { fetchPutUpdateCallRecordingPlatform } from "../../../../../store/actions";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Select from "react-select";
import Checkbox from "react-bootstrap/lib/Checkbox";

import { FormattedMessage } from "react-intl";
import { removeEmpty } from "../../../../remuveEmptyInObject";

import Modal from "react-bootstrap/lib/Modal";
import Loading from "../../../../../common/Loading";

const mediaStreamOptions = [
  {
    value: "Dual",
    label: "Dual",
  },
  {
    value: "Single",
    label: "Single",
  },
];

const transportProtocolOptions = [
  {
    value: "UDP",
    label: "UDP",
  },
  {
    value: "TCP",
    label: "TCP",
  },
  {
    value: "Unspecified",
    label: "Unspecified",
  },
];

const schemaVersionOptions = [
  {
    value: "1.0",
    label: "1.0",
  },
  {
    value: "2.0",
    label: "2.0",
  },
  {
    value: "3.0",
    label: "3.0",
  },
];

const EditModal = ({ platform, show, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [netAddress, setNetAddress] = useState(platform.netAddress);
  const [port, setPort] = useState(platform.port);
  const [mediaStream, setMediaStream] = useState({
    value: platform.mediaStream,
    label: platform.mediaStream,
  });
  const [transportProtocol, setTransportProtocol] = useState({
    value: platform.transportProtocol,
    label: platform.transportProtocol,
  });
  const [description, setDescription] = useState(platform.description);
  const [schemaVersion, setSchemaVersion] = useState({
    value: platform.schemaVersion,
    label: platform.schemaVersion,
  });
  const [supportVideoRecording, setSupportVideoRecording] = useState(
    platform.supportVideoRecording
  );

  const dispatch = useDispatch();

  const updatePlatform = () => {
    setIsUpdating(true);
    const data = {
      netAddress,
      port: Number(port),
      mediaStream: mediaStream.value,
      transportProtocol: transportProtocol.value,
      description,
      schemaVersion: schemaVersion.value,
      supportVideoRecording,
    };

    const clearData = removeEmpty(data);
    dispatch(
      fetchPutUpdateCallRecordingPlatform({
        name: platform.name,
        data: clearData,
      })
    ).then(() => onClose());
  };

  return (
    <Modal show={show} onHide={() => onClose && onClose(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage id="edit_platfor" defaultMessage="Edit platform" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{ maxHeight: "calc(100vh - 120px", overflowY: "auto" }}
      >
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>Name:</div>
            <div className={"margin-right-1 flex-basis-66"}>
              <FormControl type="text" value={platform.name} disabled />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Net address*:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <FormControl
                type="text"
                value={netAddress}
                onChange={(e) => setNetAddress(e.target.value)}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>Port:</div>
            <div className={"margin-right-1 flex-basis-66"}>
              <FormControl
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Media Stream:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <Select
                className={"width-100p"}
                value={mediaStream}
                onChange={(selected) => setMediaStream(selected)}
                options={mediaStreamOptions}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Transport protocol:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <Select
                className={"width-100p"}
                value={transportProtocol}
                onChange={(selected) => setTransportProtocol(selected)}
                options={transportProtocolOptions}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Description*:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <textarea
                className={"width-100p height-10"}
                onChange={(e) => setDescription(e.target.value)}
                value={description}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Schema version:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <Select
                className={"width-100p"}
                value={schemaVersion}
                onChange={(selected) => setSchemaVersion(selected)}
                options={schemaVersionOptions}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Support video recording:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <Checkbox
                checked={supportVideoRecording}
                onChange={(e) => setSupportVideoRecording(e.target.checked)}
              />
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div class="button-row margin-right-1">
              <div className="pull-right">
                <Button
                  className={"btn-primary"}
                  disabled={!netAddress || !description || isUpdating}
                  onClick={updatePlatform}
                >
                  {`Update`}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default EditModal;
