const fs = require('fs');

const file = 'src/components/dashboard/santri/wizard/SantriWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard colors with dark mode variants
content = content.replace(/\bbg-white\b/g, 'bg-white dark:bg-zinc-900')
    .replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-zinc-800/80')
    .replace(/\bbg-slate-100\b/g, 'bg-slate-100 dark:bg-zinc-800')
    .replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-zinc-700/80')
    .replace(/\bborder-slate-100\b/g, 'border-slate-100 dark:border-zinc-800')
    .replace(/\bborder-slate-300\b/g, 'border-slate-300 dark:border-zinc-600')
    .replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-zinc-100')
    .replace(/\btext-slate-700\b/g, 'text-slate-700 dark:text-zinc-200')
    .replace(/\btext-slate-600\b/g, 'text-slate-600 dark:text-zinc-300')
    .replace(/\btext-slate-500\b/g, 'text-slate-500 dark:text-zinc-400')
    .replace(/\btext-slate-400\b/g, 'text-slate-400 dark:text-zinc-500')
    .replace(/\bbg-red-50\b/g, 'bg-red-50 dark:bg-red-900/20')
    .replace(/\bbg-emerald-50\b/g, 'bg-emerald-50 dark:bg-emerald-900/20')
    .replace(/\bbg-amber-50\/50\b/g, 'bg-amber-50/50 dark:bg-amber-900/10')
    .replace(/\border-emerald-200\b/g, 'border-emerald-200 dark:border-emerald-800/30');

// Avoid duplication if they were run multiple times. Since it's naive string replace, let's fix naive deduplication just in case
content = content.replace(/dark:bg-zinc-900 dark:bg-zinc-900/g, 'dark:bg-zinc-900')
    .replace(/dark:text-zinc-100 dark:text-zinc-100/g, 'dark:text-zinc-100')
    .replace(/dark:bg-zinc-800\/80 dark:bg-zinc-800\/80/g, 'dark:bg-zinc-800/80')
    // and others ...
    ;

fs.writeFileSync(file, content, 'utf8');
console.log('SantriWizard.tsx updated successfully.');
