import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { HelmetData } from './helmet/helmet-data';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/auth-context/auth-provider';
import { BootstrapPage } from './pages/bootstrap-page/bootstrap-page';
import { SignInPage } from './pages/sign-in-page/sign-in-page';
import { useAuth } from './hooks/use-auth';

const AppContent = () => {
    const { ready, enabled, authenticated, serverReachable, bootstrap } =
        useAuth();
    const isSharedRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/shared/');

    if (!ready) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-100">
                <div className="text-sm uppercase tracking-[0.3em] text-stone-400">
                    Loading SchemaDash
                </div>
            </main>
        );
    }

    if (serverReachable && enabled && !authenticated && !isSharedRoute) {
        if (bootstrap.required) {
            return <BootstrapPage />;
        }

        return <SignInPage />;
    }

    return <RouterProvider router={router} />;
};

export const App = () => {
    return (
        <HelmetProvider>
            <HelmetData />
            <TooltipProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </TooltipProvider>
        </HelmetProvider>
    );
};
