import type { ConfigKeyTypeMap } from '../generated/meta'

import type { IMuxLauncher } from './types'
import { TmuxLauncher } from './tmux'
import { ZellijLauncher } from './zellij'

export type MultiplexerType = ConfigKeyTypeMap['codemux.multiplexer']

export function getLauncher(multiplexer: MultiplexerType): IMuxLauncher {
  switch (multiplexer) {
    case 'tmux':
      return new TmuxLauncher()
    case 'zellij':
      return new ZellijLauncher()
  }
}

export type { IMuxLauncher } from './types'
