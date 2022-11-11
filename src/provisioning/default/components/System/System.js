import React from "react";
import { useLocation, useHistory } from "react-router";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";

import CallRecordingPlatforms from "./Tabs/CallRecordingPlatforms";

const System = () => {
  const location = useLocation();
  const history = useHistory();

  const tabRouting = (key) => {
    switch (key) {
      case 0:
        history.push("#callRecordingPlatforms_Platforms");
        break;
      case 1:
        history.push("#numbers");
        break;
    }
  };

  const returnActiveKey = () => {
    switch (location.hash) {
      case "#callRecordingPlatforms_Platforms":
        return 0;
      case "#callRecordingPlatforms_Properties":
        return 0;
      default:
        return 0;
    }
  };

  return (
    <>
      <div className={"panel-heading"}>
        <div className={"header"}>{`System`}</div>
      </div>
      <div className={"panel-body"}>
        <Tabs
          className={"margin-top-1"}
          activeKey={returnActiveKey()}
          onSelect={(key) => tabRouting(key)}
        >
          <Tab eventKey={0} title="Call Recording Platforms">
            <CallRecordingPlatforms />
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

export default System;
