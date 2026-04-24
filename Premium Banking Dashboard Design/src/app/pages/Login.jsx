import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth.jsx";
import { FALLBACK_MANAGERS } from "../lib/managers";
import { useUIPreferences } from "../lib/ui-preferences.jsx";
import loginHero from "../../assets/login-hero.png";

const LOGIN_MEMORY_KEY = "synerg-login-memory";

function LoginTransitionOverlay({ active }) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[140] flex items-center justify-center bg-white transition-opacity duration-500 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E60028]/15 border-t-[#E60028]" />
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
          Connexion securisee
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { animationsEnabled } = useUIPreferences();

  const [formValues, setFormValues] = useState({
    email: "",
    managerName: FALLBACK_MANAGERS[0] || "",
    password: "",
  });
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [managerOptions, setManagerOptions] = useState(FALLBACK_MANAGERS);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedMemory = window.localStorage.getItem(LOGIN_MEMORY_KEY);
      if (!storedMemory) {
        return;
      }

      const parsedMemory = JSON.parse(storedMemory);
      setFormValues((current) => ({
        ...current,
        email: parsedMemory.email || current.email,
        managerName: parsedMemory.managerName || current.managerName,
      }));
      setRememberCredentials(Boolean(parsedMemory.rememberCredentials));
    } catch {
      window.localStorage.removeItem(LOGIN_MEMORY_KEY);
    }
  }, []);

  function updateField(field) {
    return (event) => {
      setFormValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formValues.email || !formValues.password || !formValues.managerName) {
      toast.error("Saisissez votre email, votre mot de passe et votre gestionnaire.");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450);
    });

    if (animationsEnabled) {
      setShowTransition(true);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 650);
      });
    }

    if (typeof window !== "undefined") {
      if (rememberCredentials) {
        window.localStorage.setItem(
          LOGIN_MEMORY_KEY,
          JSON.stringify({
            email: formValues.email.trim(),
            managerName: formValues.managerName,
            rememberCredentials: true,
          }),
        );
      } else {
        window.localStorage.removeItem(LOGIN_MEMORY_KEY);
      }
    }

    login(formValues.email.trim(), { managerName: formValues.managerName });
    navigate(redirectTo, { replace: true });
  }

  return (
    <>
      <div className="grid min-h-screen bg-white lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-4">
              <BrandLogo imageClassName="h-14 w-auto" />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111827]">
                  Espace securise
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                Bienvenue sur SynerG
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Connectez-vous a votre espace commercial pour piloter votre portefeuille
                et consulter la fiche client 360.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#111827]">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    autoComplete="email"
                    className="h-12 rounded-xl border-slate-200 pl-11 focus-visible:border-[#E60028] focus-visible:ring-[#E60028]"
                    onChange={updateField("email")}
                    placeholder="gestionnaire@sga.dz"
                    type="email"
                    value={formValues.email}
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#111827]">Gestionnaire</span>
                <select
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#E60028] focus:ring-2 focus:ring-[#E60028]"
                  onChange={updateField("managerName")}
                  value={formValues.managerName}
                >
                  <option value="">
                    Selectionnez un gestionnaire
                  </option>
                  {managerOptions.map((managerName) => (
                    <option key={managerName} value={managerName}>
                      {managerName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#111827]">Mot de passe</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-slate-200 pl-11 pr-12 focus-visible:border-[#E60028] focus-visible:ring-[#E60028]"
                    onChange={updateField("password")}
                    placeholder="••••••••••••"
                    type={showPassword ? "text" : "password"}
                    value={formValues.password}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#111827]"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Checkbox
                  checked={rememberCredentials}
                  className="border-slate-300 data-[state=checked]:border-[#E60028] data-[state=checked]:bg-[#E60028] data-[state=checked]:text-white"
                  onCheckedChange={(checked) => setRememberCredentials(Boolean(checked))}
                />
                <span className="text-sm font-medium text-[#111827]">
                  Se souvenir de mes identifiants
                </span>
              </label>

              <Button
                className="h-12 w-full rounded-xl bg-[#E60028] text-white hover:bg-[#C70023]"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Verification...
                  </>
                ) : (
                  <>
                    Connexion securisee
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>

        <aside className="relative hidden lg:block">
          <img
            alt="Equipe bancaire Societe Generale Algerie"
            className="absolute inset-0 h-full w-full object-cover"
            src={loginHero}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.2)_0%,rgba(17,24,39,0.68)_55%,rgba(17,24,39,0.88)_100%)]" />
          <div className="relative flex h-full items-end p-12 text-white">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/72">
                Societe Generale Algerie
              </p>
              <p className="font-display mt-4 text-4xl font-bold leading-tight">
                Une interface claire, rapide et pensee pour l&apos;action commerciale.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <LoginTransitionOverlay active={showTransition} />
    </>
  );
}
