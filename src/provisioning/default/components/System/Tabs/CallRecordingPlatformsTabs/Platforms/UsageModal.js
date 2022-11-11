import React from "react";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";

import Modal from "react-bootstrap/lib/Modal";

const Usage = ({ platformName, show, onClose }) => {
  return (
    <Modal
      show={show}
      onHide={() => onClose && onClose(false)}
      backdrop={false}
    >
      x
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage id="usage" defaultMessage="Usage" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>1111</Modal.Body>
      {/* <Modal.Footer>
          <Button
            onClick={() => this.onDelete()}
            bsStyle="danger"
            disabled={deleting}
          >
            <FormattedMessage id="delete" defaultMessage="Delete" />
          </Button>
          <Button onClick={() => onClose && onClose(false)} disabled={deleting}>
            <FormattedMessage id="cancel" defaultMessage="Cancel" />
          </Button>
        </Modal.Footer> */}
    </Modal>
  );
};

export default Usage;
