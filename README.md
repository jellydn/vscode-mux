# VSCode Mux

<p align="center">
  <img src="res/icon.png" width="128" height="128" alt="CodeMux Logo">
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=jellydn.vscode-mux" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/jellydn.vscode-mux.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
  <a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>
</p>

Integrate VS Code's terminal with tmux or zellij. Opening a terminal automatically attaches to (or creates) a multiplexer session using the current workspace name.

## Why CodeMux?

If you rely on tmux or zellij for terminal multiplexing, VS Code's default terminal experience breaks your flow:

- **Manual setup**: You must manually create or attach sessions every time you open a terminal
- **Lost context**: Workspace context isn't preserved across terminal sessions
- **Repetitive tasks**: Repeating this setup across projects is tedious

CodeMux solves this by making tmux/zellij the default terminal experience in VS Code—one workspace, one persistent session.

## How It Works

CodeMux registers a custom terminal profile that automatically launches your preferred multiplexer when you open a new terminal:

1. **First terminal**: Creates a new session named after your workspace (e.g., `myproject`)
2. **Subsequent terminals**: Attach to the existing session, preserving your panes and running processes
3. **Multiple windows**: Each VS Code window gets its own numbered session (`myproject-2`, `myproject-3`, etc.)

## Features

- **Auto-launch**: Opens directly into tmux or zellij when creating a new terminal
- **Workspace-based naming**: Sessions automatically named after your workspace
- **Session persistence**: Closing the terminal doesn't kill the session—state is preserved
- **Multi-window support**: Multiple VS Code windows get numbered sessions to avoid conflicts
- **Graceful fallback**: Helpful notification when multiplexer isn't installed
- **Kill command**: Clean up sessions directly from the command palette
- **Session name in title**: Terminal tab shows the current session name

## Usage

### Setting Up CodeMux

1. Install the extension
2. Set CodeMux as your default terminal profile:
   - Open VS Code Settings
   - Search for "Terminal > Profile: Osx" (or your OS equivalent)
   - Select "CodeMux" from the dropdown
3. Open a new terminal—you're now in a tmux/zellij session!

### Using CodeMux Commands

You can also use CodeMux commands from the command palette:

- **CodeMux: New Session** - Create or attach to a session
- **CodeMux: Kill Current Session** - Kill the current session

### Session Naming Strategies

By default, sessions are named after your workspace. You can customize this:

| Strategy    | Example Session Name                 |
| ----------- | ------------------------------------ |
| `workspace` | `my-project` (uses workspace name)   |
| `folder`    | `src` (uses folder basename)         |
| `custom`    | `dev-environment` (uses custom name) |

### Multiple Windows

When opening the same workspace in multiple VS Code windows:

- Window 1: `myproject`
- Window 2: `myproject-2`
- Window 3: `myproject-3`

## Configuration

<!-- configs -->

| Key                                   | Description                                                                               | Type      | Default       |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | --------- | ------------- |
| `codemux.multiplexer`                 | Terminal multiplexer to use                                                               | `string`  | `"tmux"`      |
| `codemux.sessionNameStrategy`         | How to derive session name from workspace                                                 | `string`  | `"workspace"` |
| `codemux.customSessionName`           | Custom session name when sessionNameStrategy is 'custom'                                  | `string`  | `""`          |
| `codemux.autoAttach`                  | Automatically attach to existing session                                                  | `boolean` | `true`        |
| `codemux.attachIfExists`              | When creating a new session, attach to existing session if one matches the workspace name | `boolean` | `true`        |
| `codemux.suppressMissingNotification` | Suppress notification when multiplexer is not installed                                   | `boolean` | `false`       |
| `codemux.windowsSupport`              | Allow CodeMux to attempt running on Windows (useful with WSL or compatible shells)        | `string`  | `"disabled"`  |

<!-- configs -->

## Commands

<!-- commands -->

| Command               | Title                         |
| --------------------- | ----------------------------- |
| `codemux.killSession` | CodeMux: Kill Current Session |
| `codemux.newSession`  | CodeMux: New Session          |

<!-- commands -->

## Requirements

- **VS Code**: 1.97.0 or higher
- **Operating System**: macOS or Linux (Windows is opt-in via `codemux.windowsSupport`)
- **Multiplexer**: tmux or zellij must be installed and available in your PATH

### Installing tmux

```bash
# macOS (Homebrew)
brew install tmux

# Ubuntu/Debian
sudo apt-get install tmux

# Fedora
sudo dnf install tmux
```

### Installing zellij

```bash
# macOS (Homebrew)
brew install zellij

# Ubuntu/Debian
cargo install zellij

# Or download from GitHub releases
```

## Limitations

The following features are explicitly out of scope:

- **Windows support**: Disabled by default; enable `codemux.windowsSupport` if you want to try it (e.g. with WSL or compatible shells)
- **Pane/layout management**: CodeMux doesn't manage panes within tmux/zellij—use their native features
- **Editor sync**: VS Code editor splits don't sync with multiplexer panes
- **Multi-root workspaces**: Uses the first folder or workspace name
- **Auto-cleanup**: Sessions persist until manually killed

## Troubleshooting

### Terminal opens to a plain shell

If the multiplexer isn't launching:

1. Check that tmux or zellij is installed: `which tmux` / `which zellij` (or `where tmux` / `where zellij` on Windows)
2. Verify the `codemux.multiplexer` setting matches your installed tool
3. Check VS Code's Output panel for CodeMux error messages

### Can't attach to existing session

If you see "session already exists" errors:

- Set `codemux.autoAttach` to `false` to always create new sessions
- Or manually kill the old session: `tmux kill-session -t <name>` / `zellij kill-session <name>`

## Author

👤 **Huynh Duc Dung**

- Website: [https://productsway.com/](https://productsway.com/)
- Twitter: [@jellydn](https://twitter.com/jellydn)
- GitHub: [@jellydn](https://github.com/jellydn)

## Show your support

If this project has been helpful, please give it a ⭐️.

[![kofi](https://img.shields.io/badge/Ko--fi-F16061?style=flat&logo=ko-fi&logoColor=white)](https://ko-fi.com/dunghd) [![paypal](https://img.shields.io/badge/PayPal-00457C?style=flat&logo=paypal&logoColor=white)](https://paypal.me/dunghd) [![buymeacoffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dunghd)

## License

[MIT](./LICENSE.md) License © 2026 
