import React, { Component } from "react";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
//import Checkbox from "react-bootstrap/lib/Checkbox";

import { Link } from "react-router-dom";

import DeleteModal from "./DeleteModal";

class Group extends Component {
  state = { showDelete: false };
  render() {
    const { user, onReload, tenantId, groupId } = this.props;
    const { showDelete } = this.state;
    return (
      <tr key={user.userId}>
        {/* <td>
          <Checkbox
            checked={user.userChecked}
            className={"table-checkbox"}
            onChange={() => {
              this.props.handleSingleCheckboxClick(user.userId);
            }}
          />
        </td> */}
        <td>
          <Link
            to={`/provisioning/${this.props.match.params.gwName}/tenants/${this.props.match.params.tenantId}/groups/${this.props.match.params.groupId}/trunkgroup/${this.props.match.params.trunkGroupName}/users/${user.userId}`}
          >
            {user.userId}
          </Link>
        </td>
        <td>{user.firstName}</td>
        <td>{user.lastName}</td>
        <td>{user.extension}</td>
        <td>{user.phoneNumber}</td>
        <td>{user.type}</td>
        <td>
          <ButtonToolbar>
            <Glyphicon
              glyph="glyphicon glyphicon-remove"
              onClick={() => this.setState({ showDelete: true })}
            />
          </ButtonToolbar>
          <DeleteModal
            userId={user.userId}
            show={showDelete}
            onClose={e => {
              onReload && onReload(tenantId, groupId);
              this.setState({ showDelete: false });
            }}
            {...this.props}
          />
        </td>
      </tr>
    );
  }
}

export default withRouter(Group);
