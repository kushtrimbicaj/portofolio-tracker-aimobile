import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Snackbar, Text, Button } from 'react-native-paper';
import AddAssetForm from '../components/AddAssetForm';
import { addPortfolioItem, updatePortfolioItem, getSupabaseClient } from '../services/supabase';
// REMOVED: import { addMockPortfolioItem, removeMockPortfolioItem } from '../services/portfolioService'; 

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null, info: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, info) {
		this.setState({ error, info });
		console.error('ErrorBoundary caught:', error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
					<Text style={{ fontWeight: '700', marginBottom: 8 }}>Something went wrong rendering Add Asset.</Text>
					<Text selectable style={{ marginBottom: 12 }}>{String(this.state.error)}</Text>
					<Button mode="outlined" onPress={() => { try { this.setState({ hasError: false, error: null, info: null }); } catch(_){} }}>
						Dismiss
					</Button>
				</View>
			);
		}
		return this.props.children;
	}
}

export default function AddAssetScreen({ navigation, route }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const editing = route?.params?.item ?? null;

  React.useEffect(() => {
    console.log('AddAssetScreen mounted, editing=', !!editing);
    console.log('Debug imports:', { Appbar: typeof Appbar !== 'undefined', AddAssetForm: typeof AddAssetForm !== 'undefined', Snackbar: typeof Snackbar !== 'undefined', Text: typeof Text !== 'undefined', Button: typeof Button !== 'undefined' });
  }, []);

	const missingImports = React.useMemo(() => {
		const list = [];
		if (typeof Appbar === 'undefined') list.push('Appbar');
		if (typeof AddAssetForm === 'undefined') list.push('AddAssetForm');
		if (typeof Snackbar === 'undefined') list.push('Snackbar');
		if (typeof Text === 'undefined') list.push('Text');
		if (typeof Button === 'undefined') list.push('Button');
		return list;
	}, []);

  async function handleSave(item) {
    setSaving(true);
    try {
      let toInsert = { ...item };
      let userId = null;

      // 1. Try to attach current user ID
      try {
        const sb = getSupabaseClient();
        if (sb && sb.auth && typeof sb.auth.getUser === 'function') {
          const res = await sb.auth.getUser();
          userId = res?.data?.user?.id ?? null;
        }
      } catch (e) {
        console.warn('Auth lookup failed:', e);
      }

      if (editing) {
        // 2. Editing existing asset (UPDATE)
        const serverId = editing?.raw?.id ?? editing?.id;
        const updates = { ...toInsert };
        
        // Supabase handles ID automatically, remove it from the payload
        if (updates.id) delete updates.id; 
        
        await updatePortfolioItem(serverId, updates);
        
        setMsg('Asset updated');
        navigation.goBack();
      } else {
        // 3. Creating new asset (ADD)
        if (userId) toInsert.user_id = userId;

        await addPortfolioItem(toInsert);
        
        setMsg('Asset saved');
        navigation.goBack();
      }

    } catch (err) {
      // Consolidated error handling for Supabase
      console.error('Asset save/update failed:', err);
      
      const msgText = (err && (err.message || String(err))).toString();
      setMsg(`Operation failed: ${msgText.substring(0, 80)}`);
      
    } finally {
      setSaving(false);
    }
  }

	if (missingImports.length > 0) {
		console.error('AddAssetScreen missing imports:', missingImports);
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
				<Text style={{ fontWeight: '700', marginBottom: 8 }}>Add Asset cannot render</Text>
				<Text selectable style={{ marginBottom: 12 }}>Missing imports: {missingImports.join(', ')}</Text>
				<Text>Please check the component imports in <Text style={{ fontWeight: '600' }}>src/screens/AddAssetScreen.js</Text>.</Text>
			</View>
		);
	}

	return (
		<ErrorBoundary>
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
						// Optional: pass saving state to disable form while saving
						saving={saving}
					/>
				</View>

				<Snackbar visible={!!msg} onDismiss={() => setMsg('')} duration={3000}>
					<Text>{msg}</Text>
				</Snackbar>
			</View>
		</ErrorBoundary>
	);
}

  const styles = StyleSheet.create({
    appbar: {
      backgroundColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
    },
  });