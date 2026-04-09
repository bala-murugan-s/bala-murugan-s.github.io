# NetDiag 🔍

NetDiag is a lightweight network diagnostics tool written in Go. It provides essential utilities like **Ping**, **DNS lookup**, and **SSL certificate inspection** through a simple web interface.

---

## 🚀 Features

* ✅ Ping remote hosts
* 🌐 DNS lookup (A, CNAME, etc.)
* 🔐 SSL certificate inspection
* 📅 Certificate expiry tracking
* ⚡ Fast and lightweight Go backend
* 🖥️ Simple web UI with templates and static assets

---

## 📁 Project Structure

```
netdiag/
├── main.go
├── go.mod
├── handlers/
│   └── handlers.go
├── tools/
│   ├── ping/
│   │   └── ping.go
│   ├── dns/
│   │   └── dns.go
│   └── ssl/
│       └── ssl.go
├── templates/
│   └── index.html
└── static/
    ├── css/main.css
    └── js/app.js
```

---

## 🧩 Architecture

* `main.go` → Entry point, starts the HTTP server
* `handlers/` → Handles HTTP requests and responses
* `tools/` → Core diagnostic logic:

  * `ping/` → Ping functionality
  * `dns/` → DNS resolution
  * `ssl/` → SSL certificate analysis
* `templates/` → HTML templates
* `static/` → CSS & JavaScript assets

---

## ⚙️ Installation

### 1. Clone the repository

```
git clone https://github.com/bala-murugan-s/bala-murugan-s.github.io/tree/main/knowledge/git-set-file/netdiag.git
cd netdiag
```

### 2. Initialize Go modules (if needed)

```
go mod tidy
```

### 3. Run the application

```
go run main.go
```

---

## 🌐 Usage

1. Start the server
2. Open your browser
3. Visit:

```
http://localhost:21121
```

4. Use the UI to:

   * Ping a host
   * Perform DNS lookups
   * Inspect SSL certificates

---

## 🔐 SSL Inspection Details

The SSL module extracts:

* Certificate Subject & Issuer
* Common Name (CN)
* SANs (Subject Alternative Names)
* Expiry date & days remaining
* Key size & algorithm
* OCSP & CRL endpoints

---

## 🛠️ Tech Stack

* **Go (Golang)** – Backend
* **HTML/CSS/JS** – Frontend
* **crypto/x509, crypto/tls** – SSL handling

---

## 📌 Future Improvements

* [ ] Add traceroute support
* [ ] WHOIS lookup
* [ ] API endpoints (JSON responses)
* [ ] Docker support
* [ ] Authentication & rate limiting

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a PR.

---


## 💡 Author

Built with ❤️ using Go
