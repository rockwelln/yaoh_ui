import React, {Component, useCallback, useEffect, useState} from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import {Doughnut} from 'react-chartjs-2';
import {DashboardPanel} from './dashboard-panel';
import ColorHash from 'color-hash';

import {fetch_get} from "../utils";
import {FormattedMessage} from 'react-intl';
import {DashboardCard} from "./dashboard-tiles";
import queryString from "query-string";
import {Link} from "react-router-dom";

const REFRESH_CYCLE = 60;


export class ActiveTransactionsPerWorkflow_BKP extends Component {
    constructor(props, context) {
        super(props, context);
        this.cancelLoad = false;
        this.state = {
            data: [],
        };
        this.refresh = this.refresh.bind(this);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this._refreshHandler && clearInterval(this._refreshHandler);
    }

    componentDidMount() {
        this._refreshHandler = setInterval(this.refresh, REFRESH_CYCLE * 1000);
        this.refresh();
    }

    refresh() {
        if(this.cancelLoad) return;

        fetch_get('/api/v01/system/stats_active_per_wf')
        .then(data => !this.cancelLoad && this.setState({data: data.requests}))
        .catch(console.error);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const s1 = JSON.stringify(this.state.data);
        const s2 = JSON.stringify(nextState.data);
        return s1 !== s2
    }

    render() {
        const {data} = this.state;
        const onShowClose = () => {
            this.setState({showBig: false});
        };
        let colorHash = new ColorHash();
        const chartData = {
            labels: data.sort((a, b) => b.counter - a.counter).map(d => `${d.workflow_name}: ${d.counter}`),
            datasets: [{
                data: data.map(d => d.counter),
                backgroundColor: data.map(d => colorHash.hex(d.workflow_name || "")),
            }]
        };
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                maxHeight: 100,
              }
            },
            tooltips: {
                enabled: true,
            },
        };

        return (
            <DashboardPanel
                title={<FormattedMessage id='act-tx-workflow' defaultMessage='Active transactions / workflow'/>}
                onShow={() => this.setState({showBig: true})} >
                <Doughnut data={chartData} options={chartOptions} />
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


export default function ActiveTransactionsPerWorkflow() {
    const [data, setData] = useState([]);
    // for future use may be...
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(() => {
        setLoading(true);
        fetch_get('/api/v01/system/stats_active_per_wf')
            .then(data => {
                setData(data.requests);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <DashboardPanel
            title={<FormattedMessage id='act-tx-workflow' defaultMessage='Active transactions / workflow'/>} >
            {
                data.sort((a, b) => b.counter - a.counter).map(d => (
                  <Link to={{
                    pathname: "/transactions/list", search: queryString.stringify({
                      filter: JSON.stringify({
                        activity_id: {model: 'instances', value: d.activity_id, op: 'eq'},
                        status: {model: 'instances', value: 'ACTIVE', op: 'eq'},
                      })
                    })
                  }}>
                    <DashboardCard
                        key={d.workflow_name}
                        className={"bg-green-fade"}
                        heading={d.workflow_name}
                        number={d.counter} />
                  </Link>
                ))
            }
        </DashboardPanel>
    );
}