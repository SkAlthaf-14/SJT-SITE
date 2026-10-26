import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ChevronLeft, ChevronRight, MessageSquarePlus, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { REVIEWS, RATING_SUMMARY } from '../../data/reviews';
import { submitReviewToFirestore } from '../../services/reviewsService';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const CustomerReviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Lock background scroll when review modal is open
  useBodyScrollLock(isModalOpen, 'customer-reviews-modal');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? REVIEWS.length - 1 : prev - 1));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccessMsg(null);

    if (!newAuthor.trim() || !newComment.trim()) {
      setReviewError('Please provide your name and review comment.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save directly to Firestore reviews collection
      await submitReviewToFirestore({
        author: newAuthor.trim(),
        rating: newRating,
        comment: newComment.trim(),
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      setReviewSuccessMsg('Thank you! Your review has been saved successfully.');
      setTimeout(() => {
        setIsSubmitted(false);
        setIsModalOpen(false);
        setNewAuthor('');
        setNewComment('');
        setReviewSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setIsSubmitting(false);
      setReviewError(err?.message || 'Failed to submit review. Please try again.');
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#F7F1E8] border-b border-[#DED2C4]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER & SCORE SUMMARY */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#A66A3F] mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-[#A66A3F]" />
              ))}
              <span className="text-xs font-bold text-[#2B211C] ml-1">
                {RATING_SUMMARY.averageRating} / 5.0 Average Rating
              </span>
            </div>
            <h2 className="heading-section text-[#2B211C] tracking-tight">
              LOVED BY COFFEE LOVERS
            </h2>
            <p className="text-sm sm:text-base text-[#6D625B] mt-2 font-normal">
              Read how fresh single-estate roasting transforms daily morning cups across the country.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-[#FCFAF6] border border-[#DED2C4] text-[#2B211C] hover:bg-[#2A1812] hover:text-[#FCFAF6] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-warm-sm cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#A66A3F]" />
              <span>Share Your Review</span>
            </button>

            {/* Carousel navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-xl bg-[#FCFAF6] hover:bg-[#2A1812] hover:text-white border border-[#DED2C4] flex items-center justify-center transition-colors shadow-warm-sm cursor-pointer"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-xl bg-[#FCFAF6] hover:bg-[#2A1812] hover:text-white border border-[#DED2C4] flex items-center justify-center transition-colors shadow-warm-sm cursor-pointer"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* REVIEWS GRID / SLIDER VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((offset) => {
            const review = REVIEWS[(currentIndex + offset) % REVIEWS.length];
            return (
              <div
                key={`${review.id}-${offset}`}
                className="bg-[#FCFAF6] rounded-2xl p-6 sm:p-7 border border-[#DED2C4] shadow-warm-sm hover:shadow-warm-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-[#A66A3F]">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#A66A3F]" />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="flex items-center gap-1 text-[10.5px] text-[#3D6B4F] font-semibold bg-[#3D6B4F]/10 px-2.5 py-0.5 rounded-full border border-[#3D6B4F]/20">
                        <ShieldCheck className="w-3 h-3 text-[#3D6B4F]" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#2B211C] leading-snug">
                    "{review.title}"
                  </h4>

                  <p className="text-xs text-[#6D625B] mt-2.5 leading-relaxed font-sans">
                    {review.comment}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DED2C4]/60 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-sm font-bold text-[#2B211C] block">
                      {review.author}
                    </span>
                    <span className="text-[11px] text-[#6D625B]">{review.location}</span>
                  </div>
                  <span className="text-[10px] text-[#A66A3F] font-semibold bg-[#EFE3D2] px-2.5 py-1 rounded-md">
                    {review.productName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share Your Coffee Experience"
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#2A1812]/70 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
        >
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
            <div className="relative bg-[#FCFAF6] w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-[#DED2C4] shadow-warm-lg z-10 animate-fadeIn my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#6D625B] hover:text-[#2B211C] rounded-full hover:bg-[#F7F1E8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold text-[#2B211C] mb-1">
              Share Your Coffee Experience
            </h3>
            <p className="text-xs text-[#6D625B] mb-6">
              We value every sip. Help other coffee enthusiasts discover their morning match.
            </p>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-2.5 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-[#3D6B4F]/10 text-[#3D6B4F] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#2B211C]">Thank You!</h4>
                <p className="text-xs text-[#6D625B]">
                  {reviewSuccessMsg || 'Your review has been successfully submitted.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#2B211C] block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs p-3 rounded-xl border border-[#DED2C4] bg-white focus:outline-none focus:border-[#A66A3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B211C] block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating
                              ? 'fill-[#A66A3F] text-[#A66A3F]'
                              : 'text-[#DED2C4]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B211C] block mb-1">Your Review</label>
                  <textarea
                    rows={4}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="How was the aroma, body, and brewing experience?"
                    className="w-full text-xs p-3 rounded-xl border border-[#DED2C4] bg-white focus:outline-none focus:border-[#A66A3F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#2A1812] text-[#FCFAF6] hover:bg-[#3B2418] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-warm-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#A66A3F]" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        </div>
      )}
    </section>
  );
};
