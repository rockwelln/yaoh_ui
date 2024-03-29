import Ajv from "ajv";
import { toast } from "react-toastify";

const okPic = require("../images/ok.png");
const errPic = require("../images/error.png");
const runPic = require("../images/run.png");

const BASIC_CELL_HEIGHT = 120;
const CHAR_HEIGHT_APPROX = 7.5;
const BASE_Y = 35;
const mxnspace = require("mxgraph")({
    mxImageBasePath: "mxgraph/javascript/src/images",
    mxBasePath: "mxgraph/javascript/src"
});
require("mxgraph/javascript/src/css/common.css")

const {
    mxUtils,
    mxClient,
    mxEdgeStyle,
    mxConstants,
    mxEditor,
    mxPerimeter,
    mxGraphHandler,
    mxDivResizer,
    mxMultiplicity,
    mxEvent,
    mxPoint,
    mxImage,
    mxCellOverlay,
    mxKeyHandler,
} = mxnspace;


const SCHEMA_DEFINITION = {
  "type": "object",
  "properties": {
      "cells": {
          "type": "object",
          "additionalProperties": {
              "type": "object",
              "properties": {
                  "original_name": {"type": "string"},
                  "name": {"type": "string"},
                  "x": {"type": "number"},
                  "y": {"type": "number"},
                  "params": {"type": "object"},
                  "outputs": {"type": "array", "items": {"type": "string"}},
                  "error_outputs": {"type": "array", "items": {"type": "string"}},
                  "style": {"type": "object"}
              },
              "required": ["original_name", "x", "y"],
              "additionalProperties": false
          }
      },
      "entities": {
          "type": "array",
          "items": {
              "type": "object",
              "properties": {
                  "original_name": {"type": "string"},
                  "name": {"type": "string"},
                  "x": {"type": "number"},
                  "y": {"type": "number"},
                  "params": {"type": "object"},
                  "outputs": {"type": "array", "items": {"type": "string"}},
                  "error_outputs": {"type": "array", "items": {"type": "string"}}
              },
              "required": ["name", "original_name", "x", "y"],
              "additionalProperties": false
          }
      },
      "transitions": { "type": "array", "items": {"type": "array", "minItems": 2, "maxItems": 2} }
  },
  "required": ["cells", "transitions"],
  "additionalProperties": false
};

function note_heigth(cell) {
    const l = cell.params.note?.length;
    if(l === undefined) return 150;

    const longest = Math.max(...cell.params.note.split("\n").map(l => l.length));

    return Math.min(250, Math.max(longest * CHAR_HEIGHT_APPROX, 100));
}

function note_width(cell) {
    const l = cell.params.note?.length;
    if(l === undefined) return 100;

    const lines = cell.params.note.split("\n").length;
    return (lines * 15) + 35;
}

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


export function getDefinition(editor, title) {
    let model = editor.graph.getModel();
    // console.log(model.cells);
    let activity = Object.assign({}, editor.graph.getDefaultParent().originalActivity);
    activity.name = title;
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
            let errOuts = (c.getAttribute('error_outputs') || "").split(",").filter(o => o !== "");
            let cell = {
                name: c.getAttribute('label'),
                original_name: c.getAttribute('original_name'),
                x: c.geometry.x,
                y: c.geometry.y,
                params: {},
                outputs: outputs.split(",").filter(o => o !== ""),
                style: c.getAttribute('style') && JSON.parse(c.getAttribute('style')),
            };
            if(errOuts.length > 0) {
               cell.error_outputs = errOuts;
            }
            if(c.getAttribute('original_name') === 'start') hasAStart = true;
            if(c.hasAttribute('attrList') && c.getAttribute('attrList') !== undefined) {
                cell.params = c.getAttribute('attrList').split(",").reduce((xa, a) => {xa[a] = c.value.params[a]; return xa;}, {});
            }

            switch(c.style) {
                case 'entity':
                    activity.definition.entities.push(cell);
                    break;
                default:
                    activity.definition.cells[c.getAttribute('label')] = cell;
                    break;
            }

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

function getClass(def) {
    switch(def.original_name) {
        case 'entity':
            return 'entity'
        default:
            return 'cell';
    }
}

function addEdge(graph, source, target) {
    const parent = graph.getDefaultParent();
    graph.getModel().beginUpdate();
    try{
        graph.insertEdge(parent, null, '',  source, target);
    } finally {
        graph.getModel().endUpdate();
    }
}

function getCustomStyle(def) {
    return Object.entries(def || {}).reduce((p, [k, v]) => {
        let graphKey = k;
        switch(k) {
            case 'background_color':
                graphKey = mxConstants.STYLE_FILLCOLOR;
                break;
            default:
                return p;
        }

        return `${p};${graphKey}=${v}`;
    }, "default") || "";
}

export function addNode(graph, def, name, paramsFields) {
    const cls = getClass(def);
    const c = def;
    const value = def.original_name || def.name;
    let parent = graph.getDefaultParent();
    let endpoints = {};
    let v = undefined;
    graph.getModel().beginUpdate();
    try{
        let node = document.createElement('cell');
        node.setAttribute('label', name);
        node.setAttribute('original_name', value);
        node.setAttribute('outputs', c.outputs);
        node.setAttribute('error_outputs', c.error_outputs || "");
        node.setAttribute('style', c.style && JSON.stringify(c.style) || "{}");
        node.setAttribute('attrList', (c.params && c.params.map(p => p.name || p).join(',')) || '');
        node.params = {};
        c.params && c.params.map(p => {
            const param_name = p.name || p;
            // node.setAttribute(param_name, paramsFields[param_name] || '');
            node.params[param_name] = paramsFields[param_name] || '';
            return null;
        });
        let v10 = undefined;
        let baseY = BASE_Y;
        switch(node.getAttribute('original_name')) {
            case 'start':
                v = graph.insertVertex(parent, null, node, c.x, c.y, c.height || 100, 25, 'start');
                v.setConnectable(false);
                baseY = 7;
                break;
            case 'end':
                v = graph.insertVertex(parent, null, node, c.x, c.y, c.height || 100, 25, 'end');
                v.setConnectable(false);

                v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                v10.geometry.offset = new mxPoint(-5, 9);
                endpoints[name] = v10;
                break;
            case 'sync_outputs':
            case 'or_outputs':
                v = graph.insertVertex(parent, null, node, c.x, c.y, 50, 50, 'gate');
                v.setConnectable(false);

                v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                v10.geometry.offset = new mxPoint(-5, -5);
                endpoints[name] = v10;
                break;
            case 'goto':
                v = graph.insertVertex(parent, null, node, c.x, c.y, 20, 30, 'goto');
                v.setConnectable(false);

                v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                v10.geometry.offset = new mxPoint(-5, 9);
                endpoints[name] = v10;
                break;
            case 'note':
                const height = note_heigth(c)
                v = graph.insertVertex(parent, null, node, c.x, c.y, height, note_width(c), 'note;'+getCustomStyle(c.style));
                v.setConnectable(false);

                break;
            default:
                v = graph.insertVertex(parent, null, node, c.x, c.y, min_cell_height(c, name), baseY + (20 * c.outputs.length) + 15, cls+";"+getCustomStyle(c.style));
                v.setConnectable(false);

                v10 = graph.insertVertex(v, null, document.createElement('Target'), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                v10.geometry.offset = new mxPoint(-5, 15);
                endpoints[name] = v10;
                break
        }

        for(let i=0; i < c.outputs.length; i++) {
            let o = c.outputs[i];
            let p = graph.insertVertex(v, null, document.createElement('Source'), 1, 0, 10, 10, 'port;source;align=right;spacingRight=18', true);

            p.value = o;
            if(c.original_name === "or_outputs" || c.original_name === "sync_outputs") {
              p.geometry.offset = new mxPoint(-5, 45);
            } else {
              p.geometry.offset = new mxPoint(-5, baseY + (i * 20));
            }
            endpoints[name + '.' + o] = p;
        }
    }finally {
        graph.getModel().endUpdate();
    }
    return {cell: v, endpoints:endpoints};
}


function new_editor() {
    let editor = new mxEditor();
    const {graph} = editor;
    // Centers the port icon on the target port
    graph.connectionHandler.targetConnectImage = true;
    // Does not allow dangling edges
    graph.setAllowDanglingEdges(false);
    // Allow new connections
    graph.setConnectable(true);
    // allow HTML tags in the cell labels
    graph.setHtmlLabels(true);
    // let the mouse click move the whole graph
    graph.panningHandler.useLeftButtonForPanning = true;
    graph.setPanning(true);
    graph.pageFormat = mxConstants.PAGE_FORMAT_A4_LANDSCAPE;
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
    configureStylesheet(graph);
    // put edges behind cells (despite they are drawn after)
    graph.keepEdgesInBackground = true;
    // hook on key pressed
    var keyHandler = new mxKeyHandler(graph);
    keyHandler.getFunction = (evt) =>
    {
      if (evt != null && graph.isEnabled())
      {
        // delete cell(s) using "delete" key
        const isCtrlBackspace = (mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey)) && evt.keyCode === 8;
        const isDelete = evt.keyCode === 46;
        if(isCtrlBackspace || isDelete) {
            graph.removeCells()
        }
        const isSave = (mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey)) && evt.keyCode === 83;
        if(isSave) {
            console.log("click save")
            evt.preventDefault();
        }

      }
      return null;
    }

    supportClipboard(graph);

    return editor;
}

function supportClipboard(graph) {
    // Focused but invisible textarea during control or meta key events
    var textInput = document.createElement('textarea');
    mxUtils.setOpacity(textInput, 0);
    textInput.style.width = '1px';
    textInput.style.height = '1px';
    var gs = graph.gridSize;
    var gx = 0;
    var gy = 0;
    var restoreFocus = false;
    var lastPaste = null;

    // Workaround for no copy event in IE/FF if empty
    textInput.value = ' ';
    
    // Inserts the JSON for the given cells into the text input for copy
    var copyCells = function(graph, cells)
    {
        if (cells.length > 0)
        {
            let m = "";
            let nodes = [];
            let transitions = [];
            
            // Cell => JSON
            // currently, only 1 (the last one) cell will be considered
            for (var i = 0; i < cells.length; i++)
            {
                let cell = cells[i];
                if (cell.edge) {
                    const {source, target, style} = cell;

                    let sourcePortId = style.split(';')
                        .map(s => s.split('='))
                        .filter(s => s[0] === 'sourcePort')[0][1];

                    if(cells.includes(source) && cells.includes(target)) {
                        transitions.push([source.getAttribute('label') + '.' + source.children.find(c => c.id === sourcePortId).value,
                            target.getAttribute('label')
                        ])
                    }
                } else if (!cell.connectable) {
                    let outputs = cell.getAttribute('outputs') || "";
                    let errOuts = (cell.getAttribute('error_outputs') || "").split(",").filter(o => o !== "");

                    let c = {
                        name: cell.getAttribute('label'),
                        original_name: cell.getAttribute('original_name'),
                        x: cell.geometry.x,
                        y: cell.geometry.y,
                        params: {},
                        outputs: outputs.split(",").filter(o => o !== ""),
                        style: cell.getAttribute('style') && JSON.parse(cell.getAttribute('style')) || {},
                    };
                    if(errOuts.length > 0) {
                        c.error_outputs = errOuts;
                    }

                    if(cell.hasAttribute('attrList') && cell.getAttribute('attrList') !== undefined) {
                        c.params = cell.getAttribute('attrList').split(",").reduce((xa, a) => {xa[a] = cell.value.params[a]; return xa;}, {});
                    }

                    nodes.push(c);
                }
            }
            textInput.value = JSON.stringify({
                cells: nodes,
                transitions: transitions,
            }, null, 2);
        }
        textInput.select();
        lastPaste = textInput.value;
        gx = 0;
        gy = 0;
    };

    // Cross-browser function to fetch text from paste events
    var extractGraphModelFromEvent = function(evt)
    {
        var data = null;
        if (evt != null)
        {
            var provider = (evt.dataTransfer != null) ? evt.dataTransfer : evt.clipboardData;
            if (provider != null) {
                if (document.documentMode == 10 || document.documentMode == 11) {
                    data = provider.getData('Text');
                } else {
                    data = (mxUtils.indexOf(provider.types, 'text/html') >= 0) ? provider.getData('text/html') : null;
                    if (mxUtils.indexOf(provider.types, 'text/plain' && (data == null || data.length == 0))) {
                        data = provider.getData('text/plain');
                    }
                }		
            }
        }
        return data;
    };

    var pasteText = function(text) {
        var json_ = mxUtils.trim(text);
        
        if (json_.length > 0)
        {
            if (lastPaste != json_) {
                lastPaste = json_;
                gx = 0;
                gy = 0;
            } else {
                gx += gs;
                gy += gs;
            }

            // Standard paste via control-v
            if (json_.substring(0, 1) == '{')
            {
                var o;
                try {
                    o = JSON.parse(json_);
                } catch(e) {
                    console.error(json_, e)
                    toast.error(e.message)
                    return
                }

                const {cells, transitions} = o;
                const newVertex = [];
                const endpoints = cells.map(cell => {
                    // addNode expects to receive the definition of the cell
                    // so trick the attributes a bit
                    const paramValues = Object.assign({}, cell.params);
                    cell.params = Object.keys(cell.params);
                    // slightly shift a new clone (if necessary)
                    cell.x += gx;
                    cell.y += gy;
                    // copy the style (if any)
                    cell.style = cell.style && Object.assign({}, cell.style);
                    // add copy to the node name if it already exists
                    if (Object.values(graph.getModel().cells).findIndex(c => c.getAttribute('label') === cell.name) !== -1) {
                        const newName = cell.name + " (copy)";
                        
                        transitions.forEach(t => {
                            if(t[0].startsWith(cell.name + ".")) {
                                t[0] = t[0].replace(cell.name + ".", newName + ".")
                            }
                            if(t[1] === cell.name) {
                                t[1] = newName
                            }
                        });
                        cell.name = newName;
                    }
                    
                    const {endpoints, cell: cl} = addNode(graph, cell, cell.name, paramValues);
                    // graph.scrollCellToVisible(graph.getSelectionCell());
                    newVertex.push(cl);
                    return endpoints
                }).reduce(Object.assign, {});

                transitions.forEach(transition => {
                    addEdge(graph, endpoints[transition[0]], endpoints[transition[1]]);
                });

                graph.setSelectionCells(newVertex);
            }
        }
    };

    // Shows a textare when control/cmd is pressed to handle native clipboard actions
    mxEvent.addListener(document, 'keydown', (evt) =>
    {
        // No dialog visible
        var source = mxEvent.getSource(evt);
        
        // note: source.nodeName should probably be "BODY" when the ctrl key need to be intercepted
        // I excuded INPUT, TEXTAREA and DIV to allow ctrl-c/v on form fields from nodes
        // I probably could simplify by using source.nodeName == "BODY" but not sure 
        if (graph.isEnabled() && !graph.isMouseDown && !graph.isEditing() && source.nodeName != 'INPUT' && source.nodeName != 'TEXTAREA' && source.nodeName != 'DIV')
        {
            if (evt.keyCode == 224 /* FF */ || (!mxClient.IS_MAC && evt.keyCode == 17 /* Control */) ||
                (mxClient.IS_MAC && (evt.keyCode == 91 || evt.keyCode == 93) /* Left/Right Meta */))
            {
                // Cannot use parentNode for check in IE
                if (!restoreFocus)
                {
                    // Avoid autoscroll but allow handling of events
                    textInput.style.position = 'absolute';
                    textInput.style.left = (graph.container.scrollLeft + 10) + 'px';
                    textInput.style.top = (graph.container.scrollTop + 10) + 'px';
                    graph.container.appendChild(textInput);

                    restoreFocus = true;
                    textInput.focus();
                    textInput.select();
                }
            }
        }
    });

    // Restores focus on graph container and removes text input from DOM
    mxEvent.addListener(document, 'keyup', (evt) =>
    {
        if (restoreFocus && (evt.keyCode == 224 /* FF */ || evt.keyCode == 17 /* Control */ ||
            evt.keyCode == 91 || evt.keyCode == 93 /* Meta */))
        {
            restoreFocus = false;
            
            if (!graph.isEditing())
            {
                graph.container.focus();
            }
            
            textInput.parentNode.removeChild(textInput);
        }
    });

    // Handles copy event by putting XML for current selection into text input
    mxEvent.addListener(textInput, 'copy', mxUtils.bind(this, (evt) =>
    {
        if (graph.isEnabled() && !graph.isSelectionEmpty())
        {
            copyCells(graph, mxUtils.sortCells(graph.model.getTopmostCells(graph.getSelectionCells())));
        }
    }));

    // Handles paste event by parsing and inserting XML
    mxEvent.addListener(textInput, 'paste', function(evt)
    {
        // Clears existing contents before paste - should not be needed
        // because all text is selected, but doesn't hurt since the
        // actual pasting of the new text is delayed in all cases.
        textInput.value = '';

        if (graph.isEnabled())
        {
            console.log(evt)
            var json_ = extractGraphModelFromEvent(evt);
            if (json_ != null && json_.length > 0) {
                pasteText(json_);
            } else {
                // Timeout for new value to appear
                window.setTimeout(mxUtils.bind(this, function()
                {
                    pasteText(textInput.value);
                }), 0);
            }
        }

        textInput.select();
    });
}


export function updateGraphModel(editor, activity, options) {
    // Adds activity (cells) to the model.
    if(options.title !== undefined) {
        options.title.value = activity.name;
    }

    let data = activity.definition;
    // ensure the definition is an object
    if(typeof data === "string") {
        data = JSON.parse(data);
    }

    const graph = editor.graph;
    const parent = graph.getDefaultParent();
    let xmlDocument = mxUtils.createXmlDocument();
    let sourceNode = xmlDocument.createElement('Source');
    let targetNode = xmlDocument.createElement('Target');
    let cellNode = xmlDocument.createElement('cell');

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
            node.setAttribute('error_outputs', c.error_outputs || "");
            node.setAttribute('style', c.style && JSON.stringify(c.style) || "{}");
            node.params = {};
            if(c.params !== undefined && Object.keys(c.params).length !== 0) {
                node.setAttribute('attrList', Object.keys(c.params).filter(p => p).map(param_name => {
                    // const value = c.params[param_name];
                    // node.setAttribute(param_name, value);
                    node.params[param_name] = c.params[param_name];
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
                case 'sync_outputs':
                case 'or_outputs':
                    v = graph.insertVertex(parent, null, node, c.x, c.y, 50, 50, 'gate');
                    v.setConnectable(false);

                    v10 = graph.insertVertex(v, null, targetNode.cloneNode(true), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                    v10.geometry.offset = new mxPoint(-5, -5);
                    endpoints.push([name, v10]);
                    break;
                case 'note':
                    v = graph.insertVertex(parent, null, node, c.x, c.y, note_heigth(c), note_width(c), 'note;'+getCustomStyle(c.style));
                    v.setConnectable(false);
    
                    break;
                case 'goto':
                    v = graph.insertVertex(parent, null, node, c.x, c.y, 20, 30, 'goto');
                    v.setConnectable(false);

                    v10 = graph.insertVertex(v, null, targetNode.cloneNode(true), 0, 0, 10, 10, 'port;target;spacingLeft=18', true);
                    v10.geometry.offset = new mxPoint(-5, 9);
                    endpoints.push([name, v10]);
                    break;
                default:
                    v = graph.insertVertex(parent, null, node, c.x, c.y, min_cell_height(c, name), baseY + (20 * c.outputs.length) + 15, getCustomStyle(c.style));
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
                if(c.original_name === "or_outputs" || c.original_name === "sync_outputs") {
                  p.geometry.offset = new mxPoint(-5, 45);
                } else {
                  p.geometry.offset = new mxPoint(-5, baseY + (i * 20));
                }

                endpoints.push([name + '.' + o, p, c.error_outputs?.includes(o)]);
            }

            graph.removeCellOverlays(v);
            switch(c.state) {
                case 'WAIT':
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
            node.setAttribute('error_outputs', e.error_outputs || "");
            node.params = {};
            if(e.params !== undefined && Object.keys(e.params).length !== 0) {
                node.setAttribute('attrList', Object.keys(e.params).filter(p => p).map(param_name => {
                    const value = e.params[param_name];
                    // node.setAttribute(param_name, value);
                    node.params[param_name] = value;
                    return param_name;
                }))
            }

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

        // trace error path (if any)
        const ranTransitions =  data.transitions.filter(([s, d, extra]) => extra?.status !== undefined);
        let markChildrenAsErrorPath = (source) => {
            const a = endpoints.find(endp => source === endp[0]);
            if(a && !a[2]) {
              // mark the source endpoint as error path
              a[2] = true;
            }
            // get the triggered destinations from the source
            const children = ranTransitions.filter(([s, d, extra]) => s === source && extra?.status !== undefined).map(([s, d, extra]) => d);

            for(let i=0; i < children.length; i++) {
                const a = endpoints.find(endp => children[i] === endp[0]);
                if(a !== undefined && !a[2]) {
                    ranTransitions.
                      // get transitions with source starting with child name
                      filter(([s, d, extra]) => s.indexOf(children[i] + ".") === 0).
                      // use the transition source as new start marker
                      map(([s, d, extra]) => markChildrenAsErrorPath(s))
                }
            }
        }
        endpoints.filter(e => e[2]).map(e => markChildrenAsErrorPath(e[0]))

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
              let color = extra.status === 'OK' ? (s.indexOf('.rollback') !== -1 ? '#ffbd53' : '#32cd32') : '#ff0000';

              // if error path
              if(a[2]) {
                color = '#ff0000';
              }

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
    fitEditor(graph);
}


function setup_toolbar(editor, container, spacer, handlers, props) {
    const {activityId} = props;
    addToolbarButton(editor, container, 'zoomIn', '🔍 +', null, false, null, 'zoom in');
    addToolbarButton(editor, container, 'zoomOut', '🔍 -', null, false, null, 'zoom out');
    // addToolbarButton(editor, container, 'show', '👓');
    addToolbarButton(editor, container, 'showDefinition', 'txt');
    if(activityId) {
        addToolbarButton(editor, container, null, 'def', null, false, () => {
            window.open(`/transactions/config/activities/editor/${activityId}`, '_blank').focus();
        });
        handlers.updateDefinition && 
            addToolbarButton(editor, container, null, '↓', null, false, () => {
                handlers.updateDefinition();
            }, "update definition");
    }
}


function setup_actions(editor, title, spacer, handlers, modal, props) {
    editor.addAction('upload_definition', (editor, cell) => {
        if (typeof window.FileReader !== 'function') {
          alert("The file API isn't supported on this browser yet.");
          return;
        }
        uploadDefinition(modal, spacer, (newDef, filename) => {
            const activity = getDefinition(editor, title.value || filename).activity;
            activity.definition = newDef;
            updateGraphModel(editor, activity, {clear: true, title: title});
        });
    });
    editor.addAction("showDefinition", (editor, cell) => {
        showDefinition(modal, spacer, getDefinition(editor).activity.definition, newDef => {
            const activity = getDefinition(editor, title.value).activity;
            activity.definition = newDef;
            updateGraphModel(editor, activity, {clear: true, title: title});
        });
    });
}

export function fitEditor(graph, container, height=600) {
  container && graph.doResizeContainer(container.parentElement.getBoundingClientRect().width, height);

  // reset the graph start to adjust correctly the view afterwards
  graph.view.setTranslate(0, 0);
  // fit
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
  )
}

export default function draw_editor(container, handlers, placeholders, props) {
    console.log("rendering editor");
    let {toolbar, title} = placeholders;

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

    const editor = new_editor();
    const {graph, undoManager} = editor;
    let readOnly = props.readOnly === undefined ? false : props.readOnly;
    let height = props.height === undefined ? 600 : props.height;

    editor.setGraphContainer(container);
    // force the width of the container
    graph.doResizeContainer(container.getBoundingClientRect().width, height);
    graph.setEnabled(!readOnly);

    // use the 'label' attribute of the cells as shown value (but allow other attributes ;-))
    let convertValueToString = graph.convertValueToString; // store the original function
    graph.convertValueToString = function(cell)
    {
      if (mxUtils.isNode(cell.value))
      {
        switch(cell.getAttribute('original_name', '')) {
            case 'start':
            case 'end':
                return cell.getAttribute('label', '');
            case 'sync_outputs':
                return "<div style='transform: scale(var(--scale)) rotate(45deg)'>+</div>";
            case 'or_outputs':
                return "<div style='font-size: 10rem; margin-top: -1.5rem'>&cir;</div>";
            case 'goto':
                {
                    let div = document.createElement('div');
                    div.style.textAlign = 'left';
                    div.style.marginLeft = '1.3rem';
                    div.innerHTML = cell.value.params['task'];
                    return div;
                }
            case 'note':
                {
                    let div = document.createElement('div');
                    div.style.textAlign = 'center';
                    div.innerHTML = 'Note'
                    mxUtils.br(div);
                    let subDiv = document.createElement('div');
                    // subDiv.style.fontSize = '1.3rem';
                    subDiv.style.color = 'gray';
                    subDiv.style.marginTop = '0.3rem';
                    subDiv.style.marginLeft = '0.3rem';
                    subDiv.style.textAlign = 'left';
                    subDiv.innerHTML = cell.value.params['note'].split("\n").join("<br/>");
                    div.appendChild(subDiv);
                    return div;
                }
            default:
                {
                    let div = document.createElement('div');
                    div.innerHTML = cell.getAttribute('label');
                    mxUtils.br(div);
                    let i = document.createElement('i');
                    i.innerHTML = '&lt;' + cell.getAttribute('original_name', '') + '&gt;';
                    div.appendChild(i);
                    return div;
                }
        }
      } else if(cell.getParent() && cell.getParent().getAttribute('original_name', '') === 'sync_outputs' || cell.getParent().getAttribute('original_name', '') === 'or_outputs') {
          return "";
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
    container.appendChild(modal);

    //see process details
    graph.dblClick = function(evt, cell)
    {
        // Do not fire a DOUBLE_CLICK event here as mxEditor will
        // consume the event and start the in-place editor.
        if (!mxEvent.isConsumed(evt) &&
            cell !== null && cell !== undefined &&
            this.isCellEditable(cell) && !this.model.isEdge(cell))
        {
            if(handlers.onEdit) {
                handlers.onEdit(cell);
            }
        }
        // Disables any default behaviour for the double click
        mxEvent.consume(evt);
    }

    // Defines actions
    setup_actions(editor, title, spacer, handlers, modal, props);

    // setup toolbar
    if(toolbar !== undefined) {
        setup_toolbar(editor, toolbar, spacer, handlers, props);
    }

    if( handlers.onChange !== undefined ){
        undoManager.addListener(mxEvent.ADD, handlers.onChange);
    }

    // if(activity.id) {
    //     console.log('getting data');
    //     // handlers.get(activity.id, a => updateGraphModel(editor, activity, {title: title}));
    // } else {
    //     console.log('new activity');
    //     // updateGraphModel(editor, activity, {title: title});
    // }
    return editor;
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
    dialog.className = 'modal-lg modal-dialog';
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

function showDefinition(modal, spacer, currentDefinition, onSuccess) {
    let [modalHeader, modalBody] = prepareModal(modal);

    // set the header
    let h = document.createElement('h3');
    h.innerHTML = '<i>Definition</i>';
    modalHeader.appendChild(h);

    let errors = document.createElement('div');
    modalBody.appendChild(errors);

    let form = document.createElement('form');
    modalBody.appendChild(form);

    // set the implementation
    let gp = document.createElement('div');
    gp.className = 'form-group';

    let value = document.createElement('textarea');
    value.id = 'definition';
    value.rows = '40';
    value.className = 'form-control';
    value.value = JSON.stringify(currentDefinition, undefined, 2);

    gp.appendChild(value);
    form.appendChild(gp);

    let btn = document.createElement('button');
    btn.className = 'btn btn-success';
    btn.innerHTML = 'Load';
    btn.onclick = function(e) {
        e.preventDefault();

        errors.innerHTML = '';
        const li = document.createElement("ul");
        let newDef;
        try {
            newDef = JSON.parse(value.value);
        } catch (e) {
            let elt = document.createElement("li");
            elt.innerHTML = e;
            li.appendChild(elt);
            errors.appendChild(li);
            return;
        }

        let ajv = Ajv({allErrors: true});
        let valid = ajv.validate(SCHEMA_DEFINITION, newDef);
        console.log(valid);
        if(!valid) {
            console.log(ajv.errors);
            for(let i=0; i<ajv.errors.length;i++) {
                let e = document.createElement("li");
                const {dataPath, message} = ajv.errors[i];
                e.innerHTML = `[${dataPath}] ${message}`;
                li.appendChild(e);
            }
            errors.appendChild(li);
            return;
        }
        onSuccess(newDef);
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

function uploadDefinition(modal, spacer, onSuccess) {
    let [modalHeader, modalBody] = prepareModal(modal);

    // set the header
    let h = document.createElement('h3');
    h.innerHTML = '<i>Upload a definition</i>';
    modalHeader.appendChild(h);

    let help = document.createElement('p');
    help.innerHTML = 'Careful, the definition will replace the current workflow!';
    modalBody.appendChild(help);

    let errors = document.createElement('div');
    modalBody.appendChild(errors);

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
              errors.innerHTML = '';
              const li = document.createElement("ul");
              let newDef;
              try {
                 newDef = JSON.parse(e.target.result);
              } catch (e) {
                  let elt = document.createElement("li");
                  elt.innerHTML = e;
                  li.appendChild(elt);
                  errors.appendChild(li);
                  return;
              }

              let ajv = Ajv({allErrors: true});
              let valid = ajv.validate(SCHEMA_DEFINITION, newDef);
              console.log(valid);
              if(!valid) {
                  for(let i=0; i<ajv.errors.length;i++) {
                      let e = document.createElement("li");
                      const {dataPath, message, params} = ajv.errors[i];
                      e.innerHTML = `[${dataPath}] ${message} (${JSON.stringify(params)})`;
                      li.appendChild(e);
                  }
                  errors.appendChild(li);
                  return;
              }
              onSuccess(newDef, file.name);
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
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_TRIANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.TrianglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
    style[mxConstants.STYLE_FILLCOLOR] = 'green';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('goto', style);

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

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    style[mxConstants.STYLE_FILLCOLOR] = '#7fffd4';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 12;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('note', style);

    style = {};
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'PapayaWhip';
    style[mxConstants.STYLE_FILLCOLOR] = 'PapayaWhip';
    style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
    style[mxConstants.STYLE_FONTCOLOR] = '#000000';
    style[mxConstants.STYLE_OPACITY] = '80';
    style[mxConstants.STYLE_FONTSIZE] = 45;
    style[mxConstants.STYLE_ROTATION] = -45;
    style[mxConstants.STYLE_FONTSTYLE] = 1;
    style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
    style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
    graph.getStylesheet().putCellStyle('gate', style);

    style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
    style[mxConstants.STYLE_STROKEWIDTH] = '2';
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
}

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

// module.exports = draw_editor;
