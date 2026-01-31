export interface IMuxLauncher {
  /** Build the shell command to launch/attach the multiplexer session */
  buildCommand: (sessionName: string, cwd: string, autoAttach: boolean) => string
  /** List all existing session names */
  listSessions: () => Promise<string[]>
  /** Kill a session by name */
  killSession: (sessionName: string) => Promise<void>
  /** Check if the multiplexer binary is installed */
  checkInstalled: () => Promise<boolean>
}
