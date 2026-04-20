import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type Mode = 'login' | 'register'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [mode,     setMode]     = useState<Mode>('login')
    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [status,   setStatus]   = useState<'idle' | 'loading' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setErrorMsg('')

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'

        try {
            const res  = await fetch(endpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    Array.isArray(data?.message)
                        ? data.message.join(', ')
                        : data?.message ?? '请求失败'
                )
            }

            if (mode === 'login') {
                // ✅ 改成对象形式，加上 userId 和 permissions
                login({
                    token:       data.access_token,
                    role:        data.role,
                    userId:      data.userId,
                    permissions: data.permissions ?? {},
                })
                navigate('/home')
            } else {
                setMode('login')
                setPassword('')
                setErrorMsg('')
                setStatus('idle')
                return
            }
        } catch (err) {
            setStatus('error')
            setErrorMsg(err instanceof Error ? err.message : '未知错误')
            return
        }

        setStatus('idle')
    }

    return (
        <div className="min-h-screen bg-[#000508] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                {/* Logo / 标题 */}
                <div className="text-center mb-10">
                    <div className="text-brand font-mono text-2xl tracking-[0.3em] mb-1">
                        ⚡ FLASHDEV
                    </div>
                    <p className="text-slate-600 font-mono text-xs tracking-widest">
                        {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="your@email.com"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                         text-slate-200 text-sm font-mono placeholder:text-slate-600
                         focus:outline-none focus:border-sky-700 transition-all duration-200"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            placeholder="••••••••"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                         text-slate-200 text-sm font-mono placeholder:text-slate-600
                         focus:outline-none focus:border-sky-700 transition-all duration-200"
                        />
                    </div>

                    {/* Error */}
                    {status === 'error' && (
                        <p className="text-red-500/80 font-mono text-xs border border-red-900/50
                          rounded px-3 py-2 bg-red-950/20">
                            ✕ {errorMsg}
                        </p>
                    )}

                    {/* 注册成功提示 */}
                    {mode === 'login' && status === 'idle' && !errorMsg && (
                        <div />
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-3 bg-sky-900/30 border border-sky-700 text-brand
                       font-mono text-sm tracking-widest rounded
                       hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-200
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
                    >
                        {status === 'loading' ? (
                            <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-sky-400 border-t-transparent
                                 rounded-full animate-spin" />
                                {mode === 'login' ? '登录中...' : '注册中...'}
              </span>
                        ) : (
                            mode === 'login' ? 'SIGN IN ⚡' : 'REGISTER'
                        )}
                    </button>
                </form>

                {/* 切换登录/注册 */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login')
                            setErrorMsg('')
                            setStatus('idle')
                        }}
                        className="text-slate-600 hover:text-sky-500 font-mono text-xs transition-colors"
                    >
                        {mode === 'login'
                            ? '没有账号？注册'
                            : '已有账号？登录'}
                    </button>
                </div>

                {/* 返回首页 */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/home')}
                        className="text-slate-700 hover:text-slate-500 font-mono text-xs transition-colors"
                    >
                        ← 返回首页
                    </button>
                </div>

            </div>
        </div>
    )
}