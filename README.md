# Handbot

Handbot is a bridge that allows the static website [Initativet Handbook](https://github.com/initiativets/handbook) to access GitHub functionality. It facilitates the workflow of the `Handbook editorial process` - authentication, key management, creating issues for editing handbook content, setting labels, adding issues to the editorial project.

## Installation on Digital Ocean

- 1 GB Memory
- 25 GB Disk
- LON1
- Ubuntu 16.04.5 x64

### 1. Clone from GitHub

`git clone https://github.com/initiativets/handbot.git`

### 2. .env

Rename template `.env` and fill with values from GitHub.

### 3. Private key

Download private key from GitHub. Place in root folder with name `private-key.pem`.

### 4. Build

`npm run build`

### 5. Configure a service

So the systems starts on boot.

Create service config file: `vim /lib/systemd/system/node-app.service`

```
[Unit]
Description=handbot
Documentation=https://example.com
After=network.target

[Service]
WorkingDirectory=/root/handbot
Environment=NODE_PORT=3000
Type=simple
User=root
ExecStart=/usr/bin/npm run start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 6. Configure SSL Certificate (Let's Encrypt)

Follow these guides:

https://medium.com/@yash.kulshrestha/using-lets-encrypt-with-express-e069c7abe625
https://www.sitepoint.com/how-to-use-ssltls-with-node-js/
https://certbot.eff.org/docs/using.html#webroot

And remember - Let's Encrypt certificates only last 3 months, don't forget to renew!

```
Your cert will expire on 2019-04-26. To obtain a new or tweaked
version of this certificate in the future, simply run certbot
again. To non-interactively renew *all* of your certificates, run
"certbot renew"

```

### 7. Start service

Start service: `sudo systemctl start node-app`

*DONE!*

---

Reload service after changes: `systemctl daemon-reload`

Stop service: `sudo systemctl stop node-app`

View service status: `systemctl status node-app`

Service journal/log: `journalctl -u node-app.service`
