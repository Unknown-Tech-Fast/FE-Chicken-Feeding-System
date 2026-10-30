import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import axios from "axios"
import {
  axiosInstance,
  extractMessage,
  setSessionExpiredHandler,
  tokenStorage,
} from "@/utils/api/http"
import { STORAGE_KEYS } from "@/utils/api/config"

type User = { id: number; name: string; email: string; role: string }
type Session = { data: { user: User } }
type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  retry: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function authError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi."
    if (error.response.status === 429)
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
    return extractMessage(error)
  }
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setSessionExpiredHandler(() => {
      setUser(null)
      setError(null)
    })
    async function restore() {
      const token = tokenStorage.get()
      try {
        if (token) {
          const response = await axiosInstance.get<Session>("auth/me", {
            signal: controller.signal,
          })
          if (!controller.signal.aborted && tokenStorage.get() === token)
            setUser(response.data.data.user)
        }
      } catch (cause) {
        if (
          !controller.signal.aborted &&
          !(axios.isAxiosError(cause) && cause.response?.status === 401)
        ) {
          setError(authError(cause))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void restore()
    const sync = (event: StorageEvent) => {
      if (
        event.storageArea === localStorage &&
        (event.key === STORAGE_KEYS.token || event.key === null)
      ) {
        window.location.reload()
      }
    }
    window.addEventListener("storage", sync)
    return () => {
      controller.abort()
      setSessionExpiredHandler(null)
      window.removeEventListener("storage", sync)
    }
  }, [attempt])

  async function login(email: string, password: string) {
    const response = await axiosInstance.post<Session & { token: string }>(
      "auth/login",
      {
        email,
        password,
        device_name: "chicken-project-fe",
      }
    )
    tokenStorage.set(response.data.token)
    setUser(response.data.data.user)
    setError(null)
  }

  async function logout() {
    try {
      await axiosInstance.post("auth/logout")
    } catch (cause) {
      if (!(axios.isAxiosError(cause) && cause.response?.status === 401))
        throw cause
    }
    tokenStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        retry: () => {
          setError(null)
          setLoading(true)
          setAttempt((value) => value + 1)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider")
  return context
}
