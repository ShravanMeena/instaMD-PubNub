import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url');
                
                if (error) {
                    console.error("Error fetching users Supabase:", error);
                    throw error;
                }
                 // Ensure we don't crash on missing names
                const validUsers = (data || []).map(u => ({
                    ...u,
                    name: u.username || 'Anonymous',
                    avatar: u.avatar_url
                }));
                setUsers(validUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, loading };
};

export default useUsers;
