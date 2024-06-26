import React from "react";

import { withRouter } from "react-router";

import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import { Link } from "react-router-dom";

import "./styles.css";

const convertCrumb = crumb => {
  if (crumb === "broadsoft_xsp1_as1") {
    return "PRAoSIP";
  }
  return crumb;
};

//Links and rename path for crumb
const linkByCrumb = (item, lastItem, i, path, match, hash) => {
  const crumb = convertCrumb(item);
  if (crumb === "tenants" && !lastItem.includes(crumb)) {
    return (
      <Link to={`/provisioning/${match.params.gwName}/tenants`}>
        {"Enterprises"}
      </Link>
    );
  }
  if (crumb === "configs" && !lastItem.includes(crumb)) {
    return (
      <Link to={`/provisioning/${match.params.gwName}/configs`}>{crumb}</Link>
    );
  }
  if (crumb === "reconciliations" && !lastItem.includes(crumb)) {
    return (
      <Link to={`/provisioning/${match.params.gwName}/reconciliations`}>
        {crumb}
      </Link>
    );
  }
  if (path[i - 1] === "tenants" && !lastItem.includes(crumb)) {
    return (
      <Link
        to={`/provisioning/${match.params.gwName}/tenants/${item}${
          hash ? hash : ""
        }`}
      >
        {crumb}
      </Link>
    );
  }
  if (path[i - 2] === "tenants" && !lastItem.includes(crumb)) {
    return (
      <Link
        to={`/provisioning/${match.params.gwName}/tenants/${
          path[i - 1]
        }/groups/${crumb}${hash ? hash : ""}`}
      >
        {crumb}
      </Link>
    );
  }
  if (crumb === "iadreboot") {
    return "Mass IAD reboot";
  }
  if (crumb === "addadmin") {
    return "Add admin";
  }
  if (crumb === "addgroup") {
    return "Add group";
  }
  if (crumb === "addphone") {
    return "Add phone";
  }
  if (crumb === "adduser") {
    return "Add user";
  }
  return crumb;
};

//parsing and render breadcrumb
const BreadcrumbComponent = ({ location, match, hash }) => {
  const indexForTrunkUsersLevel = 6;
  const indexForGroupLevel = 4;
  const indexForTenantLevel = 2;
  const indexForConfigLevel = 1;
  const path = location.pathname.split("/").slice(3);

  if (path[indexForTrunkUsersLevel] === "users") {
    path.splice(indexForTrunkUsersLevel, 1);
  }
  if (
    path[indexForGroupLevel] === "users" ||
    path[indexForGroupLevel] === "admins" ||
    path[indexForGroupLevel] === "trunkgroup" ||
    path[indexForGroupLevel] === "iad" ||
    path[indexForGroupLevel] === "enterprisetrunk"
  ) {
    path.splice(indexForGroupLevel, 1);
  }
  if (
    path[indexForTenantLevel] === "groups" ||
    path[indexForTenantLevel] === "admins"
  ) {
    path.splice(indexForTenantLevel, 1);
  }
  if (path[indexForConfigLevel] === "reconciliationteam") {
    path.splice(indexForConfigLevel, 1);
  }

  const lastItem = path.slice(-1);
  return (
    <Breadcrumb>
      {path.map((item, i) => (
        <Breadcrumb.Item active key={String(i)}>
          {linkByCrumb(item, lastItem, i, path, match, hash)}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default withRouter(BreadcrumbComponent);
