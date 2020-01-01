import React from "react";
import {Redirect, Route} from "react-router";
import {isAllowed, pages} from "../utils/user";
import {NotAllowed} from "../utils/common";

import {ProvProxiesManager} from "../utils";
import {Link} from 'react-router-dom';
import Panel from "react-bootstrap/lib/Panel";
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Table, {tr} from "react-bootstrap/lib/Table";

// default
import SearchPage from "./default/components/SearchPage";
import LocalUsers from "./default/components/LocalUsers";
import UpdateLocalUser from "./default/components/UpdateLocalUser";
import AddLocalUsers from "./default/components/AddLocalUser";
import ConfigPage from "./default/components/Configs";
import CategoryPage from "./default/components/CategoryPage";
import TemplatePage from "./default/components/TemplatePage";
import Tenants from "./default/components/Tenants";
import AddPhoneNumberTenant from "./default/components/AddPhoneNumberTenant";
import CreateTenant from "./default/components/CreateTenant";
import CreateGroup from "./default/components/CreateGroup";
import AddTrunkGroup from "./default/components/AddTrunkGroup";
import AddDevicePage from "./default/components/AddDevicePage";
import AddUser from "./default/components/AddUser";
import AddPhoneNumberGroup from "./default/components/AddPhoneNumberGroup";
import TrunkGroupPage from "./default/components/TrunkGroupPage";
import UserPage from "./default/components/UserPage";
import TenantPage from "./default/components/TenantPage";
import GroupPage from "./default/components/GroupPage";
import CreateAdmin from "./default/components/CreateAdmin";
import UpdateAdmin from "./default/components/UpdateAdmin";
import mainDefaultProvisioningReducer from "./default/store/reducers";
// end

// PRA
import PraTenants from "./pra/components/Tenants";
import PraAddEntreprises from "./pra/components/AddEntreprises";
import PraAddGroup from "./pra/components/AddGroup";
import PraEntreprisesPage from "./pra/components/EntreprisesPage";
import PraAddIAD from "./pra/components/AddIAD";
import PraAddPhoneToGroup from "./pra/components/AddPhoneNumbersToGroup";
import PraIADPage from "./pra/components/IADPage";
import PraEnterpriseTrunkPage from "./pra/components/EnterpriseTrunkPage";
import PraGroupPage from "./pra/components/GroupPage";
import mainPraProvisioningReducer from "./pra/store/reducers";
// end


// default
function provisioningDefaultRoutes(ui_profile) {
    return [
        <Route
            path="/provisioning/:gwName/search"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <SearchPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/localusers"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <LocalUsers/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/localusers/user/:localUserName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <UpdateLocalUser/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/localusers/adduser"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddLocalUsers/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/configs"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <ConfigPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/templates/:categoryName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <CategoryPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact/>,
        <Route
            path="/provisioning/:gwName/templates/:categoryName/template/:templateName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <TemplatePage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact/>,
        <Route
            path="/provisioning/:gwName/tenants"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <Tenants />
                ) : (
                    <NotAllowed/>
                )
            }
            exact/>,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/addphone"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddPhoneNumberTenant/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact/>,
        <Route
            path="/provisioning/:gwName/tenants/add"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? <CreateTenant/>
                    : <NotAllowed/>
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/addgroup"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? <CreateGroup/>
                    : <NotAllowed/>
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/addtrunk"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddTrunkGroup/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/adduser"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddUser/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/addphone"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddPhoneNumberGroup/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/trunkgroup/:trunkGroupName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <TrunkGroupPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/trunkgroup/:trunkGroupName/users/:userName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <UserPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/adddevice"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddDevicePage />
                ) : (
                    <NotAllowed />
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/trunkgroup/:trunkGroupName/adduser"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <AddUser/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <TenantPage  />
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <GroupPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/users/:userName"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <UserPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/addadmin"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <CreateAdmin/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/admins/:adminId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <UpdateAdmin/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/addadmin"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <CreateAdmin/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/admins/:adminId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <UpdateAdmin/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />
    ]
}
// end

// PRA
function provisioningPraRoutes(ui_profile) {
    return [
        <Route
            path="/provisioning/:gwName/tenants"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraTenants/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/add"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraAddEntreprises/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraEntreprisesPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/addgroup"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraAddGroup/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraGroupPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/addiad"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraAddIAD/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/addphone"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraAddPhoneToGroup/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/iad/:iadId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraIADPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/enterprisetrunk/:entTrunkId"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraEnterpriseTrunkPage/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />,
        <Route
            path="/provisioning/:gwName/tenants/:tenantId/groups/:groupId/modifyphone"
            component={props =>
                isAllowed(ui_profile, pages.data_tenants) ? (
                    <PraAddPhoneToGroup/>
                ) : (
                    <NotAllowed/>
                )
            }
            exact
        />
    ]
}
// end

export let provisioningRoutes = null;
export let mainReducer = null;

// pra
provisioningRoutes = provisioningPraRoutes;
mainReducer = mainPraProvisioningReducer;
// end

// default
provisioningRoutes = provisioningDefaultRoutes;
mainReducer = mainDefaultProvisioningReducer;
// end

export class ListProvisioningGateways extends React.Component {
    render() {
        const proxies = ProvProxiesManager.listProxies();
        if(proxies.length === 1) {
            return <Redirect to={"/provisioning/" + proxies[0].id + "/tenants"}/>
        }
        return (
            <div>
                <Breadcrumb>
                    <Breadcrumb.Item active><FormattedMessage id="provisioning" defaultMessage="Provisioning"/></Breadcrumb.Item>
                </Breadcrumb>

                <Panel>
                    <Panel.Body>
                        <Table>
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
                        </Table>
                    </Panel.Body>
                </Panel>
            </div>
        )
    }
}