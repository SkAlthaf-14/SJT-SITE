import React from 'react';
import { Hero } from '../components/home/Hero';
import { TrustBar } from '../components/common/TrustBar';
import { FeaturedCollection } from '../components/home/FeaturedCollection';
import { FarmStory } from '../components/home/FarmStory';
import { CoffeeExperience } from '../components/home/CoffeeExperience';
import { ProductJourney } from '../components/home/ProductJourney';
import { SignatureProduct } from '../components/home/SignatureProduct';
import { BrewYourWay } from '../components/home/BrewYourWay';
import { WhySJTFarms } from '../components/home/WhySJTFarms';
import { FarmGallery } from '../components/home/FarmGallery';
import { CustomerReviews } from '../components/home/CustomerReviews';
import { Newsletter } from '../components/home/Newsletter';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Trust / Quality Strip */}
      <TrustBar />

      {/* 4. Featured Coffee Products */}
      <FeaturedCollection />

      {/* 5. SJT FARMS Story */}
      <FarmStory />

      {/* 6. Coffee Farm Experience */}
      <CoffeeExperience />

      {/* 7. From Cherry to Cup Process */}
      <ProductJourney />

      {/* 8. Featured Product */}
      <SignatureProduct />

      {/* 9. Coffee Brewing Section */}
      <BrewYourWay />

      {/* 10. Why Choose SJT FARMS */}
      <WhySJTFarms />

      {/* 11. Farm Photography Gallery */}
      <FarmGallery />

      {/* 12. Customer Reviews */}
      <CustomerReviews />

      {/* 13. Newsletter */}
      <Newsletter />
    </div>
  );
};
