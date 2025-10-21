import React from "react";
import Link from "next/link";
import { Accordion } from "@/shared/ui/Accordions/Accordion";
import { faqItems } from "@/entities/questions/model/questionsData";
import QuestionItem from "@/entities/questions/ui/QuestionItem";

const FAQSection: React.FC = () => {
  return (
    <section className="bg-muted dark:bg-background py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="md:w-1/3">
            <div className="sticky top-20">
              <h2 className="mt-4 text-3xl font-bold">Часто задаваемые вопросы</h2>
              <p className="text-muted-foreground mt-4">
                Не нашли ответ? Свяжитесь с нашей{" "}
                <Link
                  href="https://t.me/ggjgker"
                  target="_blank"
                  className="text-primary font-medium border-b-2 border-transparent hover:border-blue-500 transition-all duration-300"
                >
                  службой поддержки
                </Link>
              </p>
            </div>
          </div>

          <div className="md:w-2/3">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqItems.map((item) => (
                <QuestionItem key={item.id} item={item} />
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
