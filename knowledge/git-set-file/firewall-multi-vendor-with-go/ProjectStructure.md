firewall-dashboard/
├── cmd/
│   └── main.go
├── internal/
│   ├── common/
│   │   └── models.go
│   ├── paloalto/
│   │   ├── client.go
│   │   └── handlers.go
│   └── fortinet/
│       ├── client.go
│       └── handlers.go
├── static/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── mock/
│   ├── paloalto/
│   │   ├── dashboard.json
│   │   ├── inventory.json
│   │   ├── licenses.json
│   │   ├── logs.json
│   │   ├── cli.json
│   │   └── config.json
│   └── fortinet/
│       ├── dashboard.json
│       ├── inventory.json
│       ├── licenses.json
│       ├── logs.json
│       ├── cli.json
│       └── config.json
├── go.mod
├── go.sum
└── README.md