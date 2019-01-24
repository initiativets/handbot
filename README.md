![Initiativet](http://initiativet.se/wp-content/uploads/2017/11/Initiativet_gr%C3%B6n-vit_2018.png)

# Handbot

Handbot is a bridge that allows the static website (Initativet Handbook)[https://github.com/initiativets/handbook] to access GitHub functionality. It facilitates the workflow of the `Handbook editorial process` - authentication, key management, creating issues for editing handbook content, setting labels, adding issues to the editorial project.

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

Start service: `sudo systemctl start node-app`

*DONE*

---

Reload service after changes: `systemctl daemon-reload`

Stop service: `sudo systemctl stop node-app`

View service status: `systemctl status node-app`

Service journal/log: `journalctl -u node-app.service`
