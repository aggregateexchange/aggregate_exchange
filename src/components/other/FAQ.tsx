import React, { useState } from 'react';
import styles from './FAQ.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Free access to API?",
    answer: 'Yes, you can find API playground.\n\nlink: <a href="https://www.aggregate.exchange/swagger-api" target="_blank">www.aggregate.exchange/swagger-api</a> and script examples in docs'
  },
  {
    question: "What is this?",
    answer: "It's an aggregator for all your favourite dApps. Instead of going to multiple websites you can do everything in Aggregate and the onchain transaction will be exactly the same as you would initiate it directly in the dApps"
  },
  {
    question: "Is it safe?",
    answer: "Yes, we only querry prices for your desired swap and bridge needs. You interact directly with the dApp you select, there is no contract in between. We just pass you the same transaction data you would get on selected dApp"
  },
  {
    question: "Will I recieve airdrops for the dApps i interact with?",
    answer: "Yes, the interaction is directly to the dApp, we dont have any contracts in between."
  },
  {
    question: "Why I dont see any quotes for some of the chains?",
    answer: "It might have happen that no dApp was found for your exact swap path. All chains that are suported have integrated swap/bridge dApp. We are adding dApps every single day."
  },
  {
    question: "Will you add my favourite dApp?",
    answer: "Yes! Contact us on X/twitter and if its posible we will add it. https://x.com/Aggregate_ex"
  },
  {
    question: "Quote for dApp is not showing up when it should, why?",
    answer: "Sometimes it happens that apps update APIs or change something, dont hesitate and contact us on discord or twitter. It will get fixed in notime"
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faqContainer}>
      <h2 className={styles.faqTitle}>FAQ</h2>
      {faqData.map((item, index) => (
        <div key={index} className={styles.faqItem}>
          <button onClick={() => handleToggle(index)} className={styles.faqQuestion}>
            {item.question}
          </button>
          {openIndex === index && (
            <div
              className={styles.faqAnswer}
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQ;
