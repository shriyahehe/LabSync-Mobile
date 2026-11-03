
import { StyleSheet, Text, View } from 'react-native'

export default function LabEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lab Entry Records</Text>
      <Text style={styles.subtitle}>
        Researcher check-in and check-out
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3EC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#176B63',
  },
  subtitle: {
    marginTop: 10,
    color: '#65747C',
  },
})

