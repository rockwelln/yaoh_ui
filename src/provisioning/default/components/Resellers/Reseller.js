import React, { useState } from "react";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Checkbox from "react-bootstrap/lib/Checkbox";

// import DeleteModal from "./DeleteModal";
// import UsageModal from "./UsageModal";
// import EditModal from "./EditModal";

const Reseller = ({ reseller, changeDefault, onReload }) => {
  const [showUsage, setShowUsage] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const onCloseDeleteModal = () => {
    setShowDelete(false);
    onReload();
  };

  const onCloseEditModal = () => {
    setShowEdit(false);
    onReload();
  };

  return (
    <tr>
      <td>{reseller.name}</td>
      <td>{reseller.externalName}</td>
      <td className="text-align-center">
        <ButtonToolbar title="Edit">
          <Glyphicon
            glyph="glyphicon glyphicon-pencil"
            onClick={() => setShowEdit(true)}
          />
        </ButtonToolbar>
        {/* {showEdit && (
          <EditModal
            platform={platform}
            show={showEdit}
            onClose={onCloseEditModal}
          />
        )} */}
      </td>
      <td className="text-align-center">
        <ButtonToolbar>
          <Glyphicon
            glyph="glyphicon glyphicon-remove"
            onClick={() => setShowDelete(true)}
          />
        </ButtonToolbar>
        {/* {showDelete && (
          <DeleteModal
            platformName={platform.name}
            show={showDelete}
            onClose={onCloseDeleteModal}
          />
        )} */}
      </td>
    </tr>
  );
};

export default withRouter(Reseller);
