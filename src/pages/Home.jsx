import Banner from '../components/Banner';
import AboutSection from '../components/AboutSection';
import NewComicsSection from '../components/NewComicsSection';
import PopularSection from '../components/PopularSection';
import TeamSection from '../components/TeamSection';
import ReviewsSection from '../components/ReviewsSection';
import BlogSection from '../components/BlogSection';
import BrandSection from '../components/BrandSection';

export default function Home() {
  return (
    <>
      <Banner />
      <AboutSection />
      <NewComicsSection />
      <PopularSection />
      <TeamSection />
      <ReviewsSection />
      <BlogSection />
      <BrandSection />
    </>
  );
}
