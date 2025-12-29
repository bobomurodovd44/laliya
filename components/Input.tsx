import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({ icon, isPassword, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.inputContainer, style as any]}>
      {icon && (
        <Ionicons name={icon} size={24} color="#CCC" style={styles.inputIcon} />
      )}
      <TextInput
        style={styles.input}
        placeholderTextColor="#CCC"
        secureTextEntry={isSecure}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={28} 
            color="#FF8C00" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 70, // Standardized height
    borderWidth: 2,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
});
