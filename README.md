# Tauri Plugin Presentation API


## Install:


`src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri-plugin-presentation-api = {}
```

```
pnpm add https://github.com/Miniontoby/tauri-plugin-presentation-api
# or
npm add https://github.com/Miniontoby/tauri-plugin-presentation-api
# or
yarn add https://github.com/Miniontoby/tauri-plugin-presentation-api
```

## Usage

`src-tauri/src/main.rs`:
```rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_presentation_api::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```


