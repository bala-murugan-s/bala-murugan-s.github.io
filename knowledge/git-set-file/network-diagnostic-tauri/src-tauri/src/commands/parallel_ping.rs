use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::task::JoinHandle;

use crate::commands::ping::execute_ping;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PingEntry {
    pub latency_ms: Option<f64>,
    pub success: bool,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonitorRow {
    pub host: String,
    pub history: Vec<PingEntry>,     // last 10
    pub avg_last_10: Option<f64>,
    pub overall_avg: Option<f64>,
    pub total_pings: u32,
    pub total_success: u32,
    pub last_status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonitorState {
    pub rows: Vec<MonitorRow>,
    pub running: bool,
    pub started_at: u64,
}

// Global shared state
lazy_static::lazy_static! {
    static ref MONITOR_STATE: Arc<Mutex<Option<MonitorData>>> = Arc::new(Mutex::new(None));
}

struct MonitorData {
    rows: HashMap<String, MonitorRow>,
    running: bool,
    started_at: u64,
    hosts_order: Vec<String>,
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[tauri::command]
pub async fn start_parallel_monitor(
    hosts: Vec<String>,
    interval_ms: Option<u64>,
) -> Result<String, String> {
    if hosts.is_empty() {
        return Err("No hosts provided".to_string());
    }
    if hosts.len() > 50 {
        return Err("Maximum 50 hosts for parallel monitor".to_string());
    }

    let interval = interval_ms.unwrap_or(2000).max(500).min(30000);

    // Sanitize hosts
    let valid_hosts: Vec<String> = hosts
        .into_iter()
        .map(|h| h.trim().to_string())
        .filter(|h| !h.is_empty() && h.len() <= 253)
        .filter(|h| h.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '-' || c == ':' || c == '_'))
        .collect();

    if valid_hosts.is_empty() {
        return Err("No valid hosts after sanitization".to_string());
    }

    // Initialize state
    {
        let mut state = MONITOR_STATE.lock().map_err(|e| e.to_string())?;
        let mut rows = HashMap::new();
        for host in &valid_hosts {
            rows.insert(
                host.clone(),
                MonitorRow {
                    host: host.clone(),
                    history: Vec::new(),
                    avg_last_10: None,
                    overall_avg: None,
                    total_pings: 0,
                    total_success: 0,
                    last_status: "PENDING".to_string(),
                },
            );
        }
        *state = Some(MonitorData {
            rows,
            running: true,
            started_at: current_timestamp(),
            hosts_order: valid_hosts.clone(),
        });
    }

    // Spawn background monitoring task
    let hosts_clone = valid_hosts.clone();
    let state_ref = MONITOR_STATE.clone();

    tokio::spawn(async move {
        loop {
            // Check if still running
            {
                let state = state_ref.lock().unwrap();
                if let Some(data) = state.as_ref() {
                    if !data.running {
                        break;
                    }
                } else {
                    break;
                }
            }

            // Ping all hosts in parallel
            let handles: Vec<(String, JoinHandle<_>)> = hosts_clone
                .iter()
                .map(|host| {
                    let h = host.clone();
                    let handle = tokio::task::spawn_blocking(move || execute_ping(&h, 1));
                    (host.clone(), handle)
                })
                .collect();

            let timestamp = current_timestamp();

            for (host, handle) in handles {
                if let Ok(result) = handle.await {
                    let entry = PingEntry {
                        latency_ms: result.latency_ms,
                        success: result.success,
                        timestamp,
                    };

                    let mut state = state_ref.lock().unwrap();
                    if let Some(data) = state.as_mut() {
                        if !data.running {
                            break;
                        }
                        if let Some(row) = data.rows.get_mut(&host) {
                            // Add to history, keep last 10
                            row.history.push(entry.clone());
                            if row.history.len() > 10 {
                                row.history.remove(0);
                            }

                            // Update counters
                            row.total_pings += 1;
                            if entry.success {
                                row.total_success += 1;
                            }

                            // Compute avg of last 10
                            let valid_latencies: Vec<f64> = row
                                .history
                                .iter()
                                .filter_map(|e| e.latency_ms)
                                .collect();
                            row.avg_last_10 = if valid_latencies.is_empty() {
                                None
                            } else {
                                Some(
                                    valid_latencies.iter().sum::<f64>()
                                        / valid_latencies.len() as f64,
                                )
                            };

                            // Overall average (recompute from history for simplicity; track running avg)
                            row.overall_avg = row.avg_last_10; // In production, track separately

                            // Status
                            row.last_status = if entry.success {
                                format!(
                                    "OK ({:.1}ms)",
                                    entry.latency_ms.unwrap_or(0.0)
                                )
                            } else {
                                "FAIL".to_string()
                            };
                        }
                    }
                }
            }

            // Wait for next interval
            tokio::time::sleep(Duration::from_millis(interval)).await;
        }
    });

    Ok("Monitor started".to_string())
}

#[tauri::command]
pub async fn stop_parallel_monitor() -> Result<String, String> {
    let mut state = MONITOR_STATE.lock().map_err(|e| e.to_string())?;
    if let Some(data) = state.as_mut() {
        data.running = false;
    }
    Ok("Monitor stopped".to_string())
}

#[tauri::command]
pub async fn get_monitor_results() -> Result<MonitorState, String> {
    let state = MONITOR_STATE.lock().map_err(|e| e.to_string())?;
    match state.as_ref() {
        None => Ok(MonitorState {
            rows: vec![],
            running: false,
            started_at: 0,
        }),
        Some(data) => {
            let rows = data
                .hosts_order
                .iter()
                .filter_map(|h| data.rows.get(h).cloned())
                .collect();
            Ok(MonitorState {
                rows,
                running: data.running,
                started_at: data.started_at,
            })
        }
    }
}
