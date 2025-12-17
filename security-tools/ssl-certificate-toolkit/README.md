# 🔐 SSL Certificate Toolkit Pro

A **100% client-side, privacy-first SSL/TLS certificate toolkit** built for security engineers, DevOps, cloud architects, and PKI practitioners.

This toolkit runs **entirely in your browser** (GitHub Pages–friendly) with **no backend, no uploads, no data storage**. All cryptographic materials remain in memory and are cleared when the page is closed.

---

## 🌐 Live Demo

👉 **GitHub Pages:** [https://bala-murugan-s.github.io/security-tools/ssl-certificate-toolkit](https://bala-murugan-s.github.io/security-tools/ssl-certificate-toolkit)

---

## 🔒 Privacy & Security Guarantees

* ✅ 100% client-side execution
* ✅ No server, API, or backend dependencies
* ✅ No data uploaded, stored, or transmitted
* ✅ All operations performed in browser memory only
* ✅ Safe to use with sensitive certificates and private keys

---

## ✨ Features Included

* **CSR Generation**
* **Self-Signed Certificate Creation**
* **Certificate & Key Format Converters**
* **Certificate Analysis & Linting**
* **Certificate Comparison**
* **Bulk Certificate Audit**
* **Chain Builder & Validator**
* **Hash & Fingerprint Calculator**
* **OpenSSL / Keytool Command Builder**
* **Certificate Bundle Creator**
* **Visualization Tools**
* **Config Generator (PKI / TLS related)**

---

## 🔄 Certificate & Key Converters

Supported conversions include:

### PEM

* PEM → DER
* PEM → PKCS#7 (P7B)
* PEM → PFX (PKCS#12) *(command-assisted)*

### DER

* DER → PEM

### PKCS#7

* PKCS#7 → PEM

### PFX / PKCS#12

* PFX → PEM *(certificate / key / chain extraction via OpenSSL commands)*

### CSR

* CSR → PEM
* CSR → DER

> ⚠️ **Note:** True PFX/JKS generation requires OpenSSL or keytool. The toolkit safely generates **authoritative commands** instead of performing unsafe in-browser crypto.

---

## 🧪 Verify & Analyze

* Paste or upload certificates, CSRs, or keys
* Decode X.509 fields
* View validity, issuer, subject, SANs
* Detect common misconfigurations
* Lint-style validation for best practices

---

## 🔍 Compare Certificates

* Compare two certificates side-by-side
* Highlight differences in:

  * Subject / Issuer
  * Validity period
  * SAN entries
  * Public key details
  * Signature algorithm

---

## 📦 Bulk Audit

* Upload multiple certificates
* Expiry detection
* Weak algorithm identification
* Batch visibility for enterprise audits

---

## 🔗 Chain Builder

* Build and validate certificate chains
* Detect missing intermediates
* Visualize trust hierarchy

---

## 🔑 Hash & Fingerprint Tools

* SHA-1 / SHA-256 / SHA-512 fingerprints
* Certificate digest verification

---

## 🧰 Command Builder

* OpenSSL commands for:

  * CSR generation
  * Certificate conversion
  * PFX creation
  * Key encryption / decryption
* Keytool commands for JKS workflows

---

## 📦 Bundle Creator

* Create combined PEM bundles
* Certificate + key + chain ordering
* Ready for:

  * NGINX
  * Apache
  * Load balancers
  * Firewalls
  * Cloud services

---

## 📊 Visualization Tools

* Human-readable certificate breakdown
* Visual trust relationships

---

## 🏗️ Project Structure

```
ssl-toolkit/
│── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── core.js
│   ├── helpers.js
│   ├── ui.js
│   ├── csr.js
│   ├── selfsigned.js
│   ├── converters.js
│   ├── analysis.js
│   ├── compare.js
│   ├── bulk-audit.js
│   ├── chain.js
│   ├── hash.js
│   ├── cmd-builder.js
│   ├── bundle.js
│   ├── visualize.js
│   ├── config-generator.js
│   ├── advanced-tools.js
│   └── script.js
│
└── README.md
```

---

## 🚀 Technology Stack

* Vanilla **HTML / CSS / JavaScript**
* No frameworks
* No external crypto libraries
* Designed for GitHub Pages

---

## 🎯 Intended Audience

* Security Engineers
* Network & Firewall Engineers
* DevOps & SREs
* Cloud Architects
* PKI Administrators
* Blue Team / Red Team professionals

---

## ⚠️ Disclaimer

This toolkit is designed for **analysis, conversion, and command generation**.

* It does **not** replace OpenSSL for cryptographic operations
* It intentionally avoids unsafe browser-based key material generation
* Always validate outputs in controlled environments

---

## 

**Balamurugan Sivaraman**
Security Consultant | Network | Cloud | SD-WAN | PKI

📍 Chennai, India

---

## ⭐ Contributions & Feedback

Suggestions, improvements, and feedback are welcome.

If you find this toolkit useful, consider ⭐ starring the repository.

---

🔐 *Built with security-first principles. No tracking. No data collection. No compromise.*
