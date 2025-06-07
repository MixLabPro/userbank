use tauri::{Emitter, Manager};
use tauri_plugin_updater::UpdaterExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    println!("开始检查更新...");
    println!("当前应用版本: {}", app.package_info().version);
    
    let updater = match app.updater() {
        Ok(u) => {
            println!("更新器初始化成功");
            u
        },
        Err(e) => {
            println!("更新器初始化失败: {:?}", e);
            return Err(format!("更新器初始化失败: {:?}", e));
        }
    };
    
    println!("开始检查新版本...");
    
    // 添加重试逻辑
    let mut retry_count = 0;
    let max_retries = 3;
    
    while retry_count < max_retries {
        match updater.check().await {
            Ok(update_opt) => {
                if let Some(update) = update_opt {
                    println!("发现新版本！");
                    println!("当前版本: {}", app.package_info().version);
                    println!("新版本: {}", update.version);
                    println!("更新说明: {}", update.body.as_deref().unwrap_or("无更新说明"));
                    
                    let update_info = serde_json::json!({
                        "version": update.version,
                        "date": update.date.map(|d| d.to_string()).unwrap_or_else(|| "未知".to_string()),
                        "body": update.body.as_deref().unwrap_or("无更新说明"),
                        "download_url": update.download_url
                    });
                    
                    return Ok(Some(update_info));
                } else {
                    println!("检查完成：当前已是最新版本");
                    return Ok(None);
                }
            }
            Err(e) => {
                println!("检查更新失败 (尝试 {}/{}): {:?}", retry_count + 1, max_retries, e);
                if retry_count == max_retries - 1 {
                    return Err(format!("检查更新失败: {:?}", e));
                }
            }
        }
        
        retry_count += 1;
        if retry_count < max_retries {
            println!("等待 3 秒后重试...");
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        }
    }

    Err("检查更新失败".to_string())
}

#[tauri::command]
async fn download_and_install_update(app: tauri::AppHandle) -> Result<(), String> {
    println!("开始下载并安装更新...");
    
    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            return Err(format!("更新器初始化失败: {:?}", e));
        }
    };
    
    match updater.check().await {
        Ok(Some(update)) => {
            println!("开始下载更新...");
            let mut downloaded = 0;

            match update
                .download_and_install(
                    |chunk_length, content_length| {
                        downloaded += chunk_length;
                        if let Some(total) = content_length {
                            let progress = (downloaded as f64 / total as f64 * 100.0) as u64;
                            println!("下载进度: {}% ({} / {} 字节)", progress, downloaded, total);
                            
                            // 发送下载进度事件到前端
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("download-progress", serde_json::json!({
                                    "progress": progress,
                                    "downloaded": downloaded,
                                    "total": total
                                }));
                            }
                        } else {
                            println!("已下载: {} 字节", downloaded);
                        }
                    },
                    || {
                        println!("下载完成，准备安装...");
                        // 发送下载完成事件到前端
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("download-complete", ());
                        }
                    },
                )
                .await
            {
                Ok(_) => {
                    println!("更新已安装完成，准备重启应用...");
                    app.restart();
                    // 注意：app.restart() 会终止当前进程，下面的代码不会执行
                    #[allow(unreachable_code)]
                    Ok(())
                }
                Err(e) => {
                    println!("下载或安装更新失败: {:?}", e);
                    Err(format!("下载或安装更新失败: {:?}", e))
                }
            }
        }
        Ok(None) => {
            Err("没有可用的更新".to_string())
        }
        Err(e) => {
            Err(format!("检查更新失败: {:?}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1", "--flag2"]) /* arbitrary number of args to pass to your app */
            ))?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            check_for_updates,
            download_and_install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
