// data/splunkQueries.js
export const splunkQueries = [
  {
    id: "spl-auth-001",
    title: "Failed Login Attempts",
    category: "Authentication",
    query: `index=wineventlog EventCode=4625 earliest=-24h
| stats count AS FailedAttempts by Account_Name ComputerName
| where FailedAttempts > 5
| sort - FailedAttempts`,
    explanation:
      "Identifies accounts with multiple failed login attempts within 24 hours, commonly associated with brute force attacks.",
    sampleOutput: [
      { Account_Name: "admin", ComputerName: "DC01", FailedAttempts: 23 },
      { Account_Name: "user1", ComputerName: "WS-001", FailedAttempts: 12 }
    ]
  },

  {
    id: "spl-auth-002",
    title: "Successful Logins After Failed Attempts",
    category: "Authentication",
    query: `index=wineventlog (EventCode=4625 OR EventCode=4624) earliest=-1h
| stats 
    count(eval(EventCode=4625)) AS FailedLogins
    count(eval(EventCode=4624)) AS SuccessLogins
    by Account_Name
| where FailedLogins > 3 AND SuccessLogins > 0`,
    explanation:
      "Detects accounts that experienced multiple failed login attempts followed by a successful authentication.",
    sampleOutput: [
      { Account_Name: "administrator", FailedLogins: 15, SuccessLogins: 1 }
    ]
  },

  {
    id: "spl-net-001",
    title: "High Volume Network Connections",
    category: "Network",
    query: `index=network earliest=-1h
| stats count AS ConnectionCount by src_ip dest_ip
| where ConnectionCount > 1000
| sort - ConnectionCount
| head 20`,
    explanation:
      "Identifies unusually high volumes of network connections that may indicate scanning or denial-of-service activity.",
    sampleOutput: [
      {
        src_ip: "192.168.1.100",
        dest_ip: "203.0.113.45",
        ConnectionCount: 5432
      }
    ]
  },

  {
    id: "spl-net-002",
    title: "Unusual Outbound Traffic by Port",
    category: "Network",
    query: `index=firewall action=allowed earliest=-24h
| stats sum(bytes_out) AS DataTransferred by src_ip dest_port
| where DataTransferred > 1000000000
| sort - DataTransferred`,
    explanation:
      "Detects large outbound data transfers by port, which may indicate potential data exfiltration.",
    sampleOutput: [
      {
        src_ip: "10.1.1.25",
        dest_port: 443,
        DataTransferred: 5368709120
      }
    ]
  },

  {
    id: "spl-endpoint-001",
    title: "Suspicious Process Execution",
    category: "Endpoint",
    query: `index=wineventlog EventCode=4688 earliest=-1h
| search New_Process_Name="*powershell*" OR New_Process_Name="*cmd*" OR New_Process_Name="*wscript*"
| stats count AS ExecutionCount by Account_Name New_Process_Name Parent_Process_Name
| sort - ExecutionCount`,
    explanation:
      "Monitors execution of commonly abused command-line and scripting tools often used in attacks.",
    sampleOutput: [
      {
        Account_Name: "SYSTEM",
        New_Process_Name: "powershell.exe",
        ExecutionCount: 45
      }
    ]
  },

  {
    id: "spl-endpoint-002",
    title: "Suspicious Registry Modifications",
    category: "Endpoint",
    query: `index=wineventlog EventCode=4657 earliest=-24h
| search Object_Name="*\\\\CurrentVersion\\\\Run*"
| table _time Account_Name ComputerName Object_Name Object_Value_Name
| sort - _time`,
    explanation:
      "Tracks registry Run key modifications that are frequently used for malware persistence.",
    sampleOutput: [
      {
        Account_Name: "admin",
        ComputerName: "WS-001",
        Object_Value_Name: "Updater"
      }
    ]
  },

  {
    id: "spl-cloud-001",
    title: "Azure AD Risky Sign-ins",
    category: "Cloud",
    query: `index=o365 sourcetype=azure:signinlogs earliest=-24h
| search RiskLevel IN ("high","medium")
| table _time UserPrincipalName IPAddress Location RiskLevel RiskDetail
| sort - _time`,
    explanation:
      "Identifies Azure AD sign-ins flagged as risky by Microsoft Entra ID protection.",
    sampleOutput: [
      {
        UserPrincipalName: "john@contoso.com",
        RiskLevel: "high"
      }
    ]
  },

  {
    id: "spl-threat-001",
    title: "Malware Detection Events",
    category: "Threat",
    query: `index=defender earliest=-24h
| search AlertName="*malware*" OR AlertName="*ransomware*"
| stats count AS AlertCount by AlertName DeviceName Severity
| sort Severity - AlertCount`,
    explanation:
      "Summarizes malware and ransomware detection alerts across the environment.",
    sampleOutput: [
      {
        AlertName: "Ransomware behavior detected",
        Severity: "High",
        AlertCount: 3
      }
    ]
  },

  {
    id: "spl-threat-002",
    title: "Lateral Movement Detection",
    category: "Threat",
    query: `index=wineventlog (EventCode=4624 OR EventCode=4648) earliest=-1h
| search Logon_Type IN (3,10)
| stats count AS LoginCount by Account_Name ComputerName src_ip
| where LoginCount > 5
| sort - LoginCount`,
    explanation:
      "Detects potential lateral movement based on multiple logins to different systems in a short time window.",
    sampleOutput: [
      {
        Account_Name: "admin",
        LoginCount: 12
      }
    ]
  },

  {
    id: "spl-net-003",
    title: "DNS Queries to Malicious Domains",
    category: "Network",
    query: `index=dns earliest=-24h
| search query IN ("malicious-domain.com","phishing-site.net","c2-server.org")
| table _time ComputerName src_ip query record_type
| sort - _time`,
    explanation:
      "Searches DNS logs for queries to known malicious domains associated with malware and command-and-control activity.",
    sampleOutput: [
      {
        ComputerName: "WS-099",
        query: "c2-server.org"
      }
    ]
  }
];
