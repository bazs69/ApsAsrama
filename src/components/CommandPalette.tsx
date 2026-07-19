'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Home, Key, LogOut, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function CommandPalette({ userRole }: { userRole?: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle open state on Ctrl+K or Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Auto-focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    const navigateTo = (path: string) => {
        setOpen(false);
        setQuery('');
        router.push(path);
    };

    const handleSignOut = () => {
        setOpen(false);
        signOut({ callbackUrl: '/login' });
    };

    // Mocked actions, these could be generated dynamically based on role
    const actions = [
        { id: 1, name: 'Beranda', icon: Home, onSelect: () => navigateTo('/dashboard') },
        { id: 2, name: 'Manajemen Santri', icon: User, onSelect: () => navigateTo('/dashboard/satker-santri') },
        { id: 3, name: 'Pengaturan Akun', icon: Settings, onSelect: () => navigateTo('/dashboard/settings') },
        { id: 4, name: 'Data Kamar', icon: Key, onSelect: () => navigateTo('/dashboard/rooms') },
        { id: 5, name: 'Logout', icon: LogOut, onSelect: handleSignOut },
    ];

    const filteredActions = query === ''
        ? actions
        : actions.filter((action) => action.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] sm:pt-[25vh]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Palette Modal */}
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all m-4">
                <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
                    <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-0 px-4 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none sm:text-sm font-medium"
                        placeholder="Ketik perintah atau cari menu..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="text-xs text-zinc-400 dark:text-zinc-600 font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                        ESC
                    </div>
                </div>

                <ul className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredActions.length === 0 ? (
                        <li className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Tidak ada hasil yang ditemukan.
                        </li>
                    ) : (
                        filteredActions.map((action) => (
                            <li
                                key={action.id}
                                onClick={action.onSelect}
                                className="group flex cursor-pointer select-none items-center rounded-xl p-3 hover:bg-success-50 dark:hover:bg-zinc-800/50 hover:text-success-600 dark:hover:text-success-400 transition-colors duration-200"
                            >
                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800/80 group-hover:bg-white dark:group-hover:bg-zinc-700/50">
                                    <action.icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400 group-hover:text-success-500" />
                                </div>
                                <div className="ml-4 flex-auto">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-success-700 dark:group-hover:text-success-400">
                                        {action.name}
                                    </p>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 sm:px-6">
                    <span className="text-xs text-zinc-500">
                        Gunakan panah untuk navigasi (segera hadir), Enter untuk memilih
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">SPThree</span>
                </div>
            </div>
        </div>
    );
}
