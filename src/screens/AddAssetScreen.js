import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar, Snackbar, Text } from 'react-native-paper';
import AddAssetForm from '../components/AddAssetForm';
import { addPortfolioItem, updatePortfolioItem, getSupabaseClient } from '../services/supabase';
import { addMockPortfolioItem, removeMockPortfolioItem } from '../services/portfolioService';
import { StyleSheet } from 'react-native';

export default function AddAssetScreen({ navigation, route }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const editing = route?.params?.item ?? null;

  async function handleSave(item) {
    setSaving(true);
    try {
      // ensure toInsert is visible in catch block by declaring here
      let toInsert = null;
      // try to attach current user if available
      let userId = null;
      try {
        const sb = getSupabaseClient();
        if (sb && sb.auth && typeof sb.auth.getUser === 'function') {
          const res = await sb.auth.getUser();
          userId = res?.data?.user?.id ?? null;
        }
      } catch (e) {
        // ignore auth lookup errors
      }

      toInsert = { ...item };

      if (editing) {
        // Editing: attempt server update using server id when available
        const serverId = editing?.raw?.id ?? editing?.id;
        try {
          const updates = { ...toInsert };
          // remove local id if present
          if (updates.id) delete updates.id;
          const updated = await updatePortfolioItem(serverId, updates);
          setMsg('Asset updated');
          navigation.goBack();
          return updated;
        } catch (updErr) {
          console.warn('Server update failed, falling back to local replace', updErr);
          // fallback: remove mock entry then add updated mock (preserve id if possible)
          try {
            const oldId = editing.id || editing.symbol;
            await removeMockPortfolioItem(oldId);
          } catch (remErr) {
            // ignore
          }
          try {
            // preserve id so the local list refresh keeps the same key where possible
            if (editing?.id) toInsert.id = editing.id;
            const local = await addMockPortfolioItem(toInsert);
            setMsg('Saved locally (dev fallback)');
            navigation.goBack();
            return local;
          } catch (localErr) {
            console.error('Local fallback after update failed', localErr);
            throw updErr;
          }
        }
      }

      // Creating new asset
      if (userId) toInsert.user_id = userId;

      const saved = await addPortfolioItem(toInsert);
      setMsg('Asset saved');
      navigation.goBack();
      return saved;
    } catch (err) {
      console.error('AddAssetScreen save error', err);
      // Try local fallback for any save error (development convenience)
      try {
        const fallbackItem = (typeof toInsert !== 'undefined' && toInsert) ? toInsert : item;
        // If editing, attempt to replace the local mock (remove + add)
        if (editing) {
          try {
            await removeMockPortfolioItem(editing.id || editing.symbol);
          } catch (remErr) {
            // ignore
          }
        }
        const local = await addMockPortfolioItem(fallbackItem);
        console.warn('Falling back to local save due to error:', err?.message || err);
        setMsg('Saved locally (dev fallback)');
        navigation.goBack();
        return local;
      } catch (localErr) {
        console.error('local save failed', localErr);
        const msgText = (err && (err.message || String(err))).toString();
        setMsg(msgText || 'Save failed');
        throw err;
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={editing ? 'Edit Asset' : 'Add Asset'} />
      </Appbar.Header>

      <View style={{ flex: 1 }}>
        <AddAssetForm
          onSaved={handleSave}
          initialValues={editing}
          onCancel={() => navigation.goBack()}
        />
      </View>

      <Snackbar visible={!!msg} onDismiss={() => setMsg('')} duration={3000}>{msg}</Snackbar>
    </View>
  );
}

  const styles = StyleSheet.create({
    appbar: {
      backgroundColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
    },
  });
