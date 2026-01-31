# vscode-mux

<p align="center">
  <img src="res/icon.png" width="128" height="128" alt="CodeMux Logo">
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=jellydn.vscode-mux" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/jellydn.vscode-mux.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

Integrate VS Code's terminal with tmux or zellij. Opening a terminal automatically attaches to (or creates) a multiplexer session using the current workspace name.

## Features

- Auto-launch tmux or zellij sessions when opening terminal
- Workspace-based session naming
- Multiple VS Code windows handled gracefully with numbered sessions
- Session persistence on terminal close
- Graceful fallback when multiplexer is not installed
- Kill session via command palette
- Session name shown in terminal tab title

## Configuration

<!-- configs -->

## Commands

<!-- commands -->

## Requirements

- VS Code 1.97.0+
- macOS or Linux
- tmux or zellij installed

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/jellydn/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/jellydn/static/sponsors.png'/>
  </a>
</p>

## License

[MIT](./LICENSE.md) License © 2022 [Dung Huynh Duc](https://github.com/jellydn)
