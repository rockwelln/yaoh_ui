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