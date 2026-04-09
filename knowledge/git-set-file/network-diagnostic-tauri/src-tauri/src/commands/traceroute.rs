use serde::{Deserialize, Serialize};
use std::process::Command;
use regex::Regex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TraceHop {
    pub hop: u32,
    pub host: String,
    pub ip: Option<String>,
    pub latencies_ms: Vec<Option<f64>>,
    pub avg_latency_ms: Option<f64>,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TracerouteResult {
    pub target: String,
    pub hops: Vec<TraceHop>,
    pub success: bool,
    pub error: Option<String>,
}

fn sanitize_host(host: &str) -> Result<String, String> {
    let trimmed = host.trim();
    if trimmed.is_empty() {
        return Err("Host cannot be empty".to_string());
    }
    if trimmed.len() > 253 {
        return Err("Host too long".to_string());
    }
    let valid = trimmed.chars().all(|c| {
        c.is_alphanumeric() || c == '.' || c == '-' || c == ':' || c == '_'
    });
    if !valid {
        return Err(format!("Invalid characters in host: {}", trimmed));
    }
    Ok(trimmed.to_string())
}

fn parse_traceroute_windows(output: &str) -> Vec<TraceHop> {
    let mut hops = Vec::new();
    // Windows tracert format:
    // "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
    // "  2     *        *        *     Request timed out."
    let hop_re = Regex::new(
        r"^\s*(\d+)\s+([\d<*]+\s*ms|[*]+)\s+([\d<*]+\s*ms|[*]+)\s+([\d<*]+\s*ms|[*]+)\s+(.*)",
    )
    .unwrap();

    for line in output.lines() {
        if let Some(caps) = hop_re.captures(line.trim()) {
            let hop_num: u32 = caps[1].parse().unwrap_or(0);
            let host_part = caps[5].trim().to_string();
            
            let mut latencies = Vec::new();
            for i in 2..=4 {
                let val = caps[i].trim();
                if val == "*" || val.contains("*") {
                    latencies.push(None);
                } else if val.contains("<1") {
                    latencies.push(Some(0.5));
                } else {
                    let num = val.replace("ms", "").trim().parse::<f64>().ok();
                    latencies.push(num);
                }
            }

            let valid_latencies: Vec<f64> = latencies.iter().filter_map(|x| *x).collect();
            let avg = if valid_latencies.is_empty() {
                None
            } else {
                Some(valid_latencies.iter().sum::<f64>() / valid_latencies.len() as f64)
            };

            let is_timeout = host_part.contains("timed out") || host_part.contains("*");
            let status = if is_timeout { "TIMEOUT" } else { "OK" }.to_string();

            // Try to parse IP from host_part like "hostname (1.2.3.4)" or just "1.2.3.4"
            let ip_re = Regex::new(r"\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)").unwrap();
            let ip = ip_re
                .captures(&host_part)
                .and_then(|c| c.get(1))
                .map(|m| m.as_str().to_string());

            let display_host = if is_timeout {
                "*".to_string()
            } else {
                host_part.clone()
            };

            hops.push(TraceHop {
                hop: hop_num,
                host: display_host,
                ip,
                latencies_ms: latencies,
                avg_latency_ms: avg,
                status,
            });
        }
    }
    hops
}

fn parse_traceroute_unix(output: &str) -> Vec<TraceHop> {
    let mut hops = Vec::new();
    // Unix traceroute format:
    // " 1  192.168.1.1 (192.168.1.1)  1.234 ms  1.456 ms  1.123 ms"
    // " 2  * * *"
    let hop_re = Regex::new(r"^\s*(\d+)\s+(.+)$").unwrap();
    let time_re = Regex::new(r"([\d.]+)\s*ms").unwrap();
    let ip_re = Regex::new(r"\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)").unwrap();
    let hostname_re = Regex::new(r"^([\w.\-]+)").unwrap();

    for line in output.lines() {
        let trimmed = line.trim();
        if let Some(caps) = hop_re.captures(trimmed) {
            let hop_num: u32 = caps[1].parse().unwrap_or(0);
            let rest = caps[2].trim();

            let is_timeout = rest.starts_with("* * *") || rest == "*";
            let ip = ip_re
                .captures(rest)
                .and_then(|c| c.get(1))
                .map(|m| m.as_str().to_string());

            let latencies: Vec<Option<f64>> = if is_timeout {
                vec![None, None, None]
            } else {
                time_re
                    .captures_iter(rest)
                    .map(|c| c.get(1).and_then(|m| m.as_str().parse::<f64>().ok()))
                    .take(3)
                    .collect()
            };

            let valid_latencies: Vec<f64> = latencies.iter().filter_map(|x| *x).collect();
            let avg = if valid_latencies.is_empty() {
                None
            } else {
                Some(valid_latencies.iter().sum::<f64>() / valid_latencies.len() as f64)
            };

            let status = if is_timeout { "TIMEOUT" } else { "OK" }.to_string();
            let display_host = if is_timeout {
                "*".to_string()
            } else {
                hostname_re
                    .captures(rest)
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str().to_string())
                    .unwrap_or_else(|| rest.to_string())
            };

            hops.push(TraceHop {
                hop: hop_num,
                host: display_host,
                ip,
                latencies_ms: latencies,
                avg_latency_ms: avg,
                status,
            });
        }
    }
    hops
}

#[tauri::command]
pub async fn traceroute_host(host: String, max_hops: Option<u32>) -> Result<TracerouteResult, String> {
    let hops_limit = max_hops.unwrap_or(30).min(64);

    let sanitized = sanitize_host(&host)?;
    let target = sanitized.clone();

    let result = tokio::task::spawn_blocking(move || {
        let output = if cfg!(target_os = "windows") {
            Command::new("tracert")
                .args(["-h", &hops_limit.to_string(), "-w", "1000", &sanitized])
                .output()
        } else if cfg!(target_os = "macos") {
            Command::new("traceroute")
                .args(["-m", &hops_limit.to_string(), "-w", "2", &sanitized])
                .output()
        } else {
            // Linux
            Command::new("traceroute")
                .args(["-m", &hops_limit.to_string(), "-w", "2", "-n", &sanitized])
                .output()
        };

        match output {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                let hops = if cfg!(target_os = "windows") {
                    parse_traceroute_windows(&stdout)
                } else {
                    parse_traceroute_unix(&stdout)
                };
                TracerouteResult {
                    target: target.clone(),
                    hops,
                    success: true,
                    error: None,
                }
            }
            Err(e) => TracerouteResult {
                target: target.clone(),
                hops: vec![],
                success: false,
                error: Some(format!(
                    "Failed to run traceroute: {}. Make sure traceroute/tracert is installed.",
                    e
                )),
            },
        }
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?;

    Ok(result)
}
