import React, { useState } from "react";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from '@fortawesome/free-solid-svg-icons';


export function DeleteConfirmButton(props) {
  const { onConfirm, resourceName, ...props_ } = props;
  const [show, setShow] = useState(false)

  return (
    <>
      <Button
        bsStyle="danger"
        onClick={() => setShow(true)}
        {...props_}>
        <FontAwesomeIcon icon={faTimes} />
      </Button>
      <Modal show={show} onHide={() => setShow(false)} >
        <Modal.Header closeButton>
          Confirm deletation {resourceName ? `of ${resourceName}` : ""}
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Button bsStyle="danger" onClick={e => { onConfirm(); setShow(false); }}>
              Delete
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}