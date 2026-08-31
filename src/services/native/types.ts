/**
 * Life Gamify — Bidirectional Native Bridge Types & Contracts
 */

export type NativeServiceName = 
  | 'notifications'
  | 'widgets'
  | 'backgroundTasks'
  | 'assistant'
  | 'onDeviceAI'
  | 'device';

export type NativeActionName = 
  | 'schedule'
  | 'cancel'
  | 'getPending'
  | 'updateData'
  | 'refresh'
  | 'registerShortcuts'
  | 'generate'
  | 'getDeviceInfo'
  | 'hapticFeedback';

export interface NativeRequest<T = any> {
  id: string;
  service: NativeServiceName;
  action: NativeActionName | string;
  payload: T;
}

export interface NativeResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    unsupported?: boolean;
  };
}

export type NativeEventType = 
  | 'widget_tap'
  | 'notification_action'
  | 'shortcut_invoked'
  | 'background_sync_triggered'
  | 'app_state_changed';

export interface NativeEvent<T = any> {
  type: NativeEventType;
  payload: T;
}

// Service Specific Payloads
export interface NotificationSchedulePayload {
  id: string;
  title: string;
  body: string;
  scheduleDate?: string; // ISO-8601
  intervalSeconds?: number;
  repeating?: boolean;
  category?: 'streak_reminder' | 'habit_due' | 'boss_alert' | 'general';
  userInfo?: Record<string, any>;
}

export interface HabitWidgetSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  completed: boolean;
  progressText: string;
  rewardValue: number;
}

export interface WidgetDataPayload {
  streak: number;
  availableFreezes: number;
  coinBalance: number;
  level: number;
  xpProgress: number; // 0.0 - 1.0
  activeBoss?: {
    name: string;
    icon: string;
    hp: number;
    maxHp: number;
  };
  quickHabits: HabitWidgetSummary[];
  updatedAt: string; // ISO-8601
}

export interface BackgroundTaskSchedulePayload {
  taskId: string;
  earliestBeginDateSeconds?: number;
  requiresNetwork?: boolean;
  requiresCharging?: boolean;
  periodicIntervalMinutes?: number;
}

export interface AssistantShortcutPayload {
  id: string;
  title: string;
  suggestedInvocationPhrase: string;
  action: 'log_habit' | 'view_streak' | 'check_boss' | 'open_store';
  parameters?: Record<string, any>;
}

export interface OnDeviceAIPromptPayload {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface OnDeviceAIResponseData {
  text: string;
  model: string;
  latencyMs: number;
}

export interface DeviceInfoData {
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;
  hasNativeWidgets: boolean;
  hasOnDeviceAI: boolean;
  isSimulator: boolean;
}
