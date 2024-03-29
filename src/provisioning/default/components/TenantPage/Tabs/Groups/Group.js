import React, { Component } from "react";
import { withRouter } from "react-router";

import { Link } from "react-router-dom";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import DeleteModal from "./DeleteModal";

class Group extends Component {
  state = { showDelete: false };
  render() {
    const { group, onReload, showReseller } = this.props;
    const { showDelete } = this.state;
    return (
      <tr>
        <td>
          <Link
            to={`/provisioning/${this.props.match.params.gwName}/tenants/${group.tenantId}/groups/${group.groupId}`}
          >
            {group.groupId}
          </Link>
        </td>
        <td>{group.groupName}</td>
        <td>{group.userLimit}</td>
        {showReseller && <td>{group.resellerId}</td>}
        {group.sync ? (
          <td className="text-align-center">Sync</td>
        ) : (
          <td className="text-align-center">
            <ButtonToolbar>
              <Glyphicon
                glyph="glyphicon glyphicon-remove"
                onClick={() => this.setState({ showDelete: true })}
              />
            </ButtonToolbar>
            <DeleteModal
              groupId={group.groupId}
              show={showDelete}
              onClose={(e) => {
                onReload && onReload();
                this.setState({ showDelete: false });
              }}
              {...this.props}
            />
          </td>
        )}
      </tr>
    );
  }
}

export default withRouter(Group);
