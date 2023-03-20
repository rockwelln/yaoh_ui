import React, { useState } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import DeleteModal from "./DeleteModal";

const TrunkGroup = (props) => {
  const [showDelete, setShowDelete] = useState(false);
  return (
    <tr>
      <td>{props.trunkGroup.name}</td>
      <td>{props.trunkGroup.routingMode}</td>
      <td>
        <ButtonToolbar>
          <Glyphicon
            glyph="glyphicon glyphicon-remove"
            onClick={() => setShowDelete(true)}
          />
        </ButtonToolbar>
        <DeleteModal
          trunkName={props.trunkGroup.name}
          show={showDelete}
          onClose={() => {
            props.onReload();
            setShowDelete(false);
          }}
        />
      </td>
    </tr>
  );
};

export default withRouter(TrunkGroup);
