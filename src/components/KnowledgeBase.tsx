import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is Extreme Ownership?",
    answer: "Extreme Ownership is the principle that leaders must own everything in their world. There are no bad teams, only bad leaders. When things go wrong, leaders must look inward first and ask what they can do to improve the situation."
  },
  {
    question: "How does The Dichotomy of Leadership work?",
    answer: "The Dichotomy of Leadership involves balancing seemingly opposite forces. Leaders must be both aggressive and patient, both confident and humble, both strategic and tactical. Understanding this balance is crucial for effective leadership."
  },
  {
    question: "What are the Laws of Combat?",
    answer: "The Laws of Combat from Leadership Strategy and Tactics include: 1) Cover and Move, 2) Simple, 3) Prioritize and Execute, 4) Decentralized Command. These principles translate directly from battlefield tactics to business leadership."
  },
  {
    question: "How do you implement a Code of Conduct?",
    answer: "A Code of Conduct should be clear, concise, and actionable. It must be enforced consistently and fairly. Leaders should model the behavior they expect from their team and hold everyone accountable to the same standards."
  },
  {
    question: "What is the importance of Leading Up and Down the Chain of Command?",
    answer: "Leading Up means effectively communicating with superiors to influence decisions. Leading Down means empowering subordinates to make decisions. Both are essential for creating a high-performing organization."
  },
  {
    question: "How do you build and maintain team discipline?",
    answer: "Discipline starts with the leader. Set clear standards, enforce them consistently, and lead by example. Use positive reinforcement and address issues immediately. Remember: discipline equals freedom."
  },
  {
    question: "What role does mindset play in leadership?",
    answer: "Mindset is everything. A growth mindset allows leaders to see challenges as opportunities. Leaders must cultivate mental toughness, resilience, and the ability to adapt to changing circumstances."
  },
  {
    question: "How do you handle failure and learn from it?",
    answer: "Embrace failure as a learning opportunity. Conduct thorough debriefs after every mission or project. Ask: What went right? What went wrong? How can we improve? Use this information to get better."
  }
];

export function KnowledgeBase() {
  return (
    <div className="w-full">
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} isLast={index === faqItems.length - 1}>
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
