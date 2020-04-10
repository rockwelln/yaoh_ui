# HTTP / JSON call

## rest_call
This the default implementation to make HTTP / REST calls to other parties.



## proxy_call
(only available in a proxy environment)

This will forward the original call (trigger of the workflow) to some other session holder.

typical use case: when an endpoint is overwritten,
it might be easy to forward the original call and then do some additional processing.



## proxy_session_call
(only available in a proxy environment)

This will make an HTTP / REST call using the session of the user who triggered the workflow.

typical use case: a user is logged against a proxied backend (e.g Broadworks)
and the workflow want to make some call(s) on behalf of the user (inheriting its session - including user level, capabilities, etc...)

