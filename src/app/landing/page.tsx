import React from "react";
import HeroSection from "./ui/HeroSection";
import FeaturesSection from "./ui/FeaturesSection";
import HowItWorksSection from "./ui/HowItWorksSection";
import FAQSection from "./ui/FAQSection";
import Footer from "@/widgets/Footer/ui/Footer";

const LandingPage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <Footer />
    </>
  );
};

export default LandingPage;
