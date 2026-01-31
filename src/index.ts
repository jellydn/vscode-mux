import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'

import { commands as metaCommands } from './generated/meta'
import { createTerminalProfileProvider, handleKillSession } from './terminal-profile'

const { activate, deactivate } = defineExtension(() => {
  window.registerTerminalProfileProvider('codemux', createTerminalProfileProvider())
  commands.registerCommand(metaCommands.codemuxKillSession, handleKillSession)
})

export { activate, deactivate }
