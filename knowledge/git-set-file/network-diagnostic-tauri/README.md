# NetDiag — Network Diagnostic Tool

A fast, lightweight, professional-grade network diagnostic tool built with Tauri + Rust + Vanilla JS. Works fully offline in air-gapped environments. Zero setup required for end users.

## Features

| Tool | Description |
|------|-------------|
| **Single Ping** | Latency, packet loss, status |
| **Bulk Ping** | Ping up to 100 hosts simultaneously |
| **Traceroute** | Hop-by-hop path trace with RTT |
| **Live Monitor** | Real-time parallel ping with 10-ping history table |
| **DNS Resolver** | Resolve via Google, Cloudflare, Quad9, or custom DNS |

## Prerequisites (Build Machine Only)

End users need nothing. Only the developer building the binary needs:

- **Rust** (1.77+): https://rustup.rs
- **Node.js** (18+): https://nodejs.org (for Tauri CLI)
- **Tauri CLI v2**: `cargo install tauri-cli --version "^2"`

### Windows extra
```
winget install Microsoft.VisualStudio.2022.BuildTools
```
Select: "Desktop development with C++"

### Linux extra
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### macOS extra
```bash
xcode-select --install
```

---

## Build Instructions

### 1. Clone / Download the project
```bash
git clone https://github.com/yourname/network-diagnostic-tauri
cd network-diagnostic-tauri
```

### 2. Build for your platform

```bash
# Windows — produces .exe installer + portable .exe
cargo tauri build

# Linux — produces .deb, .rpm, and AppImage
cargo tauri build

# macOS — produces .dmg and .app
cargo tauri build
```

Output is in: `src-tauri/target/release/bundle/`

### 3. Development mode (with hot reload)
```bash
cargo tauri dev
```

---

## Project Structure

```
network-diagnostic-tauri/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Binary entry point
│   │   ├── lib.rs                # Tauri app + command registration
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── ping.rs           # ping_host, bulk_ping
│   │       ├── traceroute.rs     # traceroute_host
│   │       ├── dns.rs            # resolve_dns
│   │       └── parallel_ping.rs # start/stop/get monitor
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
│
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js       # Core: Tauri bridge, tabs, utilities
│       ├── ping.js      # Single ping UI
│       ├── bulk.js      # Bulk ping UI
│       ├── traceroute.js
│       ├── monitor.js   # Live monitor UI + polling
│       └── dns.js       # DNS resolver UI
│
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────────┐
│          Tauri Desktop Window        │
│  ┌───────────────────────────────┐  │
│  │     Vanilla HTML/CSS/JS        │  │
│  │   (zero frameworks, no CDN)    │  │
│  └──────────────┬────────────────┘  │
│                 │ invoke()           │
│  ┌──────────────▼────────────────┐  │
│  │        Rust Backend            │  │
│  │  • ping via system ping cmd    │  │
│  │  • traceroute/tracert          │  │
│  │  • DNS via nslookup/dig/system │  │
│  │  • Parallel monitor (tokio)    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- **Frontend → Backend**: `window.__TAURI__.invoke('command_name', args)`
- **No HTTP server**: Direct IPC via Tauri's secure bridge
- **Offline**: All system calls use local OS tools (ping, tracert, nslookup)
- **Parallel**: Tokio async + `spawn_blocking` for CPU-bound ping tasks

---

## Security

- All inputs sanitized (alphanumeric + `.`, `-`, `:`, `_` only)
- Maximum lengths enforced (253 chars for hostnames)
- No shell string interpolation — args passed as arrays
- CSP enabled in tauri.conf.json
- No external network requests from the app itself

---

## Demo Mode

Open `src/index.html` directly in a browser (without Tauri) to test the UI with simulated data. All tools work with realistic demo responses.

---

## Adding New Tools

1. Create `src-tauri/src/commands/mytools.rs` with `#[tauri::command]` functions
2. Add `pub mod mytools;` to `commands/mod.rs`
3. Register commands in `lib.rs` `invoke_handler![]`
4. Add a new tab in `index.html` + JS module in `src/js/`

---

## Distribution

- **Windows**: Single `.exe` installer (NSIS) or portable `.exe`
- **Linux**: `.AppImage` (single file, runs anywhere), `.deb`, `.rpm`
- **macOS**: `.dmg` disk image

All bundles are fully self-contained. No runtime, no Node.js, no dependencies needed on the target machine.

---

## License

MIT
