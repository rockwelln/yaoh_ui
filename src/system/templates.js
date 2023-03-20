import React, {useCallback, useEffect, useRef, useState} from "react";
import {API_URL_PREFIX, AuthServiceManager, fetch_delete, fetch_get, fetch_post, fetch_put, NotificationsManager, parseJSON} from "../utils";
import {FormattedMessage} from "react-intl";
import {MenuItem, Modal, Panel, SplitButton} from "react-bootstrap";
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
import { useDropzone } from "react-dropzone";

import "./template.css";
import {faFile, faMinus, faPlus, faFolder, faDownload, faUpload} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import ReactDOM from "react-dom";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import {readFile} from "../orchestration/startup_events";
import {FoldableButton} from "../utils/button";
import { Base64 } from "js-base64";


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
            if(["key", "template", "type"].includes(b)) {
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
function Template({label, id, type, onDelete, onUpdate, onExport, onRawExport}) {
  const [template, setTemplate] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if(type === "jinja") {
      fetchTemplate(id).then(({template}) => {
        setTemplate(template)
      })
    } else {
      setTemplate({id: id, key: label, type: type})
    }
  }, [label, id, type]);

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
                value={template.key || ""} />
            </Col>

            <Col>
              <ButtonToolbar>
                <ButtonGroup>
                  <Button
                    onClick={() => setShowImportModal(true)}
                    bsStyle={"warning"}>
                    <FontAwesomeIcon icon={faUpload}/> Import
                  </Button>

                  <SplitButton
                    id={"export-template"}
                    bsStyle="warning"
                    title={<><FontAwesomeIcon icon={faDownload}/> Export</>}
                    onClick={() => onExport(template)}>
                      <MenuItem
                        id={"export-template-raw"}
                        onClick={() => onRawExport(template)}>
                        <FormattedMessage id="raw" defaultMessage="Raw" />
                      </MenuItem>
                  </SplitButton>
                </ButtonGroup>

                <ButtonGroup>
                  <DeleteConfirmButton
                    resourceName={label}
                    button={"Delete"}
                    onConfirm={() => deleteTemplate(id).then(() => onDelete(label))} />
                </ButtonGroup>

                <ButtonGroup>
                  <Button
                    onClick={() => {
                      const o = Object.assign({}, template)
                      if(o.type !== "jinja" && o.template !== undefined) {
                        delete o.template
                      } else if(o.type === "jinja") {
                        o.template = Base64.encode(o.template)
                      }
                      updateTemplate(id, o, onUpdate)
                    }}
                    bsStyle={"primary"}>
                    Save
                  </Button>
                </ButtonGroup>

                <ButtonGroup>
                  <FormControl
                    type="text"
                    readOnly={true}
                    value={template.type || ""} />
                </ButtonGroup>
              </ButtonToolbar>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col sm={12}>
              { template.type === "jinja" ? <FormControl
                  componentClass="textarea"
                  style={{resize: "vertical"}}
                  rows={25}
                  placeholder={TEMPLATE_SAMPLE}
                  onChange={e => setTemplate(update(template, {$merge: {template: e.target.value}}))}
                  value={template.template} /> :
                <div style={{position: "relative", height: 250}}>
                  <div style={{ 
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    }}>
                    <FontAwesomeIcon icon={faFile} aria-hidden="true" style={{'fontSize': '60px', color: "grey"}} />
                  </div>
                </div>
              }
            </Col>
          </FormGroup>
        </Form>
        
        <ImportTemplateModal
          show={showImportModal}
          onHide={() => setShowImportModal(false)}
          onImport={(name, type, content) => {
            if(type === "text/plain") {
              type = "jinja";
            }
            if(name && name !== template.key) {
              NotificationsManager.error(`template name don't match ${name} vs ${template.key}`)
              return
            }
            updateTemplate(
              template.id,
              {type: type, template: content},
              () => {
                if(type === "jinja") {
                  fetchTemplate(id).then(({template}) => {
                    setTemplate(template)
                  })
                } else {
                  setTemplate({id: id, key: label, type: type})
                }
                setShowImportModal(false);
              },
            );
          }} />
      </Panel.Body>
    </Panel>
  )
}

function TemplateParent({label, onDelete, onRename, onImport}) {
  const [path, setPath] = useState(label);
  const [showImportModal, setShowImportModal] = useState(false);

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
                    onClick={() => setShowImportModal(true)}
                    bsStyle={"warning"}>
                    <FontAwesomeIcon icon={faUpload}/> Import
                  </Button>
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

        <ImportTemplatesModal
          show={showImportModal}
          onHide={() => setShowImportModal(false)}
          onImport={onImport} />
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
            <div style={{position: "absolute", display: "inline-block"}}>
              <FoldableButton
                icon={<FontAwesomeIcon icon={faFolder}/>}
                style={{display: !showSiblings?"none":"inline-block", marginLeft: "10px"}}
                onClick={() => setShowNewSubNode(true)}
                >New folder</FoldableButton>
              <FoldableButton
                icon={<FontAwesomeIcon icon={faFile}/>}
                style={{display: !showSiblings?"none":"inline-block", marginLeft: "10px"}}
                onClick={() => setShowNewTemplate(true)}
                >New template</FoldableButton>
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
              key={key}
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

function ImportTemplatesModal({show, onHide, onImport}) {
  const onDropRejected = useCallback(() => {
    NotificationsManager.error("File type rejected");
  }, []);

  const onDrop = useCallback((files) => {
    files.forEach(file => {
      onImport(file)
    });
  }, [onImport]);

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({    
    onDrop,
    accept: ['.json'],
    onDropRejected,
  });

  return (
    <Modal show={show} onHide={() => onHide(true)} backdrop={false} bsSize="large">
      <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage id="import" defaultMessage="Import"/>
          </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <section className="dropcontainer" >
            <div {...getRootProps({className: 'dropzone'})} >
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
          </section>
        </Form>
      </Modal.Body>
    </Modal>
  )
}
	
function arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}

function ImportTemplateModal({show, onHide, onImport}) {
  const onDropRejected = useCallback(() => {
    NotificationsManager.error("file type rejected");
  }, []);
  const onDrop = useCallback((files) => {
    files.forEach(file => {
      if(![
        "text/plain",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/json",
      ].includes(file.type)) {
        console.log(file.type);
        NotificationsManager.error("Import failed", `${file.type} is not allowed (only plain text and excel files)`)
        return
      }

      if(file.size > 1000000) {
        NotificationsManager.error(`File too big (should be < 1MB)`)
        return
      }

      const reader = new FileReader()

      reader.onabort = () => console.error('file reading was aborted')
      reader.onerror = () => console.error('file reading has failed')
      

      if(file.type === "application/json") {
        reader.onload = () => {
          try {
            const o = JSON.parse(reader.result).template;
            onImport(o.key, o.type || "jinja", o.template);
          } catch (e) {
            NotificationsManager.error("Failed to import", e.message);
          }
        }
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          onImport(null, file.type, arrayBufferToBase64(reader.result))
        }
        reader.readAsArrayBuffer(file);
      }
    });
  }, [onImport]);

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({    
    maxFiles:1,
    onDrop,
    accept: ['.xlsx', '.txt', '.jinja2', '.jinja', '.json'],
    onDropRejected,
  });

  return (
    <Modal show={show} onHide={() => onHide(true)} backdrop={false} bsSize="large">
      <Modal.Header closeButton>
          <Modal.Title>
              <FormattedMessage id="import" defaultMessage="Import"/>
          </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <section className="dropcontainer" >
            <div {...getRootProps({className: 'dropzone'})} >
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
          </section>
        </Form>
      </Modal.Body>
    </Modal>
  )
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
        let templates = c.templates || [c.template];
        
        Promise.all(templates?.map(t => {
          const tmpl = findTemplate(templates, t.key);
          if(tmpl !== undefined) {
            return updateTemplate(tmpl.id, {template: t.template})
          } else {
            return newTemplate({key: t.key, template: t.template, type: t.type || "jinja"})
          }
        })).then(() => refresh())
      }).catch(error => {
        NotificationsManager.error(<FormattedMessage id="fail-import-templates" defaultMessage="Fail to import templates"/>, error.message)
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
                            key={key}
                            title={key}
                            children={value}
                            onNewTemplate={path => {
                              const newT = {key: path, template: "", type: "jinja"};

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
                <Col sm={6} md={8} lg={8} style={{position: "sticky", top: "1rem"}}>
                  {showTemplate &&
                    <Template
                      label={showTemplate.key}
                      id={showTemplate.id}
                      type={showTemplate.type}
                      onUpdate={() => refresh()}
                      onDelete={() => refresh().then(() => setShowTemplate(undefined))}
                      onExport={template =>
                        AuthServiceManager.getValidToken().then(token => {
                          window.location=`${API_URL_PREFIX}/api/v01/templates/${template.id}?as=json&auth_token=${token}`
                        })
                      }
                      onRawExport={template =>
                        AuthServiceManager.getValidToken().then(token => {
                          window.location=`${API_URL_PREFIX}/api/v01/templates/${template.id}?as=raw&auth_token=${token}`
                        })
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
                    />
                  }
                </Col>
              </Row>
            </Panel.Body>
          </Panel>
        </div>
    )
}