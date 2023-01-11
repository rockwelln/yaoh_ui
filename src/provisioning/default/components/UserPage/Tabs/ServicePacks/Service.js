import React, { Component } from "react";

import Checkbox from "react-bootstrap/lib/Checkbox";

export default class Sevice extends Component {
  state = { showDelete: false };
  render() {
    const { service, index, dict } = this.props;
    return (
      <tr>
        <td>{dict[service.name]?.display_name || service.name}</td>
        <td className={"text-center"}>
          <Checkbox
            checked={service.serviceChecked}
            className={"table-checkbox"}
            onChange={() => {
              this.props.handleSingleCheckboxClick(index);
            }}
          />
        </td>
      </tr>
    );
  }
}
