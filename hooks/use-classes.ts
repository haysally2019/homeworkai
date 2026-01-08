import useSWR, { mutate } from 'swr';
import { createClient } from '@/lib/supabase/client';

// Helper to keep client consistent
const supabase = createClient();

async function fetchClasses(userId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function fetchDocuments(classId: string) {
  const { data, error } = await supabase
    .from('class_documents')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export function useClasses(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ['classes', userId] : null,
    ([_, id]) => fetchClasses(id),
    {
      revalidateOnFocus: false, // <--- THIS STOPS THE FREEZING
      revalidateOnReconnect: false,
      dedupingInterval: 60000, 
    }
  );

  return {
    classes: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDocuments(classId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    classId ? ['documents', classId] : null,
    ([_, id]) => fetchDocuments(id),
    {
      revalidateOnFocus: false, // <--- THIS STOPS THE FREEZING
      dedupingInterval: 10000,
    }
  );

  return {
    documents: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// ... (Keep the rest of your createClass/deleteClass functions below exactly as they were)
export async function createClass(userId: string, classData: { name: string; code: string; color: string; semester: string }) {
  // Check limit for free users first
  const { data: userCredits } = await supabase
    .from('users_credits')
    .select('is_pro')
    .eq('id', userId)
    .single();

  if (!userCredits?.is_pro) {
    const { count } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (count && count >= 1) {
      throw new Error("Free users can only create 1 class. Upgrade to Pro for unlimited classes.");
    }
  }

  const { data, error } = await supabase
    .from('classes')
    .insert([{ ...classData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClass(userId: string, classId: string) {
  // Delete storage folder
  const { error: storageError } = await supabase.storage.from('class-documents').remove([`${userId}/${classId}`]);
  
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
  return true;
}

export async function deleteDocument(classId: string, documentId: string, filePath: string) {
  const { error: storageError } = await supabase.storage
    .from('class-documents')
    .remove([filePath]);

  if (storageError) console.error('Storage delete error:', storageError);

  const { error } = await supabase
    .from('class_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
  return true;
}