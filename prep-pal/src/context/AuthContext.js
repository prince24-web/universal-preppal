'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser as fetchCurrentUser, logout as performLogout } from '@/services/authService'; // Assuming services are in src/services
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start with loading true
    const router = useRouter();
    const pathname = usePathname();

    const verifyAuth = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error("Auth verification failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        verifyAuth();
    }, [verifyAuth]);

    const loginContext = (userData) => {
        setUser(userData);
        // Redirect to upload page or intended page after login
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/upload';
        router.push(redirectTo);
    };

    const logoutContext = async () => {
        try {
            await performLogout();
        } catch (error) {
            console.error("Logout failed:", error);
            // Still proceed to clear user and redirect client-side
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    // If loading, and not on a public path, show a generic loading indicator
    // This prevents rendering protected content prematurely.
    // More sophisticated loading screens can be implemented here.
    const publicPaths = ['/login', '/register']; // Add any other public paths
    if (loading && !publicPaths.includes(pathname)) {
         return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading authentication...
            </div>
        );
    }


    return (
        <AuthContext.Provider value={{ user, setUser, loading, loginContext, logoutContext, verifyAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
