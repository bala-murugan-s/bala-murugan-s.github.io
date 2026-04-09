use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Instant;
use regex::Regex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PingResult {
    pub host: String,
    pub success: bool,
    pub latency_ms: Option<f64>,
    pub packet_loss: f64,
    pub status: String,
    pub error: Option<String>,
    pub timestamp: u64,
}

fn current_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Sanitize input: allow only alphanumeric, dots, hyphens, colons (for IPv6)
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

fn parse_ping_output(output: &str, host: &str) -> PingResult {
    let timestamp = current_timestamp();

    // Cross-platform latency parsing
    // Windows: "Average = 12ms" or "time=12ms" or "time<1ms"
    // Linux/macOS: "time=12.3 ms" or "rtt min/avg/max/mdev = 1.2/3.4/5.6/0.8 ms"
    
    let latency_ms: Option<f64> = {
        // Try Linux/macOS rtt line first
        let rtt_re = Regex::new(r"rtt min/avg/max/mdev = [\d.]+/([\d.]+)/").ok();
        let avg_re = Regex::new(r"Average\s*=\s*(\d+)\s*ms").ok();
        let time_re = Regex::new(r"time[<=]([\d.]+)\s*ms").ok();
        let time_lt_re = Regex::new(r"time<1ms").ok();

        if let Some(re) = rtt_re {
            re.captures(output)
                .and_then(|c| c.get(1))
                .and_then(|m| m.as_str().parse::<f64>().ok())
        } else {
            None
        }
        .or_else(|| {
            avg_re.as_ref().and_then(|re| {
                re.captures(output)
                    .and_then(|c| c.get(1))
                    .and_then(|m| m.as_str().parse::<f64>().ok())
            })
        })
        .or_else(|| {
            // Check time<1ms pattern (Windows)
            if time_lt_re.as_ref().map(|re| re.is_match(output)).unwrap_or(false) {
                Some(0.5)
            } else {
                time_re.as_ref().and_then(|re| {
                    re.captures_iter(output)
                        .filter_map(|c| c.get(1).and_then(|m| m.as_str().parse::<f64>().ok()))
                        .reduce(|acc, x| acc + x)
                        .map(|sum| {
                            let count = re.captures_iter(output).count();
                            if count > 0 { sum / count as f64 } else { sum }
                        })
                })
            }
        })
    };

    // Parse packet loss
    let packet_loss: f64 = {
        let loss_re = Regex::new(r"(\d+)%\s*(?:packet\s*)?loss").ok();
        loss_re
            .as_ref()
            .and_then(|re| re.captures(output))
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse::<f64>().ok())
            .unwrap_or_else(|| {
                // Windows format: "Lost = 0 (0% loss)"
                let win_re = Regex::new(r"\((\d+)%\s+loss\)").ok();
                win_re
                    .as_ref()
                    .and_then(|re| re.captures(output))
                    .and_then(|c| c.get(1))
                    .and_then(|m| m.as_str().parse::<f64>().ok())
                    .unwrap_or(100.0)
            })
    };

    let success = packet_loss < 100.0 && latency_ms.is_some();
    let status = if success {
        format!("OK ({:.1}ms)", latency_ms.unwrap_or(0.0))
    } else {
        "UNREACHABLE".to_string()
    };

    PingResult {
        host: host.to_string(),
        success,
        latency_ms,
        packet_loss,
        status,
        error: None,
        timestamp,
    }
}

pub fn execute_ping(host: &str, count: u32) -> PingResult {
    let timestamp = current_timestamp();

    let sanitized = match sanitize_host(host) {
        Ok(h) => h,
        Err(e) => {
            return PingResult {
                host: host.to_string(),
                success: false,
                latency_ms: None,
                packet_loss: 100.0,
                status: "INVALID INPUT".to_string(),
                error: Some(e),
                timestamp,
            };
        }
    };

    let output = if cfg!(target_os = "windows") {
        Command::new("ping")
            .args(["-n", &count.to_string(), &sanitized])
            .output()
    } else {
        Command::new("ping")
            .args(["-c", &count.to_string(), "-W", "2", &sanitized])
            .output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let combined = format!("{}{}", stdout, stderr);
            parse_ping_output(&combined, &sanitized)
        }
        Err(e) => PingResult {
            host: sanitized,
            success: false,
            latency_ms: None,
            packet_loss: 100.0,
            status: "ERROR".to_string(),
            error: Some(format!("Failed to execute ping: {}", e)),
            timestamp,
        },
    }
}

#[tauri::command]
pub async fn ping_host(host: String, count: Option<u32>) -> Result<PingResult, String> {
    let ping_count = count.unwrap_or(4).min(20); // cap at 20
    let result = tokio::task::spawn_blocking(move || {
        execute_ping(&host, ping_count)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?;
    Ok(result)
}

#[tauri::command]
pub async fn bulk_ping(hosts: Vec<String>, count: Option<u32>) -> Result<Vec<PingResult>, String> {
    let ping_count = count.unwrap_or(2).min(10);
    
    if hosts.len() > 100 {
        return Err("Maximum 100 hosts allowed for bulk ping".to_string());
    }

    let handles: Vec<_> = hosts
        .into_iter()
        .map(|host| {
            tokio::task::spawn_blocking(move || execute_ping(&host, ping_count))
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        match handle.await {
            Ok(result) => results.push(result),
            Err(e) => results.push(PingResult {
                host: "unknown".to_string(),
                success: false,
                latency_ms: None,
                packet_loss: 100.0,
                status: "ERROR".to_string(),
                error: Some(format!("Task failed: {}", e)),
                timestamp: current_timestamp(),
            }),
        }
    }
    Ok(results)
}
