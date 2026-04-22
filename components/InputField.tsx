import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0A1434',
  surface: '#0F1E48',
  primary: '#1B3A8C',
  accent: '#C9A84C',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  error: '#F87171',
  border: 'rgba(255,255,255,0.10)',
  borderFocus: '#C9A84C',
};

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
  hint?: string;
}

export default function InputField({
  label,
  icon,
  error,
  isPassword = false,
  hint,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={focused ? COLORS.accent : COLORS.muted}
          style={styles.iconLeft}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="rgba(203,213,225,0.4)"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(v => !v)}
            style={styles.iconRight}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.muted}
            />
          </Pressable>
        )}
      </View>

      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputRowFocused: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  inputRowError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  iconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  iconRight: {
    marginLeft: 8,
    padding: 2,
  },
  hint: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
    opacity: 0.7,
    lineHeight: 15,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 5,
  },
});
