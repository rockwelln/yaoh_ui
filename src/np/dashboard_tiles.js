import React from 'react';
import update from 'immutability-helper';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { FormattedMessage } from 'react-intl';

import { Tile, TileHeader } from "../dashboard/dashboard-tiles";
import { needApprovalCriteria } from "./np-requests";
import { activeCriteria } from "../requests/requests";


export const TransactionsNeedApprovalTile = ({ count }) => (
    <Link to={{
        pathname: "/transactions/list", search: queryString.stringify({
            filter: JSON.stringify(update(needApprovalCriteria, { $merge: activeCriteria }))
        })
    }}>
        <Tile className="warning">
            <TileHeader>
                <div className="count">{count}</div>
                <div className="title"><FormattedMessage id="cases-approval" defaultMessage="Case(s) need approval" /></div>
            </TileHeader>
        </Tile>
    </Link>
);