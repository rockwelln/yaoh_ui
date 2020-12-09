import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Modal from "react-bootstrap/lib/Modal";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";

import { FormattedMessage } from "react-intl";

import { fetchPutUpdateTenantEntitlements } from "../../../store/actions";

const EditEntitlements = props => {
  const { show, onClose, entitlement } = props;

  const dispatch = useDispatch();
  const params = useParams();
  const createdTenant = useSelector(state => state.createdTenant);

  const [countEntitlement, setCountEntitlement] = useState(
    entitlement.entitlement
  );
  const [isDisabledButton, setIsDisabledButton] = useState(false);

  const updateEntitlement = () => {
    setIsDisabledButton(true);
    dispatch(
      fetchPutUpdateTenantEntitlements(createdTenant.tenantId, entitlement.id, {
        entitlement: Number(countEntitlement)
      })
    ).then(() => onClose());
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit entitlement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Assigned</th>
              <th>Entitlement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={"vertical-middle"}>{entitlement.name}</td>
              <td className={"vertical-middle"}>
                {entitlement.counter ? entitlement.counter : 0}
              </td>
              <td>
                <FormControl
                  type="number"
                  value={countEntitlement}
                  min={entitlement.counter ? entitlement.counter : 0}
                  onChange={e => {
                    setCountEntitlement(e.target.value);
                  }}
                />
              </td>
            </tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button
          bsStyle="danger"
          onClick={() => onClose()}
          className={"width-8 margin-right-2"}
        >
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
        <Button
          className={"width-8 btn-success"}
          onClick={updateEntitlement}
          disabled={
            entitlement.entitlement === countEntitlement ||
            isDisabledButton ||
            countEntitlement < entitlement.counter ||
            countEntitlement < 0
          }
        >
          <FormattedMessage id="update" defaultMessage="Update" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditEntitlements;
