const fs = require('fs');
const path = require('path');

function fixFile(file) {
    let originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;

    const replaceMap = [
        [/bg-white(?! dark:bg-zinc)/g, 'bg-white dark:bg-zinc-900'],
        [/bg-slate-50(?! dark:bg-zinc)/g, 'bg-slate-50 dark:bg-zinc-800/80'],
        [/bg-slate-100(?! dark:bg-zinc)/g, 'bg-slate-100 dark:bg-zinc-800'],
        [/border-slate-200(?! dark:border-zinc)/g, 'border-slate-200 dark:border-zinc-700'],
        [/border-slate-100(?! dark:border-zinc)/g, 'border-slate-100 dark:border-zinc-800'],
        [/border-slate-300(?! dark:border-zinc)/g, 'border-slate-300 dark:border-zinc-600'],
        [/text-slate-800(?! dark:text-zinc)/g, 'text-slate-800 dark:text-zinc-100'],
        [/text-slate-700(?! dark:text-zinc)/g, 'text-slate-700 dark:text-zinc-200'],
        [/text-slate-600(?! dark:text-zinc)/g, 'text-slate-600 dark:text-zinc-300'],
        [/text-slate-500(?! dark:text-zinc)/g, 'text-slate-500 dark:text-zinc-400'],
        [/text-slate-400(?! dark:text-zinc)/g, 'text-slate-400 dark:text-zinc-500'],
        [/bg-red-50(?! dark:bg-red)/g, 'bg-red-50 dark:bg-red-900/20'],
        [/bg-emerald-50(?! dark:bg-emerald)/g, 'bg-emerald-50 dark:bg-emerald-900/20'],
        [/bg-amber-50(?! dark:bg-amber|\/)/g, 'bg-amber-50 dark:bg-amber-900/10'],
        [/border-emerald-200(?! dark:border-emerald)/g, 'border-emerald-200 dark:border-emerald-800/30'],
    ];

    replaceMap.forEach(([regex, replacement]) => {
        // Only target those inside className strings if possible, 
        // but a global replace is acceptable here for Tailwind tokens
        content = content.replace(regex, replacement);
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'beranda') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            fixFile(fullPath);
        }
    }
}

traverseDir('src/components/dashboard');
traverseDir('src/app/dashboard');
console.log('All files processed.');
