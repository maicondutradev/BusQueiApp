import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function PWAInstallPrompt() {
  const { tema } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    // Se for iOS e não estiver instalado, mostrar aviso
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Detectar Android/Desktop (evento beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <View style={[styles.container, { backgroundColor: tema.card, borderColor: tema.border }]}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={tema.text} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Ionicons name="download-outline" size={30} color={tema.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: tema.text }]}>Instalar BusQuei</Text>
          {isIOS ? (
            <Text style={[styles.subtitle, { color: tema.text }]}>
              Toque no botão <Ionicons name="share-outline" size={16} /> abaixo e selecione &quot;Adicionar à Tela de Início&quot;.
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: tema.text }]}>
              Instale nosso app para acesso rápido e modo offline!
            </Text>
          )}
        </View>
      </View>

      {!isIOS && (
        <TouchableOpacity style={[styles.installButton, { backgroundColor: tema.primary }]} onPress={handleInstall}>
          <Text style={styles.installText}>Instalar Agora</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 9999,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 20,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  installButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  installText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
