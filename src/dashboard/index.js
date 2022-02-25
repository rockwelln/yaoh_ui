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
import {localUser, modules, supportedModule} from "../utils/user";
import {Link} from "react-router-dom";
import {activeCriteria, errorCriteria} from "../requests/requests";
import {activeCriteria as npActiveCriteria, errorCriteria as npErrorCriteria} from "../np/np-requests";
import queryString from 'query-string';
import update from "immutability-helper";
import TopSlowApis from "./topSlowApis";
import ResponseTimeOvertime from "./responseTimeOverTime";
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
    const [stats, setStats] = useState({active: {}});
    const [gateways, setGateways] = useState({});
    const isManual = localUser.isModuleEnabled(modules.manualActions);
    const isNpact = localUser.isModuleEnabled(modules.npact); // supportedModule(modules.npact, props.user_info.modules);

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
    if(localUser.isModuleEnabled(modules.proxy) || localUser.isModuleEnabled(modules.proxy)) {
        statsPanels.push(<ProxyRequestsOverTime {...props} />);
        statsPanels.push(<TopSlowApis {...props} />);
        statsPanels.push(<ResponseTimeOvertime {...props} />);
    }
    statsPanels.push(<ActiveTransactionsPerWorkflow {...props} />);
    if(isManual) {
        if(isNpact) {
          statsPanels.push(<NPManualActionsBox/>);
        } else {
          statsPanels.push(<ManualActionsBox/>);
        }
    }

    let activeCriteriaQuery = activeCriteria;
    let errorCriteriaQuery = errorCriteria;
    if(isNpact) {
      activeCriteriaQuery = npActiveCriteria;
      errorCriteriaQuery = npErrorCriteria;
    }

    return (
        <div>
            <Row>
              <Col xs={12} md={6} lg={3}>
                <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(activeCriteriaQuery)
                    })
                  }}>
                  <DashboardCard
                    className={"bg-arielle-smile"}
                    heading={"Active workflows"}
                    subheading={"Workflows currently open"}
                    number={stats.active.total} />
                </Link>
              </Col>
              {
                stats.active.with_errors_with_request !== 0 ||
                stats.active.with_errors_without_request === 0  ?
                <Col xs={12} md={6} lg={3}>
                  <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(update(errorCriteriaQuery, {$merge: activeCriteriaQuery}))
                    })
                  }}>
                    <DashboardCard
                      className={
                        stats.active.with_errors_without_request === 0 &&
                        stats.active.with_errors_with_request === 0 ? "bg-grow-early" : "bg-alert-danger"}
                      heading={"Errors"}
                      subheading={"Workflows blocked"}
                      number={stats.active.with_errors_with_request} />
                  </Link>
                </Col> :
                <Col xs={12} md={6} lg={3}>
                  <Link to={{
                    pathname: "/custom-transactions/list", search: queryString.stringify({
                      filter: JSON.stringify(update(errorCriteriaQuery, {$merge: activeCriteriaQuery}))
                    })
                  }}>
                    <DashboardCard
                      className={"bg-alert-danger"}
                      heading={"Errors"}
                      subheading={"Sch./Bulk workflows blocked"}
                      number={stats.active.with_errors_without_request} />
                  </Link>
                </Col>
              }
              <Col xs={12} md={6} lg={3}>
                { isManual && <ManualActionsTile /> }
              </Col>
              <Col xs={12} md={6} lg={3}>
                <GatewaysStatusTile gateways={gateways} />
              </Col>
            </Row>
            <Row>
                {
                    (localUser.isModuleEnabled(modules.proxy) || localUser.isModuleEnabled(modules.draas)) &&
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
