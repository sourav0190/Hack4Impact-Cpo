export interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
}

export interface SkillCategory {
    id: string;
    name: string;
    description: string;
    questions: {
        beginner: Question[];
        intermediate: Question[];
        hard: Question[];
    };
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        id: "react",
        name: "React.js",
        description: "Modern frontend development with React 19.",
        questions: {
            beginner: [
                {
                    id: 101,
                    text: "What is the primary purpose of 'useState' hook?",
                    options: ["To manage component state", "To fetch data from API", "To create a global store", "To handle side effects"],
                    correctAnswer: 0
                },
                {
                    id: 102,
                    text: "How do you pass data from a parent component to a child?",
                    options: ["Using state", "Using props", "Using context", "Using Redux"],
                    correctAnswer: 1
                },
                {
                    id: 103,
                    text: "What does JSX stand for?",
                    options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript X-Platform"],
                    correctAnswer: 0
                }
            ],
            intermediate: [
                {
                    id: 201,
                    text: "When does the 'useLayoutEffect' hook run?",
                    options: ["Before DOM mutations", "After DOM mutations but before paint", "After paint", "Only on server-side"],
                    correctAnswer: 1
                },
                {
                    id: 202,
                    text: "Which of the following is true about 'React.memo'?",
                    options: ["It caches component state", "It's a higher-order component for memoization", "It's a hook for expensive calculations", "It's used for automatic dependency injection"],
                    correctAnswer: 1
                }
            ],
            hard: [
                {
                    id: 301,
                    text: "In React 19, what is the 'useOptimistic' hook primarily used for?",
                    options: ["Improving load times", "Handling optimistic state updates during async actions", "Auto-generating test cases", "Optimizing server-side rendering"],
                    correctAnswer: 1
                },
                {
                    id: 302,
                    text: "How would you handle a circular dependency in React context providers?",
                    options: ["Merge them into a single context", "Use a custom hook to split resolution", "Move shared state to a ref", "React doesn't allow circular contexts"],
                    correctAnswer: 1
                }
            ]
        }
    },
    {
        id: "python",
        name: "Python Core",
        description: "Advanced Python patterns and system design.",
        questions: {
            beginner: [
                {
                    id: 401,
                    text: "What is the correct way to define a list in Python?",
                    options: ["my_list = (1, 2)", "my_list = {1, 2}", "my_list = [1, 2]", "my_list = <1, 2>"],
                    correctAnswer: 2
                }
            ],
            intermediate: [
                {
                    id: 501,
                    text: "What is a 'decorator' in Python?",
                    options: ["A style plugin", "A function that modifies another function", "A class attribute", "A type of list comprehension"],
                    correctAnswer: 1
                }
            ],
            hard: [
                {
                    id: 601,
                    text: "Explain the difference between '__getattr__' and '__getattribute__'?",
                    options: ["They are identical", "__getattr__ only runs if attribute is not found", "__getattribute__ only runs if attribute is not found", "__getattr__ is for private members"],
                    correctAnswer: 1
                }
            ]
        }
    },
    {
        id: "algorand",
        name: "Web3 & Algorand",
        description: "Blockchain infrastructure and Algorand smart contracts.",
        questions: {
            beginner: [
                {
                    id: 701,
                    text: "What consensus mechanism does Algorand use?",
                    options: ["Proof of Work", "Pure Proof of Stake", "Delegated Proof of Stake", "Proof of Authority"],
                    correctAnswer: 1
                }
            ],
            intermediate: [
                {
                    id: 801,
                    text: "What is the minimum balance required for an account on Algorand for each opted-in asset?",
                    options: ["0.1 ALGO", "1.0 ALGO", "0.001 ALGO", "0.5 ALGO"],
                    correctAnswer: 0
                }
            ],
            hard: [
                {
                    id: 901,
                    text: "What is 'Box Storage' in Algorand Smart Contracts?",
                    options: ["A way to store large files on-chain", "A dynamic key-value storage within an application", "An off-chain storage solution", "A type of transaction note"],
                    correctAnswer: 1
                }
            ]
        }
    }
];
