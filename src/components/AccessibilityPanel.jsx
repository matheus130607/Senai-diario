import {
  Accessibility,
  Contrast,
  Eye,
  Keyboard,
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

export default function AccessibilityPanel({ compact = false }) {
  const { settings, updateAccessibility, resetAccessibility } = useUserSettings();
  const accessibility = settings.accessibility;

  return (
    <div className={compact ? '' : 'p-6'}>
      {!compact && (
        <SectionHeader
          eyebrow="Acessibilidade e personalização"
          title="Preferências de interface"
          description="Configurações persistentes para tema, contraste, fonte, espaçamento, navegação e integrações assistivas."
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
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Aparência</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <label>
              <span className="ds-label">Tamanho da fonte</span>
              <input
                type="range"
                min="0.9"
                max="1.25"
                step="0.05"
                value={accessibility.fontScale}
                onChange={(event) => updateAccessibility({ fontScale: Number(event.target.value) })}
                className="w-full accent-red-600"
                aria-label="Ajustar tamanho da fonte"
              />
              <span className="text-xs text-slate-500">{Math.round(accessibility.fontScale * 100)}%</span>
            </label>

            <label>
              <span className="ds-label">Escala da interface</span>
              <input
                type="range"
                min="0.95"
                max="1.15"
                step="0.05"
                value={accessibility.interfaceScale}
                onChange={(event) => updateAccessibility({ interfaceScale: Number(event.target.value) })}
                className="w-full accent-red-600"
                aria-label="Ajustar escala da interface"
              />
              <span className="text-xs text-slate-500">{Math.round(accessibility.interfaceScale * 100)}%</span>
            </label>

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

          <div className="mt-5 space-y-3">
            <ToggleRow
              icon={Contrast}
              label="Alto contraste"
              description="Aumenta contraste de textos, bordas e elementos interativos."
              checked={accessibility.highContrast}
              onChange={(value) => updateAccessibility({ highContrast: value })}
            />
            <ToggleRow
              icon={Eye}
              label="Foco visível reforçado"
              description="Destaca navegação por teclado em todos os controles."
              checked={accessibility.focusMode}
              onChange={(value) => updateAccessibility({ focusMode: value })}
            />
          </div>
        </section>

        <section className="accessibility-card">
          <div className="mb-5 flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-semibold text-slate-950">Recursos assistivos</h3>
          </div>

          <div className="space-y-3">
            <ToggleRow
              icon={Keyboard}
              label="Atalhos e navegação por teclado"
              description="Mantém controles compatíveis com Tab, Enter e Escape."
              checked={accessibility.keyboardShortcuts}
              onChange={(value) => updateAccessibility({ keyboardShortcuts: value })}
            />
            <ToggleRow
              icon={Type}
              label="Dicas para leitores de tela"
              description="Preserva labels, regiões nomeadas e mensagens descritivas."
              checked={accessibility.screenReaderHints}
              onChange={(value) => updateAccessibility({ screenReaderHints: value })}
            />
          </div>

          <div className="mt-5">
            <label>
              <span className="ds-label">Integração com Libras</span>
              <select
                value={accessibility.librasProvider}
                onChange={(event) => updateAccessibility({ librasProvider: event.target.value })}
                className="ds-input"
              >
                <option value="ready">Preparado para API externa</option>
                <option value="vlibras">VLibras ou equivalente</option>
                <option value="custom">Endpoint personalizado</option>
                <option value="disabled">Desativado</option>
              </select>
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              A camada está preparada para acoplar uma API externa de tradução em Libras sem alterar as telas principais.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-950">Prévia</span>
              <StatusBadge tone={accessibility.highContrast ? 'warning' : 'success'}>
                {accessibility.highContrast ? 'Alto contraste' : 'Padrão'}
              </StatusBadge>
            </div>
            <div className="accessibility-preview">
              <div>
                <strong>Chamada acessível</strong>
                <small>Labels, foco visível e estados legíveis.</small>
              </div>
              <div className="flex gap-2">
                {accessibility.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Scaling className="h-4 w-4" />
                <Languages className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

