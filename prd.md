# PRD: CodeMux (VS Code Extension)

## Introduction

CodeMux is a Visual Studio Code extension that seamlessly integrates VS Code's terminal with tmux or zellij. It overrides the default terminal behavior so that opening a terminal automatically attaches to (or creates) a multiplexer session using the current workspace as the session name.

**Problem:** Developers who rely on tmux or zellij lose flow when using VS Code because:
- VS Code opens a plain shell instead of a multiplexer
- Users must manually create or attach sessions
- Workspace context is not preserved across terminal sessions
- Repeating this setup across projects is tedious

## Goals

- Make tmux/zellij the default terminal experience in VS Code
- Automatically map one workspace → one session
- Require minimal configuration
- Preserve fast terminal startup and reliability
- Handle multiple VS Code windows gracefully with numbered sessions

## User Stories

### US-001: Register custom terminal profile
**Description:** As a developer, I need a custom terminal profile registered in VS Code so CodeMux can override default terminal behavior.

**Acceptance Criteria:**
- [ ] Extension registers "CodeMux" terminal profile on activation
- [ ] Profile appears in VS Code terminal profile dropdown
- [ ] Profile can be set as default in VS Code settings
- [ ] Extension activates when terminal is opened
- [ ] Typecheck passes

### US-002: Launch tmux session from terminal
**Description:** As a tmux user, I want the terminal to automatically start/attach a tmux session so I don't have to run commands manually.

**Acceptance Criteria:**
- [ ] Opening terminal runs `tmux new-session -A -s <session-name>`
- [ ] If session exists, attaches to it
- [ ] If session doesn't exist, creates it
- [ ] Terminal starts in workspace root directory
- [ ] Typecheck passes

### US-003: Launch zellij session from terminal
**Description:** As a zellij user, I want the terminal to automatically start/attach a zellij session so I don't have to run commands manually.

**Acceptance Criteria:**
- [ ] Opening terminal runs `zellij attach <session-name> || zellij -s <session-name>`
- [ ] If session exists, attaches to it
- [ ] If session doesn't exist, creates it
- [ ] Terminal starts in workspace root directory
- [ ] Typecheck passes

### US-004: Workspace-based session naming
**Description:** As a user, I want sessions named after my workspace so each project has its own persistent session.

**Acceptance Criteria:**
- [ ] Session name defaults to `workspace.name`
- [ ] Falls back to folder name if workspace is unnamed
- [ ] Session name is sanitized (no special characters that break tmux/zellij)
- [ ] Typecheck passes

### US-005: Handle multiple VS Code windows with same workspace
**Description:** As a user opening the same workspace in multiple VS Code windows, I want each window to get its own session so they don't conflict.

**Acceptance Criteria:**
- [ ] First window creates session `<workspace>`
- [ ] Second window creates session `<workspace>-2`
- [ ] Third window creates session `<workspace>-3`, etc.
- [ ] Closing a window does not affect other sessions
- [ ] Typecheck passes

### US-006: Multiplexer selection setting
**Description:** As a user, I want to choose between tmux and zellij so I can use my preferred tool.

**Acceptance Criteria:**
- [ ] Setting `codemux.multiplexer` accepts "tmux" or "zellij"
- [ ] Default is "tmux"
- [ ] Changing setting takes effect on next terminal opened
- [ ] Typecheck passes

### US-007: Session naming strategy setting
**Description:** As a user, I want to configure how sessions are named so I can customize my workflow.

**Acceptance Criteria:**
- [ ] Setting `codemux.sessionNameStrategy` accepts "workspace", "folder", or "custom"
- [ ] "workspace" uses workspace name (default)
- [ ] "folder" uses folder basename
- [ ] "custom" uses value from `codemux.customSessionName`
- [ ] Typecheck passes

### US-008: Graceful fallback when multiplexer not installed
**Description:** As a user without tmux/zellij installed, I want a helpful notification so I know how to fix it.

**Acceptance Criteria:**
- [ ] Extension checks if configured multiplexer binary exists in PATH
- [ ] If not found, falls back to normal shell
- [ ] Shows notification: "[multiplexer] not found. Install it to use CodeMux."
- [ ] Notification includes "Don't show again" option
- [ ] Typecheck passes

### US-009: Auto-attach configuration
**Description:** As a user, I want to optionally disable auto-attach so I can control session behavior.

**Acceptance Criteria:**
- [ ] Setting `codemux.autoAttach` (boolean, default true)
- [ ] When false, always creates new session (no attach)
- [ ] Typecheck passes

### US-010: Session persistence on terminal close
**Description:** As a user, I want my session to persist when I close the terminal so I can reattach later.

**Acceptance Criteria:**
- [ ] Closing VS Code terminal does NOT kill the multiplexer session
- [ ] Reopening terminal reattaches to the existing session
- [ ] Session state (running processes, panes) is preserved
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Register custom terminal profile "CodeMux" using VS Code Terminal Profiles API
- FR-2: Execute shell wrapper that launches tmux or zellij based on `codemux.multiplexer` setting
- FR-3: Derive session name from workspace name, folder name, or custom value based on `codemux.sessionNameStrategy`
- FR-4: Sanitize session name by replacing invalid characters with hyphens
- FR-5: Append numeric suffix (-2, -3, etc.) when session name already exists from another window
- FR-6: Set working directory to workspace root when creating session
- FR-7: Check multiplexer binary availability before launching; fall back to shell with notification if missing
- FR-8: Support bash, zsh, and fish shells as the inner shell
- FR-9: Detach cleanly when terminal is closed (do not kill session)

## Non-Goals (Out of Scope)

- Pane or layout management within the multiplexer
- Syncing VS Code editor splits with tmux/zellij panes
- Windows support (macOS and Linux only)
- Remote session orchestration
- Multi-root workspace support (use first folder or workspace name)
- Killing sessions automatically

## Technical Considerations

- Built using VS Code Terminal Profiles API (`vscode.window.registerTerminalProfileProvider`)
- Shell wrapper script validates multiplexer availability before execution
- Session name collision detection via `tmux list-sessions` or `zellij list-sessions`
- Extension activation event: `onStartupFinished` or `onCommand:workbench.action.terminal.new`
- Configuration contributes to `package.json` with JSON schema validation

## Success Metrics

- Terminal opens into tmux/zellij in one action (no manual commands)
- Startup latency < 500ms overhead vs native terminal
- Multiple VS Code windows work without session conflicts
- Clear error messaging when multiplexer is not installed
- Positive feedback from terminal power users

### US-011: Kill session via command palette
**Description:** As a user, I want to kill my current session from the command palette so I can clean up without leaving VS Code.

**Acceptance Criteria:**
- [ ] Command "CodeMux: Kill Current Session" available in command palette
- [ ] Kills the multiplexer session attached to the active terminal
- [ ] Shows confirmation notification with session name
- [ ] Terminal closes after session is killed
- [ ] Typecheck passes

### US-012: Show session name in terminal tab title
**Description:** As a user, I want to see the session name in the terminal tab so I know which session I'm attached to.

**Acceptance Criteria:**
- [ ] Terminal tab displays "CodeMux: <session-name>"
- [ ] Numbered sessions show suffix (e.g., "CodeMux: myproject-2")
- [ ] Title updates if reattaching to different session
- [ ] Typecheck passes

## Design Decisions

- **Workspace rename:** Renaming a workspace does NOT rename the existing session. The old session persists until manually deleted. New terminals will create/attach to a session with the new name.
