import React, {useCallback, useEffect, useState} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

import {FormattedMessage} from 'react-intl';
import {fetch_get, NotificationsManager} from "../utils";

import TransactionsOverTime from './tx-over-time';
import SuccessRateOverTime from './tx-success-rate-over-time';
import ActiveTransactionsPerWorkflow from './tx-active-per-workflow';
import ProxyRequestsOverTime from "./tx-per-proxy-over-time";
import {GatewaysStatusTile, DashboardCard} from './dashboard-tiles';
import ManualActionsBox, {ManualActionsTile, NPManualActionsBox} from "./manualActions";
// import {TransactionsNeedApprovalTile} from "../np/dashboard_tiles";

import './dashboard.css';
import {modules, supportedModule} from "../utils/user";
import {Link} from "react-router-dom";
import {activeCriteria, errorCriteria} from "../requests/requests";
import queryString from 'query-string';
import update from "immutability-helper";
const REFRESH_CYCLE = 10;


function fetch_gateways(onSuccess) {
    fetch_get('/api/v01/gateways')
        .then(data => onSuccess(data.gateways))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="gw-stats-fect-failed" defaultMessage="Failed to fetch gateways"/>,
            error.message
        ));
}


function fetch_stats(isNpact, onSuccess) {
    fetch_get(`/api/v01/${isNpact?"npact":"apio"}/stats`)
        .then(data => onSuccess(data))
        .catch(error => NotificationsManager.error(
                <FormattedMessage id="core-stats-fect-failed" defaultMessage="Failed to fetch statistics"/>,
                error.message
        ));
}

export default function Dashboard(props) {
    const [stats, setStats] = useState({active_requests: {}});
    const [gateways, setGateways] = useState({});
    const isManual = props.user_info.modules.includes(modules.manualActions);
    const isNpact = supportedModule(modules.npact, props.user_info.modules);

    const fetch_gw = useCallback(() => fetch_gateways(setGateways), []);
    const fetch_s = useCallback(() => fetch_stats(isNpact, setStats), [isNpact]);

    useEffect(() => {
        document.title = "Dashboard";
        fetch_gateways(setGateways);
        const interval = setInterval(fetch_gw, REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetch_stats(isNpact, setStats);
        const interval = setInterval(fetch_s, REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, [isNpact]);

    let statsPanels = [
        <TransactionsOverTime {...props} />
    ];
    if(props.user_info.modules.includes(modules.proxy)) {
        statsPanels.push(<ProxyRequestsOverTime {...props} />);
    }
    statsPanels.push(<ActiveTransactionsPerWorkflow {...props} />);
    if(isManual) {
        if(isNpact) {
          statsPanels.push(<NPManualActionsBox/>);
        } else {
          statsPanels.push(<ManualActionsBox/>);
        }
    }

    return (
        <div>
            <Row>
              <Col xs={12} md={6} lg={3}>
                <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(activeCriteria)
                    })
                  }}>
                  <DashboardCard
                    className={"bg-arielle-smile"}
                    heading={"Active workflows"}
                    subheading={"Workflows currently open"}
                    number={stats.active_requests.total} />
                </Link>
              </Col>
              <Col xs={12} md={6} lg={3}>
                <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(update(errorCriteria, {$merge: activeCriteria}))
                    })
                  }}>
                  <DashboardCard
                    className={"bg-alert-danger"}
                    heading={"Errors"}
                    subheading={"Workflows blocked"}
                    number={stats.active_requests.with_errors} />
                </Link>
              </Col>
              <Col xs={12} md={6} lg={3}>
                { isManual && <ManualActionsTile /> }
              </Col>
              <Col xs={12} md={6} lg={3}>
                <GatewaysStatusTile gateways={gateways} />
              </Col>
            </Row>
            <Row>
                {
                    props.user_info.modules.includes(modules.proxy) &&
                      <Col xs={12}>
                        <SuccessRateOverTime {...props} />
                      </Col>
                }
            </Row>
            <Row>
                {
                    statsPanels.map(e => <Col sm={6} md={6} xs={12}>{e}</Col>)
                }
            </Row>
        </div>
    )
}
