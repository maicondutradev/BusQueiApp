import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function InputPadrao(props: TextInputProps) {
  const { tema } = useTheme();

  return (
    <TextInput
      {...props}
      style={[
        styles.input,
        {
          backgroundColor: tema.card,
          borderColor: tema.border,
          color: tema.text,
        },
        props.style,
      ]}
      placeholderTextColor={tema.text + "80"}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
});
