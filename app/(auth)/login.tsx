import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/Logo';
import InputField from '@/components/InputField';
import { login } from '@/lib/auth';

function formatLoginError(err: any): string {
  const raw = (err?.message || '').toString().toLowerCase();

  if (raw.includes('network request failed') || raw.includes('failed to fetch')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.';
  }
  if (
    raw.includes('email ou mot de passe') ||
    raw.includes('incorrect') ||
    raw.includes('unauthorized') ||
    raw.includes('401')
  ) {
    return 'Identifiants incorrects. Vérifiez votre email et votre mot de passe.';
  }
  if (raw.includes('compte') && raw.includes('désactiv')) {
    return 'Votre compte est désactivé. Contactez votre administrateur.';
  }
  if (raw.includes('timeout')) {
    return 'Le serveur met trop de temps à répondre. Réessayez dans un instant.';
  }
  if (raw.includes('500') || raw.includes('server')) {
    return 'Le service est momentanément indisponible. Réessayez plus tard.';
  }
  return 'Une erreur est survenue. Veuillez réessayer.';
}

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0A1434',
  surface: '#0F1E48',
  primary: '#1B3A8C',
  accent: '#C9A84C',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  error: '#F87171',
  success: '#34D399',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await login(email.trim().toLowerCase(), password);
      // Redirection selon le rôle
      if (user.role === 'user') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(formatLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Orbes de fond */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.replace('/')} style={styles.backBtn} hitSlop={10}>
                <Text style={styles.backText}>← Retour</Text>
              </Pressable>

              <View style={styles.logoWrap}>
                <View style={styles.logoGlow} />
                <Logo size={72} />
              </View>

              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>
                L'IA au service de la décision bancaire
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Double border */}
              <View style={styles.borderOuter} />
              <View style={styles.borderInner} />

              <View style={styles.cardContent}>
                {/* Erreur globale */}
                {error && (
                  <View style={styles.errorBanner}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                    </View>
                    <View style={styles.errorTextWrap}>
                      <Text style={styles.errorBannerTitle}>Connexion échouée</Text>
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => setError(null)}
                      style={styles.errorClose}
                    >
                      <Ionicons name="close" size={16} color={COLORS.error} />
                    </Pressable>
                  </View>
                )}

                <InputField
                  label="Email"
                  icon="mail-outline"
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                />

                <InputField
                  label="Mot de passe"
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  textContentType="password"
                />

                {/* Mot de passe oublié */}
                <Pressable hitSlop={8} style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </Pressable>

                {/* Bouton connexion */}
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSubmit,
                    pressed && styles.btnSubmitPressed,
                    isLoading && styles.btnDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.bg} size="small" />
                  ) : (
                    <>
                      <Text style={styles.btnSubmitText}>Se connecter</Text>
                      <Text style={styles.btnArrow}>→</Text>
                    </>
                  )}
                </Pressable>

                {/* Séparateur */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Lien vers register */}
                <Pressable
                  style={styles.linkRow}
                  onPress={() => router.replace('/(auth)/register')}
                >
                  <Text style={styles.linkText}>Nouveau ? </Text>
                  <Text style={styles.linkAccent}>Créer un compte</Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>Miznas Pilot © {new Date().getFullYear()}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTop: {
    width: width * 0.9,
    height: width * 0.9,
    top: -width * 0.4,
    left: -width * 0.2,
    backgroundColor: COLORS.primary,
    opacity: 0.14,
  },
  orbBottom: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.2,
    right: -width * 0.15,
    backgroundColor: COLORS.accent,
    opacity: 0.06,
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* Header */
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Card */
  card: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  borderOuter: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(27,58,140,0.5)',
    zIndex: 1,
  },
  borderInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    zIndex: 1,
  },
  cardContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    zIndex: 2,
  },

  /* Error banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
  },
  errorIconWrap: {
    marginTop: 1,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorBannerTitle: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  errorBannerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  errorClose: {
    padding: 2,
    marginTop: 1,
  },

  /* Mot de passe oublié */
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Button */
  btnSubmit: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  btnSubmitPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnSubmitText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnArrow: {
    color: COLORS.bg,
    fontSize: 18,
    fontWeight: '700',
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 12,
    opacity: 0.6,
  },

  /* Link */
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  linkAccent: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  footer: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.4,
  },
});
