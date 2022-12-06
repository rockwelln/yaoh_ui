import React, { useState } from "react";
import { withRouter } from "react-router";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";

import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import { fetchPutUpdateResellerAdmin } from "../../../../store/actions";

import DeleteModal from "./DeleteModal";
import EditAdminModal from "./AddEditAdmin";

const levelAdmin = {
  0: "End User",
  4: "Group Department",
  8: "Group",
  12: "Tenant",
  16: "System",
};

const Admin = ({ admin, onReload }) => {
  const dispatch = useDispatch();
  const params = useParams();

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
    const { username, ...rest } = data;
    dispatch(
      fetchPutUpdateResellerAdmin(params.resellerName, username, rest)
    ).then((isSuccess) => {
      callback && callback();
      if (isSuccess === "success") {
        onCloseEditModal();
      }
    });
  };

  return (
    <tr>
      <td>{admin.username}</td>
      <td>{admin.firstName}</td>
      <td>{admin.lastName}</td>
      <td>{admin.language}</td>
      <td>{levelAdmin[admin.userLevel] || admin.userLevel}</td>
      <td>{admin.userProfileType}</td>
      <td>{admin.tenantId}</td>
      <td className="text-align-center">
        <ButtonToolbar>
          <Glyphicon
            glyph="glyphicon glyphicon-pencil"
            onClick={() => setShowEdit(true)}
          />
        </ButtonToolbar>
        {showEdit && (
          <EditAdminModal
            admin={admin}
            show={showEdit}
            mode="Edit"
            onClose={() => setShowEdit(false)}
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
            adminId={admin.username}
            show={showDelete}
            onClose={onCloseDeleteModal}
          />
        )}
      </td>
    </tr>
  );
};

export default withRouter(Admin);
