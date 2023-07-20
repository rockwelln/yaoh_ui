---
sidebar_position: 3
---

# Webhooks

Some requests processed by APIO core can trigger webhooks. A webhook is a HTTP request sent to a specific URL. The URL is configured in the Webhooks section of the settings menu.

:::caution

Webhooks require an extra process to be started. This process is called `webhooks`. It is not started by default. You must add it manually.

:::

## Configuration

The webhook configuration is composed of the following fields:

- **Active**: If the webhook is active or not.
- **Name**: The name of the webhook.
- **Target**: The URL of the webhook.
- **Secret**: An optional secret used to be included in the webhook payload. This secret can be used to authenticate the webhook.
- **Custom header**: An optional custom header to be included in the webhook payload.
- **Custom header value**: The value of the custom header.
- **Basic auth. username**: An optional username to be used for basic authentication.
- **Basic auth. password**: An optional password to be used for basic authentication.
- **Events**: The events that trigger the webhook.

## Events

Any custom route call can trigger a webhook. The webhook is triggered when the custom route call is completed and successful.

A webhook event is configured with the following fields:

- **Label**: The name of the event.
- **Method**: The HTTP method of the custom route call.
- **URL**: A regular expression matching the URL of the custom route call.

## Payload

The webhook payload is a JSON object containing the following fields:

- **event**: The webhook event definition with its id and label.
- **id**: A unique id for the webhook call visible in the webhook history.
- **request**: The request received by the custom route call.
- **response**: The response sent by the custom route call.
- **secret**: The secret configured in the webhook definition (if any).

```json
{
    "event": {"id": 1, "label": "event-1"},
    "id": "70195486-8934-4a31-a504-a97a72c7f322",
    "request": {
        "tag": "tag-1",
        "method": "post",
        "url": "/api/v01/some/url/path",
        "body": {"foo": "bar"}
    },
    "response": {"status": 200, "body": {}},
    "secret": "secret-1"
}
```
