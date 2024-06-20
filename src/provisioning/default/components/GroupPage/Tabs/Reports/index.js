import React from "react";
import { withRouter } from "react-router";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Panel from "react-bootstrap/lib/Panel";
import ControlLabel from "react-bootstrap/lib/ControlLabel";

import { FormattedMessage } from "react-intl";
import ReportsTable from "./ReportsTable";
import ReportHistoryTable from "./ReportHistoryTable";

const Reports = ({match}) => {
  return (
    <React.Fragment>
      <Row className={"margin-top-2"}>
        <Col mdOffset={1} md={11}>
          <Panel>
            <Panel.Heading>
              <FormattedMessage
                id="analytics_tables"
                defaultMessage="Analytics tables"
              />
            </Panel.Heading>
            <Panel.Body>
              <Row>
                <Col sm={12}>
                  <ControlLabel><FormattedMessage id="configuration" defaultMessage="Configuration" /></ControlLabel>
                  <ReportsTable
                    tenantId={match.params.tenantId}
                    groupId={match.params.groupId} />
                </Col>
              </Row>

              <hr/>

              <Row>
                <Col sm={12}>
                  <ControlLabel><FormattedMessage id="history" defaultMessage="History" /></ControlLabel>
                  <ReportHistoryTable
                    tenantId={match.params.tenantId}
                    groupId={match.params.groupId} />
                </Col>
              </Row>
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default withRouter(Reports);
