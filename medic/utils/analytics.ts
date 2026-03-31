import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

const QUEUE_KEY = 'analytics_queue';
const BATCH_SIZE = 20;

// Track an event (stores locally, batches for sending)
export async function trackEvent(name: string, properties?: Record<string, any>): Promise<void> {
  try {
    const event: AnalyticsEvent = {
      name,
      properties: { ...properties, platform: Platform.OS },
      timestamp: Date.now(),
    };

    // Add to queue
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    queue.push(event);

    // If batch is full, flush
    if (queue.length >= BATCH_SIZE) {
      await flushEvents(queue);
    } else {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // Analytics should never crash the app
  }
}

// Flush events to server (or just clear for now)
async function flushEvents(events: AnalyticsEvent[]): Promise<void> {
  // TODO: Send to POST /analytics/events when backend endpoint exists
  // For now, just log and clear
  if (__DEV__) {
    console.log(`[Analytics] Flushing ${events.length} events`);
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

// Call on app start to flush any pending events
export async function flushPendingEvents(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      const queue: AnalyticsEvent[] = JSON.parse(raw);
      if (queue.length > 0) {
        await flushEvents(queue);
      }
    }
  } catch {
    // Analytics should never crash the app
  }
}
