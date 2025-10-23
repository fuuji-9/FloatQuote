#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    AppHandle, Manager, Window, WindowBuilder, Wry,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

#[tauri::command]
fn set_click_through(window: Window, enabled: bool) {
    let _ = window.set_ignore_cursor_events(enabled);
}

fn build_tray(app: &AppHandle<Wry>) {
    let menu = Menu::new(app).unwrap();
    let settings = MenuItem::new(app, "settings", "Settings", true, None).unwrap();
    let quit = MenuItem::new(app, "quit", "Quit", true, None).unwrap();

    // Append items to the menu
    menu.append(&settings).unwrap();
    menu.append(&quit).unwrap();

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event({
            let settings_id = settings.id().clone();
            let quit_id = quit.id().clone();
            move |app, event| {
                if event.id() == settings_id {
                    let _ = app.emit("open-settings", ());
                } else if event.id() == quit_id {
                    app.exit(0);
                }
            }
        })
        .build(app)
        .ok();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--hidden".into()]),
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![set_click_through])
        .setup(|app| {
            // Ensure main window exists with our overlay defaults
            if app.get_window("main").is_none() {
                let _ = WindowBuilder::new(app, "main")
                    .title("")
                    .decorations(false)
                    .transparent(true)
                    .resizable(false)
                    .fullscreen(true)
                    .build();
            }

            // Build the tray icon + menu
            let handle = app.handle();
            build_tray(&handle);

            #[cfg(target_os = "windows")]
            {
                use raw_window_handle::{HasRawWindowHandle, RawWindowHandle};
                if let Some(window) = app.get_window("main") {
                    if let Ok(RawWindowHandle::Win32(handle)) = window.raw_window_handle() {
                        println!("Win32 handle: {:?}", handle);
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
