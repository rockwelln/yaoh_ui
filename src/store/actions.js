import {
  fetch_get,
  fetch_delete,
  fetch_put,
  fetch_post,
  PROVISIONING_PROXIES
} from "../utils";
import * as actionType from "./constants";

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

export const deleteTenant = Id => ({
  type: actionType.DELETE_TENANT,
  Id
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

export const clearErrorMassage = () => ({
  type: actionType.CLEAR_ERROR_MASSAGE
});

export function fetchGetTenants(cancelLoad, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/`, auth_token)
      .then(data => !cancelLoad && dispatch(getTenants(data)))
      //.catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetTenantById(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${Id}`, auth_token)
      .then(data => dispatch(getTenantById(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetGroupsByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${Id}/groups`, auth_token)
      .then(data => dispatch(getGroupsByTenantId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetPhoneNumbersByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${Id}/numbers`, auth_token)
      .then(data => dispatch(getPhoneNumbersByTenantId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetAdminsByTenantId(Id, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${Id}/admins`, auth_token)
      .then(data => dispatch(getAdminsByTenantId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetGroupById(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}`, auth_token)
      .then(data => dispatch(getGroupById(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetUsersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/users`, auth_token
    )
      .then(data => dispatch(getUsersByGroupId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetPhoneNumbersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?assignement=true`, auth_token
    )
      .then(data => dispatch(getPhoneNumbersByGroupId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetLicensesByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses`, auth_token
    )
      .then(data => dispatch(getLicensesByGroupId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetDevicesByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices`, auth_token
    )
      .then(data => dispatch(getDevicesByGroupId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetAdminsByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/admins`, auth_token
    )
      .then(data => dispatch(getAdminsByGroupId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetUserByName(tenantId, groupId, userName, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}`, auth_token
    )
      .then(data => dispatch(getUserByName(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetTrunkByGroupID(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/features/trunk_groups`, auth_token
    )
      .then(data => dispatch(getTrunkByGroupID(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetAvailableNumbersByGroupId(tenantId, groupId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?available=true`, auth_token
    )
      .then(data => dispatch(getAvailableNumbersByGroupID(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetGroupAdminByAdminId(tenantId, groupId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`, auth_token
    )
      .then(data => dispatch(getGroupAdminByAdminId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetTenantAdminByAdminId(tenantId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_get(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/admins/${adminId}`, auth_token)
      .then(data => dispatch(getTenantAdminByAdminId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchGetUserServicesByUserId(tenantId, groupId, userId, auth_token) {
  return function(dispatch) {
    return fetch_get(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userId}/services?assignementStatus=true&summary=true`, auth_token
    )
      .then(data => dispatch(getUserServicesByUserId(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchPostCreateGroupAdmin(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    const response = fetch_post(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/`,
      data, auth_token
    );
    response.then(res => {
      if (res.status === 400) {
        res
          .json()
          .then(data => dispatch(postCreateGroupAdminError(data)))
          .catch(error => console.error(error));
        return;
      }
      res
        .json()
        .then(data => dispatch(postCreateGroupAdmin(data)))
        .catch(error => console.error(error));
    });
  };
}

export function fetchPostCreateTenantAdmin(tenantId, data, auth_token) {
  return function(dispatch) {
    const response = fetch_post(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/admins/`,
      data, auth_token
    );
    response.then(res => {
      if (res.status === 400) {
        res
          .json()
          .then(data => dispatch(postCreateTenantAdminError(data)))
          .catch(error => console.error(error));
        return;
      }
      res
        .json()
        .then(data => dispatch(postCreateTenantAdmin(data)))
        .catch(error => console.error(error));
    });
  };
}

export function fetchPutUpdateUser(tenantId, groupId, userName, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateUser(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchPutUpdateGroupDetails(tenantId, groupId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateGroupDetails(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchPutUpdateGroupAdmin(tenantId, groupId, adminId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateGroupAdmin(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchPutUpdateTenantAdmin(tenantId, adminId, data, auth_token) {
  return function(dispatch) {
    return fetch_put(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/admins/${adminId}/`,
      data, auth_token
    )
      .then(res => res.json())
      .then(data => dispatch(putUpdateTenantAdmin(data)))
      .catch(error => console.error("An error occurred.", error));
  };
}

export function fetchDeleteTenant(ID, auth_token) {
  return function(dispatch) {
    return fetch_delete(`${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${ID}`, auth_token).then(data =>
      dispatch(deleteTenant(ID))
    );
  };
}

export function fetchDeleteTenantAdmin(tenantId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/admins/${adminId}`, auth_token
    ).then(data => dispatch(deleteTenantAdmin()));
  };
}

export function fetchDeleteGroupDevice(tenantId, groupId, deviceName, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`, auth_token
    ).then(data => dispatch(deleteGroupDevice()));
  };
}

export function fetchDeleteGroupAdmin(tenantId, groupId, adminId, auth_token) {
  return function(dispatch) {
    return fetch_delete(
      `${PROVISIONING_PROXIES.getProxyPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`, auth_token
    ).then(data => dispatch(deleteGroupAdmin()));
  };
}
