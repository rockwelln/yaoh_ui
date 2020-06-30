import React from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import { FormattedMessage } from 'react-intl';
import 'react-datepicker/dist/react-datepicker.css';
import { NPPortInRequest as CrdbPortinRequest } from "./requests/crdb-rsa";


export function NPPortInRequest() {
  return (
    <Panel>
      <Panel.Heading>
        <Panel.Title>
          <FormattedMessage id="new-port-in" defaultMessage="New port-in request" />
        </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        <CrdbPortinRequest />
      </Panel.Body>
    </Panel>
  )
}
