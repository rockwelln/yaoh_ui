---
sidebar_position: 2
---

# Templates

Most fields in the nodes can be evaluated as templates. The template engine is [Jinja2](https://jinja.palletsprojects.com/) and expose all the [buit-in's](https://jinja.palletsprojects.com/en/3.1.x/templates/#list-of-builtin-filters) of the language.

To debug easily such fields, you can use the [playground](/help/template-playground).

It is extended with the following elements.

## Filters

[From Jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/#list-of-builtin-filters)

| Filter | Description | Sample |
| --- | --- | --- |
| pp_dict | turn an object into a pretty-printed JSON string representation | {{ {'a': 1, 'b': 2} &#124; pp_dict }} |
| dict_filter | filter a dictionary with a set of keys | {{ {'a': 1, 'b': 2, 'c': 3} &#124; dict_filter(['a', 'b']) }} |
| json_query | inspect a JSON object with a JMESPath query | {{ {'a': 1, 'b': 2, 'c': 3} &#124; json_query('a') }} |
| url_qs | parse a URL query string into a dictionary | {{ 'a=1&b=2&c=3' &#124; url_qs }} |
| url_raw_query | parse a URL query string | {{ 'a=1&b=2&c=3' &#124; url_raw_query }} |
| json | parse a JSON string into a dictionary | {{ '{"a": 1, "b": 2, "c": 3}' &#124; json }} |
| url_path | extract the path from a URL | {{ 'http://localhost:8080/api/v01/public/demo' &#124; url_path }} |
| combine | merge dictionaries | {{ {'a': 1, 'b': 2} &#124; combine({'c': 3}) }} |
| rest2dict | parse a REST call response into a dictionary (note: it automatically parse a `body` property as a JSON string into an object) | {{ rest2dict(rest) }} |
| regex_replace | use a regular expression to replace a string | {{ 'hello, world' &#124; regex_replace('hello', 'goodbye') }} |
| regex_findall | use a regular expression to find all matches in a string | {{ 'hello, world' &#124; regex_findall('l') }} | 
| regex_search | use a regular expression to search a string | {{ 'hello, world' &#124; regex_search('l') }} |
| unique | exclude duplicates from a list | {{ [1, 2, 3, 1, 2, 3] &#124; unique }} |
| intersect | intersect two lists | {{ [1, 2, 3] &#124; intersect([2, 3, 4]) }} |
| difference | difference between two lists | {{ [1, 2, 3] &#124; difference([2, 3, 4]) }} |
| union | union of two lists | {{ [1, 2, 3] &#124; union([2, 3, 4]) }} |
| min | minimum value of a list | {{ [1, 2, 3] &#124; min }} |
| max | maximum value of a list | {{ [1, 2, 3] &#124; max }} |
| b64encode | base64 encode a string | {{ 'hello, world' &#124; b64encode }} |
| b64decode | base64 decode a string | {{ 'aGVsbG8sIHdvcmxk' &#124; b64decode }} |
| phonenumber_valid | check if a phone number is valid | {{ '+33612345678' &#124; phonenumber_valid }} |
| phonenumber_e164 | convert a phone number to E164 format | {{ '+33612345678' &#124; phonenumber_e164 }} |
| phonenumber_cc | extract the country code from a phone number | {{ '+33612345678' &#124; phonenumber_cc }} |
| phonenumber_cca | extract the country code from a phone number in alpha-2 format | {{ '+33612345678' &#124; phonenumber_cca }} |
| phonenumber_type | extract the type of a phone number | {{ '+33612345678' &#124; phonenumber_type }} |
| strftime | format a date | {{ '2021-01-01' &#124; strftime('%Y-%m-%d') }} |
| to_datetime | convert a string to a datetime object | {{ '2021-01-01' &#124; to_datetime }} |
| to_bool | convert a string to a boolean (evaluate to true: "yes", "on", "1", "true", 1) | {{ 'true' &#124; to_bool }} |

## Tests

[From Jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/#list-of-builtin-tests)

| Test | Description | Sample |
| --- | --- | --- |
| startswith | check if a string starts with a substring | {{ 'hello, world' &#124; startswith('hello') }} |
| endswith | check if a string ends with a substring | {{ 'hello, world' &#124; endswith('world') }} |

## Functions

| Function | Description | Sample |
| --- | --- | --- |
| now | compute the current date and time | {{ now() }} |
| timedelta | apply a delta to a date | {{ now() &#124; timedelta(days=1) }} |
| utcnow | compute the current date and time in UTC | {{ utcnow() }} |
| uuid | generate a UUID | {{ uuid() }} |
| randint | generate a random integer | {{ randint(1, 10) }} |

## Variables

[Assignments from Jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/#assignments)

| Variable | Description |
| --- | --- |
| request | the current request object.<br></br> Use <code>{{ (request.body &#124; rest2dict).&lt;property&gt; }}</code> to access request body triggered by an HTTP custom endpoint |
| instance | the current instance object running a workflow with the following attributes: <ul><li>id</li><li>guid</li><li>callback_task_id</li><li>user_id</li><li>original_request_id</li><li>label</li></ul> |
| context | a key-value map attached to the current workflow instance |
| tasks | tasks ran until there with their status |
| sub_instances_responses | "callback" responses produced by sub-instances |
| parent_instance_context | context of the parent instance (only filled in sub-instance) |
| settings | a dictionary containing the settings of the platform (sensitive content are removed for security reason) |
| env | a dictionary containing the environment variables of the platform |
| proxy_name | the name of the proxy (only filled in processes started with proxy binding) |
| worker_env | a dictionary containing the environment variables of the worker process (note: it allows to attach different values depending on the running location) |
| user | the user object of the current user (only filled when the instance has an owner defined) |
