import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerProvider, useServer } from '../ServerContext';

function TestConsumer({ onPress }: { onPress: (ctx: ReturnType<typeof useServer>) => void }) {
  const ctx = useServer();
  return (
    <>
      <Text testID="url">{ctx.baseURL}</Text>
      <TouchableOpacity testID="btn" onPress={() => onPress(ctx)} />
    </>
  );
}

const wrap = (ui: React.ReactElement) =>
  render(<ServerProvider>{ui}</ServerProvider>);

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

it('starts with empty baseURL', async () => {
  const { findByTestId } = wrap(<TestConsumer onPress={() => {}} />);
  expect(await findByTestId('url')).toHaveTextContent('');
});

it('restores baseURL from AsyncStorage on mount', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.5:8080');
  const { findByTestId } = wrap(<TestConsumer onPress={() => {}} />);
  expect(await findByTestId('url')).toHaveTextContent('http://192.168.1.5:8080');
});

it('setBaseURL prepends http:// if missing and persists', async () => {
  const { findByTestId, getByTestId } = wrap(
    <TestConsumer onPress={ctx => ctx.setBaseURL('192.168.1.10:8080')} />
  );
  await act(async () => { fireEvent.press(getByTestId('btn')); });
  expect(await findByTestId('url')).toHaveTextContent('http://192.168.1.10:8080');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@server_ip', 'http://192.168.1.10:8080');
});

it('does not double-prepend http:// if already present', async () => {
  const { findByTestId, getByTestId } = wrap(
    <TestConsumer onPress={ctx => ctx.setBaseURL('http://192.168.1.10:8080')} />
  );
  await act(async () => { fireEvent.press(getByTestId('btn')); });
  expect(await findByTestId('url')).toHaveTextContent('http://192.168.1.10:8080');
});

it('does not prepend http:// if https:// is already present', async () => {
  const { findByTestId, getByTestId } = wrap(
    <TestConsumer onPress={ctx => ctx.setBaseURL('https://192.168.1.10:8080')} />
  );
  await act(async () => { fireEvent.press(getByTestId('btn')); });
  expect(await findByTestId('url')).toHaveTextContent('https://192.168.1.10:8080');
});

it('ignores empty string input', async () => {
  const { findByTestId, getByTestId } = wrap(
    <TestConsumer onPress={ctx => ctx.setBaseURL('')} />
  );
  await act(async () => { fireEvent.press(getByTestId('btn')); });
  expect(await findByTestId('url')).toHaveTextContent('');
});
