#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    AppHandle, Manager, Window, WindowBuilder, Wry,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    WebviewWindowBuilder, WebviewUrl,
};
use tauri_plugin_autostart::MacosLauncher;

#[cfg(target_os = "windows")]
fn apply_window_styles(window: &Window, click_through: bool) {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_NOACTIVATE, WS_EX_TRANSPARENT, WS_EX_TOOLWINDOW, WS_EX_NOREDIRECTIONBITMAP};

    if let Ok(handle) = window.window_handle() {
        if let RawWindowHandle::Win32(h) = handle.as_raw() {
            unsafe {
                let hwnd = HWND(h.hwnd.get());
                let mut ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as isize;
                // Always prevent activation so focusing overlay doesn't block taskbar
                ex |= WS_EX_NOACTIVATE.0 as isize;
                // Hide from Alt-Tab and reduce non-client painting quirks
                ex |= WS_EX_TOOLWINDOW.0 as isize;
                // Avoid frame redirection artifacts in transparent windows
                ex |= WS_EX_NOREDIRECTIONBITMAP.0 as isize;
                // Toggle native click-through
                if click_through {
                    ex |= WS_EX_TRANSPARENT.0 as isize;
                } else {
                    ex &= !(WS_EX_TRANSPARENT.0 as isize);
                }
                let _ = SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex);
            }
        }
    }
}
#[cfg(target_os = "windows")]
fn send_window_to_bottom(window: &Window) {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE, SWP_NOOWNERZORDER, SWP_NOSENDCHANGING, SWP_SHOWWINDOW, SET_WINDOW_POS_FLAGS};

    if let Ok(handle) = window.window_handle() {
        if let RawWindowHandle::Win32(h) = handle.as_raw() {
            // Safety: using OS API with a valid HWND from Tauri's window
            unsafe {
                let hwnd = HWND(h.hwnd.get());
                let _ = SetWindowPos(
                    hwnd,
                    HWND_BOTTOM,
                    0,
                    0,
                    0,
                    0,
                    SET_WINDOW_POS_FLAGS(SWP_NOMOVE.0 | SWP_NOSIZE.0 | SWP_NOACTIVATE.0 | SWP_NOOWNERZORDER.0 | SWP_NOSENDCHANGING.0 | SWP_SHOWWINDOW.0),
                );
            }
        }
    }
}

// DWM frame extension removed; we'll rely on transparent webview background instead

#[tauri::command]
fn set_click_through(window: Window, enabled: bool) {
    let _ = window.set_ignore_cursor_events(enabled);
    #[cfg(target_os = "windows")]
    apply_window_styles(&window, enabled);
}

fn open_settings(app: &AppHandle<Wry>) {
    if let Some(w) = app.get_window("settings") {
        let _ = w.set_focus();
        return;
    }
    let _ = WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("/settings.html".into()))
        .title("Settings")
        .resizable(true)
        .visible(true)
        .build();
}

fn build_tray(app: &AppHandle<Wry>) {
    let menu = Menu::new(app).unwrap();
    let settings = MenuItem::new(app, "Settings", true, None::<&str>).unwrap();
    let quit = MenuItem::new(app, "Quit", true, None::<&str>).unwrap();
    menu.append(&settings).unwrap();
    menu.append(&quit).unwrap();

    let settings_id = settings.id().clone();
    let quit_id = quit.id().clone();
    let mut builder = TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(move |app, event| {
            if settings_id == event.id() {
                open_settings(app);
            } else if quit_id == event.id() {
                app.exit(0);
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    let _tray = builder.build(app).ok();
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
                    .shadow(false)
                    .resizable(false)
                    .build();
            }

            // Build the tray icon + menu
            let handle = app.handle();
            build_tray(&handle);

            // Attempt to send window to bottom so it behaves like a wallpaper overlay
            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_window("main") {
                // Fit to the current monitor instead of using OS fullscreen (avoids artifacts)
                if let Ok(Some(m)) = window.current_monitor() {
                    let size = m.size();
                    let _ = window.set_size(*size);
                    let _ = window.set_position(tauri::PhysicalPosition { x: 0, y: 0 });
                }
                // Hide from taskbar explicitly
                let _ = window.set_skip_taskbar(true);
                send_window_to_bottom(&window);
                // Default to non-activatable + click-through to avoid blocking taskbar
                apply_window_styles(&window, true);
                // No DWM extend; transparent webview background should prevent banding
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
