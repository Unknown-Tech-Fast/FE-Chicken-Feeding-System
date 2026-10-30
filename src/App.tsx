import { Suspense } from "react"
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AppLayout } from "@/components/app-layout"
import { ErrorBoundary } from "@/components/error-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { routes, findRouteKey } from "@/routes"
import { useAuth } from "@/auth/auth-context"
import LoginPage from "@/pages/login-page"
import { Button } from "@/components/ui/button"

function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className="space-y-3 rounded-xl border border-border/80 bg-card p-5"
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function NotFound() {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Alamat{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{pathname}</code>{" "}
        tidak tersedia.
      </p>
      <Link
        className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
        to={routes.chicken.path}
      >
        Kembali ke Transaksi Ayam
      </Link>
    </div>
  )
}

/**
 * Router generik: seluruh halaman diambil dari `routes.ts`.
 * File ini tidak perlu diubah saat menambah halaman.
 */
export function App() {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()
  const { pathname } = location

  if (loading || error)
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Button onClick={retry}>Coba lagi</Button>
          </>
        ) : (
          <p role="status">Memeriksa sesi…</p>
        )}
      </main>
    )
  if (pathname === "/login") {
    const from = location.state?.from
    const target =
      typeof from === "string" &&
      from.startsWith("/") &&
      !from.startsWith("//") &&
      !from.includes("\\") &&
      from.split(/[?#]/)[0] !== "/login"
        ? from
        : routes.chicken.path
    return user ? <Navigate to={target} replace /> : <LoginPage />
  }
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    )

  // "/" diarahkan ke halaman utama, bukan dianggap 404.
  if (pathname === "/") {
    return <Navigate to={routes.chicken.path} replace />
  }

  const routeKey = findRouteKey(pathname)

  // 404 tetap di dalam layout supaya sidebar & header tetap tampil.
  if (!routeKey) {
    return (
      <AppLayout route="chicken">
        <NotFound />
      </AppLayout>
    )
  }

  return (
    <AppLayout route={routeKey}>
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {Object.entries(routes).map(([key, route]) => {
              const Page = route.component
              return <Route key={key} path={route.path} element={<Page />} />
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  )
}
