"use client";

import { createContext, useContext } from "react";
import { StoreApi, UseBoundStore } from "zustand";
import { RuntimeStore } from "@/app/_lib/store";

// The context stores a reference to a specific Zustand store hook.
export const StoreContext = createContext<UseBoundStore<StoreApi<RuntimeStore>> | null>(null);

export function StoreProvider({
  store,
  children,
}: {
  store: UseBoundStore<StoreApi<RuntimeStore>>;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// Hook to read from the store provided by context
export function useStoreContext(): RuntimeStore;
export function useStoreContext<T>(selector: (state: RuntimeStore) => T): T;
export function useStoreContext<T>(selector?: (state: RuntimeStore) => T): T | RuntimeStore {
  const storeHook = useContext(StoreContext);
  if (!storeHook) {
    throw new Error("Missing StoreProvider in the component tree");
  }
  // @ts-ignore
  return selector ? storeHook(selector) : storeHook();
}

// Hook to get the store instance itself (useful for passing to engine functions)
export function useStoreInstance(): UseBoundStore<StoreApi<RuntimeStore>> {
  const storeHook = useContext(StoreContext);
  if (!storeHook) {
    throw new Error("Missing StoreProvider in the component tree");
  }
  return storeHook;
}
