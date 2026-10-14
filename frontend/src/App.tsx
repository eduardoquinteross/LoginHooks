import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { authApi, type AuthUser } from "./api/auth";

type AuthMode = "login" | "register";

function AuthForm({
  mode,
  onAuthenticated,
}: {
  mode: AuthMode;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const user = isRegister
        ? await authApi.register(email, password)
        : await authApi.login(email, password);
      setSuccess(isRegister ? "Tu cuenta se creó correctamente." : "Has iniciado sesión.");
      onAuthenticated(user);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo completar la solicitud.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark" aria-hidden="true">S</div>
        <p className="eyebrow">ESPACIO PERSONAL</p>
        <h1 id="auth-title">{isRegister ? "Crea tu cuenta" : "Qué bueno verte"}</h1>
        <p className="subtitle">
          {isRegister
            ? "Regístrate para acceder a tu espacio seguro."
            : "Inicia sesión para continuar de forma segura."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 12 : undefined}
            maxLength={72}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isRegister ? "Al menos 12 caracteres" : "Tu contraseña"}
          />

          {error && <p className="notice error" role="alert">{error}</p>}
          {success && <p className="notice success" role="status">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <p className="switch-mode">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </section>
    </main>
  );
}

function AuthPage({
  mode,
  onAuthenticated,
}: {
  mode: AuthMode;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const navigate = useNavigate();

  return (
    <AuthForm
      mode={mode}
      onAuthenticated={(user) => {
        onAuthenticated(user);
        navigate("/dashboard", { replace: true });
      }}
    />
  );
}

function Dashboard({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => Promise<void>;
}) {
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    try {
      await onLogout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "No se pudo cerrar sesión.");
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card dashboard-card">
        <div className="brand-mark" aria-hidden="true">S</div>
        <p className="eyebrow">SESIÓN PROTEGIDA</p>
        <h1>Bienvenido</h1>
        <p className="subtitle">Has iniciado sesión como {user.email}.</p>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button type="button" onClick={handleLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (active) {
          setSessionError(
            error instanceof Error ? error.message : "No se pudo comprobar la sesión.",
          );
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await authApi.logout();
    setUser(null);
    navigate("/login", { replace: true });
  }

  if (checkingSession) {
    return <main className="loading-screen" role="status">Comprobando sesión...</main>;
  }

  if (sessionError) {
    return <main className="loading-screen notice error" role="alert">{sessionError}</main>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" onAuthenticated={setUser} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage mode="register" onAuthenticated={setUser} />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
