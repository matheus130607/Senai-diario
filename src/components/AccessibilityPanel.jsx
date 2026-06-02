import {
  Contrast,
  Eye,
  Palette,
  RotateCcw,
  ZapOff,
} from 'lucide-react';
import { Button, SectionHeader } from './ui/DesignSystem';
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

  return (
    <div className={compact ? 'accessibility-panel-compact' : 'p-6'}>
      {!compact && (
        <SectionHeader
          eyebrow="Acessibilidade"
          title="Preferencias de interface"
          description="Ajustes persistentes que alteram a experiencia visual do sistema em todas as telas."
          actions={(
            <Button onClick={resetAccessibility}>
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
          )}
        />
      )}

      <div className="accessibility-layout accessibility-layout-single">
        <section className="accessibility-card">
          <div className="accessibility-card-header">
            <Palette className="h-5 w-5 text-red-600" />
            <div>
              <h3>Aparencia</h3>
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
                <option value="blue">Azul didatico</option>
                <option value="green">Verde acessivel</option>
                <option value="mono">Monocromatico</option>
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
              <span className="ds-label">Espacamento</span>
              <select
                value={accessibility.spacing}
                onChange={(event) => updateAccessibility({ spacing: event.target.value })}
                className="ds-input"
              >
                <option value="compact">Compacto</option>
                <option value="comfortable">Confortavel</option>
                <option value="wide">Amplo</option>
              </select>
            </label>
          </div>

          <div className="accessibility-toggle-list">
            <ToggleRow
              icon={Contrast}
              label="Alto contraste"
              description="Reforca textos, bordas, superficies e estados interativos."
              checked={accessibility.highContrast}
              onChange={(value) => updateAccessibility({ highContrast: value })}
            />
            <ToggleRow
              icon={Eye}
              label="Foco visivel reforcado"
              description="Aumenta o destaque de navegacao por teclado em botoes, links e campos."
              checked={accessibility.focusMode}
              onChange={(value) => updateAccessibility({ focusMode: value })}
            />
            <ToggleRow
              icon={ZapOff}
              label="Reduzir movimento"
              description="Desativa transicoes e animacoes para uma navegacao mais estavel."
              checked={accessibility.reducedMotion}
              onChange={(value) => updateAccessibility({ reducedMotion: value })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
