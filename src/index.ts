import { defineExtension } from 'reactive-vscode';
import { commands, window } from 'vscode';

import { commands as metaCommands } from './generated/meta';
import { createTerminalProfileProvider, handleKillSession, handleNewSession } from './terminal-profile';

const { activate, deactivate } = defineExtension(() => {
  window.registerTerminalProfileProvider('codemux', createTerminalProfileProvider());
  commands.registerCommand(metaCommands.codemuxKillSession, handleKillSession);
  commands.registerCommand(metaCommands.codemuxNewSession, handleNewSession);
});

export { activate, deactivate };
