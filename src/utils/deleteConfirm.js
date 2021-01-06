import React, {useState} from "react";
import Button from "react-bootstrap/lib/Button";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from '@fortawesome/free-solid-svg-icons';


export function ConfirmButton(props) {
  const { onConfirm, title, action, button, ...props_ } = props;
  const [show, setShow] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShow(true)}
        {...props_}>
        {button || action}
      </Button>
      <Modal show={show} onHide={() => setShow(false)} >
        <Modal.Header closeButton>
          {title}
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => {e.preventDefault(); onConfirm(); setShow(false);}}>
            <Button type="submit" bsStyle="danger" autoFocus>
              {action}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}


export function DeleteConfirmButton(props) {
  const { resourceName, title, ...props_ } = props;
  const title_ = title || "Confirm delete " + (resourceName ? `of ${resourceName}` : "");

  return <ConfirmButton title={title_} action="Delete" button={<FontAwesomeIcon icon={faTimes} />} bsStyle="danger" {...props_} />
}