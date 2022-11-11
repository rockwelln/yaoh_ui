import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useHistory } from "react-router";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
//import { fetchGetBWKSLicenses } from "../../../store/actions";

import Loading from "../../../common/Loading";
import Platforms from "./CallRecordingPlatformsTabs/Platforms/";

const CallRecordingPlatforms = () => {
  const location = useLocation();
  const history = useHistory();
  //const [isLoading, setIsLoading] = useState(false);

  //const licenses = useSelector(state => state.bwksLicenses);
  //const dispatch = useDispatch();

  // useEffect(() => {
  //   setIsLoading(true);
  //   dispatch(fetchGetBWKSLicenses()).then(() => setIsLoading(false));
  // }, []);

  // if (isLoading) {
  //   return <Loading />;
  // }

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
          1
        </Tab>
      </Tabs>
    </>
  );
};

export default CallRecordingPlatforms;
