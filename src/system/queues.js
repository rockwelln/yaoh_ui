import React, { Component } from 'react';

import Panel from 'react-bootstrap/lib/Panel';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import {Doughnut} from 'react-chartjs-2';
import ColorHash from 'color-hash';

import {FormattedMessage} from 'react-intl';
import {fetch_get, NotificationsManager} from "../utils";


const QueueState = ({name, state}) => {
    let colorHash = new ColorHash();
    const chartData1 = {
        labels: [
            `active ${state.active_count} / ${state.limit}`,
            "remains",
        ],
        datasets: [{
            data: [state.active_count, state.limit - state.active_count],
            backgroundColor: [colorHash.hex("active"), colorHash.hex("remains")],
        }]
    };
    const chartData2 = {
        labels: [
            `pending ${state.pending_count} / ${state.pending_limit}`,
            "remains",
        ],
        datasets: [{
            data: [state.pending_count, state.pending_limit - state.pending_count],
            backgroundColor: [colorHash.hex("active"), colorHash.hex("remains")],
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
        <Panel>
            <Panel.Heading>
                <Panel.Title> {name} </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
                <Row>
                    <Col sm={6} md={6} xs={12}>
                        <Doughnut style={{width: '50%'}} data={chartData1} options={chartOptions}/>
                    </Col>
                    <Col sm={6} md={6} xs={12}>
                        <Doughnut style={{width: '50%'}} data={chartData2} options={chartOptions}/>
                    </Col>
                </Row>
            </Panel.Body>
        </Panel>
    );
};


export default class LocalQueues extends Component {
    state = {
        queues: [],
    };

    fetchQueues() {
        fetch_get("/api/v01/system/queues")
            .then(data => this.setState({queues: data.queues}))
            .catch(error => NotificationsManager.error(<FormattedMessage id="fail-fetch-queues" defaultMessage="Fail to fetch queues"/>, error))
    }

    componentDidMount() {
        this.reloader = setInterval(() => this.fetchQueues(), 1000);
    }

    componentWillUnmount() {
        this.reloader && clearInterval(this.reloader);
    }

    render() {
        const {queues} = this.state;
        return (
            <div>
                {
                    Object.keys(queues).map((name, i) => <QueueState key={i} name={name} state={queues[name]}/>)
                }
            </div>
        )
    }
}