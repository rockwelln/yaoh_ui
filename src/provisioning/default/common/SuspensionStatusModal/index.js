import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { withRouter } from "react-router";

import Modal from "react-bootstrap/lib/Modal";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";

import { fetchGetSuspensionOptions } from "../../store/actions";
import Loading from "../Loading";

const SuspensionStatusModal = props => {
  const { show, handleClose, status, updateSuspensionStatus } = props;
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [suspensionStatus, setSuspensionStatus] = useState(status);

  const suspensionOptions = useSelector(state => state.suspensionOptions);

  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoadingOptions(true);
    dispatch(fetchGetSuspensionOptions()).then(() =>
      setIsLoadingOptions(false)
    );
  }, []);

  if (isLoadingOptions) {
    return (
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit suspension status</Modal.Title>
        </Modal.Header>
        <Modal.Body className={"flex justify-center height-10"}>
          <div className={"crunch-suspension-modal"}>
            <Loading />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() => updateSuspensionStatus(suspensionStatus)}
            bsStyle="primary"
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit suspension status</Modal.Title>
      </Modal.Header>
      <Modal.Body className={"flex justify-center height-10"}>
        <FormGroup
          className={"flex justify-center align-items-center width-100p"}
        >
          <ControlLabel className={"margin-right-2"}>Select:</ControlLabel>
          <FormControl
            componentClass="select"
            placeholder="select"
            value={suspensionStatus}
            onChange={e => setSuspensionStatus(e.target.value)}
          >
            <option value="">Active</option>
            {suspensionOptions.map(el => (
              <option key={el.name} value={el.name}>
                {el.name}
              </option>
            ))}
          </FormControl>
        </FormGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={() => updateSuspensionStatus(suspensionStatus)}
          bsStyle="primary"
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default withRouter(SuspensionStatusModal);
