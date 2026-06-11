import { Attempt } from '@prisma/client';

export interface QuestionData {
  question: string;
  options: string[];
  correctOption: string; // "A", "B", "C", "D"
  topic: string;
  subTopic: string;
  difficulty: number;
  explanation: string;
}

export interface GenerationContext {
  domain: string;
  targetDifficulty: number; // 1-5
  topicFocus?: string; // If in focused mode
  previousAttempts: Attempt[];
}

// Mock database of questions to simulate AI for development without API costs
const MOCK_QUESTIONS: Record<string, QuestionData[]> = {
  "IT": [
    {
      question: "What is the primary difference between TCP and UDP?",
      options: [
        "TCP is connection-oriented, UDP is connectionless",
        "UDP is reliable, TCP is unreliable",
        "TCP is faster than UDP",
        "UDP guarantees delivery, TCP does not"
      ],
      correctOption: "A",
      topic: "Computer Networks",
      subTopic: "Protocols",
      difficulty: 2,
      explanation: "TCP establishes a connection before sending data, ensuring reliability. UDP sends packets without connection, prioritizing speed over reliability."
    },
    {
      question: "Which data structure uses LIFO (Last In First Out) principle?",
      options: ["Queue", "Stack", "Linked List", "Tree"],
      correctOption: "B",
      topic: "Data Structures",
      subTopic: "Stack",
      difficulty: 1,
      explanation: "A Stack follows the LIFO principle where the last element added is the first one removed."
    },
    {
      question: "What does the 'ACID' property in databases stand for?",
      options: [
        "Atomicity, Consistency, Isolation, Durability",
        "Accuracy, Consistency, Integrity, Durability",
        "Atomicity, Clarity, Isolation, Data",
        "Access, Control, Integration, Distribution"
      ],
      correctOption: "A",
      topic: "DBMS",
      subTopic: "Transactions",
      difficulty: 3,
      explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability, which are the key properties of database transactions."
    },
    {
      question: "What is a 'deadlock' in operating systems?",
      options: [
        "A process that is waiting for an event that will never occur",
        "A process that is finished and waiting for the OS to clean up",
        "A state where two or more processes are waiting for each other to release resources",
        "A process that is in an infinite loop"
      ],
      correctOption: "C",
      topic: "Operating Systems",
      subTopic: "Concurrency",
      difficulty: 3,
      explanation: "A deadlock occurs when processes are stuck because each holds a resource the other needs."
    },
    {
      question: "Which of the following is NOT a fundamental principle of OOP?",
      options: ["Encapsulation", "Inheritance", "Polymorphism", "Compilation"],
      correctOption: "D",
      topic: "Programming Fundamentals",
      subTopic: "OOP",
      difficulty: 1,
      explanation: "The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Compilation is a process, not a principle."
    },
    {
      question: "What is an index in a database used for?",
      options: ["To store data permanently", "To speed up data retrieval", "To encrypt sensitive data", "To define table relationships"],
      correctOption: "B",
      topic: "DBMS",
      subTopic: "Indexing",
      difficulty: 2,
      explanation: "An index is a data structure that improves the speed of data retrieval operations on a database table."
    },
    {
      question: "What is the purpose of a 'Virtual DOM' in React?",
      options: [
        "To provide a direct link to the browser's DOM",
        "To minimize expensive DOM manipulations by batching updates",
        "To handle server-side rendering exclusively",
        "To manage application state"
      ],
      correctOption: "B",
      topic: "Frontend Development",
      subTopic: "React",
      difficulty: 4,
      explanation: "The Virtual DOM is a lightweight copy of the real DOM. React uses it to compare changes and update only the necessary parts of the UI."
    },
    {
      question: "What is the time complexity of searching an element in a balanced Binary Search Tree?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      correctOption: "C",
      topic: "Data Structures",
      subTopic: "Trees",
      difficulty: 2,
      explanation: "In a balanced BST, each comparison halves the search space, resulting in logarithmic time complexity."
    },
    {
      question: "Which HTTP method is typically used to update an existing resource?",
      options: ["GET", "POST", "PUT/PATCH", "DELETE"],
      correctOption: "C",
      topic: "Web Development",
      subTopic: "HTTP",
      difficulty: 2,
      explanation: "PUT is used for full updates, while PATCH is used for partial updates to a resource."
    },
    {
      question: "What is the role of a 'Load Balancer' in system design?",
      options: [
        "To store backups of the database",
        "To distribute incoming network traffic across multiple servers",
        "To encrypt all incoming traffic",
        "To manage user authentication"
      ],
      correctOption: "B",
      topic: "System Design",
      subTopic: "Scalability",
      difficulty: 4,
      explanation: "A load balancer distributes traffic to prevent any single server from becoming overwhelmed and ensuring high availability."
    },
    {
      question: "What is 'Hoisting' in JavaScript?",
      options: [
        "Moving a variable to the end of the script",
        "The behavior of moving declarations to the top of their scope",
        "A method to optimize loop execution",
        "A way to prevent memory leaks"
      ],
      correctOption: "B",
      topic: "Frontend Development",
      subTopic: "JavaScript",
      difficulty: 3,
      explanation: "Hoisting allows you to use functions and variables before they are declared in the code, as the JS engine moves declarations to the top during the compilation phase."
    },
    {
      question: "Which of these is NOT an ACID property?",
      options: ["Atomicity", "Consistency", "Isolation", "Efficiency"],
      correctOption: "D",
      topic: "DBMS",
      subTopic: "Transactions",
      difficulty: 1,
      explanation: "Efficiency is not part of ACID (Atomicity, Consistency, Isolation, Durability)."
    },
    {
      question: "What is the primary use of 'Docker'?",
      options: [
        "Managing physical hardware",
        "Designing user interfaces",
        "Packaging applications into containers for consistency",
        "Compiling C++ code"
      ],
      correctOption: "C",
      topic: "Software Engineering",
      subTopic: "DevOps",
      difficulty: 3,
      explanation: "Docker allows developers to bundle an application with all its dependencies into a container, ensuring it runs identically in any environment."
    },
    {
      question: "What is 'Normalization' in databases?",
      options: [
        "The process of increasing data redundancy",
        "The process of organizing data to reduce redundancy and improve integrity",
        "Converting all data to strings",
        "A method of backing up data"
      ],
      correctOption: "B",
      topic: "DBMS",
      subTopic: "Design",
      difficulty: 3,
      explanation: "Normalization involves dividing a database into two or more tables and defining relationships between them to eliminate data redundancy."
    },
    {
      question: "What is a 'Closure' in JavaScript?",
      options: [
        "A way to close a browser tab",
        "A function that has access to its outer function scope even after it has finished",
        "A method to delete objects from memory",
        "A type of loop structure"
      ],
      correctOption: "B",
      topic: "Frontend Development",
      subTopic: "JavaScript",
      difficulty: 4,
      explanation: "A closure gives you access to an outer function's scope from an inner function."
    },
    {
      question: "What is the difference between '==' and '===' in JavaScript?",
      options: [
        "No difference",
        "== checks only value, while === checks both value and type",
        "== checks type, while === checks only value",
        "=== is faster but less reliable"
      ],
      correctOption: "B",
      topic: "Frontend Development",
      subTopic: "JavaScript",
      difficulty: 2,
      explanation: "The triple equals (===) operator performs strict equality comparison."
    },
    {
      question: "What is a 'Primary Key' in a database?",
      options: [
        "A key used to open the computer system",
        "A unique identifier for each record in a table",
        "A key that can be null",
        "A pointer to another table"
      ],
      correctOption: "B",
      topic: "DBMS",
      subTopic: "Design",
      difficulty: 1,
      explanation: "A primary key uniquely identifies each row in a table and cannot be null."
    },
    {
      question: "What is 'Responsive Web Design'?",
      options: [
        "Websites that load quickly",
        "Websites that respond to user clicks",
        "Websites that adapt their layout to different screen sizes",
        "Websites that are easy to read"
      ],
      correctOption: "C",
      topic: "Web Development",
      subTopic: "CSS",
      difficulty: 1,
      explanation: "Responsive design uses flexible layouts and media queries to ensure a site looks good on all devices."
    },
    {
      question: "What is 'Version Control' (e.g., Git)?",
      options: [
        "A way to control the speed of the internet",
        "A system that records changes to a file or set of files over time",
        "A method to delete old versions of software",
        "A way to prevent users from changing code"
      ],
      correctOption: "B",
      topic: "Software Engineering",
      subTopic: "Tools",
      difficulty: 1,
      explanation: "Version control allows multiple developers to collaborate and track changes to the same codebase."
    },
    {
      question: "What is an 'API'?",
      options: [
        "Automated Program Interaction",
        "Application Programming Interface",
        "Advanced Protocol Integration",
        "Application Process Index"
      ],
      correctOption: "B",
      topic: "Web Development",
      subTopic: "Architecture",
      difficulty: 1,
      explanation: "An API is a set of rules that allow one software application to interact with another."
    }
  ],
  "Finance": [
    {
      question: "What is the P/E ratio used for?",
      options: [
        "Measuring a company's debt",
        "Valuing a company's share price relative to its earnings",
        "Calculating the profit margin",
        "Estimating future dividends"
      ],
      correctOption: "B",
      topic: "Valuation",
      subTopic: "Ratios",
      difficulty: 2,
      explanation: "The Price-to-Earnings (P/E) ratio compares a company's current share price to its earnings per share."
    },
    {
      question: "What does 'liquidity' refer to in finance?",
      options: [
        "The ability to convert an asset into cash quickly without significant loss",
        "The amount of profit a company makes",
        "The total value of a company's assets",
        "The interest rate on a loan"
      ],
      correctOption: "A",
      topic: "Market Basics",
      subTopic: "Liquidity",
      difficulty: 1,
      explanation: "Liquidity describes how easily an asset can be bought or sold in the market without affecting its price."
    },
    {
      question: "What is a 'Dividend'?",
      options: [
        "A portion of a company's profit paid to shareholders",
        "A type of loan given to a company",
        "The total revenue of a company",
        "A tax paid by the company to the government"
      ],
      correctOption: "A",
      topic: "Corporate Finance",
      subTopic: "Dividends",
      difficulty: 1,
      explanation: "Dividends are payments made by a corporation to its shareholders out of its after-tax earnings."
    },
    {
      question: "What is 'Compound Interest'?",
      options: [
        "Interest calculated only on the principal amount",
        "Interest calculated on both the principal and the accumulated interest",
        "A flat fee paid on a loan",
        "Interest that decreases over time"
      ],
      correctOption: "B",
      topic: "Banking",
      subTopic: "Interest",
      difficulty: 1,
      explanation: "Compound interest is interest on interest, making it grow faster than simple interest."
    },
    {
      question: "What is an 'IPO'?",
      options: [
        "International Profit Organization",
        "Initial Public Offering",
        "Internal Process Optimization",
        "Investor Portofolio Overview"
      ],
      correctOption: "B",
      topic: "Markets",
      subTopic: "Stocks",
      difficulty: 1,
      explanation: "An IPO is the first time a company offers its stock to the public."
    },
    {
      question: "What is 'Diversification' in investing?",
      options: [
        "Investing all money in a single stock",
        "Spreading investments across different assets to reduce risk",
        "Withdrawing all money from the market",
        "Focusing only on high-risk assets"
      ],
      correctOption: "B",
      topic: "Portfolio Management",
      subTopic: "Strategy",
      difficulty: 2,
      explanation: "Diversification helps protect a portfolio against major losses in any single security or sector."
    },
    {
      question: "What does 'Bulls' and 'Bears' refer to in stock market terms?",
      options: [
        "Names of the largest investment firms",
        "Market directions; Bull is rising, Bear is falling",
        "Types of market regulators",
        "Specific commodities like meat and fur"
      ],
      correctOption: "B",
      topic: "Market Terminology",
      subTopic: "Trends",
      difficulty: 1,
      explanation: "A bull market is when prices are rising or expected to rise. A bear market is when prices are falling."
    },
    {
      question: "What is a 'Bond'?",
      options: [
        "An agreement between two people",
        "A loan made by an investor to a borrower (typically corporate or governmental)",
        "A type of high-risk stock",
        "A method to insure property"
      ],
      correctOption: "B",
      topic: "Fixed Income",
      subTopic: "Basics",
      difficulty: 1,
      explanation: "Bonds are used by companies and governments to raise money; investors get periodic interest payments and the principal back at maturity."
    },
    {
      question: "What is 'Work Capital'?",
      options: [
        "The capital used to buy a workplace",
        "Difference between current assets and current liabilities",
        "The total value of all equipment",
        "The amount paid to employees"
      ],
      correctOption: "B",
      topic: "Accounting",
      subTopic: "Ratios",
      difficulty: 3,
      explanation: "Working capital measures a company's operational efficiency and short-term financial health."
    }
  ],
  "Marketing": [
    {
      question: "What are the '4 Ps' of the marketing mix?",
      options: [
        "Product, Price, Place, Promotion",
        "People, Process, Profit, Position",
        "Plan, Produce, Promote, Profit",
        "Product, People, Price, Plan"
      ],
      correctOption: "A",
      topic: "Marketing Fundamentals",
      subTopic: "Marketing Mix",
      difficulty: 1,
      explanation: "The classic marketing mix consists of Product, Price, Place, and Promotion — the levers a marketer controls to influence demand."
    },
    {
      question: "What does 'CTR' measure in digital marketing?",
      options: [
        "Cost To Revenue",
        "The percentage of people who click a link after seeing it",
        "Customer Trust Rating",
        "Conversion Time Ratio"
      ],
      correctOption: "B",
      topic: "Digital Marketing",
      subTopic: "Metrics",
      difficulty: 2,
      explanation: "Click-Through Rate = clicks ÷ impressions. It indicates how compelling an ad or link is to its audience."
    },
    {
      question: "What is a 'buyer persona'?",
      options: [
        "A legal contract with a customer",
        "A semi-fictional profile of an ideal customer based on research",
        "The person who approves marketing budgets",
        "A loyalty program member"
      ],
      correctOption: "B",
      topic: "Marketing Strategy",
      subTopic: "Segmentation",
      difficulty: 2,
      explanation: "Buyer personas synthesize demographics, goals, and pain points of target customers so campaigns can be tailored to them."
    },
    {
      question: "What is 'Customer Acquisition Cost' (CAC)?",
      options: [
        "The lifetime revenue from a customer",
        "The total sales and marketing spend divided by new customers gained",
        "The cost of retaining an existing customer",
        "The price a customer pays for the product"
      ],
      correctOption: "B",
      topic: "Marketing Analytics",
      subTopic: "Metrics",
      difficulty: 3,
      explanation: "CAC tells you how much it costs on average to win one new customer; it is usually compared against customer lifetime value (LTV)."
    },
    {
      question: "Which strategy focuses on creating valuable content to attract customers rather than interrupting them?",
      options: ["Outbound marketing", "Inbound marketing", "Guerrilla marketing", "Direct selling"],
      correctOption: "B",
      topic: "Marketing Strategy",
      subTopic: "Inbound",
      difficulty: 2,
      explanation: "Inbound marketing draws prospects in with content, SEO, and social media instead of pushing messages at them."
    },
    {
      question: "What is 'A/B testing' used for?",
      options: [
        "Testing two suppliers against each other",
        "Comparing two versions of an asset to see which performs better",
        "Auditing brand awareness",
        "Benchmarking against competitors"
      ],
      correctOption: "B",
      topic: "Marketing Analytics",
      subTopic: "Experimentation",
      difficulty: 2,
      explanation: "A/B testing splits the audience between variants (e.g. two headlines) and measures which converts better."
    },
    {
      question: "What does 'positioning' mean in marketing?",
      options: [
        "Where the product sits on a store shelf",
        "How a brand occupies a distinct place in the customer's mind relative to competitors",
        "The order of ads in a campaign",
        "The geographic markets a company serves"
      ],
      correctOption: "B",
      topic: "Marketing Strategy",
      subTopic: "Positioning",
      difficulty: 3,
      explanation: "Positioning defines the unique value and associations a brand wants customers to recall versus alternatives."
    },
    {
      question: "What is a 'conversion funnel'?",
      options: [
        "A tool for pouring liquids",
        "The staged journey from awareness to purchase, narrowing at each step",
        "A spreadsheet of leads",
        "A channel for customer complaints"
      ],
      correctOption: "B",
      topic: "Digital Marketing",
      subTopic: "Funnels",
      difficulty: 3,
      explanation: "The funnel models how a large audience narrows through interest, consideration, and intent into actual buyers, exposing drop-off points."
    },
    {
      question: "What is 'SEO'?",
      options: [
        "Social Engagement Optimization",
        "Search Engine Optimization — improving visibility in organic search results",
        "Sales Efficiency Operations",
        "Sponsored Email Outreach"
      ],
      correctOption: "B",
      topic: "Digital Marketing",
      subTopic: "SEO",
      difficulty: 1,
      explanation: "SEO is the practice of optimizing content and site structure so pages rank higher in unpaid search engine results."
    },
    {
      question: "What is 'churn rate'?",
      options: [
        "The rate at which new leads arrive",
        "The percentage of customers who stop doing business with you over a period",
        "The speed of content production",
        "The ratio of ad spend to revenue"
      ],
      correctOption: "B",
      topic: "Marketing Analytics",
      subTopic: "Retention",
      difficulty: 3,
      explanation: "Churn measures customer loss; reducing churn is usually cheaper than acquiring replacement customers."
    }
  ],
  "HR": [
    {
      question: "What is the primary purpose of an 'onboarding' process?",
      options: [
        "To evaluate whether to fire a new hire",
        "To integrate new employees into the organization and make them productive quickly",
        "To negotiate salary",
        "To complete tax paperwork only"
      ],
      correctOption: "B",
      topic: "Talent Management",
      subTopic: "Onboarding",
      difficulty: 1,
      explanation: "Structured onboarding familiarizes new hires with culture, tools, and expectations, improving retention and time-to-productivity."
    },
    {
      question: "What does 'attrition' refer to in HR?",
      options: [
        "Hiring multiple candidates at once",
        "The gradual reduction of workforce through resignations and retirements",
        "Performance-based promotions",
        "Cross-department transfers"
      ],
      correctOption: "B",
      topic: "Workforce Planning",
      subTopic: "Attrition",
      difficulty: 2,
      explanation: "Attrition is workforce shrinkage that occurs naturally when departing employees are not replaced."
    },
    {
      question: "What is a 'competency-based interview'?",
      options: [
        "An interview testing only technical certifications",
        "An interview where candidates give examples of past behavior demonstrating specific skills",
        "A timed written exam",
        "An informal coffee chat"
      ],
      correctOption: "B",
      topic: "Recruitment",
      subTopic: "Interviewing",
      difficulty: 2,
      explanation: "Competency interviews use the premise that past behavior predicts future performance, probing real examples (the STAR method)."
    },
    {
      question: "What is the purpose of a 'performance appraisal'?",
      options: [
        "To calculate office rent",
        "To formally evaluate an employee's job performance and guide development",
        "To assign parking spots",
        "To plan company events"
      ],
      correctOption: "B",
      topic: "Performance Management",
      subTopic: "Appraisals",
      difficulty: 1,
      explanation: "Appraisals review achievements against goals, inform compensation and promotion decisions, and identify development needs."
    },
    {
      question: "What does 'employer branding' mean?",
      options: [
        "Printing logos on office supplies",
        "Shaping the company's reputation as a place to work to attract talent",
        "Trademarking the company name",
        "Advertising products to employees"
      ],
      correctOption: "B",
      topic: "Recruitment",
      subTopic: "Employer Brand",
      difficulty: 3,
      explanation: "A strong employer brand lowers hiring costs and attracts better-fit candidates by communicating culture and values."
    },
    {
      question: "What is 'succession planning'?",
      options: [
        "Planning the company holiday calendar",
        "Identifying and developing employees to fill key roles when they become vacant",
        "Scheduling shift rotations",
        "Outsourcing recruitment"
      ],
      correctOption: "B",
      topic: "Workforce Planning",
      subTopic: "Succession",
      difficulty: 3,
      explanation: "Succession planning protects business continuity by preparing internal talent for critical leadership and specialist positions."
    },
    {
      question: "What is the difference between 'exempt' and 'non-exempt' employees (US labor law)?",
      options: [
        "Exempt employees are part-time, non-exempt are full-time",
        "Non-exempt employees are entitled to overtime pay; exempt employees are not",
        "Exempt employees pay no taxes",
        "Non-exempt employees cannot be promoted"
      ],
      correctOption: "B",
      topic: "HR Compliance",
      subTopic: "Labor Law",
      difficulty: 4,
      explanation: "Under the FLSA, non-exempt workers must receive overtime (1.5x) beyond 40 hours/week, while exempt roles meeting salary/duty tests are excluded."
    },
    {
      question: "What is 'eNPS'?",
      options: [
        "Electronic National Payroll System",
        "Employee Net Promoter Score — how likely employees are to recommend the workplace",
        "Employee Number Per Site",
        "Enterprise New Position Strategy"
      ],
      correctOption: "B",
      topic: "Employee Engagement",
      subTopic: "Metrics",
      difficulty: 3,
      explanation: "eNPS asks employees how likely they are to recommend the company as a place to work, giving a quick engagement pulse."
    },
    {
      question: "What is 'constructive dismissal'?",
      options: [
        "Firing an employee with helpful feedback",
        "When an employer makes conditions so intolerable the employee is forced to resign",
        "Dismissal during a probation period",
        "Layoffs due to restructuring"
      ],
      correctOption: "B",
      topic: "HR Compliance",
      subTopic: "Employment Law",
      difficulty: 4,
      explanation: "Constructive dismissal treats a forced resignation as a termination, potentially exposing the employer to wrongful dismissal claims."
    },
    {
      question: "What is the main goal of 'diversity and inclusion' initiatives?",
      options: [
        "Meeting legal quotas only",
        "Building a workforce of varied backgrounds where everyone can contribute fully",
        "Reducing salary costs",
        "Standardizing employee behavior"
      ],
      correctOption: "B",
      topic: "Culture",
      subTopic: "D&I",
      difficulty: 2,
      explanation: "D&I aims for representation (diversity) plus an environment where different perspectives are genuinely valued (inclusion), which research links to better outcomes."
    }
  ]
};

export class AIService {
  async generateQuestion(context: GenerationContext): Promise<QuestionData> {
    const domainQuestions = MOCK_QUESTIONS[context.domain] || MOCK_QUESTIONS["IT"];

    // EXCLUDE PREVIOUSLY ASKED QUESTIONS first to know our true candidate pool
    const usedQuestionTexts = context.previousAttempts.map(a => {
      try {
        const content = JSON.parse(a.questionContent as string);
        return content.question;
      } catch (e) {
        return "";
      }
    });

    // Step 1: Filter domain questions by uniqueness
    let uniqueDomainQuestions = domainQuestions.filter(q => !usedQuestionTexts.includes(q.question));

    // Step 2: Try to filter by topicFocus if requested
    let candidates = uniqueDomainQuestions;
    if (context.topicFocus) {
      let topicCandidates = uniqueDomainQuestions.filter(q => q.topic === context.topicFocus);

      if (topicCandidates.length > 0) {
        candidates = topicCandidates;
      } else {
        // If we ran out of UNIQUE questions in the focused topic, broaden the search to the whole domain
        // but still keep it unique.
        candidates = uniqueDomainQuestions;
      }
    }

    // Step 3: If we are COMPLETELY out of unique questions in the domain, fallback to repetition (last resort)
    if (candidates.length === 0) {
      candidates = domainQuestions;
    }

    // Step 4: Pick random from candidates
    const randomQ = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      ...randomQ,
      difficulty: context.targetDifficulty || randomQ.difficulty
    };
  }
}
