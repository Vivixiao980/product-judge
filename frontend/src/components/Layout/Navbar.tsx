'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { MessageSquare, Library, Sparkles } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { name: '对话', href: '/chat', icon: MessageSquare },
        { name: '探索', href: '/explore', icon: Library },
    ];

    const sideItems = [
        { name: '反馈', href: '/feedback', icon: Sparkles },
    ];

    return (
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white transistion-transform group-hover:scale-105">
                        <Sparkles size={18} fill="currentColor" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-gray-900">
                        Product<span className="text-gray-500 font-normal">Think</span>
                    </span>
                </Link>

                {/* Navigation */}
                <div className="flex items-center bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                                )}
                            >
                                <Icon size={16} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Side actions */}
                <div className="flex items-center gap-2">
                    {sideItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                                    isActive
                                        ? "bg-black text-white border-black"
                                        : "text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-400"
                                )}
                            >
                                <Icon size={16} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
