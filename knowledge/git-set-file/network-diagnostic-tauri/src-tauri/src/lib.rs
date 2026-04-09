mod commands;

use commands::ping::*;
use commands::traceroute::*;
use commands::dns::*;
use commands::parallel_ping::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            ping_host,
            bulk_ping,
            traceroute_host,
            resolve_dns,
            start_parallel_monitor,
            stop_parallel_monitor,
            get_monitor_results,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
