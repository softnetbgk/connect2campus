import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, StatusBar, BackHandler, ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

// ✅ YOUR LIVE SITE URL (Connected!)
const WEBSITE_URL = 'https://school-software-tan.vercel.app/?is_mobile_app=true';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.log('WebView App Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong.</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const MainApp = () => {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [key, setKey] = useState(0); // To force reload

  // 🔙 Handle Android Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [canGoBack]);

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Loading School System...</Text>
    </View>
  );

  const ErrorState = (domain, code, description) => (
    <View style={styles.loadingContainer}>
      <Text style={[styles.loadingText, { color: 'red' }]}>Failed to load content.</Text>
      <Text style={{ color: '#666', marginTop: 5 }}>{description}</Text>
      <TouchableOpacity onPress={() => setKey(k => k + 1)} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        key={key}
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        startInLoadingState={true}
        renderLoading={LoadingState}
        renderError={ErrorState}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 100,
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
  },
});
