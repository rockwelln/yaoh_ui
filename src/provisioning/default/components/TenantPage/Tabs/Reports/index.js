import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { useSelector, useDispatch } from "react-redux";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Form from "react-bootstrap/lib/Form";

import {
  fetchGetReportingCustomer,
  fetchDisableReportingCustomer,
  fetchEnableReportingCustomer,
} from "../../../../store/actions";

import { FormattedMessage } from "react-intl";

import Loading from "../../../../common/Loading";
import ReportsTable from "./ReportsTable";
import ReportHistoryTable from "./ReportHistoryTable";

const Reports = ({match, refreshTab}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const customer = useSelector(state => state.customer);
  const dispatch = useDispatch();

  const disableService = () => {
    setIsActionLoading(true);
    dispatch(fetchDisableReportingCustomer(match.params.tenantId))
      .then(() => dispatch(fetchGetReportingCustomer(match.params.tenantId)))
      .then(() => setIsActionLoading(false));
  };

  const enableService = () => {
    setIsActionLoading(true);
    dispatch(fetchEnableReportingCustomer(match.params.tenantId))
      .then(() => dispatch(fetchGetReportingCustomer(match.params.tenantId)))
      .then(() => setIsActionLoading(false))
  };

  // useEffect(() => {
  //   dispatch(fetchGetReportingCustomer(match.params.tenantId)).then(() =>
  //     setIsLoading(false)
  //   );
  // }, []);

  useEffect(() => {
    if (refreshTab) {
      setIsLoading(true);
      dispatch(fetchGetReportingCustomer(match.params.tenantId)).then(
        () => setIsLoading(false)
      );
    }
  }, [refreshTab]);

  if (isLoading) {
    return <Loading />;
  }

  const isEnabled = customer?.enabled

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
                <Form>
                  <FormGroup>
                    <Col componentClass={ControlLabel} sm={12}>
                      <FormattedMessage id="service" defaultMessage="Service:" />
                      {" "}
                      {
                        isEnabled && "enabled"
                      }
                      {" "}
                      {
                        isEnabled ?
                          <Button
                            disabled={isActionLoading}
                            onClick={() => disableService()}
                            bsStyle="danger">
                            Disable
                          </Button> :
                          <Button
                            disabled={isActionLoading}
                            onClick={() => enableService()}
                            bsStyle="primary">
                            Enable
                          </Button>
                      }
                    </Col>
                  </FormGroup>
                </Form>
              </Row>

              <hr/>

              <Row>
                <Col sm={12}>
                  <ControlLabel><FormattedMessage id="configuration" defaultMessage="Configuration" /></ControlLabel>
                  <ReportsTable tenantId={match.params.tenantId} />
                </Col>
              </Row>

              <hr/>

              <Row>
                <Col sm={12}>
                  <ControlLabel><FormattedMessage id="history" defaultMessage="History" /></ControlLabel>
                  <ReportHistoryTable tenantId={match.params.tenantId} />
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
