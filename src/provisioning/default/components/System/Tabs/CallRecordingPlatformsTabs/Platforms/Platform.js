import React, { useState } from "react";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";

import DeleteModal from "./DeleteModal";
import UsageModal from "./UsageModal";

const Platform = ({ platform, changeDefault, onReload }) => {
  const [showUsage, setShowUsage] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const onCloseDeleteModal = () => {
    setShowDelete(false);
    onReload();
  };

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
            onClick={() => setShowUsage(true)}
          />
        </ButtonToolbar>
        {showUsage && (
          <UsageModal
            platformName={platform.name}
            show={showUsage}
            onClose={() => setShowUsage(false)}
          />
        )}
      </td>
      <td className="text-align-center">
        <ButtonToolbar>
          <Glyphicon
            glyph="glyphicon glyphicon-remove"
            onClick={() => setShowDelete(true)}
          />
        </ButtonToolbar>
        {showDelete && (
          <DeleteModal
            platformName={platform.name}
            show={showDelete}
            onClose={onCloseDeleteModal}
          />
        )}
      </td>
    </tr>
  );
};

export default withRouter(Platform);
