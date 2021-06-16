import React, {useEffect, useState} from "react";
import Table, {tbody, th, tr} from "react-bootstrap/lib/Table";
import {API_URL_PREFIX, fetch_get} from "../utils";
import Panel from "react-bootstrap/lib/Panel";
import {FormattedMessage} from "react-intl";
import {Pagination} from "../utils/datatable";
import update from "immutability-helper";
import {replayTask} from "./utils";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import {Link} from "react-router-dom";
import Badge from "react-bootstrap/lib/Badge";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Button from "react-bootstrap/lib/Button";


export const SUB_REQUESTS_PAGE_SIZE = 50;


export function ContextTable({context}) {
  return (
    <Table style={{tableLayout: 'fixed'}}>
      <tbody>
      {
        context.sort((a, b) => a.id - b.id).map(c =>
          <tr key={c.id}>
            <th>{c.key}</th>
            <td style={{wordWrap: 'break-word'}}>{c.value}</td>
          </tr>
        )
      }
      </tbody>
    </Table>
  )
}

function SubInstance({instance, tasks, onReplay}) {
  let statusColor = '';
  let statusGlyph = '';
  switch(instance.status) {
      case "CLOSED_IN_SUCCESS":
          statusColor = '#a4d1a2';
          statusGlyph = 'ok';
          break;
      case "CLOSED_IN_ERROR":
          statusColor = '#ca6f7b';
          statusGlyph = 'remove';
          break;
      default:
          statusColor = '#a4d1a2';
          statusGlyph = 'play';
  }
  const callback_task = tasks && tasks.find(t => t.id === instance.callback_task_id);

  return (
    <tr key={`message_sub_flow_sync_${instance.id}`}>
        <td style={{width: '2%'}}><Glyphicon style={{color: statusColor}} glyph={statusGlyph}/></td>
        <td>
            <Link to={`/transactions/${instance.id}`}>{instance.label}</Link>{' '}
            {
                instance.error_count !== 0 && <Badge style={{backgroundColor: '#ff0808'}}>{instance.error_count}{' '}<FormattedMessage id="errors" defaultMessage="error(s)"/></Badge>
            }
        </td>
        <td style={{width: '30%'}}>
            {
                instance.status === "ACTIVE" && instance.tasks && instance.tasks.filter(t => t.status === 'ERROR').map(t =>
                    <ButtonToolbar key={`subinst_act_${instance.id}_${t.id}`}>
                        <Button bsStyle="primary" onClick={() => onReplay(instance.id, t.id)}><FormattedMessage id="replay" defaultMessage="Replay" /></Button>
                    </ButtonToolbar>
                ).pop()
            }
        </td>
        <td style={{width: '15%'}}>
            {
                callback_task && <Badge>{callback_task.cell_id}</Badge>
            }
        </td>
    </tr>
  )
}

function SubInstancesTable({subinstances, tasks, onReplay}) {
  return (
    <Table condensed>
      <tbody>
      {
        subinstances.map(
          (instance, i) => <SubInstance key={`subinst-${i}`} instance={instance} tasks={tasks} onReplay={onReplay} />
        )
      }
      </tbody>
    </Table>
  )
}

export function SubTransactionsPanel({txId, tasks, onGlobalAction, onReplay, refreshInterval=10000}) {
  const [paging, setPaging] = useState({page_number: 1, page_size: SUB_REQUESTS_PAGE_SIZE});
  const [filter, setFilter] = useState("all");
  const [instances, setInstances] = useState([]);
  const [pagingResponse, setPagingResponse] = useState({num_pages: 1, total_results: 0});
  function _refresh() {
    const url = new URL(API_URL_PREFIX + `/api/v01/transactions/${txId}/sub_transactions`);
    // filtering
    url.searchParams.append('filter', filter);
    // paging
    url.searchParams.append('paging', JSON.stringify(paging));

    fetch_get(url)
      .then(data => {
        setInstances(data.instances);
        setPagingResponse({num_pages: data.pagination[2], total_results: data.pagination[3]});
      })
      .catch(error => console.error(error));
  }

  useEffect(() => {
    _refresh();
    const handler = setInterval(_refresh, refreshInterval);
    return () => clearInterval(handler);
  }, [txId, filter, paging]);

  if(instances.length === 0 && filter === "all") {
    return <div/>
  }

  return (
    <Panel>
      <Panel.Heading>
        <Panel.Title>
          <FormattedMessage id="sub-instances" defaultMessage="Sub instances"/>
          <select
            className="pull-right"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="blocked">active & blocked</option>
          </select>
          {
            onGlobalAction && <select
              className="pull-right"
              value=""
              onChange={e => onGlobalAction(e.target.value, instances)}
            >
              <option value="">*global action*</option>
              <option value="replay">replay</option>
              <option value="skip">skip</option>
              <option value="force-close">force close</option>
            </select>
          }
        </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <SubInstancesTable
          subinstances={instances}
          tasks={tasks}
          onReplay={(aId, tId) => {
            const cb = onReplay && onReplay();
            replayTask(
              aId,
              tId,
              () => {
                _refresh();
                cb && cb();
              },
              () => cb && cb()
            )
          }}
        />
        <Pagination
          onChange={np => setPaging(p => update(p, {"$merge": np}))}
          page_number={paging.page_number}
          num_pages={pagingResponse.num_pages}
          total_results={pagingResponse.total_results}
        />
      </Panel.Body>
    </Panel>
  )
}