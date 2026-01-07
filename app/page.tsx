import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { LandingPage } from '@/components/LandingPage';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is logged in, send them straight to the app
  if (session) {
    redirect('/dashboard');
  }

  // Otherwise, render the public landing page
  return <LandingPage />;
}