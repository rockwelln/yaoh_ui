# External actions

Some workflows involve manual actions.

## An action for known / logged users

Use case: Wait for a trigger from a external action, to be realized by a known / logged in user.

### Define a role for users

In the page `System > Users > Roles`:

![new user role](./images/new-user-role-button.png "new user role")
![new user role](./images/new-user-role.png "new user role")

### Assign the role to someone

In the user details, go to the 'Roles' tab.

![assign user role](./images/check-user-role-tab.png "assign new user role")
![assign user role](./images/assign-user-role.png "assign new user role")

### Add a manual action your workflow

![new manual action](./images/new-trigger_manual_action.png "new manual action")

### Trigger your workflow

Because the workflow contains a manual action, it doesn't make sense to link it to a synchronous route.

![custom route on manual action](./images/custom-route-manual-action.png "custom route on manual action")

```shell script
curl -H "Authorization: Bearer <user token>" \
    http://<host>/api/v01/custom/test_1
```

And the platform returns the instance id of the workflow created:
```json
{"id": 77}
```

### Trigger the action

The action will be visible in the details of the workflow instance _but_ only a user with the correct role assigned will be able to trigger it.

In the instance details page (e.g `http://<host>/transactions/77`)

![action required](./images/request-action-required.png "action required")

When triggered, the answer is recorded and the workflow move forward.

![action triggered](./images/request-action-trigger.png "action triggered")

## Actions from unauthenticated users

Use case: Put the trigger directly in a mail (as a link for instance).

### Generate an OTT

To securely produce a link to let unauthenticated users to trigger an action, an OTT is needed.

![new ott](./images/manual-action-generate_ott.png "new ott")

### Add a manual action in your workflow

![manual action with ott](./images/manual-action-with-ott.png "manual action with ott")

### Share the OTT with the right person(s)

The action to be prepared in the workflow instance will be available with the following HTTP link:
```http request
GET http://<host>/api/v01/transactions/manual_actions?output=<answer>&ott=<ott>
```

This way, this link can be used in an html button href for instance.

This link can be send by mail, shown on a page or shared via any mean.  
When the user will click the link, he will trigger the action directly (no login required).

### Trigger your workflow

Because the workflow contains a manual action, it doesn't make sense to link it to a synchronous route.

```shell script
curl -H "Authorization: Bearer <user token>" \
    http://<host>/api/v01/custom/test_1
```

And the platform returns the instance id of the workflow created:
```json
{"id": 78}
```

### Trigger the action

The action may be triggered with an HTTP call:

```shell script
curl http://<host>/api/v01/transactions/manual_actions?output=<answer>&ott=<ott>
```
