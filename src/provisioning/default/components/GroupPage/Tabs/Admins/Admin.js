import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import DeleteModal from "./DeleteModal";

class Admin extends Component {
  state = { showDelete: false };
  render() {
    const { admin, onReload } = this.props;
    const { showDelete } = this.state;
    return (
      <tr>
        <td>
          <Link
            to={`/provisioning/${this.props.match.params.gwName}/tenants/${
              this.props.tenantId
            }/groups/${this.props.groupId}/admins/${admin.userId}`}
          >
            {admin.userId}
          </Link>
        </td>
        <td>{admin.firstName}</td>
        <td>{admin.lastName}</td>
        <td>{admin.language}</td>
        <td>
          <ButtonToolbar>
            <Glyphicon
              glyph="glyphicon glyphicon-remove"
              onClick={() => this.setState({ showDelete: true })}
            />
          </ButtonToolbar>
          <DeleteModal
            adminId={admin.userId}
            tenantId={this.props.tenantId}
            groupId={this.props.groupId}
            show={showDelete}
            onClose={e => {
              onReload && onReload();
              this.setState({ showDelete: false });
            }}
            {...this.props}
          />
        </td>
      </tr>
    );
  }
}

export default withRouter(Admin);
