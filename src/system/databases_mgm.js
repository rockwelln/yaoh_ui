import React, {Component} from 'react';

import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import Table, {tr, td, th, thead, tbody} from 'react-bootstrap/lib/Table';
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb';

import {FormattedMessage} from 'react-intl';
import {fetch_get} from '../utils';

const DatabaseDetails = ({info}) => (
    <Panel bsStyle={info.is_master?"success":null}>
        <Panel.Heading>
            {info.hostname||info.ip}
        </Panel.Heading>
        <Panel.Body>
            <Table>
                <tbody>
                    <tr>
                        <th><FormattedMessage id="ip" defaultMessage="ip"/></th><td>{info.ip}</td>
                    </tr>
                    <tr>
                        <th><FormattedMessage id="size" defaultMessage="size"/></th><td>{info.db_size}</td>
                    </tr>
                    {
                        info.is_master ?
                            <tr>
                                <th><FormattedMessage id="current-loc" defaultMessage="current loc"/></th><td>{info.current_loc}</td>
                            </tr> :
                            <tr>
                                <th><FormattedMessage id="rec-loc" defaultMessage="receive/replay loc"/></th><td>{info.receive_loc} / {info.replay_loc}</td>
                            </tr>
                    }
                </tbody>
            </Table>
            {
                info.is_master && info.standby.length !== 0 && (
                    <Table>
                        <thead>
                            <tr><th><FormattedMessage id="replicate" defaultMessage="replicate"/></th></tr>
                        </thead>
                        <tbody>
                        {
                            info.standby.map(s => (
                                <tr key={s.client_addr}><td>{s.client_addr}</td></tr>
                            ))
                        }
                        </tbody>
                    </Table>
                )
            }
            <Table>
                <thead>
                    <tr>
                        <th><FormattedMessage id="table" defaultMessage="table"/></th>
                        <th><FormattedMessage id="size" defaultMessage="size"/></th>
                        <th><FormattedMessage id="rows" defaultMessage="rows"/></th>
                    </tr>
                </thead>
                <tbody>
                {
                    info.tables.map((t, i) => (
                        <tr key={i}>
                            <td>{t.table_name}</td>
                            <td>{t.total_bytes}</td>
                            <td>{t.row_estimate}</td>
                        </tr>
                    ))
                }
                </tbody>
            </Table>
        </Panel.Body>
    </Panel>
);


export default class Databases extends Component {
    constructor(props) {
        super(props);
        this.autoRefresh = true;
        this.state = {databases:[]};
        this._refresh = this._refresh.bind(this);
    }

    _refresh() {
        if(!this.autoRefresh) return;

        fetch_get('/api/v01/system/databases', this.props.auth_token)
            .then(data => {
                this.autoRefresh && this.setState({databases: data.databases});
                setTimeout(this._refresh, 15000);
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="database-refresh-failed" defaultMessage="Failed to fetch database information"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentWillUnmount() {
        this.autoRefresh = false;
    }

    componentDidMount() {
        this._refresh()
    }

    render() {
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="databases" defaultMessage="Databases"/></Breadcrumb.Item>
                </Breadcrumb>
                {
                    this.state.databases.map((db, i) => (
                        <Col xs={12} sm={6} key={'db-' + i}>
                            <DatabaseDetails info={db}/>
                        </Col>
                    ))
                }
            </div>
        )
    }
}