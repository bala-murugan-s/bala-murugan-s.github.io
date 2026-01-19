/*
 * cli-simulator.js
 * Interactive CLI command execution simulator
 */

(function() {
    'use strict';

    const CLISimulator = {
        commands: {},
        history: [],
        historyIndex: -1,
        currentDirectory: '~',

        async init() {
            await this.loadCommands();
            this.setupEventListeners();
            console.log('💻 CLI Simulator initialized');
        },

        async loadCommands() {
            // Load predefined commands from various data files
            this.commands = {
                'help': {
                    description: 'Show available commands',
                    execute: () => this.showHelp()
                },
                'clear': {
                    description: 'Clear terminal',
                    execute: () => this.clearTerminal()
                },
                'curl': {
                    description: 'Test HTTP connectivity through ZIA',
                    execute: (args) => this.executeCurl(args)
                },
                'dig': {
                    description: 'DNS lookup',
                    execute: (args) => this.executeDig(args)
                },
                'ping': {
                    description: 'Test network connectivity',
                    execute: (args) => this.executePing(args)
                },
                'zscaler-status': {
                    description: 'Check Zscaler service status',
                    execute: () => this.zscalerStatus()
                }
            };
        },

        setupEventListeners() {
            const input = document.getElementById('cli-input');
            if (!input) return;

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeCommand(input.value);
                    input.value = '';
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory('up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory('down');
                }
            });
        },

        executeCommand(cmdString) {
            const parts = cmdString.trim().split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);

            this.addToOutput(`<span class="cli-prompt">engineer@zscaler:${this.currentDirectory}$</span> <span class="cli-command">${cmdString}</span>`);

            if (!cmd) return;

            this.history.push(cmdString);
            this.historyIndex = this.history.length;

            if (this.commands[cmd]) {
                const result = this.commands[cmd].execute(args);
                this.addToOutput(result);
            } else {
                this.addToOutput(`<span style="color: var(--text-error)">Command not found: ${cmd}</span>`);
            }
        },

        addToOutput(content) {
            const output = document.getElementById('cli-output');
            if (!output) return;

            const line = document.createElement('div');
            line.className = 'cli-line';
            line.innerHTML = content;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        },

        showHelp() {
            let help = '<div class="cli-output">Available commands:\n\n';
            for (const [cmd, data] of Object.entries(this.commands)) {
                help += `  ${cmd.padEnd(20)} - ${data.description}\n`;
            }
            help += '</div>';
            return help;
        },

        clearTerminal() {
            const output = document.getElementById('cli-output');
            if (output) output.innerHTML = '';
            return '';
        },

        executeCurl(args) {
            const url = args[0] || 'https://example.com';
            return `<div class="cli-output">HTTP/1.1 200 OK
X-Zscaler-Proxy: zscaler-cloud-sanjose-1
X-Authenticated-User: engineer@company.com
X-Cache: MISS from zscaler
Content-Type: text/html; charset=UTF-8
Content-Length: 1256

Connection successful through Zscaler proxy</div>`;
        },

        executeDig(args) {
            const domain = args[1] || 'gateway.zscaler.net';
            return `<div class="cli-output">; <<>> DiG 9.10.6 <<>> +short ${domain}
;; Got answer:
165.225.100.100
165.225.100.101
165.225.100.102</div>`;
        },

        executePing(args) {
            const target = args[0] || 'gateway.zscaler.net';
            return `<div class="cli-output">PING ${target}: 56 data bytes
64 bytes from 165.225.100.100: icmp_seq=0 ttl=54 time=12.3 ms
64 bytes from 165.225.100.100: icmp_seq=1 ttl=54 time=11.8 ms
64 bytes from 165.225.100.100: icmp_seq=2 ttl=54 time=12.1 ms

--- ${target} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 11.8/12.1/12.3/0.2 ms</div>`;
        },

        zscalerStatus() {
            return `<div class="cli-output">Zscaler Service Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cloud Gateway:      CONNECTED ✓
  Authentication:     ACTIVE ✓
  SSL Inspection:     ENABLED
  Tunnel Status:      UP (GRE)
  Last Policy Sync:   2025-01-19 14:32:10 UTC
  
  Gateway:            zscaler-cloud-sanjose-1
  Primary IP:         165.225.100.100
  Backup IP:          165.225.100.101
  
  User:               engineer@company.com
  Location:           San Jose, CA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>`;
        },

        navigateHistory(direction) {
            const input = document.getElementById('cli-input');
            if (!input || this.history.length === 0) return;

            if (direction === 'up' && this.historyIndex > 0) {
                this.historyIndex--;
            } else if (direction === 'down' && this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
            }

            input.value = this.history[this.historyIndex] || '';
        }
    };

    window.ZscalerCLI = CLISimulator;

})();