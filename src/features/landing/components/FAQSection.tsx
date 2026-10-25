"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative max-w-3xl mx-auto px-6">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know before you search, reserve, or list."
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "border-jade-500/25 bg-jade-500/[0.03]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 rounded-2xl"
                >
                  <span className="text-[15px]">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-jade-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-button-${i}`}
                  className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm text-white/60 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}