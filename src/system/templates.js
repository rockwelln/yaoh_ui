import React, {useCallback, useEffect, useRef, useState} from "react";
import {downloadJson, fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager, parseJSON} from "../utils";
import {FormattedMessage} from "react-intl";
import {Panel} from "react-bootstrap";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";

import "./template.css";
import {faMinus, faPlus} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import ReactDOM from "react-dom";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import {readFile} from "../orchestration/startup_events";


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

function fetchTemplates() {
    return fetch_get("/api/v01/templates")
        .then(data => data.templates.sort((a, b) => a.key.localeCompare(b.key)))
        .catch(error => NotificationsManager.error(<FormattedMessage id="fail-fetch-templates" defaultMessage="Fail to fetch templates"/>, error))
}


function fetchTemplate(template_id) {
    return fetch_get(`/api/v01/templates/${template_id}`)
        .catch(error => NotificationsManager.error(<FormattedMessage id="get-template-failed" defaultMessage="Failed to get the template"/>, error.message))
}


function deleteTemplate(template_id) {
    return fetch_delete(`/api/v01/templates/${template_id}`)
        .then(r => {
            NotificationsManager.success(<FormattedMessage id="deleted" defaultMessage="Deleted"/>);
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
    return fetch_post("/api/v01/templates", data)
      .then(parseJSON)
      .then(resp => {
          NotificationsManager.success(<FormattedMessage id="template-created" defaultMessage="Template created"/>);
          onSuccess && onSuccess(resp.id);
          return resp;
      })
      .catch(error => NotificationsManager.error(<FormattedMessage id="fail-save-template" defaultMessage="Failed to save template"/>, error.message))
}


// React components
function Template({label, id, onDelete, onUpdate, onExport, onImport}) {
  const [template, setTemplate] = useState({});
  const fileUploader = useRef(null);

  useEffect(() => {
    fetchTemplate(id).then(t => setTemplate(t.template))
  }, [label, id]);

  return (
    <Panel>
      <Panel.Heading>
          <Panel.Title toggle>
              {template.key}
          </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={1}>
              <FormattedMessage id="path" defaultMessage="Path" />
            </Col>

            <Col sm={9} lg={3}>
              <FormControl
                type="text"
                onChange={e => setTemplate(update(template, {$merge: {key: e.target.value}}))}
                value={template.key} />
            </Col>

            <Col>
              <ButtonToolbar>
                <ButtonGroup>
                  <Button
                    onClick={() => fileUploader.current.click()}
                    bsStyle={"warning"}>
                    Import
                  </Button>
                  <input
                    type="file"
                    id="file"
                    ref={fileUploader}
                    onChange={e => onImport(e.target.files[0])}
                    style={{display: "none"}}/>

                  <Button
                    onClick={() => onExport(template)}
                    bsStyle={"warning"}>
                    Export
                  </Button>
                </ButtonGroup>

                <ButtonGroup>
                  <DeleteConfirmButton
                    resourceName={label}
                    button={"Delete"}
                    onConfirm={() => deleteTemplate(id).then(() => onDelete(label))} />
                </ButtonGroup>

                <ButtonGroup>
                  <Button
                    onClick={() => updateTemplate(id, template, onUpdate)}
                    bsStyle={"primary"}>
                    Save
                  </Button>
                </ButtonGroup>
              </ButtonToolbar>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col sm={12}>
              <FormControl
                componentClass="textarea"
                style={{resize: "vertical"}}
                rows={25}
                placeholder={TEMPLATE_SAMPLE}
                onChange={e => setTemplate(update(template, {$merge: {template: e.target.value}}))}
                value={template.template} />
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

function TemplateParent({label, onDelete, onRename, onExport, onImport}) {
  const [path, setPath] = useState(label);
  const fileUploader = useRef(null);

  useEffect(() => setPath(label), [label])

  return (
    <Panel>
      <Panel.Heading>
          <Panel.Title toggle>
              {label}
          </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={1}>
              <FormattedMessage id="path" defaultMessage="Path" />
            </Col>

            <Col sm={9} lg={3}>
              <FormControl
                type="text"
                onChange={e => setPath(e.target.value)}
                value={path} />
            </Col>

            <Col>
              <ButtonToolbar>
                <ButtonGroup>
                  <Button
                    onClick={() => fileUploader.current.click()}
                    bsStyle={"warning"}>
                    Import
                  </Button>
                  <input
                    type="file"
                    id="file"
                    ref={fileUploader}
                    onChange={e => onImport(e.target.files[0])}
                    style={{display: "none"}}/>

                  <Button
                    onClick={() => onExport(label)}
                    bsStyle={"warning"}>Export</Button>
                </ButtonGroup>

                <ButtonGroup>
                  <DeleteConfirmButton
                    resourceName={`${label} and all its children`}
                    button={"Delete"}
                    onConfirm={() => onDelete(label)} />
                </ButtonGroup>

                <ButtonGroup>
                  <Button bsStyle={"primary"} onClick={() => onRename(path)}>Rename</Button>
                </ButtonGroup>
              </ButtonToolbar>
            </Col>
          </FormGroup>
        </Form>
      </Panel.Body>
    </Panel>
  )
}

function TemplateTree({
      parent,
      title,
      children,
      onNewLevel,
      onNewTemplate,
      onSelected,
      onSelectedNode,
}) {
    const [showSiblings, setShowSiblings] = useState(false);
    const [showNewSubNode, setShowNewSubNode] = useState(false);
    const [showNewTemplate, setShowNewTemplate] = useState(false);

    const path = (parent?(parent + "."):"")+title;
    const newNodeRef = useRef();
    const newTemplateRef = useRef();

    useEffect(() => {
      const node = ReactDOM.findDOMNode(newNodeRef.current);
      if(showNewSubNode && node && node.focus instanceof Function) {
        node.focus();
      }
    }, [showNewSubNode]);

    useEffect(() => {
      const node = ReactDOM.findDOMNode(newTemplateRef.current);
      if(showNewTemplate && node && node.focus instanceof Function) {
        node.focus();
      }
    }, [showNewTemplate]);

    if(children.key !== undefined) return (
        <li>
          <div className="treeview__level" data-level={(children.id === 0 ? "* ": "") + (title ? title[0].toUpperCase() : "")}>
            <span className="level-title">
              <Button bsStyle={"link"} onClick={() => onSelected && onSelected(children)}>
                {title}
              </Button>
            </span>
          </div>
        </li>
    )

    return (
      <li>
        <div className="treeview__level" data-level={title ? title[0].toUpperCase() : "+"}>
          <span className="level-title" onClick={() => {
            setShowSiblings(s => !s);
            onSelectedNode && onSelectedNode(path);
          }}>
            {title}
          </span>
          <div className="treeview__level-btns">
            <Button onClick={() => {
              setShowSiblings(s => !s);
              onSelectedNode && onSelectedNode(path);
            }}>
              <FontAwesomeIcon icon={showSiblings?faMinus:faPlus}/>
            </Button>
            <div className={"btn btn-default btn-sm level-same" + (showSiblings?" in":"")}>
              <span onClick={() => setShowNewTemplate(true)}>Add Template</span>
            </div>
            <div className={"btn btn-default btn-sm level-sub" + (showSiblings?" in":"")}>
              <span onClick={() => setShowNewSubNode(true)}>Add Sub Level</span>
            </div>
          </div>
        </div>

        <ul>
        {
            showNewSubNode === true &&
            <li>
              <div className="treeview__level" data-level={""}>
                <FormControl
                  ref={newNodeRef}
                  placeholder={"new node"}
                  onKeyPress={event => {
                    if (event.charCode === 13) {
                      const name = ReactDOM.findDOMNode(newNodeRef.current).value;
                      if(name.length !== 0) {
                        onNewLevel((path ? (path + ".") : "") + name);
                      }
                      setShowNewSubNode(false);
                    }
                  }}
                />
              </div>
            </li>
        }
        {
            showNewTemplate &&
            <li>
              <div className="treeview__level" data-level={""}>
                <FormControl
                  ref={newTemplateRef}
                  placeholder={"new template"}
                  onKeyPress={event => {
                    if (event.charCode === 13) {
                      const name = ReactDOM.findDOMNode(newTemplateRef.current).value;
                      if(name.length !== 0) {
                        onNewTemplate((path ? (path + ".") : "") + name);
                      }
                      setShowNewTemplate(false);
                    }
                  }}
                />
              </div>
            </li>
        }
        {
          showSiblings && Object.entries(children)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) =>
            <TemplateTree
              parent={path}
              title={key}
              children={value}
              onNewTemplate={onNewTemplate}
              onNewLevel={onNewLevel}
              onSelected={onSelected}
              onSelectedNode={onSelectedNode}
            />
          )
        }
        </ul>

      </li>
    )
}

function list2tree(templates) {
  return templates.reduce((p, t) => {
    const parts = t.key.split(".");
    let c = p;
    for(let i = 0; i < parts.length-1; i++) {
      if (!c.hasOwnProperty(parts[i])) {
        c[parts[i]] = {};
      }
      c = c[parts[i]];
    }
    c[parts[parts.length-1]] = t;
    return p;
  }, {"": {}});
}

function getTemplatesUnderNode(templates, node) {
  let c = templates;
  const parts = node.split(".");
  for(let i = 0; i < parts.length; i++) {
    if (!c.hasOwnProperty(parts[i])) {
      c[parts[i]] = {};
    }
    c = c[parts[i]];
  }
  if(c.key !== undefined) {
    return [c];
  }

  return Object.entries(c).reduce((p, [k, v]) => {
    if(v.key !== undefined) {
      p.push(v);
    } else {
      const subT = getTemplatesUnderNode(templates, (node?(node + "."):"") + k);
      p = [...p, ...subT]
    }
    return p;
  }, []);
}

function findTemplate(templates, key) {
  let c = templates;
  const parts = key.split(".");
  for(let i = 0; i < parts.length; i++) {
    if (!c.hasOwnProperty(parts[i])) {
      return undefined
    }
    c = c[parts[i]];
  }
  if(c.key !== undefined) {
    return c;
  }
  return undefined
}

export default function Templates() {
    const [templates, setTemplates] = useState({});
    const [showTemplate, setShowTemplate] = useState();
    const [showNode, setShowNode] = useState();
    const refresh = () => fetchTemplates().then(t => setTemplates(list2tree(t)));

    useEffect(() => {
      refresh();
      document.title = "Templates";
    }, []);

    useEffect(() => {
      showNode && setShowTemplate(null)
    }, [showNode]);

    useEffect(() => {
      showTemplate && setShowNode(null)
    }, [showTemplate]);

    const importFile = useCallback(f => {
      readFile(f).then(r => JSON.parse(r)).then(c => {
        Promise.all(c.templates.map(t => {
          const tmpl = findTemplate(templates, t.key);
          if(tmpl !== undefined) {
            return updateTemplate(tmpl.id, {template: t.template})
          } else {
            return newTemplate({key: t.key, template: t.template})
          }
        })).then(() => refresh())
      }).catch(error => {
        NotificationsManager.error(<FormattedMessage id="fail-import-templates" defaultMessage="Fail to import templates"/>, error)
      })
    }, [templates])

    return (
        <div>
          <Breadcrumb>
            <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
            <Breadcrumb.Item active><FormattedMessage id="templates" defaultMessage="Templates"/></Breadcrumb.Item>
          </Breadcrumb>

          <Panel>
            <Panel.Body>
              <Row>
                <Col sm={6} md={4} lg={4}>
                  <div className="treeview js-treeview">
                    <ul>
                      {
                        Object.entries(templates)
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([key, value]) => (
                          // templateTree(key, value)
                          <TemplateTree
                            title={key}
                            children={value}
                            onNewTemplate={path => {
                              const newT = {key: path, template: ""};

                              newTemplate(newT, id => {
                                refresh();
                                setShowTemplate(update(newT, {$merge: {id: id}}));
                              })
                            }}
                            onNewLevel={path => {
                              const parts = path.split(".");
                              let c = templates;
                              for(let i = 0; i < parts.length; i++) {
                                if (!c.hasOwnProperty(parts[i])) {
                                  c[parts[i]] = {};
                                }
                                c = c[parts[i]];
                              }
                              setTemplates(JSON.parse(JSON.stringify(templates)));
                            }}
                            onSelected={setShowTemplate}
                            onSelectedNode={setShowNode}
                          />
                        ))
                      }
                    </ul>
                  </div>
                </Col>
                <Col sm={6} md={8} lg={8}>
                  {showTemplate &&
                    <Template
                      label={showTemplate.key}
                      id={showTemplate.id}
                      onUpdate={() => refresh()}
                      onDelete={() => refresh().then(() => setShowTemplate(undefined))}
                      onImport={importFile}
                      onExport={template =>
                        downloadJson(
                          `template_${template.key.replaceAll(".", "-")}`,
                          {templates: [{template: template.template, key: template.key}]},
                        )
                      }
                    />
                  }
                  {showNode &&
                    <TemplateParent
                      label={showNode}
                      onRename={newPath => {
                        //get templates under old node
                        Promise.all(getTemplatesUnderNode(templates, showNode).map(t =>
                          // loop over, replace the key and save
                          updateTemplate(t.id, update(t, {$merge: {key: t.key.replace(showNode, newPath)}}))
                        )).then(() => refresh())
                          .then(() => setShowNode(newPath))
                      }}
                      onDelete={path => {
                        // get templates under node
                        Promise.all(getTemplatesUnderNode(templates, path).map(t =>
                          // loop over, delete
                          deleteTemplate(t.id)
                        )).then(() => refresh())
                          .then(() => setShowTemplate(undefined));
                      }}
                      onImport={importFile}
                      onExport={path => {
                        // get templates under node
                        Promise.all(getTemplatesUnderNode(templates, path).map(t =>
                          // loop over, compile them
                          fetchTemplate(t.id)
                        )).then(results =>
                          downloadJson(`templates_${path}`, {templates: results.map(r => r.template)})
                        )
                      }}
                    />
                  }
                </Col>
              </Row>
            </Panel.Body>
          </Panel>
        </div>
    )
}