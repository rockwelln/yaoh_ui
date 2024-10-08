import {
  fetch_get,
  fetch_delete,
  fetch_put,
  fetch_post,
  ProvProxiesManager,
  NotificationsManager,
} from "../../../utils";
import * as actionType from "./constants";
import { FormattedMessage } from "react-intl";
import React from "react";

export const getTenants = (data) => ({
  type: actionType.GET_TENANTS,
  data,
});

export const getTenantById = (data) => ({
  type: actionType.GET_TENANT,
  data,
});

export const getGroupsByTenantId = (data) => ({
  type: actionType.GET_GROUPS,
  data,
});

export const getPhoneNumbersByTenantId = (data) => ({
  type: actionType.GET_PHONE_NUMBERS,
  data,
});

export const getAdminsByTenantId = (data) => ({
  type: actionType.GET_ADMINS_TENANT,
  data,
});

export const getGroupById = (data) => ({
  type: actionType.GET_GROUP,
  data,
});

export const getUsersByGroupId = (data) => ({
  type: actionType.GET_USERS,
  data,
});

export const getPhoneNumbersByGroupId = (data) => ({
  type: actionType.GET_PHONE_NUMBERS_BY_GROUP_ID,
  data,
});

export const getLicensesByGroupId = (data) => ({
  type: actionType.GET_LICENSES_BY_GROUP_ID,
  data,
});

export const getDevicesByGroupId = (data) => ({
  type: actionType.GET_DEVICES_BY_GROUP_ID,
  data,
});

export const getUserByName = (data) => ({
  type: actionType.GET_USER,
  data,
});

export const getTrunkByGroupID = (data) => ({
  type: actionType.GET_TRUNK_BY_GROUP_ID,
  data,
});

export const getAvailableNumbersByGroupID = (data) => ({
  type: actionType.GET_AVAILABLE_NUMBERS_BY_GROUP_ID,
  data,
});

export const getAdminsByGroupId = (data) => ({
  type: actionType.GET_ADMINS_GROUP,
  data,
});

export const getGroupAdminByAdminId = (data) => ({
  type: actionType.GET_GROUP_ADMIN_BY_ADMIN_ID,
  data,
});

export const getTenantAdminByAdminId = (data) => ({
  type: actionType.GET_TENANT_ADMIN_BY_ADMIN_ID,
  data,
});

export const getUserServicesByUserId = (data) => ({
  type: actionType.GET_USER_SERVICES_BY_USER_ID,
  data,
});

export const getTamplatesOfTenant = (data) => ({
  type: actionType.GET_TEMPLATES_OF_TENANT,
  data,
});

export const getAccessDeviceByName = (data) => ({
  type: actionType.GET_ACCESS_DEVICE_BY_NAME,
  data,
});

export const getTamplatesOfGroup = (data) => ({
  type: actionType.GET_TEMPLATES_OF_GROUP,
  data,
});

export const getCategoriesOfTemplate = (data) => ({
  type: actionType.GET_CATEGORIES_OF_TEMPLATE,
  data,
});

export const getCategoryByName = (data) => ({
  type: actionType.GET_CATEGORY_BY_NAME,
  data,
});

export const getTrunksGroupsByGroup = (data) => ({
  type: actionType.GET_TRUNKS_GROUPS_BY_GROUP,
  data,
});

export const getTrunkGroupByName = (data) => ({
  type: actionType.GET_TRUNK_GROUP_BY_NAME,
  data,
});

export const getPhoneTypes = (data) => ({
  type: actionType.GET_PHONE_TYPES,
  data,
});

export const getPhoneTypesDetails = (data) => ({
  type: actionType.GET_PHONE_TYPES_DETAILS,
  data,
});

export const getUsersByTrunkGroup = (data) => ({
  type: actionType.GET_USERS_BY_TRUNK_GROUP,
  data,
});

export const getBackupByTrunkGroup = (data) => ({
  type: actionType.GET_BACKUP_BY_TRUNK_GROUP,
  data,
});

export const getTemplateDetails = (data) => ({
  type: actionType.GET_TEMPLATE_DETAILS,
  data,
});

export const getApplications = (data) => ({
  type: actionType.GET_APPLICATIONS,
  data,
});

export const getKeysByApplication = (data) => ({
  type: actionType.GET_KEYS_BY_APPLICATIONS,
  data,
});

export const getValueOfKey = (data) => ({
  type: actionType.GET_VALUE_OF_KEY,
  data,
});

export const getTrunksGroupsByGroupFail = (data) => ({
  type: actionType.GET_TRUNKS_GROUPS_BY_GROUP_FAIL,
  data,
});

export const getLocalUsers = (data) => ({
  type: actionType.GET_LOCAL_USERS,
  data,
});

export const getLocalUser = (data) => ({
  type: actionType.GET_LOCAL_USER,
  data,
});

export const getSearchUsers = (data) => ({
  type: actionType.GET_SEARCH_USERS,
  data,
});

export const getSearchGroups = (data) => ({
  type: actionType.GET_SEARCH_GROUPS,
  data,
});

export const getAvailableNumbersByTenantID = (data) => ({
  type: actionType.GET_AVAILABLE_NUMBERS_BY_TENANT_ID,
  data,
});

export const getLanguages = (data) => ({
  type: actionType.GET_LANGUAGES,
  data,
});

export const getTenantLicenses = (data) => ({
  type: actionType.GET_TENANT_LICENSES,
  data,
});

export const getTrunkByTenantID = (data) => ({
  type: actionType.GET_TRUNK_BY_TENANT_ID,
  data,
});

export const getDevice = (data) => ({
  type: actionType.GET_DEVICE,
  data,
});

export const getTrunkGroupByTenant = (data) => ({
  type: actionType.GET_TENANT_TRUNK_GROUP,
  data,
});

export const getTenantServicePack = (data) => ({
  type: actionType.GET_TENANT_SERVICE_PACK,
  data,
});

export const getTenantGroupService = (data) => ({
  type: actionType.GET_TENANT_GROUP_SERIVCE,
  data,
});

export const getTrunkGroupTemplates = (data) => ({
  type: actionType.GET_TRUNK_GROUP_TEMPLATES,
  data,
});

export const getTrunkGroupTemplate = (data) => ({
  type: actionType.GET_TRUNK_GROUP_TEMPLATE,
  data,
});

export const getSelfcareURL = (data) => ({
  type: actionType.GET_SELFCARE_URL,
  data,
});

export const getTimezones = (data) => ({
  type: actionType.GET_TIMEZONES,
  data,
});

export const getGlobalSearchNumbers = (data) => ({
  type: actionType.GET_GLOBAL_SEARCH_NUMBERS,
  data,
});

export const getBWKSLicenses = (data) => ({
  type: actionType.GET_BWKS_LICENSES,
  data,
});

export const getMobileNumbersForTenant = (data) => ({
  type: actionType.GET_MOBILE_NUMBERS_FOR_TENANT,
  data,
});

export const getMobileNumbersForGroup = (data) => ({
  type: actionType.GET_MOBILE_NUMBERS_FOR_GROUP,
  data,
});

export const getExistingBackends = (data) => ({
  type: actionType.GET_EXISTING_BACKENDS,
  data,
});

export const getTenantOU = (data) => ({
  type: actionType.GET_TENANT_OU,
  data,
});

export const getListOfRoutingProfiles = (data) => ({
  type: actionType.GET_LIST_OF_ROUTING_PROFILES,
  data,
});

export const getTenantRoutingProfile = (data) => ({
  type: actionType.GET_TENANT_ROUTING_PROFILE,
  data,
});

export const getTenantVoiceMessaging = (data) => ({
  type: actionType.GET_TENANT_VOICE_MESSAGING,
  data,
});

export const getTenantSuspensionStatus = (data) => ({
  type: actionType.GET_TENANT_SUSPENSION_STATUS,
  data,
});

export const getSuspensionOptions = (data) => ({
  type: actionType.GET_SUSPENSION_OPTIONS,
  data,
});

export const getGroupSuspensionStatus = (data) => ({
  type: actionType.GET_GROUP_SUSPENSION_STATUS,
  data,
});

export const getTenantPasswordRules = (data) => ({
  type: actionType.GET_TENANT_PASSWORD_RULES,
  data,
});

export const getGroupPasswordRules = (data) => ({
  type: actionType.GET_GROUP_PASSWORD_RULES,
  data,
});

export const getReportingCustomer = (data) => ({
  type: actionType.GET_REPORTING_CUSTOMER,
  data,
});

export const deleteReportingCustomerReports = (data) => ({
  type: actionType.DELETE_REPORTING_CUSTOMER,
  data,
});

export const postReportingCustomerReports = (data) => ({
  type: actionType.POST_REPORTING_CUSTOMER,
  data,
});

export const getReportingCustomerReports = (data) => ({
  type: actionType.GET_REPORTING_CUSTOMER_REPORTS,
  data,
});

export const getReportingCustomerGroupReports = (data) => ({
  type: actionType.GET_REPORTING_CUSTOMER_GROUPS_REPORTS,
  data,
});

export const getReportingCustomerReportHistory = (data) => ({
  type: actionType.GET_REPORTING_CUSTOMER_REPORT_HISTORY,
  data,
});

export const getReportingCustomerGroupReportHistory = (data) => ({
  type: actionType.GET_REPORTING_CUSTOMER_GROUP_REPORT_HISTORY,
  data,
});

export const getTenantEntitlements = (data) => ({
  type: actionType.GET_TENANT_ENTITLEMENTS,
  data,
});

export const getEntitlementTypes = (data) => ({
  type: actionType.GET_ENTITLEMENT_TYPES,
  data,
});

export const getTrunkGroupAccessInfo = (data) => ({
  type: actionType.GET_TRUNK_GROUP_ACCESS_INFO,
  data,
});

export const getAllServicePacksOfTenant = (data) => ({
  type: actionType.GET_ALL_SERVICE_PACKS_OF_TENANT,
  data,
});

export const getResellers = (data) => ({
  type: actionType.GET_RESELLERS,
  data,
});

export const getReseller = (data) => ({
  type: actionType.GET_RESELLER,
  data,
});

export const getResellerAdmins = (data) => ({
  type: actionType.GET_RESELLER_ADMINS,
  data,
});

export const getUserProfileTypes = (data) => ({
  type: actionType.GET_USER_PROFILE_TYPES,
  data,
});

export const getCallRecordingPlatforms = (data) => ({
  type: actionType.GET_CALL_RECORDING_PLATFORMS,
  data,
});

export const getUsageOfCallRecordingPlatforms = (data) => ({
  type: actionType.GET_USAGE_OF_CALL_RECORDING_PLATFORMS,
  data,
});

export const getCallRecordingProperties = (data) => ({
  type: actionType.GET_CALL_RECORDING_PROPERTIES,
  data,
});

export const getTenantOnlineCharging = (data) => ({
  type: actionType.GET_TENANT_ONLINE_CHARGING,
  data,
});

export const getDictServicePacks = (data) => ({
  type: actionType.GET_DICT_SERVICE_PACKS,
  data,
});

export const getDictUserServices = (data) => ({
  type: actionType.GET_DICT_USER_SERVICES,
  data,
});

export const getDictVirtualServicePacks = (data) => ({
  type: actionType.GET_DICT_VIRTUAL_SERVICE_PACKS,
  data,
});

export const postCreateGroupAdmin = (data) => ({
  type: actionType.POST_CREATE_GROUP_ADMIN,
  data,
});

export const postCreateGroupAdminError = (error) => ({
  type: actionType.POST_CREATE_GROUP_ADMIN_ERROR,
  error,
});

export const postCreateTenantAdmin = (data) => ({
  type: actionType.POST_CREATE_TENANT_ADMIN,
  data,
});

export const postCreateTenantAdminError = (error) => ({
  type: actionType.POST_CREATE_TENANT_ADMIN_ERROR,
  error,
});

export const postAssignUserServices = () => ({
  type: actionType.POST_ASSIGN_USER_SERVICES,
});

export const postAssignUserServicePacks = () => ({
  type: actionType.POST_ASSIGN_USER_SERVICE_PACKS,
});

export const postCreateTenant = (data) => ({
  type: actionType.POST_CREATE_TENANT,
  data,
});

export const postCreateGroup = (data) => ({
  type: actionType.POST_CREATE_GROUP,
  data,
});

export const postAddPhoneNumbersToTenant = (data) => ({
  type: actionType.POST_ADD_PHONE_NUMBERS_TO_TENANT,
  data,
});

export const postCreateUserToGroup = (data) => ({
  type: actionType.POST_CREATE_USER_TO_GROUP,
  data,
});

export const postAddGroupServicesToGroup = (data) => ({
  type: actionType.POST_ADD_GROUP_SERVICES_TO_GROUP,
  data,
});

export const postAddKeyToApplication = (data) => ({
  type: actionType.POST_ADD_KEY_TO_APPLICATION,
  data,
});

export const postCreateLocalUser = (data) => ({
  type: actionType.POST_CREATE_LOCAL_USER,
  data,
});

export const postAssignPhoneNumbersToGroup = (data) => ({
  type: actionType.POST_ASSIGN_PHONE_NUMBERS_TO_GROUP,
  data,
});

export const postCreateTrunkGroup = (data) => ({
  type: actionType.POST_CREATE_TRUNK_GROUP,
  data,
});

export const postCreateDeviceInGroup = () => ({
  type: actionType.POST_CREATE_DEVICE_IN_GROUP,
});

export const postCreateTrunkGroupUser = () => ({
  type: actionType.POST_CREATE_TRUNK_GROUP_USER,
});

export const postAddMobileNumberToTenant = (data) => ({
  type: actionType.POST_ADD_MOBILE_NUMBER_TO_TENANT,
  data,
});

export const postAddMobileNumberToGroup = (data) => ({
  type: actionType.POST_ADD_MOBILE_NUMBER_TO_GROUP,
  data,
});

export const postAddReseller = (data) => ({
  type: actionType.POST_ADD_RESELLER,
  data,
});

export const postCreateTemplate = () => ({
  type: actionType.POST_CREATE_TEMPLATE,
});

export const postAddEntitlementToTenant = () => ({
  type: actionType.POST_ADD_ENTITLEMENTS_TO_TENANT,
});

export const postAddServicePacksToTenant = () => ({
  type: actionType.POST_ADD_SERVICE_PACK_TO_TENANT,
});

export const postAddResellerAdmin = (data) => ({
  type: actionType.POST_ADD_RESELLER_ADMIN,
  data,
});

export const postAddCallRecordingPlatform = (data) => ({
  type: actionType.POST_ADD_CALL_RECORDING_PLATFORM,
  data,
});

export const putUpdateUser = (data) => ({
  type: actionType.PUT_UPDATE_USER,
  data,
});

export const putUpdateGroupDetails = (data) => ({
  type: actionType.PUT_UPDATE_GROUP_DETAILS,
  data,
});

export const putUpdateGroupAdmin = (data) => ({
  type: actionType.PUT_UPDATE_GROUP_ADMIN,
  data,
});

export const putUpdateTenantAdmin = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_ADMIN,
  data,
});

export const putUpdateTrunkByGroupId = (data) => ({
  type: actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID,
  data,
});

export const putUpdateTrunkByGroupIdError = (data) => ({
  type: actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID_ERROR,
  data,
});

export const putUpdateServicePacksByGroupId = (data) => ({
  type: actionType.PUT_UPDATE_SERVICE_PACKS_BY_GROUP_ID,
  data,
});

export const putUpdateGroupServicesByGroupId = (data) => ({
  type: actionType.PUT_UPDATE_GROUP_SERVICES_BY_GROUP_ID,
  data,
});

export const putUpdateTenantDetails = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_DETAILS,
  data,
});

export const putUpdateKey = (data) => ({
  type: actionType.PUT_UPDATE_KEY,
  data,
});

export const putUpdateTrunkGroup = (data) => ({
  type: actionType.PUT_UPDATE_TRUNK_GROUP,
  data,
});

export const putUpdateBackupByTrunkGtoup = (data) => ({
  type: actionType.PUT_UPDATE_BACKUP_BY_TRUNK_GROUP,
  data,
});

export const putUpdateLocalUser = (data) => ({
  type: actionType.PUT_UPDATE_LOCAL_USER,
  data,
});

export const putUpdateTrunkByTenantId = (data) => ({
  type: actionType.PUT_UPDATE_TRUNK_BY_TENANT_ID,
  data,
});

export const putUpdateGroupServicesByTenantId = (data) => ({
  type: actionType.PUT_UPDATE_GROUP_SERVICES_BY_TENANT_ID,
  data,
});

export const putUpdateDevice = (data) => ({
  type: actionType.PUT_UPDATE_DEVICE,
  data,
});

export const putUpdateTenantServicePacks = () => ({
  type: actionType.PUT_UPDATE_TENANT_SERVICE_PACKS,
});

export const putUpdateTemplate = (data) => ({
  type: actionType.PUT_UPDATE_TEMPLATE,
  data,
});

export const putUpdateTenantRoutingProfile = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_ROUTING_PROFILE,
  data,
});

export const putUpdateTenantVoiceMessaging = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_VOICE_MESSAGING,
  data,
});

export const putUpdateTenantSuspensionStatus = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_SUSPENSION_STATUS,
  data,
});

export const putUpdateGroupSuspensionStatus = (data) => ({
  type: actionType.PUT_UPDATE_GROUP_SUSPENSION_STATUS,
  data,
});

export const putUpdateTenantEntitlement = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_ENTITLEMENT,
  data,
});

export const putUpdateTrunkGroupAccessInfo = (data) => ({
  type: actionType.PUT_UPDATE_TRUNK_GROUP_ACCESS_INFO,
  data,
});

export const putUpdateReseller = (data) => ({
  type: actionType.PUT_UPDATE_RESELLER,
  data,
});
export const putUpdateResellerAdmin = (data) => ({
  type: actionType.PUT_UPDATE_RESELLER_ADMIN,
  data,
});

export const putUpdateCallRecordingPlatform = (data) => ({
  type: actionType.PUT_UPDATE_CALL_RECORDING_PLATFORMS,
  data,
});

export const putUpdateCallRecordingProperties = (data) => ({
  type: actionType.PUT_UPDATE_CALL_RECORDING_PROPERTIES,
  data,
});

export const putUpdateTenantOnlineCharging = (data) => ({
  type: actionType.PUT_UPDATE_TENANT_ONLINE_CHARGING,
  data,
});

export const deleteTenant = (data) => ({
  type: actionType.DELETE_TENANT,
  data,
});

export const deleteTenantAdmin = () => ({
  type: actionType.DELETE_TENANT_ADMIN,
});

export const deleteGroupDevice = () => ({
  type: actionType.DELETE_GROUP_DEVICE,
});

export const deleteGroupAdmin = () => ({
  type: actionType.DELETE_GROUP_ADMIN,
});

export const deleteAssignUserServices = () => ({
  type: actionType.DELETE_DEASSIGN_USER_SERVICES,
});

export const deleteAssignUserServicePacks = () => ({
  type: actionType.DELETE_DEASSIGN_USER_SERVICE_PACKS,
});

export const deletePhoneFromTenant = () => ({
  type: actionType.DELETE_PHONE_FROM_TENANT,
});

export const deleteUserFromGroup = () => ({
  type: actionType.DELETE_USER_FROM_GROUP,
});

export const deleteGroupFromTenant = (data) => ({
  type: actionType.DELETE_GROUP_FROM_TENANT,
  data,
});

export const deleteTrunkGroup = (data) => ({
  type: actionType.DELETE_TRUNK_GROUP,
  data,
});

export const deleteKey = (data) => ({
  type: actionType.DELETE_KEY,
  data,
});

export const deleteLocalUser = (data) => ({
  type: actionType.DELETE_LOCAL_USER,
  data,
});

export const deletePhoneFromGroup = (data) => ({
  type: actionType.DELETE_PHONE_FROM_GROUP,
  data,
});

export const deleteTrunkGroupFromTenant = () => ({
  type: actionType.DELETE_TRUNK_GROUP_FROM_TENANT,
});

export const deleteMobileNumberFromTenant = () => ({
  type: actionType.DELETE_MOBILE_NUMBER_FROM_TENANT,
});

export const deleteMobileNumberFromGroup = () => ({
  type: actionType.DELETE_MOBILE_NUMBER_FROM_GROUP,
});

export const deleteTemplate = () => ({
  type: actionType.DELETE_TEMPLATE,
});

export const deleteEntitlementFromTenant = () => ({
  type: actionType.DELETE_ENTITLEMENT_FROM_TENANT,
});

export const deleteServicePackFromTenant = () => ({
  type: actionType.DELETE_SERVICE_PACK_FROM_TENANT,
});

export const deleteReseller = () => ({
  type: actionType.DELETE_RESELLER,
});

export const deleteResellerAdmin = () => ({
  type: actionType.DELETE_RESELLER_ADMIN,
});

export const deleteCallRecordingPlatform = () => ({
  type: actionType.DELETE_CALL_RECORDING_PLATFORM,
});

export const clearErrorMassage = () => ({
  type: actionType.CLEAR_ERROR_MASSAGE,
});

export const changeStepOfCreateTenant = (data) => ({
  type: actionType.CHANGE_STEP_OF_CREATE_TENANT,
  data,
});

export const changeTypeOfTenant = (data) => ({
  type: actionType.CHANGE_TYPE_OF_TENANT,
  data,
});

export const changeIdOfTenant = (data) => ({
  type: actionType.CHANGE_ID_OF_TENANT,
  data,
});

export const changeNameOfTenant = (data) => ({
  type: actionType.CHANGE_NAME_OF_TENANT,
  data,
});

export const changeResellerIdOfTenant = (data) => ({
  type: actionType.CHANGE_RESELLER_ID_OF_TENANT,
  data,
});

export const changeAddressOfTenant = (data) => ({
  type: actionType.CHANGE_ADDRESS_OF_TENANT,
  data,
});

export const changeZIPOfTenant = (data) => ({
  type: actionType.CHANGE_ZIP_OF_TENANT,
  data,
});

export const changeCityOfTenant = (data) => ({
  type: actionType.CHANGE_CITY_OF_TENANT,
  data,
});

export const changeTemplateOfTenant = (data) => ({
  type: actionType.CHANGE_TAMPLATE_OF_TENANT,
  data,
});

export const refuseCreateTenant = () => ({
  type: actionType.REFUSE_CREATE_TENANT,
});

export const changeDomainOfTenant = (data) => ({
  type: actionType.CHANGE_DOMAIN_OF_TENANT,
  data,
});

export const changeBackendOfTenant = (data) => ({
  type: actionType.CHANGE_BACKEND_OF_TENANT,
  data,
});

export const changeDetailsOfTenant = (data) => ({
  type: actionType.CHANGE_DETAILS_OF_TENANT,
  data,
});

export const changeCustomRoutingProfileOfTenant = (data) => ({
  type: actionType.CHANGE_CUSTOM_ROUTING_PROFILE_OF_TENANT,
  data,
});

export const refuseCreateGroup = () => ({
  type: actionType.REFUSE_CREATE_GROUP,
});

export const changeIdOfGroup = (data) => ({
  type: actionType.CHANGE_ID_OF_GROUP,
  data,
});

export const changeTimeZoneOfGroup = (data) => ({
  type: actionType.CHANGE_TIME_ZONE_OF_GROUP,
  data,
});

export const changeNameOfGroup = (data) => ({
  type: actionType.CHANGE_NAME_OF_GROUP,
  data,
});

export const changeResellerIdOfGroup = (data) => ({
  type: actionType.CHANGE_RESELLER_ID_OF_GROUP,
  data,
});

export const changeDomainOfGroup = (data) => ({
  type: actionType.CHANGE_DOMAIN_OF_GROUP,
  data,
});

export const changeUserLimitOfGroup = (data) => ({
  type: actionType.CHANGE_USER_LIMIT_OF_GROUP,
  data,
});

export const changeAddressOfGroup = (data) => ({
  type: actionType.CHANGE_ADDRESS_OF_GROUP,
  data,
});

export const changeZIPOfGroup = (data) => ({
  type: actionType.CHANGE_ZIP_OF_GROUP,
  data,
});

export const changeCityOfGroup = (data) => ({
  type: actionType.CHANGE_CITY_OF_GROUP,
  data,
});

export const changeStepOfCreateGroup = (data) => ({
  type: actionType.CHANGE_STEP_OF_CREATE_GROUP,
  data,
});

export const changeTemplateOfGroup = (data) => ({
  type: actionType.CHANGE_TAMPLATE_OF_GROUP,
  data,
});

export const changeStepOfAddPhoneTenant = (data) => ({
  type: actionType.CHANGE_STEP_OF_ADD_PHONE_TENANT,
  data,
});

export const refuseAddPhoneToTenant = () => ({
  type: actionType.REFUSE_ADD_PHONE_TO_TENANT,
});

export const saveValidatedNumbersTenant = (data) => ({
  type: actionType.SAVE_VALIDATED_NUMBERS_TENANT,
  data,
});

export const removeSuccesfulValidPhoneTenant = (data) => ({
  type: actionType.REMOVE_SUCCESFUL_VALID_PHONE_TENANT,
  data,
});

export const trunkNotAuthorisedTenant = () => ({
  type: actionType.TRUNK_NOT_AUTHORISED_TENANT,
});

export const showHideAdditionalServicesTenant = (data) => ({
  type: actionType.SHOW_HIDE_ADDITIONAL_SERVICES_TENANT,
  data,
});

export const showHideAdditionalUserServicesTenant = (data) => ({
  type: actionType.SHOW_HIDE_ADDITIONAL_USER_SERVICES_TENANT,
  data,
});

export const showHideAdditionalUserServicesGroup = (data) => ({
  type: actionType.SHOW_HIDE_ADDITIONAL_USER_SERVICES_GROUP,
  data,
});

export const showHideAdditionalServiceGroup = (data) => ({
  type: actionType.SHOW_HIDE_ADDITIONAL_SERVICES_GROUP,
  data,
});

export const trunkNotAuthorisedGroup = () => ({
  type: actionType.TRUNK_NOT_AUTHORISED_GROUP,
});

export const clearSearchNumber = () => ({
  type: actionType.CLEAR_SEARCH_NUMBER,
});

export const disableTenantSuspensionStatusButton = () => ({
  type: actionType.DISABLE_TENANT_SUSPESION_STATUS_BUTTON,
});

export const disableGroupSuspensionStatusButton = () => ({
  type: actionType.DISABLE_GROUP_SUSPESION_STATUS_BUTTON,
});

export function fetchGetTenants(cancelLoad, queryString) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${queryString || ""}`
    )
      .then((data) => !cancelLoad && dispatch(getTenants(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenants-failed"
            defaultMessage="Failed to fetch tenants!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTenantById(Id) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}`
    )
      .then((data) => dispatch(getTenantById(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenant-failed"
            defaultMessage="Failed to fetch tenant details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetGroupsByTenantId(Id) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/groups`
    )
      .then((data) => dispatch(getGroupsByTenantId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-groups-failed"
            defaultMessage="Failed to fetch groups!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetPhoneNumbersByTenantId(Id) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/numbers`
    )
      .then((data) => dispatch(getPhoneNumbersByTenantId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-numbers-failed"
            defaultMessage="Failed to fetch phone numbers!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetAdminsByTenantId(Id) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${Id}/admins`
    )
      .then((data) => dispatch(getAdminsByTenantId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-admins-failed"
            defaultMessage="Failed to fetch admins!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetGroupById(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}`
    )
      .then((data) => dispatch(getGroupById(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-group-failed"
            defaultMessage="Failed to fetch group details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetUsersByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users`
    )
      .then((data) => dispatch(getUsersByGroupId(data)))
      .catch((error) => {
        dispatch(getUsersByGroupId({ users: [] }));
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-users-failed"
            defaultMessage="Failed to fetch users!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetPhoneNumbersByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?assignement=true`
    )
      .then((data) => dispatch(getPhoneNumbersByGroupId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-numbers-failed"
            defaultMessage="Failed to fetch phone numbers!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetLicensesByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses`
    )
      .then((data) => dispatch(getLicensesByGroupId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-licenses-failed"
            defaultMessage="Failed to fetch licenses!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetDevicesByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices`
    )
      .then((data) => dispatch(getDevicesByGroupId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-devices-failed"
            defaultMessage="Failed to fetch devices!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetAdminsByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins`
    )
      .then((data) => dispatch(getAdminsByGroupId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-group-admins-failed"
            defaultMessage="Failed to fetch group admins!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetUserByName(tenantId, groupId, userName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}`
    )
      .then((data) => dispatch(getUserByName(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-user-failed"
            defaultMessage="Failed to fetch user details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTrunkByGroupID(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/features/trunk_groups`
    )
      .then((data) => dispatch(getTrunkByGroupID(data)))
      .catch((error) => {
        error.response.status === 404
          ? dispatch(getTrunksGroupsByGroupFail())
          : NotificationsManager.error(
              <FormattedMessage
                id="fetch-trunk-failed"
                defaultMessage="Failed to fetch trunk!"
              />,
              error.message
            );
      });
  };
}

export function fetchGetAvailableNumbersByGroupId(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers?available=true`
    )
      .then((data) => dispatch(getAvailableNumbersByGroupID(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-avail-numbers-failed"
            defaultMessage="Failed to fetch available numbers!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetGroupAdminByAdminId(tenantId, groupId, adminId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`
    )
      .then((data) => dispatch(getGroupAdminByAdminId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-admin-failed"
            defaultMessage="Failed to fetch admin details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTenantAdminByAdminId(tenantId, adminId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}`
    )
      .then((data) => dispatch(getTenantAdminByAdminId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-admin-failed"
            defaultMessage="Failed to fetch admin details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetUserServicesByUserId(tenantId, groupId, userId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userId}/services?assignementStatus=true&summary=true`
    )
      .then((data) => dispatch(getUserServicesByUserId(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-user-services-failed"
            defaultMessage="Failed to fetch user services!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTamplatesOfTenant() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/tenant/`
    )
      .then((data) => dispatch(getTamplatesOfTenant(data)))
      .catch((error) =>
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

export function fetchGetAccessDeviceByName(tenantId, groupId, deviceName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`
    )
      .then((data) => dispatch(getAccessDeviceByName(data)))
      .catch((error) =>
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

export function fetchGetTamplatesOfGroup() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/group/`
    )
      .then((data) => dispatch(getTamplatesOfGroup(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenant-templates-failed"
            defaultMessage="Failed to fetch tenant templates!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetCategoriesOfTemplate() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/`
    )
      .then((data) => dispatch(getCategoriesOfTemplate(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-categories-of-tamplates-failed"
            defaultMessage="Failed to fetch categories of templates!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetCategoryByName(category) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/${category}`
    )
      .then((data) => dispatch(getCategoryByName(data)))
      .catch((error) => {
        getCategoryByName({ templates: [] });
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-category-failed"
            defaultMessage="Failed to fetch category!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTrunkGroupByName(tenantId, groupId, trunkGroupName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupName}/`
    )
      .then((data) => dispatch(getTrunkGroupByName(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-group-failed"
            defaultMessage="Failed to fetch trunk group!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetUsersByTrunkGroup(tenantId, groupId, trunkGroupName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_users/${trunkGroupName}/`
    )
      .then((data) => dispatch(getUsersByTrunkGroup(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-users-failed"
            defaultMessage="Failed to fetch users!"
          />,
          error.message
        )
      );
  };
}
/////////
export function fetchGetTrunksGroupsByGroup(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/`
    )
      .then((data) => dispatch(getTrunksGroupsByGroup(data)))
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          dispatch(trunkNotAuthorisedGroup());
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-groups-failed"
            defaultMessage="Failed to fetch trunk groups!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetBackupByTrunkGroup(tenantId, groupId, trunkGroupName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupName}/backup`
    )
      .then((data) => dispatch(getBackupByTrunkGroup(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-backup-by-trunk-groups-failed"
            defaultMessage="Failed to fetch backup!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTemplateDetails(category, template) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/${category}/templates/${template}`
    )
      .then((data) => dispatch(getTemplateDetails(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-template-details-failed"
            defaultMessage="Failed to fetch template details!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetPhoneTypes() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/phone_types/`
    )
      .then((data) => dispatch(getPhoneTypes(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-phone-types-failed"
            defaultMessage="Failed to fetch phone types!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetPhoneTypesDetails(name) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/phone_types/${name}`
    )
      .then((data) => dispatch(getPhoneTypesDetails(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-phone-types-failed"
            defaultMessage="Failed to fetch phone types!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetApplications() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/`
    )
      .then((data) => dispatch(getApplications(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-applications-failed"
            defaultMessage="Failed to fetch applications!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetKeysByApplication(appName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${appName}`
    )
      .then((data) => dispatch(getKeysByApplication(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-applications-keys-failed"
            defaultMessage="Failed to fetch applications keys!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetValueOfKey(appName, keyName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${appName}/${keyName}`
    )
      .then((data) => dispatch(getValueOfKey(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-key-value-failed"
            defaultMessage="Failed to fetch key value!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetSearchUsers(data) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/search/users?${data}`
    )
      .then((data) => dispatch(getSearchUsers(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="search-users-failed"
            defaultMessage="Failed to search users!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetSearchGroups(data) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/search/groups?${data}`
    )
      .then((data) => dispatch(getSearchGroups(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="search-groups-failed"
            defaultMessage="Failed to search groups!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetAvailableNumbersByTenantID(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/numbers?available=true`
    )
      .then((data) => dispatch(getAvailableNumbersByTenantID(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-phone-numbers-failed"
            defaultMessage="Failed to fetch phone numbers!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetLanguages() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/languages`
    )
      .then((data) => dispatch(getLanguages(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-languages-failed"
            defaultMessage="Failed to fetch languages!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTenantLicenses(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/licenses?includeServicePacks=true`
    )
      .then((data) => dispatch(getTenantLicenses(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-licenses-failed"
            defaultMessage="Failed to fetch licenses!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTrunkByTenantID(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/features/trunk_groups/`
    )
      .then((data) => dispatch(getTrunkByTenantID(data)))
      .catch((error) => {
        if (error.response.status === 404) {
          dispatch(trunkNotAuthorisedTenant());
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-failed"
            defaultMessage="Failed to fetch trunks!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetDevice(tenantId, groupId, deviceName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`
    )
      .then((data) => dispatch(getDevice(data)))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-device-failed"
            defaultMessage="Failed to fetch device!"
          />,
          error.message
        )
      );
  };
}

export function fetchGetTrunkGroupByTenant(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/services/trunk_groups/`
    )
      .then((data) => dispatch(getTrunkGroupByTenant(data)))
      .catch((error) => {
        if (error.response.status === 404) {
          dispatch(trunkNotAuthorisedTenant());
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-groups-failed"
            defaultMessage="Failed to fetch trunk groups!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantServicePack(tenantId, servicePackName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/service_packs/${servicePackName}/`
    )
      .then((data) => dispatch(getTenantServicePack(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-service-pack-failed"
            defaultMessage="Failed to fetch service pack!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantGroupService(tenantId, groupServiceName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/licenses/`
    )
      .then((data) =>
        dispatch(getTenantGroupService({ ...data, groupServiceName }))
      )
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-group-service-failed"
            defaultMessage="Failed to fetch group service!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTrunkGroupTemplates() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/trunk_group/`
    )
      .then((data) => dispatch(getTrunkGroupTemplates(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-group-templates-failed"
            defaultMessage="Failed to fetch trunk group templates!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTrunkGroupTemplate(trunkGroupName) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/trunk_group/templates/${trunkGroupName}`
    )
      .then((data) => dispatch(getTrunkGroupTemplate(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-trunk-group-template-failed"
            defaultMessage="Failed to fetch trunk group template!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetSelfcareURL() {
  //GET config
  const prefixArray = ProvProxiesManager.getCurrentUrlPrefix().split("/");
  const proxy = prefixArray[prefixArray.length - 1];
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${proxy}/config`
    )
      .then((data) => dispatch(getSelfcareURL(data)))
      .catch((err) => {
        console.error(err.message);
        return fetch_get(
          `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/prov_gui/config`
        )
          .then((data) => dispatch(getSelfcareURL(data)))
          .catch((error) => {
            console.error(error.message);
          });
      });
  };
}

export function fetchGetTimezones() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/timezones`
    )
      .then((data) => dispatch(getTimezones(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-timezones-failed"
            defaultMessage="Failed to fetch timezones!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetGlobalSearchNumbers(number) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/search/numbers/usages/${number}`
    )
      .then((data) => dispatch(getGlobalSearchNumbers(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-number-failed"
            defaultMessage="Failed to search number!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetBWKSLicenses() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/licensing/`
    )
      .then((data) => dispatch(getBWKSLicenses(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-bwks-licenses-failed"
            defaultMessage="Failed to fetch bwks licenses!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetMobileNumbersForTenant(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/mobile_numbers?available=true&assignement=true`
    )
      .then((data) => dispatch(getMobileNumbersForTenant(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-numbers-failed"
            defaultMessage="Failed to fetch numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetMobileNumbersForGroup(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/mobile_numbers?available=true&assignement=true`
    )
      .then((data) => dispatch(getMobileNumbersForGroup(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-numbers-failed"
            defaultMessage="Failed to fetch numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetExistingBackends() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/ldap/backends/`
    )
      .then((data) => dispatch(getExistingBackends(data)))
      .catch((error) => {
        console.error(error);
      });
  };
}

export function fetchGetTenantOU(backend) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/ldap/${backend}/tenants?custom_filter=not_in_bwks`
    )
      .then((data) => dispatch(getTenantOU(data)))
      .catch((error) => {
        const data = {
          tenants: [],
        };
        dispatch(getTenantOU(data));
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-tenant-ou-failed"
            defaultMessage="Failed to fetch tenant OU!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetListOfRoutingProfiles() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/routing_profiles/`
    )
      .then((data) => dispatch(getListOfRoutingProfiles(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-routing-profiles-failed"
            defaultMessage="Failed to fetch routing profiles"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantRoutingProfile(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/routing_profile/`
    )
      .then((data) => dispatch(getTenantRoutingProfile(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-routing-profile-failed"
            defaultMessage="Failed to fetch routing profile"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantSuspensionStatus(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/properties/suspension/`
    )
      .then((data) => dispatch(getTenantSuspensionStatus(data)))
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          dispatch(disableTenantSuspensionStatusButton());
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-suspension-status-failed"
            defaultMessage="Failed to fetch suspension status"
          />,
          error.message
        );
      });
  };
}

export function fetchGetSuspensionOptions() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/group_intercept`
    )
      .then((data) => dispatch(getSuspensionOptions(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-suspension-options-failed"
            defaultMessage="Failed to fetch suspension options"
          />,
          error.message
        );
      });
  };
}

export function fetchGetGroupSuspensionStatus(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/properties/suspension/`
    )
      .then((data) => dispatch(getGroupSuspensionStatus(data)))
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          dispatch(disableGroupSuspensionStatusButton());
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-suspension-status-failed"
            defaultMessage="Failed to fetch suspension status"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantVoiceMessaging(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/services/voice_messaging/`
    )
      .then((data) => dispatch(getTenantVoiceMessaging(data)))
      .catch((error) => {
        if (error.response.status === 404) {
          dispatch(getTenantVoiceMessaging({}));
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-voice-messaging-failed"
            defaultMessage="Failed to fetch voice-messaging"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantPasswordRules(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/password_rules/`
    )
      .then((data) => dispatch(getTenantPasswordRules(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-password-rules-failed"
            defaultMessage="Failed to fetch password rules"
          />,
          error.message
        );
      });
  };
}

export function fetchGetGroupPasswordRules(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/password_rules/`
    )
      .then((data) => dispatch(getGroupPasswordRules(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-password-rules-failed"
            defaultMessage="Failed to fetch password rules"
          />,
          error.message
        );
      });
  };
}

export function fetchGetReportingCustomer(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `/api/v01/custom/reporting/customers/${tenantId}`
    )
    .then((data) => dispatch(getReportingCustomer(data)))
    .catch((error) => {
      if (error.response?.status === 404) {
        dispatch(getReportingCustomer(null));
        return;
      }
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-entitlements-failed"
          defaultMessage="Failed to fetch reporting details"
        />,
        error.message
      );
    });
  }
}

export function fetchDisableReportingCustomer(tenantId) {
  return function(dispatch) {
    return fetch_delete(
      `/api/v01/custom/reporting/customers/${tenantId}`
    )
    .then((data) => dispatch(deleteReportingCustomerReports(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-disable-reporting-failed"
          defaultMessage="Failed to disable reports"
        />,
        error.message
      );
    });
  }
}

export function fetchEnableReportingCustomer(tenantId) {
  return function(dispatch) {
    return fetch_post(
      "/api/v01/custom/reporting/customers",
      {name: tenantId},
    )
    .then((data) => dispatch(postReportingCustomerReports(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-enable-reporting-failed"
          defaultMessage="Failed to enable reports"
        />,
        error.message
      );
    });
  }
}

export function fetchGetReportingCustomerReports(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/analytics/reporting/reports`,
    )
    .then((data) => dispatch(getReportingCustomerReports(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-entitlements-failed"
          defaultMessage="Failed to fetch reports"
        />,
        error.message
      );
    });
  }
}

export function fetchGetReportingCustomerGroupReports(tenantId, groupId) {
  return function(dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/analytics/reporting/reports`
    )
    .then((data) => dispatch(getReportingCustomerGroupReports(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-entitlements-failed"
          defaultMessage="Failed to fetch reports"
        />,
        error.message
      );
    });
  }
}

export function fetchGetReportingCustomerReportHistory(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/analytics/reporting/report_history`
    )
    .then((data) => dispatch(getReportingCustomerReportHistory(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-entitlements-failed"
          defaultMessage="Failed to fetch report history"
        />,
        error.message
      );
    });
  }
}

export function fetchGetReportingCustomerGroupReportHistory(tenantId, groupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/analytics/reporting/report_history`
    )
    .then((data) => dispatch(getReportingCustomerGroupReportHistory(data)))
    .catch((error) => {
      NotificationsManager.error(
        <FormattedMessage
          id="fetch-entitlements-failed"
          defaultMessage="Failed to fetch report history"
        />,
        error.message
      );
    });
  }
}

export function fetchGetTenantEntitlements(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/number_inventory/entitlements/`
    )
      .then((data) => dispatch(getTenantEntitlements(data)))
      .catch((error) => {
        console.log(error.response);
        if (error.response.status === 404) {
          dispatch(getTenantEntitlements({ entitlements: [] }));
          return;
        }
        dispatch(getTenantEntitlements({ entitlements: [] }));
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-entitlements-failed"
            defaultMessage="Failed to fetch entitlements"
          />,
          error.message
        );
      });
  };
}

export function fetchGetEntitlementTypes() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/number_inventory/entitlement_types/`
    )
      .then((data) => dispatch(getEntitlementTypes(data)))
      .catch((error) => {
        //dispatch(getTenantEntitlements({ entitlements: [] }));
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-entitlement-types-failed"
            defaultMessage="Failed to fetch entitlement types"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTrunkGroupAccessInfo(tenantId, groupId, trunkGroupId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupId}/access_info/`
    )
      .then((data) => dispatch(getTrunkGroupAccessInfo(data)))
      .catch((error) => {
        if (error.response.status === 404) {
          dispatch(getTrunkGroupAccessInfo({}));
        } else {
          dispatch(getTrunkGroupAccessInfo({}));
          NotificationsManager.error(
            <FormattedMessage
              id="fetch-trunk-group-access-info-failed"
              defaultMessage="Failed to fetch trunkg group access info"
            />,
            error.message
          );
        }
      });
  };
}

export function fetchGetAllServicePacksOfTenant() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/service_packs/`
    )
      .then((data) => dispatch(getAllServicePacksOfTenant(data)))
      .catch((error) => {
        dispatch(getAllServicePacksOfTenant({ service_packs: [] }));
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-service-packs-failed"
            defaultMessage="Failed to fetch service packs"
          />,
          error.message
        );
      });
  };
}

export function fetchGetResellers() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/`
    )
      .then((data) => dispatch(getResellers(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-resellers-failed"
            defaultMessage="Failed to fetch resellers"
          />,
          error.message
        );
      });
  };
}

export function fetchGetCallRecordingPlatforms() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/platforms/`
    )
      .then((data) => dispatch(getCallRecordingPlatforms(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-bwks-licenses-failed"
            defaultMessage="Failed to fetch call recording platforms!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetReseller(name) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${name}/`
    )
      .then((data) => dispatch(getReseller(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-reseller-failed"
            defaultMessage="Failed to fetch reseller"
          />,
          error.message
        );
      });
  };
}

export function fetchGetUsageOfCallRecordingPlatforms(name) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/platforms/${name}/usage/`
    )
      .then((data) => dispatch(getUsageOfCallRecordingPlatforms(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-bwks-licenses-failed"
            defaultMessage="Failed to fetch usage of call recording platforms!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetResellerAdmins(name) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${name}/admins/`
    )
      .then((data) => dispatch(getResellerAdmins(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-reseller-admins-failed"
            defaultMessage="Failed to fetch reseller admins"
          />,
          error.message
        );
      });
  };
}

export function fetchGetCallRecordingProperties() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/properties/`
    )
      .then((data) => dispatch(getCallRecordingProperties(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-bwks-licenses-failed"
            defaultMessage="Failed to fetch call recording properties!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetUserProfileTypes({ queryString = "" }) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/config/userprofiletypes/${queryString}`
    )
      .then((data) => dispatch(getUserProfileTypes(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-user-profile-types-failed"
            defaultMessage="Failed to fetch user profile types"
          />,
          error.message
        );
      });
  };
}

export function fetchGetTenantOnlineCharging(tenantId) {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/properties/online_charging/`
    )
      .then((data) => dispatch(getTenantOnlineCharging(data)))
      .catch((error) => {
        if (error.response.status === 404) {
          dispatch(
            getTenantOnlineCharging({
              doPost: true,
              enabled: false,
              spendingLimit: "",
            })
          );
          return;
        }
        NotificationsManager.error(
          <FormattedMessage
            id="fetch-bwks-licenses-failed"
            defaultMessage="Failed to fetch online charging!"
          />,
          error.message
        );
      });
  };
}

export function fetchGetDictServicePacks() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/service_packs/`
    )
      .then((data) => dispatch(getDictServicePacks(data)))
      .catch((error) => {
        // NotificationsManager.error(
        //   <FormattedMessage
        //     id="fetch-bwks-licenses-failed"
        //     defaultMessage="Failed to fetch dict service pack!"
        //   />,
        //   error.message
        // );
      });
  };
}

export function fetchGetDictUserServices() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/user_services/`
    )
      .then((data) => dispatch(getDictUserServices(data)))
      .catch((error) => {
        // NotificationsManager.error(
        //   <FormattedMessage
        //     id="fetch-bwks-licenses-failed"
        //     defaultMessage="Failed to fetch dict user services!"
        //   />,
        //   error.message
        // );
      });
  };
}

export function fetchGetDictVirtualServicePacks() {
  return function (dispatch) {
    return fetch_get(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/virtual_service_packs/`
    )
      .then((data) => dispatch(getDictVirtualServicePacks(data)))
      .catch((error) => {
        // NotificationsManager.error(
        //   <FormattedMessage
        //     id="fetch-bwks-licenses-failed"
        //     defaultMessage="Failed to fetch dict user services!"
        //   />,
        //   error.message
        // );
      });
  };
}

export function fetchPostCreateGroupAdmin(tenantId, groupId, data, callback) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => {
        dispatch(postCreateGroupAdmin(data));
        callback && callback();
      })
      .catch((error) => {
        callback && callback();
        if (error.response && error.response.status === 400) {
          return dispatch(postCreateGroupAdminError(error));
        } else {
          NotificationsManager.error(
            <FormattedMessage
              id="create-group-admin-failed"
              defaultMessage="Failed to create group admin!"
            />,
            error.message
          );
        }
      });
  };
}

export function fetchPostCreateTenantAdmin(tenantId, data, callback) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => {
        dispatch(postCreateTenantAdmin(data));
        callback && callback();
      })
      .catch((error) => {
        callback && callback();
        if (error.response && error.response.status === 400) {
          return dispatch(postCreateTenantAdminError(error));
        } else {
          NotificationsManager.error(
            <FormattedMessage
              id="create-group-admin-failed"
              defaultMessage="Failed to create group admin!"
            />,
            error.message
          );
        }
      });
  };
}

export function fetchPostAssignUserServices(tenantId, groupId, userName, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => dispatch(postAssignUserServices(data)))
      .catch((error) => {
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
  data
) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => dispatch(postAssignUserServicePacks(data)))
      .catch((error) => {
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

export function fetchPostCreateTenant(data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => dispatch(postCreateTenant(data)))
      .catch((error) => {
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

export function fetchPostCreateGroup(tenantId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/`,
      data
    )
      .then((res) => res.json())
      .then((data) => dispatch(postCreateGroup(data)))
      .catch((error) => {
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

export function fetchPostAddPhoneNumbersToTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(postAddPhoneNumbersToTenant(data));
        return "success";
      })
      .catch((error) => {
        if (error.response.status === 400 && error.body.result) {
          dispatch(postAssignPhoneNumbersToGroup(error.body));
          return "success";
        }
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-phone-numbers"
            defaultMessage="Failed to add phone numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddMobileNumbersToTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/mobile_numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => dispatch(postAddMobileNumberToTenant(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-phone-numbers"
            defaultMessage="Failed to add phone numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddMobileNumbersToGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/mobile_numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => dispatch(postAddMobileNumberToGroup(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-phone-numbers"
            defaultMessage="Failed to add phone numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostCreateUserToGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(postCreateUserToGroup(data));
        console.log(121);
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-create-user"
            defaultMessage="Failed create user!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddGroupServicesToGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/`,
      data
    )
      .then((res) => res.json())
      .then((data) => dispatch(postAddGroupServicesToGroup(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-add-group-services"
            defaultMessage="Failed add group services!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddKeyToApplication(appName, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${appName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => dispatch(postAddKeyToApplication(data)))
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-add-key"
            defaultMessage="Failed add key!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAssignPhoneNumbersToGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(postAssignPhoneNumbersToGroup(data));
        return "success";
      })
      .catch((error) => {
        if (error.response.status === 400 && error.body.result) {
          dispatch(postAssignPhoneNumbersToGroup(error.body));
          return "success";
        }
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-phone-numbers"
            defaultMessage="Failed to add phone numbers!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostCreateTrunkGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(postCreateTrunkGroup(data));
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-trunk-group"
            defaultMessage="Failed to create trunk group!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostDeviceInGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(postCreateDeviceInGroup());
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-trunk-group"
            defaultMessage="Failed to create trunk group!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostCreateTrunkGroupUser(
  tenantId,
  groupId,
  trunkGroupId,
  data
) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupId}/numbers/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postCreateTrunkGroupUser());
        NotificationsManager.success(
          <FormattedMessage
            id="trunk-group-user-successfully-created"
            defaultMessage="Trunk group user successfully created"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-trunk-group-user"
            defaultMessage="Failed to create trunk group user!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostCreateTemplate(category, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/${category}/templates/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postCreateTemplate());
        NotificationsManager.success(
          <FormattedMessage
            id="template-successfully-created"
            defaultMessage="Template successfully created"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-create-template"
            defaultMessage="Failed to create template!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddEntitlementToTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/number_inventory/entitlements/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postAddEntitlementToTenant());
        NotificationsManager.success(
          <FormattedMessage
            id="Entitlements-successfully-added"
            defaultMessage="Entitlements successfully added"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-entitlements"
            defaultMessage="Failed to add entitlements!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddServicePacksToTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/service_packs/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postAddServicePacksToTenant());
        NotificationsManager.success(
          <FormattedMessage
            id="Service-packs-successfully-added"
            defaultMessage="Service packs successfully added"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-service-packs"
            defaultMessage="Failed to add service packs!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddCallRecordingPlatform(data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/platforms/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postAddCallRecordingPlatform());
        NotificationsManager.success(
          <FormattedMessage
            id="Service-packs-successfully-added"
            defaultMessage="Call recording platform successfully added"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-service-packs"
            defaultMessage="Failed to add call recording platform!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddReseller(data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postAddReseller());
        NotificationsManager.success(
          <FormattedMessage
            id="Reseller-successfully-added"
            defaultMessage="Reseller successfully added"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-reseller"
            defaultMessage="Failed to add reseller!"
          />,
          error.message
        );
      });
  };
}

export function fetchPostAddResellerAdmin(resellerName, data) {
  return function (dispatch) {
    return fetch_post(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${resellerName}/admins/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(postAddResellerAdmin());
        NotificationsManager.success(
          <FormattedMessage
            id="Reseller-admin-successfully-added"
            defaultMessage="Reseller admin successfully added"
          />,
          "Created"
        );
        return "success";
      })
      .catch((error) => {
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-add-reseller-admin"
            defaultMessage="Failed to add reseller admin!"
          />,
          error.message
        );
      });
  };
}

export function fetchPutUpdateUser(tenantId, groupId, userName, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateUser(data));
        NotificationsManager.success(
          <FormattedMessage
            id="user-successfully-updated"
            defaultMessage="User successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-user-failed"
            defaultMessage="Failed to update user!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupDetails(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateGroupDetails(data));
        NotificationsManager.success(
          <FormattedMessage
            id="group-successfully-updated"
            defaultMessage="Group successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-group-failed"
            defaultMessage="Failed to update group details!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupAdmin(tenantId, groupId, adminId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateGroupAdmin(data));
        NotificationsManager.success(
          <FormattedMessage
            id="group-admin-successfully-updated"
            defaultMessage="Group admin successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-group-admin-failed"
            defaultMessage="Failed to update group admin!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantAdmin(tenantId, adminId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTenantAdmin(data));
        NotificationsManager.success(
          <FormattedMessage
            id="tenant-admin-successfully-updated"
            defaultMessage="Tenant admin successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-tenant-admin-failed"
            defaultMessage="Failed to update tenant admin!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTrunkByGroupId(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/features/trunk_groups/`,
      data
    )
      .then((resp) => resp.json())
      .then((data) => {
        dispatch(putUpdateTrunkByGroupId(data));
        NotificationsManager.success(
          <FormattedMessage
            id="trunk-group-successfully-updated"
            defaultMessage="Trunk group successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          NotificationsManager.error(
            <FormattedMessage
              id="update-trunk-failed"
              defaultMessage="Failed to update trunk!"
            />,
            error.errors[0].details.errors["0"].summary
          );
        } else {
          NotificationsManager.error(
            <FormattedMessage
              id="update-trunk-failed"
              defaultMessage="Failed to update trunk!"
            />,
            error.message
          );
        }
      });
  };
}

export function fetchPutUpdateServicePacksByGroupId(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateServicePacksByGroupId(data));
        NotificationsManager.success(
          <FormattedMessage
            id="service-packs-successfully-updated"
            defaultMessage="Service packs successfully updated"
          />,
          "Updated"
        );
        return "updated";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-service-packs-failed"
            defaultMessage="Failed to update service packs!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupServicesByGroupId(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/licenses/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateGroupServicesByGroupId(data));
        NotificationsManager.success(
          <FormattedMessage
            id="services-successfully-updated"
            defaultMessage="Services successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-services-failed"
            defaultMessage="Failed to update services!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantDetails(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTenantDetails(data));
        NotificationsManager.success(
          <FormattedMessage
            id="update-tenant-details-success"
            defaultMessage="Tenant successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
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

export function fetchPutUpdateKey(appName, keyName, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${appName}/${keyName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateKey(data));
        NotificationsManager.success(
          <FormattedMessage
            id="config-successfully-updated"
            defaultMessage="Config successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-kay-failed"
            defaultMessage="Failed to update key!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateBackupByTrunkGtoup(
  tenantId,
  groupId,
  trunkGroupName,
  data
) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupName}/backup`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        NotificationsManager.success(
          <FormattedMessage
            id="successfulUpdateGroupBackupUpdate"
            defaultMessage="Successful backup update"
          />,
          "Updated"
        );
        dispatch(putUpdateBackupByTrunkGtoup(data));
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-trunk-group-backup-failed"
            defaultMessage="Failed to update trunk group backup!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTrunkGroup(
  tenantId,
  groupId,
  trunkGroupName,
  data
) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        NotificationsManager.success(
          <FormattedMessage
            id="successfulTrunkGroupUpdate"
            defaultMessage="Successful trunk group update"
          />,
          "Updated"
        );
        dispatch(putUpdateTrunkGroup(data));
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-trunk-group-failed"
            defaultMessage="Failed to update trunk group!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTrunkByTenantId(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/features/trunk_groups/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTrunkByTenantId(data));
        NotificationsManager.success(
          <FormattedMessage
            id="trunk-successfully-updated"
            defaultMessage="Trunk successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-trunk-failed"
            defaultMessage="Failed to update trunk!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupServicesByTenantId(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/licenses/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateGroupServicesByTenantId(data));
        NotificationsManager.success(
          <FormattedMessage
            id="group-services-successfully-updated"
            defaultMessage="Services successfully updated"
          />,
          "Updated"
        );
        return "updated";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-group-services-failed"
            defaultMessage="Failed to update services!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateDevice(tenantId, groupId, deviceName, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateDevice(data));
        NotificationsManager.success(
          <FormattedMessage
            id="update-device-success"
            defaultMessage="Device is updated successfully!"
          />,
          "Updated"
        );
        return "success";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-device-failed"
            defaultMessage="Failed to update device!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantServicePacks(tenantId, servicePack, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/service_packs/${servicePack}/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateTenantServicePacks());
        NotificationsManager.success(
          <FormattedMessage
            id="service-packs-successfully-updated"
            defaultMessage="Service packs successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-service-packs-failed"
            defaultMessage="Failed to update service packs!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTemplate(instanceName, templateName, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/${instanceName}/templates/${templateName}/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTemplate(data));
        NotificationsManager.success(
          <FormattedMessage
            id="template-successfully-updated"
            defaultMessage="Template successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-template-failed"
            defaultMessage="Failed to update template!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantRoutingProfile(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/routing_profile/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTenantRoutingProfile(data));
        NotificationsManager.success(
          <FormattedMessage
            id="routing-profile-successfully-updated"
            defaultMessage="Routing profile successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="update-routing-profile-failed"
            defaultMessage="Failed to update routing profile!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantVoiceMessaging(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/services/voice_messaging/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTenantVoiceMessaging(data));
        NotificationsManager.success(
          <FormattedMessage
            id="voice-messaging-successfully-updated"
            defaultMessage="Voice messaging successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="voice-messaging-profile-failed"
            defaultMessage="Failed to update voice messaging!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantSuspensionStatus(tenantId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/properties/suspension/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateTenantVoiceMessaging(data));
        NotificationsManager.success(
          <FormattedMessage
            id="suspension-status-successfully-updated"
            defaultMessage="Suspension status successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="suspension-status-profile-failed"
            defaultMessage="Failed to update suspension status!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateGroupSuspensionStatus(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/properties/suspension/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(putUpdateGroupSuspensionStatus(data));
        NotificationsManager.success(
          <FormattedMessage
            id="suspension-status-successfully-updated"
            defaultMessage="Suspension status successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="suspension-status-profile-failed"
            defaultMessage="Failed to update suspension status!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantEntitlements(
  tenantId,
  entitlementId,
  data
) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/number_inventory/entitlements/${entitlementId}`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateTenantEntitlement());
        NotificationsManager.success(
          <FormattedMessage
            id="Entitlement-successfully-updated"
            defaultMessage="Entitlement successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="entitlement-update-failed"
            defaultMessage="Failed to update entitlement!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTrunkGroupAccessInfo(
  tenantId,
  groupId,
  trunkGroupId,
  data
) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkGroupId}/access_info/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateTrunkGroupAccessInfo());
        NotificationsManager.success(
          <FormattedMessage
            id="trunk-group-access-info-successfully-updated"
            defaultMessage="Trunk group access info successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="trunk-group-access-info-update-failed"
            defaultMessage="Failed to update trunk group access info!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateCallRecordingPlatform({ name, data }) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/platforms/${name}/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateCallRecordingPlatform());
        NotificationsManager.success(
          <FormattedMessage
            id="Entitlement-successfully-updated"
            defaultMessage="Call recording platform successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="entitlement-update-failed"
            defaultMessage="Failed to update call recording platform!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateReseller(name, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${name}/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateReseller());
        NotificationsManager.success(
          <FormattedMessage
            id="reseller-successfully-updated"
            defaultMessage="Reseller successfully updated"
          />,
          "Updated"
        );
        return "success";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="reseller-update-failed"
            defaultMessage="Failed to update reseller!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateCallRecordingProperties({ data }) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/properties/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateCallRecordingProperties());
        NotificationsManager.success(
          <FormattedMessage
            id="Entitlement-successfully-updated"
            defaultMessage="Call recording properties successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="entitlement-update-failed"
            defaultMessage="Failed to update call recording properties!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateResellerAdmin(resellerName, adminName, data) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${resellerName}/admins/${adminName}`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateResellerAdmin());
        NotificationsManager.success(
          <FormattedMessage
            id="reseller-admin-successfully-updated"
            defaultMessage="Reseller admin successfully updated"
          />,
          "Updated"
        );
        return "success";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="reseller-admin-update-failed"
            defaultMessage="Failed to update reseller admin!"
          />,
          error.message
        )
      );
  };
}

export function fetchPutUpdateTenantOnlineCharging({ tenantId, data }) {
  return function (dispatch) {
    return fetch_put(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/properties/online_charging/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(putUpdateTenantOnlineCharging());
        NotificationsManager.success(
          <FormattedMessage
            id="Entitlement-successfully-updated"
            defaultMessage="Online charging successfully updated"
          />,
          "Updated"
        );
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="entitlement-update-failed"
            defaultMessage="Failed to update online charging!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTenant(ID) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${ID}`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteTenant(data));
        return "deleted";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="delete-tenant-failed"
            defaultMessage="Failed to delete tenant!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTenantAdmin(tenantId, adminId) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/admins/${adminId}`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteTenantAdmin());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="delete-tenant-admin-failed"
            defaultMessage="Failed to delete tenant admin!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteGroupDevice(tenantId, groupId, deviceName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/access_devices/${deviceName}`
    )
      .then((res) => res.json())
      .then((data) => dispatch(deleteGroupDevice()))
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="delete-group-device-failed"
            defaultMessage="Failed to delete group device!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteGroupAdmin(tenantId, groupId, adminId) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/admins/${adminId}`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteGroupAdmin());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="delete-group-admin-failed"
            defaultMessage="Failed to delete group admin!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteAssignUserServices(
  tenantId,
  groupId,
  userName,
  data
) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteAssignUserServices());
      })
      .catch((error) =>
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
  data
) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/services/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteAssignUserServicePacks());
      })
      .catch((error) =>
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

export function fetchDeletePhoneFromTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deletePhoneFromTenant());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-number"
            defaultMessage="Failed to delete number!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteUserFromGroup(tenantId, groupId, userName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/users/${userName}/`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteUserFromGroup());
        return "deleted";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-user"
            defaultMessage="Failed to delete user!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteGroupFromTenant(tenantId, groupId) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteGroupFromTenant(data));
        return "deleted";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-group"
            defaultMessage="Failed to delete group!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTrunkGroup(tenantId, groupId, trunkName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/services/trunk_groups/${trunkName}`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteTrunkGroup(data));
        return "deleted";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-trunk-group"
            defaultMessage="Failed to delete trunk group!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteKey(appName, keyName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/applications/${appName}/${keyName}`
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deleteKey(data));
        return "deleted";
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-key"
            defaultMessage="Failed to delete key!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeletePhoneFromGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/numbers/`,
      data
    )
      .then((res) => res.json())
      .then((data) => {
        dispatch(deletePhoneFromGroup(data));
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-user"
            defaultMessage="Failed to delete user!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTrunkGroupFromTenant(tenantId, trunkName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/services/trunk_groups/${trunkName}`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteTrunkGroupFromTenant());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-trunk-group"
            defaultMessage="Failed to delete trunk group!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteMobileNumberFromTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/mobile_numbers/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteMobileNumberFromTenant());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-mobile-number"
            defaultMessage="Failed to delete mobile number!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteMobileNumberFromGroup(tenantId, groupId, data) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/groups/${groupId}/mobile_numbers/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteMobileNumberFromGroup());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-mobile-number"
            defaultMessage="Failed to delete mobile number!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteTemplate(category, templateName) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/configs/templates/categories/${category}/templates/${templateName}/`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteTemplate());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-template"
            defaultMessage="Failed to delete template!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteEntitlementFromTenant(tenantId, entitlementId) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/number_inventory/entitlements/${entitlementId}`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteEntitlementFromTenant());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-entitlement"
            defaultMessage="Failed to delete entitlement!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteServicePacksFromTenant(tenantId, data) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/tenants/${tenantId}/service_packs/`,
      data
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteServicePackFromTenant());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-service-pack"
            defaultMessage="Failed to delete service-pack!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteCallRecordingPlatfrom(name) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/system/services/call_recording/platforms/${name}/`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteCallRecordingPlatform());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-service-pack"
            defaultMessage="Failed to delete call recording platform!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteReseller(name) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${name}/`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteReseller());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-reseller"
            defaultMessage="Failed to delete reseller!"
          />,
          error.message
        )
      );
  };
}

export function fetchDeleteResellerAdmin(resellerName, username) {
  return function (dispatch) {
    return fetch_delete(
      `${ProvProxiesManager.getCurrentUrlPrefix()}/local/resellers/${resellerName}/admins/${username}`
    )
      .then((res) => res.json())
      .then(() => {
        dispatch(deleteResellerAdmin());
      })
      .catch((error) =>
        NotificationsManager.error(
          <FormattedMessage
            id="failed-to-delete-reseller-admin"
            defaultMessage="Failed to delete reseller admin!"
          />,
          error.message
        )
      );
  };
}
