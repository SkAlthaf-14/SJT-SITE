import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquarePlus, Sparkles, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { REVIEWS, RATING_SUMMARY } from '../data/reviews';
import { submitReviewToFirestore } from '../services/reviewsService';
import { useBodyScrollLock } from '../utils/scrollLock';

export const ReviewsPage: React.FC = () => {
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Lock background scroll when review modal is open
  useBodyScrollLock(isModalOpen, 'reviews-page-modal');

  // Close review modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccessMsg(null);

    if (!newAuthor.trim() || !newComment.trim()) {
      setReviewError('Please provide your name and review text.');
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
      setReviewSuccessMsg('Thank you! Your review has been saved to our verified community stream.');
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

  const filteredReviews = selectedRating === 'all'
    ? REVIEWS
    : REVIEWS.filter((r) => r.rating === selectedRating);

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-2 font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Stories</span>
          </div>
          <h1 className="heading-section text-[var(--coffee-espresso)]">
            CUSTOMER REVIEWS & EXPERIENCES
          </h1>
          <p className="text-sm text-[var(--coffee-muted)] mt-3 font-normal leading-relaxed">
            Real feedback from filter kaapi lovers, home baristas, and daily coffee drinkers across India.
          </p>
        </div>

        {/* RATING BREAKDOWN CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--coffee-border)] shadow-xs mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Score */}
            <div className="md:col-span-4 text-center md:border-r border-[var(--coffee-border)] md:pr-8">
              <span className="font-serif text-5xl sm:text-6xl font-extrabold text-[var(--coffee-espresso)]">
                {RATING_SUMMARY.averageRating}
              </span>
              <div className="flex items-center justify-center text-[var(--coffee-caramel)] my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[var(--coffee-caramel)]" />
                ))}
              </div>
              <p className="text-xs text-[var(--coffee-muted)]">
                Based on {RATING_SUMMARY.totalReviews} verified community ratings
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="md:col-span-8 space-y-2.5">
              {RATING_SUMMARY.breakdown.map((b) => (
                <div key={b.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-[var(--coffee-espresso)] font-semibold">{b.stars} Stars</span>
                  <div className="flex-1 bg-[var(--coffee-cream)] h-2.5 rounded-full overflow-hidden border border-[var(--coffee-border)]/60">
                    <div
                      className="bg-gradient-to-r from-[var(--coffee-roast)] to-[var(--coffee-caramel)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[var(--coffee-muted)] font-mono">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRating('all')}
              className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedRating === 'all'
                  ? 'bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] shadow-sm'
                  : 'bg-white border border-[var(--coffee-border)] text-[var(--coffee-text)] hover:bg-[var(--coffee-cream)]'
              }`}
            >
              All Reviews ({REVIEWS.length})
            </button>
            {[5, 4, 3].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRating(r)}
                className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedRating === r
                    ? 'bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] shadow-sm'
                    : 'bg-white border border-[var(--coffee-border)] text-[var(--coffee-text)] hover:bg-[var(--coffee-cream)]'
                }`}
              >
                <span>{r} Stars</span>
                <Star className="w-3 h-3 fill-[var(--coffee-caramel)] text-[var(--coffee-caramel)]" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquarePlus className="w-4 h-4 text-[var(--coffee-caramel)]" />
              <span>Share Your Review</span>
            </button>
            <span className="text-xs text-[var(--coffee-muted)] hidden sm:inline">
              Showing {filteredReviews.length} reviews
            </span>
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-[var(--coffee-border)] shadow-xs flex flex-col justify-between hover:border-[var(--coffee-caramel)]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-[var(--coffee-caramel)]">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[var(--coffee-caramel)]" />
                    ))}
                  </div>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-[10px] text-[#2E5A3D] font-semibold bg-[#F0F5F2] px-2.5 py-0.5 rounded-full border border-[#C5DDD0]">
                      <ShieldCheck className="w-3 h-3 text-[#3D6B4F]" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-base font-bold text-[var(--coffee-espresso)]">
                  "{review.title}"
                </h3>

                <p className="text-xs text-[var(--coffee-muted)] mt-2.5 leading-relaxed font-sans">
                  {review.comment}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--coffee-border)]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-[var(--coffee-espresso)] block">
                    {review.author}
                  </span>
                  <span className="text-[11px] text-[var(--coffee-muted)]">
                    {review.location} • {review.date}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--coffee-caramel)] font-semibold bg-[var(--coffee-cream)]/70 px-2.5 py-1 rounded-md border border-[var(--coffee-border)]/50">
                  {review.productName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share Your Coffee Experience"
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[var(--coffee-espresso)]/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
        >
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
            <div className="relative bg-[var(--coffee-bg)] w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-2xl z-10 animate-fade-in my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[var(--coffee-muted)] hover:text-[var(--coffee-espresso)] rounded-full hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)] mb-1">
              Share Your Coffee Experience
            </h3>
            <p className="text-xs text-[var(--coffee-muted)] mb-6">
              We value every sip. Help other coffee enthusiasts discover their morning match.
            </p>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-2.5 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#F0F5F2] text-[#2E5A3D] flex items-center justify-center mx-auto border border-[#C5DDD0]">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">Thank You!</h4>
                <p className="text-xs text-[var(--coffee-muted)]">
                  {reviewSuccessMsg || 'Your review has been successfully saved to our community stream.'}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F5F2] text-[#2E5A3D] rounded-full text-[11px] font-semibold border border-[#C5DDD0]">
                    <Check className="w-3.5 h-3.5 text-[#3D6B4F]" />
                    <span>Verified in SJT Farms Cloud Firestore</span>
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[var(--coffee-error)] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[var(--coffee-error)] shrink-0 mt-0.5" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-white focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1">Rating</label>
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
                              ? 'fill-[var(--coffee-caramel)] text-[var(--coffee-caramel)]'
                              : 'text-[var(--coffee-border)]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1">Your Review</label>
                  <textarea
                    rows={4}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="How was the aroma, body, and brewing experience?"
                    className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-white focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--coffee-caramel)]" />
                      <span>Saving to Verified Reviews...</span>
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
    </div>
  );
};
