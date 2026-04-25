import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) setBaseURLState(v);
    });
  }, []);

  const setBaseURL = async (raw: string) => {
    const url = raw.startsWith('http') ? raw : `http://${raw}`;
    setBaseURLState(url);
    await AsyncStorage.setItem(STORAGE_KEY, url);
  };

  return (
    <ServerContext.Provider value={{ baseURL, setBaseURL }}>
      {children}
    </ServerContext.Provider>
  );
}

export const useServer = () => useContext(ServerContext);
