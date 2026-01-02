import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

type NotificationPreferences = {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
};

type Profile = {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    credit_balance: number;
    onboarding_completed: boolean;
    phone?: string;
    notification_preferences?: NotificationPreferences;
    // Add other fields as needed
};

type AuthContextType = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            return;
        }

        // Initial fetch
        fetchProfile();

        // Subscribe to realtime changes on profiles table
        const channel = supabase
            .channel(`profile_changes_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Profile realtime update received:', payload.new);
                    // Update local state instantly with the new data
                    setProfile((prev) => ({ ...prev, ...payload.new } as Profile));
                }
            )
            .subscribe((status) => {
                console.log('Profile subscription status:', status);
            });

        return () => {
            console.log('Unsubscribing from profile channel');
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error('Exception fetching profile:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, isLoading, refreshProfile: fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
