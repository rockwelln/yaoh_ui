import React, {Component} from 'react';
import Table from 'react-bootstrap/lib/Table';
import {FormattedMessage} from 'react-intl';
import {API_URL_PREFIX} from './utils';

const HELP_DOCUMENTS = [
    {url: API_URL_PREFIX + '/static/help/user_guide/index.html', title: 'User Guide', version: '0.1', summary: ''},
];

export const INTERNAL_HELP_LINKS = {
    profile_rights: {url: API_URL_PREFIX + '/static/help/user_guide/pages/users.html#current-configuration'}
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
                            <td><a href={d.url} target="_blank" rel="noopener">{d.title}</a></td>
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
