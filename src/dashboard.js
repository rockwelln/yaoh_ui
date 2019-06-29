import React, {Component} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

import {FormattedMessage} from 'react-intl';
import {fetch_get} from "./utils";

import TransactionsOverTime from './tx-over-time';
import ActiveTransactionsPerWorkflow from './tx-active-per-workflow';
import {EmptyTile, GatewaysStatusTile, ErrorCasesTile} from './dashboard-tiles';

import './dashboard.css';
const REFRESH_CYCLE = 30;


export default class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {stats: {active_requests: {}}, gateways: {}};
    }

    fetch_gateways() {
        fetch_get('/api/v01/gateways', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({gateways: data.gateways}))
            .catch(console.error);
    }

    fetch_stats() {
        fetch_get('/api/v01/apio/stats', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({stats: data}))
            .catch(error => {
                if(this.cancelLoad) return;
                this.props.notifications && this.props.notifications.addNotification({
                    title: <FormattedMessage id="core-stats-fect-failed" defaultMessage="Failed to fetch statistics"/>,
                    message: error.message,
                    level: 'error'
                });
            });
    }

    componentDidMount() {
        this.fetch_gateways();
        this.fetch_stats();

        this.refreshGatewaysHandler = setInterval(this.fetch_gateways.bind(this), REFRESH_CYCLE * 1000);
        this.refreshStatsHandler = setInterval(this.fetch_stats.bind(this), REFRESH_CYCLE * 1000);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this.refreshGatewaysHandler && clearInterval(this.refreshGatewaysHandler);
        this.refreshStatsHandler && clearInterval(this.refreshStatsHandler);
    }

    static _buildPadding(nbTiles) {
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

    render() {
        const {gateways, stats} = this.state;
        return (
            <div>
                <Row>
                    {
                        Dashboard._buildPadding(1 + Object.keys(gateways).length)
                    }
                    <ErrorCasesTile count={stats.active_requests.with_errors} total={stats.active_requests.total}/>
                    {
                        Object.keys(gateways).slice(0, 5).map(k => <GatewaysStatusTile key={k} label={k} status={gateways[k]} />)
                    }
                </Row>
                <Row>
                    <Col sm={6} md={6} xs={12}>
                        <TransactionsOverTime {...this.props} />
                    </Col>
                    <Col sm={6} md={6} xs={12}>
                        <ActiveTransactionsPerWorkflow {...this.props} />
                    </Col>
                </Row>
            </div>
        );
    }
}
