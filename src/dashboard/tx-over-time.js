import React, {useCallback, useEffect, useState} from 'react';
import {Bar} from 'react-chartjs-2';
import 'chartjs-adapter-moment';
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
import {fetch_get} from "../utils";
import {DashboardPanel} from './dashboard-panel';
import update from "immutability-helper";

const DEFAULT_NB_DAYS = 30;
const REFRESH_CYCLE = 60;


function prepare_data(labels, data) {
    return labels.map(l => data[l] === undefined ? 0 : data[l]);
}

function TransactionsPerDay() {
    const [datasets, setDatasets] = useState([]);
    const [labels, setLabel] = useState([]);
    const [settings, setSettings] = useState({
        start: moment().subtract(DEFAULT_NB_DAYS, "days").toDate(),
        end: undefined,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showBig, setShowBig] = useState(false);

    const refresh = useCallback(() => {
        let {start, end} = settings;
        if(end === undefined) {
            end = moment();
        }
        fetch_get(
            `/api/v01/system/stats_per_wf_per_day?start=${moment(start).format('YYYY-MM-DD')}&end=${moment(end).endOf('day').format('YYYY-MM-DDTHH:mm:ss')}`
        )
        .then(({requests}) => {
            const labels = requests ?
                Object.keys(requests.reduce((rv , x) => {rv[x['creation_day']]=1; return rv;}, {})) : [];

            const grouped_data = requests ? requests.reduce((rv, x) => {
                (rv[x['workflow_name']] = rv[x['workflow_name']] || []).push(x);
                return rv;
            }, {}) : {};

            let colorHash = new ColorHash();
            const datasets = Object.keys(grouped_data).map(k => ({
                label: k,
                data: prepare_data(
                    labels,
                    grouped_data[k].reduce(
                        (rv, x) => {
                            rv[x['creation_day']] = x['counter'];
                            return rv;
                        }, {}
                    )
                ),
                backgroundColor: colorHash.hex(k || ""),
            }));
            setLabel(labels);
            setDatasets(datasets)
        })
        .catch(console.error);
    }, [settings]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, REFRESH_CYCLE * 1000);
        return () => clearInterval(interval);
    }, [settings]);

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
            x: {
                stacked: true,
                type: 'time',
                time: {
                    unit: 'day',
                    minUnit: 'day',
                },
                min: settings.start,
                max: settings.end || moment(),
            },
            y: {
                stacked: true
            }
        }
    };

    return (
        <DashboardPanel
            title={<FormattedMessage id="transactions-per-days" defaultMessage="Transactions / day"/>}
            onSettings={() => setShowSettings(true)}
            onShow={() => setShowBig(true)}
        >
            <Bar data={chartData} options={chartOptions} />

            <ConfigurationModal
              show={showSettings}
              settings={settings}
              onChange={d => setSettings(update(settings, {$merge: d}))}
              onHide={() => setShowSettings(false)} />

            <ShowOffModal
              show={showBig}
              data={chartData}
              options={chartOptions}
              onHide={() => setShowBig(false)} />
        </DashboardPanel>
    );
}


function ShowOffModal_({show, data, options, onHide}) {
    return (
      <Modal show={show} onHide={() => onHide()} dialogClassName='large-modal'>
          <Modal.Header closeButton>
              <Modal.Title>
                  <FormattedMessage id="transactions-per-days" defaultMessage="Transactions / day"/>
              </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Bar data={data} options={options} />
          </Modal.Body>
      </Modal>
    )
}

const ShowOffModal = React.memo(ShowOffModal_);


function ConfigurationModal({show, settings:{start, end}, onHide, onChange}) {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>
                <FormattedMessage id="config-tx-per-day" defaultMessage="Configure transactions per day"/>
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
                            selected={start}
                            onChange={d => onChange({
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
                            selected={end}
                            onChange={d => onChange({
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
            <Button onClick={onHide}>
                <FormattedMessage id="close" defaultMessage="Close"/>
            </Button>
        </Modal.Footer>
      </Modal>
    )
}

export default React.memo(TransactionsPerDay);
