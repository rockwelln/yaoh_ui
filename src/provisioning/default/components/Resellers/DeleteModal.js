import React, { useState } from "react";
import { withRouter } from "react-router";
import { useDispatch } from "react-redux";

import Modal from "react-bootstrap/lib/Modal";
import Alert from "react-bootstrap/lib/Alert";
import Button from "react-bootstrap/lib/Button";

import { fetchDeleteReseller } from "../../store/actions";

import { FormattedMessage } from "react-intl";

const DeleteModal = ({ resellerName, show, onClose }) => {
  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(false);
  const onDelete = () => {
    setDeleting(true);
    dispatch(fetchDeleteReseller(resellerName)).then(() => onClose("deleted"));
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage
            id="confirm-delete"
            defaultMessage="Are you sure?"
          />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deleting && (
          <Alert bsStyle="info">
            <FormattedMessage id="deleting" defaultMessage="Deleting..." />
          </Alert>
        )}
        <p>
          <FormattedMessage
            id="confirm-delete-warning"
            defaultMessage={`You are about to delete the reseller ${resellerName}!`}
          />
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onDelete} bsStyle="danger" disabled={deleting}>
          <FormattedMessage id="delete" defaultMessage="Delete" />
        </Button>
        <Button onClick={onClose} disabled={deleting}>
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default withRouter(DeleteModal);
