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
import { apiClient } from '@/lib/api';

function formatRegisterError(err: any): string {
  const raw = (err?.message || '').toString().toLowerCase();

  if (raw.includes('network request failed') || raw.includes('failed to fetch')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.';
  }
  if (raw.includes('déjà') || raw.includes('already') || raw.includes('exist')) {
    return 'Un compte existe déjà avec cet email. Essayez de vous connecter.';
  }
  if (raw.includes('email') && raw.includes('valid')) {
    return 'Adresse email invalide. Vérifiez le format saisi.';
  }
  if (raw.includes('password') || raw.includes('mot de passe')) {
    return 'Mot de passe non conforme. Utilisez au moins 8 caractères.';
  }
  if (raw.includes('timeout')) {
    return 'Le serveur met trop de temps à répondre. Réessayez dans un instant.';
  }
  if (raw.includes('500') || raw.includes('server')) {
    return 'Le service est momentanément indisponible. Réessayez plus tard.';
  }
  return 'Impossible de créer le compte. Veuillez réessayer.';
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

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Nom requis';
    if (!email.includes('@')) newErrors.email = 'Email invalide';
    if (password.length < 8) newErrors.password = 'Minimum 8 caractères';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setGlobalError(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        // pas d'organization_id → auto-assigné à MIZNAS (compte démo)
      });
      setSuccess(true);
    } catch (err: any) {
      setGlobalError(formatRegisterError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Compte créé !</Text>
            <Text style={styles.successSubtitle}>
              Votre compte démo est actif !{'\n'}
              Accédez à 2 formations et posez jusqu'à{'\n'}
              2 questions à Miznas AI.
            </Text>
            <Pressable
              style={styles.btnSubmit}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.btnSubmitText}>Se connecter</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
                <Text style={styles.backText}>← Retour</Text>
              </Pressable>

              <View style={styles.logoWrap}>
                <View style={styles.logoGlow} />
                <Logo size={64} />
              </View>

              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>
                Rejoignez la plateforme d'analyse PCB-UEMOA
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.borderOuter} />
              <View style={styles.borderInner} />

              <View style={styles.cardContent}>
                {globalError && (
                  <View style={styles.errorBanner}>
                    <View style={styles.errorIconWrap}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                    </View>
                    <View style={styles.errorTextWrap}>
                      <Text style={styles.errorBannerTitle}>Inscription impossible</Text>
                      <Text style={styles.errorBannerText}>{globalError}</Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => setGlobalError(null)}
                      style={styles.errorClose}
                    >
                      <Ionicons name="close" size={16} color={COLORS.error} />
                    </Pressable>
                  </View>
                )}

                {/* Section : Identité */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                </View>

                <InputField
                  label="Nom complet"
                  icon="person-outline"
                  placeholder="Aboubacar Mahaman Lawan"
                  value={fullName}
                  onChangeText={setFullName}
                  error={errors.fullName}
                  textContentType="name"
                  autoComplete="name"
                />

                <InputField
                  label="Email"
                  icon="mail-outline"
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                />

                {/* Bandeau démo */}
                <View style={styles.demoBanner}>
                  <Text style={styles.demoBannerText}>DEMO</Text>
                </View>

                {/* Section : Sécurité */}
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Sécurité</Text>
                </View>

                <InputField
                  label="Mot de passe"
                  icon="lock-closed-outline"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  isPassword
                  textContentType="newPassword"
                />

                <InputField
                  label="Confirmer le mot de passe"
                  icon="shield-checkmark-outline"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={errors.confirmPassword}
                  isPassword
                  textContentType="newPassword"
                />

                {/* Indicateur de force du mot de passe */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            password.length >= i * 2 && styles.strengthBarActive,
                            password.length >= 8 && i <= 4 && styles.strengthBarStrong,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.strengthLabel}>
                      {password.length < 4
                        ? 'Trop court'
                        : password.length < 8
                        ? 'Moyen'
                        : 'Fort'}
                    </Text>
                  </View>
                )}

                {/* Bouton */}
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSubmit,
                    pressed && styles.btnSubmitPressed,
                    isLoading && styles.btnDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.bg} size="small" />
                  ) : (
                    <>
                      <Text style={styles.btnSubmitText}>Créer mon compte</Text>
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

                <Pressable
                  style={styles.linkRow}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={styles.linkText}>Déjà un compte ? </Text>
                  <Text style={styles.linkAccent}>Se connecter</Text>
                </Pressable>
              </View>
            </View>

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
    top: -width * 0.35,
    right: -width * 0.2,
    backgroundColor: COLORS.primary,
    opacity: 0.13,
  },
  orbBottom: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.15,
    left: -width * 0.1,
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
    paddingBottom: 24,
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
    marginBottom: 18,
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    opacity: 0.28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 19,
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
    borderColor: 'rgba(201,168,76,0.2)',
    zIndex: 1,
  },
  cardContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    zIndex: 2,
  },

  /* Demo banner */
  demoBanner: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  demoBannerText: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
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

  /* Password strength */
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  strengthBarActive: {
    backgroundColor: COLORS.accent,
    opacity: 0.5,
  },
  strengthBarStrong: {
    backgroundColor: COLORS.success,
    opacity: 1,
  },
  strengthLabel: {
    color: COLORS.muted,
    fontSize: 11,
    opacity: 0.8,
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
    marginTop: 4,
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

  /* Success screen */
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 2,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    color: COLORS.success,
    fontSize: 36,
    fontWeight: '700',
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  successSubtitle: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
