import React from "react";
import { withRouter } from "react-router";

import "./styles.css";
import {FormattedMessage} from "react-intl";
import {ProvProxiesManager} from "../../../../utils";

const Title = ({ location }) => {
  const gateway_id = location.pathname.split("/")[2];

  return (
    <h1>
        <FormattedMessage id="provisioning" defaultMessage="Provisioning" /> {' '}
        {ProvProxiesManager.findById(gateway_id).name}
    </h1>
  );
};

export default withRouter(Title);
