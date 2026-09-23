"use client";

import { motion } from "framer-motion";
import { Modal } from "@/components/ui/dialog";
import { useStudio } from "@/lib/site/StudioContext";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

const inputClass =
  "w-full rounded-xl border border-line bg-void/70 px-3 py-2.5 text-sm text-bone placeholder:text-mist outline-none transition focus:border-cue";
const buttonClass =
  "w-full rounded-full border border-bone/30 py-2.5 font-mono-tech text-xs uppercase tracking-[0.15em] text-bone transition hover:border-cue hover:text-cue";

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
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register">
        <h3 className="font-display text-3xl text-bone">Register</h3>
        <p className="mt-2 text-sm text-mist">Name and email. Enough for chat and orders.</p>
        <form onSubmit={onRegister} className="mt-5 space-y-3">
          <input name="name" required placeholder="Your name" className={inputClass} />
          <input name="email" type="email" required placeholder="Email" className={inputClass} />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            className={buttonClass}
          >
            Continue
          </motion.button>
        </form>
      </Modal>

      <Modal open={inquiryOpen} onClose={() => setInquiryOpen(false)} title="Brief">
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
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            className={buttonClass}
          >
            Send
          </motion.button>
        </form>
      </Modal>
    </>
  );
}
