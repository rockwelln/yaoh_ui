import React, {useEffect, useState} from 'react';
import Table from 'react-bootstrap/lib/Table';
import {FormattedMessage} from 'react-intl';
import {fetch_get, STATIC_URL_PREFIX} from '../utils';
import {Link} from "react-router-dom";

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
        document.title = "help"
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
        <Table>
            <thead>
                <tr>
                    <th style={{width: "200px"}}><FormattedMessage id="tools" defaultMessage="Tools"/></th>
                    <th><FormattedMessage id="summary" defaultMessage="Summary"/></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                      <Link to={"/help/template-playground"}>
                        <FormattedMessage id="template-playground" defaultMessage="Template playground"/>
                      </Link>
                    </td>
                    <td>The template playground is a webservice that runs on the API server. The service receives a template and a context, runs inside a sandbox, then returns the output.</td>
                </tr>
            </tbody>
        </Table>
        <hr style={{marginTop: "100px"}} />
        <Table>
            <thead>
                <tr>
                    <th><FormattedMessage id="package" defaultMessage="Package"/></th>
                    <th><FormattedMessage id="version" defaultMessage="Version"/></th>
                </tr>
            </thead>
            <tbody>
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
