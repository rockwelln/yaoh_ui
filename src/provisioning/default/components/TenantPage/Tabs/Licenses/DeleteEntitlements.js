import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { FormattedMessage } from "react-intl";

import { fetchDeleteEntitlementFromTenant } from "../../../../store/actions";

const DeleteEntitlements = props => {
  const { show, onClose, entitlement } = props;

  const [isDisabledButton, setIsDisabledButton] = useState(false);

  const dispatch = useDispatch();
  const params = useParams();

  const deleteEntitlement = () => {
    setIsDisabledButton(true);
    dispatch(
      fetchDeleteEntitlementFromTenant(params.tenantId, entitlement.id)
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
