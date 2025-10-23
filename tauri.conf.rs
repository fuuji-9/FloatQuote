#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    plugin::{Plugin, PluginExt},
    utils::config::{AppUrl, WindowUrl},
    Builder, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    CustomMenuItem, WindowBuilder,
};

fn main() {
    let system_tray = SystemTray::new().with_menu(SystemTrayMenu::new().add_item(
        CustomMenuItem::new("settings", "Settings"),
    ));

    Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden".into()]),
        ))
        .plugin(tauri_plugin_opener::init())
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                if id.as_str() == "settings" {
                    let _ = WindowBuilder::new(app, "settings")
                        .title("Settings")
                        .build();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
