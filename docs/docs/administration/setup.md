---
sidebar_position: 1
---

# Setup

## Requirements

APIO core platform is a set of microservices that can be deployed on a single server or on multiple servers.

The following requirements are for a single server deployment:

* 4 CPU cores
* 16 GB RAM
* 50 GB disk space

## Installation

You can install APIO core platform on multiple ways:

* Using [docker-compose](#docker-compose) with the official [docker images](https://)
* Using [deb packages](#deb-packages)
* Using [rpm packages](#rpm-packages)

### docker-compose

The below [docker-compose](https://docs.docker.com/compose/) configuration can be used to start an APIO core server with a single proxy.

It relies on a number of environment variables that you must set before running `docker-compose up`. The variables are described below.

```yaml
# docker-compose.yml
version: '3'

services:
  nginx:
    image: nginx:latest
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - apio
      - px1
    restart: always
  
  apio:
    image: docker.bxl.netaxis.be/apio:latest
    ports:
      - 5000:5000
    volumes:
      - static-www:/usr/www
    restart: always

  px1:
    image: docker.bxl.netaxis.be/px1:latest
    ports:
      - 5000:5000
    restart: always

volumes:
    static-www:
```

If processes run nodes like docker containers they require access to the host machine's Docker daemon:

```yaml
# docker-compose.yml
version: '3'

services:
  [...]
  apio:
    [...]
+   volumes:
+     - /var/run/docker.sock:/var/run/docker.sock

  px1:
    [...]
+   volumes:
+     - /var/run/docker.sock:/var/run/docker.sock
```

## Time to start

### The Docker way

```bash
$ docker-compose up -d
```

## Create the first superuser

When the APIO core platform is started for the first time, you must create the first user. This user will be the administrator of the platform.

### The Docker way

```bash
$ docker-compose run --rm core /usr/local/go/server -newsuperuser
```

By default the username is 'netaxis'.

:::caution

The password is automatically generated and displayed in the console. You must copy it and store it in a safe place.

:::
