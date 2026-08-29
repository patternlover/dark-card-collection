"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Reveal } from "@/components/ui/Reveal"
import { Breadcrumb } from "@/components/ui/Breadcrumb"

export default function LoginPage() {
  const { login, customer, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && customer) router.replace("/account")
  }, [loading, customer, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      await login(email, password)
      router.push("/account")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login non riuscito")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <Breadcrumb
          className="mb-6"
          items={[{ label: "Home", href: "/" }, { label: "Accedi" }]}
        />
        <Reveal>
          <h1 className="mb-6 text-3xl font-black uppercase tracking-tight text-white">
            Accedi
          </h1>
        </Reveal>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-4 border-2 border-zinc-700 bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_#27272a]"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-zinc-700 bg-black px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-zinc-700 bg-black px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {busy ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Non hai un account?{" "}
          <Link href="/account/register" className="text-[var(--accent)] hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  )
}