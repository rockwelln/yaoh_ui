---
sidebar_position: 1
---

# Requests

Every request sent to APIO core is logged in the database. So a user can see the history of the requests. Search for activities or issues and see the details of each request.

## Search

The possible search criteria are (they can be influenced by the combination of modules activated in the GUI section of the configuration):

- **Workflow**: The activity of the request.
- **Owner**: The user who triggered the request.
- **Workflow status**: The status of the workflow (this is an internal status indicating if the workflow is either `active`, `completed` or `completed with errors`).
- **Request status**: The status of the request. (this is a status which can be set by the workflow itself).
- **Pending action role**: The role of the user who should perform an action on the request.
- **Tenant ID**: When integrated with Broadsoft, the tenant ID is the Broadsoft enterprise ID.
- **Site ID**: When integrated with Broadsoft, the site ID is the Broadsoft group ID.
- **Number**: When integrated with Broadsoft, the number is the Broadsoft user ID.
- **Proxy host**: The host of the proxy used to process the request.
- **Proxy status**: The HTTP status code of the proxy response.
- **Proxy URL**: The URL called on the proxy process.
- **Proxy method**: The HTTP method of the proxy request.
- **Created on**: The date when the request was created.
- **With tasks in error**: The request contains tasks in error.
- **With 'end' in error**: The request contains an 'end' task in error.

:::info

When the Broadsfot integration is enabled, and the request is not overloaded by custom routes, the request doesn't trigger any workflow instance. In this case, it has no workflow.

:::

## Request details

## Proxied request details

Because there is no workflow executed on this request, the view is very simplified.
