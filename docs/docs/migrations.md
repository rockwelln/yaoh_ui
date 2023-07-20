---
sidebar_position: 7
---

# Migrations

Some versions need some changes to the server configuration or the database.

## &lt; 2.10.0 to &gt;= 2.11.0

The encryption 'Fernet32' is not supported anymore. So the internal key `document-storage` is not valid anymore.
You can force the migration to the new encryption by running the following command directly on the database:

```sql
UPDATE keys SET label = 'document-storage-old' WHERE label = 'document-storage';
```

## &lt; 0.23.2 to &gt;= 2.10.x

Because the engine was entirely rewritten, the database schema has changed. The last version of the database structure in the 0.x branch is required before upgrading to 2.x versions.

Also, there is no configuration file anymore. The configuration is stored in the database.

### In 2 steps

1. Upgrade to the last version of the 0.x branch (0.23.2)
2. Upgrade to the 2.x version

### Supervisord

:::info

If possible (no customer specific limitation), it's recommended to move to Docker.

:::

The environment and the command changed.

```ini
[program:api_server]

; was:
environment=APIO_CONFIG_FILE=/etc/apio.yml,APIO_OPENID_AUTH=n
command=/opt/apio/bin/python -m broadsoft_apio_api.server

; now:

; note the uppercase for the variables is !important!
environment=DB=postgresql://apio:secret@postgres/apio
command=/usr/local/go/server -workflows -port=5000 -host=0.0.0.0 -cleanup

;...

[program:proxy_server]

; was:
environment=APIO_CONFIG_FILE=/etc/apio_p1.yml,APIO_OPENID_AUTH=n
command=/opt/broadsoft_apio/bin/python -m broadsoft_apio_api.server_proxy

; now:

environment=DB=postgresql://apio:secret@postgres/apio
; note the "proxy" mapping, the "bwks needs to match the target gateway name in the APIO core configuration in the database!
command=/usr/local/go/server -workflows -port=5000 -host=0.0.0.0 -proxy=/api/v01/p1:bwks -runMigration=false
```

### Docker

```yaml
# ...
services:
  # ...
  # was:
  apiocore:
    command: python3 -m broadsoft_apio_api.server
    environment:
      - host=0.0.0.0
      - db=postgresql://apio:secret@postgres/apio
      - proxy_login_url=default=https://1.2.3.4:8443/api/v1/login/,p1=https://10.0.2.3/api/v1/login/

  # now:
  apiocore:
    command: /usr/local/go/server -workflows -port=5000 -host=0.0.0.0 -cleanup
    environment:
      # note the uppercase for the variables is !important!
      - DB=postgresql://apio:secret@postgres/apio

  # ...
  # was:
  px1n:
    command: python3 -m broadsoft_apio_api.server_proxy
    environment:
      - host=0.0.0.0
      - port=5001
      - db=postgresql://apio:secret@postgres/apio
      - proxy_url=https://10.0.1.2/api/v1/
      - proxy_username=username
      - proxy_password=secret
      - proxy_prefix=/api/v01/p1
      - proxy_name=p1

  # now:
  px1:
    # note the "proxy" mapping, the "bwks needs to match the target gateway name in the APIO core configuration in the database!
    command: /usr/local/go/server -workflows -port=5000 -host=0.0.0.0 -proxy=/api/v01/p1:bwks -runMigration=false

    environment:
      # note the uppercase for the variables is !important!
      - DB=postgresql://apio:secret@postgres/apio
# ...
```