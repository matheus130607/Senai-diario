import { useEffect } from 'react';
import { useUserSettings } from '../contexts/UserSettingsContext';

const SCRIPT_ID = 'senai-vlibras-plugin';
const WIDGET_ID = 'senai-vlibras-widget';
const VLibras_APP_URL = 'https://vlibras.gov.br/app';

const POSITION_MAP = {
  left: 'L',
  right: 'R',
  'top-left': 'TL',
  'top-right': 'TR',
  'bottom-left': 'BL',
  'bottom-right': 'BR',
};

const loadVLibrasScript = () => {
  const existingScript = document.getElementById(SCRIPT_ID);

  if (window.VLibras?.Widget) {
    return Promise.resolve();
  }

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${VLibras_APP_URL}/vlibras-plugin.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const removeWidgetRoot = () => {
  document.getElementById(WIDGET_ID)?.remove();
  window.plugin = undefined;
};

const runVLibrasOnLoad = () => {
  if (document.readyState !== 'complete' || typeof window.onload !== 'function') return;
  window.onload(new Event('load'));
};

const createWidgetRoot = () => {
  removeWidgetRoot();

  const root = document.createElement('div');
  root.id = WIDGET_ID;
  root.className = 'enabled senai-vlibras-widget';
  root.setAttribute('vw', '');

  const accessButton = document.createElement('div');
  accessButton.className = 'active';
  accessButton.setAttribute('vw-access-button', '');

  const pluginWrapper = document.createElement('div');
  pluginWrapper.setAttribute('vw-plugin-wrapper', '');

  const topWrapper = document.createElement('div');
  topWrapper.className = 'vw-plugin-top-wrapper';

  pluginWrapper.appendChild(topWrapper);
  root.append(accessButton, pluginWrapper);
  document.body.appendChild(root);

  return root;
};

export default function VLibrasWidget() {
  const { settings } = useUserSettings();
  const accessibility = settings.accessibility;
  const isEnabled = accessibility.librasEnabled && accessibility.librasProvider === 'vlibras';
  const position = POSITION_MAP[accessibility.librasPosition] || POSITION_MAP.right;
  const avatar = accessibility.librasAvatar || 'icaro';

  useEffect(() => {
    let isCancelled = false;

    removeWidgetRoot();

    if (!isEnabled) return undefined;

    const root = createWidgetRoot();

    loadVLibrasScript()
      .then(() => {
        if (isCancelled || !window.VLibras?.Widget) return;

        try {
          new window.VLibras.Widget({
            rootPath: VLibras_APP_URL,
            position,
            avatar,
            opacity: 1,
          });
          runVLibrasOnLoad();
        } catch (error) {
          console.error('Erro ao inicializar VLibras com configuracao personalizada:', error);
          new window.VLibras.Widget(VLibras_APP_URL);
          runVLibrasOnLoad();
        }

        root.dataset.ready = 'true';
      })
      .catch((error) => {
        console.error('Erro ao carregar o widget VLibras:', error);
        removeWidgetRoot();
      });

    return () => {
      isCancelled = true;
      removeWidgetRoot();
    };
  }, [avatar, isEnabled, position]);

  return null;
}
