// Phone Push Notification & Mobile Alert Service
// Delivers notifications directly to the device system notification drawer / lock screen,
// physical vibration pattern, audio chime, and optional direct SMS/WhatsApp broadcast to player phones.
// Explicitly avoids intrusive in-app toasts ("not on app").

let audioCtx: AudioContext | null = null;

// Initialize and register service worker for mobile phone push notifications
export async function initNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.debug('Service Worker notification registration skipped:', err);
    return null;
  }
}

// Automatically register on script load
if (typeof window !== 'undefined') {
  initNotificationServiceWorker().catch(() => {});
}

export function playPhoneChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Modern dual-tone phone alert chime (E6 & A6)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(1318.51, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    
    osc2.frequency.setValueAtTime(659.25, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  } catch (err) {
    console.debug('Audio chime playback omitted:', err);
  }
}

// Physical phone vibration (vibrates the phone in the hand/pocket)
export function triggerPhoneVibration() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (err) {
    console.debug('Vibration omitted:', err);
  }
}

export interface PhoneNotificationPayload {
  title: string;
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp?: string;
  avatarBg?: string;
  channelName?: string;
  tag?: string;
  dataUrl?: string;
}

// Check current notification permission on this device
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission to send alerts to this phone's lock screen & notification shade
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    await initNotificationServiceWorker();
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Sends a real notification directly to the user's PHONE
 * (System notification shade, lock screen, vibration, audio chime).
 * Deliberately DOES NOT display on-app popups/toasts.
 */
export async function sendPhonePushAlert(payload: PhoneNotificationPayload): Promise<boolean> {
  // 1. Play phone audio alert
  playPhoneChime();

  // 2. Mobile vibration to phone hardware
  triggerPhoneVibration();

  const formattedTitle = payload.channelName
    ? `🔥 Flamehunter FC [${payload.channelName}]`
    : `🔥 Flamehunter FC • ${payload.senderName}`;
  const formattedBody = payload.senderRole
    ? `${payload.senderName} (${payload.senderRole}): ${payload.text}`
    : `${payload.senderName}: ${payload.text}`;

  // 3. Deliver to system OS notification bar / lock screen via Service Worker (Android / iOS PWA standard)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(formattedTitle, {
            body: formattedBody,
            icon: '/icon-192.png',
            badge: '/flamehunter_fc_logo.jpg',
            tag: payload.tag || `flamehunter-${Date.now()}`,
            vibrate: [250, 100, 250, 100, 400],
            renotify: true,
            requireInteraction: false,
            data: {
              url: payload.dataUrl || '/'
            }
          } as NotificationOptions & { vibrate?: number[] });
          return true;
        }
      } catch (swErr) {
        console.debug('Service Worker showNotification fallback:', swErr);
      }

      // Fallback for desktop Safari/Firefox if SW is not ready
      try {
        new Notification(formattedTitle, {
          body: formattedBody,
          icon: '/icon-192.png'
        });
        return true;
      } catch (nErr) {
        console.debug('Standard Notification API fallback error:', nErr);
      }
    }
  }

  return false;
}

/**
 * Schedule a notification to the phone with a delay (e.g. 5 or 10 seconds).
 * Perfect for users who want to lock their phone or switch to their home screen
 * to verify the notification arrives on their phone lock screen!
 */
export function schedulePhonePushAlert(payload: PhoneNotificationPayload, delaySeconds: number = 5) {
  // Post message to service worker so it can execute even if tab is put into background
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_PHONE_NOTIFICATION',
      title: `🔥 Flamehunter FC • ${payload.title}`,
      body: payload.text,
      tag: payload.tag || `fh-delayed-${Date.now()}`,
      delayMs: delaySeconds * 1000
    });
  }

  // Also set a backup timeout on window
  setTimeout(() => {
    sendPhonePushAlert(payload).catch(console.error);
  }, delaySeconds * 1000);
}

/**
 * Send an SMS alert to a list of phone numbers (e.g. for squad match/training reminders)
 */
export function openSquadSmsComposer(phoneNumbers: string[], message: string) {
  if (typeof window === 'undefined') return;
  const validPhones = phoneNumbers.filter(p => p && p.trim().length > 5);
  const delimiter = navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?';
  const recipients = validPhones.join(',');
  const smsUrl = `sms:${recipients}${delimiter}body=${encodeURIComponent(message)}`;
  window.open(smsUrl, '_blank');
}

/**
 * Open WhatsApp broadcast / chat to send phone alert to teammates
 */
export function openSquadWhatsApp(message: string, targetPhone?: string) {
  if (typeof window === 'undefined') return;
  let waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  if (targetPhone) {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  window.open(waUrl, '_blank');
}
