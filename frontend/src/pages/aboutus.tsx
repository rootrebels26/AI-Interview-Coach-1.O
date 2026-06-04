// About page describing the AI Interview Coach product.
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    FileText,
    Lightbulb,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';

const storySections = [
    {
        icon: Lightbulb,
        title: 'The Spark.',
        text: 'AI Interview Coach started with a simple observation: talented people often know their craft, but interviews and resume screens do not always show their real ability. We wanted to make career preparation feel clearer, calmer, and more personal.',
    },
    {
        icon: Target,
        title: 'The Reality Check.',
        text: 'Job hunting can become a cycle of applications, silence, and second guessing. Our platform helps learners and professionals practice answers, sharpen resumes, and understand what to improve before the real interview begins.',
    },
    {
        icon: Sparkles,
        title: 'Our Mission Takes Shape.',
        text: 'We are building tools that help people show their strengths with confidence. From AI interview practice to ATS resume feedback, every feature is designed to turn preparation into progress.',
    },
    {
        icon: ShieldCheck,
        title: 'More Than Just a Tool.',
        text: 'Behind every resume is a person with goals, pressure, and potential. AI Interview Coach is made to be a practical career partner, not a shortcut: honest feedback, useful practice, and room to grow.',
    },
];

const team = [
    { name: 'Career Strategists', role: 'Interview coaching and job-readiness guidance' },
    { name: 'AI Engineers', role: 'Question generation, feedback, and scoring systems' },
    { name: 'Product Designers', role: 'Simple workflows for stressful career moments' },
    { name: 'Student Mentors', role: 'Real preparation insights from learners and applicants' },
];

const steps = [
    {
        icon: Users,
        step: 'Step 1:',
        title: 'Choose your path',
        text: 'Select the role or subject you want to practice for and start with questions that match your goal.',
    },
    {
        icon: BriefcaseBusiness,
        step: 'Step 2:',
        title: 'Practice like it is real',
        text: 'Answer interview questions, speak naturally, and get feedback that helps you improve your clarity and confidence.',
    },
    {
        icon: FileText,
        step: 'Step 3:',
        title: 'Polish your resume',
        text: 'Use ATS resume insights to spot weak areas and make your application easier for recruiters to understand.',
    },
];

const faqs = [
    {
        question: 'Why do I need interview practice if I already know the subject?',
        answer: 'Knowing the subject and explaining it under pressure are different skills. Practice helps you organize your thoughts, reduce hesitation, and answer with examples that feel polished.',
    },
    {
        question: 'Does the AI create fake answers for me?',
        answer: 'No. The goal is to help you express your real experience better. The feedback focuses on structure, clarity, relevance, and confidence.',
    },
    {
        question: 'Can I use this for different careers or subjects?',
        answer: 'Yes. The app supports flexible practice paths, so you can prepare for technical roles, general interviews, resume screening, and more.',
    },
    {
        question: 'Is my resume checked for ATS compatibility?',
        answer: 'Yes. The resume checker looks for common ATS-friendly signals and gives practical suggestions to improve readability and keyword alignment.',
    },
];

const AboutUs = () => {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_25%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_25%)]" />

            <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 sm:py-20">
                <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">
                            About AI Interview Coach
                        </p>
                        <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                            We believe preparation should make every candidate feel seen.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                            Hey there. We built AI Interview Coach for students, freshers, and professionals who have the potential, but need a smarter way to practice interviews and improve applications before the opportunity arrives.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                                Start your journey
                                <ArrowRight size={18} />
                            </Link>
                            <Link to="/subject-selection" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-500">
                                Practice interview
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                        <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="AI Interview Coach logo" className="h-14 w-14 rounded-2xl object-cover" />
                                <div>
                                    <p className="text-sm text-slate-300">Career confidence platform</p>
                                    <p className="text-xl font-bold">AI Interview Coach</p>
                                </div>
                            </div>
                            <div className="mt-8 grid gap-3">
                                {['Real-time interview practice', 'ATS resume feedback', 'Actionable improvement notes'].map((item) => (
                                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                                        <CheckCircle2 className="text-sky-300" size={20} />
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="mt-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            Built for better answers, stronger resumes, and calmer interviews.
                        </p>
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                    {storySections.map(({ icon: Icon, title, text }) => (
                        <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                <Icon size={24} />
                            </div>
                            <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">{title}</h2>
                            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{text}</p>
                        </article>
                    ))}
                </section>

                <section>
                    <div className="max-w-3xl">
                        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">The Team</p>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                            A team focused on the human side of hiring.
                        </h2>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {team.map((member) => (
                            <div key={member.name} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-extrabold text-slate-950 dark:bg-slate-800 dark:text-white">
                                    {member.name.charAt(0)}
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{member.name}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-8">
                    <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">How it works?</p>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                        Better applications in three focused steps.
                    </h2>
                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {steps.map(({ icon: Icon, step, title, text }) => (
                            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                                <Icon className="text-sky-600 dark:text-sky-300" size={28} />
                                <p className="mt-5 text-sm font-extrabold text-slate-950 dark:text-white">{step}</p>
                                <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
                                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">FAQ</p>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                            Questions candidates ask before they begin.
                        </h2>
                    </div>
                    <div className="grid gap-4">
                        {faqs.map((faq) => (
                            <details key={faq.question} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <summary className="cursor-pointer list-none text-lg font-bold text-slate-950 dark:text-white">
                                    {faq.question}
                                </summary>
                                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/40 dark:bg-white dark:text-slate-950 dark:shadow-black/20 sm:p-10">
                    <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_auto]">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your confidence begins here.</h2>
                            <p className="mt-4 max-w-2xl text-slate-300 dark:text-slate-600">
                                Practice with purpose, improve your resume, and walk into your next interview with a clearer story.
                            </p>
                        </div>
                        <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
                            Get Started Now
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;
