import {
  Accessibility,
  CheckCircle2,
  Contrast,
  Eye,
  Languages,
  Moon,
  Palette,
  RotateCcw,
  Scaling,
  Sun,
  Type,
} from 'lucide-react';
import { Button, SectionHeader, StatusBadge } from './ui/DesignSystem';
import { useUserSettings } from '../contexts/UserSettingsContext';

function ToggleRow({ label, description, checked, onChange, icon: Icon }) {
  return (
    <label className="accessibility-toggle-row">
      <span className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <span className="min-w-0">
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function RangeControl({ label, value, min, max, step, onChange, ariaLabel }) {
  return (
    <label className="accessibility-control">
      <span className="ds-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-red-600"
        aria-label={ariaLabel}
      />
      <span className="accessibility-value">{Math.round(value * 100)}%</span>
    </label>
  );
}

export default function AccessibilityPanel({ compact = false }) {
  const { settings, updateAccessibility, resetAccessibility } = useUserSettings();
  const accessibility = settings.accessibility;
  const librasActive = accessibility.librasEnabled && accessibility.librasProvider === 'vlibras';

  const handleLibrasToggle = (enabled) => {
    updateAccessibility({
      librasEnabled: enabled,
      librasProvider: enabled ? 'vlibras' : 'disabled',
    });
  };

  return (
    <div className={compact ? 'accessibility-panel-compact' : 'p-6'}>
      {!compact && (
        <SectionHeader
          eyebrow="Acessibilidade"
          title="Preferências de interface"
          description="Ajustes persistentes que alteram a experiência real do sistema em todas as telas."
          actions={(
            <Button onClick={resetAccessibility}>
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
          )}
        />
      )}

      <div className="accessibility-layout">
        <section className="accessibility-card">
          <div className="accessibility-card-header">
            <Palette className="h-5 w-5 text-red-600" />
            <div>
              <h3>Aparência</h3>
              <p>Tema, cores, leitura e densidade visual.</p>
            </div>
          </div>

          <div className="accessibility-form-grid">
            <label>
              <span className="ds-label">Tema</span>
              <select
                value={accessibility.theme}
                onChange={(event) => updateAccessibility({ theme: event.target.value })}
                className="ds-input"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="system">Sistema</option>
              </select>
            </label>

            <label>
              <span className="ds-label">Cores</span>
              <select
                value={accessibility.colorScheme}
                onChange={(event) => updateAccessibility({ colorScheme: event.target.value })}
                className="ds-input"
              >
                <option value="senai">SENAI institucional</option>
                <option value="blue">Azul didático</option>
                <option value="green">Verde acessível</option>
                <option value="mono">Monocromático</option>
              </select>
            </label>

            <RangeControl
              label="Tamanho da fonte"
              min="0.9"
              max="1.25"
              step="0.05"
              value={accessibility.fontScale}
              onChange={(fontScale) => updateAccessibility({ fontScale })}
              ariaLabel="Ajustar tamanho da fonte"
            />

            <RangeControl
              label="Escala da interface"
              min="0.95"
              max="1.15"
              step="0.05"
              value={accessibility.interfaceScale}
              onChange={(interfaceScale) => updateAccessibility({ interfaceScale })}
              ariaLabel="Ajustar escala da interface"
            />

            <label>
              <span className="ds-label">Espaçamento</span>
              <select
                value={accessibility.spacing}
                onChange={(event) => updateAccessibility({ spacing: event.target.value })}
                className="ds-input"
              >
                <option value="compact">Compacto</option>
                <option value="comfortable">Confortável</option>
                <option value="wide">Amplo</option>
              </select>
            </label>
          </div>

          <div className="accessibility-toggle-list">
            <ToggleRow
              icon={Contrast}
              label="Alto contraste"
              description="Reforça textos, bordas, superfícies e estados interativos."
              checked={accessibility.highContrast}
              onChange={(value) => updateAccessibility({ highContrast: value })}
            />
            <ToggleRow
              icon={Eye}
              label="Foco visível reforçado"
              description="Aumenta o destaque de navegação por teclado em botões, links e campos."
              checked={accessibility.focusMode}
              onChange={(value) => updateAccessibility({ focusMode: value })}
            />
          </div>
        </section>

        <section className="accessibility-card">
          <div className="accessibility-card-header">
            <Languages className="h-5 w-5 text-red-600" />
            <div>
              <h3>Libras</h3>
              <p>Integração oficial VLibras para tradução por avatar.</p>
            </div>
          </div>

          <div className="accessibility-toggle-list">
            <ToggleRow
              icon={Accessibility}
              label="VLibras ativo"
              description="Exibe o botão oficial de tradução em Libras no sistema."
              checked={librasActive}
              onChange={handleLibrasToggle}
            />
          </div>

          <div className="accessibility-form-grid mt-5">
            <label>
              <span className="ds-label">Posição do botão</span>
              <select
                value={accessibility.librasPosition}
                onChange={(event) => updateAccessibility({ librasPosition: event.target.value })}
                className="ds-input"
                disabled={!librasActive}
              >
                <option value="right">Direita</option>
                <option value="left">Esquerda</option>
                <option value="top-right">Topo direito</option>
                <option value="top-left">Topo esquerdo</option>
                <option value="bottom-right">Base direita</option>
                <option value="bottom-left">Base esquerda</option>
              </select>
            </label>

            <label>
              <span className="ds-label">Avatar</span>
              <select
                value={accessibility.librasAvatar}
                onChange={(event) => updateAccessibility({ librasAvatar: event.target.value })}
                className="ds-input"
                disabled={!librasActive}
              >
                <option value="icaro">Ícaro</option>
                <option value="hosana">Hosana</option>
                <option value="guga">Guga</option>
                <option value="random">Aleatório</option>
              </select>
            </label>
          </div>

          <div className="accessibility-status-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-950">Estado atual</span>
              <StatusBadge tone={librasActive ? 'success' : 'warning'}>
                {librasActive ? 'VLibras ativo' : 'VLibras desativado'}
              </StatusBadge>
            </div>
            <div className="accessibility-preview">
              <div>
                <strong>Preferências aplicadas</strong>
                <small>Fonte, escala, espaçamento, contraste, foco e Libras são salvos por usuário.</small>
              </div>
              <div className="flex gap-2">
                {accessibility.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Type className="h-4 w-4" />
                <Scaling className="h-4 w-4" />
                {librasActive && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
