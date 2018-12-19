import React, { Component } from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Table from 'react-bootstrap/lib/Table';
import {FormattedMessage} from 'react-intl';
import {fetch_get, fetch_put} from "./utils";

export class StartupEvents extends Component {
    constructor(props) {
        super(props);
        this.state = {events: [], handlers: []};
        this.cancelLoad = false;
        this.selectHandler = this.selectHandler.bind(this);
        this.refreshConfig = this.refreshConfig.bind(this);
    }

    refreshConfig() {
        fetch_get('/api/v01/transactions/startup_events', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({events: data.events}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-startup-events-failed" defaultMessage="Failed to fetch startup events"/>,
                message: error.message,
                level: 'error'
            }));

        fetch_get('/api/v01/activities', this.props.auth_token)
            .then(data => !this.cancelLoad && this.setState({handlers: data.activities}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-activities-failed" defaultMessage="Failed to fetch activities"/>,
                message: error.message,
                level: 'error'
            }));
    }

    componentDidMount() {
        this.refreshConfig()
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    selectHandler(e, eventName) {
        fetch_put(`/api/v01/transactions/startup_events/${eventName}`, {activity_id: e.target.value}, this.props.auth_token)
            .then(() => {
                this.props.notifications.addNotification({
                    message: <FormattedMessage id="update-startup-event-done" defaultMessage="Startup event saved!"/>,
                    level: 'success'
                });
                this.refreshConfig()
            })
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="update-startup-event-failed" defaultMessage="Failed to update startup event"/>,
                message: error.message,
                level: 'error'
            }));
    }

    render() {
        const {events, handlers} = this.state;
        return (
            <Panel>
                <Panel.Heading>
                    <Panel.Title><FormattedMessage id="startup-events" defaultMessage="Startup events" /></Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <Table>
                        <thead>
                        <tr>
                            <th><FormattedMessage id="trigger" defaultMessage="Trigger" /></th>
                            <th><FormattedMessage id="activity" defaultMessage="Activity" /></th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                           events.sort((a, b) => b.name < a.name).map(event => (
                                <tr key={event.name}>
                                    <td>{event.name}</td>
                                    <td>
                                        <select onChange={(e) => this.selectHandler(e, event.name)} value={event.activity_id || ''}>
                                            <FormattedMessage id="none" defaultMessage="*none*">
                                                {(message) => <option value={""}>{message}</option>}
                                            </FormattedMessage>
                                            {handlers
                                                .sort((h1,h2) => h1.id - h2.id)
                                                .map(h => <option value={h.id} key={h.id}>{h.name}</option>)
                                            }
                                        </select>
                                    </td>
                                </tr>)
                            )
                        }
                        </tbody>
                    </Table>
                </Panel.Body>
        </Panel>)
    }
}