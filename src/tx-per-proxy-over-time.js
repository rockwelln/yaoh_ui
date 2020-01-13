import React, {Component} from 'react';
import {Bar} from 'react-chartjs-2';
import Modal from 'react-bootstrap/lib/Modal';
import Col from 'react-bootstrap/lib/Col';
import Form from 'react-bootstrap/lib/Form';
import Button from 'react-bootstrap/lib/Button';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import ColorHash from 'color-hash';

import {FormattedMessage} from 'react-intl';
import {fetch_get} from "./utils";
import {DashboardPanel} from './dashboard-panel';

const DEFAULT_NB_DAYS = 30;
const REFRESH_CYCLE = 60;


export default class ProxyRequestsOverTime extends Component {
    state = {
        data: undefined,
        names: {},
        start: moment().subtract(DEFAULT_NB_DAYS, "days").toDate(),
        end: undefined,
    };

    refresh() {
        if(this.cancelLoad) return;

        let {start, end} = this.state;
        if(end === undefined) {
            end = moment();
        }
        fetch_get(
            `/api/v01/apio/proxy_stats?start=${moment(start).format('YYYY-MM-DD')}&end=${moment(end).endOf('day').format('YYYY-MM-DDTHH:mm:ss')}`
        )
        .then(data => !this.cancelLoad && this.setState({data: data.requests}))
        .catch(console.error);
    }

    loadActivityNames() {
        /*
        if(this.cancelLoad) return;

        fetch_get('/api/v01/activities', this.props.auth_token)
        .then(data => !this.cancelLoad && this.setState({
            names: data.activities.reduce((rv, a) => {rv[a.id] = a.name; return rv;}, {})
        }))
        .catch(console.error)
         */
    }

    componentDidMount() {
        this.refresh();
        this.loadActivityNames();
        this._refreshHandler = setInterval(this.refresh.bind(this), REFRESH_CYCLE * 1000);
    }

    componentWillUnmount() {
        this.cancelLoad = true;
        this._refreshHandler && clearInterval(this._refreshHandler);
    }

    render() {
        const onConfigClose = () => {
            this.setState({showSettings: false});
            this.refresh();
        };
        const onShowClose = () => {
            this.setState({showBig: false});
        };

        // group by activity_id
        const grouped_data = this.state.data ? this.state.data.reduce((rv, x) => {
            (rv[x['proxy_gateway_host']] = rv[x['proxy_gateway_host']] || []).push(x);
            return rv;
        }, {}) : {};

        const prepare_data = (labels, data) => {
            return labels.map(l => data[l] === undefined ? 0 : data[l]);
       };

        const labels = this.state.data ?
            Object.keys(this.state.data.reduce((rv , x) => {rv[x['creation_day']]=1; return rv;}, {})) : [];

        let colorHash = new ColorHash();
        const datasets = Object.keys(grouped_data).map(k => ({
            label: this.state.names[k] || k,
            data: prepare_data(
                labels,
                grouped_data[k].reduce(
                    (rv, x) => {
                        rv[x['creation_day']] = x['counter'];
                        return rv;
                    }, {}
                )
            ),
            backgroundColor: colorHash.hex(this.state.names[k] || k),
        }));

        const chartData = {
            labels: labels,
            datasets: datasets,
        };
        const chartOptions = {
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                xAxes: [{
                    stacked: true,
                    //distribution: 'series',
                    // barThickness: 5,
                    barPercentage: 0.1,
                    type: 'time',
                    time: {
                        unit: 'day',
                        min: this.state.start,
                        max: this.state.end || moment(),
                        minUnit: 'day',
                    },
                }],
                yAxes: [{
                    stacked: true
                }]
            }
        };
        return (
            <DashboardPanel
                title={<FormattedMessage id="proxy-requests-per-day" defaultMessage="Proxy requests / day"/>}
                onSettings={() => this.setState({showSettings: true})}
                onShow={() => this.setState({showBig: true})}
            >
                <Bar data={chartData} options={chartOptions} />

                <Modal show={this.state.showSettings} onHide={onConfigClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FormattedMessage id="config-px-req-per-day" defaultMessage="Configure proxy requests per day"/>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="start" defaultMessage="Start" />
                                </Col>

                                <Col sm={9}>
                                    <DatePicker
                                        className="form-control"
                                        selected={this.state.start}
                                        onChange={d => this.setState({
                                            start: d
                                        })}
                                        dateFormat="dd/MM/yyyy"
                                        locale="fr-fr" />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={2}>
                                    <FormattedMessage id="end" defaultMessage="End" />
                                </Col>

                                <Col sm={9}>
                                    <DatePicker
                                        className="form-control"
                                        selected={this.state.end}
                                        onChange={d => this.setState({
                                            end: d
                                        })}
                                        dateFormat="dd/MM/yyyy"
                                        locale="fr-fr" />
                                    <HelpBlock><FormattedMessage id="end-help-note" defaultMessage="Leave empty to analyze up until now"/></HelpBlock>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={onConfigClose}>
                            <FormattedMessage id="close" defaultMessage="Close"/>
                        </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={this.state.showBig} onHide={onShowClose} dialogClassName='large-modal'>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FormattedMessage id="proxy-req-per-day" defaultMessage="Proxy requests / day"/>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Bar data={chartData} options={chartOptions} />
                    </Modal.Body>
                </Modal>
            </DashboardPanel>
        );
    }
}