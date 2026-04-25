import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useServer } from '../context/ServerContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: Props) {
  const { baseURL, setBaseURL } = useServer();
  const [input, setInput] = useState(baseURL.replace(/^https?:\/\//, ''));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setInput(baseURL.replace(/^https?:\/\//, ''));
      setError('');
    }
  }, [visible, baseURL]);

  const handleSave = async () => {
    if (saving || !input.trim()) {
      if (!input.trim()) setError('请输入服务器地址');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await setBaseURL(input.trim());
      onClose();
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.label}>服务器地址</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="192.168.1.100:8080"
            placeholderTextColor="#636366"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            disabled={saving}
            style={[styles.button, saving && { opacity: 0.5 }]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>保存</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  box: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 20, width: 300, gap: 12 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  input: { backgroundColor: '#2c2c2e', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14 },
  error: { color: '#ff453a', fontSize: 12 },
  button: { backgroundColor: '#0a84ff', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
