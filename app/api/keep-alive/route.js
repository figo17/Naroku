import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: 'warning',
          message: 'Supabase environment variables not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ping profiles table with a lightweight head count query
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        {
          status: 'ok',
          message: 'Keep-alive ping reached Supabase',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'Supabase profiles keep-alive ping successful',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Error occurred during keep-alive ping',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
