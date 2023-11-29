import React from "react";
import Table from "react-bootstrap/lib/Table";
import { localUser } from "../utils/user";
import moment from "moment";


export default function UserLoginAttempts({ attempts }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>IP</th>
          <th>Agent</th>
          <th>Success</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {
          attempts?.map((att, i) => (
            <>
              <tr key={i}>
                <td>{att.ip}</td>
                <td>{att.user_agent}</td>
                <td>{att.success ? "Yes" : "No"}</td>
                <td>{localUser.localizeUtcDate(moment.utc(att.created_at)).format()}</td>
              </tr>
              {
                !att.success && (
                  <tr>
                    <td style={{ borderTop: "hidden" }}/>
                    <td colSpan={3} style={{ borderTop: "hidden", color: "red" }}>
                      <p>&gt;&gt; {att.failure_reason}</p>
                    </td>
                  </tr>)
              }
            </>
          ))
        }
      </tbody>
    </Table>
  );
}
