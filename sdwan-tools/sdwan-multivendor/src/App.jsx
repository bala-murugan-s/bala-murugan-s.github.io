import React, { useState, useMemo } from 'react';
import { Search, Terminal, Settings, Book, AlertCircle, Copy, Check, Star, History } from 'lucide-react';

const SDWANTool = () => {
  const [activeTab, setActiveTab] = useState('commands');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('sdwan_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const vendors = [
    { id: 'paloalto', name: 'Palo Alto', color: 'bg-orange-500' },
    { id: 'fortinet', name: 'Fortinet', color: 'bg-red-500' },
    { id: 'silverpeek', name: 'HPE Silver Peak', color: 'bg-blue-500' },
    { id: 'viptela', name: 'Cisco Viptela', color: 'bg-cyan-500' },
    { id: 'meraki', name: 'Cisco Meraki', color: 'bg-green-500' }
  ];

  const commands = [
    {
      id: 'pa_tunnel_status',
      vendor: 'paloalto',
      category: 'tunnels',
      command: 'show vpn ike-sa',
      description: 'Display IKE Security Association status',
      options: [
        { flag: 'gateway <name>', desc: 'Filter by gateway name' },
        { flag: 'peer-address <ip>', desc: 'Filter by peer IP address' }
      ],
      example: `Gateway: branch-vpn-1
Peer-Address: 10.20.30.40
Role: Initiator
State: Established
Lifetime: 28800s remaining`
    },
    {
      id: 'pa_tunnel_detail',
      vendor: 'paloalto',
      category: 'tunnels',
      command: 'show vpn ipsec-sa tunnel <name>',
      description: 'Show detailed IPSec tunnel information',
      options: [
        { flag: '<name>', desc: 'Tunnel name to display' }
      ],
      example: `Tunnel: branch-vpn-1
State: Active
TX Packets: 152341 bytes: 45234523
RX Packets: 148932 bytes: 43223421
Encryption: AES-256-GCM
Authentication: SHA256`
    },
    {
      id: 'forti_tunnel_status',
      vendor: 'fortinet',
      category: 'tunnels',
      command: 'get vpn ipsec tunnel summary',
      description: 'Display summary of all IPSec tunnels',
      options: [],
      example: `'branch-01'   10.20.30.1:0 -> 10.20.30.40:0   
  selectors={0:0/0 0:0/0}  
  proxyid=branch-01 [created 2h ago]
  rx:(esp/bytes/pkts) = (0x2f4a/2453421/18234)
  tx:(esp/bytes/pkts) = (0x2f4b/2398234/17892)`
    },
    {
      id: 'forti_routing_table',
      vendor: 'fortinet',
      category: 'routing',
      command: 'get router info routing-table all',
      description: 'Display complete routing table',
      options: [
        { flag: 'database', desc: 'Show routing database' },
        { flag: 'details', desc: 'Show detailed information' }
      ],
      example: `Codes: K - kernel, C - connected, S - static, R - RIP, B - BGP
       O - OSPF, IA - OSPF inter area
       
S*    0.0.0.0/0 [10/0] via 192.168.1.1, wan1
C     10.10.10.0/24 is directly connected, internal
S     10.20.0.0/16 [10/0] via 172.16.1.1, branch-01`
    },
    {
      id: 'sp_tunnel_status',
      vendor: 'silverpeek',
      category: 'tunnels',
      command: 'show tunnels',
      description: 'Display all tunnel status information',
      options: [
        { flag: 'detail', desc: 'Show detailed tunnel statistics' }
      ],
      example: `Tunnel          Remote IP       State      Uptime    BW(Kbps)  Loss%
branch-hq       10.20.30.40     Up         12d 4h    100000    0.02
branch-dc       10.20.30.50     Up         8d 2h     50000     0.01`
    },
    {
      id: 'sp_optimization',
      vendor: 'silverpeek',
      category: 'performance',
      command: 'show stats optimization',
      description: 'Show WAN optimization statistics',
      options: [],
      example: `LAN to WAN Reduction:     4.2:1
WAN to LAN Reduction:     3.8:1
Bytes Sent (LAN):         2.4 TB
Bytes Sent (WAN):         580 GB
Connection Optimized:     1,234
Connection Pass-through:  45`
    },
    {
      id: 'viptela_control',
      vendor: 'viptela',
      category: 'control',
      command: 'show control connections',
      description: 'Display control plane connection status',
      options: [],
      example: `PEER      PEER     PEER            SITE  DOMAIN PEER            
TYPE      PROTOCOL  PUBLIC IP       ID    ID     PRIVATE IP     
--------------------------------------------------------
vsmart    dtls      10.20.30.40     100   1      172.16.1.10     
vbond     dtls      10.20.30.50     0     0      172.16.1.20     
vmanage   dtls      10.20.30.60     0     0      172.16.1.30`
    },
    {
      id: 'viptela_bfd',
      vendor: 'viptela',
      category: 'tunnels',
      command: 'show bfd sessions',
      description: 'Display BFD session information',
      options: [],
      example: `SOURCE   REMOTE   DST     DETECT  TX        RX        STATE
TLOC     TLOC     PORT    MULTI   INTER     INTER
172.1.1  172.2.1  12366   7       1000000   1000000   up
172.1.1  172.2.2  12346   7       1000000   1000000   up`
    },
    {
      id: 'viptela_omp',
      vendor: 'viptela',
      category: 'routing',
      command: 'show omp routes',
      description: 'Display OMP routing information',
      options: [
        { flag: 'vpn <id>', desc: 'Filter by VPN ID' },
        { flag: 'prefix <ip>', desc: 'Filter by prefix' }
      ],
      example: `VPN    PREFIX           PROTOCOL  FROM       PREFERENCE
10     192.168.10.0/24  connected  0.0.0.0    0
10     192.168.20.0/24  omp        172.16.1.2 10
10     0.0.0.0/0        omp        172.16.1.1 10`
    },
    {
      id: 'meraki_vpn',
      vendor: 'meraki',
      category: 'tunnels',
      command: 'show vpn status',
      description: 'Display Auto VPN status (Dashboard API)',
      options: [],
      example: `Network: Branch-Network
Peers Connected: 12/12
VPN Mode: Hub (Spoke)
Subnets Advertised: 192.168.1.0/24, 10.10.10.0/24

Connected Peers:
- HQ-MX (10.20.30.40) - Active
- DC-MX (10.20.30.50) - Active`
    },
    {
      id: 'meraki_uplink',
      vendor: 'meraki',
      category: 'interfaces',
      command: 'show uplink status',
      description: 'Display WAN uplink status',
      options: [],
      example: `WAN 1 (Primary):
  Status: Active
  IP: 203.0.113.10/24
  Gateway: 203.0.113.1
  DNS: 8.8.8.8, 8.8.4.4
  Latency: 15ms
  Loss: 0.1%

WAN 2 (Secondary):  
  Status: Ready
  IP: 198.51.100.20/24
  Gateway: 198.51.100.1`
    },
    {
      id: 'pa_system_info',
      vendor: 'paloalto',
      category: 'system',
      command: 'show system info',
      description: 'Display system information and status',
      options: [],
      example: `hostname: fw-branch-01
model: PA-220
serial: 012345678901
sw-version: 10.2.3
uptime: 45 days, 12:34:56
family: vm
vpn-disable-mode: off`
    },
    {
      id: 'forti_sys_status',
      vendor: 'fortinet',
      category: 'system',
      command: 'get system status',
      description: 'Show system status and version',
      options: [],
      example: `Version: FortiGate-60F v7.2.5
Serial-Number: FG60FTK20123456
System time: Mon Dec 01 10:30:45 2025
Uptime: 1234567 seconds (14 days)`
    },
    {
      id: 'sp_interfaces',
      vendor: 'silverpeek',
      category: 'interfaces',
      command: 'show interfaces brief',
      description: 'Display interface status summary',
      options: [],
      example: `Interface    Status   IP Address        Speed    Duplex
lan0         Up       192.168.1.1/24    1000     Full
wan0         Up       10.20.30.40/30    1000     Full
aux          Down     -                 -        -`
    },
    {
      id: 'viptela_interface',
      vendor: 'viptela',
      category: 'interfaces',
      command: 'show interface',
      description: 'Display interface configuration and status',
      options: [
        { flag: '<name>', desc: 'Specific interface name' }
      ],
      example: `ge0/0:
  Admin Status: Up
  Oper Status: Up
  IP: 10.20.30.40/30
  VPN: 0
  Speed: 1000
  RX: 1.2GB TX: 980MB`
    },
    {
      id: 'viptela_app_route',
      vendor: 'viptela',
      category: 'performance',
      command: 'show app-route stats',
      description: 'Display application-aware routing statistics',
      options: [],
      example: `APP           SLA-CLASS  REMOTE-SYSTEM  LATENCY  LOSS  JITTER
voice         gold       172.16.1.10    25ms     0%    2ms
video         silver     172.16.1.10    30ms     0%    3ms
bulk-data     bronze     172.16.1.11    45ms     0.1%  5ms`
    },
    {
      id: 'pa_session_info',
      vendor: 'paloalto',
      category: 'sessions',
      command: 'show session info',
      description: 'Display session table information',
      options: [],
      example: `Session table utilization: 2345 of 65536 sessions (3%)
Number of sessions: 2345
  TCP: 1234
  UDP: 890
  ICMP: 221
Maximum sessions: 65536
Packet rate: 12543 pkts/sec`
    },
    {
      id: 'forti_session_list',
      vendor: 'fortinet',
      category: 'sessions',
      command: 'diagnose sys session list',
      description: 'List active sessions',
      options: [
        { flag: 'filter src <ip>', desc: 'Filter by source IP' },
        { flag: 'filter dst <ip>', desc: 'Filter by destination IP' }
      ],
      example: `session info: proto=6 proto_state=01 duration=123 expire=3477
originator direction: from internal, reply direction: to wan1
src=192.168.1.100:54321 dst=8.8.8.8:443
gateway=10.20.30.1, origin->gateway=192.168.1.100
npu_state=0x001000, state=log may_dirty ndr npu`
    }
  ];

  const troubleshootingGuides = [
    {
      vendor: 'paloalto',
      issue: 'Tunnel Not Establishing',
      steps: [
        'Verify IKE Phase 1: show vpn ike-sa',
        'Check IKE gateway configuration: show running config',
        'Verify IPSec proposals match on both ends',
        'Check routing for tunnel traffic',
        'Review system logs: show log system'
      ]
    },
    {
      vendor: 'fortinet',
      issue: 'High Packet Loss',
      steps: [
        'Check interface errors: diagnose hardware deviceinfo nic <interface>',
        'Verify QoS policies: diagnose firewall shaper traffic-shaper',
        'Check CPU usage: get system performance status',
        'Review session table: diagnose sys session stat'
      ]
    },
    {
      vendor: 'viptela',
      issue: 'Control Connection Down',
      steps: [
        'Verify control connections: show control connections',
        'Check certificate validity: show certificate status',
        'Verify orchestrator reachability: ping vpn 0 <vmanage-ip>',
        'Review control logs: show log'
      ]
    }
  ];

  const configTemplates = {
    paloalto: {
      'Basic IPSec Tunnel': `set network interface tunnel units tunnel.1 ip 10.0.1.1/30
set network virtual-router default interface tunnel.1

set network ike gateway branch-vpn interface ethernet1/1
set network ike gateway branch-vpn protocol ikev2
set network ike gateway branch-vpn local-address ip 203.0.113.10
set network ike gateway branch-vpn peer-address ip 203.0.113.20

set network ike crypto-profiles ike-crypto-profiles default-ike
set network ike crypto-profiles ipsec-crypto-profiles default-ipsec

set network tunnel ipsec branch-tunnel tunnel-interface tunnel.1
set network tunnel ipsec branch-tunnel ike-gateway branch-vpn`
    },
    fortinet: {
      'Basic IPSec Tunnel': `config vpn ipsec phase1-interface
    edit "branch-tunnel"
        set interface "wan1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.20
        set psksecret <your-psk>
    next
end

config vpn ipsec phase2-interface
    edit "branch-tunnel-p2"
        set phase1name "branch-tunnel"
        set proposal aes256-sha256
        set src-subnet 192.168.1.0/24
        set dst-subnet 192.168.2.0/24
    next
end`
    },
    viptela: {
      'Basic Site Configuration': `system
 site-id 100
 organization-name "MyOrg"
 vbond 10.20.30.50

vpn 0
 interface ge0/0
  ip address 203.0.113.10/30
  tunnel-interface
   encapsulation ipsec
   color biz-internet
   allow-service dhcp
   allow-service dns
   allow-service sshd
  !
 !

vpn 10
 interface ge0/1
  ip address 192.168.1.1/24
 !`
    }
  };

  const filteredCommands = useMemo(() => {
    return commands.filter(cmd => {
      const vendorMatch = selectedVendor === 'all' || cmd.vendor === selectedVendor;
      const searchMatch = searchQuery === '' || 
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchQuery.toLowerCase());
      return vendorMatch && searchMatch;
    });
  }, [selectedVendor, searchQuery]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (cmdId) => {
    const newFavorites = favorites.includes(cmdId)
      ? favorites.filter(id => id !== cmdId)
      : [...favorites, cmdId];
    setFavorites(newFavorites);
    localStorage.setItem('sdwan_favorites', JSON.stringify(newFavorites));
  };

  const parseCommand = (input) => {
    const found = commands.find(cmd => 
      input.toLowerCase().includes(cmd.command.toLowerCase())
    );
    return found || null;
  };

  const parsedCommand = commandInput ? parseCommand(commandInput) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            SD-WAN Multi-Vendor Tool
          </h1>
          <p className="text-slate-400">Configuration, Troubleshooting & Command Reference</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'commands', label: 'Command Reference', icon: Terminal },
            { id: 'config', label: 'Config Builder', icon: Settings },
            { id: 'troubleshoot', label: 'Troubleshooting', icon: AlertCircle },
            { id: 'parser', label: 'Command Parser', icon: Search }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Command Reference Tab */}
        {activeTab === 'commands' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search commands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedVendor('all')}
                    className={`px-4 py-2 rounded-lg ${
                      selectedVendor === 'all' ? 'bg-slate-600' : 'bg-slate-700'
                    }`}
                  >
                    All Vendors
                  </button>
                  {vendors.map(vendor => (
                    <button
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor.id)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        selectedVendor === vendor.id ? 'bg-slate-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${vendor.color}`}></div>
                      {vendor.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commands List */}
            <div className="space-y-4">
              {filteredCommands.map(cmd => {
                const vendor = vendors.find(v => v.id === cmd.vendor);
                const isFavorite = favorites.includes(cmd.id);
                return (
                  <div key={cmd.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-750 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${vendor.color}`}></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">{vendor.name}</span>
                            <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                              {cmd.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(cmd.id)}
                        className="text-yellow-500 hover:text-yellow-400"
                      >
                        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-cyan-400 text-lg font-mono">{cmd.command}</code>
                        <button
                          onClick={() => handleCopy(cmd.command, cmd.id)}
                          className="p-2 hover:bg-slate-700 rounded"
                        >
                          {copiedId === cmd.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-slate-300">{cmd.description}</p>
                    </div>

                    {cmd.options.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-2 font-semibold">Options:</p>
                        <div className="space-y-1">
                          {cmd.options.map((opt, idx) => (
                            <div key={idx} className="text-sm">
                              <code className="text-green-400">{opt.flag}</code>
                              <span className="text-slate-400"> - {opt.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-slate-400 mb-2 font-semibold">Example Output:</p>
                      <pre className="bg-slate-900 p-3 rounded text-sm overflow-x-auto text-green-300 font-mono">
{cmd.example}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Config Builder Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Configuration Templates</h2>
              <p className="text-slate-400 mb-6">
                Select a vendor to view pre-built configuration templates
              </p>
              
              {vendors.slice(0, 3).map(vendor => (
                <div key={vendor.id} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${vendor.color}`}></div>
                    <h3 className="text-xl font-semibold">{vendor.name}</h3>
                  </div>
                  
                  {configTemplates[vendor.id] && Object.entries(configTemplates[vendor.id]).map(([name, config]) => (
                    <div key={name} className="bg-slate-900 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-medium text-cyan-400">{name}</h4>
                        <button
                          onClick={() => handleCopy(config, `${vendor.id}-${name}`)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
                        >
                          {copiedId === `${vendor.id}-${name}` ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm overflow-x-auto text-green-300 font-mono whitespace-pre">
{config}
                      </pre>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting Tab */}
        {activeTab === 'troubleshoot' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Troubleshooting Guides</h2>
              
              {troubleshootingGuides.map((guide, idx) => {
                const vendor = vendors.find(v => v.id === guide.vendor);
                return (
                  <div key={idx} className="bg-slate-900 rounded-lg p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${vendor.color}`}></div>
                      <h3 className="text-xl font-semibold">{vendor.name}</h3>
                    </div>
                    
                    <h4 className="text-lg text-cyan-400 mb-3">{guide.issue}</h4>
                    
                    <ol className="space-y-2">
                      {guide.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex gap-3">
                          <span className="text-slate-500 font-semibold">{stepIdx + 1}.</span>
                          <span className="text-slate-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Command Parser Tab */}
        {activeTab === 'parser' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Command Parser</h2>
              <p className="text-slate-400 mb-6">
                Paste a command or output to get information about it
              </p>
              
              <textarea
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Paste command here... (e.g., 'show vpn ike-sa' or 'get router info routing-table all')"
                className="w-full h-32 px-4 py-3 bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              />
              
              {parsedCommand && (
                <div className="mt-6 bg-slate-900 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${vendors.find(v => v.id === parsedCommand.vendor)?.color}`}></div>
                    <h3 className="text-xl font-semibold">
                      {vendors.find(v => v.id === parsedCommand.vendor)?.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Command:</p>
                      <code className="text-cyan-400 text-lg">{parsedCommand.command}</code>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Description:</p>
                      <p className="text-slate-300">{parsedCommand.description}</p>
                    </div>
                    
                    {parsedCommand.options.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Options:</p>
                        <div className="space-y-1">
                          {parsedCommand.options.map((opt, idx) => (
                            <div key={idx} className="text-sm">
                              <code className="text-green-400">{opt.flag}</code>
                              <span className="text-slate-400"> - {opt.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Example Output:</p>
                      <pre className="bg-slate-950 p-4 rounded text-sm overflow-x-auto text-green-300 font-mono">
{parsedCommand.example}
                      </pre>
                    </div>
                    
                    <button
                      onClick={() => handleCopy(parsedCommand.command, 'parsed')}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                    >
                      {copiedId === 'parsed' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied Command
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Command
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {commandInput && !parsedCommand && (
                <div className="mt-6 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                  <p className="text-yellow-400">
                    Command not recognized. Try searching in the Command Reference tab.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center text-slate-500 text-sm pb-6">
        <p>SD-WAN Multi-Vendor Tool | Palo Alto • Fortinet • HPE Silver Peak • Cisco Viptela • Cisco Meraki</p>
        <p className="mt-2">All data stored locally in browser • No external connections</p>
      </div>
    </div>
  );
};

export default SDWANTool;
{/*
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(SDWANTool));
*/}