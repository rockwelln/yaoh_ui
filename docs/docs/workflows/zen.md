---
sidebar_position: 3
---

# Zen

## Keep your workflow clean

* Use subworkflows when a group of nodes can be reused in multiple workflows.

* Use the labels and the descriptions to store information about your workflow.

* When writing templates, try to keep them as simple as possible. If you need to write a complex template, consider using internal variables.

:::danger Bad

``` jinja2
{% for u in (request.body|rest2dict).users|selectattr(email)|list %}{{u|pp_dict}}{% endfor %}
```

:::

:::tip Good

``` jinja2
{% set body = request.body|rest2dict %}
{% set users_with_mail = body.users|selectattr(email) %}

{% for u in users_with_mail|list %}
    {{u|pp_dict}}
{% endfor %}
```

:::

## Use the right node for the right job

* Prefer the node [multiple context setter](nodes/#multiple-context-setter) over the node [Context setter](nodes/#context-setter) when you need to set multiple contexts.

* Prefer the [macro](nodes/#macro) when you have only one input to run a subworkflow. It will give you a cleaner workflow than extracting the response from subworkflows by hand.

## Be secure

Workflows give you maximum of flexibility but still, you need to be careful about the security of your data. Here are some tips to help you to keep your data safe.

* Use environment variables to store your credentials.

* Careful with the user input. If you need to use user input, make sure to validate it before using it.

* Careful with user right, especially when the user is authenticated with SSO mechanisms.

## Be profitient in the template language

* The more you will know the template language, the more you will be able to write complex workflows in a simple but efficient way.

* Use built-in filters and tests when possible. They are faster than the custom ones. And cleaner than making a lot of `if` statements or loops.

* Use the template playground to test your templates before having hard time debugging a complete workflow.

## Be part of the community

* Join us on Slack to share your workflows, your ideas and to get help from the community.
