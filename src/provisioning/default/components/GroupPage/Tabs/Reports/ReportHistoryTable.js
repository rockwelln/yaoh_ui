import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { useSelector, useDispatch } from "react-redux";

import { FormattedMessage } from "react-intl";
import Loading from "../../../../common/Loading";
import { fetchGetReportingCustomerGroupReportHistory } from "../../../../store/actions";

import Table from "react-bootstrap/lib/Table";
import { LinkContainer } from "react-router-bootstrap";
import Button from "react-bootstrap/lib/Button";
import { humanFileSize } from "../../../../../../utils";


function ReportHistoryTable({ tenantId, groupId }) {
  const [isLoading, setIsLoading] = useState(true);
  const reports = useSelector(state => state.reports);

  const dispatch = useDispatch();

  useEffect(() => {
    if (tenantId && groupId) {
      dispatch(fetchGetReportingCustomerGroupReportHistory(tenantId, groupId)).then(() =>
        setIsLoading(false)
      );
    }
  }, [tenantId, groupId]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Table responsive>
      <thead>
        <tr>
          <th>
            <FormattedMessage id="filename" defaultMessage="Filename" />
          </th>
          <th>
            <FormattedMessage id="size" defaultMessage="Size" />
          </th>
          <th>
            <FormattedMessage id="status" defaultMessage="Status" />
          </th>
          <th>
            <FormattedMessage id="at" defaultMessage="At" />
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          reports?.map((r, i) => (
            <tr key={`report-history-${i}`}>
              <td>{r.file_name}</td>
              <td>{r.file_size ? humanFileSize(r.file_size) : "0"}</td>
              <td>{r.status}</td>
              <td>{r.created_at}</td>
              <td>{r.instance_guid? 
                <LinkContainer to={`/transactions/${r.instance_guid}`}>
                    <Button bsStyle='primary'>
                        <FormattedMessage id="details" defaultMessage="Details"/>
                    </Button>
                </LinkContainer> : "-"}</td>
            </tr>
          ))
        }
      </tbody>
    </Table>
  )
}

export default withRouter(ReportHistoryTable);