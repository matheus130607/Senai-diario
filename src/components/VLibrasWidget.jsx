import { useEffect } from 'react';
import { useUserSettings } from '../contexts/UserSettingsContext';

const SCRIPT_ID = 'senai-vlibras-plugin';
const WIDGET_ID = 'senai-vlibras-widget';
const VLibras_APP_URL = 'https://vlibras.gov.br/app';
const VIEWPORT_MARGIN = 12;

const POSITION_MAP = {
  left: 'L',
  right: 'R',
  'top-left': 'TL',
  'top-right': 'TR',
  'bottom-left': 'BL',
  'bottom-right': 'BR',
  custom: 'R',
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
  root.dataset.vlibrasPosition = 'right';
  root.setAttribute('vw', '');

  const accessButton = document.createElement('div');
  accessButton.className = 'active';
  accessButton.setAttribute('vw-access-button', '');
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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clampPosition = (position, root) => {
  const bounds = root.getBoundingClientRect();
  const width = bounds.width || 64;
  const height = bounds.height || 64;
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

  return {
    x: clamp(position.x, VIEWPORT_MARGIN, maxX),
    y: clamp(position.y, VIEWPORT_MARGIN, maxY),
  };
};

const applyCustomPosition = (root, customPosition) => {
  if (!customPosition) {
    root.dataset.customPosition = 'false';
    root.style.removeProperty('left');
    root.style.removeProperty('top');
    root.style.removeProperty('right');
    root.style.removeProperty('bottom');
    return null;
  }

  const nextPosition = clampPosition(customPosition, root);
  root.dataset.customPosition = 'true';
  root.style.left = `${nextPosition.x}px`;
  root.style.top = `${nextPosition.y}px`;
  root.style.right = 'auto';
  root.style.bottom = 'auto';
  return nextPosition;
};

const makeWidgetDraggable = (root, updateAccessibility) => {
  const handle = root.querySelector('[vw-access-button]') || root;
  let dragState = null;
  let lastPosition = null;
  let suppressNextClick = false;

  const handleClickCapture = (event) => {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePointerMove = (event) => {
    if (!dragState) return;
    event.preventDefault();

    const nextPosition = clampPosition({
      x: event.clientX - dragState.offsetX,
      y: event.clientY - dragState.offsetY,
    }, root);

    if (Math.abs(nextPosition.x - dragState.startX) > 3 || Math.abs(nextPosition.y - dragState.startY) > 3) {
      dragState.didMove = true;
    }

    lastPosition = applyCustomPosition(root, nextPosition);
  };

  const handlePointerUp = (event) => {
    if (!dragState) return;
    handle.releasePointerCapture?.(event.pointerId);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    root.dataset.dragging = 'false';

    if (dragState.didMove && lastPosition) {
      suppressNextClick = true;
      updateAccessibility({
        librasPosition: 'custom',
        librasCustomPosition: lastPosition,
      });
    }

    dragState = null;
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = root.getBoundingClientRect();

    dragState = {
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: bounds.left,
      startY: bounds.top,
      didMove: false,
    };
    lastPosition = { x: bounds.left, y: bounds.top };
    root.dataset.dragging = 'true';
    handle.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
  };

  handle.addEventListener('pointerdown', handlePointerDown);
  handle.addEventListener('click', handleClickCapture, true);

  return () => {
    handle.removeEventListener('pointerdown', handlePointerDown);
    handle.removeEventListener('click', handleClickCapture, true);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };
};

export default function VLibrasWidget() {
  const { settings, updateAccessibility } = useUserSettings();
  const accessibility = settings.accessibility;
  const isEnabled = accessibility.librasEnabled && accessibility.librasProvider === 'vlibras';
  const positionName = accessibility.librasPosition || 'right';
  const customPosition = accessibility.librasPosition === 'custom'
    ? accessibility.librasCustomPosition
    : null;
  const position = POSITION_MAP[accessibility.librasPosition] || POSITION_MAP.right;
  const avatar = accessibility.librasAvatar || 'icaro';

  useEffect(() => {
    let isCancelled = false;
    let cleanupDrag = () => {};

    removeWidgetRoot();

    if (!isEnabled) return undefined;

    const root = createWidgetRoot();
    root.dataset.vlibrasPosition = positionName;
    applyCustomPosition(root, customPosition);
    cleanupDrag = makeWidgetDraggable(root, updateAccessibility);

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

        applyCustomPosition(root, customPosition);
        root.dataset.vlibrasPosition = positionName;
        root.dataset.ready = 'true';
      })
      .catch((error) => {
        console.error('Erro ao carregar o widget VLibras:', error);
        removeWidgetRoot();
      });

    return () => {
      isCancelled = true;
      cleanupDrag();
      removeWidgetRoot();
    };
  }, [avatar, customPosition, isEnabled, position, positionName, updateAccessibility]);

  return null;
}
