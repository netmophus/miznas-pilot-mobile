import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/lib/api';
import { FormattedText } from '@/components/FormattedText';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0A1434',
  surface: '#0F1E48',
  deep: '#070E28',
  primary: '#1B3A8C',
  accent: '#C9A84C',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  error: '#F87171',
};

/* ─── Types ───────────────────────────────────────────────── */
interface Partie {
  id: string;
  titre: string;
  contenu: string;
  contenu_genere?: string;
}

interface Chapitre {
  id: string;
  titre: string;
  introduction?: string;
  contenu_genere?: string;
  parties?: Partie[];
}

interface Module {
  id: string;
  titre: string;
  ordre: number;
  nombre_chapitres?: number;
  chapitres?: Chapitre[];
  questions_qcm?: any[];
}

interface Formation {
  id: string;
  titre: string;
  description?: string;
  status?: string;
  modules_count?: number;
  modules?: Module[];
  bloc_numero?: number | null;
  bloc_titre?: string | null;
  bloc_label?: string | null;
  // true = formation teaser non accessible (affichee en gris, clic ouvre modal upgrade)
  is_locked?: boolean;
}

interface BlocGroup {
  key: string;
  label: string;
  numero: number | null;
  formations: Formation[];
}

/* ─── Component ───────────────────────────────────────────── */
export default function FormationsScreen() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedBlocKey, setExpandedBlocKey] = useState<string | null>(null);
  const [expandedFormationId, setExpandedFormationId] = useState<string | null>(null);
  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>(null);
  const [expandedChapterKey, setExpandedChapterKey] = useState<string | null>(null);
  const [expandedQcmKey, setExpandedQcmKey] = useState<string | null>(null);
  const [qcmAnswers, setQcmAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    apiClient
      .get<Formation[]>('/formations/user/my-formations?include_locked=true')
      .then(setFormations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLockedClick = (f: Formation) => {
    Alert.alert(
      'Formation non accessible',
      `"${f.titre}" fait partie de l'offre complète Miznas Pilot.\n\nContactez-nous pour activer votre licence et débloquer cette formation.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: 'Nous contacter',
          onPress: () =>
            Linking.openURL(
              'mailto:support@miznasbanking.com?subject=Demande%20de%20licence%20Miznas%20Pilot&body=Bonjour,%0A%0AJe%20souhaite%20d%C3%A9bloquer%20la%20formation%20%3A%20' +
                encodeURIComponent(f.titre) +
                '%0A%0A',
            ),
        },
      ],
    );
  };

  const groupedBlocs = useMemo<BlocGroup[]>(() => {
    const map = new Map<string, BlocGroup>();
    for (const f of formations) {
      const key = f.bloc_numero != null ? `bloc-${f.bloc_numero}` : 'no-bloc';
      const label =
        f.bloc_label ||
        (f.bloc_numero != null ? `BLOC ${f.bloc_numero}` : 'Autres formations');
      if (!map.has(key)) {
        map.set(key, { key, label, numero: f.bloc_numero ?? null, formations: [] });
      }
      map.get(key)!.formations.push(f);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.numero === null) return 1;
      if (b.numero === null) return -1;
      return a.numero - b.numero;
    });
  }, [formations]);

  const toggleBloc = (key: string) => {
    setExpandedBlocKey((prev) => (prev === key ? null : key));
    setExpandedFormationId(null);
    setExpandedModuleKey(null);
    setExpandedChapterKey(null);
  };

  const toggleFormation = (fid: string) => {
    setExpandedFormationId((prev) => (prev === fid ? null : fid));
    setExpandedModuleKey(null);
    setExpandedChapterKey(null);
  };

  const toggleModule = (key: string) => {
    setExpandedModuleKey((prev) => (prev === key ? null : key));
    setExpandedChapterKey(null);
  };

  const toggleChapter = (key: string) => {
    setExpandedChapterKey((prev) => (prev === key ? null : key));
  };

  const toggleQcm = (key: string) => {
    setExpandedQcmKey((prev) => (prev === key ? null : key));
  };

  /* Extrait les options QCM sous forme de tableau, que la source soit
     un tableau ou un objet {A,B,C,D}. */
  const getOptionsArray = (q: any): string[] => {
    if (Array.isArray(q?.options)) return q.options;
    if (q?.options && typeof q.options === 'object') {
      return ['A', 'B', 'C', 'D']
        .map((k) => q.options[k])
        .filter((v): v is string => typeof v === 'string');
    }
    return [];
  };

  /* Résout l'index de la bonne réponse : soit correct_answer (nombre),
     soit reponse_correcte (lettre A/B/C/D → index 0-3). */
  const getCorrectIndex = (q: any): number | undefined => {
    if (typeof q?.correct_answer === 'number') return q.correct_answer;
    if (typeof q?.reponse_correcte === 'string') {
      const letter = q.reponse_correcte.toUpperCase();
      const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      return map[letter];
    }
    return undefined;
  };

  /* Retire les ** Markdown des énoncés courts (question/option/explication). */
  const stripMd = (s: string): string => (s || '').replace(/\*\*/g, '').trim();

  /* ── Loading / Error / Empty ───────────────────────────── */
  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centerWrap}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Chargement des formations…</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centerWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (formations.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centerWrap}>
          <Ionicons name="book-outline" size={48} color={COLORS.muted} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Aucune formation disponible</Text>
          <Text style={styles.emptyText}>
            Vos formations apparaîtront ici une fois assignées par votre organisation.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  /* ── Main render ──────────────────────────────────────── */
  return (
    <View style={styles.container}>
      <View style={[styles.orb, styles.orbTop]} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="school-outline" size={22} color={COLORS.accent} />
          </View>
          <View>
            <Text style={styles.title}>Mes formations</Text>
            <Text style={styles.subtitle}>
              {formations.length} formation{formations.length > 1 ? 's' : ''} ·{' '}
              {groupedBlocs.length} bloc{groupedBlocs.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groupedBlocs.map((bloc) => {
            const isBlocOpen = expandedBlocKey === bloc.key;
            return (
              <View key={bloc.key} style={styles.blocContainer}>
                {/* ── Bloc header ─────────────────────────────── */}
                <Pressable
                  style={({ pressed }) => [
                    styles.blocHeader,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => toggleBloc(bloc.key)}
                >
                  <View style={styles.blocIconWrap}>
                    <Ionicons name="library-outline" size={16} color={COLORS.accent} />
                  </View>
                  <View style={styles.blocTextWrap}>
                    <Text style={styles.blocLabel} numberOfLines={1}>
                      {bloc.label}
                    </Text>
                    <Text style={styles.blocCount}>
                      {bloc.formations.length} formation
                      {bloc.formations.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name={isBlocOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.accent}
                    style={{ opacity: 0.7 }}
                  />
                </Pressable>

                {/* ── Formations in bloc ──────────────────────── */}
                {isBlocOpen && (
                  <View style={styles.formationsList}>
                    {bloc.formations.map((f) => {
                      const isFormOpen = expandedFormationId === f.id;
                      const isLocked = !!f.is_locked;
                      return (
                        <View key={f.id} style={[styles.formationItem, isLocked && styles.formationItemLocked]}>
                          {/* Formation row */}
                          <Pressable
                            style={({ pressed }) => [
                              styles.formationRow,
                              pressed && { opacity: 0.85 },
                            ]}
                            onPress={() => (isLocked ? handleLockedClick(f) : toggleFormation(f.id))}
                          >
                            <View style={styles.formationRowContent}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {isLocked && (
                                  <Ionicons
                                    name="lock-closed"
                                    size={13}
                                    color="rgba(201,168,76,0.55)"
                                    style={{ marginRight: 2 }}
                                  />
                                )}
                                <Text
                                  style={[styles.formationTitle, isLocked && styles.formationTitleLocked]}
                                  numberOfLines={2}
                                >
                                  {f.titre}
                                </Text>
                              </View>
                              {f.description ? (
                                <Text
                                  style={[styles.formationDesc, isLocked && styles.formationDescLocked]}
                                  numberOfLines={2}
                                >
                                  {f.description}
                                </Text>
                              ) : null}
                              <View style={styles.formationMeta}>
                                <View style={[styles.metaBadge, isLocked && styles.metaBadgeLocked]}>
                                  <Text style={[styles.metaBadgeText, isLocked && styles.metaBadgeTextLocked]}>
                                    {isLocked
                                      ? 'Non accessible — version complète'
                                      : `${f.modules_count ?? f.modules?.length ?? 0} module${(f.modules_count ?? f.modules?.length ?? 0) > 1 ? 's' : ''}`}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Ionicons
                              name={isLocked ? 'lock-closed' : isFormOpen ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={isLocked ? COLORS.accent : COLORS.muted}
                              style={{ opacity: isLocked ? 0.6 : 0.5, marginTop: 2 }}
                            />
                          </Pressable>

                          {/* ── Modules (seulement si accessible) ── */}
                          {!isLocked && isFormOpen && (
                            <View style={styles.modulesContainer}>
                              {(f.modules || []).length === 0 ? (
                                <Text style={styles.emptyModules}>
                                  Aucun module dans cette formation.
                                </Text>
                              ) : (
                                (f.modules || []).map((m, mIdx) => {
                                  const mKey = `${f.id}::m::${m.id || mIdx}`;
                                  const isModuleOpen = expandedModuleKey === mKey;
                                  return (
                                    <View key={mKey} style={styles.moduleItem}>
                                      <Pressable
                                        style={({ pressed }) => [
                                          styles.moduleRow,
                                          pressed && { opacity: 0.85 },
                                        ]}
                                        onPress={() => toggleModule(mKey)}
                                      >
                                        <View style={styles.moduleNum}>
                                          <Text style={styles.moduleNumText}>
                                            {mIdx + 1}
                                          </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.moduleTitle} numberOfLines={2}>
                                            {m.titre}
                                          </Text>
                                          <Text style={styles.moduleSubtitle}>
                                            {m.nombre_chapitres ?? m.chapitres?.length ?? 0} chapitre
                                            {(m.nombre_chapitres ?? m.chapitres?.length ?? 0) > 1 ? 's' : ''}
                                          </Text>
                                        </View>
                                        <Ionicons
                                          name={isModuleOpen ? 'chevron-up' : 'chevron-down'}
                                          size={15}
                                          color={COLORS.accent}
                                          style={{ opacity: 0.6 }}
                                        />
                                      </Pressable>

                                      {/* ── Chapitres ──────────────── */}
                                      {isModuleOpen && (
                                        <View style={styles.chaptersContainer}>
                                          {(m.chapitres || []).length === 0 ? (
                                            <Text style={styles.emptyModules}>
                                              Aucun chapitre.
                                            </Text>
                                          ) : (
                                            (m.chapitres || []).map((ch, chIdx) => {
                                              const chKey = `${mKey}::ch::${ch.id || chIdx}`;
                                              const isChOpen = expandedChapterKey === chKey;
                                              return (
                                                <View key={chKey} style={styles.chapterItem}>
                                                  <Pressable
                                                    style={({ pressed }) => [
                                                      styles.chapterRow,
                                                      pressed && { opacity: 0.85 },
                                                    ]}
                                                    onPress={() => toggleChapter(chKey)}
                                                  >
                                                    <Text style={styles.chapterIndex}>
                                                      {chIdx + 1}.
                                                    </Text>
                                                    <Text
                                                      style={styles.chapterTitle}
                                                      numberOfLines={isChOpen ? undefined : 1}
                                                    >
                                                      {ch.titre || `Chapitre ${chIdx + 1}`}
                                                    </Text>
                                                    <Ionicons
                                                      name={isChOpen ? 'chevron-up' : 'chevron-down'}
                                                      size={13}
                                                      color={COLORS.muted}
                                                      style={{ opacity: 0.5 }}
                                                    />
                                                  </Pressable>

                                                  {isChOpen && (
                                                    <View style={styles.chapterContent}>
                                                      {ch.introduction ? (
                                                        <Text style={styles.chapterIntro}>
                                                          {ch.introduction}
                                                        </Text>
                                                      ) : null}
                                                      {ch.contenu_genere ? (
                                                        <View style={styles.contentBox}>
                                                          <Text style={styles.contentLabel}>
                                                            CONTENU
                                                          </Text>
                                                          <FormattedText
                                                            content={ch.contenu_genere}
                                                            cardStyle={false}
                                                          />
                                                        </View>
                                                      ) : (
                                                        <Text style={styles.contentPending}>
                                                          Contenu non encore généré.
                                                        </Text>
                                                      )}
                                                    </View>
                                                  )}
                                                </View>
                                              );
                                            })
                                          )}

                                          {/* QCM interactif */}
                                          {(m.questions_qcm || []).length > 0 && (() => {
                                            const qcmKey = `${mKey}::qcm`;
                                            const isQcmOpen = expandedQcmKey === qcmKey;
                                            return (
                                              <View style={{ marginTop: 10 }}>
                                                <Pressable
                                                  onPress={() => toggleQcm(qcmKey)}
                                                  style={({ pressed }) => [
                                                    styles.qcmToggle,
                                                    pressed && { opacity: 0.85 },
                                                    isQcmOpen && styles.qcmToggleOpen,
                                                  ]}
                                                >
                                                  <Ionicons
                                                    name="help-circle-outline"
                                                    size={15}
                                                    color={COLORS.accent}
                                                  />
                                                  <Text style={styles.qcmToggleText}>
                                                    {m.questions_qcm!.length} question
                                                    {m.questions_qcm!.length > 1 ? 's' : ''} QCM
                                                  </Text>
                                                  <Ionicons
                                                    name={isQcmOpen ? 'chevron-up' : 'chevron-down'}
                                                    size={14}
                                                    color={COLORS.accent}
                                                    style={{ opacity: 0.7 }}
                                                  />
                                                </Pressable>

                                                {isQcmOpen && (
                                                  <View style={styles.qcmList}>
                                                    {m.questions_qcm!.map((q: any, qIdx: number) => {
                                                      const questionKey = `${mKey}::q::${qIdx}`;
                                                      const selectedIndex = qcmAnswers[questionKey];
                                                      const hasAnswered = typeof selectedIndex === 'number';
                                                      const options = getOptionsArray(q);
                                                      const correctIndex = getCorrectIndex(q);
                                                      const isCorrect =
                                                        hasAnswered &&
                                                        typeof correctIndex === 'number' &&
                                                        selectedIndex === correctIndex;

                                                      return (
                                                        <View key={qIdx} style={styles.qcmCard}>
                                                          <View style={styles.qcmHeaderRow}>
                                                            <Text style={styles.qcmQuestion}>
                                                              <Text style={styles.qcmQuestionNum}>{qIdx + 1}. </Text>
                                                              {stripMd(q.question || '')}
                                                            </Text>
                                                            {hasAnswered && (
                                                              <View
                                                                style={[
                                                                  styles.qcmVerdict,
                                                                  isCorrect ? styles.qcmVerdictOk : styles.qcmVerdictKo,
                                                                ]}
                                                              >
                                                                <Text
                                                                  style={[
                                                                    styles.qcmVerdictText,
                                                                    { color: isCorrect ? '#86EFAC' : '#FCA5A5' },
                                                                  ]}
                                                                >
                                                                  {isCorrect ? 'VRAI' : 'FAUX'}
                                                                </Text>
                                                              </View>
                                                            )}
                                                          </View>

                                                          <View style={styles.qcmOptions}>
                                                            {options.map((opt, optIdx) => {
                                                              const isSelected = hasAnswered && selectedIndex === optIdx;
                                                              const isCorrectOpt =
                                                                hasAnswered &&
                                                                typeof correctIndex === 'number' &&
                                                                correctIndex === optIdx;
                                                              const letter = String.fromCharCode(65 + optIdx);

                                                              const optStyle = !hasAnswered
                                                                ? styles.qcmOpt
                                                                : isCorrectOpt
                                                                  ? styles.qcmOptOk
                                                                  : isSelected
                                                                    ? styles.qcmOptKo
                                                                    : styles.qcmOptMuted;
                                                              const textStyle = !hasAnswered
                                                                ? styles.qcmOptText
                                                                : isCorrectOpt
                                                                  ? styles.qcmOptTextOk
                                                                  : isSelected
                                                                    ? styles.qcmOptTextKo
                                                                    : styles.qcmOptTextMuted;

                                                              return (
                                                                <Pressable
                                                                  key={optIdx}
                                                                  disabled={hasAnswered}
                                                                  onPress={() =>
                                                                    setQcmAnswers((prev) => ({
                                                                      ...prev,
                                                                      [questionKey]: optIdx,
                                                                    }))
                                                                  }
                                                                  style={({ pressed }) => [
                                                                    optStyle,
                                                                    pressed && !hasAnswered && { opacity: 0.8 },
                                                                  ]}
                                                                >
                                                                  <Text style={textStyle}>
                                                                    <Text style={styles.qcmOptLetter}>{letter}. </Text>
                                                                    {stripMd(opt)}
                                                                  </Text>
                                                                </Pressable>
                                                              );
                                                            })}
                                                          </View>

                                                          {hasAnswered && q.explication && (
                                                            <View style={styles.qcmExplication}>
                                                              <Text style={styles.qcmExplicationLabel}>Explication</Text>
                                                              <Text style={styles.qcmExplicationText}>
                                                                {stripMd(q.explication)}
                                                              </Text>
                                                            </View>
                                                          )}
                                                        </View>
                                                      );
                                                    })}
                                                  </View>
                                                )}
                                              </View>
                                            );
                                          })()}
                                        </View>
                                      )}
                                    </View>
                                  );
                                })
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  orb: { position: 'absolute', borderRadius: 9999 },
  orbTop: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.25,
    left: -width * 0.2,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: { color: COLORS.muted, fontSize: 14, opacity: 0.7 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 12, opacity: 0.7, marginTop: 2 },
  separator: {
    height: 2,
    width: 48,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginHorizontal: 20,
    marginVertical: 16,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 32,
    gap: 10,
  },

  /* Bloc */
  blocContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.4)',
    backgroundColor: COLORS.deep,
  },
  blocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15,30,72,0.95)',
  },
  blocIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocTextWrap: { flex: 1 },
  blocLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  blocCount: { color: COLORS.muted, fontSize: 11, opacity: 0.6, marginTop: 1 },

  /* Formation list */
  formationsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(27,58,140,0.25)',
  },
  formationItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27,58,140,0.15)',
  },
  // Styles appliques aux formations locked (teaser non accessible)
  formationItemLocked: {
    backgroundColor: 'rgba(10,20,52,0.4)',
  },
  formationTitleLocked: {
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  formationDescLocked: {
    color: 'rgba(203,213,225,0.35)',
  },
  metaBadgeLocked: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.25)',
  },
  metaBadgeTextLocked: {
    color: COLORS.accent,
    opacity: 0.7,
  },
  formationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  formationRowContent: { flex: 1 },
  formationTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 5,
  },
  formationDesc: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.6,
    marginBottom: 8,
  },
  formationMeta: { flexDirection: 'row', gap: 8 },
  metaBadge: {
    backgroundColor: 'rgba(27,58,140,0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.4)',
  },
  metaBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },

  /* Modules */
  modulesContainer: {
    backgroundColor: 'rgba(15,30,72,0.6)',
    paddingHorizontal: 6,
    paddingBottom: 10,
    gap: 6,
  },
  emptyModules: {
    color: COLORS.muted,
    fontSize: 12,
    opacity: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  moduleItem: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.25)',
    backgroundColor: COLORS.surface,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  moduleNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(27,58,140,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleNumText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  moduleTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  moduleSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    opacity: 0.55,
    marginTop: 2,
  },

  /* Chapters */
  chaptersContainer: {
    backgroundColor: 'rgba(7,14,40,0.7)',
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 4,
  },
  chapterItem: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.15)',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chapterIndex: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 0,
  },
  chapterTitle: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  chapterContent: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(27,58,140,0.1)',
    gap: 8,
  },
  chapterIntro: {
    color: 'rgba(203,213,225,0.75)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  contentBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.2)',
  },
  contentLabel: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  contentText: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 12,
    lineHeight: 18,
  },
  contentPending: {
    color: COLORS.muted,
    fontSize: 12,
    opacity: 0.45,
    fontStyle: 'italic',
    marginTop: 8,
  },

  /* QCM toggle (header cliquable) */
  qcmToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  qcmToggleOpen: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderColor: 'rgba(201,168,76,0.45)',
  },
  qcmToggleText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* QCM liste des questions */
  qcmList: {
    marginTop: 10,
    gap: 10,
  },
  qcmCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  qcmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  qcmQuestion: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  qcmQuestionNum: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  qcmVerdict: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  qcmVerdictOk: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  qcmVerdictKo: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  qcmVerdictText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Options */
  qcmOptions: {
    marginTop: 10,
    gap: 6,
  },
  qcmOpt: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.25)',
  },
  qcmOptOk: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  qcmOptKo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  qcmOptMuted: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    opacity: 0.6,
  },
  qcmOptText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  qcmOptTextOk: {
    color: '#86EFAC',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  qcmOptTextKo: {
    color: '#FCA5A5',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  qcmOptTextMuted: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  qcmOptLetter: {
    color: COLORS.accent,
    fontWeight: '800',
  },

  /* Explication */
  qcmExplication: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.deep,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  qcmExplicationLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  qcmExplicationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12.5,
    lineHeight: 19,
  },
});
