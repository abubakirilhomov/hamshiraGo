import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { reportError } from '@/utils/reportError';

interface Props { children: React.ReactNode; userId?: string; appType: 'mobile' | 'medic'; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError({
      message: error.message,
      stacktrace: error.stack,
      screen: info.componentStack?.split('\n')[1]?.trim() ?? 'unknown',
      errorCode: error.name,
      userId: this.props.userId,
      appType: this.props.appType,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Что-то пошло не так</Text>
          <Text style={s.sub}>Мы уже получили отчёт об ошибке</Text>
          <Pressable style={s.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={s.btnText}>Попробовать снова</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});
