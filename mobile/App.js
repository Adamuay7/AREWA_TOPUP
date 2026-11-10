import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BACKEND_URL = (
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'
).replace(/\/$/, '');

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'The request could not be completed');
  }
  return data;
}

export default function App() {
  const [phone, setPhone] = useState('08012345678');
  const [balance, setBalance] = useState(0);
  const [fundAmount, setFundAmount] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [vtuType, setVtuType] = useState('airtime');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!phone.trim()) {
      setBalance(0);
      setError('');
      return undefined;
    }

    let active = true;
    setLoadingBalance(true);
    setError('');

    fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(phone.trim())}`)
      .then(readResponse)
      .then((data) => {
        if (active) setBalance(Number(data.balance) || 0);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load wallet balance');
      })
      .finally(() => {
        if (active) setLoadingBalance(false);
      });

    return () => {
      active = false;
    };
  }, [phone]);

  const fundWallet = async () => {
    const numericAmount = Number(fundAmount);
    if (!phone.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Check your details', 'Enter a phone number and a positive amount.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/wallet/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), amount: numericAmount }),
      });
      const data = await readResponse(response);
      setBalance(Number(data.balance) || 0);
      setFundAmount('');
      Alert.alert('Success', data.message);
    } catch (requestError) {
      Alert.alert('Unable to fund wallet', requestError.message || 'Failed to connect to the backend.');
    } finally {
      setProcessing(false);
    }
  };

  const buyVtu = async () => {
    const numericAmount = Number(purchaseAmount);
    if (
      !phone.trim() ||
      !recipient.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert('Check your details', 'Enter your phone number, recipient, and a positive amount.');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/vtu/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          network,
          type: vtuType,
          amount: numericAmount,
          recipient: recipient.trim(),
        }),
      });
      const data = await readResponse(response);
      setBalance(Number(data.balance) || 0);
      setPurchaseAmount('');
      setRecipient('');
      Alert.alert('Success', data.message);
    } catch (requestError) {
      Alert.alert('Unable to process purchase', requestError.message || 'Failed to connect to the backend.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>AREWA TOPUP</Text>
      <Text style={styles.subtitle}>Wallet and VTU services</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.label}>My phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <Text style={styles.balanceTitle}>Wallet balance</Text>
        <Text style={styles.balance}>
          {loadingBalance ? 'Loading…' : `₦${balance.toLocaleString()}`}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fund wallet</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (₦)"
          keyboardType="decimal-pad"
          value={fundAmount}
          onChangeText={setFundAmount}
        />
        <TouchableOpacity
          style={[styles.button, processing && styles.buttonDisabled]}
          onPress={fundWallet}
          disabled={processing}
        >
          <Text style={styles.buttonText}>{processing ? 'Please wait…' : 'Add funds'}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Demo only: funding adds mock funds to the in-memory wallet.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buy airtime or data</Text>
        <Text style={styles.fieldLabel}>Network</Text>
        <View style={styles.optionRow}>
          {['MTN', 'Airtel', 'Glo', '9mobile'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, network === option && styles.optionSelected]}
              onPress={() => setNetwork(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: network === option }}
            >
              <Text style={[styles.optionText, network === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Purchase type</Text>
        <View style={styles.optionRow}>
          {['airtime', 'data'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, vtuType === option && styles.optionSelected]}
              onPress={() => setVtuType(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: vtuType === option }}
            >
              <Text style={[styles.optionText, vtuType === option && styles.optionTextSelected]}>
                {option === 'airtime' ? 'Airtime' : 'Data'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Recipient phone number"
          keyboardType="phone-pad"
          value={recipient}
          onChangeText={setRecipient}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (₦)"
          keyboardType="decimal-pad"
          value={purchaseAmount}
          onChangeText={setPurchaseAmount}
        />
        <TouchableOpacity
          style={[styles.button, processing && styles.buttonDisabled]}
          onPress={buyVtu}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? 'Please wait…' : 'Process purchase'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    backgroundColor: '#f5f6fa',
  },
  title: {
    color: '#2f3640',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#718093',
    fontSize: 14,
    marginBottom: 22,
    textAlign: 'center',
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: '#00a8ff',
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
  },
  label: { color: '#fff', fontSize: 14, marginBottom: 5 },
  balanceTitle: { color: '#f5f6fa', fontSize: 16, marginTop: 10 },
  balance: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    marginBottom: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionTitle: { color: '#2f3640', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  fieldLabel: { color: '#2f3640', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dcdde1',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  option: {
    borderColor: '#dcdde1',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionSelected: { backgroundColor: '#eaf7ff', borderColor: '#00a8ff' },
  optionText: { color: '#2f3640' },
  optionTextSelected: { color: '#0077b6', fontWeight: 'bold' },
  button: {
    alignItems: 'center',
    backgroundColor: '#4cd137',
    borderRadius: 8,
    padding: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  note: { color: '#718093', fontSize: 12, marginTop: 10 },
  error: { color: '#fff', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
