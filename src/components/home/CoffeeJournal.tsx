import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, ArrowRight, X } from 'lucide-react';
import { ARTICLES } from '../../data/articles';
import { Article } from '../../types';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const CoffeeJournal: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Lock background scroll when article modal is open
  useBodyScrollLock(Boolean(selectedArticle), 'coffee-journal-modal');

  // Close article on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedArticle) {
        setSelectedArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle]);

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-[#EDE2D2]/30 border-y border-[#E4D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase tracking-[0.25em] mb-1.5 font-sans">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Coffee Education & Knowledge</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#201814] tracking-tight">
            THE SJT COFFEE JOURNAL
          </h2>
          <p className="text-xs sm:text-base text-[#6B5B52] mt-2 font-normal">
            Articles and masterclasses on Indian coffee terroir, grind calibration, traditional rituals, and storage science.
          </p>
        </div>

        {/* 6 EDITORIAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ARTICLES.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="group bg-white rounded-3xl overflow-hidden border border-[#E4D8C8] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              {/* IMAGE */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#24150F]">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-[#24150F]/80 backdrop-blur-md text-[#DFBF82] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {art.category}
                </div>
              </div>

              {/* BODY */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-[#948277] mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#C49A5A]" />
                    <span>{art.readTime}</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#201814] group-hover:text-[#4A2C20] transition-colors leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs text-[#6B5B52] mt-2.5 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E4D8C8]/60 flex items-center justify-between text-xs font-semibold text-[#A37936] group-hover:text-[#24150F]">
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* FULL ARTICLE READING MODAL */}
      {selectedArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#24150F]/70 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
        >
          <div className="fixed inset-0" onClick={() => setSelectedArticle(null)} aria-hidden="true" />

          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
            <div className="relative bg-[#F7F2EA] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E4D8C8] z-10 my-auto flex flex-col max-h-[90vh]">
              <div className="relative aspect-[16/9] w-full bg-[#24150F] shrink-0">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:bg-black rounded-full transition-colors cursor-pointer"
                  aria-label="Close article"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto overscroll-contain space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase">
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                  {selectedArticle.title}
                </h2>

                <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                  {selectedArticle.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#E4D8C8] text-center">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-6 py-2.5 bg-[#24150F] text-[#DFBF82] rounded-xl text-xs font-semibold hover:bg-[#342017] cursor-pointer"
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
