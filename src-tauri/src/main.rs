#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    AppHandle, Manager, Window, WindowBuilder, Wry,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter,
};
use tauri_plugin_autostart::MacosLauncher;

#[cfg(target_os = "windows")]
fn send_window_to_bottom(window: &Window) {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE, SWP_NOOWNERZORDER, SWP_NOSENDCHANGING, SWP_SHOWWINDOW, WINDOW_POS_FLAGS};

    if let Ok(handle) = window.window_handle() {
        if let RawWindowHandle::Win32(h) = handle.as_raw() {
            // Safety: using OS API with a valid HWND from Tauri's window
            unsafe {
                let hwnd = HWND(h.hwnd as isize);
                let _ = SetWindowPos(
                    hwnd,
                    HWND_BOTTOM,
                    0,
                    0,
                    0,
                    0,
                    WINDOW_POS_FLAGS(SWP_NOMOVE.0 | SWP_NOSIZE.0 | SWP_NOACTIVATE.0 | SWP_NOOWNERZORDER.0 | SWP_NOSENDCHANGING.0 | SWP_SHOWWINDOW.0),
                );
            }
        }
    }
}

#[tauri::command]
fn set_click_through(window: Window, enabled: bool) {
    let _ = window.set_ignore_cursor_events(enabled);
}

fn build_tray(app: &AppHandle<Wry>) {
    let menu = Menu::new(app).unwrap();
    let settings = MenuItem::new(app, "Settings", true, None::<&str>).unwrap();
    let quit = MenuItem::new(app, "Quit", true, None::<&str>).unwrap();
    menu.append(&settings).unwrap();
    menu.append(&quit).unwrap();

    let settings_id = settings.id().clone();
    let quit_id = quit.id().clone();
    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(move |app, event| {
            if settings_id == event.id() {
                let _ = app.emit("open-settings", ());
            } else if quit_id == event.id() {
                app.exit(0);
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

            // Attempt to send window to bottom so it behaves like a wallpaper overlay
            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_window("main") {
                send_window_to_bottom(&window);
            }

            #[cfg(target_os = "windows")]
            {
                use raw_window_handle::{HasWindowHandle, RawWindowHandle};
                if let Some(window) = app.get_window("main") {
                    if let Ok(h) = window.window_handle() {
                        match h.as_raw() {
                            RawWindowHandle::Win32(handle) => {
                                println!("Win32 handle: {:?}", handle);
                            }
                            _ => {}
                        }
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
