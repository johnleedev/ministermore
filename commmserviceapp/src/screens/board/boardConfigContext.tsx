import { createContext, useContext, type ReactNode } from 'react';
import type { CommunityBoardConfig } from './boardTypes';
import { FREE_BOARD_CONFIG } from './boardConfigs';

const BoardConfigContext = createContext<CommunityBoardConfig>(FREE_BOARD_CONFIG);

export function BoardConfigProvider({
  config,
  children,
}: {
  config: CommunityBoardConfig;
  children: ReactNode;
}) {
  return <BoardConfigContext.Provider value={config}>{children}</BoardConfigContext.Provider>;
}

export function useBoardConfig() {
  return useContext(BoardConfigContext);
}
