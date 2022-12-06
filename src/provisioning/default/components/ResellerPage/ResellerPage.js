import React, { useState } from "react";
import { useLocation, useHistory } from "react-router";
import { useParams } from "react-router";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import ResellerInfo from "./Tabs/ResellerInfo";
import Admins from "./Tabs/AdminsTab";
import DeleteModal from "../Resellers/DeleteModal";

const ResellerPage = () => {
  const location = useLocation();
  const history = useHistory();
  const params = useParams();

  const [showDelete, setShowDelete] = useState(false);

  const tabRouting = (key) => {
    switch (key) {
      case 0:
        history.push("#reseller_info");
        break;
      case 1:
        history.push("#administrators");
        break;
    }
  };

  const returnActiveKey = () => {
    switch (location.hash) {
      case "#reseller_info":
        return 0;
      case "#administrators":
        return 1;
      default:
        return 0;
    }
  };

  const onCloseDeleteModal = (status) => {
    if (status === "deleted") {
      history.push(`/provisioning/${params.gwName}/resellers/`);
    } else {
      setShowDelete(false);
    }
  };

  return (
    <>
      <div className={"panel-heading"}>
        <div className={"header"}>
          {`Reseller ${params.resellerName}`}
          <Glyphicon
            glyph="glyphicon glyphicon-trash"
            className={"margin-left-1"}
            onClick={() => setShowDelete(true)}
          />
          {showDelete && (
            <DeleteModal
              resellerName={params.resellerName}
              show={showDelete}
              onClose={onCloseDeleteModal}
            />
          )}
        </div>
      </div>
      <div className={"panel-body"}>
        <Tabs
          className={"margin-top-1"}
          activeKey={returnActiveKey()}
          onSelect={(key) => tabRouting(key)}
        >
          <Tab eventKey={0} title="Reseller info">
            <ResellerInfo />
          </Tab>
          <Tab eventKey={1} title="Administrators">
            <Admins />
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

export default ResellerPage;
