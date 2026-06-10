import { createContext, useContext, type ReactNode } from 'react';
import type { BoardCategoryKey } from './boardUi';

type BoardCategoryContextValue = {
  category: BoardCategoryKey;
  setCategory: (key: BoardCategoryKey) => void;
};

const BoardCategoryContext = createContext<BoardCategoryContextValue | null>(null);

export function BoardCategoryProvider({
  category,
  setCategory,
  children,
}: BoardCategoryContextValue & { children: ReactNode }) {
  return (
    <BoardCategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </BoardCategoryContext.Provider>
  );
}

export function useBoardCategory() {
  const ctx = useContext(BoardCategoryContext);
  if (!ctx) {
    throw new Error('useBoardCategory must be used within BoardCategoryProvider');
  }
  return ctx;
}
