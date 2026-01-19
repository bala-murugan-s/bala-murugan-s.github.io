# Zscaler Visual & CLI-Driven Handbook

> A comprehensive, visual troubleshooting guide for Zscaler Internet Access (ZIA), Zscaler Private Access (ZPA), and Zero Trust Network Architecture (ZTNA) - designed for L2/L3 engineers, architects, and interview preparation.

[![GitHub Pages](https://img.shields.io/badge/Demo-Live-success)](https://your-username.github.io/zscaler-visual-handbook/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 Purpose

This handbook bridges the gap between theoretical documentation and real-world operational expertise. It provides:

- **Visual Learning**: ASCII diagrams and flowcharts that illustrate complex architectures
- **CLI-Driven Troubleshooting**: Command-line style outputs for debugging scenarios
- **Incident Response**: P1/P2 scenarios with step-by-step resolution paths
- **Interview Preparation**: Architectural deep-dives and common technical questions
- **Enterprise Context**: Multi-cloud, hybrid, and large-scale deployment patterns

---

## 👥 Target Audience

| Role | Use Case |
|------|----------|
| **L2/L3 Network Engineers** | Troubleshooting production incidents, understanding traffic flows |
| **Security Operations** | SSL inspection issues, DLP configuration, policy debugging |
| **Cloud Architects** | ZPA app segment design, connector placement, SASE integration |
| **Interview Candidates** | Technical deep-dives, architectural decisions, best practices |
| **Zscaler Administrators** | Configuration validation, change management, SLA monitoring |

---

## ✨ Features

### 🔹 Core Content (Phase 1 - Complete)

- **Zscaler Architecture**
  - ZIA cloud architecture and traffic flow
  - ZPA broker/connector model
  - ZTNA principles and enforcement
  
- **ZIA Deep Dive**
  - Forwarding methods (PAC, GRE, IPsec, Cloud Connector)
  - SSL inspection (break-and-inspect vs. passive)
  - URL filtering and policy enforcement
  - DLP and CASB integration
  
- **ZPA Deep Dive**
  - Application segment design
  - Connector deployment strategies
  - User-to-app access flow
  - Troubleshooting invisible apps
  
- **Tunnel Technologies**
  - GRE tunnels (configuration, MTU, health checks)
  - IPsec VPN (IKEv2, branch connectivity)
  - SD-WAN integration patterns
  
- **Incident Response**
  - P1 scenarios (complete service outage)
  - P2 scenarios (degraded performance)
  - Root cause analysis templates
  
- **CLI Simulator**
  - Interactive command execution
  - Real-world output examples
  - Diagnostic workflows

### 🔹 Advanced Topics (Phase 2 - Structured)

- Multi-cloud ZPA architecture
- Sub-cloud segmentation strategy
- Advanced DLP use cases
- SIEM integration (Splunk, Sentinel)
- Performance monitoring and SLA tracking

---

## 🚀 Live Demo

**[View the Handbook](https://your-username.github.io/zscaler-visual-handbook/)**

*Replace with your actual GitHub Pages URL after deployment*

---

## 📁 Repository Structure

```
zscaler-visual-handbook/
│
├── index.html                 # Main landing page
├── README.md                  # This file
├── CONTRIBUTING.md            # Contribution guidelines
├── ROADMAP.md                 # Future development plans
├── LICENSE                    # MIT License
│
├── css/                       # Styling
│   ├── base.css              # Typography, resets, core styles
│   ├── layout.css            # Grid, navigation, page structure
│   ├── theme-dark.css        # Dark mode (engineer-friendly)
│   └── theme-light.css       # Light mode
│
├── js/                        # Application logic
│   ├── app.js                # Main application controller
│   ├── cli-simulator.js      # Interactive CLI simulation
│   ├── navigation.js         # Dynamic menu and routing
│   └── data-loader.js        # JSON data loading utilities
│
├── data/                      # Content as JSON
│   ├── zia/                  # ZIA-specific data
│   ├── zpa/                  # ZPA-specific data
│   ├── tunnels/              # GRE/IPsec configurations
│   ├── incidents/            # P1/P2 scenarios
│   └── glossary.json         # Terminology reference
│
├── sections/                  # HTML content pages
│   ├── architecture.html     # High-level architecture
│   ├── zia.html              # ZIA deep dive
│   ├── zpa.html              # ZPA deep dive
│   ├── tunnels.html          # Tunnel technologies
│   ├── ssl.html              # SSL inspection
│   ├── dlp.html              # Data Loss Prevention
│   ├── cli.html              # CLI simulator
│   └── incidents.html        # Incident response
│
├── assets/                    # Images and icons
│   ├── diagrams/             # Architecture diagrams
│   └── icons/                # UI icons
│
└── templates/                 # Reusable templates
    └── topic-template.html   # Template for new topics
```

---

## 🛠️ Technology Stack

**Pure Vanilla Web Technologies** - No frameworks, no build process, no dependencies.

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure, accessibility |
| **CSS3** | Responsive design, theming, animations |
| **Vanilla JavaScript** | Dynamic content loading, CLI simulation, interactivity |
| **JSON** | Structured content storage |

**Why no frameworks?**
- GitHub Pages compatibility (zero build step)
- Long-term maintainability (no breaking changes from framework updates)
- Fast loading (no runtime overhead)
- Educational value (readable, learnable code)

---

## 🚦 Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zscaler-visual-handbook.git
   cd zscaler-visual-handbook
   ```

2. **Serve locally**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx http-server -p 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### GitHub Pages Deployment

1. Fork this repository
2. Go to **Settings** → **Pages**
3. Set source to `main` branch, `/root` folder
4. Access at `https://your-username.github.io/zscaler-visual-handbook/`

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to add new topics
- Content standards and style guide
- Testing and validation
- Pull request process

### Quick Add: New Topic

1. Create JSON file in appropriate `data/` subfolder
2. Copy `templates/topic-template.html` to `sections/your-topic.html`
3. Update `data/navigation.json` (auto-loads in menu)
4. Test locally and submit PR

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed planning.

**Current Phase: Phase 1 Complete ✅**

- ✅ Core architecture documentation
- ✅ ZIA/ZPA fundamentals
- ✅ CLI simulator
- ✅ Incident response framework

**Next: Phase 2 - Advanced Enterprise** 🚧

- Multi-cloud ZPA design patterns
- Advanced DLP workflows
- SIEM integration guides
- Performance tuning playbooks

**Future: Phase 3 - Interactive Labs** 🔮

- Sandbox environments
- Configuration generators
- PDF export functionality
- Ansible/Terraform examples

---

## 📚 Additional Resources

- [Official Zscaler Documentation](https://help.zscaler.com/)
- [Zscaler Community](https://community.zscaler.com/)
- [Zscaler Trust Portal](https://trust.zscaler.com/)
- [Zscaler University](https://university.zscaler.com/)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

**Note**: This is an independent educational resource. Zscaler® is a registered trademark of Zscaler, Inc. This project is not officially affiliated with or endorsed by Zscaler, Inc.

---

## 🙏 Acknowledgments

- Inspired by visual SNMP handbooks and network troubleshooting guides
- Built by network engineers, for network engineers
- Community-driven content and scenarios

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/zscaler-visual-handbook/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/zscaler-visual-handbook/discussions)
- **Updates**: Watch this repo for new content releases

---

**Built with ☕ by the network security community**