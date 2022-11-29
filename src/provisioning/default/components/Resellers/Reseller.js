import React, { useState } from "react";
import { withRouter } from "react-router";
import { useDispatch } from "react-redux";

import { fetchPutUpdateReseller } from "../../store/actions";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import EditResellerModal from "./AddModifyReseller";
import DeleteModal from "./DeleteModal";

const Reseller = ({ reseller, onReload }) => {
  const dispatch = useDispatch();

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

  const updateReseller = ({ data, callback }) => {
    dispatch(fetchPutUpdateReseller(reseller.name, data)).then((isSuccess) => {
      callback && callback();
      if (isSuccess === "success") {
        onCloseEditModal();
      }
    });
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
        {showEdit && (
          <EditResellerModal
            reseller={reseller}
            show={showEdit}
            onClose={onCloseEditModal}
            mode="Edit"
            onSubmit={updateReseller}
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
            resellerName={reseller.name}
            show={showDelete}
            onClose={onCloseDeleteModal}
          />
        )}
      </td>
    </tr>
  );
};

export default withRouter(Reseller);
