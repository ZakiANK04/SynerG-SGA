import { CheckCircle2, RotateCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function FeedbackConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const feedback = location.state || {};

  return (
    <div className="min-h-screen bg-[#F4F7FE] overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-[#6B7280]">Confirmation apprentissage RL</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
            Feedback enregistre
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Le retour conseiller a ete pris en compte et le moteur de recommandation a ete mis a
            jour.
          </p>
        </section>

        <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-[#E60028]" />
              <CardTitle className="text-xl font-bold text-[#111827]">
                Confirmation de soumission
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-[#6B7280]">Client</p>
              <p className="mt-2 text-base font-semibold text-[#111827]">
                {feedback.clientName || feedback.clientId || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-[#6B7280]">Produit</p>
              <p className="mt-2 text-base font-semibold text-[#111827]">
                {feedback.productName || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-[#6B7280]">Decision client</p>
              <p className="mt-2 text-base font-semibold text-[#111827]">
                {feedback.accepted ? "Accepte" : "Refuse"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-[#6B7280]">Reward</p>
              <p className="mt-2 text-base font-semibold text-[#111827]">
                {feedback.reward !== undefined ? Number(feedback.reward).toFixed(2) : "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-[#6B7280]">Sentiment</p>
              <p className="mt-2 text-base font-semibold text-[#111827]">
                {feedback.sentiment || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-[#6B7280]">Compte rendu</p>
              <p className="mt-2 text-sm leading-7 text-[#111827]">
                {feedback.comment || "Aucun commentaire renseigne."}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-emerald-800">
                {feedback.notification || "Modele mis a jour."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button
                className="rounded-xl"
                onClick={() => navigate(`/dashboard?client=${feedback.clientId || ""}`)}
                type="button"
              >
                <RotateCcw className="size-4" />
                Retour a la fiche client
              </Button>
              <Button
                className="rounded-xl border-slate-200 bg-white text-[#111827] hover:bg-slate-50"
                onClick={() => navigate("/dashboard")}
                type="button"
                variant="outline"
              >
                Retour portefeuille
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
