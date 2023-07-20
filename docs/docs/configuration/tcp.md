---
sidebar_position: 2
---

# TCP

Aside of HTTP clients, APIO core also supports a bunch of other protocols on top of TCP.

The protocol is selected by the scheme of the URL. For example, `ftp://example.com` will use the FTP protocol.

## Raw TCP

Sample: tcp://10.20.30.40

![Raw TCP](img/new-tcp-gateway.png)

The raw TCP protocol is used to connect to a remote server and to send and receive raw data.

## (s)FTP (File Transfer Protocol)

Sample: ftp://john:secret@example.com

Default port: 21

The FTP protocol is used to transfer files between a client and a server.

## SSH (Secure Shell)

Sample: ssh://192.168.10.20

Default port: 22

![SSH](img/new-tcp-ssh.png)

The SSH protocol is used to connect to a remote server and to execute commands on it.

The authentication is done using a username and a password or a private key.

## Broadsoft (OCI-P)

Sample: ocip://m-xsp-01.example.com

Default port: 2208

:::tip

It also supports the OCI protocol over TLS. The scheme is `ocips://`.

:::

The Broadsoft OCI-P protocol is used to communicate with the Broadsoft platform. It is used to manage the users, the groups, the services, the devices, etc.