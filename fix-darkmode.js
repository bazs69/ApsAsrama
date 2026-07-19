const fs = require('fs');
const path = require('path');

function processString(content) {
    return content.replace(/className=(["'`])([\s\S]*?)\1/g, (match, quote, classes) => {
        let newClasses = classes;

        // Add dark modes only if not already present
        function replace(regex, replacement) {
            if (newClasses.match(regex)) {
                const darkStr = replacement.split(' ')[1];
                if (!newClasses.includes(darkStr) && !newClasses.includes('dark:bg-') && !newClasses.includes('dark:border-') && !newClasses.includes('dark:text-')) {
                    newClasses = newClasses.replace(regex, replacement);
                } else if (!newClasses.includes('dark:bg-') || !newClasses.includes('dark:text-')) {
                    // just do strict replacement
                    newClasses = newClasses.replace(regex, replacement);
                }
            }
        }

        newClasses = newClasses.replace(/\bbg-white\b/g, 'bg-white dark:bg-zinc-900');
        newClasses = newClasses.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-zinc-800');
        newClasses = newClasses.replace(/\bbg-slate-100\b/g, 'bg-slate-100 dark:bg-zinc-800');

        newClasses = newClasses.replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-zinc-700');
        newClasses = newClasses.replace(/\bborder-slate-100\b/g, 'border-slate-100 dark:border-zinc-800');
        newClasses = newClasses.replace(/\bborder-slate-300\b/g, 'border-slate-300 dark:border-zinc-600');

        newClasses = newClasses.replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-zinc-100');
        newClasses = newClasses.replace(/\btext-slate-700\b/g, 'text-slate-700 dark:text-zinc-200');
        newClasses = newClasses.replace(/\btext-slate-600\b/g, 'text-slate-600 dark:text-zinc-300');
        newClasses = newClasses.replace(/\btext-slate-500\b/g, 'text-slate-500 dark:text-zinc-400');
        newClasses = newClasses.replace(/\btext-slate-400\b/g, 'text-slate-400 dark:text-zinc-500');

        // deduplicate slightly
        const dedup = Array.from(new Set(newClasses.split(/\s+/))).join(' ').trim();

        return `className=${quote}${dedup}${quote}`;
    });
}

function replaceFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Check if it has suspicious unhandled bg-white or bg-slate
    if (content.includes('bg-white') || content.includes('bg-slate-50')) {
        const newContent = processString(content);
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log('Updated', filePath);
        }
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'beranda') continue; // I did beranda manually
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceFile(fullPath);
        }
    }
}

processDir('d:\\\\ApsAsrama\\\\src\\\\components\\\\dashboard');
processDir('d:\\\\ApsAsrama\\\\src\\\\app\\\\dashboard');
