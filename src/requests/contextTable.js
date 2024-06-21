import React, {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import Panel from "react-bootstrap/lib/Panel";
import Table from "react-bootstrap/lib/Table";
import Row from "react-bootstrap/lib/Row";
import { SearchBar } from "../utils/datatable";


function ContextPanel({style, context, onFocus}) {
  const [filter, setFilter] = useState("");
  const inputEl = useRef();

  useEffect(() => {
    setTimeout(() => {
      if(onFocus && inputEl.current) {
        const node = ReactDOM.findDOMNode(inputEl.current);
        if (node.focus instanceof Function) {
          node.focus();
          console.log("focus")
        }
      }
    }, 500);
  }, [inputEl.current, onFocus]);

  return (
      <Panel style={style}>
          <Panel.Body>
              <Row style={{marginBottom: "10px"}}>
                <SearchBar
                    autoFocus={onFocus}
                    filter={filter}
                    refInput={inputEl}
                    placeholder={"Search for keys"}
                    onChange={setFilter} />
              </Row>

              <Table>
                <tbody>
                {
                  context
                    .filter(c => c.key.toLowerCase().includes(filter.toLowerCase()))
                    .sort((a, b) => a.id - b.id)
                    .map(c =>
                    <tr key={c.id}>
                      <th>
                        {c.key}
                      </th>
                      <td style={{wordWrap: 'break-word'}}>
                        {c.value}
                      </td>
                    </tr>
                  )
                }
                </tbody>
              </Table>
          </Panel.Body>
      </Panel>
  )
}

export default ContextPanel;
