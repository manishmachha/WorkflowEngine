import { Injectable, computed, signal } from '@angular/core';

type Bundle = Record<string, string>;

const bundles: Record<string, Bundle> = {
  en: {
    'app.title': 'Workflow Engine',
    'nav.dashboard': 'Dashboard',
    'nav.definitions': 'Definitions',
    'nav.inbox': 'Inbox',
    'nav.instances': 'Instances',
    'nav.rules': 'Rule Tester',
    'nav.admin': 'Admin',
    'nav.migration': 'Migration',
    'nav.needs_attention': 'Needs Attention',
    'nav.mobile': 'Field',
    'nav.monitor': 'Activity Monitor',
    'nav.rules_library': 'Rule Library',
    'nav.actions': 'Actions',
    'nav.forms': 'Forms',
    'nav.notifications': 'Notifications',
  },
  hi: {
    'app.title': 'प्रवाह इंजन',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.definitions': 'परिभाषाएं',
    'nav.inbox': 'इनबॉक्स',
    'nav.instances': 'इंस्टेंस',
    'nav.rules': 'नियम परीक्षक',
    'nav.admin': 'व्यवस्थापक',
    'nav.migration': 'माइग्रेशन',
    'nav.needs_attention': 'ध्यान चाहिए',
    'nav.mobile': 'फील्ड',
    'nav.monitor': 'गतिविधि मॉनिटर',
    'nav.rules_library': 'नियम पुस्तकालय',
    'nav.actions': 'क्रियाएं',
    'nav.forms': 'फ़ॉर्म',
    'nav.notifications': 'सूचनाएं',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nStore {
  private _lang = signal<'en' | 'hi'>('en');
  readonly lang = this._lang.asReadonly();
  readonly bundle = computed(() => bundles[this._lang()] ?? bundles['en']);

  setLang(l: 'en' | 'hi') {
    this._lang.set(l);
  }

  t(key: string): string {
    return this.bundle()[key] ?? key;
  }
}
