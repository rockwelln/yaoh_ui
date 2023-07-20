---
sidebar_position: 14
---

# Cache

APIO core nodes can use a Redis server or its internal memory to cache some data.

For Redis, the URI is `redis://<host>:<port>/<db>`. The default port is 6379 and the default database is 0.

For the internal memory, the URI is `memory://`.
