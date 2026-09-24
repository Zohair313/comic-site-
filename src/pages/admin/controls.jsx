import React from 'react';

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

export function ArrayEditor({ label, items, onChange, placeholder = 'Type an item', hint }) {
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
        {items.map((item, idx) => (
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
        ))}
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
                <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                  <Field
                    label={f.label}
                    value={item[f.key]}
                    onChange={(val) => updateField(idx, f.key, val)}
                    type={f.type}
                  />
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

export function SaveBar({ onReset, savedAt }) {
  return (
    <div className="sticky bottom-4 mt-6 rounded-xl border-2 border-stone-800 bg-[#4A3B32] px-4 py-3 flex items-center justify-between gap-3 shadow-[5px_5px_0_rgba(0,0,0,0.35)] flex-wrap">
      <p className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 mb-0">
        <i className="fa-solid fa-circle-check text-[#ED3833]"></i>
        {savedAt ? `Saved ${savedAt}` : 'Changes save instantly'}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-extrabold hover:bg-red-600 transition-colors"
      >
        <i className="fa-solid fa-rotate-left"></i> Reset to Defaults
      </button>
    </div>
  );
}