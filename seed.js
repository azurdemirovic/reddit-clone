require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./models/userModel');
const QuestionModel = require('./models/questionModel');
const AnswerModel = require('./models/answerModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/qa_app';

const usersData = [
    { username: 'GamerDev_99', email: 'gamer@example.com', bio: 'Indie dev working on a platformer.' },
    { username: 'CppWizard', email: 'cpp@example.com', bio: 'Template metaprogramming is my yoga.' },
    { username: 'AI_Researcher', email: 'ai@example.com', bio: 'Exploring LLM integration in IDEs.' },
    { username: 'PixelArtist', email: 'pixel@example.com', bio: 'Making sprites since 1995.' },
    { username: 'EngineBuilder', email: 'engine@example.com', bio: 'C++ and Vulkan enthusiast.' },
    { username: 'NeuralNetworker', email: 'nn@example.com', bio: 'Data scientist turned dev.' },
    { username: 'GameDesignPro', email: 'design@example.com', bio: 'Mechanics over graphics.' },
    { username: 'HardwareGuru', email: 'hardware@example.com', bio: 'Optimizing for the metal.' },
    { username: 'WebDev_Transition', email: 'web@example.com', bio: 'Moving from React to Unreal.' },
    { username: 'CyberSec_Dev', email: 'sec@example.com', bio: 'Secure coding practices advocate.' }
];

for(let i = 1; i <= 20; i++) {
    usersData.push({
        username: `DevUser_${i}`,
        email: `user${i}@example.com`,
        bio: `Software enthusiast #${i}`
    });
}

const topicResponses = {
    cpp: [
        "I've been testing std::expected in a high-throughput signal processing lib. The generated assembly is surprisingly clean, but you have to be careful with the error type size.",
        "Honestly, for most game logic, the overhead is negligible compared to the cache misses we get from poor data locality elsewhere.",
        "I still prefer custom Result types. std::expected is a bit too verbose for my taste, though it is a step in the right direction for the standard library.",
        "Don't forget that exceptions are actually 'free' if they aren't thrown, whereas std::expected has a small cost on every return. It's a classic space vs time trade-off.",
        "Modern compilers optimize the union inside std::expected very well. I'd worry more about your memory layout than this return type."
    ],
    ai: [
        "We tried local Llama-3-8B with 4-bit quantization. It runs at about 15 tokens/sec on a mid-range GPU, which is enough for background NPC chatter.",
        "The latency is the killer. Even with local models, you need a separate thread to avoid blocking the main render loop. Async is mandatory here.",
        "I think the real 'Knowledge Debt' is real. I've seen devs forget how to write a simple sorting algorithm because they just ask the AI every time.",
        "AI is a tool, like a debugger. If you use it to learn, it's great. If you use it to skip learning, you're building a house on sand.",
        "We're using a hybrid approach: local models for immediate feedback and cloud APIs for deeper, non-time-sensitive narrative generation."
    ],
    gamedev: [
        "ECS is great for thousands of agents, but it's overkill for a small puzzle game. Use the tool that fits the problem, not just the trendiest one.",
        "Unity DOTS has improved significantly, but the documentation is still a bit of a mess. Expect to spend a lot of time in the forums.",
        "The performance gain in my city builder was about 4x after switching to ECS, but it took three times as long to implement the features.",
        "I find that a hybrid approach works best. Use OO for UI and high-level game state, and ECS for the heavy lifting like particles and physics-less entities.",
        "Architectural complexity is 'technical debt' you pay upfront. If your simulation needs the speed, pay it. If not, stick to what's simple."
    ]
};

const questionsData = [
    {
        title: "Is C++23's 'std::expected' really a game changer for error handling in Game Dev?",
        description: "I've been using traditional error codes and exceptions in my engine. With C++23, std::expected seems to offer a functional approach. Does it actually improve performance in hot loops, or is the overhead of the union-like structure too high for real-time rendering?",
        topic: 'cpp'
    },
    {
        title: "Best practices for integrating LLMs into an NPC dialogue system?",
        description: "I want to move away from rigid dialogue trees. How are people handling the latency of API calls to GPT/Claude? Are there lightweight local models (like Llama-3-8B) that can run alongside a game loop without tanking the FPS?",
        topic: 'ai'
    },
    {
        title: "ECS vs Object-Oriented Design in large scale simulation games?",
        description: "I'm starting a city builder. Unity's DOTS seems powerful, but the boilerplate is insane compared to standard MonoBehaviours. Is the performance gain worth the architectural complexity for a 10,000+ agent simulation?",
        topic: 'gamedev'
    },
    {
        title: "How to handle memory fragmentation in long-running C++ applications?",
        description: "Our server-side simulation runs for weeks. Even with smart pointers, we see memory usage creeping up due to fragmentation. Are custom pool allocators still the gold standard in 2026, or have modern OS allocators caught up?",
        topic: 'cpp'
    },
    {
        title: "Will AI-assisted coding eventually lead to a 'Knowledge Debt' in junior developers?",
        description: "I see more juniors using Copilot to generate entire functions. It works, but they can't explain the logic. Are we sacrificing long-term architectural understanding for short-term velocity?",
        topic: 'ai'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        await UserModel.deleteMany({});
        await QuestionModel.deleteMany({});
        await AnswerModel.deleteMany({});

        const createdUsers = [];
        for (const u of usersData) {
            const user = new UserModel({
                ...u,
                password: 'password123'
            });
            await user.save();
            createdUsers.push(user);
        }
        console.log('Created 30 users.');

        for (let i = 0; i < questionsData.length; i++) {
            const qData = questionsData[i];
            const author = createdUsers[i % createdUsers.length];
            const question = new QuestionModel({
                title: qData.title,
                description: qData.description,
                author: author._id,
                views: Math.floor(Math.random() * 500)
            });
            await question.save();

            const answerCount = 5 + Math.floor(Math.random() * 4);
            const answers = [];
            const responses = topicResponses[qData.topic];

            for (let j = 0; j < answerCount; j++) {
                const respondent = createdUsers[(i + j + 1) % createdUsers.length];
                const content = responses[j % responses.length]; // Pick varied responses
                const answer = new AnswerModel({
                    content: content,
                    author: respondent._id,
                    question: question._id
                });
                await answer.save();
                answers.push(answer);
            }

            if (i % 2 === 0) {
                question.acceptedAnswer = answers[0]._id;
                answers[0].isAccepted = true;
                await answers[0].save();
                await question.save();
            }
        }

        console.log('Seed completed successfully with diverse comments.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
