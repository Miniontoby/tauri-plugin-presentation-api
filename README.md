# Tauri Plugin PresentationAPI


## Install:


`src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri-plugin-store = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "dev" }
```

```
pnpm add https://github.com/tauri-apps/tauri-plugin-store
# or
npm add https://github.com/tauri-apps/tauri-plugin-store
# or
yarn add https://github.com/tauri-apps/tauri-plugin-store
```

## Usage

`src-tauri/src/main.rs`:
```rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```


