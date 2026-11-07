import { useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, Save, UserRoundPlus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
    LabSyncColors as C,
    LabSyncShadows,
    LabSyncRadius as R, LabSyncSpacing as SP,
    LabSyncTypography as T,
} from '../../constants/labsync-theme';
import { createResearcher, getLaboratories, updateResearcher } from '../../services/api';
import type {
    CreateResearcherInput, Laboratory, Researcher
} from '../../services/types';

type Props = { mode: 'create' | 'edit'; researcher?: Researcher };

const EMPTY: CreateResearcherInput = {
  researcher_code: '',
  full_name: '',
  email: '',
  phone: '',
  researcher_type: 'RESEARCH_SCHOLAR',
  department: '',
  research_area: '',
  primary_laboratory_id: 0,
  supervisor_name: '',
  joining_date: '',
  status: 'ACTIVE',
};

const clean = (value: string) => value.trim();


type StableFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  required?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  onChangeText: (value: string) => void;
};

function Field({
  label, value, placeholder, keyboardType = 'default', required = false,
  error, autoCapitalize = 'words', onChangeText,
}: StableFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.subtle}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type StableChoiceProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

function Choice({ label, value, options, onChange }: StableChoiceProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.choice, value === option.value && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, value === option.value && styles.choiceTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ResearcherForm({ mode, researcher }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CreateResearcherInput>(EMPTY);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [labPickerOpen, setLabPickerOpen] = useState(false);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && researcher) {
      setForm({
        researcher_code: researcher.researcher_code ?? '',
        full_name: researcher.full_name ?? '',
        email: researcher.email ?? '',
        phone: researcher.phone ?? '',
        researcher_type: researcher.researcher_type,
        department: researcher.department ?? '',
        research_area: researcher.research_area ?? '',
        primary_laboratory_id: researcher.primary_laboratory_id,
        supervisor_name: researcher.supervisor_name ?? '',
        joining_date: researcher.joining_date?.slice(0, 10) ?? '',
        status: researcher.status,
      });
    }
  }, [mode, researcher]);

  useEffect(() => {
    let mounted = true;
    getLaboratories()
      .then((items) => { if (mounted) setLaboratories(Array.isArray(items) ? items : []); })
      .catch((err) => { if (mounted) setLoadError(err instanceof Error ? err.message : 'Unable to load laboratories.'); })
      .finally(() => { if (mounted) setLoadingLabs(false); });
    return () => { mounted = false; };
  }, []);

  const selectedLab = useMemo(
    () => laboratories.find((lab) => lab.id === form.primary_laboratory_id),
    [laboratories, form.primary_laboratory_id],
  );

  const setField = <K extends keyof CreateResearcherInput,>(key: K, value: CreateResearcherInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!clean(form.researcher_code)) next.researcher_code = 'Researcher code is required.';
    if (!clean(form.full_name)) next.full_name = 'Full name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.phone && !/^[+()\-\s\d]{7,20}$/.test(form.phone)) next.phone = 'Enter a valid phone number.';
    if (!form.primary_laboratory_id) next.primary_laboratory_id = 'Select a primary laboratory.';
    if (form.joining_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.joining_date)) next.joining_date = 'Use YYYY-MM-DD format.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const payload: CreateResearcherInput = {
      researcher_code: clean(form.researcher_code),
      full_name: clean(form.full_name),
      email: clean(form.email ?? '') || null,
      phone: clean(form.phone ?? '') || null,
      researcher_type: form.researcher_type,
      department: clean(form.department ?? '') || null,
      research_area: clean(form.research_area ?? '') || null,
      primary_laboratory_id: form.primary_laboratory_id,
      supervisor_name: clean(form.supervisor_name ?? '') || null,
      joining_date: clean(form.joining_date ?? '') || null,
      status: form.status,
    };
    setSaving(true);
    try {
      if (mode === 'edit' && researcher) {
        await updateResearcher(researcher.id, payload);
        Alert.alert('Changes saved', 'Researcher profile has been updated.', [{ text: 'Done', onPress: () => router.replace(`/researchers/${researcher.id}`) }]);
      } else {
        await createResearcher(payload);
        Alert.alert('Researcher added', 'The researcher has been added successfully.', [{ text: 'Done', onPress: () => router.replace('/researchers') }]);
      }
    } catch (err) {
      Alert.alert(mode === 'edit' ? 'Update failed' : 'Could not add researcher', err instanceof Error ? err.message : 'Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ChevronLeft size={21} color={C.ink} /><Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>RESEARCHER MANAGEMENT</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}><UserRoundPlus size={22} color={C.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{mode === 'edit' ? 'Edit researcher' : 'Add researcher'}</Text>
            <Text style={styles.subtitle}>{mode === 'edit' ? 'Update this researcher’s academic and contact details.' : 'Create a researcher record for your laboratory.'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic information</Text>
          <Field label="Researcher code" value={form.researcher_code} onChangeText={(v) => setField('researcher_code', v)} error={errors.researcher_code} placeholder="e.g. RS004" required />
          <Field label="Full name" value={form.full_name} onChangeText={(v) => setField('full_name', v)} error={errors.full_name} placeholder="Enter full name" required />
          <Field label="Email address" value={form.email ?? ''} onChangeText={(v) => setField('email', v)} error={errors.email} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone number" value={form.phone ?? ''} onChangeText={(v) => setField('phone', v)} error={errors.phone} placeholder="Enter phone number" keyboardType="phone-pad" />
          <Choice label="Researcher type" value={form.researcher_type} onChange={(v) => setField('researcher_type', v as CreateResearcherInput['researcher_type'])}
            options={[
              { label: 'Research Scholar', value: 'RESEARCH_SCHOLAR' },
              { label: 'PhD Scholar', value: 'PHD_SCHOLAR' },
            ]} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Academic details</Text>
          <Field label="Department" value={form.department ?? ''} onChangeText={(v) => setField('department', v)} error={errors.department} placeholder="e.g. Department of Chemistry" />
          <Field label="Research area" value={form.research_area ?? ''} onChangeText={(v) => setField('research_area', v)} error={errors.research_area} placeholder="e.g. Molecular Biology" />
          <View style={styles.field}>
            <Text style={styles.label}>Primary laboratory *</Text>
            <Pressable style={[styles.select, errors.primary_laboratory_id ? styles.inputError : null]} onPress={() => setLabPickerOpen((v) => !v)}>
              <Text style={[styles.selectText, !selectedLab && styles.placeholder]}>{loadingLabs ? 'Loading laboratories…' : selectedLab?.name ?? 'Select a laboratory'}</Text>
              {loadingLabs ? <ActivityIndicator color={C.primary} /> : <ChevronDown size={18} color={C.muted} />}
            </Pressable>
            {!!errors.primary_laboratory_id && <Text style={styles.errorText}>{errors.primary_laboratory_id}</Text>}
            {!!loadError && <Text style={styles.errorText}>{loadError}</Text>}
            {labPickerOpen && (
              <View style={styles.dropdown}>
                {laboratories.length ? laboratories.map((lab) => (
                  <Pressable key={lab.id} style={styles.dropdownItem} onPress={() => { setField('primary_laboratory_id', lab.id); setLabPickerOpen(false); }}>
                    <Text style={styles.dropdownText}>{lab.name}</Text>
                    {lab.id === form.primary_laboratory_id && <Text style={styles.selectedMark}>Selected</Text>}
                  </Pressable>
                )) : <Text style={styles.noLabs}>No laboratories available.</Text>}
              </View>
            )}
          </View>
          <Field label="Supervisor name" value={form.supervisor_name ?? ''} onChangeText={(v) => setField('supervisor_name', v)} error={errors.supervisor_name} placeholder="Enter supervisor name" />
          <Field label="Joining date" value={form.joining_date ?? ''} onChangeText={(v) => setField('joining_date', v)} error={errors.joining_date} placeholder="YYYY-MM-DD" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account status</Text>
          <Choice label="Status" value={form.status} onChange={(v) => setField('status', v as CreateResearcherInput['status'])}
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]} />
        </View>

        <Pressable style={[styles.submit, saving && styles.submitDisabled]} onPress={submit} disabled={saving || loadingLabs}>
          {saving ? <ActivityIndicator color={C.white} /> : <Save size={17} color={C.white} />}
          <Text style={styles.submitText}>{saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add researcher'}</Text>
        </Pressable>
        <Text style={styles.requiredNote}>Fields marked * are required.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: SP.lg, paddingTop: SP.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8 },
  backText: { color: C.ink, fontSize: T.bodySmall, fontWeight: '700' },
  eyebrow: { color: C.subtle, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1 },
  content: { padding: SP.lg, paddingBottom: SP.xxxl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.lg },
  titleIcon: { width: 48, height: 48, borderRadius: R.lg, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.ink, fontSize: T.heading1, fontWeight: '800' },
  subtitle: { color: C.muted, fontSize: T.bodySmall, lineHeight: 19, marginTop: 3 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.lg, marginBottom: SP.md, ...LabSyncShadows.card },
  sectionTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800', marginBottom: SP.md },
  field: { marginBottom: SP.md },
  label: { color: C.text, fontSize: T.bodySmall, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, color: C.ink, backgroundColor: C.surfaceSecondary, fontSize: T.body },
  inputError: { borderColor: C.danger },
  errorText: { color: C.danger, fontSize: T.caption, marginTop: 5 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: C.border, borderRadius: R.pill, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: C.surfaceSecondary },
  choiceSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  choiceText: { color: C.muted, fontSize: T.bodySmall, fontWeight: '700' },
  choiceTextSelected: { color: C.primaryDark },
  select: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, backgroundColor: C.surfaceSecondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: C.ink, fontSize: T.body, flex: 1 },
  placeholder: { color: C.subtle },
  dropdown: { marginTop: 6, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.surface, overflow: 'hidden' },
  dropdownItem: { minHeight: 44, paddingHorizontal: SP.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
  dropdownText: { color: C.ink, fontSize: T.bodySmall },
  selectedMark: { color: C.primary, fontSize: T.caption, fontWeight: '800' },
  noLabs: { padding: SP.md, color: C.muted, fontSize: T.bodySmall },
  submit: { minHeight: 52, backgroundColor: C.primary, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: SP.sm },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: C.white, fontSize: T.body, fontWeight: '800' },
  requiredNote: { color: C.subtle, fontSize: T.caption, textAlign: 'center', marginTop: SP.md },
});
