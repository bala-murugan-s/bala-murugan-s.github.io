// data/kqlQueries.js
export const kqlQueries = [
  {
    id: "kql-auth-001",
    title: "Failed Login Attempts",
    category: "Authentication",
    query: `SecurityEvent
| where EventID == 4625
| where TimeGenerated > ago(24h)
| summarize FailedAttempts = count() by Account, Computer
| where FailedAttempts > 5
| order by FailedAttempts desc`,
    explanation:
      "Detects accounts with multiple failed login attempts which may indicate brute force activity.",
    sampleOutput: [
      { Account: "admin", Computer: "DC01", FailedAttempts: 23 },
      { Account: "user1", Computer: "WS-001", FailedAttempts: 12 }
    ]
  },

  {
    id: "kql-auth-002",
    title: "Successful Login After Failures",
    category: "Authentication",
    query: `SecurityEvent
| where EventID in (4625, 4624)
| where TimeGenerated > ago(1h)
| summarize FailedLogins = countif(EventID == 4625),
            SuccessLogins = countif(EventID == 4624) by Account
| where FailedLogins > 3 and SuccessLogins > 0`,
    explanation:
      "Finds accounts that experienced multiple failed logins followed by a successful login, a common indicator of brute-force success.",
    sampleOutput: [
      { Account: "administrator", FailedLogins: 15, SuccessLogins: 1 },
      { Account: "dbadmin", FailedLogins: 8, SuccessLogins: 2 }
    ]
  },

  {
    id: "kql-net-001",
    title: "High Volume Network Connections",
    category: "Network",
    query: `CommonSecurityLog
| where TimeGenerated > ago(1h)
| summarize ConnectionCount = count() by SourceIP, DestinationIP
| where ConnectionCount > 1000
| order by ConnectionCount desc`,
    explanation:
      "Identifies unusually high numbers of network connections which may indicate scanning or DDoS activity.",
    sampleOutput: [
      {
        SourceIP: "192.168.1.100",
        DestinationIP: "203.0.113.45",
        ConnectionCount: 5432
      }
    ]
  },

  {
    id: "kql-net-002",
    title: "Unusual Outbound Traffic by Port",
    category: "Network",
    query: `CommonSecurityLog
| where TimeGenerated > ago(24h)
| where DeviceAction == "Allow"
| summarize DataTransferred = sum(SentBytes) by DestinationPort, SourceIP
| where DataTransferred > 1000000000
| order by DataTransferred desc`,
    explanation:
      "Detects large outbound data transfers by port, which may indicate data exfiltration.",
    sampleOutput: [
      {
        DestinationPort: 443,
        SourceIP: "10.1.1.25",
        DataTransferred: 5368709120
      }
    ]
  },

  {
    id: "kql-endpoint-001",
    title: "Suspicious Process Execution",
    category: "Endpoint",
    query: `SecurityEvent
| where EventID == 4688
| where TimeGenerated > ago(1h)
| where NewProcessName has_any ("powershell", "cmd", "wscript", "cscript")
| summarize ExecutionCount = count() by Account, NewProcessName`,
    explanation:
      "Monitors execution of common scripting and command-line tools often abused by attackers.",
    sampleOutput: [
      {
        Account: "SYSTEM",
        NewProcessName: "powershell.exe",
        ExecutionCount: 45
      }
    ]
  },

  {
    id: "kql-endpoint-002",
    title: "Suspicious Registry Persistence",
    category: "Endpoint",
    query: `SecurityEvent
| where EventID == 4657
| where TimeGenerated > ago(24h)
| where ObjectName contains "CurrentVersion\\\\Run"
| project TimeGenerated, Account, Computer, ObjectName`,
    explanation:
      "Tracks registry Run key modifications commonly used by malware for persistence.",
    sampleOutput: [
      {
        TimeGenerated: "2025-12-20T14:30:00Z",
        Account: "admin",
        Computer: "WS-001",
        ObjectName: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      }
    ]
  },

  {
    id: "kql-cloud-001",
    title: "Azure AD Risky Sign-ins",
    category: "Cloud",
    query: `SigninLogs
| where TimeGenerated > ago(24h)
| where RiskLevelDuringSignIn in ("high", "medium")
| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevelDuringSignIn`,
    explanation:
      "Identifies Azure AD sign-ins flagged as risky by Microsoft Entra ID protection.",
    sampleOutput: [
      {
        TimeGenerated: "2025-12-20T15:45:00Z",
        UserPrincipalName: "john@contoso.com",
        IPAddress: "203.0.113.10",
        RiskLevelDuringSignIn: "high"
      }
    ]
  },

  {
    id: "kql-threat-001",
    title: "Malware Detection Events",
    category: "Threat",
    query: `SecurityAlert
| where TimeGenerated > ago(24h)
| where AlertName contains "malware" or AlertName contains "ransomware"
| summarize AlertCount = count() by AlertName, CompromisedEntity`,
    explanation:
      "Aggregates malware and ransomware alerts detected across the environment.",
    sampleOutput: [
      {
        AlertName: "Ransomware behavior detected",
        CompromisedEntity: "WS-042",
        AlertCount: 3
      }
    ]
  },

  {
    id: "kql-threat-002",
    title: "Lateral Movement Detection",
    category: "Threat",
    query: `SecurityEvent
| where EventID in (4624, 4648)
| where TimeGenerated > ago(1h)
| summarize LoginCount = count() by Account, Computer
| where LoginCount > 5`,
    explanation:
      "Detects accounts authenticating to multiple systems in a short time window, indicating possible lateral movement.",
    sampleOutput: [
      {
        Account: "admin",
        Computer: "DC01, SRV-01, WS-001",
        LoginCount: 12
      }
    ]
  }
];
