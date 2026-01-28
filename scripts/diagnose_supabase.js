
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfvjbtlobbekdscekdkf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FVU9vbQ4VvSR4aR1NlBKiQ_t7MgLTwz';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnostic() {
    console.log("--- Supabase Diagnostic ---");
    console.log("URL:", SUPABASE_URL);

    // 1. Try public fetch (as anon)
    console.log("\n1. Fetching Public Channels (Anon)...");
    const { data: publicData, error: publicError } = await supabase
        .from('channels')
        .select('*')
        .eq('type', 'public')
        .limit(5);

    if (publicError) {
        console.error("FAIL: Error fetching:", publicError.message);
    } else {
        console.log("SUCCESS: Found " + publicData.length + " public channels.");
        if(publicData.length > 0) console.log("Sample:", publicData[0]);
    }

    // 2. Try inserting without Auth (Should fail if RLS is on)
    console.log("\n2. Attempting Insert (Anon)...");
    const { error: insertError } = await supabase
        .from('channels')
        .insert({ name: 'HackAttempt', type: 'public' });
    
    if (insertError) {
        console.log("EXPECTED: Insert failed as anon:", insertError.message);
    } else {
        console.warn("WARNING: Insert succeeded as anon! RLS might be disabled.");
    }

    console.log("\n--- Diagnostic Complete ---");
}

runDiagnostic();
