const SCRIPT_ID = 'senai-vlibras-plugin';
export const VLibras_APP_URL = 'https://vlibras.gov.br/app';
export const VLibras_WIDGET_ID = 'senai-vlibras-widget';

let scriptLoadPromise = null;
let capturedWindowOnload = null;
let hasCapturedWindowOnload = false;

const getWidgetRoots = () => Array.from(document.querySelectorAll('[vw]'));

const getOriginalWindowOnload = () => {
  if (!hasCapturedWindowOnload) {
    capturedWindowOnload = window.onload;
    hasCapturedWindowOnload = true;
  }
  return capturedWindowOnload;
};

export const getVLibrasRoot = () => document.getElementById(VLibras_WIDGET_ID);

export const destroyVLibrasRoot = () => {
  getWidgetRoots().forEach((root) => root.remove());
  window.plugin = undefined;
  if (hasCapturedWindowOnload && window.onload !== capturedWindowOnload) {
    window.onload = capturedWindowOnload;
  }
};

const createVLibrasRoot = () => {
  destroyVLibrasRoot();

  const root = document.createElement('div');
  root.id = VLibras_WIDGET_ID;
  root.className = 'enabled senai-vlibras-widget';
  root.dataset.ready = 'false';
  root.setAttribute('vw', '');

  const accessButton = document.createElement('div');
  accessButton.className = 'active';
  accessButton.setAttribute('vw-access-button', '');
  accessButton.setAttribute('aria-label', 'Abrir tradutor VLibras');
  accessButton.title = 'VLibras';

  const pluginWrapper = document.createElement('div');
  pluginWrapper.setAttribute('vw-plugin-wrapper', '');

  const topWrapper = document.createElement('div');
  topWrapper.className = 'vw-plugin-top-wrapper';

  pluginWrapper.appendChild(topWrapper);
  root.append(accessButton, pluginWrapper);
  document.body.appendChild(root);

  return root;
};

export const loadVLibrasScript = () => {
  if (window.VLibras?.Widget) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', (error) => {
        scriptLoadPromise = null;
        reject(error);
      }, { once: true });
    });
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${VLibras_APP_URL}/vlibras-plugin.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = (error) => {
      scriptLoadPromise = null;
      reject(error);
    };
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
};

export const initializeVLibras = async () => {
  const root = createVLibrasRoot();

  await loadVLibrasScript();
  if (!root.isConnected) return root;

  if (!window.VLibras?.Widget) {
    throw new Error('VLibras.Widget indisponivel apos carregamento do script.');
  }

  const originalWindowOnload = getOriginalWindowOnload();
  window.onload = originalWindowOnload;
  window.plugin = undefined;

  new window.VLibras.Widget({
    rootPath: VLibras_APP_URL,
    position: 'BR',
    opacity: 1,
  });

  const vlibrasWindowOnload = window.onload;
  const finishLoad = (event) => {
    if (typeof vlibrasWindowOnload === 'function') {
      vlibrasWindowOnload.call(window, event);
    }
    window.onload = originalWindowOnload;
    requestAnimationFrame(() => {
      if (root.isConnected) root.dataset.ready = 'true';
    });
  };

  if (document.readyState === 'complete') {
    finishLoad(new Event('load'));
  } else {
    window.onload = finishLoad;
  }

  return root;
};
