import React, {Component} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

import {FormattedMessage} from 'react-intl';
import {fetch_get} from "./utils";

import TransactionsOverTime from './tx-over-time';
import ActiveTransactionsPerWorkflow from './tx-active-per-workflow';
import {EmptyTile, GatewaysStatusTile, ErrorCasesTile} from './dashboard-tiles';

import './dashboard.css';


export default class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {stats: {active_requests: {}}, gateways: {}};
        this.fetch_gateways = this.fetch_gateways.bind(this);
        this.fetch_stats = this.fetch_stats.bind(this);
    }

    fetch_gateways() {
        fetch_get('/api/v01/gateways', this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                this.setState({gateways: data.gateways});
                setTimeout(this.fetch_gateways, 30 * 1000);
            })
            .catch(error => {
                if(this.cancelLoad) return;
                console.error(error);
                setTimeout(this.fetch_gateways, 10 * 1000);
            });
    }

    fetch_stats() {
        fetch_get('/api/v01/apio/stats', this.props.auth_token)
            .then(data => {
                if(this.cancelLoad) return;
                this.setState({stats: data});
                setTimeout(this.fetch_stats, 30 * 1000); // every 30 seconds
            })
            .catch(error => {
                if(this.cancelLoad) return;
                this.props.notifications && this.props.notifications.addNotification({
                    title: <FormattedMessage id="core-stats-fect-failed" defaultMessage="Failed to fetch statistics"/>,
                    message: error.message,
                    level: 'error'
                });
                setTimeout(this.fetch_stats, 10 * 1000); // every 10 seconds
            });
    }

    componentDidMount() {
        this.fetch_gateways();
        this.fetch_stats();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    render() {
        const {gateways, stats} = this.state;
        return (
            <div>
                <Row>
                    <EmptyTile />
                    <EmptyTile className='col-md-1-5'/>
                    <ErrorCasesTile count={stats.active_requests.with_errors} total={stats.active_requests.total}/>
                    {
                        Object.keys(gateways).map(k => <GatewaysStatusTile key={k} label={k} status={gateways[k]} />)
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
