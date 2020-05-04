import React, {useEffect, useState} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

import {FormattedMessage} from 'react-intl';
import {fetch_get, NotificationsManager} from "../utils";

import TransactionsOverTime from './tx-over-time';
import ActiveTransactionsPerWorkflow from './tx-active-per-workflow';
import ProxyRequestsOverTime from "./tx-per-proxy-over-time";
import {EmptyTile, GatewaysStatusTile, ErrorCasesTile} from './dashboard-tiles';
import ManualActionsBox from "./manualActions";

import './dashboard.css';
import {modules} from "../utils/user";
const REFRESH_CYCLE = 30;


function fetch_gateways(onSuccess) {
    fetch_get('/api/v01/gateways')
        .then(data => onSuccess(data.gateways))
        .catch(console.error);
}


function fetch_stats(onSuccess) {
    fetch_get('/api/v01/apio/stats')
        .then(data => onSuccess(data))
        .catch(error => NotificationsManager.error(
                <FormattedMessage id="core-stats-fect-failed" defaultMessage="Failed to fetch statistics"/>,
                error.message
        ));
}


function _buildPadding(nbTiles) {
    const tilesPerRow = 6;

    let padding = [];
    if((tilesPerRow - nbTiles) % 2) {
        padding.push(<EmptyTile className='col-md-1-5'/>)
    }
    let i = Math.floor((tilesPerRow - nbTiles) / 2);
    while(i--) {
        padding.push(<EmptyTile />);
    }
    return padding;
}

export default function Dashboard(props) {
    const [stats, setStats] = useState({active_requests: {}});
    const [gateways, setGateways] = useState({});

    useEffect(() => {
        fetch_gateways(setGateways);
        const interval = setInterval(() => fetch_gateways(setGateways), REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetch_stats(setStats);
        const interval = setInterval(() => fetch_stats(setStats), REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, []);

    const statsPanels = [
        <TransactionsOverTime {...props} />,
        // todo to be improved!!
        props.user_info.modules.includes(modules.orange) ? "" : <ProxyRequestsOverTime {...props} />,
        <ActiveTransactionsPerWorkflow {...props} />,
        props.user_info.modules.includes(modules.manualActions) ? <ManualActionsBox {...props} /> : "",
    ];

    return (
        <div>
            <Row>
                {
                    _buildPadding(1 + Object.keys(gateways).length)
                }
                <ErrorCasesTile count={stats.active_requests.with_errors} total={stats.active_requests.total}/>
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