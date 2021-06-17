import React from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Col from 'react-bootstrap/lib/Col';
import update from 'immutability-helper';
import {Link} from 'react-router-dom';
import queryString from 'query-string';
import {FormattedMessage} from 'react-intl';

import {
    activeCriteria,
    errorCriteria,
} from "../requests/requests";


export function DashboardCard({className, heading, subheading, number}) {
  return (
    <div className={`card mb-3 widget-content ${className}`}>
      <div className={"widget-content-wrapper text-white"}>
        <div className={"widget-content-left"}>
          <div className={"widget-heading"}>{heading}</div>
          <div className={"widget-subheading"}>{subheading}</div>
        </div>
        <div className={"widget-content-right"}>
          <div className={"widget-numbers"}>
          {number}
          </div>
        </div>
      </div>
    </div>
  )
}

// export const ErrorCasesTile = ({count, total}) => (
//     <Link to={{pathname: "/transactions/list", search: queryString.stringify({
//             q: JSON.stringify(update(errorCriteria, {$merge: activeCriteria}))
//         })}}>
//         <Tile className="error">
//             <TileHeader>
//                 <div className="count">{count}</div>
//                 <div className="title">
//                     <FormattedMessage id="cases-errors" defaultMessage="Case(s) with errors"/>
//                 </div>
//                 <div className="remark">
//                     {total} <FormattedMessage id="running-cases" defaultMessage="Running cases"/>
//                 </div>
//             </TileHeader>
//         </Tile>
//     </Link>
// );

// export const Tile = ({className, children}) => (
//     <Col md={2} sm={4} xs={6}>
//         <div className={"tile " + className}>
//             {children}
//         </div>
//     </Col>
// );
//
// export const TileHeader = ({children}) => (
//     <div className="header">
//         {children}
//     </div>
// );


export function GatewaysStatusTile({gateways}) {
    const g = Object.entries(gateways).filter(([_, status]) => status && (
      status.connected === false || (status.is_gateway && status.active === false)
    ));
    let label = null;
    let className = "bg-grow-early";
    if(g.length === 1) {
      label = g[0][0];
    }
    if(g.length >= 1) {
      className = "bg-alert-danger";
    }
    return (
      <Link to={`/system/gateways#${label || ""}`}>
        <DashboardCard
          className={className}
          heading={label === null ? "External troubles": `${label} in trouble`}
          subheading={"Session holders in trouble"}
          number={g.length} />
      </Link>
    )
}
