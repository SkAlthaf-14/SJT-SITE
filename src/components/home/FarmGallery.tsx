import React, { useState, useEffect } from 'react';
import { Camera, X, ZoomIn, Compass } from 'lucide-react';
import { COFFEE_IMAGES, ImageAsset } from '../../data/images';
import { useNavigation } from '../../context/NavigationContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const FarmGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const { navigateTo } = useNavigation();

  // Lock background scroll when image lightbox is open
  useBodyScrollLock(Boolean(selectedImage), 'farm-gallery-lightbox');

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const galleryItems = COFFEE_IMAGES.farmGallery;

  const categories = [
    { id: 'all', label: 'All Photographs' },
    { id: 'plantation', label: 'Estate Canopy' },
    { id: 'cherries', label: 'Ripe Cherries' },
    { id: 'harvest', label: 'Hand Harvest' },
    { id: 'processing', label: 'Sun Drying' },
    { id: 'roasting', label: 'Drum Roasting' },
    { id: 'brewing', label: 'Coffee Cup' },
  ];

  const filteredItems =
    activeCategory === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-[#EDE2D2]/40 border-b border-[#E4D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase tracking-[0.25em] mb-1.5 font-sans">
            <Camera className="w-3.5 h-3.5" />
            <span>Authentic Estate Photography</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#201814] tracking-tight">
            FARM PHOTOGRAPHY GALLERY
          </h2>
          <p className="text-xs sm:text-base text-[#6B5B52] mt-2 font-normal leading-relaxed">
            Real scenes from our shade-covered hills, handpicked crimson cherries, sun-warmed drying patios, and slow roastery drums.
          </p>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 justify-start sm:justify-center no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-[#24150F] text-[#DFBF82] shadow-sm scale-105'
                  : 'bg-white text-[#201814] hover:bg-[#EDE2D2] border border-[#E4D8C8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* GALLERY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-[#24150F] border border-[#E4D8C8] shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <img
                src={item.url}
                alt={item.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#24150F]/90 via-[#24150F]/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Zoom hover indicator */}
              <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#24150F] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md">
                <ZoomIn className="w-4 h-4 text-[#C49A5A]" />
              </div>

              {/* Caption Overlay at Bottom */}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white transform transition-transform duration-300">
                <span className="text-[10px] font-bold text-[#DFBF82] uppercase tracking-wider block mb-1">
                  {item.category}
                </span>
                <p className="font-serif text-sm sm:text-base font-bold text-white line-clamp-2">
                  {item.caption || item.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM STORY CTA */}
        <div className="mt-14 text-center">
          <button
            onClick={() => navigateTo('our-farm')}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#24150F] border border-[#E4D8C8] hover:border-[#C49A5A] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xs hover:shadow-md"
          >
            <Compass className="w-4 h-4 text-[#C49A5A]" />
            <span>Discover The Complete Farm Story</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Estate Photograph Preview"
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#24150F]/90 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
            <div
              className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden border border-[#C49A5A]/40 shadow-2xl animate-fadeIn my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#24150F]/80 text-white hover:bg-[#24150F] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#24150F] overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#A37936] uppercase tracking-wider block mb-1">
                    SJT Farms Archive • {selectedImage.category}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#201814]">
                    {selectedImage.caption || selectedImage.alt}
                  </h3>
                  <p className="text-xs text-[#6B5B52] mt-1">
                    {selectedImage.alt}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedImage(null);
                    navigateTo('shop');
                  }}
                  className="shrink-0 px-5 py-2.5 bg-[#24150F] text-[#DFBF82] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#342017] transition-colors cursor-pointer"
                >
                  Shop Coffee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
