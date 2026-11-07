import { Stack } from 'expo-router';
import ResearcherForm from '../../components/researchers/ResearcherForm';

export default function CreateResearcherScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add Researcher', headerShown: false }} />
      <ResearcherForm mode="create" />
    </>
  );
}
