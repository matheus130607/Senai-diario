import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  FileUp,
  ImagePlus,
  Loader2,
  Paperclip,
  X,
} from 'lucide-react';
import { uploadEmailAsset } from '../../services/storageService';

const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia', 'Times New Roman'];
const SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '24px'];

const emptyHtml = '<p></p>';

export default function RichEmailEditor({
  valueHtml = '',
  attachments = [],
  onChangeHtml,
  onChangeAttachments,
  uploadContextId = 'draft',
  toolbarPlacement = 'top',
  footerAction = null,
}) {
  const imageInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [uploading, setUploading] = useState('');
  const [uploadError, setUploadError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        HTMLAttributes: { class: 'rich-email-image' },
      }),
    ],
    content: valueHtml || emptyHtml,
    editorProps: {
      attributes: {
        class: 'rich-email-content',
      },
    },
    onUpdate({ editor: activeEditor }) {
      onChangeHtml?.(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const nextHtml = valueHtml || emptyHtml;
    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  }, [editor, valueHtml]);

  const withUpload = async (file, kind) => {
    setUploadError('');
    setUploading(kind);
    try {
      return await uploadEmailAsset(file, uploadContextId, kind);
    } catch (error) {
      setUploadError(error.message || 'Nao foi possivel enviar o arquivo.');
      return null;
    } finally {
      setUploading('');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;

    const uploaded = await withUpload(file, 'images');
    if (!uploaded?.publicUrl) return;

    editor.chain().focus().setImage({
      src: uploaded.publicUrl,
      alt: uploaded.name,
      title: uploaded.name,
    }).run();
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const uploaded = await withUpload(file, 'attachments');
    if (!uploaded) return;

    onChangeAttachments?.([...(attachments || []), uploaded]);
  };

  const removeAttachment = (path) => {
    onChangeAttachments?.((attachments || []).filter((item) => item.path !== path));
  };

  const setFontFamily = (event) => {
    const value = event.target.value;
    if (!value) {
      editor?.chain().focus().unsetFontFamily().run();
      return;
    }
    editor?.chain().focus().setFontFamily(value).run();
  };

  const setFontSize = (event) => {
    const value = event.target.value;
    if (!value) {
      editor?.chain().focus().unsetFontSize().run();
      return;
    }
    editor?.chain().focus().setFontSize(value).run();
  };

  const toolbar = (
    <div className="rich-email-toolbar" role="toolbar" aria-label="Formatacao do comunicado">
      <button
        type="button"
        className={editor?.isActive('bold') ? 'is-active' : ''}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        aria-label="Negrito"
      >
        <Bold className="h-4 w-4" />
      </button>
      {[
        ['left', AlignLeft, 'Alinhar a esquerda'],
        ['center', AlignCenter, 'Centralizar'],
        ['right', AlignRight, 'Alinhar a direita'],
        ['justify', AlignJustify, 'Justificar'],
      ].map(([align, Icon, label]) => (
        <button
          key={align}
          type="button"
          className={editor?.isActive({ textAlign: align }) ? 'is-active' : ''}
          onClick={() => editor?.chain().focus().setTextAlign(align).run()}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <select className="rich-email-select" onChange={setFontFamily} defaultValue="">
        <option value="">Fonte</option>
        {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
      </select>
      <select className="rich-email-select" onChange={setFontSize} defaultValue="">
        <option value="">Tamanho</option>
        {SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
      <button type="button" onClick={() => imageInputRef.current?.click()} aria-label="Inserir imagem">
        {uploading === 'images' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </button>
      <button type="button" onClick={() => attachmentInputRef.current?.click()} aria-label="Anexar arquivo">
        {uploading === 'attachments' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className={`rich-email-editor rich-email-editor-${toolbarPlacement}`}>
      {toolbarPlacement !== 'bottom' && toolbar}

      <EditorContent editor={editor} />

      <input ref={imageInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
      <input ref={attachmentInputRef} type="file" className="sr-only" onChange={handleAttachmentUpload} />

      {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}

      {(attachments || []).length > 0 && (
        <div className="rich-email-attachments">
          {(attachments || []).map((attachment) => (
            <div key={attachment.path || attachment.publicUrl || attachment.name} className="rich-email-attachment">
              <Paperclip className="h-4 w-4 text-slate-400" />
              <a href={attachment.publicUrl} target="_blank" rel="noreferrer">{attachment.name}</a>
              <button type="button" onClick={() => removeAttachment(attachment.path)} aria-label={`Remover ${attachment.name}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {toolbarPlacement === 'bottom' && (
        <div className="rich-email-footer-toolbar">
          {footerAction && <div className="rich-email-footer-action">{footerAction}</div>}
          {toolbar}
        </div>
      )}
    </div>
  );
}
