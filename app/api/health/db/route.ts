import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Test basic connectivity by checking if we can query the users table
    const { error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    // Test if NextAuth tables exist by trying to query them
    const tableTests = await Promise.allSettled([
      supabase.from('users').select('count', { count: 'exact', head: true }),
      supabase.from('accounts').select('count', { count: 'exact', head: true }),
      supabase.from('sessions').select('count', { count: 'exact', head: true }),
      supabase.from('verification_tokens').select('count', { count: 'exact', head: true }),
    ]);
    
    const expectedTables = ['users', 'accounts', 'sessions', 'verification_tokens'];
    const existingTables = tableTests
      .map((result, index) => ({
        table: expectedTables[index],
        exists: result.status === 'fulfilled' && !result.value.error
      }))
      .filter(({ exists }) => exists)
      .map(({ table }) => table);
    
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    // Get Supabase project info
    const { error: healthError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      status: usersError ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        provider: 'Supabase',
        connected: !usersError,
        error: usersError?.message || healthError?.message || null,
      },
      tables: {
        expected: expectedTables,
        existing: existingTables,
        missing: missingTables,
        allPresent: missingTables.length === 0,
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      },
    });
    
  } catch (error) {
    console.error('Supabase health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        provider: 'Supabase',
        connected: false,
      },
    }, { status: 500 });
  }
} 