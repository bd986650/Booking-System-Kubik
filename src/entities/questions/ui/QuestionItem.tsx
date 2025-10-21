'use client'

import React from 'react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/ui/Accordions/Accordion'
import { DynamicIcon } from 'lucide-react/dynamic'
import { FAQItem } from '@/entities/questions/model/questionsData'

interface QuestionItemProps {
  item: FAQItem
}

const QuestionItem: React.FC<QuestionItemProps> = ({ item }) => {
  return (
    <AccordionItem
      value={item.id}
      className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
    >
      <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="flex size-6">
            <DynamicIcon
              name={item.icon}
              className="m-auto size-4"
            />
          </div>
          <span className="text-base">{item.question}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <div className="px-9">
          <p className="text-base">{item.answer}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default QuestionItem
