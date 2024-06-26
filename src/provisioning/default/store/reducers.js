import * as actionType from "./constants";
import { get } from "../components/get";

const initialState = {
  tenants: [],
  tenant: {},
  groups: [],
  phoneNumbers: [],
  adminsTenant: [],
  group: {},
  users: [],
  phoneNumbersByGroup: [],
  licensesByGroup: [],
  servicePacks: [],
  groupServices: [],
  tenantServicePacks: [],
  tenantServicePack: { allocated: { unlimited: undefined } },
  tenantGroupService: { allocated: { unlimited: undefined } },
  devices: [],
  user: {},
  trunkGroups: {},
  availableNumbers: [],
  adminsGroup: [],
  errorMassage: "",
  shouldRedirect: false,
  groupAdmin: {},
  tenantAdmin: {},
  userServices: [],
  userServicePacks: [],
  groupTrunkErrorMassage: "",
  createTenantStep: "Basic",
  createTenant: {
    tenantId: "",
    type: "",
    defaultDomain: "",
    useCustomRoutingProfile: false,
    name: "",
    resellerId: { label: "No Reseller", value: "" },
    contact: {
      name: "",
      phoneNumber: "",
      emailAddress: "",
    },
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      stateDisplayName: "",
      postalCode: "",
      country: "",
    },
    //useTenantLanguages: false,
    templateName: "",
    accessDevice: {},
    sync: { ldap: "", ou: "" },
  },
  templatesOfTenant: [],
  createdTenant: {},
  createGroupStep: "Basic",
  createGroup: {
    groupId: "",
    groupName: "",
    resellerId: { label: "Not set", value: "" },
    userLimit: "",
    defaultDomain: "",
    cliName: "",
    cliPhoneNumber: "",
    timeZone: "",
    contact: {
      name: "",
      phoneNumber: "",
      emailAddress: "",
    },
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      stateDisplayName: "",
      postalCode: "",
      country: "",
    },
    templateName: "",
  },
  templatesOfGroup: [],
  createdGroup: {},
  addPhoneTenantStep: "Basic",
  validatedNumbersTenant: null,
  addedNumbersToTenant: {},
  phoneDeleted: false,
  categoriesOfTemplate: [],
  category: {
    templates: [],
  },
  createdUserInGroup: {},
  trunksGroups: [],
  trunkGroup: {},
  trunkGroupUsers: [],
  trunkGroupBackup: {},
  templateDetails: {},
  phoneTypes: [],
  phoneTypesDetails: {},
  applications: [],
  applicationKeys: [],
  keyValue: {},
  fetchTrunksGroupsFail: false,
  localUsers: [],
  localUser: {},
  availableNumbersTenant: [],
  addedNumbersToGroup: {},
  usersFound: [],
  groupsFound: [],
  languages: {},
  tenantLicenses: {},
  tenantTrunkGroups: {},
  availableTrunkGroups: {},
  createdTrunkGroup: {},
  device: {},
  userServicesGroup: [],
  userServicesTenant: [],
  isAuthorisedTrunkTenant: true,
  trunkGroupsByTenant: [],
  trunkGroupsTemplates: [],
  trunkGroupNotAuthorisedGroup: true,
  trunkGroupTemplate: {},
  selfcareUrl: {}, //Config object
  timeZones: [],
  globalSearchNumber: undefined,
  bwksLicenses: undefined,
  tenantMobileNumbers: [],
  groupMobileNumbers: [],
  availableMobileNumbers: [],
  fullListGroupNumber: [],
  ldapBackends: [],
  tenantOU: [],
  listOfRoutingProfiles: [],
  tenantRoutingProfile: "",
  tenantVoiceMessaging: {},
  tenantSuspensionStatus: "",
  suspensionOptions: [],
  groupSuspensionStatus: "",
  tenantPasswordRules: {},
  tenantEntitlements: [],
  entitlementTypes: { customer_licenses: [] },
  availableNumbersGroup: [],
  limitedUserServicesTenant: {},
  limitedUserServicesGroup: {},
  groupPasswordRules: {},
  trunkGroupAccessInfo: {},
  allTenantServicePacks: [],
  isDisabledTenantSuspensionStatusButton: false,
  isDisabledGroupSuspensionStatusButton: false,
  resellers: [],
  reseller: {},
  resellerAdmins: [],
  userProfileTypes: [],
  callRecordingPlatforms: [],
  usageOfCallRecordingPlaform: [],
  callRecordingProperties: {},
  tenantOnlineCharging: {
    enabled: false,
    spendingLimit: 0,
  },
  dictServicePacks: {},
  dictUserServices: {},
  dictVirtualServicePacks: {},
};

function mainReducer(state = initialState, action) {
  switch (action.type) {
    case actionType.GET_TENANTS: {
      return {
        ...state,
        tenants: action.data.tenants,
      };
    }
    case actionType.GET_TENANT: {
      return {
        ...state,
        tenant: action.data,
        shouldRedirect: false,
        errorMassage: "",
      };
    }
    case actionType.GET_GROUPS: {
      return {
        ...state,
        groups: action.data.groups,
      };
    }
    case actionType.GET_PHONE_NUMBERS: {
      const phoneNumbers = action.data.assignement_phoneNumbers.map(
        (phone) => ({
          ...phone,
          rangeStart:
            (phone.phoneNumbers &&
              phone.phoneNumbers.split(" - ").slice(0)[0]) ||
            phone.phoneNumber ||
            "",
          rangeEnd:
            (phone.phoneNumbers &&
              phone.phoneNumbers.split(" - ").slice(-1)[0]) ||
            "",
          phoneChecked: false,
        })
      );
      return {
        ...state,
        phoneNumbers,
      };
    }
    case actionType.GET_ADMINS_TENANT: {
      return {
        ...state,
        adminsTenant: action.data.admins,
      };
    }
    case actionType.GET_GROUP: {
      return {
        ...state,
        group: action.data,
        shouldRedirect: false,
        errorMassage: "",
      };
    }
    case actionType.GET_USERS: {
      const users = action.data.users.map((user) => ({
        ...user,
        type: user.inTrunkGroup ? "trunk" : "normal",
        userChecked: false,
      }));

      return {
        ...state,
        users: users.filter((user) => user.type !== "trunk"),
      };
    }
    case actionType.GET_PHONE_NUMBERS_BY_GROUP_ID: {
      const phoneNumbers = action.data.assigned_numbers.map((phone) => ({
        ...phone,
        rangeStart: phone.phoneNumber.includes("-")
          ? phone.phoneNumber.split(" - ").slice(0)[0]
          : phone.phoneNumber,
        rangeEnd: phone.phoneNumber.includes("-")
          ? phone.phoneNumber.split(" - ").slice(-1)[0]
          : "",
        phoneChecked: false,
      }));
      const fullListGroupNumber = [{ value: "", label: "No number" }];
      phoneNumbers.forEach((el) => {
        if (el.rangeEnd) {
          const length = Number(el.rangeEnd) - Number(el.rangeStart);
          for (let i = 0; i <= length; i++) {
            fullListGroupNumber.push({
              value: `${el.rangeStart[0] === "+" ? "+" : ""}${
                Number(el.rangeStart) + i
              }`,
              label: `${el.rangeStart[0] === "+" ? "+" : ""}${
                Number(el.rangeStart) + i
              }`,
            });
          }
        } else {
          fullListGroupNumber.push({
            value: el.rangeStart,
            label: el.rangeStart,
          });
        }
      });
      const availablePhoneNumbers = action.data.assigned_numbers
        .filter((el) => !el.userId)
        .map((phone) => ({
          ...phone,
          rangeStart:
            (phone.phoneNumber && phone.phoneNumber.split(" - ")[0]) || "",
          rangeEnd:
            (phone.phoneNumber && phone.phoneNumber.split(" - ")[1]) || "",
          phoneChecked: false,
        }));
      return {
        ...state,
        phoneNumbersByGroup: phoneNumbers,
        fullListGroupNumber,
        availableNumbersGroup: availablePhoneNumbers,
      };
    }
    case actionType.GET_LICENSES_BY_GROUP_ID: {
      const services = JSON.parse(JSON.stringify(action.data));
      if (!Array.isArray(services.groupServices)) {
        services.groupServices = [];
      }
      if (!Array.isArray(services.servicePacks)) {
        services.servicePacks = [];
      }
      if (!Array.isArray(services.userServices)) {
        services.userServices = [];
      }

      const availableTrunkGroups = services.groupServices.filter(
        (group) => group.name === "Trunk Group"
      );
      ////////
      const groupServicesShown = services.groupServices
        .filter(
          (group) =>
            group.name === "Auto Attendant" ||
            group.name === "Auto Attendant - Standard" ||
            group.name === "Call Pickup" ||
            group.name === "Hunt Group" ||
            group.name === "Group Paging" ||
            group.name === "Meet-me Conferencing" ||
            group.name === "Trunk Group"
        )
        .sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      const groupServicesHide = [];
      services.groupServices.forEach((group) => {
        if (
          group.name !== "Auto Attendant" &&
          group.name !== "Auto Attendant - Standard" &&
          group.name !== "Call Pickup" &&
          group.name !== "Hunt Group" &&
          group.name !== "Group Paging" &&
          group.name !== "Meet-me Conferencing" &&
          group.name !== "Trunk Group"
        ) {
          groupServicesHide.push({
            ...group,
            hide: true,
            additional: true,
          });
        }
      });
      groupServicesHide.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      const groupServices = [...groupServicesShown, ...groupServicesHide];
      const limitedUS = services.userServices?.filter(
        (el) => el.allocated && !el.allocated.unlimited
      );
      const userServices = [
        ...limitedUS?.slice(0, 9),
        ...limitedUS
          ?.slice(9, limitedUS.length)
          ?.map((el) => ({ ...el, hide: true, additional: true })),
      ];
      return {
        ...state,
        servicePacks: services.servicePacks,
        groupServices: {
          groups: groupServices,
          countShown: groupServicesShown.length,
        },
        limitedUserServicesGroup: { services: userServices, countShown: 10 },
        availableTrunkGroups:
          availableTrunkGroups[0] && availableTrunkGroups[0],
        userServicesGroup: services.userServices,
      };
    }
    case actionType.GET_DEVICES_BY_GROUP_ID: {
      return {
        ...state,
        devices: action.data.access_devices,
      };
    }
    case actionType.GET_USER: {
      return {
        ...state,
        user: action.data,
      };
    }
    case actionType.GET_TRUNK_BY_GROUP_ID: {
      return {
        ...state,
        trunkGroups: action.data,
        fetchTrunksGroupsFail: true,
      };
    }
    case actionType.GET_AVAILABLE_NUMBERS_BY_GROUP_ID: {
      return {
        ...state,
        availableNumbers: action.data.available_numbers,
      };
    }
    case actionType.GET_ADMINS_GROUP: {
      return {
        ...state,
        adminsGroup: action.data.admins,
      };
    }
    case actionType.GET_GROUP_ADMIN_BY_ADMIN_ID: {
      return {
        ...state,
        groupAdmin: action.data,
      };
    }
    case actionType.GET_TENANT_ADMIN_BY_ADMIN_ID: {
      return {
        ...state,
        tenantAdmin: action.data,
      };
    }
    case actionType.GET_USER_SERVICES_BY_USER_ID: {
      const userServices = action.data.assignementStatus.services.map(
        (service) => ({
          ...service,
          serviceChecked: service.assigned,
          status: action.data.summary.userServices.reduce(
            (prev, userService) => {
              if (service.name === userService.name) {
                if (userService.active) {
                  prev = "Active";
                  return prev;
                } else {
                  prev = "Not active";
                  return prev;
                }
              } else return prev;
            },
            "N/A"
          ),
        })
      );
      const userServicePacks = action.data.assignementStatus.servicePacks.map(
        (service) => ({
          ...service,
          serviceChecked: service.assigned,
        })
      );
      return {
        ...state,
        userServices,
        userServicePacks,
      };
    }
    case actionType.GET_TEMPLATES_OF_TENANT: {
      return {
        ...state,
        templatesOfTenant: action.data.templates,
      };
    }
    case actionType.GET_ACCESS_DEVICE_BY_NAME: {
      return {
        ...state,
        accessDevice: action.data,
      };
    }
    case actionType.GET_TEMPLATES_OF_GROUP: {
      return {
        ...state,
        templatesOfGroup: action.data.templates,
      };
    }
    case actionType.GET_CATEGORIES_OF_TEMPLATE: {
      return {
        ...state,
        categoriesOfTemplate: action.data.categories,
      };
    }
    case actionType.GET_CATEGORY_BY_NAME: {
      return {
        ...state,
        category: action.data,
      };
    }
    case actionType.GET_TRUNKS_GROUPS_BY_GROUP: {
      return {
        ...state,
        trunksGroups: action.data.trunks,
        trunkGroupNotAuthorisedGroup: true,
      };
    }
    case actionType.GET_TRUNK_GROUP_BY_NAME: {
      return {
        ...state,
        trunkGroup: action.data,
      };
    }
    case actionType.GET_USERS_BY_TRUNK_GROUP: {
      const users = action.data.users.map((user) => ({
        ...user,
        type: "trunk",
        userChecked: false,
      }));
      return {
        ...state,
        trunkGroupUsers: users,
      };
    }
    case actionType.GET_BACKUP_BY_TRUNK_GROUP: {
      return {
        ...state,
        trunkGroupBackup: action.data,
      };
    }
    case actionType.GET_TEMPLATE_DETAILS: {
      return {
        ...state,
        templateDetails: action.data,
      };
    }
    case actionType.GET_PHONE_TYPES: {
      return {
        ...state,
        phoneTypes: action.data.phoneTypes,
      };
    }
    case actionType.GET_PHONE_TYPES_DETAILS: {
      return {
        ...state,
        phoneTypesDetails: action.data,
      };
    }
    case actionType.GET_APPLICATIONS: {
      return {
        ...state,
        applications: action.data.applications,
      };
    }
    case actionType.GET_KEYS_BY_APPLICATIONS: {
      return {
        ...state,
        applicationKeys: action.data.applicationKeys,
      };
    }
    case actionType.GET_VALUE_OF_KEY: {
      return {
        ...state,
        keyValue: action.data,
      };
    }
    case actionType.GET_TRUNKS_GROUPS_BY_GROUP_FAIL: {
      return {
        ...state,
        fetchTrunksGroupsFail: false,
      };
    }
    case actionType.GET_LOCAL_USERS: {
      return {
        ...state,
        localUsers: action.data.local_users,
      };
    }
    case actionType.GET_LOCAL_USER: {
      return {
        ...state,
        localUser: action.data,
      };
    }
    case actionType.GET_SEARCH_USERS: {
      return {
        ...state,
        usersFound: action.data.users,
      };
    }
    case actionType.GET_SEARCH_GROUPS: {
      return {
        ...state,
        groupsFound: action.data.groups,
      };
    }
    case actionType.GET_AVAILABLE_NUMBERS_BY_TENANT_ID: {
      const phoneNumbers = action.data.available_phoneNumbers.map((phone) => ({
        ...phone,
        rangeStart:
          (phone.phoneNumbers && phone.phoneNumbers.split(" - ").slice(0)[0]) ||
          phone.phoneNumber ||
          "",
        rangeEnd:
          (phone.phoneNumbers &&
            phone.phoneNumbers.split(" - ").slice(-1)[0]) ||
          "",
        phoneChecked: false,
      }));
      return {
        ...state,
        availableNumbersTenant: phoneNumbers,
      };
    }
    case actionType.GET_LANGUAGES: {
      return {
        ...state,
        languages: action.data,
      };
    }
    case actionType.GET_TENANT_LICENSES: {
      const groupServicesShown = action.data.groupServices
        .filter(
          (group) =>
            group.name === "Auto Attendant" ||
            group.name === "Auto Attendant - Standard" ||
            group.name === "Call Pickup" ||
            group.name === "Hunt Group" ||
            group.name === "Group Paging" ||
            group.name === "Meet-me Conferencing" ||
            group.name === "Trunk Group"
        )
        .sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      const groupServicesHide = [];
      action.data.groupServices.forEach((group) => {
        if (
          group.name !== "Auto Attendant" &&
          group.name !== "Auto Attendant - Standard" &&
          group.name !== "Call Pickup" &&
          group.name !== "Hunt Group" &&
          group.name !== "Group Paging" &&
          group.name !== "Meet-me Conferencing" &&
          group.name !== "Trunk Group"
        ) {
          groupServicesHide.push({
            ...group,
            hide: true,
            additional: true,
          });
        }
      });
      groupServicesHide.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      const groupServices = [...groupServicesShown, ...groupServicesHide];
      const limitedUS = action.data.userServices.filter(
        (el) => el.allocated && !el.allocated.unlimited
      );
      const userServices = [
        ...limitedUS.slice(0, 9),
        ...limitedUS
          .slice(9, limitedUS.length)
          .map((el) => ({ ...el, hide: true, additional: true })),
      ];
      return {
        ...state,
        tenantLicenses: {
          groups: groupServices,
          countShown: groupServicesShown.length,
        },
        userServicesTenant: action.data.userServices,
        limitedUserServicesTenant: { services: userServices, countShown: 10 },
        tenantServicePacks: action.data.servicePacks,
      };
    }
    case actionType.GET_TRUNK_BY_TENANT_ID: {
      return {
        ...state,
        tenantTrunkGroups: action.data,
        isAuthorisedTrunkTenant: true,
      };
    }
    case actionType.GET_DEVICE: {
      return {
        ...state,
        device: action.data,
      };
    }
    case actionType.GET_TENANT_TRUNK_GROUP: {
      return {
        ...state,
        trunkGroupsByTenant: action.data.tenantTrunks,
      };
    }
    case actionType.GET_TENANT_SERVICE_PACK: {
      return {
        ...state,
        tenantServicePack: action.data,
      };
    }
    case actionType.GET_TENANT_GROUP_SERIVCE: {
      const tenantGroupService = action.data.groupServices.find(
        (el) => el.name === action.data.groupServiceName
      );
      return {
        ...state,
        tenantGroupService,
      };
    }
    case actionType.GET_TRUNK_GROUP_TEMPLATES: {
      return {
        ...state,
        trunkGroupsTemplates: action.data.templates,
      };
    }
    case actionType.GET_TRUNK_GROUP_TEMPLATE: {
      return {
        ...state,
        trunkGroupTemplate: action.data,
      };
    }
    case actionType.GET_SELFCARE_URL: {
      const selfcareUrl =
        get(action, "data.data") &&
        JSON.parse(action.data.data.replace(/\\r|\\t|\\n|\\/g, ""));
      return {
        ...state,
        selfcareUrl,
      };
    }
    case actionType.GET_TIMEZONES: {
      return {
        ...state,
        timeZones: action.data.timeZones,
      };
    }
    case actionType.GET_GLOBAL_SEARCH_NUMBERS: {
      return {
        ...state,
        globalSearchNumber: action.data,
      };
    }
    case actionType.GET_BWKS_LICENSES: {
      return {
        ...state,
        bwksLicenses: action.data,
      };
    }
    case actionType.GET_MOBILE_NUMBERS_FOR_TENANT: {
      const tenantMobileNumbers = [
        ...action.data.assigned_numbers.map((num) => ({
          ...num,
          phoneChecked: false,
        })),
        ...action.data.available_numbers.map((num) => ({
          phoneNumber: num,
          assignedToGroup: "",
          canBeDeleted: true,
          phoneChecked: false,
        })),
      ];
      return {
        ...state,
        tenantMobileNumbers,
        availableMobileNumbers: action.data.available_numbers,
      };
    }
    case actionType.GET_MOBILE_NUMBERS_FOR_GROUP: {
      const groupMobileNumbers = [
        ...action.data.assigned_numbers.map((num) => ({
          ...num,
          phoneChecked: false,
        })),
        ...action.data.available_numbers.map((num) => ({
          phoneNumber: num,
          firstName: "",
          lastName: "",
          userId: "",
          extension: "",
          phoneChecked: false,
        })),
      ];
      return {
        ...state,
        groupMobileNumbers,
      };
    }
    case actionType.GET_EXISTING_BACKENDS: {
      return {
        ...state,
        ldapBackends: action.data.ldapBackends,
      };
    }
    case actionType.GET_TENANT_OU: {
      return {
        ...state,
        tenantOU: action.data.tenants,
        createTenant: {
          ...state.createTenant,
          name: action.data.tenants.length
            ? action.data.tenants[0].description
            : "",
          sync: {
            ...state.createTenant.sync,
            ou: action.data.tenants.length ? action.data.tenants[0].id : "",
          },
        },
      };
    }
    case actionType.GET_LIST_OF_ROUTING_PROFILES: {
      return {
        ...state,
        listOfRoutingProfiles: action.data.routingProfiles,
      };
    }
    case actionType.GET_TENANT_ROUTING_PROFILE: {
      return {
        ...state,
        tenantRoutingProfile: action.data.routingProfile,
      };
    }
    case actionType.GET_TENANT_VOICE_MESSAGING: {
      return {
        ...state,
        tenantVoiceMessaging: action.data,
      };
    }
    case actionType.GET_TENANT_SUSPENSION_STATUS: {
      return {
        ...state,
        tenantSuspensionStatus: action.data.suspensionStatus,
        isDisabledTenantSuspensionStatusButton: false,
      };
    }
    case actionType.GET_SUSPENSION_OPTIONS: {
      return {
        ...state,
        suspensionOptions: action.data.templates,
      };
    }
    case actionType.GET_GROUP_SUSPENSION_STATUS: {
      return {
        ...state,
        groupSuspensionStatus: action.data.suspensionStatus,
        isDisabledGroupSuspensionStatusButton: false,
      };
    }
    case actionType.GET_TENANT_PASSWORD_RULES: {
      return {
        ...state,
        tenantPasswordRules: action.data,
      };
    }
    case actionType.GET_REPORTING_CUSTOMER: {
      return {
        ...state,
        customer: action.data,
      };
    }
    case actionType.POST_REPORTING_CUSTOMER: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_REPORTING_CUSTOMER: {
      return {
        ...state,
      };
    }
    case actionType.GET_REPORTING_CUSTOMER_REPORTS: {
      return {
        ...state,
        report_cfgs: action.data,
      };
    }
    case actionType.GET_REPORTING_CUSTOMER_GROUPS_REPORTS: {
      return {
        ...state,
        report_cfgs: action.data,
      };
    }
    case actionType.GET_REPORTING_CUSTOMER_REPORT_HISTORY: {
      return {
        ...state,
        reports: action.data,
      };
    }
    case actionType.GET_REPORTING_CUSTOMER_GROUP_REPORT_HISTORY: {
      return {
        ...state,
        reports: action.data,
      };
    }
    case actionType.GET_TENANT_ENTITLEMENTS: {
      return {
        ...state,
        tenantEntitlements: action.data.entitlements,
      };
    }
    case actionType.GET_ENTITLEMENT_TYPES: {
      return {
        ...state,
        entitlementTypes: action.data,
      };
    }
    case actionType.GET_GROUP_PASSWORD_RULES: {
      return {
        ...state,
        groupPasswordRules: action.data,
      };
    }
    case actionType.GET_TRUNK_GROUP_ACCESS_INFO: {
      return {
        ...state,
        trunkGroupAccessInfo: action.data,
      };
    }
    case actionType.GET_ALL_SERVICE_PACKS_OF_TENANT: {
      return {
        ...state,
        allTenantServicePacks: action.data.service_packs,
      };
    }
    case actionType.GET_RESELLERS: {
      return {
        ...state,
        resellers: action.data.resellers,
      };
    }
    case actionType.GET_RESELLER: {
      return {
        ...state,
        reseller: action.data,
      };
    }
    case actionType.GET_RESELLER_ADMINS: {
      return {
        ...state,
        resellerAdmins: action.data.admins,
      };
    }
    case actionType.GET_USER_PROFILE_TYPES: {
      return {
        ...state,
        userProfileTypes: action.data.userProfileTypes,
      };
    }
    case actionType.GET_CALL_RECORDING_PLATFORMS: {
      const callRecordingPlatforms = action.data.callRecordingPlatforms.map(
        (el) => {
          if (el.name === action.data.systemDefault) {
            return { ...el, isDefault: true };
          }
          return { ...el, isDefault: false };
        }
      );
      return {
        ...state,
        callRecordingPlatforms: callRecordingPlatforms,
      };
    }
    case actionType.GET_USAGE_OF_CALL_RECORDING_PLATFORMS: {
      return {
        ...state,
        usageOfCallRecordingPlaform: action.data.groups,
      };
    }
    case actionType.GET_CALL_RECORDING_PROPERTIES: {
      return {
        ...state,
        callRecordingProperties: action.data,
      };
    }
    case actionType.GET_TENANT_ONLINE_CHARGING: {
      return {
        ...state,
        tenantOnlineCharging: action.data,
      };
    }
    case actionType.GET_DICT_SERVICE_PACKS: {
      return {
        ...state,
        dictServicePacks: action.data.service_packs.reduce((prev, curr) => {
          prev[curr.technical_name] = curr;
          return prev;
        }, {}),
      };
    }
    case actionType.GET_DICT_USER_SERVICES: {
      return {
        ...state,
        dictUserServices: action.data.user_services.reduce((prev, curr) => {
          prev[curr.technical_name] = curr;
          return prev;
        }, {}),
      };
    }
    case actionType.GET_DICT_VIRTUAL_SERVICE_PACKS: {
      return {
        ...state,
        dictVirtualServicePacks: action.data.virtual_service_packs.reduce(
          (prev, curr) => {
            prev[curr.technical_name] = curr;
            return prev;
          },
          {}
        ),
      };
    }
    case actionType.POST_CREATE_GROUP_ADMIN: {
      return {
        ...state,
        shouldRedirect: true,
      };
    }
    case actionType.POST_CREATE_GROUP_ADMIN_ERROR: {
      const errorMassage = action.error.errors[0].details.errors["0"].summary;
      return {
        ...state,
        errorMassage,
      };
    }
    case actionType.POST_CREATE_TENANT_ADMIN: {
      return {
        ...state,
        shouldRedirect: true,
      };
    }
    case actionType.POST_CREATE_TENANT_ADMIN_ERROR: {
      const errorMassage = action.error.errors[0].details.errors["0"].summary;
      return {
        ...state,
        errorMassage,
      };
    }
    case actionType.POST_ASSIGN_USER_SERVICES: {
      return {
        ...state,
      };
    }
    case actionType.POST_ASSIGN_USER_SERVICE_PACKS: {
      return {
        ...state,
      };
    }
    case actionType.POST_CREATE_TENANT: {
      return {
        ...state,
        createdTenant: action.data,
      };
    }
    case actionType.POST_CREATE_GROUP: {
      return {
        ...state,
        createdGroup: action.data,
      };
    }
    case actionType.POST_ADD_PHONE_NUMBERS_TO_TENANT: {
      const warning = action.data.warning;
      const added =
        action.data.result &&
        action.data.result.filter((number) => number.status === "added");
      const rejected =
        action.data.result &&
        action.data.result.filter((number) => number.status === "rejected");
      return {
        ...state,
        addedNumbersToTenant: {
          warning,
          added,
          rejected,
        },
      };
    }
    case actionType.POST_ADD_MOBILE_NUMBER_TO_TENANT: {
      const warning = action.data.warning;
      const added = action.data.result.filter(
        (number) => number.status === "added"
      );
      const rejected = action.data.result.filter(
        (number) => number.status === "rejected"
      );
      return {
        ...state,
        addedNumbersToTenant: {
          warning,
          added,
          rejected,
        },
      };
    }
    case actionType.POST_ADD_MOBILE_NUMBER_TO_GROUP: {
      const warning = action.data.warning;
      const added = action.data.result.filter(
        (number) => number.status === "added"
      );
      const rejected = action.data.result.filter(
        (number) => number.status === "rejected"
      );
      return {
        ...state,
        addedNumbersToGroup: {
          warning,
          added,
          rejected,
        },
      };
    }
    case actionType.POST_CREATE_USER_TO_GROUP: {
      return {
        ...state,
        createdUserInGroup: action.data,
      };
    }
    case actionType.POST_ADD_GROUP_SERVICES_TO_GROUP: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_KEY_TO_APPLICATION: {
      return {
        ...state,
      };
    }
    case actionType.POST_CREATE_LOCAL_USER: {
      return {
        ...state,
      };
    }
    case actionType.POST_ASSIGN_PHONE_NUMBERS_TO_GROUP: {
      const warning = action.data.warning;
      const added = action.data.result.filter(
        (number) => number.status === "added"
      );
      const rejected = action.data.result.filter(
        (number) => number.status === "rejected"
      );
      return {
        ...state,
        addedNumbersToTenant: {
          warning,
          added,
          rejected,
        },
      };
    }
    case actionType.POST_CREATE_TRUNK_GROUP: {
      return {
        ...state,
        createdTrunkGroup: action.data,
      };
    }
    case actionType.POST_CREATE_DEVICE_IN_GROUP: {
      return {
        ...state,
      };
    }
    case actionType.POST_CREATE_TRUNK_GROUP_USER: {
      return {
        ...state,
      };
    }
    case actionType.POST_CREATE_TEMPLATE: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_ENTITLEMENTS_TO_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_SERVICE_PACK_TO_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_RESELLER: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_RESELLER_ADMIN: {
      return {
        ...state,
      };
    }
    case actionType.POST_ADD_CALL_RECORDING_PLATFORM: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_USER: {
      return {
        ...state,
        user: action.data,
      };
    }
    case actionType.PUT_UPDATE_GROUP_DETAILS: {
      return {
        ...state,
        group: action.data,
      };
    }
    case actionType.PUT_UPDATE_GROUP_ADMIN: {
      return {
        ...state,
        groupAdmin: action.data,
      };
    }
    case actionType.PUT_UPDATE_TENANT_ADMIN: {
      return {
        ...state,
        tenantAdmin: action.data,
      };
    }
    case actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID: {
      return {
        ...state,
        trunkGroups: action.data,
      };
    }
    case actionType.PUT_UPDATE_TRUNK_BY_GROUP_ID_ERROR: {
      const groupTrunkErrorMassage =
        action.data.errors[0].details.errors["0"].summary;
      return {
        ...state,
        groupTrunkErrorMassage,
      };
    }
    case actionType.PUT_UPDATE_SERVICE_PACKS_BY_GROUP_ID: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_GROUP_SERVICES_BY_GROUP_ID: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_TENANT_DETAILS: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_KEY: {
      return {
        ...state,
        keyValue: action.data,
      };
    }
    case actionType.PUT_UPDATE_TRUNK_GROUP: {
      return {
        ...state,
        trunkGroup: action.data,
      };
    }
    case actionType.PUT_UPDATE_BACKUP_BY_TRUNK_GROUP: {
      return {
        ...state,
        trunkGroupBackup: action.data,
      };
    }
    case actionType.PUT_UPDATE_LOCAL_USER: {
      return {
        ...state,
        localUser: action.data,
      };
    }
    case actionType.PUT_UPDATE_TRUNK_BY_TENANT_ID: {
      return {
        ...state,
        tenantTrunkGroups: action.data,
      };
    }
    case actionType.PUT_UPDATE_GROUP_SERVICES_BY_TENANT_ID: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_DEVICE: {
      return {
        ...state,
        device: action.data,
      };
    }
    case actionType.PUT_UPDATE_TEMPLATE: {
      return {
        ...state,
        templateDetails: action.data,
      };
    }
    case actionType.PUT_UPDATE_TENANT_ROUTING_PROFILE: {
      return {
        ...state,
        tenantRoutingProfile: action.data.routingProfile,
      };
    }
    case actionType.PUT_UPDATE_TENANT_VOICE_MESSAGING: {
      return {
        ...state,
        tenantVoiceMessaging: action.data,
      };
    }
    case actionType.PUT_UPDATE_TENANT_SUSPENSION_STATUS: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_GROUP_SUSPENSION_STATUS: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_TENANT_ENTITLEMENT: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_TRUNK_GROUP_ACCESS_INFO: {
      return {
        ...state,
        trunkGroupAccessInfo: action.data,
      };
    }
    case actionType.PUT_UPDATE_RESELLER: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_CALL_RECORDING_PLATFORMS: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_RESELLER_ADMIN: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_CALL_RECORDING_PROPERTIES: {
      return {
        ...state,
      };
    }
    case actionType.PUT_UPDATE_TENANT_ONLINE_CHARGING: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_TENANT_ADMIN: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_GROUP_DEVICE: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_GROUP_ADMIN: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_DEASSIGN_USER_SERVICES: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_DEASSIGN_USER_SERVICE_PACKS: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_PHONE_FROM_TENANT: {
      return {
        ...state,
        phoneDeleted: !state.phoneDeleted,
      };
    }
    case actionType.DELETE_PHONE_FROM_GROUP: {
      return {
        ...state,
        phoneDeleted: !state.phoneDeleted,
      };
    }
    case actionType.DELETE_USER_FROM_GROUP: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_GROUP_FROM_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_TRUNK_GROUP: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_KEY: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_LOCAL_USER: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_TRUNK_GROUP_FROM_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_MOBILE_NUMBER_FROM_TENANT: {
      return {
        ...state,
        phoneDeleted: !state.phoneDeleted,
      };
    }
    case actionType.DELETE_MOBILE_NUMBER_FROM_GROUP: {
      return {
        ...state,
        phoneDeleted: !state.phoneDeleted,
      };
    }
    case actionType.DELETE_TEMPLATE: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_ENTITLEMENT_FROM_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_SERVICE_PACK_FROM_TENANT: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_RESELLER: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_RESELLER_ADMIN: {
      return {
        ...state,
      };
    }
    case actionType.DELETE_CALL_RECORDING_PLATFORM: {
      return {
        ...state,
      };
    }
    case actionType.CLEAR_ERROR_MASSAGE: {
      return {
        ...state,
        errorMassage: "",
        groupTrunkErrorMassage: "",
      };
    }
    case actionType.CHANGE_STEP_OF_CREATE_TENANT: {
      return {
        ...state,
        createTenantStep: action.data,
      };
    }
    case actionType.CHANGE_TYPE_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          type: action.data,
        },
      };
    }
    case actionType.CHANGE_ID_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          tenantId: action.data,
        },
      };
    }
    case actionType.CHANGE_NAME_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          name: action.data,
        },
      };
    }
    case actionType.CHANGE_RESELLER_ID_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          resellerId: action.data,
        },
      };
    }
    case actionType.CHANGE_ADDRESS_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          addressInformation: {
            ...state.createTenant.addressInformation,
            addressLine1: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_ZIP_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          addressInformation: {
            ...state.createTenant.addressInformation,
            postalCode: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_CITY_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          addressInformation: {
            ...state.createTenant.addressInformation,
            city: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_TAMPLATE_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          templateName: action.data,
        },
      };
    }
    case actionType.REFUSE_CREATE_TENANT: {
      return {
        ...state,
        createTenantStep: "Basic",
        createTenant: {
          tenantId: "",
          type: "",
          defaultDomain: "",
          useCustomRoutingProfile: false,
          name: "",
          contact: {
            name: "",
            phoneNumber: "",
            emailAddress: "",
          },
          address: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            stateDisplayName: "",
            postalCode: "",
            country: "",
          },
          //useTenantLanguages: false,
          templateName: "",
          sync: { ldap: "", ou: "" },
        },
      };
    }
    case actionType.CHANGE_DOMAIN_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          defaultDomain: action.data,
        },
      };
    }
    case actionType.CHANGE_BACKEND_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          sync: {
            ...state.createTenant.sync,
            ldap: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_DETAILS_OF_TENANT: {
      console.log(state.tenantOU.filter((el) => el.id === action.data));
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          name: state.tenantOU.filter((el) => el.id === action.data)[0]
            ? state.tenantOU.filter((el) => el.id === action.data)[0]
                .description
            : "",
          sync: {
            ...state.createTenant.sync,
            ou: action.data,
          },
        },
      };
    }
    case actionType.REFUSE_CREATE_GROUP: {
      return {
        ...state,
        createGroupStep: "Basic",
        createGroup: {
          groupId: "",
          groupName: "",
          userLimit: "",
          defaultDomain: "",
          cliName: "",
          cliPhoneNumber: "",
          timeZone: "",
          contact: {
            name: "",
            phoneNumber: "",
            emailAddress: "",
          },
          address: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            stateDisplayName: "",
            postalCode: "",
            country: "",
          },
          templateName: "",
        },
      };
    }
    case actionType.CHANGE_ID_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          groupId: action.data,
        },
      };
    }
    case actionType.CHANGE_TIME_ZONE_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          timeZone: action.data,
        },
      };
    }
    case actionType.CHANGE_NAME_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          groupName: action.data,
        },
      };
    }
    case actionType.CHANGE_RESELLER_ID_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          resellerId: action.data,
        },
      };
    }
    case actionType.CHANGE_DOMAIN_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          defaultDomain: action.data,
        },
      };
    }
    case actionType.CHANGE_USER_LIMIT_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          userLimit: action.data,
        },
      };
    }
    case actionType.CHANGE_ADDRESS_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          addressInformation: {
            ...state.createGroup.addressInformation,
            addressLine1: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_ZIP_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          addressInformation: {
            ...state.createGroup.addressInformation,
            postalCode: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_CITY_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          addressInformation: {
            ...state.createGroup.addressInformation,
            city: action.data,
          },
        },
      };
    }
    case actionType.CHANGE_STEP_OF_CREATE_GROUP: {
      return {
        ...state,
        createGroupStep: action.data,
      };
    }
    case actionType.CHANGE_TAMPLATE_OF_GROUP: {
      return {
        ...state,
        createGroup: {
          ...state.createGroup,
          templateName: action.data,
        },
      };
    }
    case actionType.CHANGE_STEP_OF_ADD_PHONE_TENANT: {
      return {
        ...state,
        addPhoneTenantStep: action.data,
      };
    }
    case actionType.REFUSE_ADD_PHONE_TO_TENANT: {
      return {
        ...state,
        addPhoneTenantStep: "Basic",
        validatedNumbersTenant: null,
      };
    }
    case actionType.SAVE_VALIDATED_NUMBERS_TENANT: {
      return {
        ...state,
        validatedNumbersTenant: action.data,
      };
    }
    case actionType.REMOVE_SUCCESFUL_VALID_PHONE_TENANT: {
      const indexToDelete = state.validatedNumbersTenant.ok.findIndex(
        (phone) => phone.line === action.data
      );
      const newArray = [...state.validatedNumbersTenant.ok];
      newArray.splice(indexToDelete, 1);
      return {
        ...state,
        validatedNumbersTenant: {
          ...state.validatedNumbersTenant,
          ok: newArray,
        },
      };
    }
    case actionType.TRUNK_NOT_AUTHORISED_TENANT: {
      return {
        ...state,
        tenantLicenses: false,
        tenantTrunkGroups: {},
      };
    }
    case actionType.SHOW_HIDE_ADDITIONAL_SERVICES_TENANT: {
      const newTanantLicenses = [];
      state.tenantLicenses.groups &&
        state.tenantLicenses.groups.forEach((el) => {
          if (el.additional) {
            newTanantLicenses.push({ ...el, hide: action.data });
          } else {
            newTanantLicenses.push(el);
          }
        });
      return {
        ...state,
        tenantLicenses: { ...state.tenantLicenses, groups: newTanantLicenses },
      };
    }
    case actionType.SHOW_HIDE_ADDITIONAL_USER_SERVICES_TENANT: {
      const newTanantLicenses = [];
      state.limitedUserServicesTenant.services &&
        state.limitedUserServicesTenant.services.forEach((el) => {
          if (el.additional) {
            newTanantLicenses.push({ ...el, hide: action.data });
          } else {
            newTanantLicenses.push(el);
          }
        });
      return {
        ...state,
        limitedUserServicesTenant: {
          ...state.tenantLicenses,
          services: newTanantLicenses,
        },
      };
    }
    case actionType.SHOW_HIDE_ADDITIONAL_USER_SERVICES_GROUP: {
      const newTanantLicenses = [];
      state.limitedUserServicesGroup.services &&
        state.limitedUserServicesGroup.services.forEach((el) => {
          if (el.additional) {
            newTanantLicenses.push({ ...el, hide: action.data });
          } else {
            newTanantLicenses.push(el);
          }
        });
      return {
        ...state,
        limitedUserServicesGroup: {
          ...state.tenantLicenses,
          services: newTanantLicenses,
        },
      };
    }
    case actionType.SHOW_HIDE_ADDITIONAL_SERVICES_GROUP: {
      const newGroupServices = [];
      state.groupServices.groups &&
        state.groupServices.groups.forEach((el) => {
          if (el.additional) {
            newGroupServices.push({ ...el, hide: action.data });
          } else {
            newGroupServices.push(el);
          }
        });
      return {
        ...state,
        groupServices: { ...state.groupServices, groups: newGroupServices },
      };
    }
    case actionType.TRUNK_NOT_AUTHORISED_GROUP: {
      return {
        ...state,
        trunkGroupNotAuthorisedGroup: false,
      };
    }
    case actionType.CLEAR_SEARCH_NUMBER: {
      return {
        ...state,
        globalSearchNumber: undefined,
      };
    }
    case actionType.DISABLE_TENANT_SUSPESION_STATUS_BUTTON: {
      return {
        ...state,
        isDisabledTenantSuspensionStatusButton: true,
      };
    }
    case actionType.DISABLE_GROUP_SUSPESION_STATUS_BUTTON: {
      return {
        ...state,
        isDisabledGroupSuspensionStatusButton: true,
      };
    }
    case actionType.CHANGE_CUSTOM_ROUTING_PROFILE_OF_TENANT: {
      return {
        ...state,
        createTenant: {
          ...state.createTenant,
          useCustomRoutingProfile: action.data,
        },
      };
    }
    default:
      return state;
  }
}

export default mainReducer;
