import React, { Component } from "react";
import { connect } from "react-redux";

import { fetchDeleteTenantAdmin } from "../../store/actions";

import Modal from "react-bootstrap/lib/Modal";
import Alert from "react-bootstrap/lib/Alert";
import Button from "react-bootstrap/lib/Button";

import { FormattedMessage } from "react-intl";

class DeleteModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onDelete = this.onDelete.bind(this);
  }

  onDelete(tenantId, adminId) {
    const { onClose } = this.props;
    this.setState({ deleting: true });
    this.props.fetchDeleteTenantAdmin(tenantId, adminId).then(() => {
      this.setState({ deleting: false });
      onClose && onClose(true);
    });
  }

  render() {
    const { templateName, show, onClose } = this.props;
    const { deleting } = this.state;
    return (
      <Modal
        show={show}
        onHide={() => onClose && onClose(false)}
        backdrop={false}
      >
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
              defaultMessage={`You are about to delete the tamplate ${templateName}!`}
            />
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="danger" disabled>
            <FormattedMessage id="delete" defaultMessage="Delete" />
          </Button>
          <Button onClick={() => onClose && onClose(false)} disabled={deleting}>
            <FormattedMessage id="cancel" defaultMessage="Cancel" />
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const mapDispatchToProps = {
  fetchDeleteTenantAdmin
};

export default connect(
  null,
  mapDispatchToProps
)(DeleteModal);
