import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { useSelector, useDispatch } from "react-redux";

import { FormattedMessage } from "react-intl";
import Loading from "../../../../common/Loading";
import { fetchGetReportingCustomerReports } from "../../../../store/actions";

import Table from "react-bootstrap/lib/Table";
import Checkbox from "react-bootstrap/lib/Checkbox";


function ReportsTable({ tenantId }) {
  const [isLoading, setIsLoading] = useState(true);
  const reports = useSelector(state => state.reports);

  const dispatch = useDispatch();

  useEffect(() => {
    if (tenantId) {
      dispatch(fetchGetReportingCustomerReports(tenantId)).then(() =>
        setIsLoading(false)
      );
    }
  }, [tenantId]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Table responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>
            <FormattedMessage id="name" defaultMessage="Name" />
          </th>
          <th>
            <FormattedMessage id="service" defaultMessage="Service" />
          </th>
          <th>
            <FormattedMessage id="frequency" defaultMessage="Frequency" />
          </th>
          <th>
            <FormattedMessage id="calltype" defaultMessage="Call type" />
          </th>
          <th>
            <FormattedMessage id="file_prefix" defaultMessage="File prefix" />
          </th>
          <th>
            <FormattedMessage id="time-period" defaultMessage="Time period" />
          </th>
          <th>
            <FormattedMessage id="last-sent" defaultMessage="Last sent" />
          </th>
        </tr>
      </thead>
      <tbody>
        {
          reports?.map((r, i) => (
            <tr key={`report-${i}`}>
              <td>
                <Checkbox
                  checked={r.enabled}
                  disabled />
              </td>
              <td>{r.name}</td>
              <td>{r.service_name}</td>
              <td>{r.frequency}</td>
              <td>{r.call_type}</td>
              <td>{r.file_prefix}</td>
              <td>{r.time_period? `${r.time_period[0]}:00 - ${r.time_period[1]}:00` : "-"}</td>
              <td>{r.last_sent || "-"}</td>
            </tr>
          ))
        }
      </tbody>
    </Table>
  )
}

export default withRouter(ReportsTable);