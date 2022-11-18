import React from "react";
import { useLocation, useHistory } from "react-router";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Platforms from "./CallRecordingPlatformsTabs/Platforms/";
import Properties from "./CallRecordingPlatformsTabs/Properties";

const CallRecordingPlatforms = () => {
  const location = useLocation();
  const history = useHistory();

  const tabRouting = (key) => {
    switch (key) {
      case 0:
        history.push("#callRecordingPlatforms_Platforms");
        break;
      case 1:
        history.push("#callRecordingPlatforms_Properties");
        break;
    }
  };

  const returnActiveKey = () => {
    switch (location.hash) {
      case "#callRecordingPlatforms_Platforms":
        return 0;
      case "#callRecordingPlatforms_Properties":
        return 1;
      default:
        return 0;
    }
  };

  return (
    <>
      <Tabs
        className={"margin-top-1"}
        activeKey={returnActiveKey()}
        onSelect={(key) => tabRouting(key)}
      >
        <Tab eventKey={0} title="Platforms">
          <Platforms />
        </Tab>
        <Tab eventKey={1} title="Properties">
          <Properties />
        </Tab>
      </Tabs>
    </>
  );
};

export default CallRecordingPlatforms;
