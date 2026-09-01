/**
 * Life Gamify — Bidirectional Native Bridge Client SDK
 */

import {
  NativeRequest,
  NativeResponse,
  NativeEvent,
  NotificationSchedulePayload,
  WidgetDataPayload,
  BackgroundTaskSchedulePayload,
  AssistantShortcutPayload,
  OnDeviceAIPromptPayload,
  OnDeviceAIResponseData,
  DeviceInfoData
} from './types';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        lifeGamifyBridge?: {
          postMessage: (msg: string) => void;
        };
      };
    };
    AndroidLifeGamifyBridge?: {
      postMessage: (msg: string) => void;
    };
    lifeGamifyHandleNativeResponse?: (responseJson: string) => void;
    lifeGamifyHandleNativeEvent?: (eventJson: string) => void;
  }
}

class LifeGamifyBridgeClient {
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: any }>();
  private eventListeners = new Set<(event: NativeEvent) => void>();

  constructor() {
    this.setupInboundHandlers();
  }

  private setupInboundHandlers() {
    if (typeof window === 'undefined') return;

    // Handler for native responses to asynchronous requests
    window.lifeGamifyHandleNativeResponse = (responseJson: string) => {
      try {
        const response: NativeResponse = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
        const pending = this.pendingRequests.get(response.id);
        if (!pending) return;

        clearTimeout(pending.timer);
        this.pendingRequests.delete(response.id);

        if (response.success) {
          pending.resolve(response.data);
        } else {
          pending.reject(new Error(response.error?.message || 'Native operation failed'));
        }
      } catch (err) {
        console.error('[Bridge] Error handling native response:', err);
      }
    };

    // Handler for unsolicited events from native platform (e.g. widget taps, notifications)
    window.lifeGamifyHandleNativeEvent = (eventJson: string) => {
      try {
        const event: NativeEvent = typeof eventJson === 'string' ? JSON.parse(eventJson) : eventJson;
        this.eventListeners.forEach(listener => {
          try {
            listener(event);
          } catch (e) {
            console.error('[Bridge] Error in native event listener:', e);
          }
        });

        // Also dispatch to global window custom event for broad UI listening
        window.dispatchEvent(new CustomEvent('life-gamify-native-event', { detail: event }));
      } catch (err) {
        console.error('[Bridge] Error handling native event:', err);
      }
    };
  }

  public getPlatform(): 'ios' | 'android' | 'web' {
    if (typeof window === 'undefined') return 'web';
    if (window.webkit?.messageHandlers?.lifeGamifyBridge) return 'ios';
    if (window.AndroidLifeGamifyBridge) return 'android';
    return 'web';
  }

  public isNative(): boolean {
    return this.getPlatform() !== 'web';
  }

  public async sendRequest<TResult = any, TPayload = any>(
    service: NativeRequest['service'],
    action: NativeRequest['action'],
    payload: TPayload,
    timeoutMs: number = 8000
  ): Promise<TResult> {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const request: NativeRequest<TPayload> = { id, service, action, payload };

    const platform = this.getPlatform();

    if (platform === 'web') {
      return this.handleWebFallback<TResult, TPayload>(service, action, payload);
    }

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`[Bridge] Request timeout after ${timeoutMs}ms for ${service}.${action}`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        const jsonString = JSON.stringify(request);
        if (platform === 'ios') {
          window.webkit!.messageHandlers!.lifeGamifyBridge!.postMessage(jsonString);
        } else if (platform === 'android') {
          window.AndroidLifeGamifyBridge!.postMessage(jsonString);
        }
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  public onNativeEvent(listener: (event: NativeEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private async handleWebFallback<TResult, TPayload>(
    service: NativeRequest['service'],
    action: NativeRequest['action'],
    payload: TPayload
  ): Promise<TResult> {
    // Web Fallback implementations
    switch (service) {
      case 'widgets':
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('life_gamify_widget_preview', JSON.stringify(payload));
        }
        return { updated: true, platform: 'web' } as unknown as TResult;

      case 'notifications':
        if (action === 'schedule' && 'Notification' in window && Notification.permission === 'granted') {
          const p = payload as any;
          new Notification(p.title, { body: p.body });
        }
        return { scheduled: true, platform: 'web' } as unknown as TResult;

      case 'device':
        if (action === 'hapticFeedback' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(20);
        }
        return {
          platform: 'web',
          osVersion: typeof navigator !== 'undefined' ? navigator.userAgent : 'browser',
          appVersion: '1.0.0',
          hasNativeWidgets: false,
          hasOnDeviceAI: false,
          isSimulator: false,
        } as unknown as TResult;

      default:
        return { fallback: true, service, action } as unknown as TResult;
    }
  }
}

export const nativeBridge = new LifeGamifyBridgeClient();

/**
 * High-Level Service Facades
 */

export const nativeNotificationService = {
  schedule: (payload: NotificationSchedulePayload) => 
    nativeBridge.sendRequest<{ success: boolean }>('notifications', 'schedule', payload),
  cancel: (notificationId: string) => 
    nativeBridge.sendRequest<{ success: boolean }>('notifications', 'cancel', { id: notificationId }),
};

export const nativeWidgetService = {
  updateData: (payload: WidgetDataPayload) => 
    nativeBridge.sendRequest<{ success: boolean }>('widgets', 'updateData', payload),
  refresh: () => 
    nativeBridge.sendRequest<{ success: boolean }>('widgets', 'refresh', {}),
};

export const nativeBackgroundTaskService = {
  schedule: (payload: BackgroundTaskSchedulePayload) => 
    nativeBridge.sendRequest<{ success: boolean }>('backgroundTasks', 'schedule', payload),
};

export const nativeAssistantService = {
  registerShortcuts: (shortcuts: AssistantShortcutPayload[]) => 
    nativeBridge.sendRequest<{ success: boolean }>('assistant', 'registerShortcuts', { shortcuts }),
};

export const nativeOnDeviceAIService = {
  generate: (payload: OnDeviceAIPromptPayload) => 
    nativeBridge.sendRequest<OnDeviceAIResponseData>('onDeviceAI', 'generate', payload, 120000),
};

export const nativeDeviceService = {
  getDeviceInfo: () => 
    nativeBridge.sendRequest<DeviceInfoData>('device', 'getDeviceInfo', {}),
  hapticFeedback: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => 
    nativeBridge.sendRequest<void>('device', 'hapticFeedback', { style }),
};
