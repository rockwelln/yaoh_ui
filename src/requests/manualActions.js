import { useState } from "react";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Form from "react-bootstrap/lib/Form";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";
import Ajv from "ajv";
import DatePicker from "react-datepicker";
import moment from "moment";
import {localUser} from "../utils/user";


function ManualActionInput({ type, value, onChange }) {
  switch (type) {
    case "boolean":
      return <Checkbox
        checked={value}
        onChange={e => onChange(e.target.checked)} />
    case "date-time":
      return <DatePicker
        className="form-control"
        selected={value ? localUser.localizeUtcDate(moment.utc(value)).toDate() : null}
        onChange={d => onChange(d.toISOString())}
        dateFormat="yyyy-MM-dd" />
    default:
      return <FormControl
        componentClass="input"
        value={value}
        onChange={e => onChange(e.target.value)} />
  }
}

export function ManualActionInputForm({ show, action, output, onHide, onTrigger }) {
  const [values, setValues] = useState({});

  let input_form;
  try {
    input_form = JSON.parse(action.input_form)
  } catch (e) { }

  let ajv = Ajv({ allErrors: true });
  const validInputs = input_form ? ajv.validate(input_form, values) : true;
  console.log(ajv.errors, input_form, values)
  return (
    <Modal show={show} onHide={onHide} dialogClassName='large-modal'>
      <Modal.Header closeButton>
        <Modal.Title>
          {`Pending manual action: ${action.description}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Some inputs are possible/required for this action.</p>
        <Form horizontal>
          {
            input_form && input_form.properties && Object.entries(input_form.properties).map(([key, v]) => {
              return (
                <FormGroup>
                  <Col componentClass={ControlLabel} sm={2}>
                    {key}{input_form.required && input_form.required.includes(key) && " *"}
                  </Col>

                  <Col sm={9}>
                    {
                      <ManualActionInput
                        type={v.format || v.type}
                        value={values[key]}
                        onChange={v => setValues(
                          { ...values, [key]: v }
                        )} />
                    }
                  </Col>
                </FormGroup>
              )
            })
          }
          <FormGroup>
            <Col smOffset={2} sm={9}>
              <Button onClick={() => onTrigger(action, output, values)} disabled={!validInputs}>
                {output}
              </Button>
            </Col>
          </FormGroup>
        </Form>
      </Modal.Body>
    </Modal>
  )
}