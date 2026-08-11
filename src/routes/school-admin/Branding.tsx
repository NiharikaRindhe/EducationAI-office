import React, { useRef, useState } from 'react';
import { Loader2, AlertCircle, Check, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { api, ApiClientError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { schoolLogoUrl } from '../../lib/assets';

const ACCEPTED = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

export const SchoolAdminBranding: React.FC = () => {
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

    // Validate before upload so the admin gets an instant answer rather than
    // waiting on a round-trip to be told the file was never acceptable.
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
      // Re-fetch /auth/me so the sidebar repaints with the new logo immediately.
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
    <div className="flex flex-col gap-6 max-w-[720px]">
      <div>
        <h2 className="text-[15px] font-bold text-slate-800">School branding</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Your logo and name appear in the sidebar for every teacher and student at your school.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-lg px-4 py-3 flex items-center gap-2">
          <Check size={15} /> Logo updated — it is now live across your school.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-[13px] font-bold text-slate-800">School logo</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">PNG, JPG or WEBP · up to 2MB · square works best.</p>
        </div>

        <div className="px-5 py-5 flex items-center gap-5">
          <div className="w-24 h-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {shown ? (
              <img src={shown} alt="School logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={26} className="text-slate-300" />
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="text-[13px] font-semibold text-slate-800">
              {school?.name ?? 'Your school'}
            </div>
            <div className="text-[12px] text-slate-400">
              {pending
                ? `Ready to upload: ${pending.name}`
                : currentLogo
                  ? 'A logo is currently set.'
                  : 'No logo uploaded yet — the sidebar shows your school’s initial.'}
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                onChange={pick}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 border border-slate-200 px-3.5 py-2 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
              >
                <Upload size={14} /> Choose image
              </button>

              {pending && (
                <button
                  onClick={() => void save()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save logo
                </button>
              )}

              {!pending && currentLogo && (
                <button
                  onClick={() => void remove()}
                  disabled={isRemoving}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-rose-600 border border-rose-200 px-3.5 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
