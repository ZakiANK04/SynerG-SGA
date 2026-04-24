import { Building2, LogOut, Mail, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { useAuth } from "../lib/auth.jsx";
import { useUIPreferences } from "../lib/ui-preferences.jsx";

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const { animationsEnabled, setAnimationsEnabled } = useUIPreferences();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#F4F7FE]">
      <div className="space-y-6">
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-[#6B7280]">Parametres du compte</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
            Preferences SynerG
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Gerez votre profil de gestionnaire et les preferences d&apos;interface de
            l&apos;application.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#111827]">
                Profil du gestionnaire
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Informations utilisees dans la session de demonstration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <UserRound className="mt-0.5 size-5 text-[#E60028]" />
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Nom</p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {session?.name || "Gestionnaire SGA"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <Mail className="mt-0.5 size-5 text-[#E60028]" />
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Email</p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {session?.email || "gestionnaire@sga.dz"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <Building2 className="mt-0.5 size-5 text-[#E60028]" />
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Agence d&apos;affectation</p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {session?.agency || "Agence Corporate Alger Centre"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#111827]">Preferences</CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Ajustez le comportement visuel de l&apos;interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-[#111827]">Activer les animations</p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Intro video, transitions de pages et fondu de connexion.
                  </p>
                </div>
                <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
              </div>

              <Button
                className="h-12 w-full rounded-xl bg-[#E60028] text-white hover:bg-[#C70023]"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="size-4" />
                Deconnexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
