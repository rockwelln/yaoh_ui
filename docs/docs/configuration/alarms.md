---
sidebar_position: 10
---

# Alarms

APIO core can send alarms reports with emails.

## Support system clear

The support system clear alarm is a flag to indicate that the system can clear the alarm automatically if the issue is resolved.

## Northbound errors

HTTP status returned greater or equal to 500 are counted as northbound errors.

## Southbound HTTP errors

HTTP status received greater or equal to 500 are counted as southbound HTTP errors.

## Network issues

Network issues includes timeouts, DNS errors, connection errors, etc. And they are counted per gateway (client session).
