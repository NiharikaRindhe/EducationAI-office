import React, { useEffect, useState } from 'react';
import { Loader2, Printer, AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface PreviewAction {
  class_num: number;
  students_count: number;
  action: 'promote' | 'pass_out' | 'convert_credentials';
}

interface Class4Student {
  name: string;
  new_username: string;
  new_password?: string;
}

interface PreviewResponse {
  summary: PreviewAction[];
  class4_students?: Class4Student[];
}

interface ExecuteResponse {
  promoted: number;
  passed_out: number;
  converted: number;
  credentials: { name: string; username: string; password?: string }[];
}

export const SchoolAdminPromotion: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date();
  const isApril = today.getMonth() === 3; // 0-indexed: April = 3

  useEffect(() => {
    setLoading(true);
    api.get<PreviewResponse>('/school-admin/promotion/preview')
      .then(setPreview)
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch rollover preview'))
      .finally(() => setLoading(false));
  }, []);

  const handleNextStep = () => {
    if (step === 1) {
      // If class 4 students need credential conversion, go to step 2. Otherwise go to step 3.
      if (preview?.class4_students && preview.class4_students.length > 0) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMsg('');
    try {
      const res = await api.post<ExecuteResponse>('/school-admin/promotion/execute');
      setExecResult(res);
      // Automatically advance to completed view / credentials summary
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Rollover promotion failed');
    } finally {
      setExecuting(false);
    }
  };

  const handlePrintCredentials = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-rose-400" size={32} /></div>;
  }

  // If already executed, show complete screen
  if (execResult) {
    return (
      <div className="flex flex-col gap-6 font-sans select-none anim-fade-up text-left max-w-3xl mx-auto">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          }
        ` }} />

        <div className="bento-card border border-emerald-100 bg-emerald-50/20 p-6 flex flex-col items-center gap-4 text-center no-print">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl">✓</div>
          <div>
            <h2 className="font-display font-black text-xl text-slate-800">Academic Rollover Completed!</h2>
            <p className="text-xs text-slate-400 mt-1">All classes successfully promoted to the next grade.</p>
          </div>
          <div className="grid grid-cols-3 gap-6 bg-white border border-slate-100 p-4 px-6 rounded-2xl font-bold text-xs mt-2 w-full max-w-md">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Promoted</span>
              <span className="text-lg font-black text-slate-800">{execResult.promoted}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Passed Out</span>
              <span className="text-lg font-black text-slate-800">{execResult.passed_out}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">PIN Converted</span>
              <span className="text-lg font-black text-slate-800">{execResult.converted}</span>
            </div>
          </div>
        </div>

        {/* Credentials table */}
        {execResult.credentials && execResult.credentials.length > 0 && (
          <div className="print-card bento-card border border-slate-100 bg-white p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center no-print">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800">Class 5 Credentials Cards</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Students transitioning from Class 4 (PIN login) to Class 5 require passwords. Print this sheet now.</p>
              </div>
              <button
                onClick={handlePrintCredentials}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                Print Slips
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              {execResult.credentials.map((cred, idx) => (
                <div key={idx} className="border border-slate-200 bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 text-xs">
                  <span className="font-black text-slate-800 block truncate">{cred.name}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">New Username</span>
                  <span className="font-mono text-[10px] text-slate-600 select-all bg-white p-1.5 rounded-lg border border-slate-100 block truncate">{cred.username}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Temporary Password</span>
                  <span className="font-mono text-[10px] text-slate-600 select-all bg-white p-1.5 rounded-lg border border-slate-100 block truncate">{cred.password || '••••••••'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up text-left max-w-3xl mx-auto">
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-800">Academic Year Rollover Wizard</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Increment all classes by +1 level, deactivating passed out Class 10 students.</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 flex gap-2.5 text-xs font-bold">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Rollover calendar reminder */}
      {!isApril && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-bold">Roll-over Warning</span>
            <p className="text-amber-700 mt-0.5">
              Rollover is typically performed only at the start of the Indian school academic year in **April**. Doing it now will immediately promote all current rosters.
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: PREVIEW SUMMARY */}
      {step === 1 && preview && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-display font-bold text-sm text-slate-800">Promotion dry-run preview</span>
            <span className="badge pill-rose text-[9px] font-black uppercase">Dry Run</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-2">Current Class</th>
                  <th className="pb-2">Roster Count</th>
                  <th className="pb-2">Transition Action</th>
                </tr>
              </thead>
              <tbody className="font-semibold">
                {preview.summary.map(act => (
                  <tr key={act.class_num} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5">Class {act.class_num}</td>
                    <td className="py-2.5 text-slate-500">{act.students_count} students</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase ${
                        act.action === 'promote' ? 'bg-indigo-50 text-indigo-700' :
                        act.action === 'pass_out' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full py-3.5 mt-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-sans font-bold text-xs shadow-md shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Proceed to Rollover Verification <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* STEP 2: CREDENTIALS PREVIEW */}
      {step === 2 && preview?.class4_students && (
        <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800">Verify Class 4 Credential Converts</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Students transitioning from Class 4 (PIN login) to Class 5 require passwords. Below are the students scheduled for credential upgrades.</p>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50 flex flex-col gap-2">
            {preview.class4_students.map((stud, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>{stud.name}</span>
                <span className="font-mono text-[10px] text-slate-400">Upgrade &rarr; {stud.new_username}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-3.5 mt-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-sans font-bold text-xs shadow-md shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Proceed to Final Confirmation <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* STEP 3: FINAL CONFIRM */}
      {step === 3 && (
        <div className="bento-card border border-red-200 bg-red-50/10 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-black">!</div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800">DANGER AREA: IRREVERSIBLE ROLLOVER</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Executing rollover promotes all class rosters permanently. Ensure backup or end of terms are finished.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Cancel &amp; Go Back
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/10"
            >
              {executing ? <Loader2 className="animate-spin" size={14} /> : 'Commit Rollover Promotion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
