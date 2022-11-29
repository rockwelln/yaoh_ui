import React, { useState } from "react";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";

import { FormattedMessage } from "react-intl";
import { removeEmpty } from "../remuveEmptyInObject";

import Modal from "react-bootstrap/lib/Modal";

const AddResellerModal = ({
  reseller = {
    name: "",
    externalName: "",
    extraData: "",
  },
  mode,
  show,
  onClose,
  onSubmit,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [stateReseller, setStateReseller] = useState({
    ...reseller,
    extraData: JSON.stringify(reseller.extraData, undefined, 4),
  });

  const saveReseller = () => {
    setIsSaving(true);
    let objExtraData = {};
    try {
      objExtraData = stateReseller.extraData
        ? JSON.parse(stateReseller.extraData)
        : {};
    } catch (error) {}
    const data = {
      ...stateReseller,
      extraData: objExtraData,
    };

    const clearData = removeEmpty(data);
    onSubmit({ data: clearData, callback: () => setIsSaving(false) });
  };

  const editReseller = (value, variable) => {
    const tempReseller = { ...stateReseller };
    tempReseller[variable] = value;
    setStateReseller(tempReseller);
  };

  return (
    <Modal show={show} onHide={() => onClose && onClose(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage
            id="edit_platfor"
            defaultMessage={`${mode} reseller`}
          />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{ maxHeight: "calc(100vh - 120px", overflowY: "auto" }}
      >
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>Name*:</div>
            <div className={"margin-right-1 flex-basis-66"}>
              <FormControl
                type="text"
                value={stateReseller.name}
                onChange={(e) => editReseller(e.target.value, "name")}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              External name:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <FormControl
                type="text"
                value={stateReseller.externalName}
                onChange={(e) => editReseller(e.target.value, "externalName")}
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Extra data:
            </div>
            <div className={"margin-right-1 flex-basis-66"}>
              <textarea
                className={"width-100p height-10"}
                value={stateReseller.extraData}
                onChange={(e) => editReseller(e.target.value, "extraData")}
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
                  disabled={!stateReseller.name || isSaving}
                  onClick={saveReseller}
                >
                  {`Save`}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default AddResellerModal;
