---
sidebar_position: 11
---

# Cleanup

APIO core can cleanup the history data in the database automatically.

:::info

Performed at night, the cleanup process will remove the old data from the database.

:::

:::tip

Platform administrators may want to cleanup instances triggered with an HTTP method 'GET' before the others to avoid the accumulation of data. That's why the cleanup process can be configured to cleanup those instances earlier. (same for scheduled jobs)

:::
