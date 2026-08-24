import React, { useRef, useState } from 'react';
import { Loader2, AlertCircle, Check, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { schoolLogoUrl } from '../../lib/assets';

const ACCEPTED = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * School logo upload, extracted from the old standalone Branding page
 * (item #67 — "remove [Add to Profile/Setting]"). Lives inside
 * AccountSettings now instead of its own nav item; the upload/remove
 * endpoints and behaviour are unchanged from what School Admin had before.
 */
export const SchoolBrandingCard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const school = user?.school ?? null;

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const currentLogo = school?.logoPath ? schoolLogoUrl(school.logoPath) : null;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSaved(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.split(',').includes(file.type)) {
      setError('Logo must be a PNG, JPG or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Logo must be 2MB or smaller.');
      return;
    }
    setPending(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!pending) return;
    setIsSaving(true);
    setError('');
    try {
      await api.upload('/school-admin/logo', pending);
      await refreshUser();
      setPending(null);
      setPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to upload logo');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsRemoving(true);
    setError('');
    try {
      await api.delete('/school-admin/logo');
      await refreshUser();
      setPending(null);
      setPreview(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to remove logo');
    } finally {
      setIsRemoving(false);
    }
  };

  const shown = preview ?? currentLogo;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h2 className="font-display font-bold text-lg text-slate-800 mb-1 flex items-center gap-2">
        <ImageIcon size={18} className="text-slate-400" /> School branding
      </h2>
      <p className="text-[12px] text-slate-400 mb-4">
        Your logo appears in the sidebar for every teacher and student at your school.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] text-rose-700 mb-3">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] text-emerald-800 mb-3">
          <Check size={14} className="shrink-0" /> Logo updated — it is now live across your school.
        </div>
      )}

      <div className="flex items-center gap-5">
        <div className="w-20 h-20 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
          {shown ? (
            <img src={shown} alt="School logo" className="w-full h-full object-contain" />
          ) : (
            <ImageIcon size={24} className="text-slate-300" />
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="text-[12px] text-slate-400">
            {pending
              ? `Ready to upload: ${pending.name}`
              : currentLogo
                ? 'A logo is currently set.'
                : 'No logo uploaded yet — the sidebar shows your school’s initial.'}
          </div>

          <div className="flex items-center gap-2.5">
            <input ref={fileRef} type="file" accept={ACCEPTED} onChange={pick} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
            >
              <Upload size={13} /> Choose image
            </button>

            {pending && (
              <button
                onClick={() => void save()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save logo
              </button>
            )}

            {!pending && currentLogo && (
              <button
                onClick={() => void remove()}
                disabled={isRemoving}
                className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
