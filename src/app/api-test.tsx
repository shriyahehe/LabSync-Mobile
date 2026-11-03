
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    getEquipment,
    getExperiments,
    getLaboratories,
    getMaterials,
} from '@/services/api';

export default function ApiTestScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function testAPI() {
      try {
        const [
          laboratories,
          materials,
          equipment,
          experiments,
        ] = await Promise.all([
          getLaboratories(),
          getMaterials(),
          getEquipment(),
          getExperiments(),
        ]);

        setData({
          laboratories,
          materials,
          equipment,
          experiments,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unknown error'
        );
      } finally {
        setLoading(false);
      }
    }

    testAPI();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>LabSync API Test</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#176B63" />
      ) : error ? (
        <Text style={styles.error}>Connection failed: {error}</Text>
      ) : (
        <>
          <Text style={styles.success}>
            Backend connection successful!
          </Text>

          {Object.entries(data).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.card}>
              <Text style={styles.label}>
                {key.toUpperCase()}
              </Text>

              <Text style={styles.count}>
                {value.length} records retrieved
              </Text>
            </View>
          ))}

          <Text style={styles.json}>
            {JSON.stringify(data, null, 2)}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F3EC',
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#172A36',
    marginBottom: 24,
  },
  success: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#176B63',
    marginBottom: 20,
  },
  error: {
    color: '#B84A42',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FCFBF7',
    borderWidth: 1,
    borderColor: '#D8DDD8',
    padding: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#65747C',
  },
  count: {
    fontSize: 20,
    color: '#172A36',
    marginTop: 6,
  },
  json: {
    fontSize: 11,
    color: '#172A36',
    marginTop: 20,
    lineHeight: 17,
  },
});
