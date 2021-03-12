import React, {useState} from "react";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import {LinkContainer} from "react-router-bootstrap";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import update from "immutability-helper";
import InputGroupButton from "react-bootstrap/lib/InputGroupButton";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Form from "react-bootstrap/lib/Form";
import {fetch_get, fetch_post, NotificationsManager} from "../utils";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";

function fetchInstanceContext(instanceId, onSuccess) {
  fetch_get(`/api/v01/transactions/${instanceId}/template_context`)
    .then(r => onSuccess(r))
    .catch(e => NotificationsManager.error(
      "Failed to fetch instance context",
      e.message,
    ))
}

function runTemplate(context, template, debug, onSuccess, onError) {
  fetch_post(
    `/api/v01/templates/playground?debug=${debug?1:0}`,
    {
      "context": context,
      "template": template,
    }
  ).then(r => r.json())
    .then(r => onSuccess(r))
    .catch(e => onError && onError(e.message))
}

const emptyResponse = {
  output: "",
  json_form: "",
  trace: null,
}
export default function TemplatePlayground() {
  const [instanceId, setInstanceId] = useState("");
  const [context, setContext] = useState("");
  const [template, setTemplate] = useState("");
  const [output, setOutput] = useState(emptyResponse);
  const [error, setError] = useState(undefined);

  let validContext = true
  if(context.length !== 0) {
      try{
        JSON.parse(context)
      } catch (e) {
        console.log(e);
        validContext = false;
      }
  }

  return (
    <>
      <Breadcrumb>
          <LinkContainer to={`/help`}>
              <Breadcrumb.Item><FormattedMessage id="help" defaultMessage="Help"/></Breadcrumb.Item>
          </LinkContainer>
          <Breadcrumb.Item active>
              <FormattedMessage id="template-playground" defaultMessage="Template playground"/>
          </Breadcrumb.Item>
      </Breadcrumb>
      <Row>
          <Col sm={6}>
              <Row style={{marginLeft: "0px"}}>
                  <Col sm={5}>
                      <h4><i>Template</i></h4>
                  </Col>
                  <Col smOffset={6}>
                    <ButtonToolbar>
                      <Button
                        bsSize={"small"}
                        disabled={!validContext}
                        onClick={() => {
                          setError(undefined);
                          runTemplate(
                            context.length?JSON.parse(context):{},
                            template,
                            false,
                            r => {
                              setOutput(r);
                            },
                            e => setError(e));
                        }}
                        style={{float: "right"}}>
                        Run &gt;&gt;
                      </Button>
                      <Button
                        bsSize={"small"}
                        disabled={!validContext}
                        onClick={() => {
                          setError(undefined);
                          runTemplate(
                            context.length?JSON.parse(context):{},
                            template,
                            true,
                            r => {
                              setOutput(r);
                            },
                            e => setError(e),
                          );
                        }}
                        style={{float: "right"}}>
                        Debug &gt;&gt;
                      </Button>
                    </ButtonToolbar>
                  </Col>

                  <FormControl
                      componentClass="textarea"
                      value={template}
                      onChange={e => setTemplate(e.target.value)}
                      rows={5} />
              </Row>
              <Row style={{marginTop: "6px", marginLeft: "0px"}}>
                  <Col sm={5}>
                      <h4><i>Context</i></h4>
                  </Col>
                  <Col smOffset={8}>
                    <Form onSubmit={e => {
                      e.preventDefault();
                      fetchInstanceContext(instanceId, r => setContext(JSON.stringify(r, null, 2)))
                    }}>
                        <InputGroup>
                            <FormControl
                                type="text"
                                value={instanceId}
                                placeholder="import instance id"
                                onChange={e => setInstanceId(e.target.value)} />
                            <InputGroupButton>
                                <Button type='submit'>
                                    <Glyphicon glyph="search" />
                                </Button>
                            </InputGroupButton>
                        </InputGroup>
                    </Form>
                  </Col>

                  <FormControl
                      componentClass="textarea"
                      value={context}
                      style={{ backgroundColor: validContext?undefined:"#fcdada" }}
                      onChange={e => setContext(e.target.value)}
                      rows={50} />
              </Row>
          </Col>
          <Col sm={6}>
              <Row style={{marginLeft: "0px"}}>
                  <Col sm={5}>
                      <h4><i>Output</i></h4>
                  </Col>
                  <Col smOffset={6}>
                      {
                        output.output.length !== 0 && output.json_form === null && <p style={{color: "red"}}>*not* JSON valid</p>
                      }
                  </Col>


              {
                error && <p style={{color: "red"}}>{error}</p>
              }
              <FormControl
                  componentClass="textarea"
                  value={output.json_form || output.output}
                  readOnly
                  rows={output.trace?8:58} />
              {
                output.trace &&
                <>
                  <Col sm={5}>
                      <h4><i>Trace</i></h4>
                  </Col>
                  <FormControl
                    componentClass="textarea"
                    value={JSON.stringify(output.trace, null, 2)}
                    readOnly
                    rows={40} />
                </>
              }
              </Row>
          </Col>
      </Row>
    </>
  )
}
