use serde::{Deserialize, Serialize};
use std::process::Command;
use std::net::IpAddr;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DnsResult {
    pub hostname: String,
    pub dns_server: String,
    pub resolved_ips: Vec<String>,
    pub success: bool,
    pub error: Option<String>,
    pub query_time_ms: f64,
}

fn sanitize_hostname(host: &str) -> Result<String, String> {
    let trimmed = host.trim();
    if trimmed.is_empty() {
        return Err("Hostname cannot be empty".to_string());
    }
    if trimmed.len() > 253 {
        return Err("Hostname too long".to_string());
    }
    let valid = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c == '.' || c == '-' || c == '_'
    });
    if !valid {
        return Err(format!("Invalid characters in hostname: {}", trimmed));
    }
    Ok(trimmed.to_string())
}

fn sanitize_dns_server(server: &str) -> Result<String, String> {
    let trimmed = server.trim();
    // Must be a valid IP address
    let valid = trimmed.chars().all(|c| c.is_ascii_digit() || c == '.' || c == ':');
    if !valid || trimmed.len() > 45 {
        return Err(format!("Invalid DNS server address: {}", trimmed));
    }
    // Validate it's actually parseable as an IP
    trimmed
        .parse::<IpAddr>()
        .map(|ip| ip.to_string())
        .map_err(|_| format!("Not a valid IP address: {}", trimmed))
}

fn resolve_with_system(hostname: &str) -> (Vec<String>, f64) {
    use std::time::Instant;
    let start = Instant::now();
    
    let ips: Vec<String> = dns_lookup::lookup_host(hostname)
        .unwrap_or_default()
        .into_iter()
        .map(|ip| ip.to_string())
        .collect();
    
    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    (ips, elapsed)
}

fn resolve_with_nslookup(hostname: &str, dns_server: &str) -> (Vec<String>, f64, Option<String>) {
    use std::time::Instant;
    let start = Instant::now();

    let output = Command::new("nslookup")
        .args([hostname, dns_server])
        .output();

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let ips = parse_nslookup_output(&stdout, hostname);
            (ips, elapsed, None)
        }
        Err(e) => {
            // Fallback: try dig if nslookup fails
            let dig_output = Command::new("dig")
                .args([&format!("@{}", dns_server), hostname, "+short"])
                .output();

            match dig_output {
                Ok(dig_out) => {
                    let stdout = String::from_utf8_lossy(&dig_out.stdout).to_string();
                    let ips: Vec<String> = stdout
                        .lines()
                        .filter(|l| !l.trim().is_empty())
                        .map(|l| l.trim().to_string())
                        .filter(|l| l.parse::<IpAddr>().is_ok())
                        .collect();
                    (ips, elapsed, None)
                }
                Err(_) => (
                    vec![],
                    elapsed,
                    Some(format!(
                        "nslookup/dig not available: {}. Using system resolver.",
                        e
                    )),
                ),
            }
        }
    }
}

fn parse_nslookup_output(output: &str, hostname: &str) -> Vec<String> {
    let mut ips = Vec::new();
    let mut in_answer = false;
    let hostname_lower = hostname.to_lowercase();

    for line in output.lines() {
        let trimmed = line.trim();
        // Skip server info block
        if trimmed.starts_with("Server:") || trimmed.starts_with("Address:") && !in_answer {
            continue;
        }
        if trimmed.contains(&hostname_lower) || trimmed.contains("Name:") {
            in_answer = true;
        }
        if in_answer && trimmed.starts_with("Address:") {
            let addr = trimmed
                .trim_start_matches("Address:")
                .trim()
                .split('#')
                .next()
                .unwrap_or("")
                .trim();
            if addr.parse::<IpAddr>().is_ok() {
                ips.push(addr.to_string());
            }
        }
    }

    // Fallback: scan all lines for IPs in the answer section
    if ips.is_empty() {
        for line in output.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("Address:") {
                let addr = trimmed
                    .trim_start_matches("Address:")
                    .trim()
                    .split('#')
                    .next()
                    .unwrap_or("")
                    .trim();
                if addr.parse::<IpAddr>().is_ok() {
                    ips.push(addr.to_string());
                }
            }
        }
        // Remove duplicates that came from the "Server: ..." block
        ips.dedup();
    }

    ips
}

#[tauri::command]
pub async fn resolve_dns(hostname: String, dns_server: Option<String>) -> Result<DnsResult, String> {
    let sanitized_host = sanitize_hostname(&hostname)?;
    
    let dns = dns_server
        .as_deref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());

    let (resolved_ips, query_time_ms, error, dns_used) = if let Some(server) = dns {
        let sanitized_server = sanitize_dns_server(server)?;
        let server_clone = sanitized_server.clone();
        let host_clone = sanitized_host.clone();
        
        let (ips, time, err) = tokio::task::spawn_blocking(move || {
            resolve_with_nslookup(&host_clone, &server_clone)
        })
        .await
        .map_err(|e| format!("Task error: {}", e))?;

        // If nslookup failed, fall back to system
        if ips.is_empty() {
            let host_clone2 = sanitized_host.clone();
            let (sys_ips, sys_time) = tokio::task::spawn_blocking(move || {
                resolve_with_system(&host_clone2)
            })
            .await
            .map_err(|e| format!("Task error: {}", e))?;
            (sys_ips, sys_time, err, format!("{} (fallback: system)", sanitized_server))
        } else {
            (ips, time, err, sanitized_server)
        }
    } else {
        let host_clone = sanitized_host.clone();
        let (ips, time) = tokio::task::spawn_blocking(move || {
            resolve_with_system(&host_clone)
        })
        .await
        .map_err(|e| format!("Task error: {}", e))?;
        (ips, time, None, "system".to_string())
    };

    let success = !resolved_ips.is_empty();

    Ok(DnsResult {
        hostname: sanitized_host,
        dns_server: dns_used,
        resolved_ips,
        success,
        error,
        query_time_ms,
    })
}
