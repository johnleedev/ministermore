import { createContext, useContext, type ReactNode } from 'react';

export function createScreenCategoryContext<T extends string>() {
  type Value = {
    category: T;
    setCategory: (key: T) => void;
  };

  const Context = createContext<Value | null>(null);

  function Provider({ category, setCategory, children }: Value & { children: ReactNode }) {
    return <Context.Provider value={{ category, setCategory }}>{children}</Context.Provider>;
  }

  function useScreenCategory() {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error('useScreenCategory must be used within its Provider');
    }
    return ctx;
  }

  return { Provider, useScreenCategory };
}
