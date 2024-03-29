import React from 'react';
import {Link} from 'react-router-dom';


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
