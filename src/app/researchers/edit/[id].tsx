import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ResearcherForm from '../../../components/researchers/ResearcherForm';
import { LabSyncColors as C } from '../../../constants/labsync-theme';
import { getResearcher } from '../../../services/api';
import type { Researcher } from '../../../services/types';

export default function EditResearcherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getResearcher(Number(id))
      .then((item) => { if (mounted) setResearcher(item); })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Unable to load researcher.'); });
    return () => { mounted = false; };
  }, [id]);

  if (error) return <View style={styles.state}><Text style={styles.error}>{error}</Text></View>;
  if (!researcher) return <View style={styles.state}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Researcher', headerShown: false }} />
      <ResearcherForm mode="edit" researcher={researcher} />
    </>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background, padding: 24 },
  error: { color: C.danger, textAlign: 'center' },
});
