import { useRef, useState } from "react"
import { authError, useAuth } from "@/auth/auth-context"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ComputerIcon,
  DarkModeIcon,
  Logout01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"

import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: DarkModeIcon },
  { value: "system", label: "System", icon: ComputerIcon },
] as const

export function UserMenu() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const pending = useRef(false)
  const initials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "?"

  async function handleLogout() {
    if (pending.current) return
    pending.current = true
    setLoggingOut(true)
    setError("")
    try {
      await logout()
    } catch (cause) {
      setError(authError(cause))
    } finally {
      pending.current = false
      setLoggingOut(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Buka menu pengguna"
              className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-accent text-xs font-semibold text-primary transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none"
            />
          }
        >
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-[20rem] max-w-[calc(100vw-1rem)] rounded-2xl border-border p-3 shadow-lg shadow-foreground/5"
        >
          <div className="flex items-center gap-3 rounded-xl bg-accent/70 px-3 py-4">
            <Avatar size="lg" className="size-11">
              <AvatarFallback className="bg-card text-sm font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          <div className="px-1 pt-4 pb-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium text-muted-foreground">
                Tema Aplikasi
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const active = theme === option.value

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    aria-pressed={active}
                    onClick={() => setTheme(option.value)}
                    className={`h-16 flex-col gap-1.5 rounded-xl px-2 shadow-none transition-colors duration-200 motion-reduce:transition-none ${active ? "border-primary bg-accent text-primary" : "text-muted-foreground"}`}
                  >
                    <HugeiconsIcon
                      icon={option.icon}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="border-t pt-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center gap-2 rounded-full shadow-none"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              {loggingOut ? "Sedang keluar…" : "Logout"}
            </Button>
            {error && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
