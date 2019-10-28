import React, {Component} from 'react';
import Table from 'react-bootstrap/lib/Table';
import {FormattedMessage} from 'react-intl';
import {STATIC_URL_PREFIX} from './utils';

const HELP_DOCUMENTS = [
    // {url: `${STATIC_URL_PREFIX}/static/docs/high_level_api_guide/index.html`, title: 'High Level API Guide', version: '0.1', summary: ''},
    {url: `${STATIC_URL_PREFIX}/static/docs/_user_guide/index.html`, title: 'User guide doc', version: '0.1', summary: ''},
    {url: `${STATIC_URL_PREFIX}/static/docs/_admin/index.html`, title: 'Admin / technical doc', version: '0.1', summary: ''},
];

export const INTERNAL_HELP_LINKS = {
    profile_rights: {url: STATIC_URL_PREFIX + '/static/docs/user_guide/pages/users.html#current-configuration'}
};

export default class AsynApioHelp extends Component {
    render() {
        return <div>
            <Table>
                <thead>
                    <tr>
                        <th><FormattedMessage id="document" defaultMessage="Document"/></th>
                        <th><FormattedMessage id="version" defaultMessage="Version"/></th>
                        <th><FormattedMessage id="summary" defaultMessage="Summary"/></th>
                    </tr>
                </thead>
                <tbody>
                {
                    HELP_DOCUMENTS && HELP_DOCUMENTS.map((d, i) => (
                        <tr key={i}>
                            <td><a href={d.url} target="_blank" rel="noopener noreferrer">{d.title}</a></td>
                            <td>{d.version}</td>
                            <td>{d.summary}</td>
                        </tr>
                    ))
                }
                </tbody>
            </Table>
        </div>
    }
}
