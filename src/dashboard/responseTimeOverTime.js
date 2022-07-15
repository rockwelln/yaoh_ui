import React, {useEffect, useState} from "react";
import moment from "moment";
import {fetch_get} from "../utils";
import {localUser} from "../utils/user";
import {DashboardPanel} from "./dashboard-panel";
import {FormattedMessage} from "react-intl";
import {Line} from "react-chartjs-2";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import DatePicker from "react-datepicker";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Button from "react-bootstrap/lib/Button";
import update from "immutability-helper";

const DEFAULT_NB_DAYS = 1;
const REFRESH_CYCLE = 60;

function fetchResponseTime({from, to, method}, onSuccess) {
  if (to === undefined) {
    to = new Date;
  }
  fetch_get(
    `/api/v02/statistics/api_resp_time?f=${from.toISOString()}&t=${to.toISOString()}&m=${method||""}`
    )
    .then(data => onSuccess(data))
    .catch(console.error);
}

function fillMissingDataPoints(data, unit) {
  if(data.length === 0) return data;

  let d = data.map(p => {
    p["t"] = moment.utc(p["t"]);
    return p;
  }).sort((a, b) => a["t"].isBefore(b["t"], unit)?-1:1);

  let minDate = d[0]["t"].clone();
  let maxDate = d[d.length - 1]["t"];

  const points = d.reduce((rv, x) => {rv[x["t"].format()]=1; return rv;}, {})
  let missingPoints = [];

  while (minDate.isBefore(maxDate, unit)) {
    if(points[minDate.format()] === undefined) {
      missingPoints.push({
        t: minDate.format(),
        avg: null,
        c: null,
        max: null,
      })
    }
    minDate = minDate.add(1, unit + "s");
  }
  data.push(...missingPoints)
  return data.map(p => {
    p["t"] = moment.utc(p["t"]);
    return p;
  }).sort((a, b) => a["t"].isBefore(b["t"], unit)?-1:1);
}

function ResponseTimeOvertime({props}) {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    from: moment().subtract(DEFAULT_NB_DAYS, "days").toDate(),
    to: undefined,
    method: undefined,
    unit: 'hour',
  })
  const [showSettings, setShowSettings] = useState(false);
  const [showBig, setShowBig] = useState(false);

  const _refresh = () => fetchResponseTime(filter, setData);
  useEffect(() => {
    _refresh();
    const h = setTimeout(() => _refresh(), REFRESH_CYCLE * 1000);
    return () => clearTimeout(h);
  }, [filter]);

  const filledData = fillMissingDataPoints(data, filter.unit);
  const labels = filledData.map(d => localUser.localizeUtcDate(moment.utc(d["t"])).toDate())

  const datasets = [
    {
      label: "average response time",
      data: filledData.map(d => d.avg),
      backgroundColor: "#0033fc",
      borderColor: "#0033fc",
      yAxisID: 'y',
      spanGaps: false,
    },
    {
      label: "max response time",
      data: filledData.map(d => d.max),
      backgroundColor: "#fcc100",
      borderColor: "#fcc100",
      yAxisID: 'y',
      spanGaps: false,
    },
    {
      label: "count",
      data: filledData.map(d => d.c),
      backgroundColor: "#3ffc00",
      borderColor: "#3ffc00",
      yAxisID: 'y1',
      spanGaps: false,
    },
  ];

  const chartData = {
      labels: labels,
      datasets: datasets,
  };
  const chartOptions = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      tooltips: {
          mode: 'index',
          intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          maxHeight: 100,
        }
      },
      scales: {
          x: {
              stacked: true,
              type: 'time',
              time: {
                  unit: 'hour',
                  minUnit: 'minute',
              },
              min: filter.from,
              max: filter.to || moment(),
          },
          y: {
              type: 'linear',
              display: true,
              position: 'left',
          },
          y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
          },
      },
      maintainAspectRatio: false,
  };
  return (
      <DashboardPanel
          title={<FormattedMessage id="response-time" defaultMessage="Response time"/>}
          onSettings={() => setShowSettings(true)}
          onShow={() => setShowBig(true)}
      >
          <div style={{height: "250px"}}>
            <Line data={chartData} options={chartOptions} height={200} />
          </div>

          <Modal show={showSettings} onHide={() => setShowSettings(false)} >
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
                                  selected={filter.from}
                                  onChange={d => setFilter(update(filter, {$merge: {from: d}}))}
                                  dateFormat="yyyy-MM-dd HH:mm"
                                  showTimeSelect
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
                                  selected={filter.to}
                                  onChange={d => setFilter(update(filter, {$merge: {to: d}}))}
                                  dateFormat="yyyy-MM-dd HH:mm"
                                  showTimeSelect
                                  locale="fr-fr" />
                              <HelpBlock><FormattedMessage id="end-help-note" defaultMessage="Leave empty to analyze up until now"/></HelpBlock>
                          </Col>
                      </FormGroup>
                  </Form>
              </Modal.Body>
              <Modal.Footer>
                  <Button onClick={() => setShowSettings(false)}>
                      <FormattedMessage id="close" defaultMessage="Close"/>
                  </Button>
              </Modal.Footer>
          </Modal>
          <Modal show={showBig} onHide={() => setShowBig(false)}  dialogClassName='large-modal'>
              <Modal.Header closeButton>
                  <Modal.Title>
                      <FormattedMessage id="response-time" defaultMessage="Response time"/>
                  </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div style={{height: "600px"}}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </Modal.Body>
          </Modal>
      </DashboardPanel>
  );
}

export default React.memo(ResponseTimeOvertime);