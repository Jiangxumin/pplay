import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@server_ip';

interface ServerContextValue {
  baseURL: string;
  setBaseURL: (raw: string) => Promise<void>;
}

const ServerContext = createContext<ServerContextValue>({
  baseURL: '',
  setBaseURL: async () => {},
});

export function ServerProvider({ children }: { children: ReactNode }) {
  const [baseURL, setBaseURLState] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setBaseURLState(v); })
      .catch(err => console.warn('[ServerContext] Failed to restore URL:', err));
  }, []);

  const setBaseURL = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const previous = baseURL;
    setBaseURLState(url);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, url);
    } catch (err) {
      console.warn('[ServerContext] Failed to persist URL:', err);
      setBaseURLState(previous);
    }
  }, [baseURL]);

  const contextValue = useMemo(() => ({ baseURL, setBaseURL }), [baseURL, setBaseURL]);

  return (
    <ServerContext.Provider value={contextValue}>
      {children}
    </ServerContext.Provider>
  );
}

export const useServer = () => useContext(ServerContext);
