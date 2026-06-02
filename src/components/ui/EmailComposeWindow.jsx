import { Maximize2, Minimize2, Minus, Send, X } from 'lucide-react';
import { Button } from './DesignSystem';
import RichEmailEditor from './RichEmailEditor';
import { PERIODICITY_OPTIONS, TEMPLATE_OPTIONS } from '../../services/emailAutomationService';

export default function EmailComposeWindow({
  mode = 'create',
  form,
  isMinimized = false,
  isMaximized = false,
  onChangeForm,
  onSubmit,
  onClose,
  onMinimize,
  onMaximize,
  uploadContextId = 'draft',
}) {
  const title = mode === 'edit' ? 'Editar comunicado' : 'Nova mensagem';
  const primaryLabel = mode === 'edit' ? 'Salvar comunicado' : 'Enviar';

  const updateField = (field, value) => {
    onChangeForm?.({ ...form, [field]: value });
  };

  return (
    <section
      className={`email-compose-window ${isMinimized ? 'is-minimized' : ''} ${isMaximized ? 'is-maximized' : ''}`}
      aria-label={title}
    >
      <div className="email-compose-header">
        <h3>{title}</h3>
        <div className="email-compose-controls">
          <button type="button" onClick={onMinimize} aria-label={isMinimized ? 'Restaurar mensagem' : 'Minimizar mensagem'}>
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={onMaximize} aria-label={isMaximized ? 'Restaurar tamanho' : 'Expandir mensagem'}>
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar mensagem">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={onSubmit} className="email-compose-form">
          <div className="email-compose-fields">
            <label className="email-compose-line">
              <span>Nome</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Identificação interna do comunicado"
                required
              />
            </label>
            <label className="email-compose-line">
              <span>Destinatários</span>
              <input
                value={form.recipients}
                onChange={(event) => updateField('recipients', event.target.value)}
                placeholder="Empresas, coordenação ou secretaria"
              />
            </label>
            <label className="email-compose-line">
              <span>Assunto</span>
              <input
                value={form.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                placeholder="Assunto do e-mail"
                required
              />
            </label>
            <label className="email-compose-line">
              <span>Resumo</span>
              <input
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Resumo exibido na listagem"
                required
              />
            </label>
          </div>

          <div className="email-compose-options">
            <label>
              <span>Periodicidade</span>
              <select value={form.periodicity} onChange={(event) => updateField('periodicity', event.target.value)}>
                {PERIODICITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Template</span>
              <select value={form.template} onChange={(event) => updateField('template', event.target.value)}>
                {TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Retry</span>
              <input
                type="number"
                min="1"
                max="10"
                value={form.retryLimit}
                onChange={(event) => updateField('retryLimit', event.target.value)}
              />
            </label>
          </div>

          <RichEmailEditor
            valueHtml={form.bodyHtml}
            attachments={form.attachments}
            uploadContextId={uploadContextId}
            toolbarPlacement="bottom"
            footerAction={(
              <Button type="submit" variant="primary" className="email-compose-submit">
                <Send className="h-4 w-4" />
                {primaryLabel}
              </Button>
            )}
            onChangeHtml={(bodyHtml) => updateField('bodyHtml', bodyHtml)}
            onChangeAttachments={(attachments) => updateField('attachments', attachments)}
          />
        </form>
      )}
    </section>
  );
}
