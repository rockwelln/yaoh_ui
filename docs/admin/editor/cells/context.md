# Context manipulation

## context_setter

Set a context key of the workflow with some value.

### parameters

| name  | type   | description                                              | sample                                                 |
|-------|--------|----------------------------------------------------------|--------------------------------------------------------|
| key   | string | the key to be set in the context                         | some_key                                               |
| value | jinja  | some template to interpreted to set the value of the key | {{ request.body.username }} ({{ request.body.email }}) |

### samples

tbc...

## sync_response

Set the response for a workflow in the context of a synchronous call.

Internally it works the same as "context_setter" but set a fixed key \*response\*

## callback_response

Set the callback response for a workflow.

Internally it works the same as "context_setter" but set a fixed key \*cb_response\*
