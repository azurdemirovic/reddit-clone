require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./models/userModel');
const QuestionModel = require('./models/questionModel');
const AnswerModel = require('./models/answerModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/qa_app';

const topics = [
    {
        name: 'Kernel Dev',
        questions: [
            "Strategies for minimizing context switches in high-frequency trading systems?",
            "Handling race conditions in custom Linux kernel modules.",
            "eBPF vs traditional socket filtering: performance benchmarks.",
            "Memory management in hobbyist OS kernels: where to start?",
            "Implementing a custom scheduler for real-time constraints."
        ],
        comments: [
            "Interrupt handling is where most devs fail. You need to keep the ISR as short as possible.",
            "Have you looked into lock-less data structures for your ring buffer?",
            "Context switches are the silent killer of throughput. Aim for core pinning.",
            "Cache locality in kernel space is often overlooked but provides the biggest gains.",
            "The complexity of eBPF is worth it for the safety alone, let alone the speed.",
            "Avoid allocations in the hot path. Pre-allocate your pools during init.",
            "Check the memory barriers. ARM and x86 behave very differently here.",
            "Spin-locks vs Mutexes: in a kernel, the choice depends entirely on the IRQ level.",
            "Properly documenting your memory map is the first step to a stable OS.",
            "Tracing with Ftrace helps visualize where the latency spikes are coming from."
        ]
    },
    {
        name: 'Graphics & Vulkan',
        questions: [
            "Managing descriptor sets efficiently in large scenes.",
            "Implementing Ray Traced Global Illumination in Vulkan.",
            "Pipeline barriers: how much synchronization is too much?",
            "Porting a DX11 engine to Vulkan 1.3: common pitfalls.",
            "Optimizing memory aliasing for transient textures."
        ],
        comments: [
            "Don't over-synchronize. Validation layers are your best friend for catching hazards.",
            "Descriptor indexing (bindless) is the way to go for modern rendering.",
            "The memory management in Vulkan is manual for a reason. Use VMA if you want to stay sane.",
            "RTXDI is incredible but the denoising pass is where the real work happens.",
            "Check your subpass dependencies. Proper tiling can save a lot of bandwidth.",
            "Transient attachments with lazily allocated memory are a huge win on mobile GPUs.",
            "Mesh shaders are finally becoming viable. Say goodbye to the vertex fetcher.",
            "Pipeline cache serialization can significantly reduce stuttering on first load.",
            "Mind the alignment requirements for your UBOs and SSBOs.",
            "HLSL to SPIR-V path is much better than it used to be. Stick with DXC."
        ]
    },
    {
        name: 'Rust & Safety',
        questions: [
            "Is the 'unsafe' escape hatch used too frequently in low-level Rust?",
            "Implementing a lock-free concurrent hash map in Rust.",
            "Rust vs Zig for embedded systems: a critical comparison.",
            "How to handle circular references without leaking memory in Rust?",
            "The cost of abstraction: Zero-cost iterators vs manual loops."
        ],
        comments: [
            "Borrow checker is a mentor, not an enemy. Once you internalize it, you code faster.",
            "Arc<Mutex<T>> is fine for slow paths, but look at crossbeam for high performance.",
            "Zig's comptime is powerful, but Rust's trait system offers better architectural scaling.",
            "Unsafe is fine if you can prove the invariants. That's the whole point of the language.",
            "Pinning in async Rust is still one of the hardest concepts for newcomers.",
            "GATs (Generic Associated Types) finally solved so many patterns we were missing.",
            "If you're using too many RefCells, your architecture might need a rethink.",
            "The ecosystem for embedded Rust is maturing rapidly. No-std is very usable now.",
            "Cargo is the gold standard for build systems. I wish every language had it.",
            "Memory safety without a GC is the biggest leap in systems programming in decades."
        ]
    },
    {
        name: 'WebAssembly',
        questions: [
            "Performance overhead of WASM-JS interop in 2026.",
            "Running complex physics engines in the browser via WASM.",
            "WASI: Is the 'write once, run anywhere' dream finally real?",
            "Debugging multi-threaded WASM modules in Chrome DevTools.",
            "Optimizing binary size for fast initial load in web games."
        ],
        comments: [
            "WASM threads are great, but shared memory management is still tricky.",
            "SIMD in WASM provides a massive boost for DSP and image processing.",
            "The boundary crossing is getting cheaper, but you should still batch your calls.",
            "Wasmtime is an incredible runtime for server-side WASM.",
            "We ported our entire C++ engine with Emscripten. It 'just worked' after some tweaking.",
            "Initial download size is everything for web engagement. Use Brotli.",
            "Linear memory is a flat array. Use it wisely to avoid fragmentation.",
            "WASI is the future of serverless. Cold starts are practically non-existent.",
            "JavaScript is becoming the 'glue' for heavy WASM modules.",
            "Component Model is the next big step for WASM interoperability."
        ]
    }
];

async function seedMassive() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Massive seed started...');

        // Clear only questions and answers to keep the 30 users
        await QuestionModel.deleteMany({});
        await AnswerModel.deleteMany({});

        const users = await UserModel.find({});
        if (users.length === 0) {
            console.error('No users found. Please run seed.js first.');
            process.exit(1);
        }

        for (let i = 1; i <= 100; i++) {
            const topic = topics[i % topics.length];
            const author = users[Math.floor(Math.random() * users.length)];
            const questionTitle = topic.questions[i % topic.questions.length];
            
            const question = new QuestionModel({
                title: questionTitle,
                description: `This is an in-depth discussion about ${topic.name}. Let's discuss the architectural implications and performance trade-offs in modern systems. We are looking for expert opinions on this topic.`,
                author: author._id,
                views: Math.floor(Math.random() * 2000),
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
            });
            await question.save();

            // Generate 20 answers
            const answers = [];
            for (let j = 0; j < 20; j++) {
                const respondent = users[(i + j) % users.length];
                const baseComment = topic.comments[j % topic.comments.length];
                const variation = [
                    "Furthermore, I've noticed that ",
                    "Interestingly, ",
                    "In my experience, ",
                    "One thing to consider is that ",
                    "I disagree slightly because "
                ][j % 5];

                const answer = new AnswerModel({
                    content: `${variation}${baseComment.toLowerCase()}`,
                    author: respondent._id,
                    question: question._id,
                    createdAt: new Date(question.createdAt.getTime() + (j + 1) * 3600000)
                });
                await answer.save();
                answers.push(answer);
            }

            // Accept one random answer for 50% of questions
            if (Math.random() > 0.5) {
                const acceptedIdx = Math.floor(Math.random() * answers.length);
                question.acceptedAnswer = answers[acceptedIdx]._id;
                answers[acceptedIdx].isAccepted = true;
                await answers[acceptedIdx].save();
                await question.save();
            }

            if (i % 10 === 0) console.log(`Generated ${i} threads...`);
        }

        console.log('Massive seed completed. 100 threads with 20 comments each created.');
        process.exit(0);
    } catch (err) {
        console.error('Massive seed error:', err);
        process.exit(1);
    }
}

seedMassive();
