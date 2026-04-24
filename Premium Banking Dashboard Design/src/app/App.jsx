import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import introVideo from "../assets/intro-video.mp4";
import { BrandLogo } from "./components/BrandLogo";
import { AppLayout } from "./components/Layout";
import { AuthProvider, ProtectedRoute, PublicOnlyRoute, useAuth } from "./lib/auth.jsx";
import { UIPreferencesProvider, useUIPreferences } from "./lib/ui-preferences.jsx";
import { DashboardPage } from "./pages/Dashboard";
import { FeedbackConfirmationPage } from "./pages/FeedbackConfirmation";
import { LoginPage } from "./pages/Login";
import { SettingsPage } from "./pages/Settings";

function RouteTransitionOverlay({ active }) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-white transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <BrandLogo className={active ? "animate-pulse" : ""} imageClassName="h-16 w-auto" />
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#6B7280]">
          Chargement de l&apos;espace
        </p>
      </div>
    </div>
  );
}

function IntroOverlay({ onComplete }) {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let completed = false;

    function finishIntro() {
      if (completed) {
        return;
      }

      completed = true;
      setIsVisible(false);
      window.setTimeout(onComplete, 450);
    }

    const fallbackTimer = window.setTimeout(finishIntro, 4600);
    const videoElement = videoRef.current;

    if (videoElement) {
      videoElement.muted = true;
      videoElement.defaultMuted = true;
      videoElement.playsInline = true;
      const playback = videoElement.play();
      if (playback?.catch) {
        playback.catch(() => {});
      }
    }

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[160] overflow-hidden bg-[#050816] transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        className="absolute inset-0 h-full w-full scale-[1.08] object-cover sm:scale-[1.14] lg:scale-[1.42]"
        muted
        onEnded={() => {
          setIsVisible(false);
          window.setTimeout(onComplete, 450);
        }}
        playsInline
        preload="auto"
        src={introVideo}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.28)_0%,rgba(5,8,22,0.7)_45%,rgba(5,8,22,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(230,0,40,0.2),transparent_28%)]" />

      <div className="relative flex h-full flex-col items-center justify-end px-6 pb-14 text-center text-white sm:pb-20">
        <BrandLogo imageClassName="h-16 w-auto" withPlate />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.36em] text-white/65">
          SynerG
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          L&apos;intelligence commerciale commence ici.
        </h1>
      </div>
    </div>
  );
}

function AnimatedRoutes({ disableTransitions = false }) {
  const location = useLocation();
  const { animationsEnabled } = useUIPreferences();
  const { isAuthenticated } = useAuth();

  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionActive, setTransitionActive] = useState(false);
  const previousLocationRef = useRef(`${location.pathname}${location.search}`);

  useEffect(() => {
    const nextLocationKey = `${location.pathname}${location.search}`;

    if (disableTransitions) {
      previousLocationRef.current = nextLocationKey;
      setDisplayLocation(location);
      setTransitionActive(false);
      return;
    }

    if (!animationsEnabled) {
      previousLocationRef.current = nextLocationKey;
      setDisplayLocation(location);
      setTransitionActive(false);
      return;
    }

    if (previousLocationRef.current === nextLocationKey) {
      return;
    }

    previousLocationRef.current = nextLocationKey;
    setTransitionActive(true);

    const swapTimer = window.setTimeout(() => {
      setDisplayLocation(location);
    }, 220);

    const closeTimer = window.setTimeout(() => {
      setTransitionActive(false);
    }, 620);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(closeTimer);
    };
  }, [animationsEnabled, disableTransitions, location]);

  useEffect(() => {
    previousLocationRef.current = `${location.pathname}${location.search}`;
    setDisplayLocation(location);
    setTransitionActive(false);
  }, [isAuthenticated, location]);

  return (
    <>
      <Routes location={displayLocation}>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<LoginPage />} path="/login" />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<DashboardPage />} path="/dashboard" />
            <Route element={<FeedbackConfirmationPage />} path="/feedback-confirmation" />
            <Route element={<SettingsPage />} path="/settings" />
          </Route>
        </Route>

        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>

      {animationsEnabled && !disableTransitions ? <RouteTransitionOverlay active={transitionActive} /> : null}
    </>
  );
}

function AppShellContent() {
  const { animationsEnabled } = useUIPreferences();
  const [showIntro, setShowIntro] = useState(animationsEnabled);

  useEffect(() => {
    if (!animationsEnabled) {
      setShowIntro(false);
    }
  }, [animationsEnabled]);

  return (
    <>
      {animationsEnabled && showIntro ? <IntroOverlay onComplete={() => setShowIntro(false)} /> : null}
      <AnimatedRoutes disableTransitions={showIntro} />
      <Toaster position="top-right" richColors theme="light" />
    </>
  );
}

function AppShell() {
  return (
    <BrowserRouter>
      <AppShellContent />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <UIPreferencesProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </UIPreferencesProvider>
  );
}
