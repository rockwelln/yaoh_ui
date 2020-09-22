import React from "react";
import {ProvProxiesManager} from "../utils";
import {Redirect} from "react-router";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Panel from "react-bootstrap/lib/Panel";
import Table, {tr} from "react-bootstrap/lib/Table";
import {Link} from "react-router-dom";


export default function ListProvisioningGateways() {
    const proxies = ProvProxiesManager.listProxies();

    if(proxies.length === 1) {
        return <Redirect to={"/provisioning/" + proxies[0].id + "/tenants"}/>
    }
    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="provisioning" defaultMessage="Provisioning"/></Breadcrumb.Item>
            </Breadcrumb>

            <Panel>
                <Panel.Body>
                    <Table>
                      <tbody>
                        {
                            proxies.map((p, i) =>
                                <tr>
                                    <td>
                                        <Link to={"/provisioning/" + p.id + "/tenants"} key={i}>
                                            {p.name}
                                        </Link>
                                    </td>
                                </tr>
                            )
                        }
                        {
                            proxies.length === 0 && (
                                <tr>
                                    <td><FormattedMessage id="none" defaultMessage="None" /></td>
                                </tr>
                            )
                        }
                      </tbody>
                    </Table>
                </Panel.Body>
            </Panel>
        </>
    )
}