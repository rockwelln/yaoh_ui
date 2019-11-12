import React from "react";
import {Route} from "react-router";
import {isAllowed, pages} from "./utils/user";
import {NotAllowed} from "./utils/common";
import SearchPage from "./components/SearchPage";
import LocalUsers from "./components/LocalUsers";
import UpdateLocalUser from "./components/UpdateLocalUser";
import AddLocalUsers from "./components/AddLocalUser";
import ConfigPage from "./components/Configs";
import CategoryPage from "./components/CategoryPage";
import TemplatePage from "./components/TemplatePage";
import Tenants from "./components/Tenants";
import AddPhoneNumberTenant from "./components/AddPhoneNumberTenant";
import CreateTenant from "./components/CreateTenant";
import CreateGroup from "./components/CreateGroup";
import AddTrunkGroup from "./components/AddTrunkGroup";
import AddUser from "./components/AddUser";
import AddPhoneNumberGroup from "./components/AddPhoneNumberGroup";
import TrunkGroupPage from "./components/TrunkGroupPage";
import UserPage from "./components/UserPage";
import TenantPage from "./components/TenantPage";
import GroupPage from "./components/GroupPage";
import CreateAdmin from "./components/CreateAdmin";
import UpdateAdmin from "./components/UpdateAdmin";


export function provisioningRoutes(ui_profile) {
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