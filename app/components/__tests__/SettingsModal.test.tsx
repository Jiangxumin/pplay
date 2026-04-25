import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsModal from '../SettingsModal';
import { ServerProvider } from '../../context/ServerContext';

const wrap = (ui: React.ReactElement) =>
  render(<ServerProvider>{ui}</ServerProvider>);

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

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

it('shows error and does not close when save pressed with empty input', async () => {
  const onClose = jest.fn();
  const { getByPlaceholderText, getByText } = wrap(
    <SettingsModal visible onClose={onClose} />
  );
  // Clear the input
  fireEvent.changeText(getByPlaceholderText('192.168.1.100:8080'), '');
  await act(async () => { fireEvent.press(getByText('保存')); });
  expect(getByText('请输入服务器地址')).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();
});

it('syncs input when baseURL loads asynchronously', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://10.0.0.5:9000');
  const { getByPlaceholderText } = wrap(<SettingsModal visible onClose={() => {}} />);
  await act(async () => {});
  expect(getByPlaceholderText('192.168.1.100:8080').props.value).toBe('10.0.0.5:9000');
});
