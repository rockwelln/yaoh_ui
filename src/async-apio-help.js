import React, {useEffect, useState} from 'react';
import Table from 'react-bootstrap/lib/Table';
import {FormattedMessage} from 'react-intl';
import {fetch_get, STATIC_URL_PREFIX} from './utils';

const HELP_DOCUMENTS = [
    // {url: `${STATIC_URL_PREFIX}/static/docs/high_level_api_guide/index.html`, title: 'High Level API Guide', version: '0.1', summary: ''},
    {url: `${STATIC_URL_PREFIX}/static/docs/_user_guide/index.html`, title: 'User guide doc', version: '0.1', summary: ''},
    {url: `${STATIC_URL_PREFIX}/static/docs/_admin/index.html`, title: 'Admin / technical doc', version: '0.1', summary: ''},
    {url: `/swagger/swagger.v3.json`, title: 'SWAGGER API definition', version: '3', summary: ''},
    {url: `https://editor.swagger.io/?url=${window.location.origin}/swagger/swagger.v3.json`, title: 'SWAGGER API Editor', version: '3', summary: ''},
];

export const INTERNAL_HELP_LINKS = {
    profile_rights: {url: STATIC_URL_PREFIX + '/static/docs/user_guide/pages/users.html#current-configuration'}
};

export default function AsynApioHelp() {
    const [packages, setPackages] = useState([]);
    useEffect(() => {
        fetch_get("/health").then(data => setPackages(data.versions))
    }, []);

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
        <hr style={{marginTop: "150px"}} />
        <Table>
            <thead>
                <tr>
                    <th><FormattedMessage id="package" defaultMessage="Package"/></th>
                    <th><FormattedMessage id="version" defaultMessage="Version"/></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>ui</td>
                    <td>yaoh_ui_version</td>
                </tr>
            {
                packages && Object.keys(packages).map((p, i) => (
                    <tr key={i}>
                        <td>{p}</td>
                        <td>{packages[p]}</td>
                    </tr>
                ))
            }
            </tbody>
        </Table>
    </div>
}
