import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from './constants/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const SESSION_TOKEN_KEY = '@session_token';

export default function DebugAuthScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [result, setResult] = useState('');

  const testSessionId = async () => {
    try {
      setResult('Processing...');
      console.log('[DEBUG] Testing session_id:', sessionId);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        { session_id: sessionId }
      );
      
      console.log('[DEBUG] Response:', response.data);
      
      if (response.data.session_token) {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, response.data.session_token);
        console.log('[DEBUG] Token stored');
        
        const storedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
        console.log('[DEBUG] Token retrieved:', !!storedToken);
        
        setResult(`Success! Token stored. Email: ${response.data.email}`);
      } else {
        setResult('No session token in response');
      }
    } catch (error: any) {
      console.error('[DEBUG] Error:', error);
      setResult(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const checkCurrentToken = async () => {
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      console.log('[DEBUG] Current token:', token);
      setResult(`Token: ${token ? 'Found (' + token.substring(0, 20) + '...)' : 'Not found'}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    setResult('Token cleared');
    console.log('[DEBUG] Token cleared');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Debug Auth</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Current User:</Text>
          <Text style={styles.value}>{user ? user.email : 'Not logged in'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Test Session ID:</Text>
          <TextInput
            style={styles.input}
            value={sessionId}
            onChangeText={setSessionId}
            placeholder="Paste session_id here"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.button} onPress={testSessionId}>
            <Text style={styles.buttonText}>Test Session ID</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.button} onPress={checkCurrentToken}>
            <Text style={styles.buttonText}>Check Current Token</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearToken}>
            <Text style={styles.buttonText}>Clear Token</Text>
          </TouchableOpacity>
        </View>

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.instructions}>
            Instructions:{'\n'}
            1. Login via browser and capture session_id from URL{'\n'}
            2. Paste it above and click "Test Session ID"{'\n'}
            3. Check logs for detailed output{'\n'}
            4. Use "Check Current Token" to verify storage
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textWhite,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  value: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  input: {
    backgroundColor: COLORS.backgroundDark,
    color: COLORS.text,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  resultText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.sm,
  },
  instructions: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});
