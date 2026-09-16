import Banner from '../components/Banner';
import AboutSection from '../components/AboutSection';
import NewComicsSection from '../components/NewComicsSection';
import TeamSection from '../components/TeamSection';
import ProcessSection from '../components/ProcessSection';
import BlogSection from '../components/BlogSection';

export default function Home() {
  return (
    <>
      <Banner />
      <AboutSection />
      <NewComicsSection />
      <TeamSection />
      <ProcessSection />
      <BlogSection />
    </>
  );
}