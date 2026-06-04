import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const coresTema = {
  light: {
    background: "#f4f4f5",
    text: "#333333",
    card: "#ffffff",
    border: "#e0e0e0",
    primary: "#0056b3",
  },
  dark: {
    background: "#121212",
    text: "#f4f4f5",
    card: "#1e1e1e",
    border: "#333333",
    primary: "#3399ff",
  },
};

type ThemeContextType = {
  isDarkMode: boolean;
  tema: typeof coresTema.light;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const carregarTema = async () => {
      const temaSalvo = await AsyncStorage.getItem("tema_busquei");
      if (temaSalvo === "dark") {
        setIsDarkMode(true);
      }
    };
    carregarTema();
  }, []);

  const toggleTheme = async () => {
    const novoModo = !isDarkMode;
    setIsDarkMode(novoModo);
    await AsyncStorage.setItem("tema_busquei", novoModo ? "dark" : "light");
  };

  const tema = isDarkMode ? coresTema.dark : coresTema.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, tema, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
