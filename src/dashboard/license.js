import React, {useEffect, useState} from "react";
import {FormattedMessage} from "react-intl";
import {DashboardPanel} from "./dashboard-panel";
import {fetch_get} from "../utils";
import ProgressBar from "react-bootstrap/lib/ProgressBar";
import Table from "react-bootstrap/lib/Table";
import moment from "moment";


function fetchLicenseNP(onSuccess) {
    fetch_get("/api/v01/npact/license")
        .then(r => onSuccess(r.license))
        .catch(console.error)
}

function bsStyle(perc) {
  if(perc < 80) {
    return "success";
  } else if(perc < 90) {
    return "warning";
  } else {
    return "danger";
  }
}

export default function NPLicenseBox() {
  const [license, setLicense] = useState({})

  useEffect(() => {
    fetchLicenseNP(setLicense);
  }, []);

  return (
    <DashboardPanel title={<FormattedMessage id='license' defaultMessage='License'/>}>
      <Table condensed>
        <tbody>
        {
          Object.entries(license).map(([name, details]) => {
            if(details.limit === 0) {
              return <></>
            }

            const perc = Math.floor((details.value / details.limit) * 100);

            if(perc < 15) {
              name = name + ` ${details.value} / ${details.limit} (${perc}%)`
            }
            return (<>
              <tr>{name}</tr>
              <tr>
                <ProgressBar bsStyle={bsStyle(perc)} now={perc} label={`${details.value} / ${details.limit} (${perc}%)`} />
              </tr>
            </>)
          })
        }
        </tbody>
      </Table>
    </DashboardPanel>
  )
}


export function LicenseCounters({ counters }) {
  const lastLoad = moment(counters.last_load);
  if(lastLoad.year() < 2000) {
    return <div/>
  }
  return (
    <DashboardPanel title={<FormattedMessage id='license' defaultMessage='License' />}>
      <Table condensed>
        <tbody>
          {
            Object.entries(counters.counters).map(([name, [limit, value]]) => {
              if (limit === 0) {
                return <></>
              }

              const perc = Math.floor((value / limit) * 100);

              if (perc < 15) {
                name = name + ` ${value} / ${limit} (${perc}%)`
              }
              return (<>
                <tr>{name}</tr>
                <tr>
                  <ProgressBar bsStyle={bsStyle(perc)} now={perc} label={`${value} / ${limit} (${perc}%)`} />
                </tr>
              </>)
            })
          }
          <tr>
            <td colSpan={2}>
              <FormattedMessage id='last_load' defaultMessage='Last load' />: {lastLoad.format("YYYY-MM-DD HH:mm:ss")}
            </td>
          </tr>
        </tbody>
      </Table>
    </DashboardPanel>
  )
}
