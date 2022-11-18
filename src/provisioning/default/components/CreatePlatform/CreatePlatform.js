import React, { useState } from "react";
import { withRouter } from "react-router";
import { useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router";

import { fetchPostAddCallRecordingPlatform } from "../../store/actions";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Select from "react-select";
import Checkbox from "react-bootstrap/lib/Checkbox";

import { removeEmpty } from "../remuveEmptyInObject";

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

const CreatePlatform = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();

  const [name, setName] = useState("");
  const [netAddress, setNetAddress] = useState("");
  const [port, setPort] = useState("");
  const [mediaStream, setMediaStream] = useState({
    value: "Dual",
    label: "Dual",
  });
  const [transportProtocol, setTransportProtocol] = useState({
    value: "UDP",
    label: "UDP",
  });
  const [description, setDescription] = useState("");
  const [schemaVersion, setSchemaVersion] = useState({
    value: "1.0",
    label: "1.0",
  });
  const [supportVideoRecording, setSupportVideoRecording] = useState(false);

  const addPlatform = () => {
    const data = {
      name,
      netAddress,
      port: Number(port),
      mediaStream: mediaStream.value,
      transportProtocol: transportProtocol.value,
      description,
      schemaVersion: schemaVersion.value,
      supportVideoRecording,
    };

    const clearData = removeEmpty(data);
    dispatch(fetchPostAddCallRecordingPlatform(clearData)).then(() =>
      history.push(
        `/provisioning/${params.gwName}/system#callRecordingPlatforms_Platforms`
      )
    );
  };

  return (
    <>
      <div className={"panel-heading flex space-between"}>
        <div className={"header"}>{`Create platform`}</div>
        <div>
          <Button
            className={"btn-primary"}
            disabled={!name || !netAddress || !description}
            onClick={addPlatform}
          >
            Add
          </Button>
        </div>
      </div>
      <div className={"panel-body"}>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>Name*:</div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              Net address*:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
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
            <div className={"margin-right-1 flex flex-basis-16"}>Port:</div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              Media Stream:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
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
            <div className={"margin-right-1 flex flex-basis-16"}>
              Transport protocol:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
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
            <div className={"margin-right-1 flex flex-basis-16"}>
              Description*:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
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
            <div className={"margin-right-1 flex flex-basis-16"}>
              Schema version:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
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
            <div className={"margin-right-1 flex flex-basis-16"}>
              Support video recording:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <Checkbox
                checked={supportVideoRecording}
                onChange={(e) => setSupportVideoRecording(e.target.checked)}
              />
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default withRouter(CreatePlatform);
