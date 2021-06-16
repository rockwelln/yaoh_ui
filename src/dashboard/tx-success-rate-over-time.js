import React, {useEffect, useState} from "react";
import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import {Bar} from "react-chartjs-2";
import 'chartjs-adapter-moment';
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import DatePicker from "react-datepicker";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Button from "react-bootstrap/lib/Button";
import moment from "moment";
import {fetch_get, userLocalizeUtcDate} from "../utils";
import FormControl from "react-bootstrap/lib/FormControl";

const REFRESH_CYCLE = 20;
const DEFAULT_NB_DAYS = 1;

function fetchSuccessRatePerHour(start, end, onSuccess) {
  if (end === undefined) {
    end = moment();
  }
  fetch_get(
    `/api/v01/apio/success_rate?start=${moment(start).format('YYYY-MM-DDTHH:mm:ss')}&end=${moment(end).endOf('day').format('YYYY-MM-DDTHH:mm:ss')}`
    )
    .then(data => onSuccess(data.stats))
    .catch(console.error);
}


export default function SuccessRateOverTime(props) {
  const {user_info} = props;
  const [data, setData] = useState([]);
  const [start, setStart] = useState(moment().subtract(DEFAULT_NB_DAYS, "days").toDate());
  const [end, setEnd] = useState(undefined);
  const [proxyFilter, setProxyFilter] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showBig, setShowBig] = useState(false);

  // useEffect(() => )
  const refreshData = () => { fetchSuccessRatePerHour(start, end, setData); };
  useEffect(refreshData, [start, end]);
  useEffect(() => {
      const handler = setInterval(() => { fetchSuccessRatePerHour(start, end, setData); }, REFRESH_CYCLE * 1000);
      return () => clearInterval(handler);
  }, [start, end]);

  const onConfigClose = () => {
      setShowSettings(false);
      refreshData();
  };
  const onShowClose = () => setShowBig(false);

  const labels = data.map(d => userLocalizeUtcDate(moment.utc(d["date"]), user_info).toDate());
  const datasets = ["SUCCESS", "ERROR"].map(s => {
    return {
      label: s,
      data: labels.map(l => {
        const e = data.filter(d => d.status === s && userLocalizeUtcDate(moment.utc(d["date"]), user_info).toDate().getTime() === l.getTime()).reduce((o, c) => o + c["counter"], 0);
        if(e) return e;
        return 0;
      }),
      backgroundColor: s === "ERROR" ? "red" : "green",
    }
  });

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
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
          x: {
              stacked: true,
              barThickness: 5,
              type: 'time',
              time: {
                  unit: 'hour',
                  minUnit: 'hour',
              },
              min: start,
              max: end || moment(),
          },
          y: {
              stacked: true
          }
      },
      maintainAspectRatio: false,
  };
  return (
        <DashboardPanel
            title={<FormattedMessage id="success-rate-requests" defaultMessage="Success rate"/>}
            onSettings={() => setShowSettings(true)}
            onShow={() => setShowBig(true)}
        >
            <Bar data={chartData} options={chartOptions} height={200} />

            <Modal show={showSettings} onHide={onConfigClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FormattedMessage id="configure" defaultMessage="Configure"/>
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
                                    onChange={d => setStart(d)}
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
                                    onChange={d => setEnd(d)}
                                    dateFormat="dd/MM/yyyy"
                                    locale="fr-fr" />
                                <HelpBlock><FormattedMessage id="end-help-note" defaultMessage="Leave empty to analyze up until now"/></HelpBlock>
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="proxy" defaultMessage="Proxy" />
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                  componentClass="select"
                                  value={proxyFilter}
                                  onChange={e => setProxyFilter(e.target.value)} >
                                  <option value={""}>*all*</option>
                                  {
                                    data
                                      .reduce((p, c) => {
                                        !p.includes(c["proxy_gateway_host"]) && p.push(c["proxy_gateway_host"]);
                                        return p;
                                      }, [])
                                      .filter(p => p && p !== "")
                                      .map((p, i) => <option key={i} value={p}>{p}</option>)
                                  }
                                </FormControl>
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
            <Modal show={showBig} onHide={onShowClose} dialogClassName='large-modal'>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FormattedMessage id="success-rate" defaultMessage="Success rate"/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Bar data={chartData} options={chartOptions} />
                </Modal.Body>
            </Modal>
        </DashboardPanel>
    );
}