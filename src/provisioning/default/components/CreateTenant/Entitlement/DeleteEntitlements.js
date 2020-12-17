import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { FormattedMessage } from "react-intl";

import { fetchDeleteEntitlementFromTenant } from "../../../store/actions";

const DeleteEntitlements = props => {
  const { show, onClose, entitlement } = props;

  const [isDisabledButton, setIsDisabledButton] = useState(false);
  const createdTenant = useSelector(state => state.createdTenant);

  const dispatch = useDispatch();

  const deleteEntitlement = () => {
    setIsDisabledButton(true);
    dispatch(
      fetchDeleteEntitlementFromTenant(createdTenant.tenantId, entitlement.id)
    ).then(() => onClose());
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Delete entitlement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {`You are about to delete the entitlement ${entitlement.name}!`}
      </Modal.Body>
      <Modal.Footer>
        <Button
          bsStyle="danger"
          onClick={deleteEntitlement}
          className={"width-8 margin-right-2"}
          disabled={isDisabledButton}
        >
          <FormattedMessage id="delete" defaultMessage="Delete" />
        </Button>
        <Button
          className={"width-8"}
          onClick={() => onClose()}
          disabled={isDisabledButton}
        >
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteEntitlements;
