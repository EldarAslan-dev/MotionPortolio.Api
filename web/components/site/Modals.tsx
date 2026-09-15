"use client";

import { useStudio } from "@/lib/site/StudioContext";

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md border border-line bg-surface p-6 text-bone shadow-2xl shadow-black/50">
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full border border-line bg-void px-3 py-2.5 text-sm text-bone placeholder:text-mist outline-none transition focus:border-cue";
const buttonClass =
  "w-full border border-bone/30 py-2.5 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue";

export function Modals() {
  const {
    registerOpen,
    setRegisterOpen,
    inquiryOpen,
    setInquiryOpen,
    inquiryTitle,
    pkg,
    setPkg,
    budget,
    setBudget,
    inquiryMsg,
    setInquiryMsg,
    onRegister,
    onInquiry,
  } = useStudio();

  return (
    <>
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        <h3 className="font-display text-3xl text-bone">Register</h3>
        <p className="mt-2 text-sm text-mist">Name and email. Enough for chat and orders.</p>
        <form onSubmit={onRegister} className="mt-5 space-y-3">
          <input name="name" required placeholder="Your name" className={inputClass} />
          <input name="email" type="email" required placeholder="Email" className={inputClass} />
          <button type="submit" className={buttonClass}>
            Continue
          </button>
        </form>
      </Modal>

      <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)}>
        <h3 className="font-display text-3xl text-bone">Brief</h3>
        <p className="mt-1 font-mono-tech text-xs uppercase tracking-[0.1em] text-mist">{inquiryTitle}</p>
        <form onSubmit={onInquiry} className="mt-5 space-y-3">
          <label className="block text-sm text-mist">
            Package
            <select
              value={pkg}
              onChange={(e) => {
                setPkg(e.target.value);
                setBudget(`$${e.target.value}`);
              }}
              className={`mt-1 ${inputClass}`}
            >
              <option value="150">Logo short — $150</option>
              <option value="300">Standard — $300</option>
              <option value="600">Campaign — $600</option>
            </select>
          </label>
          <label className="block text-sm text-mist">
            Your budget
            <input value={budget} onChange={(e) => setBudget(e.target.value)} className={`mt-1 ${inputClass}`} />
          </label>
          <textarea
            required
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
            placeholder="What do you need?"
            rows={4}
            className={inputClass}
          />
          <button type="submit" className={buttonClass}>
            Send
          </button>
        </form>
      </Modal>
    </>
  );
}
