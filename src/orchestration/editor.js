const okPic = require("../images/ok.png");
const errPic = require("../images/error.png");
const runPic = require("../images/run.png");

const BASIC_CELL_HEIGHT = 120;
const CHAR_HEIGHT_APPROX = 7.5;
const BASE_Y = 35;

const mxUtils = window.mxUtils;
const mxClient = window.mxClient;
const mxEdgeStyle = window.mxEdgeStyle;
const mxConstants = window.mxConstants;
const mxEditor = window.mxEditor;
const mxPerimeter = window.mxPerimeter;
const mxGraphHandler = window.mxGraphHandler;
const mxDivResizer = window.mxDivResizer;
const mxMultiplicity = window.mxMultiplicity;
const mxEvent = window.mxEvent;
const mxPoint = window.mxPoint;
const mxImage = window.mxImage;
const mxCellOverlay = window.mxCellOverlay;


function min_cell_height(cell, name) {
    let c_height = cell.outputs.reduce(
        (height, output) => output.length * CHAR_HEIGHT_APPROX > height?output.length * CHAR_HEIGHT_APPROX:height, cell.height || BASIC_CELL_HEIGHT
    );
    if(cell.original_name) {
        c_height = Math.max(c_height, cell.original_name.length * CHAR_HEIGHT_APPROX);
    }
    if(name) {
        c_height = Math.max(c_height, name.length * CHAR_HEIGHT_APPROX);
    }
    return c_height;
}


function draw_editor(container, activity, handlers, placeholders, props) {
    console.log("rendering 2");
    let toolbar = placeholders.toolbar;
    let title = placeholders.title;

    const getData = handlers.get;
    const getCellDefinitions = handlers.getCellDefinitions;
    const getEntities = handlers.getEntities;
    const saveData = handlers.onSave;
    const deleteHandler = handlers.onDelete;

    container.innerHTML = ''; // cleanup the element;
    if (toolbar !== undefined) {
        toolbar.innerHTML = ''; // cleanup the element;
    }

    if (!mxClient.isBrowserSupported())
    {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!');
        return;
    }

    // Enables guides
    mxGraphHandler.prototype.guidesEnabled = true;

    // Workaround for Internet Explorer ignoring certain CSS directives
    if (mxClient.IS_QUIRKS)
    {
        document.body.style.overflow = 'hidden';
        new mxDivResizer(container);
        new mxDivResizer(toolbar);
    }

    let editor = new mxEditor();
    let graph = editor.graph;
    let readOnly = props.readOnly === undefined ? false : props.readOnly;
    let height = props.height === undefined ? 600 : props.height;
    // Centers the port icon on the target port
    graph.connectionHandler.targetConnectImage = true;
    // Does not allow dangling edges
    graph.setAllowDanglingEdges(false);
    // Allow new connections
    graph.setConnectable(true);
    //graph.setTooltips(true);
    editor.setGraphContainer(container);
    // allow HTML tags in the cell labels
    graph.setHtmlLabels(true);
    // force the width of the container
    graph.doResizeContainer(container.getBoundingClientRect().width, height);
    // let the mouse click move the whole graph
    graph.panningHandler.useLeftButtonForPanning = true;
    graph.setPanning(true);
    graph.setEnabled(!readOnly);
    graph.pageFormat = mxConstants.PAGE_FORMAT_A4_LANDSCAPE;

    //let config = mxUtils.load(
    //    'editors/config/keyhandler-commons.xml').getDocumentElement();
    //editor.configure(config);

    // Does not allow selection of locked cells
    // graph.isCellSelectable = function(cell)
    // {
    //     return !this.isCellLocked(cell);
    // };

    // Ports are used as terminals for edges, sources and targets
    graph.isPort = function(cell)
    {
        let geo = this.getCellGeometry(cell);
        return (geo !== null) ? geo.relative : false;
    };

    graph.setMultigraph(false);
    // set the validation rules:
    graph.multiplicities = [];
    graph.multiplicities.push(new mxMultiplicity(
				   true, 'Target', null, null, 0, 0, null,
				   'Target Must Never be the start of an edge',  //
				   null));
    graph.multiplicities.push(new mxMultiplicity(
				   false, 'Source', null, null, 0, 0, null,
				   'Source cannot be the end of an edge',  //
				   null));
    // Installs automatic validation (use editor.validation = true if you are using an mxEditor instance)
    editor.validation = true;

    // Implements a tooltip that shows the actual
    // source and target of an edge
    //graph.getTooltipForCell = function(cell)
    //{
    //    if (this.model.isEdge(cell))
    //    {
    //        return this.convertValueToString(this.model.getTerminal(cell, true)) + ' => ' +
    //            this.convertValueToString(this.model.getTerminal(cell, false))
    //    }
    //    return mxGraph.prototype.getTooltipForCell.apply(this, arguments);
    //};

    configureStylesheet(graph);

    // use the 'label' attribute of the cells as shown value (but allow other attributes ;-))
    let convertValueToString = graph.convertValueToString; // store the original function
    graph.convertValueToString = function(cell)
    {
      if (mxUtils.isNode(cell.value))
      {
        if(cell.getAttribute('original_name', '') === 'start' || cell.getAttribute('original_name', '') === 'end')
            return cell.getAttribute('label', '');
        else {
            let div = document.createElement('div');
            div.innerHTML = cell.getAttribute('label');
            mxUtils.br(div);
            let i = document.createElement('i');
            i.innerHTML = '&lt;' + cell.getAttribute('original_name', '') + '&gt;';
            div.appendChild(i);
            return div;
        }
      }
      return convertValueToString.apply(this, arguments); // call super
    };

    let cellLabelChanged = graph.cellLabelChanged; // store the original function
    graph.cellLabelChanged = function(cell, newValue, autoSize)
    {
      if (mxUtils.isNode(cell.value))
      {
        // Clones the value for correct undo/redo
        let elt = cell.value.cloneNode(true);
        elt.setAttribute('label', newValue);
        newValue = elt;
      }

      cellLabelChanged.apply(this, arguments); // call super
    };

    let spacer = document.createElement('div');
    spacer.style.display = 'inline';
    spacer.style.padding = '6px';

    let modal = document.createElement('div');
    modal.className = 'modal';
    document.body.appendChild(modal);

    //see process details
    graph.dblClick = function(evt, cell)
    {
        // Do not fire a DOUBLE_CLICK event here as mxEditor will
        // consume the event and start the in-place editor.
        if (!mxEvent.isConsumed(evt) &&
            cell !== null && cell !== undefined &&
            this.isCellEditable(cell) && !this.model.isEdge(cell))
        {
            if(getCellDefinitions) {
                getCellDefinitions(data_cells =>
                    getEntities(data_entities => {
                        editCellProperty(cell, modal, spacer, this.isEnabled(), data_cells.concat(data_entities), this.getModel().cells,
                            () => {
                                const r = getDefinition(editor);
                                updateModel(r.activity, {clear: true, nofit: true});
                            },
                            this.getModel().getOutgoingEdges(cell).map(e => {
                                const sourcePortId = e.style.split(';')
                                    .map(s => s.split('='))
                                    .filter(s => s[0] === 'sourcePort')[0][1];

                                return [
                                    e.source.children.find(c => c.id === sourcePortId).value,
                                    e.target.getAttribute('label')
                                ]
                            }), props)
                        ;
                    })
                )
            } else {
                editCellProperty(cell, modal, spacer, this.isEnabled(), [], this.getModel().cells, undefined, props)
            }
        }
        // Disables any default behaviour for the double click
        mxEvent.consume(evt);
    };

    function getDefinition(editor) {
        let model = editor.graph.getModel();
        console.log(model.cells);
        let activity = Object.assign({}, editor.graph.getDefaultParent().originalActivity);
        activity.name = title.value;
        activity.definition = {};
        activity.definition.cells = {};
        activity.definition.entities = [];
        activity.definition.transitions = [];
        let hasAStart = false;
        for (let cellId in model.cells) {
            if (model.cells.hasOwnProperty(cellId)) {
                let c = model.cells[cellId];
                if(c.geometry === undefined || c.getAttribute('label') === undefined) continue;
                let outputs = c.getAttribute('outputs') || "";
                let cell = {
                    name: c.getAttribute('label'),
                    original_name: c.getAttribute('original_name'),
                    x: c.geometry.x,
                    y: c.geometry.y,
                    params: {},
                    outputs: outputs.split(",").filter(o => o !== ""),
                };
                if(c.getAttribute('original_name') === 'start') hasAStart = true;
                if(c.hasAttribute('attrList') && c.getAttribute('attrList') !== undefined) {
                    cell.params = c.getAttribute('attrList').split(",").reduce((xa, a) => {xa[a] = c.getAttribute(a); return xa;}, {});
                }

                if(c.style === 'entity') activity.definition.entities.push(cell);
                else activity.definition.cells[c.getAttribute('label')] = cell;

                activity.definition.transitions = activity.definition.transitions.concat(model.getOutgoingEdges(c).map((e) => {
                    let sourcePortId = e.style.split(';')
                        .map(s => s.split('='))
                        .filter(s => s[0] === 'sourcePort')[0][1];

                    return [e.source.getAttribute('label') + '.' + e.source.children.find(c => c.id === sourcePortId).value,
                        e.target.getAttribute('label')
                    ]
                }));
            }
        }
        return {activity: activity, hasAStart: hasAStart};
    }

    // Defines export XML action
    editor.addAction('export', function(editor, cell)
    {
        if(title.value.length === 0) {
            alert("The workflow need a name");
            return;
        }
        const r = getDefinition(editor);
        if(!r.hasAStart) {
            alert("the workflow need a `start`");
            return;
        }
        Object.keys(r.activity.definition.cells).map(c => delete r.activity.definition.cells[c].name);

        saveData(r.activity, () => {
            // update the original activity stored *if* everything went well.
            editor.graph.getDefaultParent().originalActivity = r.activity;
        });
    });
    editor.addAction('add_process', (editor, cell) => {
        getCellDefinitions(data_cells => {
            getEntities(data_entities => {
                const model = editor.graph.getModel();
                newCell(data_cells, model.cells, modal, editor, spacer, data_entities, props);
            });
        });
    });
    editor.addAction('download_definition', (editor, cell) => {
        const r = getDefinition(editor);
        const text = JSON.stringify(r.activity, null, 4);
        const filename = `${title.value}.json`;

        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    });
    editor.addAction('upload_definition', (editor, cell) => {
        if (typeof window.FileReader !== 'function') {
          alert("The file API isn't supported on this browser yet.");
          return;
        }
        uploadDefinition(modal, spacer, editor, updateModel);
    });
    if(toolbar !== undefined) {
        if(saveData !== undefined) {
            addToolbarButton(editor, toolbar, 'export', 'Save');
        }
        if(deleteHandler !== undefined) {
            addToolbarButton(editor, toolbar, null, 'Delete', null, false, deleteHandler);
        }
        if(saveData !== undefined || deleteHandler !== undefined) {
            toolbar.appendChild(spacer.cloneNode(true));
        }
        if(getCellDefinitions !== undefined) {
            addToolbarButton(editor, toolbar, 'add_process', '+', null, false, null, 'add a process');
            toolbar.appendChild(spacer.cloneNode(true));
        }
        if(saveData !== undefined) {
            addToolbarButton(editor, toolbar, 'delete', '✘', null, false, null, 'delete an element');
            toolbar.appendChild(spacer.cloneNode(true));
            addToolbarButton(editor, toolbar, 'undo', '⤾');
            addToolbarButton(editor, toolbar, 'redo', '⤿');
            toolbar.appendChild(spacer.cloneNode(true));
            // devnote: not needed to be able to print out outside the editor (for now)
            // addToolbarButton(editor, toolbar, 'print', '🖨');
            toolbar.appendChild(spacer.cloneNode(true));
        }
        addToolbarButton(editor, toolbar, 'zoomIn', '🔍 +', null, false, null, 'zoom in');
        addToolbarButton(editor, toolbar, 'zoomOut', '🔍 -', null, false, null, 'zoom out');
        if(saveData !== undefined) {
            // devnote: not needed to be able to fit ++ outside the editor (for now)
            addToolbarButton(editor, toolbar, 'actualSize', '1:1', null, false, null, 'actual size');
            addToolbarButton(editor, toolbar, 'fit', 'Fit');
        }
        addToolbarButton(editor, toolbar, 'show', '👓');
        if(saveData !== undefined) {
            const saveElt = document.createElement('span');
            saveElt.className = 'glyphicon glyphicon-save';
            addToolbarButton(editor, toolbar, 'download_definition', '', saveElt, false, null, 'download the definition');
            const openElt = document.createElement('span');
            openElt.className = 'glyphicon glyphicon-open';
            addToolbarButton(editor, toolbar, 'upload_definition', '', openElt, false, null, 'upload a definition');
        }
    }

    let xmlDocument = mxUtils.createXmlDocument();
    let sourceNode = xmlDocument.createElement('Source');
    let targetNode = xmlDocument.createElement('Target');
    let cellNode = xmlDocument.createElement('cell');
    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    let parent = graph.getDefaultParent();

    function updateModel(activity, options) {
        // Adds activity (cells) to the model.
        if(title !== undefined) {
            title.value = activity.name;
        }

        let data = activity.definition;
        // ensure the definition is an object
        if(typeof data === "string") {
            data = JSON.parse(data);
        }

        // clean the cells if needed
        if(options && options.clear) {
            graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
        }

        graph.getModel().beginUpdate();
        try
        {
            let endpoints = [];
            parent.originalActivity = activity;
            data.cells && Object.keys(data.cells).map(name => {
                const c = data.cells[name];
                let node = cellNode.cloneNode(true);
                node.setAttribute('label', name);
                node.setAttribute('original_name', c.original_name);
                node.setAttribute('outputs', c.outputs);
                if(c.params !== undefined && Object.keys(c.params).length !== 0) {
                    node.setAttribute('attrList', Object.keys(c.params).map(param_name => {
                        const value = c.params[param_name];
                        node.setAttribute(param_name, value);
                        return param_name;
                    }))
                }
                let v = undefined;
                let v10 = undefined;
                let baseY = BASE_Y;
                switch(c.original_name) {
                    case 'start':
                        v = graph.insertVertex(parent, null, node, c.x, c.y, c.height || 100, 25, 'start');
                        v.setConnectable(false);
                        baseY = 7;
                        break;
                    case 'end':
                        v = graph.insertVertex(parent, null, node, c.x, c.y, c.height || 100, 25, 'end');
                        v.setConnectable(false);

                        v10 = graph.insertVertex(v, null, targetNode.cloneNode(true), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                        v10.geometry.offset = new mxPoint(-5, 9);
                        endpoints.push([name, v10]);
                        break;
                    default:
                        v = graph.insertVertex(parent, null, node, c.x, c.y, min_cell_height(c, name), baseY + (20 * c.outputs.length) + 15);
                        v.setConnectable(false);

                        v10 = graph.insertVertex(v, null, targetNode.cloneNode(true), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                        v10.geometry.offset = new mxPoint(-5, 15);
                        endpoints.push([name, v10]);
                        break;
                }

                for(let i=0; i < c.outputs.length; i++) {
                    let o = c.outputs[i];
                    let p = graph.insertVertex(v, null, sourceNode.cloneNode(true), 1, 0, 10, 10, 'port;source;align=right;spacingRight=18', true);

                    p.value = o;
                    p.geometry.offset = new mxPoint(-5, baseY + (i * 20));
                    endpoints.push([name + '.' + o, p]);
                }

                graph.removeCellOverlays(v);
                switch(c.state) {
                    case 'RUN': graph.addCellOverlay(v, createOverlay(new mxImage(runPic, 32, 32), c.state)); break;
                    case 'ERROR': graph.addCellOverlay(v, createOverlay(new mxImage(errPic, 32, 32), c.state)); break;
                    case 'OK': graph.addCellOverlay(v, createOverlay(new mxImage(okPic, 32, 32), c.state)); break;
                    default: break;
                }
                return null;
            });

            data.entities && data.entities.map((e) => {
                let node = cellNode.cloneNode(true);
                node.setAttribute('label', e.name);
                node.setAttribute('original_name', e.original_name);
                node.setAttribute('outputs', e.outputs);

                let v = graph.insertVertex(parent, null, node, e.x, e.y, e.height || BASIC_CELL_HEIGHT, BASE_Y + (20 * e.outputs.length) + 15, 'entity');
                v.setConnectable(false);

                let v10 = graph.insertVertex(v, null, targetNode.cloneNode(true), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                v10.geometry.offset = new mxPoint(-5, 15);
                endpoints.push([e.name, v10]);

                for(let i=0; i < e.outputs.length; i++) {
                    let o = e.outputs[i];
                    let p = graph.insertVertex(v, null, sourceNode.cloneNode(true), 1, 0, 10, 10, 'port;source;align=right;spacingRight=18', true);

                    p.value = o;
                    p.geometry.offset = new mxPoint(-5, BASE_Y + (i * 20));
                    endpoints.push([e.name + '.' + o, p]);
                }
                return null;
            });

            // add transitions to the model.
            data.transitions.map((t) => {
                const s = t[0]; // source
                const d = t[1]; // destination
                const extra = t[2]; // some extra information

                const a = endpoints.find(e => s === e[0]);
                const b = endpoints.find(e => d === e[0]);
                if(a === undefined || b === undefined) {
                    console.error('endpoints a or b is not found in reference list:', s, d, endpoints);
                    return null;
                }

                let style = undefined;
                if(extra && extra.status !== undefined && (extra.status === 'OK' || extra.status === 'ERROR')) {
                    const color = extra.status === 'OK'?(s.indexOf('.rollback') !== -1?'#ffbd53':'#32cd32'):'#ff0000';
                    style = `strokeColor=${color};fillColor=${color};`
                }
                graph.insertEdge(parent, null, '',  a[1], b[1], style);
                return null;
            })
        }
        finally
        {
            // Updates the display
            graph.getModel().endUpdate();
        }

        if(options && options.nofit) return;
        // fit and center the graph (see: https://jgraph.github.io/mxgraph/docs/js-api/files/view/mxGraph-js.html#mxGraph.fit)
        var margin = 2;
        var max = 1;

        var bounds = graph.getGraphBounds();
        var cw = graph.container.clientWidth - margin;
        var ch = graph.container.clientHeight - margin;
        var w = bounds.width / graph.view.scale;
        var h = bounds.height / graph.view.scale;
        var s = Math.min(max, Math.min(cw / w, ch / h));

        graph.view.scaleAndTranslate(s,
          (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
          (margin + ch - h * s) / (4 * s) - bounds.y / graph.view.scale
          /*originally: (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale*/);
    }
    if(activity.id) {
        console.log('getting data');
        getData(activity.id, updateModel);
    } else {
        console.log('new activity');
        updateModel(activity);
    }
}

/**
 * Creates an overlay object using the given tooltip and text for the alert window
 * which is being displayed on click.
 */
function createOverlay(image, tooltip)
{
    let overlay = new mxCellOverlay(image, tooltip);

    // Installs a handler for clicks on the overlay
    tooltip && overlay.addListener(mxEvent.CLICK, function(sender, evt)
    {
        mxUtils.alert(tooltip + '\nLast update: ' + new Date());
    });

    return overlay;
}

function prepareModal(modal) {
    const close_modal = () => {
        modal.className = 'modal fade';
        setTimeout(() => {modal.style.display = "none"; modal.className = 'modal';}, 300)
    };
    modal.innerHTML = '';
    let dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    modal.appendChild(dialog);

    let content = document.createElement('div');
    content.className = 'modal-content';
    dialog.appendChild(content);

    let hdr = document.createElement('div');
    hdr.className = 'modal-header';
    content.appendChild(hdr);

    let b = document.createElement('span');
    b.className = 'close';
    b.innerHTML = '×';
    b.onclick = close_modal;
    hdr.appendChild(b);

    let bdy = document.createElement('div');
    bdy.className = 'modal-body';
    content.appendChild(bdy);

    let ftr = document.createElement('div');
    ftr.className = 'modal-footer';
    content.appendChild(ftr);

    document.body.addEventListener('keydown', (e) => (
        e.keyCode === 27 && close_modal()
    ));

    return [hdr, bdy]
}

function uploadDefinition(modal, spacer, editor, updateModel) {
    let upload_definition = prepareModal(modal);
    let modalHeader = upload_definition[0];
    let modalBody = upload_definition[1];

    // set the header
    let h = document.createElement('h3');
    h.innerHTML = '<i>Upload a definition</i>';
    modalHeader.appendChild(h);

    let help = document.createElement('p');
    help.innerHTML = 'Careful, the workflow loaded are not automatically saved!';
    modalBody.appendChild(help);

    let form = document.createElement('form');
    modalBody.appendChild(form);

    // set the implementation
    let gp = document.createElement('div');
    gp.className = 'form-group';

    let name = document.createElement('label');
    name.innerHTML = 'Definition file';
    gp.appendChild(name);

    let value = document.createElement('input');
    value.id = 'filename';
    value.className = 'form-control';
    value.type = 'file';
    value.accept = '.json';

    gp.appendChild(value);
    form.appendChild(gp);

    let btn = document.createElement('button');
    btn.className = 'btn btn-success';
    btn.innerHTML = 'Load';
    btn.onclick = function(e) {
        e.preventDefault();

        if (!value.files) {
          alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!value.files[0]) {
          alert("Please select a file before clicking 'Load'");
          return;
        }
        else {
          let file = value.files[0];
          let fr = new FileReader();
          fr.onload = e => {
               const activity = JSON.parse(e.target.result);
               console.log(activity);
               updateModel(activity, {clear: true});
          };
          fr.readAsText(file);
        }

        modal.style.display = "none";
    };
    form.appendChild(btn);
    form.appendChild(spacer.cloneNode(true));

    // cancel action
    btn = document.createElement('button');
    btn.className = 'btn btn-warning';
    btn.innerHTML = 'Cancel';
    btn.onclick = function(e) {
        e.preventDefault();
        modal.style.display = "none";
    };
    form.appendChild(btn);

    modal.style.display = "block";
    modal.style.overflowY = "scroll";
}

function isValid(p, v) {
    if(p.mandatory && v.length === 0) {
        alert(`The element ${p.name || p} is mandatory`);
        return false;
    }
    switch (p.validation) {
        case 'int':
            if(!/\d+/.test(v)) {
                alert(`Invalid number: ${v}`);
                return false;
            }
            break;
        case 'timeout':
            if(!/\d+ (business|)\s*(hours|days)/.test(v)) {
                alert(`Invalid timeout: ${v} - should be "(number) (business|) (hours|days)"`);
                return false;
            }
            break;
        case 'email':
            if(!/.+@.+\.[a-z]+/.test(v)) {
                alert(`Invalid email: ${v}`);
                return false;
            }
            break;
        default:
            break;
    }
    return true;
}

function getHelpbox(nature, helpText) {
    const span = document.createElement("span");
    span.style = "color: grey";
    span.className = "help-block";
    if(helpText) {
        span.innerText = helpText;
    } else {
        switch (nature) {
            case "python_bool":
                span.innerText = "A piece of python code which can be evaluated into True or False (ex: request.body['flag'] == '1')";
                break;
            case "url":
                span.innerText = "A jinja2 template which output a valid and complete URL";
                break;
            case "json":
                span.innerText = "A jinja2 template which output a valid JSON";
                break;
            default:
                return null;
        }
    }
    return span;
}

const TIMER = 2; // refer to TaskType enum in the API server.

function createInput(param, value, cells, cells_defs, config) {
    let input = null;
    switch(param.nature) {
        case 'session_holder':
            input = document.createElement('select');
            input.className = 'form-control';
            config && config.gateways && Object.keys(config.gateways)
                .filter(c => config.gateways[c].session_holder !== undefined)
                .map(c => config.gateways[c].session_holder)
                .sort((a, b) => {
                    const a_ = a.toLowerCase(), b_ = b.toLowerCase();
                    if(a_ < b_) return -1;
                    if(a_ > b_) return 1;
                    return 0;
                })
                .map(v => {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.innerText = v;
                    return opt;
                })
                .forEach(o => input.appendChild(o));
            input.value = value || null;
            break;
        case 'task':
            input = document.createElement('select');
            input.className = 'form-control';
            Object.keys(cells)
                .filter(c => cells[c].getAttribute('label') !== undefined)
                .map(c => cells[c].getAttribute('label'))
                .sort((a, b) => {
                    const a_ = a.toLowerCase(), b_ = b.toLowerCase();
                    if(a_ < b_) return -1;
                    if(a_ > b_) return 1;
                    return 0;
                })
                .map(v => {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.innerText = v;
                    return opt;
                })
                .forEach(o => input.appendChild(o));
            input.value = value || "";
            break;
        case 'timer':
            input = document.createElement('select');
            input.className = 'form-control';
            Object.keys(cells)
                .filter(c => {
                    const original_name = cells[c].getAttribute('original_name');
                    const cell_def = cells_defs.find(c_def => c_def.name === original_name);
                    return cell_def && cell_def.type === TIMER;
                })
                .map(c => cells[c].getAttribute('label'))
                .map(v => {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.innerText = v;
                    return opt;
                })
                .forEach(o => input.appendChild(o));
            input.value = value || null;
            break;
        case 'list':
            input = document.createElement('select');
            input.className = 'form-control';
            param.values.map(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.innerText = v;
                return opt;
            }).forEach(o => input.appendChild(o));
            input.value = value;
            break;
        case 'jinja':
        case 'python':
        case 'json':
            input = document.createElement('textarea');
            input.innerText = value;
            input.rows = param.nature === "jinja" ? 4: 10;
            input.className = 'form-control';
            input.value = value || "";
            break;
        case 'bool':
            // todo: should become a checkbox!!
            input = document.createElement('select');
            input.className = 'form-control';
            ["true", "false"].map(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.innerText = v;
                return opt;
            }).forEach(o => input.appendChild(o));
            input.value = value;
            break;
        default:
            input = document.createElement('input');
            input.type = 'text';
            input.value = value || "";
            input.className = 'form-control';
            break;
    }
    return input;
}

function newCell(defs, cells, modal, editor, spacer, entities_defs, props) {
    let modalEntities = prepareModal(modal);
    let modalHeader = modalEntities[0];
    let modalBody = modalEntities[1];

    // set the header
    let h = document.createElement('h3');
    h.innerHTML = '<i>New cell</i>';
    modalHeader.appendChild(h);

    let form = document.createElement('form');

    modalBody.appendChild(form);

    // set the name
    let gp = document.createElement('div');
    gp.className = 'form-group';

    let name = document.createElement('label');
    name.innerHTML = 'Name:';
    gp.appendChild(name);

    let nameVal = document.createElement('input');
    nameVal.id = 'name';
    nameVal.className = 'form-control';
    nameVal.type = 'text';
    gp.appendChild(nameVal);

    form.appendChild(gp);

    // set the implementation
    gp = document.createElement('div');
    gp.className = 'form-group';

    name = document.createElement('label');
    name.innerHTML = 'Implementation:';
    gp.appendChild(name);

    let value = document.createElement('select');
    value.id = 'implementation';
    value.className = 'form-control';

    let option = document.createElement('option');
    option.value = '';
    value.appendChild(option);

    let optGroup = document.createElement('optgroup');
    optGroup.label = 'Entities';
    entities_defs.map((c) => {
        let option = document.createElement('option');
        option.value = c.name;
        option.innerHTML = c.name;
        optGroup.appendChild(option);
        return null;
    });
    value.appendChild(optGroup);

    let optGroups = [];
    defs.sort((a, b) => {
        if(a.category && a.category.toLowerCase() < b.category.toLowerCase()) return -1;
        if(a.category && a.category.toLowerCase() > b.category.toLowerCase()) return 1;

        if(a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        if(a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        return 0;
    }).map(c => {
        let option = document.createElement('option');
        option.value = c.name;
        option.innerHTML = c.name;
        optGroup = optGroups.find(o => c.category?c.category === o.label.split(' ')[0]:"direct processing");
        if(optGroup === undefined) {
            optGroup = document.createElement('optgroup');
            optGroup.label = (c.path?c.path.split('.')[2]:"direct") + ' processing';
            value.appendChild(optGroup);
            optGroups.push(optGroup);
        }
        optGroup.appendChild(option);
        return null;
    });
    gp.appendChild(value);

    form.appendChild(gp);

    // dynamically show the parameters of the implementation
    let params = document.createElement('div');
    let paramsFields = {};
    value.onchange = (e) => {
        params.innerHTML = '';
        let c = defs.filter((c) => c.name === e.target.value)[0];
        if(c !== undefined) {
            if(c.doc) {
                const hp = document.createElement('div');

                const name = document.createElement('label');
                name.innerHTML = 'Description';
                hp.appendChild(name);

                const text = document.createElement('p');
                text.innerHTML = c.doc;
                hp.appendChild(text);
                params.appendChild(hp);
            }
            c.params.map(param => {
                const param_name = param.name || param;
                const gp = document.createElement('div');
                gp.className = 'form-group';

                const name = document.createElement('label');
                name.innerHTML = param_name;
                gp.appendChild(name);

                const value = createInput(param, '', cells, defs, props.configuration);
                gp.appendChild(value);
                paramsFields[param_name] = value;

                const help = getHelpbox(param.nature, param.help);
                help && gp.appendChild(help);

                params.appendChild(gp);

                return null;
            });
        } else {
            c = entities_defs.filter((c) => c.name === e.target.value)[0];
        }

        if(c !== undefined && c.outputs.length !== 0) {
            params.appendChild(document.createElement('hr'));
            c.outputs.map((output) => {
                // todo show the possible outputs and let filter some not to be shown.
                return null;
            })
        }
    };
    form.appendChild(params);

    // add action
    let btn = document.createElement('button');
    btn.className = 'btn btn-success';
    btn.innerHTML = 'Ok';
    btn.onclick = function(e) {
        e.preventDefault();
        if(nameVal.value === undefined || nameVal.value.length === 0) {
            alert('The cell needs a name');
            return;
        }
        if(Object.keys(cells).find(c => cells[c].getAttribute('label') === nameVal.value) !== undefined) {
            alert('The cell name is already used');
            return;
        }
        if(value.value.length === 0) {
            alert('Please select an implementation');
            return;
        }
        let c = defs.find(c => c.name === value.value);
        let cls = 'cell';
        if (c === undefined) {
            c = entities_defs.filter(e => e.name === value.value)[0];
            cls = 'entity';
        }

        if(c.params && c.params.map(p =>
            isValid(p, paramsFields[p.name || p].value)
        ).indexOf(false) !== -1){
            return;
        }

        let graph = editor.graph;
        let parent = graph.getDefaultParent();
        graph.getModel().beginUpdate();
        try{
            let node = document.createElement('cell');
            node.setAttribute('label', nameVal.value);
            node.setAttribute('original_name', value.value);
            node.setAttribute('outputs', c.outputs);
            node.setAttribute('attrList', (c.params && c.params.map(p => p.name || p).join(',')) || '');
            c.params && c.params.map(p => {
                const param_name = p.name || p;
                let e = paramsFields[param_name];
                node.setAttribute(param_name, e.value || '');
                return null;
            });
            let v = undefined;
            let v10 = undefined;
            let baseY = BASE_Y;
            switch(node.getAttribute('original_name')) {
                case 'end':
                    v = graph.insertVertex(parent, null, node, c.x, c.y, c.height || 100, 25, 'end');
                    v.setConnectable(false);

                    v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                    v10.geometry.offset = new mxPoint(-5, 9);
                    break;
                default:
                    v = graph.insertVertex(parent, null, node, 0, 0, min_cell_height(c, nameVal.value), baseY + (20 * c.outputs.length) + 15, cls);
                    v.setConnectable(false);

                    v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                    v10.geometry.offset = new mxPoint(-5, 15);
                    break
            }

            for(let i=0; i < c.outputs.length; i++) {
                let o = c.outputs[i];
                let p = graph.insertVertex(v, null, document.createElement('Source'), 1, 0, 10, 10, 'port;source;align=right;spacingRight=18', true);

                p.value = o;
                p.geometry.offset = new mxPoint(-5, baseY + (i * 20))
            }
        }finally {
            graph.getModel().endUpdate();
        }

        modal.style.display = "none";
    };
    form.appendChild(btn);
    form.appendChild(spacer.cloneNode(true));

    // cancel action
    btn = document.createElement('button');
    btn.className = 'btn btn-warning';
    btn.innerHTML = 'Cancel';
    btn.onclick = function(e) {
        e.preventDefault();
        modal.style.display = "none";
    };
    form.appendChild(btn);
    // show
    modal.style.display = "block";
    modal.style.overflowY = "scroll";
}

function editCellProperty(cell, modal, spacer, editable, cells_defs, cells, refresh_cb, transitions, props) {
    const modalEntities = prepareModal(modal);
    const modalHeader = modalEntities[0];
    const modalBody = modalEntities[1];

    // 1. set the header with the cell name
    const h = document.createElement('h3');
    h.innerHTML = `<i>${cell.getAttribute('label')}</i>`;
    modalHeader.appendChild(h);

    // 2. indicate the original cell (as read-only field)
    const p = document.createElement('p');
    p.innerHTML = `Implementation: <i>${cell.getAttribute('original_name')}</i>`;
    modalBody.appendChild(p);

    // 2.1 add a description if available
    const cell_def = cells_defs.find(c => c.name === cell.getAttribute('original_name'));
    if(cell_def && cell_def.doc) {
        const d = document.createElement('p');
        d.innerHTML = `Description: <i>${cell_def.doc}</i>`;
        modalBody.appendChild(d);
    }

    // 3. add the possible parameters (+ values)
    let form = document.createElement('form');
    let attrs = {};
    const defAttrList = cell_def?cell_def.params.map(p => p.name || p):[];
    const attrList = cell.getAttribute('attrList') ? cell.getAttribute('attrList').split(',') : [];
    const params_list = defAttrList.concat(attrList.filter(e => !defAttrList.includes(e)));

    params_list.map(a => {
        let gp = document.createElement('div');
        gp.className = 'form-group';

        let name = document.createElement('label');
        name.innerHTML = a;
        gp.appendChild(name);

        let p = a;
        if(cell_def) {
            p = cell_def.params.find(p => p.name === a || p === a);
        }
        const value = createInput(p, cell.getAttribute(a), cells, cells_defs, props.configuration);

        if(!editable) value.disabled="disabled";
        gp.appendChild(value);
        attrs[a] = value;

        const help = getHelpbox(p.nature, p.help);
        help && gp.appendChild(help);

        form.appendChild(gp);
        return null;
    });

    // 4. allow changing outputs (order)
    let list_;
    if(editable && (cell.getAttribute('outputs') || (cell_def && cell_def.outputs))) {
        form.appendChild(document.createElement('hr'));
        const p = document.createElement('h5');
        p.innerHTML = 'Outputs';
        form.appendChild(p);
        let gp = document.createElement('div');
        gp.className = 'form-group';
        list_ = document.createElement('ul');

        let el_;
        function isBefore(el1, el2) {
            if (el2.parentNode === el1.parentNode)
                for (let cur = el1.previousSibling; cur; cur = cur.previousSibling)
                    if (cur === el2)
                        return true;
            return false;
        }

        const visible_outputs = cell.getAttribute('outputs') ? cell.getAttribute('outputs').split(',') : [];
        let outputs = visible_outputs;
        if (cell_def && cell_def.outputs) {
            outputs = outputs.concat(cell_def.outputs.filter(o => visible_outputs.findIndex(vo => vo === o) === -1));
        }
        outputs.map(o => {
            const entry = document.createElement('li');
            entry.draggable = true;
            entry.ondragend = () => el_ = null;
            entry.ondragover = e => {
                if(e.target.nodeName !== 'LI') return;
                if (isBefore(el_, e.target)) {
                    e.target.parentNode.insertBefore(el_, e.target);
                } else {
                    e.target.parentNode.insertBefore(el_, e.target.nextSibling);
                }
            };
            entry.ondragstart = e => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", null);
                el_ = e.target;
            };
            const visibility = document.createElement('input');
            visibility.type = 'checkbox';
            visibility.id = o + '_visible';
            visibility.checked = visible_outputs.findIndex(vo => vo === o) !== -1;
            visibility.style.margin = '.4em';
            visibility.disabled = transitions.filter(t => t[0] === o).length !== 0;
            entry.appendChild(visibility);
            const label = document.createElement('label');
            label.innerText = o;
            label.for = o + '_visible';
            entry.appendChild(label);
            return entry;
        }).map(e => list_.appendChild(e));
        gp.appendChild(list_);
        form.appendChild(gp);
    }

    // 5. add submit, cancel button
    if(editable) {
        let btn = document.createElement('button');
        btn.className = 'btn btn-success';
        btn.innerHTML = 'Ok';
        btn.onclick = e => {
            e.preventDefault();
            // 4.1 save params in the cell.
            if (cell.getAttribute('attrList') !== undefined) {
                const params = cell_def ? cell_def.params.map(p => p.name || p) : cell.getAttribute('attrList').split(',');
                // 4.2 validate inputs if possible
                if(cell_def && cell_def.params && params.map(a => {
                    const p = cell_def.params.find(p => p.name === a || p === a);
                    if(!p) {
                        console.log(`the parameter ${a} is not in the definition anymore`);
                        return true;
                    }
                    return isValid(p, attrs[a].value);
                }).indexOf(false) !== -1){
                    return;
                }

                params.forEach(a => cell.setAttribute(a, attrs[a].value));
                cell.setAttribute('attrList', params.map(p => p.name || p).join(','))
            }
            if(cell.getAttribute('outputs') || (cell_def && cell_def.outputs)) {
                const outputs = Array.from(list_.childNodes).filter(c => c.childNodes[0].checked).map(c => c.childNodes[1].innerText).join(',');
                if(outputs !== cell.getAttribute('outputs')) {
                    cell.setAttribute('outputs', outputs);
                    refresh_cb && setTimeout(refresh_cb, 50);
                }
            }
            modal.style.display = "none";
        };
        form.appendChild(btn);
        form.appendChild(spacer.cloneNode(true));

        btn = document.createElement('button');
        btn.className = 'btn btn-warning';
        btn.innerHTML = 'Cancel';
        btn.onclick = function (e) {
            e.preventDefault();
            modal.style.display = "none";
        };
        form.appendChild(btn);
    }
    modalBody.appendChild(form);

    // 5. show
    modal.style.display = "block";
    modal.style.overflowY = "scroll";
}

function configureStylesheet(graph)
{
    let style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    //style[mxConstants.STYLE_GRADIENTCOLOR] = 'white'; //'#41B9F5';
    style[mxConstants.STYLE_FILLCOLOR] = '#8CCDF5';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = '12';
    style[mxConstants.STYLE_FONTSTYLE] = 0;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    style[mxConstants.STYLE_ARCSIZE] = 6;
    graph.getStylesheet().putDefaultVertexStyle(style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_ELLIPSE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    //style[mxConstants.STYLE_GRADIENTCOLOR] = '#41B9F5';
    style[mxConstants.STYLE_FILLCOLOR] = '#8CCDF5';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 0;
    style[mxConstants.STYLE_FONTSTYLE] = 0;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('target', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_ELLIPSE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    //style[mxConstants.STYLE_GRADIENTCOLOR] = '#41B9F5';
    style[mxConstants.STYLE_FILLCOLOR] = '#8CCDF5';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 0;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('source', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
    style[mxConstants.STYLE_FONTCOLOR] = '#774400';
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_PERIMETER_SPACING] = '6';
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 2;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '16';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '16';
    graph.getStylesheet().putCellStyle('port', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_HEXAGON;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.HexagonPerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'green';
    style[mxConstants.STYLE_FILLCOLOR] = 'green';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('start', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_HEXAGON;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.HexagonPerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'red';
    style[mxConstants.STYLE_FILLCOLOR] = 'red';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('end', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'PapayaWhip';
    style[mxConstants.STYLE_FILLCOLOR] = 'PapayaWhip';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('entity', style);

    style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
    style[mxConstants.STYLE_STROKEWIDTH] = '2';
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
};

function addToolbarButton(editor, toolbar, action, label, image, isTransparent, callback, title)
{
    var button = document.createElement('button');
    button.className = 'btn btn-default';
    if (image != null)
    {
        if(image.nodeName) {
           button.appendChild(image);
        } else {
            var img = document.createElement('img');
            img.setAttribute('src', image);
            img.style.width = '16px';
            img.style.height = '16px';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '2px';
            button.appendChild(img);
        }
    }
    if (isTransparent)
    {
        button.style.background = 'transparent';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
    }
    mxEvent.addListener(button, 'click', function(evt)
    {
        if(action !== null) {
            editor.execute(action);
        } else {
            callback(evt);
        }
    });
    if(title || action) {
        button.title = title || action;
    }
    mxUtils.write(button, label);
    toolbar.appendChild(button);
}

module.exports = draw_editor;
