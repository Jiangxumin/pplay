import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsModal from '../SettingsModal';
import { ServerProvider } from '../../context/ServerContext';

const wrap = (ui: React.ReactElement) =>
  render(<ServerProvider>{ui}</ServerProvider>);

it('renders input and save button', () => {
  const { getByPlaceholderText, getByText } = wrap(
    <SettingsModal visible onClose={() => {}} />
  );
  expect(getByPlaceholderText('192.168.1.100:8080')).toBeTruthy();
  expect(getByText('保存')).toBeTruthy();
});

it('saves IP and calls onClose when save pressed', async () => {
  const onClose = jest.fn();
  const { getByPlaceholderText, getByText } = wrap(
    <SettingsModal visible onClose={onClose} />
  );
  fireEvent.changeText(getByPlaceholderText('192.168.1.100:8080'), '192.168.1.50:8080');
  await act(async () => { fireEvent.press(getByText('保存')); });
  // ServerContext.setBaseURL prepends 'http://' when missing,
  // so '192.168.1.50:8080' becomes 'http://192.168.1.50:8080' in storage.
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@server_ip', 'http://192.168.1.50:8080');
  expect(onClose).toHaveBeenCalled();
});
