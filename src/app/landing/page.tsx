import React from "react";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  FAQSection,
} from "@/widgets/landing";
import { Footer } from "@/widgets/Footer";

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
