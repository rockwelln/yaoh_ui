import {
  fetch_get,
  fetch_delete,
  fetch_put,
  fetch_post,
  ProvProxiesManager,
  NotificationsManager
} from "../utils";
import * as actionType from "./constants";
import { FormattedMessage } from "react-intl";
import React from "react";

export const getTenants = data => ({
  type: actionType.GET_TENANTS,
  data
});

export const getTenantById = data => ({
  type: actionType.GET_TENANT,
  data
});

export const getGroupsByTenantId = data => ({
  type: actionType.GET_GROUPS,
  data
});

export const getPhoneNumbersByTenantId = data => ({
  type: actionType.GET_PHONE_NUMBERS,
  data
});

export const getAdminsByTenantId = data => ({
  type: actionType.GET_ADMINS_TENANT,
  data
});

export const getGroupById = data => ({
  type: actionType.GET_GROUP,
  data
});

export const getUsersByGroupId = data => ({
  type: actionType.GET_USERS,
  data
});

export const getPhoneNumbersByGroupId = data => ({
  type: actionType.GET_PHONE_NUMBERS_BY_GROUP_ID,
  data
});

export const getLicensesByGroupId = data => ({
  type: actionType.GET_LICENSES_BY_GROUP_ID,
  data
});

export const getDevicesByGroupId = data => ({
  type: actionType.GET_DEVICES_BY_GROUP_ID,
  data
});

export const getUserByName = data => ({
  type: actionType.GET_USER,
  data
});

export const getTrunkByGroupID = data => ({
  type: actionType.GET_TRUNK_BY_GROUP_ID,
  data
});

export const getAvailableNumbersByGroupID = data => ({
  type: actionType.GET_AVAILABLE_NUMBERS_BY_GROUP_ID,
  data
});

export const getAdminsByGroupId = data => ({
  type: actionType.GET_ADMINS_GROUP,
  data
});

export const getGroupAdminByAdminId = data => ({
  type: actionType.GET_GROUP_ADMIN_BY_ADMIN_ID,
  data
});

export const getTenantAdminByAdminId = data => ({
  type: actionType.GET_TENANT_ADMIN_BY_ADMIN_ID,
  data
});

export const getUserServicesByUserId = data => ({
  type: actionType.GET_USER_SERVICES_BY_USER_ID,
  data
});

export const getTamplatesOfTenant = data => ({
  type: actionType.GET_TEMPLATES_OF_TENANT,
  data
});

export const getAccessDeviceByName = data => ({
  type: actionType.GET_ACCESS_DEVICE_BY_NAME,
  data
});

export const getTamplatesOfGroup = data => ({
  type: actionType.GET_TEMPLATES_OF_GROUP,
  data
});

export const postCreateGroupAdmin = data => ({
  type: actionType.POST_CREATE_GROUP_ADMIN,
  data
});

export const postCreateGroupAdminError = error => ({
  type: actionType.POST_CREATE_GROUP_ADMIN_ERROR,
  error
});

export const postCreateTenantAdmin = data => ({
  type: actionType.POST_CREATE_TENANT_ADMIN,
  data
});

export const postCreateTenantAdminError = error => ({
  type: actionType.POST_CREATE_TENANT_ADMIN_ERROR,
  error
});

export const postAssignUserServices = () => ({
  type: actionType.POST_ASSIGN_USER_SERVICES
});

export const postAssignUserServicePacks = () => ({
  type: actionType.POST_ASSIGN_USER_SERVICE_PACKS
});

export const postCreateTenant = data => ({
  type: actionType.POST_CREATE_TENANT,
  data
});

export const postCreateGroup = data => ({
  type: actionType.POST_CREATE_GROUP,
  data
});

export const putUpdateUser = data => ({
  type: actionType.PUT_UPDATE_USER,
  data
});

export const putUpdateGroupDetails = data => ({
  type: actionType.PUT_UPDATE_GROUP_DETAILS,
  data
});

export const putUpdateGroupAdmin = data => ({
  type: actionType.PUT_UPDATE_GROUP_ADMIN,
  data
});

export const putUpdateTenantAdmin = data => ({
  type: actionType.PUT_UPDATE_TENANT_ADMIN,
  data
});

export const putUpdateTrunkByGroupId = data => ({
  type: actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID,
  data
});

export const putUpdateTrunkByGroupIdError = data => ({
  type: actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID_ERROR,
  data
});

export const putUpdateServicePacksByGroupId = data => ({
  type: actionType.PUT_UPDATE_SERVICE_PACKS_BY_GROUP_ID,
  data
});

export const putUpdateGroupServicesByGroupId = data => ({
  type: actionType.PUT_UPDATE_GROUP_SERVICES_BY_GROUP_ID,
  data
});

export const putUpdateTenantDetails = data => ({
  type: actionType.PUT_UPDATE_TENANT_DETAILS,
  data
});

export const deleteTenant = data => ({
  type: actionType.DELETE_TENANT,
  data
});

export const deleteTenantAdmin = () => ({
  type: actionType.DELETE_TENANT_ADMIN
});

export const deleteGroupDevice = () => ({
  type: actionType.DELETE_GROUP_DEVICE
});

export const deleteGroupAdmin = () => ({
  type: actionType.DELETE_GROUP_ADMIN
});

export const deleteAssignUserServices = () => ({
  type: actionType.DELETE_DEASSIGN_USER_SERVICES
});

export const deleteAssignUserServicePacks = () => ({
  type: actionType.DELETE_DEASSIGN_USER_SERVICE_PACKS
});

export const clearErrorMassage = () => ({
  type: actionType.CLEAR_ERROR_MASSAGE
});

export const changeStepOfCreateTenant = data => ({
  type: actionType.CHANGE_STEP_OF_CREATE_TENANT,
  data
});

export const changeTypeOfTenant = data => ({
  type: actionType.CHANGE_TYPE_OF_TENANT,
  data
});

export const changeIdOfTenant = data => ({
  type: actionType.CHANGE_ID_OF_TENANT,
  data
});

export const changeNameOfTenant = data => ({
  type: actionType.CHANGE_NAME_OF_TENANT,
  data
});

export const changeAddressOfTenant = data => ({
  type: actionType.CHANGE_ADDRESS_OF_TENANT,
  data
});

export const changeZIPOfTenant = data => ({
  type: actionType.CHANGE_ZIP_OF_TENANT,
  data
});

export const changeCityOfTenant = data => ({
  type: actionType.CHANGE_CITY_OF_TENANT,
  data
});

export const changeTemplateOfTenant = data => ({
  type: actionType.CHANGE_TAMPLATE_OF_TENANT,
  data
});

export const refuseCreateTenant = () => ({
  type: actionType.REFUSE_CREATE_TENANT
});

export const changeDomainOfTenant = data => ({
  type: actionType.CHANGE_DOMAIN_OF_TENANT,
  data
});

export const refuseCreateGroup = () => ({
  type: actionType.REFUSE_CREATE_GROUP
});

export const changeIdOfGroup = data => ({
  type: actionType.CHANGE_ID_OF_GROUP,
  data
});

export const changeNameOfGroup = data => ({
  type: actionType.CHANGE_NAME_OF_GROUP,
  data
});

export const changeDomainOfGroup = data => ({
  type: actionType.CHANGE_DOMAIN_OF_GROUP,
  data
});

export const changeUserLimitOfGroup = data => ({
  type: actionType.CHANGE_USER_LIMIT_OF_GROUP,
  data
});

export const changeAddressOfGroup = data => ({
  type: actionType.CHANGE_ADDRESS_OF_GROUP,
  data
});

export const changeZIPOfGroup = data => ({
  type: actionType.CHANGE_ZIP_OF_GROUP,
  data
});

export const changeCityOfGroup = data => ({
  type: actionType.CHANGE_CITY_OF_GROUP,
  data
});

export const changeStepOfCreateGroup = data => ({
  type: actionType.CHANGE_STEP_OF_CREATE_GROUP,
  data
});

export const changeTemplateOfGroup = data => ({
  type: actionType.CHANGE_TAMPLATE_OF_GROUP,
  data
});

export function fetchGetTenants(cancelLoad, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/`, auth_token)
      .then(data => !cancelLoad && dispatch(getTenants(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-tenants-failed" defaultMessage="Failed to fetch tenants!"/>,
          error.message
        )
      );
  };
}

export function fetchGetTenantById(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}`, auth_token)
      .then(data => dispatch(getTenantById(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-tenant-failed" defaultMessage="Failed to fetch tenant details!"/>,
          error.message
        )
      );
  };
}

export function fetchGetGroupsByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/groups`, auth_token)
      .then(data => dispatch(getGroupsByTenantId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-groups-failed" defaultMessage="Failed to fetch groups!"/>,
          error.message
        )
      );
  };
}

export function fetchGetPhoneNumbersByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/numbers`, auth_token)
      .then(data => dispatch(getPhoneNumbersByTenantId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-numbers-failed" defaultMessage="Failed to fetch phone numbers!"/>,
          error.message
        )
      );
  };
}

export function fetchGetAdminsByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/admins`, auth_token)
      .then(data => dispatch(getAdminsByTenantId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-admins-failed" defaultMessage="Failed to fetch admins!"/>,
          error.message
        )
      );
  };
}

export function fetchGetGroupById(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}`, auth_token)
      .then(data => dispatch(getGroupById(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-group-failed" defaultMessage="Failed to fetch group details!"/>,
          error.message
        )
      );
  };
}

export function fetchGetUsersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users`, auth_token
    )
      .then(data => dispatch(getUsersByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-users-failed" defaultMessage="Failed to fetch users!"/>,
          error.message
        )
      );
  };
}

export function fetchGetPhoneNumbersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?assignement=true`, auth_token
    )
      .then(data => dispatch(getPhoneNumbersByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-numbers-failed" defaultMessage="Failed to fetch phone numbers!"/>,
          error.message
        )
      );
  };
}

export function fetchGetLicensesByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses`, auth_token
    )
      .then(data => dispatch(getLicensesByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-licenses-failed" defaultMessage="Failed to fetch licenses!"/>,
          error.message
        )
      );
  };
}

export function fetchGetDevicesByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices`, auth_token
    )
      .then(data => dispatch(getDevicesByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-devices-failed" defaultMessage="Failed to fetch devices!"/>,
          error.message
        )
      );
  };
}

export function fetchGetAdminsByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins`, auth_token
    )
      .then(data => dispatch(getAdminsByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-group-admins-failed" defaultMessage="Failed to fetch group admins!"/>,
          error.message
        )
      );
  };
}

export function fetchGetUserByName(tenantId, groupId, userName, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}`, auth_token
    )
      .then(data => dispatch(getUserByName(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-user-failed" defaultMessage="Failed to fetch user details!"/>,
          error.message
        )
      );
  };
}

export function fetchGetTrunkByGroupID(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/features/trunk_groups`, auth_token
    )
      .then(data => dispatch(getTrunkByGroupID(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-trunk-failed" defaultMessage="Failed to fetch trunk!"/>,
          error.message
        )
      );
  };
}

export function fetchGetAvailableNumbersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?available=true`, auth_token
    )
      .then(data => dispatch(getAvailableNumbersByGroupID(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-avail-numbers-failed" defaultMessage="Failed to fetch available numbers!"/>,
          error.message
        )
      );
  };
}

export function fetchGetGroupAdminByAdminId(tenantId, groupId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`, auth_token
    )
      .then(data => dispatch(getGroupAdminByAdminId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-admin-failed" defaultMessage="Failed to fetch admin details!"/>,
          error.message
        )
      );
  };
}

export function fetchGetTenantAdminByAdminId(tenantId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_get(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}`, auth_token)
      .then(data => dispatch(getTenantAdminByAdminId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-admin-failed" defaultMessage="Failed to fetch admin details!"/>,
          error.message
        )
      );
  };
}

export function fetchGetUserServicesByUserId(tenantId, groupId, userId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userId}/services?assignementStatus=true&summary=true`, auth_token
    )
      .then(data => dispatch(getUserServicesByUserId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="fetch-user-services-failed" defaultMessage="Failed to fetch user services!"/>,
          error.message
        )
      );
  };
}

export function fetchGetTamplatesOfTenant(auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/tenant/`, auth_token
    )
      .then(data => dispatch(getTamplatesOfTenant(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenant-tamplates-failed"
            defaultMessage="Failed to fetch tenant tamplates!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetAccessDeviceByName(tenantId, groupId, deviceName, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`,
      auth_token
    )
      .then(data => dispatch(getAccessDeviceByName(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-access-device-failed"
            defaultMessage="Failed to fetch access device!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTamplatesOfGroup(auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/group/`,
      auth_token
    )
      .then(data => dispatch(getTamplatesOfGroup(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenant-tamplates-failed"
            defaultMessage="Failed to fetch tenant tamplates!"
          />,
          error.message
        )
      );
  };
}

export function fetchPostCreateGroupAdmin(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/`,
      data, auth_token
    )
      .then(resp => resp.json())
      .then(data => dispatch(postCreateGroupAdmin(data)))
      .catch(error => {
        if (error.response && error.response.status === 400) {
          return dispatch(postCreateGroupAdminError(error));
        } else {
          NotificationsManager.error(
            <FormattedMessage id="create-group-admin-failed" defaultMessage="Failed to create group admin!"/>,
            error.message
          );
        }
      });
  };
}

export function fetchPostCreateTenantAdmin(tenantId, data, auth_token) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/`,
      data, auth_token
    )
      .then(resp => resp.json())
      .then(data => dispatch(postCreateTenantAdmin(data)))
      .catch(error => {
        if (error.response && error.response.status === 400) {
          return dispatch(postCreateTenantAdminError(error));
        } else {
          NotificationsManager.error(
            <FormattedMessage id="create-group-admin-failed" defaultMessage="Failed to create group admin!"/>,
            error.message
          );
        }
      });
  };
}

export function fetchPostCreateTenant(data, auth_token) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/`,
      data,
      auth_token
    )
      .then(data => dispatch(postCreateTenant(data)))
      .catch(error => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-tenant"
            defaultMessage="Failed to create tenant!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostCreateGroup(tenantId, data, auth_token) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/`,
      data,
      auth_token
    )
      .then(data => dispatch(postCreateGroup(data)))
      .catch(error => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-group"
            defaultMessage="Failed to create group!"
          />,
          error.message
        );
      });
  };
}

export function fetchPutUpdateUser(tenantId, groupId, userName, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateUser(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-user-failed" defaultMessage="Failed to update user!"/>,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupDetails(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateGroupDetails(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-group-failed" defaultMessage="Failed to update group details!"/>,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupAdmin(tenantId, groupId, adminId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateGroupAdmin(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-group-admin-failed" defaultMessage="Failed to update group admin!"/>,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantAdmin(tenantId, adminId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateTenantAdmin(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-tenant-admin-failed" defaultMessage="Failed to update tenant admin!"/>,
          error.message
        )
      );
  };
}

export function fetchPostAssignUserServices(tenantId, groupId, userName, data, auth_token) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data,
      auth_token
    )
      .then(resp => resp.json())
      .then(data => dispatch(postAssignUserServices(data)))
      .catch(error => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-assign-services"
            defaultMessage="Failed to assign services!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAssignUserServicePacks(
  tenantId,
  groupId,
  userName,
  data,
  auth_token
) {
  return function(dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data,
      auth_token
    )
      .then(resp => resp.json())
      .then(data => dispatch(postAssignUserServicePacks(data)))
      .catch(error => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-assign-service-packs"
            defaultMessage="Failed to assign services packs!"
          />,
          error.message
        );
      });
  };
}

export function fetchPutUpdateTrunkByGroupId(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/features/trunk_groups/`,
      data,
      auth_token
    )
      .then(resp => resp.json())
      .then(data => dispatch(putUpdateTrunkByGroupId(data)))
      .catch(error => {
        if (error.response && error.response.status === 400) {
          return dispatch(putUpdateTrunkByGroupIdError(error));
        } else {
          NotificationsManager.error(
            <FormattedMessage id="update-trunk-failed" defaultMessage="Failed to update trunk!"/>,
            error.message
          );
        }
      });
  };
}

export function fetchPutUpdateServicePacksByGroupId(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses/`,
      data,
      auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateServicePacksByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-service-packs-failed" defaultMessage="Failed to update service packs!"/>,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupServicesByGroupId(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses/`,
      data,
      auth_token
    )
      .then(data => dispatch(putUpdateGroupServicesByGroupId(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="update-services-failed" defaultMessage="Failed to update services!"/>,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantDetails(tenantId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}`,
      data,
      auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateTenantDetails(data)))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-tenant-details-failed"
            defaultMessage="Failed to update tenant details!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTenant(ID, auth_token) {
  return function(dispatch) {
    return fetch_delete(`${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${ID}`, auth_token)
      .then(data => {
          dispatch(deleteTenant(data));
          return "deleted";
      })
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="delete-tenant-failed" defaultMessage="Failed to delete tenant!"/>,
          error.message
        )
      );
  };
}

export function fetchDeleteTenantAdmin(tenantId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}`, auth_token
    )
      .then(data => dispatch(deleteTenantAdmin()))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="delete-tenant-admin-failed" defaultMessage="Failed to delete tenant admin!"/>,
          error.message
        )
      );
  };
}

export function fetchDeleteGroupDevice(tenantId, groupId, deviceName, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`, auth_token
    )
      .then(data => dispatch(deleteGroupDevice()))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="delete-group-device-failed" defaultMessage="Failed to delete group device!"/>,
          error.message
        )
      );
  };
}

export function fetchDeleteGroupAdmin(tenantId, groupId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`, auth_token
    )
      .then(data => dispatch(deleteGroupAdmin()))
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage id="delete-group-admin-failed" defaultMessage="Failed to delete group admin!"/>,
          error.message
        )
      );
  };
}

export function fetchDeleteAssignUserServices(
  tenantId,
  groupId,
  userName,
  data,
  auth_token
) {
  return function(dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data,
      auth_token
    )
      .then(data => {
        dispatch(deleteAssignUserServices());
      })
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-deassign-user-services"
            defaultMessage="Failed to deassign user services!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteAssignUserServicePacks(
  tenantId,
  groupId,
  userName,
  data,
  auth_token
) {
  return function(dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data,
      auth_token
    )
      .then(data => {
        dispatch(deleteAssignUserServicePacks());
      })
      .catch(error =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-deassign-user-services"
            defaultMessage="Failed to deassign user services!"
          />,
          error.message
        )
      );
  };
}
