import Hero from "@/components/home/Hero";
import CategoriesCarousel from "@/components/home/CategoriesCarousel";
import HorizontalCategories from "@/components/home/HorizontalCategories";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import AboutSection from "@/components/home/AboutSection";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesCarousel />
      <HorizontalCategories />
      <FeaturesGrid />
      <AboutSection />
      <Testimonials />
      <Newsletter />
    </>
  );
}
