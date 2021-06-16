import React, { useEffect, useState } from 'react';

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
        responsive: false,
        animation: {
          duration: 0
        },
        plugins:{
          legend: {
            display: true,
            position: 'left',
          }
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


export default function LocalQueues(props) {
    const [queues, setQueues] = useState([]);

    useEffect(() => {
        document.title = "Queues";
        const i = setInterval(() => fetch_get("/api/v01/system/queues")
            .then(data => setQueues(data.queues))
            .catch(error => NotificationsManager.error(<FormattedMessage id="fail-fetch-queues" defaultMessage="Fail to fetch queues"/>, error)), 1000);

        return () => clearInterval(i);
    }, []);

    return (
        <div>
            {
                Object.keys(queues).map((name, i) => <QueueState key={i} name={name} state={queues[name]}/>)
            }
        </div>
    )
}