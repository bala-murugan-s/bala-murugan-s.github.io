// data/paloaltocommands.js
export const paloAltoCliCommands = [
  {
    id: "pa-system-001",
    title: "System Information Overview",
    category: "System",
    query: `show system info`,
    explanation:
      "Displays core firewall system details including hostname, model, serial number, PAN-OS version, and uptime. Commonly used for audits and troubleshooting.",
    sampleOutput: [
      {
        hostname: "PA-FW-01",
        model: "PA-3220",
        serial: "0123456789",
        "sw-version": "10.2.4",
        uptime: "132 days"
      }
    ]
  },

  {
    id: "pa-system-002",
    title: "System Resource Utilization",
    category: "System",
    query: `show system resources`,
    explanation:
      "Shows real-time CPU, memory utilization, and system load to help identify performance bottlenecks.",
    sampleOutput: [
      {
        "CPU Load": "28%",
        "Memory Used": "63%",
        "Memory Free": "37%"
      }
    ]
  },

  {
    id: "pa-system-003",
    title: "System Process Health",
    category: "System",
    query: `show system software status`,
    explanation:
      "Verifies that critical PAN-OS services and processes are running correctly.",
    sampleOutput: [
      { Process: "mgmtsrvr", Status: "running" },
      { Process: "dpd", Status: "running" },
      { Process: "pan_task", Status: "running" }
    ]
  },

  {
    id: "pa-inv-001",
    title: "Hardware Inventory Details",
    category: "Inventory",
    query: `show system state filter-pretty sys.hardware`,
    explanation:
      "Provides detailed hardware inventory information including CPU count, memory size, and interface capacity.",
    sampleOutput: [
      {
        "cpu-count": 16,
        "memory-gb": 32,
        nics: 12
      }
    ]
  },

  {
    id: "pa-inv-002",
    title: "Interface Inventory",
    category: "Inventory",
    query: `show interface all`,
    explanation:
      "Lists all physical and logical interfaces with their operational state, speed, and duplex settings.",
    sampleOutput: [
      {
        Interface: "ethernet1/1",
        State: "up",
        Speed: "1Gbps",
        Duplex: "full"
      },
      {
        Interface: "ethernet1/2",
        State: "down",
        Speed: "auto",
        Duplex: "auto"
      }
    ]
  },

  {
    id: "pa-inv-003",
    title: "Environmental Hardware Status",
    category: "Inventory",
    query: `show system environmentals`,
    explanation:
      "Checks the health of fans, power supplies, and temperature sensors to ensure hardware stability.",
    sampleOutput: [
      { Component: "Fan1", Status: "OK" },
      { Component: "Fan2", Status: "OK" },
      { Component: "Power Supply 1", Status: "OK" },
      { Component: "Temperature", Status: "Normal" }
    ]
  },

  {
    id: "pa-snmp-001",
    title: "SNMP Configuration",
    category: "SNMP",
    query: `show config running | match snmp`,
    explanation:
      "Displays SNMP configuration including community strings, SNMP versions, and enabled settings.",
    sampleOutput: [
      {
        Community: "public",
        Version: "v2c",
        Status: "enabled"
      }
    ]
  },

  {
    id: "pa-snmp-002",
    title: "SNMP Trap Statistics",
    category: "SNMP",
    query: `show system snmp statistics`,
    explanation:
      "Shows SNMP trap counters to confirm traps are being generated and transmitted successfully.",
    sampleOutput: [
      {
        "Traps Sent": 142,
        "Traps Dropped": 0
      }
    ]
  },

  {
    id: "pa-license-001",
    title: "License Status",
    category: "License",
    query: `request license info`,
    explanation:
      "Displays installed licenses and subscription status along with expiration dates.",
    sampleOutput: [
      {
        License: "Threat Prevention",
        Status: "Valid",
        Expires: "2026-02-10"
      },
      {
        License: "WildFire",
        Status: "Valid",
        Expires: "2026-02-10"
      }
    ]
  },

  {
    id: "pa-license-002",
    title: "Fetch Latest Licenses",
    category: "License",
    query: `request license fetch`,
    explanation:
      "Fetches and installs the latest license information from Palo Alto Networks licensing servers.",
    sampleOutput: [
      {
        Result: "Licenses successfully updated"
      }
    ]
  },

  {
    id: "pa-disk-001",
    title: "Disk Usage Summary",
    category: "Disk",
    query: `show system disk-space`,
    explanation:
      "Displays disk utilization across system and log partitions to prevent storage exhaustion.",
    sampleOutput: [
      {
        Filesystem: "/",
        Size: "40G",
        Used: "22G",
        Available: "18G",
        "Use%": "55%"
      },
      {
        Filesystem: "/opt/pancfg",
        Size: "10G",
        Used: "2G",
        Available: "8G",
        "Use%": "20%"
      }
    ]
  },

  {
    id: "pa-disk-002",
    title: "Log Database Quota Utilization",
    category: "Disk",
    query: `show system logdb-quota`,
    explanation:
      "Shows current log database quota allocation and usage by log type.",
    sampleOutput: [
      { LogType: "traffic", Usage: "45%" },
      { LogType: "threat", Usage: "32%" },
      { LogType: "system", Usage: "18%" }
    ]
  },

  {
    id: "pa-disk-003",
    title: "Log Database Health Status",
    category: "Disk",
    query: `show system logdb-status`,
    explanation:
      "Verifies the operational health of the log database and checks for restarts or corruption.",
    sampleOutput: [
      {
        Status: "Running",
        "Last Restart": "2025-12-15 03:10"
      }
    ]
  }
];
