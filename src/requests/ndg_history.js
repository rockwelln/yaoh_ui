import React from "react";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import {Search, SearchFieldsPanel} from "../utils/common";
import update from "immutability-helper";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {ApioDatatable} from "../utils/datatable";
import Form from "react-bootstrap/lib/Form";
import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import InputGroup from "react-bootstrap/lib/InputGroup";
import {fetch_get} from "../utils";
import {Link} from "react-router-dom";
import Button from "react-bootstrap/lib/Button";


class NdgPassword extends React.Component {
    state = {
        decrypted: false,
    };

    onDecrypt() {
        fetch_get(`/api/v01/apio/ndg/${this.props.entry.id}`, this.props.auth_token)
            .then(data => this.setState({clear_password: data.password, decrypted: true}))
            .catch(error => this.props.notifications.addNotification({
                title: <FormattedMessage id="fetch-ndg-failed" defaultMessage="Failed to fetch clear password"/>,
                message: error.message,
                level: 'error'
            }))
    }

    render() {
        const {decrypted, clear_password} = this.state;

        return (
            <div>
                <InputGroup>
                    <FormControl readOnly type={decrypted?"text":"password"} value={decrypted?clear_password:"......."}/>
                    <div className="input-group-addon">
                        <a onClick={this.onDecrypt.bind(this)}>
                            <i className="fa fa-eye-slash" aria-hidden="true" />
                        </a>
                    </div>
                </InputGroup>
            </div>
        )
    }
}

export class NdgHistory extends Search {
    static defaultProps = update(Search.defaultProps, {'$merge': {
        searchUrl: '/api/v01/apio/ndg/search',
        collectionName: 'ndgs',
        defaultCriteria: {
            tenant_id: {value: '', op: 'eq'},
            site_id: {value: '', op: 'eq'},
            ndg: {value: '', op: 'eq'},
            ndgUserId: {value: '', op: 'eq'},
            when: {value: '', op: 'eq'},
        },
        defaultSortingSpec: [{
            field: 'when', direction: 'desc'
        }],
    }});

    render() {
        const {filter_criteria, resources, sorting_spec, pagination} = this.state;
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="requests" defaultMessage="Requests"/></Breadcrumb.Item>
                    <Breadcrumb.Item active><FormattedMessage id="ndg-history-logs" defaultMessage="NDG history logs"/></Breadcrumb.Item>
                </Breadcrumb>

                <SearchFieldsPanel>
                    <Form horizontal>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="tenant-id" defaultMessage="Tenant ID" />
                            </Col>

                            <Col sm={1}>
                                <FormControl
                                    componentClass="select"
                                    value={filter_criteria.tenant_id.op}
                                    onChange={e => this.setState({
                                        filter_criteria: update(filter_criteria,
                                            {tenant_id: {$merge: {op: e.target.value}}})
                                    })}>
                                    <option value="eq">==</option>
                                    <option value="ne">!=</option>
                                </FormControl>
                            </Col>

                            <Col sm={8}>
                                <FormControl
                                    componentClass="input"
                                    value={filter_criteria.tenant_id.value}
                                    onChange={e =>
                                        this.setState({filter_criteria: update(filter_criteria, {tenant_id: {$merge: {value: e.target.value}}})
                                     })} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="site-id" defaultMessage="Site ID" />
                            </Col>

                            <Col sm={1}>
                                <FormControl
                                    componentClass="select"
                                    value={filter_criteria.site_id.op}
                                    onChange={e => this.setState({
                                        filter_criteria: update(filter_criteria,
                                            {site_id: {$merge: {op: e.target.value}}})
                                    })}>
                                    <option value="eq">==</option>
                                    <option value="ne">!=</option>
                                </FormControl>
                            </Col>

                            <Col sm={8}>
                                <FormControl
                                    componentClass="input"
                                    value={filter_criteria.site_id.value}
                                    onChange={e =>
                                        this.setState({filter_criteria: update(filter_criteria, {site_id: {$merge: {value: e.target.value}}})
                                     })} />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="ndg" defaultMessage="NDG" />
                            </Col>

                            <Col sm={1}>
                                <FormControl
                                    componentClass="select"
                                    value={filter_criteria.ndg.op}
                                    onChange={e => this.setState({
                                        filter_criteria: update(filter_criteria,
                                            {ndg: {$merge: {op: e.target.value}}})
                                    })}>
                                    <option value="eq">==</option>
                                    <option value="ne">!=</option>
                                </FormControl>
                            </Col>

                            <Col sm={8}>
                                <FormControl
                                    componentClass="input"
                                    value={filter_criteria.ndg.value}
                                    onChange={e =>
                                        this.setState({filter_criteria: update(filter_criteria, {ndg: {$merge: {value: e.target.value}}})
                                     })} />
                            </Col>
                        </FormGroup>

                         <FormGroup>
                            <Col smOffset={1} sm={1}>
                                <Button bsStyle="info" onClick={() => this._refresh({page_number: 1})}>
                                    <FormattedMessage id="search" defaultMessage="Search" />
                                </Button>
                            </Col>
                         </FormGroup>
                    </Form>
                </SearchFieldsPanel>

                <Panel>
                    <Panel.Body>
                        <ApioDatatable
                            sorting_spec={sorting_spec}
                            headers={[
                                {title: <FormattedMessage id="tenant-id" defaultMessage="tenant id" />, field: 'tenant_id', sortable: true},
                                {title: <FormattedMessage id="site-id" defaultMessage="site id" />, field: 'site_id', sortable: true},
                                {title: <FormattedMessage id="ndg" defaultMessage="ndg" />, field: 'ndg', sortable: true},
                                {title: <FormattedMessage id="ndguserid" defaultMessage="ndgUserId" />, field: 'ndg_user_id', sortable: true},
                                {title: <FormattedMessage id="request" defaultMessage="Request id" />, render: n => (
                                    <Link to={`/transactions/${n.instance_id}`}>I{n.instance_id}</Link>
                                )},
                                {title: <FormattedMessage id="when" defaultMessage="when" />, field: 'created_on', sortable: true},
                                {title: <FormattedMessage id="password" defaultMessage="Password" />, render: n => (
                                    n.password && <NdgPassword
                                        entry={n}
                                        {...this.props}
                                    />
                                )},
                            ]}
                            pagination={pagination}
                            data={resources}
                            onSort={s => this._refresh(undefined, s)}
                            onPagination={p => this._refresh(p)}
                            />
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}