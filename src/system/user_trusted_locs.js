import React from "react";
import {FormattedMessage} from "react-intl";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import Table from "react-bootstrap/lib/Table";
import {DeleteConfirmButton} from "../utils/deleteConfirm";
import {fetch_delete, NotificationsManager, userLocalizeUtcDate} from "../utils";
import moment from "moment";
import Checkbox from "react-bootstrap/lib/Checkbox";


function deleteUserTrustedLocation(userId, locationIp, onSuccess, onError) {
  fetch_delete(`/api/v01/system/users/${userId}/locs/${locationIp}`)
    .then(() => {
      NotificationsManager.success(<FormattedMessage id="user-trusted-loc-deleted" defaultMessage="Trusted location removed"/>);
      onSuccess && onSuccess();
    })
    .catch(err => {
      NotificationsManager.error(<FormattedMessage id="user-trusted-loc-failed" defaultMessage="Failed to delete trusted loc." />, err.message );
      onError && onError(err);
    })
}

export function TrustedLocationsTable(props) {
  const {userId, locations, userInfo, onChange} = props;

  return (
    <Table>
      <thead>
      <tr>
        <th><FormattedMessage id="ip" defaultMessage="IP"/></th>
        <th><FormattedMessage id="agent" defaultMessage="Agent"/></th>
        <th><FormattedMessage id="trusted" defaultMessage="Trusted"/></th>
        <th><FormattedMessage id="last-use" defaultMessage="Last use"/></th>
        <th><FormattedMessage id="first-use" defaultMessage="First use"/></th>
        <th/>
      </tr>
      </thead>
      <tbody>
      {
        locations && locations.map((loc, i) => {
          return (
            <tr key={i}>
              <td>{loc.ip}</td>
              <td>{loc.user_agent}</td>
              <td><Checkbox checked={loc.trusted} disabled /></td>
              <td>{loc.last_use?userLocalizeUtcDate(moment.utc(loc.last_use), userInfo).format():"-"}</td>
              <td>{userLocalizeUtcDate(moment.utc(loc.created_on), userInfo).format()}</td>
              <td>
                <ButtonToolbar>
                  <DeleteConfirmButton
                    resourceName={`${loc.ip} (${loc.user_agent})`}
                    onConfirm={() => deleteUserTrustedLocation(userId, loc.ip, onChange)} />
                </ButtonToolbar>
              </td>
            </tr>
          )
        })
      }
      </tbody>
    </Table>
  )
}
