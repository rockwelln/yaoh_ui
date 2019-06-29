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
} from "./orange/requests";


const Tile = ({className, children}) => (
    <Col md={2} sm={4} xs={6}>
        <div className={"tile " + className}>
            {children}
        </div>
    </Col>
);

export const EmptyTile = ({className}) => (
    <Col md={2} sm={4} xs={6} className={className} />
);

const TileHeader = ({children}) => (
    <div className="header">
        {children}
    </div>
);

export const ErrorCasesTile = ({count, total}) => (
    <Link to={{pathname: "/transactions/list", search: queryString.stringify({
            filter: JSON.stringify(update(errorCriteria, {$merge: activeCriteria}))
        })}}>
        <Tile className="error">
            <TileHeader>
                <div className="count">{count}</div>
                <div className="title">
                    <FormattedMessage id="cases-errors" defaultMessage="Case(s) with errors"/>
                </div>
                <div className="remark">
                    {total} <FormattedMessage id="running-cases" defaultMessage="Running cases"/>
                </div>
            </TileHeader>
        </Tile>
    </Link>
);

function gwStatus(status) {
    if(status === undefined || status.connected === undefined) return "?";

    if(status.connected) {
        if(status.active || status.active === undefined) {
            return <Glyphicon glyph="ok-circle"/>;
        } else {
            return <Glyphicon glyph="pause"/>;
        }
    } else {
        return <Glyphicon glyph="remove-circle"/>;
    }
}

export const GatewaysStatusTile = ({status, label}) => (
    <Link to="/system/gateways">
        <Tile className={(status === undefined || status.connected === undefined)?"warning":status.connected === true?"success":"error"}>
            <TileHeader>
                <div className="count">{gwStatus(status)}</div>
                <div className="title">{label}</div>
            </TileHeader>
        </Tile>
    </Link>
);