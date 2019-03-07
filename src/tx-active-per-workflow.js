import React, {Component} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import {Doughnut} from 'react-chartjs-2';
import {DashboardPanel} from './dashboard-panel';
import ColorHash from 'color-hash';

import {fetch_get} from "./utils";
import {FormattedMessage} from 'react-intl';

const REFRESH_CYCLE = 60;


export default class ActiveTransactionsPerWorkflow extends Component {
    constructor(props, context) {
        super(props, context);
        this.cancelLoad = false;
        this.state = {
            data: [],
            names: {},
        };
        this.refresh = this.refresh.bind(this);
        this.loadActivityNames = this.loadActivityNames.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this._refreshHandler && clearInterval(this._refreshHandler);
    }

    componentDidMount() {
        this._refreshHandler = setInterval(this.refresh, REFRESH_CYCLE * 1000);
        this.refresh();
        this.loadActivityNames();
    }

    refresh() {
        if(this.cancelLoad) return;

        fetch_get('/api/v01/system/stats_active_per_wf', this.props.auth_token)
        .then(data => !this.cancelLoad && this.setState({data: data.requests}))
        .catch(console.error);
    }

    loadActivityNames() {
        if(this.cancelLoad) return;

        fetch_get('/api/v01/activities', this.props.auth_token)
        .then(data => !this.cancelLoad && this.setState({
            names: data.activities.reduce((rv, a) => {rv[a.id] = a.name; return rv;}, {})
        }))
        .catch(console.error)
    }

    render() {
        const {data, names} = this.state;
        const onShowClose = () => {
            this.setState({showBig: false});
        };
        let colorHash = new ColorHash();
        const chartData = {
            labels: data.map(d => `${names[d.activity_id]}: ${d.counter}`),
            datasets: [{
                data: data.map(d => d.counter),
                backgroundColor: data.map(d => colorHash.hex(names[d.activity_id])),
            }]
        };
        const chartOptions = {
            responsive: true,
            legend: {
                display: true,
                position: 'left',
            },
            tooltips: {
                enabled: false,
            },
        };

        return (
            <DashboardPanel
                title={<FormattedMessage id='act-tx-workflow' defaultMessage='Active transactions / workflow'/>}
                onShow={() => this.setState({showBig: true})} >
                <Doughnut data={chartData} options={chartOptions}/>
                <Modal show={this.state.showBig} onHide={onShowClose} dialogClassName='large-modal'>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FormattedMessage id='act-tx-workflow' defaultMessage='Active transactions / workflow'/>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Doughnut data={chartData} options={chartOptions}/>
                    </Modal.Body>
                </Modal>
            </DashboardPanel>
        );
    }
}