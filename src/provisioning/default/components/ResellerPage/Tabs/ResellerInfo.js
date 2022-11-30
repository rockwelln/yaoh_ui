import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormGroup from "react-bootstrap/lib/FormGroup";
import { Form } from "react-bootstrap";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import {
  fetchGetReseller,
  fetchPutUpdateReseller,
} from "../../../store/actions";

import { removeEmpty } from "../../remuveEmptyInObject";
import Loading from "../../../common/Loading";

const ResellerInfo = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const reseller = useSelector((state) => state.reseller);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stateReseller, setStateReseller] = useState({
    name: "",
    externalName: "",
    extraData: JSON.stringify({}, undefined, 4),
  });
  const [isFailedParseJSON, setIsFaildeParseJSON] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchGetReseller(params.resellerName)).then(() =>
      setIsLoading(false)
    );
  }, []);

  useEffect(() => {
    setStateReseller({
      ...reseller,
      extraData: JSON.stringify(reseller.extraData, undefined, 4),
    });
  }, [reseller]);

  const saveReseller = () => {
    setIsSaving(true);
    let objExtraData = {};
    try {
      objExtraData = stateReseller.extraData
        ? JSON.parse(stateReseller.extraData)
        : {};
    } catch (error) {
      setIsFaildeParseJSON(true);
      setIsSaving(false);
      return;
    }
    const data = {
      ...stateReseller,
      extraData: objExtraData,
    };

    const clearData = removeEmpty(data);
    dispatch(fetchPutUpdateReseller(params.resellerName, clearData)).then(() =>
      setIsSaving(false)
    );
  };

  const editReseller = (value, variable) => {
    const tempReseller = { ...stateReseller };
    tempReseller[variable] = value;
    setStateReseller(tempReseller);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Row>
        <Col md={8}>
          <Form horizontal className={"margin-1"}>
            <FormGroup controlId="name">
              <FormGroup controlId="new-userId">
                <Col
                  componentClass={ControlLabel}
                  md={3}
                  className={"text-left"}
                >
                  Name*
                </Col>
                <Col md={9}>
                  <FormControl
                    type="text"
                    placeholder="Name"
                    value={stateReseller.name}
                    onChange={(e) => editReseller(e.target.value, "name")}
                  />
                </Col>
              </FormGroup>
              <FormGroup controlId="externalName">
                <Col
                  componentClass={ControlLabel}
                  md={3}
                  className={"text-left"}
                >
                  Email
                </Col>
                <Col md={9}>
                  <FormControl
                    type="text"
                    value={stateReseller.externalName}
                    onChange={(e) =>
                      editReseller(e.target.value, "externalName")
                    }
                    placeholder="External name"
                  />
                </Col>
              </FormGroup>
              <FormGroup
                controlId="extraData"
                validationState={isFailedParseJSON}
              >
                <Col
                  componentClass={ControlLabel}
                  md={3}
                  className={"text-left"}
                >
                  Extra data
                </Col>
                <Col md={9}>
                  <FormControl
                    componentClass="textarea"
                    className={"width-100p height-10"}
                    placeholder="Extra data(JSON format)"
                    value={stateReseller.extraData}
                    onChange={(e) => {
                      editReseller(e.target.value, "extraData");
                      setIsFaildeParseJSON(false);
                    }}
                  />
                  {isFailedParseJSON && (
                    <HelpBlock>Feiled to parse JSON</HelpBlock>
                  )}
                </Col>
              </FormGroup>
            </FormGroup>
            <Row>
              <Col md={12} className={"padding-0"}>
                <div class="button-row">
                  <div className="pull-right">
                    <Button
                      className={"btn-primary"}
                      disabled={!stateReseller.name || isSaving}
                      onClick={saveReseller}
                    >
                      {`Update`}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default ResellerInfo;
