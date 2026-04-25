import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerProvider } from './app/context/ServerContext';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ServerProvider>
          <RootNavigator />
        </ServerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
