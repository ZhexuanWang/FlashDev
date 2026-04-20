import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TeamMember } from '../types/team'

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/team')
            .then(r => r.json())
            .then(setMembers)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-[#000508] text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800/60 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/home')}
                    className="text-sky-600 hover:text-brand font-mono text-xs tracking-widest transition-colors"
                >
                    ← HOME
                </button>
                <h1 className="text-slate-300 font-mono text-sm tracking-[0.2em] uppercase">
                    Team
                </h1>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-14">
                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-slate-800" />
                                <div className="h-4 w-28 bg-slate-800 rounded" />
                                <div className="h-3 w-20 bg-slate-700 rounded" />
                                <div className="h-3 w-full bg-slate-800 rounded" />
                                <div className="h-3 w-5/6 bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && members.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">No team members yet</p>
                    </div>
                )}

                {/* Members grid */}
                {!loading && members.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {members.map(member => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function MemberCard({ member }: { member: TeamMember }) {
    const name   = member.name.zh
    const role   = member.role.zh
    const bio    = member.bio.zh
    const initials = name.slice(0, 2)

    return (
        <div className="flex flex-col items-center text-center gap-4 group">
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden
                      border-2 border-slate-800 group-hover:border-sky-800
                      transition-colors duration-300">
                {member.avatar ? (
                    <img
                        src={member.avatar}
                        alt={name}
                        width={96} height={96}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center
                          text-sky-600/60 font-mono text-lg">
                        {initials}
                    </div>
                )}

                {/* Glow ring on hover */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
                        transition-opacity duration-300
                        shadow-[inset_0_0_12px_rgba(14,165,233,0.2)]" />
            </div>

            {/* Name */}
            <div>
                <h3 className="text-slate-100 font-semibold text-base">{name}</h3>
                <p className="text-sky-500/70 font-mono text-xs mt-0.5 tracking-wide">{role}</p>
            </div>

            {/* Bio */}
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-4 max-w-[24ch]">
                {bio}
            </p>

            {/* GitHub link */}
            {member.github && (
                <a
                    href={`https://github.com/${member.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-brand font-mono text-xs
                     transition-colors duration-200 flex items-center gap-1.5"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    @{member.github}
                </a>
            )}
        </div>
    )
}