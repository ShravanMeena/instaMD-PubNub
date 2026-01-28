import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl, getRandomColor } from '@/utils/colors';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser) => {
        try {
            // First check if profile exists in DB
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            // If profile is missing (and not just an error), create it!
            if ((!profile && !error) || (error && error.code === 'PGRST116')) {
                 console.log("Profile missing for existing user. Creating now...");
                 const newProfile = {
                    id: authUser.id,
                    username: authUser.user_metadata?.username || authUser.email.split('@')[0],
                    avatar_url: authUser.user_metadata?.avatar_url || getAvatarUrl(authUser.id),
                    color: getRandomColor(),
                    updated_at: new Date()
                 };

                 const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();
                 
                 if (createError) {
                     console.error("Failed to auto-create profile:", createError);
                 } else {
                     profile = createdProfile;
                     console.log("Profile auto-created:", profile);
                 }
            } else if (error) {
                console.error("Error fetching profile:", error);
            }

            // Map Auth User to App User format
            const appUser = {
                id: authUser.id,
                email: authUser.email,
                name: profile?.username || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || getAvatarUrl(authUser.id),
                color: profile?.color || getRandomColor()
            };

            setUser(appUser);
        } catch (error) {
            console.error("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    avatar_url: getAvatarUrl(username + Date.now())
                }
            }
        });
        if (error) throw error;
        
        // Profile is created automatically by the DB Trigger now.
        
        return data;
    };

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
