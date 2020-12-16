import React, {useEffect, useState} from "react";
import {fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager} from "../utils";
import {FormattedMessage} from "react-intl";
import {Panel} from "react-bootstrap";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import Modal from "react-bootstrap/lib/Modal";


// helpers
const TEMPLATE_SAMPLE = "From: {{ sender }}\n" +
    "Subject: [APIO] welcome new user\n" +
    "\n" +
    "Dear user,\n" +
    "\n" +
    "Welcome on the APIO platform.\n" +
    "Please use the link hereunder to set your password:\n" +
    "https://my-host.com/reset-password/{{ token }}\n" +
    "\n" +
    "This link is valid until your password has been set correctly.\n" +
    "This mail is sent automatically, so do not reply on it.\n" +
    "\n" +
    "Please, address your remarks or questions to <support@netaxis.be>\n" +
    "\n" +
    "Best regards,\n" +
    "APIO.\n";

function fetchTemplates(onSuccess) {
    fetch_get("/api/v01/templates")
        .then(data => onSuccess(data.templates))
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-fetch-templates" defaultMessage="Fail to fetch templates"/>, error))
}


function fetchTemplate(template_id, onSuccess) {
    fetch_get(`/api/v01/templates/${template_id}`)
        .then(data => onSuccess(data.template))
        .catch(error => NotificationsManager.error(<FormattedMessage id="get-template-failed" defaultMessage="Failed to get the template"/>, error.message))
}


function deleteTemplate(template_id, onSuccess) {
    return fetch_delete(`/api/v01/templates/${template_id}`)
        .then(r => {
            NotificationsManager.success(<FormattedMessage id="deleted" defaultMessage="Deleted"/>);
            onSuccess && onSuccess();
            return r;
        })
        .catch(error => NotificationsManager.error(<FormattedMessage id="delete-failed" defaultMessage="Failed to delete"/>, error.message))
}


function updateTemplate(template_id, data, onSuccess) {
    const data_ = Object.keys(data).reduce((a, b) => {
            if(["key", "template"].includes(b)) {
                a[b] = data[b];
            }
            return a;
        }, {}
    );
    return fetch_put(`/api/v01/templates/${template_id}`, data_)
        .then(r => {
            NotificationsManager.success(<FormattedMessage id="updated" defaultMessage="Updated"/>);
            onSuccess && onSuccess();
            return r;
        }, error =>
            NotificationsManager.error(<FormattedMessage id="update-failed" defaultMessage="Failed to update"/>, error.message)
        )
}


function newTemplate(data, onSuccess) {
    fetch_post("/api/v01/templates", data)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id="template-created" defaultMessage="Template created"/>);
            onSuccess();
        })
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-save-template" defaultMessage="Failed to save template"/>, error.message))
}


// React components

function Template(props) {
    const [template, setTemplate] = useState(props.template);
    const refresh = () => fetchTemplate(props.template.id, setTemplate);

    const validKey = template.key !== props.template.key && template.key.length !== 0 ? "success" : null;
    const validForm = validKey === "success";

    return (
        <Panel
            defaultExpanded={false}
            onToggle={expanded => expanded && refresh()}>
            <Panel.Heading>
                <Panel.Title toggle>
                    {props.template.key}
                </Panel.Title>
            </Panel.Heading>
            <Panel.Body collapsible>
                <Form horizontal>
                    <FormGroup validationState={validKey}>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="key" defaultMessage="Key" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="input"
                                value={template.key}
                                onChange={e => setTemplate(update(template, {$merge: {key: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={2}>
                            <FormattedMessage id="content" defaultMessage="Content" />
                        </Col>

                        <Col sm={9}>
                            <FormControl componentClass="textarea"
                                rows={15}
                                placeholder={TEMPLATE_SAMPLE}
                                value={template.template}
                                onChange={e => setTemplate(update(template, {$merge: {template: e.target.value}}))} />
                        </Col>
                    </FormGroup>
                </Form>
                <ButtonToolbar>
                    <Button
                        bsStyle="primary"
                        onClick={() => updateTemplate(props.template.id, template, props.onUpdate)}
                    >
                        <FormattedMessage id="save" defaultMessage="Save"/>
                    </Button>
                    <Button
                        bsStyle="danger"
                        onClick={() => deleteTemplate(props.template.id, props.onDelete)}
                    >
                        <FormattedMessage id="delete" defaultMessage="Delete"/>
                    </Button>
                    <Button onClick={refresh}><FormattedMessage id="cancel" defaultMessage="Cancel"/></Button>
                </ButtonToolbar>
            </Panel.Body>
        </Panel>
    )
}


function NewTemplate(props) {
    const new_template = {key: "", template: ""};
    const [show, setShow] = useState(false);
    const [template, setTemplate] = useState(new_template);

    const onClose_ = () => {setShow(false); setTemplate(new_template); props.onClose();};
    const validKey = template.key.length !== 0 ? "success" : null;
    const validForm = validKey === "success";

    return (
        <div>
            <Button bsStyle='primary' onClick={() => setShow(true)}>
                <FormattedMessage id="add-template" defaultMessage="Add template" />
            </Button>
            <Modal show={show} onHide={onClose_} backdrop={false} bsSize="large">
                <Modal.Header closeButton>
                    <Modal.Title><FormattedMessage id="create-a-template" defaultMessage="Create a new template" /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <FormGroup validationState={validKey}>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="key" defaultMessage="Key" />
                            </Col>

                            <Col sm={9}>
                                <FormControl componentClass="input"
                                    value={template.key}
                                    onChange={e => setTemplate(update(template, {$merge: {key: e.target.value}}))} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="content" defaultMessage="Content" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                    rows={15}
                                    placeholder={TEMPLATE_SAMPLE}
                                    componentClass="textarea"
                                    onChange={e => setTemplate(update(template, {$merge: {template: e.target.value}}))} />
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => newTemplate(template, onClose_)} bsStyle="primary" disabled={!validForm}>
                        <FormattedMessage id="save" defaultMessage="Save" />
                    </Button>
                    <Button onClick={onClose_}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}


export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const refresh = () => {fetchTemplates(setTemplates);}

    useEffect(() => {
      refresh();
      document.title = "Templates";
    }, []);

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="templates" defaultMessage="Templates"/></Breadcrumb.Item>
            </Breadcrumb>

            {
                templates
                    .sort((a, b) => a.id - b.id)
                    .map((t, i) => <Template key={i} template={t} onUpdate={refresh} onDelete={refresh}/>)
            }

            <Panel>
                <Panel.Body>
                    <ButtonToolbar>
                        <NewTemplate onClose={refresh} />
                    </ButtonToolbar>
                </Panel.Body>
            </Panel>
        </div>
    )
}