---
sidebar_position: 2
---

# Entities

Entities are special nodes that can be used to represent an external process or system which is not managed by APIO but which can interract with the workflow.

For instance, the workflow contacts some system to order a product. The system accept the order but will send a confirmation later. That confirmation can be provided to the workflow by an entity.

## Configuration

### Create a user

To interract with APIO, a system needs to be authenticated. So a particular user is required.

In the page `System > Users` you can create a new user.

Note at the bottom, the `Entity` attribute, it's required to put here the entity name matching the one you will use in the workflow definition.

:::tip

Probably external systems will not be able to use the `/login` API to authenticate. So you will have to generate a token for that user and provide it to the external system.

:::

:::caution

Entities should have a very limited role and access rights. They should only be able to perform the actions they are supposed to do.

:::

### Place an entity

In your workflow, place an entity node with the outputs matching the events you want to receive and manage from the external system.

## Usage

The external system will need to call the API `/api/v01/transactions/<instence-id>/events` with the appropriate credentials and body to send the event to the workflow.

```http
POST /api/v01/transactions/<instence-id>/events HTTP/1.1
Host: <your-domain>
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "<event-name>",
  "value": "value"
}
```

:::caution

An entity node can be present only once in a workflow. *But* it can be called multiple times over the lifecycle of the instance (even with the same event).

:::