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
    reviewOpen,
    setReviewOpen,
    inquiryTitle,
    pkg,
    setPkg,
    budget,
    setBudget,
    inquiryMsg,
    setInquiryMsg,
    onRegister,
    onInquiry,
    onReview,
  } = useStudio();

  return (
    <>
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)}>
        <h3 className="font-display text-3xl italic text-bone">Qeydiyyat</h3>
        <p className="mt-2 text-sm text-mist">
          Çat və sifariş üçün ad və e-poçt kifayətdir.
        </p>
        <form onSubmit={onRegister} className="mt-5 space-y-3">
          <input name="name" required placeholder="Adınız" className={inputClass} />
          <input
            name="email"
            type="email"
            required
            placeholder="E-poçt"
            className={inputClass}
          />
          <button type="submit" className={buttonClass}>
            Davam et
          </button>
        </form>
      </Modal>

      <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)}>
        <h3 className="font-display text-3xl italic text-bone">Sifariş</h3>
        <p className="mt-1 font-mono-tech text-xs uppercase tracking-[0.1em] text-mist">
          {inquiryTitle}
        </p>
        <form onSubmit={onInquiry} className="mt-5 space-y-3">
          <label className="block text-sm text-mist">
            Paket
            <select
              value={pkg}
              onChange={(e) => {
                setPkg(e.target.value);
                setBudget(`$${e.target.value}`);
              }}
              className={`mt-1 ${inputClass}`}
            >
              <option value="150">Qısa logo — $150</option>
              <option value="300">Standart — $300</option>
              <option value="600">Kampaniya — $600</option>
            </select>
          </label>
          <label className="block text-sm text-mist">
            Təklif etdiyiniz büdcə
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <textarea
            required
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
            placeholder="Nə lazımdır?"
            rows={4}
            className={inputClass}
          />
          <button type="submit" className={buttonClass}>
            Göndər
          </button>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <h3 className="font-display text-3xl italic text-bone">Rəy</h3>
        <form onSubmit={onReview} className="mt-5 space-y-3">
          <input name="name" required placeholder="Ad" className={inputClass} />
          <input name="company" placeholder="Şirkət (opsional)" className={inputClass} />
          <select name="rating" defaultValue="5" className={inputClass}>
            <option value="5">5 ulduz</option>
            <option value="4">4 ulduz</option>
            <option value="3">3 ulduz</option>
            <option value="2">2 ulduz</option>
            <option value="1">1 ulduz</option>
          </select>
          <textarea name="comment" required rows={3} className={inputClass} />
          <button type="submit" className={buttonClass}>
            Göndər
          </button>
        </form>
      </Modal>
    </>
  );
}
