import React from "react";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";

//import DeleteModal from "./DeleteModal";

const Platform = ({ platform, changeDefault }) => {
  // state = { showDelete: false };
  // const { group, onReload } = this.props;
  // const { showDelete } = this.state;

  return (
    <tr>
      <td>
        <Checkbox
          className={"margin-top-0"}
          checked={platform.isDefault}
          onChange={(e) => {
            if (platform.isDefault) {
              return;
            }
            changeDefault(platform.name);
          }}
        />
      </td>
      <td>{platform.name}</td>
      <td>{platform.netAddress}</td>
      <td>{platform.port}</td>
      <td>{platform.mediaStream}</td>
      <td>{platform.transportProtocol}</td>
      <td>{platform.description}</td>
      <td>{platform.schemaVersion}</td>
      <td>{platform.supportVideoRecording ? "Yes" : "No"}</td>
      <td className="text-align-center">
        <ButtonToolbar title="Usage">
          <Glyphicon
            glyph="glyphicon glyphicon-list-alt"
            // onClick={() => this.setState({ showDelete: true })}
          />
        </ButtonToolbar>
        {/* <DeleteModal
              groupId={group.groupId}
              show={showDelete}
              onClose={e => {
                onReload && onReload();
                this.setState({ showDelete: false });
              }}
              {...this.props}
            /> */}
      </td>
      <td className="text-align-center">
        <ButtonToolbar>
          <Glyphicon
            glyph="glyphicon glyphicon-remove"
            // onClick={() => this.setState({ showDelete: true })}
          />
        </ButtonToolbar>
        {/* <DeleteModal
              groupId={group.groupId}
              show={showDelete}
              onClose={e => {
                onReload && onReload();
                this.setState({ showDelete: false });
              }}
              {...this.props}
            /> */}
      </td>
    </tr>
  );
};

export default withRouter(Platform);
