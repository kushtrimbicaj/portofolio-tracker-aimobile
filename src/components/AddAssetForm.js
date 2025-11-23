import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';

/**
 * Manual Add Asset Form
 * Props:
 * - onSaved(item) -> parent will persist via Supabase
 * - onCancel()
 * - saving (boolean) -> controls whether the form is disabled during a save operation
 */
export default function AddAssetForm({ 
  onSaved, 
  onCancel, 
  defaultSymbol = '', 
  initialValues = null,
  saving = false // <--- ACCEPTING THE SAVING PROP FROM PARENT
}) {
  // Prefill form when editing an existing item via `initialValues`
  const [name, setName] = useState(initialValues?.name ?? '');
  const [symbol, setSymbol] = useState(initialValues?.symbol ?? defaultSymbol);
  const [imageUrl, setImageUrl] = useState(initialValues?.image ?? '');
  const [quantity, setQuantity] = useState(initialValues?.quantity ? String(initialValues.quantity) : '');
  const [avgPrice, setAvgPrice] = useState(initialValues?.avg_price ? String(initialValues.avg_price) : '');
  const [currentPrice, setCurrentPrice] = useState(initialValues?.last_price ? String(initialValues.last_price) : '');
  const [error, setError] = useState(null);
  // REMOVED: const [saving, setSaving] = useState(false); - Now controlled by prop

  function validate() {
    if (!name || name.trim().length === 0) return 'Enter a name';
    if (!symbol || symbol.trim().length === 0) return 'Enter a symbol';
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 'Enter a valid quantity';
    return null;
  }

  async function handleSave() {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const qty = Number(quantity);
    const avg = avgPrice ? Number(avgPrice) : null;
    const last = currentPrice ? Number(currentPrice) : null;

    const item = {
      // preserve coin_id when editing, otherwise generate a new manual id
      coin_id: initialValues?.coin_id ?? `manual-${symbol.trim().toLowerCase()}-${Date.now()}`,
      id: initialValues?.id ?? undefined,
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      image: imageUrl ? imageUrl.trim() : null,
      quantity: qty,
      avg_price: avg,
      last_price: last,
    };

    try {
      // The parent (AddAssetScreen) sets the global `saving` state to true before calling onSaved
      await onSaved(item);
    } catch (err) {
      console.error('save error', err);
      // If onSaved fails, the parent will set saving=false. Display error locally.
      setError(err?.message || 'Save failed'); 
    }
    // No finally block needed here, parent controls the state change
  }

  // Function to determine if inputs should be disabled
  const isDisabled = saving;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={styles.formCard}>
        <TextInput 
            label="Name" 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
            mode="outlined" 
            disabled={isDisabled} 
        />
        <TextInput 
            label="Symbol" 
            value={symbol} 
            onChangeText={setSymbol} 
            style={[styles.input, { marginTop: 12 }]} 
            autoCapitalize="characters" 
            mode="outlined" 
            disabled={isDisabled} 
        />
        <TextInput 
            label="Image URL (optional)" 
            value={imageUrl} 
            onChangeText={setImageUrl} 
            style={[styles.input, { marginTop: 12 }]} 
            mode="outlined" 
            disabled={isDisabled} 
        />

        {imageUrl ? (
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Image source={{ uri: imageUrl }} style={{ width: 72, height: 72, borderRadius: 12 }} />
          </View>
        ) : null}

        <TextInput 
            label="Quantity" 
            value={quantity} 
            onChangeText={setQuantity} 
            keyboardType="numeric" 
            style={[styles.input, { marginTop: 16 }]} 
            mode="outlined" 
            disabled={isDisabled} 
        />
        <TextInput 
            label="Average price (USD, optional)" 
            value={avgPrice} 
            onChangeText={setAvgPrice} 
            keyboardType="numeric" 
            style={[styles.input, { marginTop: 12 }]} 
            mode="outlined" 
            disabled={isDisabled} 
        />
        <TextInput 
            label="Current price (USD, optional)" 
            value={currentPrice} 
            onChangeText={setCurrentPrice} 
            keyboardType="numeric" 
            style={[styles.input, { marginTop: 12 }]} 
            mode="outlined" 
            disabled={isDisabled} 
        />

        {error ? <HelperText type="error" style={{ marginTop: 8 }}>{error}</HelperText> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
        <Button 
                mode="outlined" 
                onPress={onCancel} 
                disabled={isDisabled} 
                style={styles.buttonLeft}
            >
                <Text>Cancel</Text>
            </Button>
          <Button 
                mode="contained" 
                onPress={handleSave} 
                loading={isDisabled} 
                style={styles.buttonRight}
            >
                <Text>Save Asset</Text>
            </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  buttonLeft: { flex: 1, marginRight: 8, borderRadius: 12 },
  buttonRight: { flex: 1, marginLeft: 8, borderRadius: 12 },
});