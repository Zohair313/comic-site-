import React, { useRef, useState } from 'react';
import { isApiConfigured, resolveSrc, uploadAdminImage } from '@/lib/api';
import { shrinkImageFile } from '@/lib/imageUpload';
import { centsToDollars, dollarsToCents } from '@/lib/characters';

const inputClass =
  "w-full border-2 border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white outline-none transition focus:border-[#ED3833] focus:ring-2 focus:ring-[#ED3833]/20";

export function Field({ label, value, onChange, type = 'text', hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {hint && <span className="block mt-1 text-[11px] text-zinc-400 italic">{hint}</span>}
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y`} />
      {hint && <span className="block mt-1 text-[11px] text-zinc-400 italic">{hint}</span>}
    </label>
  );
}

export function ImageField({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const fileRef = useRef(null);
  const src = resolveSrc(value);
  const inline = String(value || '').startsWith('data:');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setError('');
    setNote('');
    try {
      if (isApiConfigured) {
        const res = await uploadAdminImage(file);
        onChange(res.url);
        setNote(`Uploaded — ${Math.max(1, Math.round((res.size || 0) / 1024))} KB on the server.`);
      } else {
        const { dataUrl, bytes } = await shrinkImageFile(file);
        onChange(dataUrl);
        setNote(`Stored in this browser — ${Math.max(1, Math.round(bytes / 1024))} KB. Only a few images fit before storage fills up.`);
      }
    } catch (err) {
      setError(err?.message || 'That upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">{label}</span>
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 border-2 border-zinc-200 flex-none flex items-center justify-center">
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            <i className="fa-solid fa-image text-zinc-300 text-lg"></i>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={inline ? '(stored in this browser)' : value ?? ''}
            readOnly={inline}
            onChange={(e) => onChange(e.target.value)}
            placeholder="images/cover.jpg or https://…"
            className={`${inputClass} ${inline ? 'opacity-60' : ''}`}
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold hover:bg-[#c92825] transition-colors disabled:opacity-60"
            >
              <i className={`fa-solid ${busy ? 'fa-circle-notch fa-spin' : 'fa-upload'}`}></i>
              {busy ? 'Uploading…' : 'Choose from PC'}
            </button>
            {value && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-60"
              >
                <i className="fa-solid fa-xmark"></i> Clear
              </button>
            )}
          </div>
          {hint && <span className="block mt-1.5 text-[11px] text-zinc-400 italic">{hint}</span>}
          {note && <span className="block mt-1 text-[11px] font-bold text-emerald-600">{note}</span>}
          {error && <span className="block mt-1.5 text-[11px] font-bold text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}

export function PriceField({ label, cents, onChange, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-1.5">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={centsToDollars(cents)}
          onChange={(e) => onChange(dollarsToCents(e.target.value))}
          placeholder="0.00"
          className={`${inputClass} pl-7`}
        />
      </div>
      {hint && <span className="block mt-1 text-[11px] text-zinc-400 italic">{hint}</span>}
    </label>
  );
}

export function SectionCard({ icon, title, children, desc, right }) {
  return (
    <div className="bg-white rounded-xl border-2 border-stone-800 shadow-[5px_5px_0_rgba(74,59,50,0.25)] overflow-hidden">
      <div className="px-5 py-4 bg-[#4A3B32] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#ED3833] text-white flex items-center justify-center">
            <i className={`fa-solid ${icon}`}></i>
          </span>
          <div>
            <h2 className="display-font text-white text-xl leading-none">{title}</h2>
            {desc && <p className="text-xs text-white/60 mt-0.5">{desc}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export function ArrayEditor({ label, items, onChange, placeholder = 'Type an item', hint, type = 'text' }) {
  const update = (idx, val) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, '']);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600">{label}</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold hover:bg-[#c92825] transition-colors"
        >
          <i className="fa-solid fa-plus"></i> Add
        </button>
      </div>
      {hint && <p className="text-[11px] text-zinc-400 italic mb-2">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, idx) =>
          type === 'image' ? (
            <div key={idx} className="flex items-start gap-2">
              <span className="w-6 h-6 mt-6 rounded-full bg-zinc-100 text-zinc-500 text-xs font-extrabold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <ImageField
                  label={`Item ${idx + 1}`}
                  value={item}
                  onChange={(val) => update(idx, val)}
                  hint={placeholder}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove item ${idx + 1}`}
                className="w-8 h-8 mt-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shrink-0"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          ) : (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-xs font-extrabold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input value={item} onChange={(e) => update(idx, e.target.value)} placeholder={placeholder} className={inputClass} />
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove item ${idx + 1}`}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shrink-0"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          )
        )}
        {items.length === 0 && (
          <p className="text-sm text-zinc-400 italic">No items yet — click Add.</p>
        )}
      </div>
    </div>
  );
}

export function ObjectListEditor({ label, items, onChange, fields, hint, addLabel = 'Add Item', newItem }) {
  const updateField = (idx, key, val) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: val } : item));
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { ...newItem }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600">{label}</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold hover:bg-[#c92825] transition-colors"
        >
          <i className="fa-solid fa-plus"></i> {addLabel}
        </button>
      </div>
      {hint && <p className="text-[11px] text-zinc-400 italic mb-2">{hint}</p>}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="border-2 border-zinc-100 rounded-xl p-3 bg-zinc-50/60">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                <i className="fa-solid fa-layer-group text-[#ED3833]"></i> #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove item ${idx + 1}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-trash"></i> Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className={f.full || f.type === 'image' ? 'sm:col-span-2' : ''}>
                  {f.type === 'image' ? (
                    <ImageField
                      label={f.label}
                      value={item[f.key]}
                      onChange={(val) => updateField(idx, f.key, val)}
                      hint={f.hint}
                    />
                  ) : f.type === 'price' ? (
                    <PriceField
                      label={f.label}
                      cents={item[f.key]}
                      onChange={(cents) => updateField(idx, f.key, cents)}
                      hint={f.hint}
                    />
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer mt-2 mb-2">
                      <input
                        type="checkbox"
                        checked={!!item[f.key]}
                        onChange={(e) => updateField(idx, f.key, e.target.checked)}
                        className="w-4 h-4 text-[#ED3833] focus:ring-[#ED3833] border-gray-300 rounded"
                      />
                      <span className="text-sm text-zinc-700 font-bold">{f.label}</span>
                    </label>
                  ) : (
                    <Field
                      label={f.label}
                      value={item[f.key]}
                      onChange={(val) => updateField(idx, f.key, val)}
                      type={f.type}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-zinc-400 italic">No items yet — click Add.</p>
        )}
      </div>
    </div>
  );
}

export function SaveBar({ onReset, onSave, savedAt, saving, saveError, unsaved, storageError = '' }) {
  const statusText = saving
    ? 'Saving…'
    : saveError
      ? 'Save failed — try again'
      : savedAt
        ? `Saved ${savedAt}`
        : unsaved
          ? 'You have unsaved changes'
          : 'All up to date';

  return (
    <div className="sticky bottom-4 mt-6 rounded-xl border-2 border-stone-800 bg-[#4A3B32] px-4 py-3 flex items-center justify-between gap-3 shadow-[5px_5px_0_rgba(0,0,0,0.35)] flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-0 ${saveError || storageError ? 'text-red-400' : 'text-white'}`}>
          <i className={`fa-solid ${saving ? 'fa-circle-notch fa-spin' : saveError || storageError ? 'fa-circle-xmark' : 'fa-circle-check'} ${saveError || storageError ? '' : 'text-[#ED3833]'}`}></i>
          {storageError ? 'Save failed — storage full' : statusText}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ED3833] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#c92825] transition-colors disabled:opacity-60"
        >
          <i className={`fa-solid ${saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'}`}></i> Save Changes
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/90 text-white text-xs font-extrabold hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Defaults
        </button>
      </div>
    </div>
  );
}