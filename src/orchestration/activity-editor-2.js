import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Handle, Position, Background, Controls } from 'reactflow';

import 'reactflow/dist/style.css';
import './editor.css'
import { fetch_get } from '../utils';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, type: "default", data: { label: '1' } },
  { id: '2', position: { x: 200, y: 100 }, type: "default", data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

async function fetchActivity(activityId) {
    return fetch_get('/api/v01/activities/' + activityId);
}

function DefaultNode({data: {name, original_name, outputs}}) {
  // const onChange = useCallback((evt) => {
  //   console.log(evt.target.value);
  // }, []);

  return (
    <>
      <div className="default-node__header">
        <strong>{name}</strong><br />
        <label>{`<${original_name}>`}</label>
        <div className="default-node__source">
          <Handle type="target" position={Position.Left} id={name} />
        </div>
      </div>
      <div className="default-node__body">
        {
            outputs?.map(o => <Port label={o} id={`${name}.${o}`} />)
        }
      </div>
    </>
  );
}

function StartNode({data}) {
  return (
    <div className="start-node">
      <label>Start</label>
      <Port label="" />
    </div>
  );
}

function EndNode({data}) {
  return (
    <div className="end-node">
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

function Port({label, id}) {
    return (
        <div className="default-node__port">
            { label && <div>{label}</div> }
            <Handle type="source" position={Position.Right} id={id} />
        </div>
    );
}

export default function ActivityEditor({match: {params: {activityId}}}) {
  const [currentActivity, setCurrentActivity] = useState({});
  const [description, setDescription] = useState('');
  const [newActivity, setNewActivity] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ start: StartNode, end: EndNode, default: DefaultNode}), []);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  useEffect(() => {
    if(activityId) {
      fetchActivity(activityId).then(r => {
        setCurrentActivity(r.activity);
        setDescription(r.activity.description);
        setNewActivity(false);
        document.title = `Editor - ${r.activity.name}`;
      });
      // fetchActivityVersions(activityId, r => { setVersions(r); setVersionId((r.find(v => v.active) || {}).id); })
      // fetchActivityUsage(activityId, setUsage)
    }
  }, [activityId]);

  useEffect(() => {
    const edges = currentActivity.definition?.transitions?.map(t => {
        const [source, handle] = t[0].split('.');
        return { id: `${t[0]}-${t[1]}`, source: source, sourceHandle: handle, target: t[1] };
    });
    console.log(edges);

    const nodes = Object.entries(currentActivity.definition?.cells || {}).map(([name, c]) => {
      const o = { id: name, position: { x: c.x, y: c.y }, data: {name: name, ...c} };
      if(c.original_name === "start" || c.original_name === "end") {
        o.type = c.original_name;
      }
      return o;
    });
    console.log(nodes);

    setEdges(edges);
    setNodes(nodes);
  }, [currentActivity]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}
