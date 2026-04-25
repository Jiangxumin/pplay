import React from 'react';
import { View, Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'Player'>;

export default function PlayerScreen(_props: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>PlayerScreen (placeholder)</Text>
    </View>
  );
}
