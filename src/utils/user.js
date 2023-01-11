import {userLocalizeUtcDate} from "../utils";
import moment from "moment";

export const pages = Object.freeze({
    requests: 19,
    requests_nprequests: 0,
    requests_ndg: 22,
    requests_startup_events: 4,
    requests_workflow_editor: 5,
    data: 20,
    data_tenants: 6,
    system: 21,
    system_users: 12,
    system_config: 14,
    system_gateways: 15,
    system_databases: 16,
    system_reporting: 17,
    system_queues: 18,
    system_templates: 27,
    bulks: 23,
    bulk_actions: 24,
    system_logs: 25,
    provisioning: 26,
    edit_group_iad_advanced_clock_master: 100,
    edit_group_iad_pra_info_tpid: 101,
    edit_group_iad_pra_info_circuit_id: 102,
    edit_group_iad_pra_info_pra_port: 103,
    edit_group_iad_pra_info_enabled: 104,
    edit_pra_nat_dst: 105,
    edit_pra_nat_src: 106,
    edit_pra_int_src: 107,
    edit_sip_nat_dst: 108,
    edit_sip_nat_src: 109,
    edit_sip_int_src: 110,
    edit_group_iad_ip1_rtpPortRange: 111,
    edit_group_iad_ip1_mode: 112,
    edit_group_iad_ip1_ipv4Address: 113,
    edit_group_iad_ip1_ipv4Netmask: 114,
    edit_group_iad_ip1_ipv6Address: 115,
    edit_group_iad_ip1_ipv6Netmask: 116,
    edit_group_iad_pbx_IPAddress: 117,
    edit_group_iad_pbx_port: 118,
    edit_group_dtmf: 119,
    edit_group_iad_services_dtmf: 120,
    edit_group_iad_advanced_sysLogIp: 121,
    edit_group_iad_advanced_sysLogEnabled: 122,
    edit_group_iad_advanced_isdnTerminationSide: 123,
    edit_group_iad_advanced_dual_power: 124,
    edit_group_iad_transportMode: 125,
    common_page_access: 200,
    add_access: 201,
    delete_access: 202,
    npact_operators: 300,
    npact_ranges: 301,
    npact_routing_info: 302,
    npact_porting_cases: 303,
    npact_mvno_numbers: 304,
    npact_holidays: 305,
});

export const accesses = Object.freeze({
  dashboard: "dashboard",
  requests: "requests",
  cron_requests: "cron_requests",
  bulks: "bulks",
  bulks_actions: "bulks.actions",
  provisioning: "provisioning",
  data: "data",
  settings: "settings",
  settings_users: "settings.users",
  settings_alarms: "settings.alarms",
  settings_configuration: "settings.configuration",
  orchestration: "orchestration",
})

export const modules = Object.freeze({
    orange: 'orange',
    proxy: 'proxy',
    draas: 'draas',
    provisioning: 'provisioning',
    bulk: 'bulk',
    orchestration: 'orchestration',
    telenet: 'telenet',
    manualActions: 'manualActions',
    npact: 'npact',
    npact_crdb: 'npact_crdb',
    npact_crdb_dd: 'npact_crdb_dd',
    npact_citc: 'npact_citc',
    npact_crdc: 'npact_crdc',
    npact_coin: 'npact_coin',
});

export function supportedModule(mod, modules) {
    return modules.find(m => m === mod || m.includes(mod)) !== undefined;
}

export const privileges = Object.freeze({

});

export const access_levels = Object.freeze({
    'read': 0,
    'modify': 1, // include read
});

const UI_PROFILES = {
    "default": ["user", "admin", "provisioning"],
    "orange": ["user", "admin"],
    "telenet": ["user", "admin", "provisioning", "CPM", "HelpDesk1",  "HelpDesk2",  "HelpDesk3", "VoiceOps", "VoiceEng"],
};

// const HOME_PAGES = {
//     "provisioning": "/provisioning/list",
//     "CPM": "/provisioning/list",
//     "HelpDesk1": "/provisioning/list",
//     "HelpDesk2": "/provisioning/list",
//     "HelpDesk3": "/provisioning/list",
//     "VoiceOps": "/provisioning/list",
//     "VoiceEng": "/provisioning/list"
// };

// export function getHomePage(ui_profile) {
//     if (HOME_PAGES[ui_profile] !== undefined) return HOME_PAGES[ui_profile];
//     else return "/dashboard";
// }

const definition = {
    // give access to all pages for the admin
    admin: Object.keys(pages).reduce((o, page) => Object.assign(o, { [pages[page]]: true }), {}),

    user: {
        [pages.data]: true,
        [pages.requests]: true,
        [pages.bulks]: true,
        [pages.requests_nprequests]: true,
        [pages.data]: true,
        [pages.data_tenants]: true,
    },

    provisioning: {
        [pages.data_tenants]: true,
        [pages.provisioning]: true,
    },

    CPM: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true,
        [pages.edit_group_iad_pra_info_tpid]: true,
        [pages.edit_group_iad_pra_info_circuit_id]: true,
        [pages.edit_group_iad_pra_info_pra_port]: true,
        [pages.edit_group_iad_pra_info_enabled]: true,
        [pages.edit_pra_nat_dst]: true,
        [pages.edit_pra_nat_src]: true,
        [pages.edit_pra_int_src]: true,
        [pages.edit_sip_nat_dst]: true,
        [pages.edit_sip_nat_src]: true,
        [pages.edit_sip_int_src]: true,
        [pages.edit_group_iad_ip1_rtpPortRange]: true,
        [pages.edit_group_iad_ip1_mode]: true,
        [pages.edit_group_iad_ip1_ipv4Address]: true,
        [pages.edit_group_iad_ip1_ipv4Netmask]: true,
        [pages.edit_group_iad_ip1_ipv6Address]: true,
        [pages.edit_group_iad_ip1_ipv6Netmask]: true,
        [pages.edit_group_iad_pbx_IPAddress]: true,
        [pages.edit_group_iad_pbx_port]: true,
        [pages.edit_group_dtmf]: true,
        [pages.edit_group_iad_services_dtmf]: true,
        [pages.edit_group_iad_advanced_isdnTerminationSide]: true,
        [pages.edit_group_iad_advanced_dual_power]: true,
        [pages.edit_group_iad_transportMode]: true,
        [pages.add_access]: true,
        [pages.delete_access]: true
    },

    HelpDesk1: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true
    },

    HelpDesk2: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true,
        [pages.edit_group_iad_pra_info_tpid]: true,
        [pages.edit_group_iad_pra_info_circuit_id]: true,
        [pages.edit_pra_nat_dst]: true,
        [pages.edit_pra_nat_src]: true,
        [pages.edit_pra_int_src]: true,
        [pages.edit_sip_nat_dst]: true,
        [pages.edit_sip_nat_src]: true,
        [pages.edit_sip_int_src]: true,
        [pages.edit_group_iad_ip1_mode]: true,
        [pages.edit_group_iad_ip1_ipv4Address]: true,
        [pages.edit_group_iad_ip1_ipv4Netmask]: true,
        [pages.edit_group_iad_ip1_ipv6Address]: true,
        [pages.edit_group_iad_ip1_ipv6Netmask]: true,
        [pages.edit_group_iad_pbx_IPAddress]: true,
        [pages.edit_group_iad_pbx_port]: true,
        [pages.edit_group_iad_advanced_isdnTerminationSide]: true,
        [pages.edit_group_iad_transportMode]: true
    },

    HelpDesk3: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true,
        [pages.edit_group_iad_pra_info_tpid]: true,
        [pages.edit_group_iad_pra_info_circuit_id]: true,
        [pages.edit_group_iad_pra_info_pra_port]: true,
        [pages.edit_group_iad_pra_info_enabled]: true,
        [pages.edit_pra_nat_dst]: true,
        [pages.edit_pra_nat_src]: true,
        [pages.edit_pra_int_src]: true,
        [pages.edit_sip_nat_dst]: true,
        [pages.edit_sip_nat_src]: true,
        [pages.edit_sip_int_src]: true,
        [pages.edit_group_iad_ip1_rtpPortRange]: true,
        [pages.edit_group_iad_ip1_mode]: true,
        [pages.edit_group_iad_ip1_ipv4Address]: true,
        [pages.edit_group_iad_ip1_ipv4Netmask]: true,
        [pages.edit_group_iad_ip1_ipv6Address]: true,
        [pages.edit_group_iad_ip1_ipv6Netmask]: true,
        [pages.edit_group_iad_pbx_IPAddress]: true,
        [pages.edit_group_iad_pbx_port]: true,
        [pages.edit_group_dtmf]: true,
        [pages.edit_group_iad_services_dtmf]: true,
        [pages.edit_group_iad_advanced_isdnTerminationSide]: true,
        [pages.edit_group_iad_advanced_dual_power]: true,
        [pages.edit_group_iad_transportMode]: true,
        [pages.add_access]: true,
        [pages.delete_access]: true
    },

    VoiceOps: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true,
        [pages.edit_group_iad_advanced_clock_master]: true,
        [pages.edit_group_iad_pra_info_tpid]: true,
        [pages.edit_group_iad_pra_info_circuit_id]: true,
        [pages.edit_group_iad_pra_info_pra_port]: true,
        [pages.edit_group_iad_pra_info_enabled]: true,
        [pages.edit_pra_nat_dst]: true,
        [pages.edit_pra_nat_src]: true,
        [pages.edit_pra_int_src]: true,
        [pages.edit_sip_nat_dst]: true,
        [pages.edit_sip_nat_src]: true,
        [pages.edit_sip_int_src]: true,
        [pages.edit_group_iad_ip1_rtpPortRange]: true,
        [pages.edit_group_iad_ip1_mode]: true,
        [pages.edit_group_iad_ip1_ipv4Address]: true,
        [pages.edit_group_iad_ip1_ipv4Netmask]: true,
        [pages.edit_group_iad_ip1_ipv6Address]: true,
        [pages.edit_group_iad_ip1_ipv6Netmask]: true,
        [pages.edit_group_iad_pbx_IPAddress]: true,
        [pages.edit_group_iad_pbx_port]: true,
        [pages.edit_group_dtmf]: true,
        [pages.edit_group_iad_services_dtmf]: true,
        [pages.edit_group_iad_advanced_sysLogIp]: true,
        [pages.edit_group_iad_advanced_sysLogEnabled]: true,
        [pages.edit_group_iad_advanced_isdnTerminationSide]: true,
        [pages.edit_group_iad_advanced_dual_power]: true,
        [pages.edit_group_iad_transportMode]: true,
        [pages.add_access]: true,
        [pages.delete_access]: true
    },

    VoiceEng: {
        [pages.provisioning]: true,
        [pages.common_page_access]: true,
        [pages.edit_group_iad_advanced_clock_master]: true,
        [pages.edit_group_iad_pra_info_tpid]: true,
        [pages.edit_group_iad_pra_info_circuit_id]: true,
        [pages.edit_group_iad_pra_info_pra_port]: true,
        [pages.edit_group_iad_pra_info_enabled]: true,
        [pages.edit_pra_nat_dst]: true,
        [pages.edit_pra_nat_src]: true,
        [pages.edit_pra_int_src]: true,
        [pages.edit_sip_nat_dst]: true,
        [pages.edit_sip_nat_src]: true,
        [pages.edit_sip_int_src]: true,
        [pages.edit_group_iad_ip1_rtpPortRange]: true,
        [pages.edit_group_iad_ip1_mode]: true,
        [pages.edit_group_iad_ip1_ipv4Address]: true,
        [pages.edit_group_iad_ip1_ipv4Netmask]: true,
        [pages.edit_group_iad_ip1_ipv6Address]: true,
        [pages.edit_group_iad_ip1_ipv6Netmask]: true,
        [pages.edit_group_iad_pbx_IPAddress]: true,
        [pages.edit_group_iad_pbx_port]: true,
        [pages.edit_group_dtmf]: true,
        [pages.edit_group_iad_services_dtmf]: true,
        [pages.edit_group_iad_advanced_sysLogIp]: true,
        [pages.edit_group_iad_advanced_sysLogEnabled]: true,
        [pages.edit_group_iad_advanced_isdnTerminationSide]: true,
        [pages.edit_group_iad_advanced_dual_power]: true,
        [pages.edit_group_iad_transportMode]: true,
        [pages.add_access]: true,
        [pages.delete_access]: true
    }
};

export function limited_menu(ui_profile) {
    return ui_profile === "provisioning" || UI_PROFILES["telenet"].filter(p => !UI_PROFILES["default"].includes(p)).includes(ui_profile);
}

export function get_ui_profiles(m) {
    if(m.includes(modules.orange)) {
        return UI_PROFILES["orange"];
    }
    if(m.includes(modules.telenet)) {
        return UI_PROFILES["telenet"];
    }
    return UI_PROFILES["default"];
}

export function isAllowed(profile, page, requested_level, requested_privilege) {
    // system access all pages
    if (profile === 'system') return true;
    // deny access for unknown profiles
    if (definition[profile] === undefined) return false;
    // deny access to non-explicit page access
    if (definition[profile][page] === undefined) return false;

    const page_access = definition[profile][page];
    if (page_access) return true;

    if (requested_level === undefined && requested_privilege === undefined)
        return page_access.level >= access_levels.read;

    if (requested_level !== undefined) {
        return page_access.level >= requested_level;
    } else {
        return page_access.privileges && page_access.privileges.indexOf(requested_privilege) !== -1;
    }
}

class LocalUser {
  fromObject(user) {
    this.user = user;
  }

  getHomePage() {
    return ((this.user && this.user.profile) ? this.user.profile.home : "/dashboard") || "/dashboard"
  }

  isSystem() {
    return this.user && this.user.is_system
  }

  isAllowed(right) {
    return this.user && (this.isSystem() || (this.user.profile.accesses && this.user.profile.accesses.includes(right)))
  }

  canSee(page) {
    return this.user && isAllowed(this.user.ui_profile, page);
  }

  localizeUtcDate(m) {
    return userLocalizeUtcDate(moment(m), this.user)
  }

  isModuleEnabled(m) {
    return this.user && supportedModule(m, this.user.modules);
  }
}

export const localUser = new LocalUser();
