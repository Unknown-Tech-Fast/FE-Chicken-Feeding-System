import { useRef, useState, type FormEvent } from "react"
import { useLocation } from "react-router-dom"
import { authError, useAuth } from "@/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const data = new FormData(event.currentTarget)
    pending.current = true
    setSubmitting(true)
    setError("")
    try {
      await login(
        String(data.get("email")).trim(),
        String(data.get("password"))
      )
    } catch (cause) {
      setError(authError(cause))
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-accent/60 px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8"
      >
        <p className="mb-6 text-sm font-semibold text-primary">
          Chicken Feeding System
        </p>
        <h1 id="login-title" className="text-2xl font-semibold">
          Masuk ke aplikasi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan email dan password akun Anda.
        </p>
        {location.state?.from && (
          <p className="mt-4 text-sm" role="status">
            Silakan masuk untuk melanjutkan ke halaman yang dituju.
          </p>
        )}
        <form
          onSubmit={submit}
          className="mt-6 space-y-5"
          aria-busy={submitting}
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={255}
              required
              disabled={submitting}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={255}
              required
              disabled={submitting}
              className="h-11"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="h-11 w-full">
            {submitting ? "Sedang masuk…" : "Masuk"}
          </Button>
        </form>
      </section>
    </main>
  )
}
