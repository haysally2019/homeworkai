import useSWR, { mutate } from 'swr';
import { createClient } from '@/lib/supabase/client';

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

async function fetchClassById(classId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error) throw error;
  return data;
}

async function fetchAssignments(classId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

async function fetchDocuments(classId: string) {
  const { data, error } = await supabase
    .from('class_documents')
    .select('id, filename, file_path, upload_date, processing_status')
    .eq('class_id', classId)
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return data;
}

export function useClasses(userId: string | undefined) {
  const { data, error, isLoading, mutate: mutateClasses } = useSWR(
    userId ? ['classes', userId] : null,
    ([_, uid]) => fetchClasses(uid),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    classes: data,
    isLoading,
    isError: error,
    mutate: mutateClasses,
  };
}

export function useClass(classId: string | undefined) {
  const { data, error, isLoading, mutate: mutateClass } = useSWR(
    classId ? ['class', classId] : null,
    ([_, id]) => fetchClassById(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    classData: data,
    isLoading,
    isError: error,
    mutate: mutateClass,
  };
}

export function useAssignments(classId: string | undefined) {
  const { data, error, isLoading, mutate: mutateAssignments } = useSWR(
    classId ? ['assignments', classId] : null,
    ([_, id]) => fetchAssignments(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    assignments: data || [],
    isLoading,
    isError: error,
    mutate: mutateAssignments,
  };
}

export function useDocuments(classId: string | undefined) {
  const { data, error, isLoading, mutate: mutateDocuments } = useSWR(
    classId ? ['documents', classId] : null,
    ([_, id]) => fetchDocuments(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    documents: data || [],
    isLoading,
    isError: error,
    mutate: mutateDocuments,
  };
}

export async function createClass(userId: string, classData: any) {
  const { data, error } = await (supabase as any)
    .from('classes')
    .insert([{ ...classData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;

  mutate(['classes', userId]);
  return data;
}

export async function updateClass(classId: string, updates: any) {
  const { data, error } = await (supabase as any)
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select()
    .single();

  if (error) throw error;

  mutate(['class', classId]);
  return data;
}

export async function deleteClass(userId: string, classId: string) {
  const { error } = await (supabase as any)
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;

  mutate(['classes', userId]);
}

export async function createAssignment(classId: string, assignmentData: any) {
  const { data, error } = await (supabase as any)
    .from('assignments')
    .insert([{ ...assignmentData, class_id: classId }])
    .select()
    .single();

  if (error) throw error;

  mutate(['assignments', classId]);
  return data;
}

export async function updateAssignment(classId: string, assignmentId: string, updates: any) {
  const { data, error } = await (supabase as any)
    .from('assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw error;

  mutate(['assignments', classId]);
  return data;
}

export async function deleteAssignment(classId: string, assignmentId: string) {
  const { error } = await (supabase as any)
    .from('assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;

  mutate(['assignments', classId]);
}

export async function deleteDocument(classId: string, documentId: string, filePath: string) {
  const { error: storageError } = await supabase.storage
    .from('class-documents')
    .remove([filePath]);

  if (storageError) throw storageError;

  const { error: dbError } = await (supabase as any)
    .from('class_documents')
    .delete()
    .eq('id', documentId);

  if (dbError) throw dbError;

  mutate(['documents', classId]);
}
