import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import {
  fetchGetCallRecordingProperties,
  fetchPutUpdateCallRecordingProperties,
} from "../../../../../store/actions";

import Loading from "../../../../../common/Loading";

const Properties = () => {
  const dispatch = useDispatch();

  const callRecordingProperties = useSelector(
    (state) => state.callRecordingProperties
  );

  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState(callRecordingProperties);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchGetCallRecordingProperties()).then(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setProperties(callRecordingProperties);
  }, [callRecordingProperties]);

  const handleEditProperties = (propertyName, value) => {
    const newProperties = { ...properties };
    newProperties[propertyName] = value;
    setProperties(newProperties);
  };

  const handleUpdate = () => {
    dispatch(fetchPutUpdateCallRecordingProperties({ data: properties }));
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className={"panel-heading flex space-between"}>
        <div className={"header"}>{`Call recording properties`}</div>
      </div>
      <div className={"panel-body"}>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Continue call after recording failure
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <Checkbox
                checked={properties.continueCallAfterRecordingFailure}
                onChange={(e) =>
                  handleEditProperties(
                    "continueCallAfterRecordingFailure",
                    e.target.checked
                  )
                }
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Refresh period seconds:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                type="number"
                min={0}
                value={properties.refreshPeriodSeconds}
                onChange={(e) =>
                  handleEditProperties(
                    "refreshPeriodSeconds",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Max consecutive failures:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                type="number"
                min={0}
                value={properties.maxConsecutiveFailures}
                onChange={(e) =>
                  handleEditProperties(
                    "maxConsecutiveFailures",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Max response wait time milliseconds:
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                type="number"
                min={0}
                value={properties.maxResponseWaitTimeMilliseconds}
                onChange={(e) =>
                  handleEditProperties(
                    "maxResponseWaitTimeMilliseconds",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Continue call after video recording failure
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <Checkbox
                checked={properties.continueCallAfterVideoRecordingFailure}
                onChange={(e) =>
                  handleEditProperties(
                    "continueCallAfterVideoRecordingFailure",
                    e.target.checked
                  )
                }
              />
            </div>
          </Col>
        </Row>
        <Row className={"indent-top-bottom-1"}>
          <Col mdOffset={9} md={2}>
            <div className="button-row">
              <div className="pull-right">
                <Button className="btn-primary" onClick={handleUpdate}>
                  <Glyphicon glyph="glyphicon glyphicon-ok" /> UPDATE
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Properties;
