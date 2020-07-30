import React, {useEffect, useState} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

import {FormattedMessage} from 'react-intl';
import {fetch_get, NotificationsManager} from "../utils";

import TransactionsOverTime from './tx-over-time';
import SuccessRateOverTime from './tx-success-rate-over-time';
import ActiveTransactionsPerWorkflow from './tx-active-per-workflow';
import ProxyRequestsOverTime from "./tx-per-proxy-over-time";
import {EmptyTile, GatewaysStatusTile, ErrorCasesTile} from './dashboard-tiles';
import ManualActionsBox, {ManualActionsTile} from "./manualActions";
import {TransactionsNeedApprovalTile} from "../np/dashboard_tiles";

import './dashboard.css';
import {modules, supportedModule} from "../utils/user";
const REFRESH_CYCLE = 30;


function fetch_gateways(onSuccess) {
    fetch_get('/api/v01/gateways')
        .then(data => onSuccess(data.gateways))
        .catch(error => NotificationsManager.error(
            <FormattedMessage id="gw-stats-fect-failed" defaultMessage="Failed to fetch gateways"/>,
            error.message
        ));
}


function fetch_stats(isNpact, onSuccess) {
    fetch_get(`/api/v01/${isNpact?"voo":"apio"}/stats`)
        .then(data => onSuccess(data))
        .catch(error => NotificationsManager.error(
                <FormattedMessage id="core-stats-fect-failed" defaultMessage="Failed to fetch statistics"/>,
                error.message
        ));
}


function _buildPadding(nbTiles) {
    const tilesPerRow = 6;

    let padding = [];
    if(nbTiles < tilesPerRow && (tilesPerRow - nbTiles) % 2) {
        padding.push(<EmptyTile className='col-md-1-5'/>)
    }
    let i = Math.max(Math.floor((tilesPerRow - nbTiles) / 2), 0);
    while(i--) {
        padding.push(<EmptyTile />);
    }
    return padding;
}

export default function Dashboard(props) {
    const [stats, setStats] = useState({active_requests: {}});
    const [gateways, setGateways] = useState({});
    const isManual = props.user_info.modules.includes(modules.manualActions);
    const isNpact = supportedModule(modules.npact, props.user_info.modules);

    useEffect(() => {
        fetch_gateways(setGateways);
        const interval = setInterval(() => fetch_gateways(setGateways), REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetch_stats(isNpact, setStats);
        const interval = setInterval(() => fetch_stats(isNpact, setStats), REFRESH_CYCLE * 1000);
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
        statsPanels.push(<ManualActionsBox {...props} />);
    }

    return (
        <div>
            <Row>
                {
                    _buildPadding((isNpact?2:1) + Object.keys(gateways).length)
                }
                <ErrorCasesTile count={stats.active_requests.with_errors} total={stats.active_requests.total}/>
                {
                    isManual && <ManualActionsTile />
                }
                {
                    Object.keys(gateways).slice(0, 5).map(k => <GatewaysStatusTile key={k} label={k} status={gateways[k]} />)
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
