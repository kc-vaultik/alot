import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DocumentType = 'government_id' | 'proof_of_address' | 'selfie';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  expires_at: string | null;
}

export type VerificationStatus = 'not_started' | 'incomplete' | 'pending' | 'verified' | 'rejected';

export const useKYCDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['kyc-documents', user?.id],
    queryFn: async (): Promise<KYCDocument[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return (data ?? []) as KYCDocument[];
    },
    enabled: !!user?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      documentType, 
      file 
    }: { 
      documentType: DocumentType; 
      file: File;
    }): Promise<KYCDocument> => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);
      
      // Create document record
      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as KYCDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-documents', user?.id] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error('Document upload error:', error);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('kyc_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-documents', user?.id] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete document');
      console.error('Document delete error:', error);
    },
  });

  // Calculate verification status
  const getVerificationStatus = (): VerificationStatus => {
    if (!documents || documents.length === 0) return 'not_started';
    
    const hasRejected = documents.some(d => d.status === 'rejected');
    if (hasRejected) return 'rejected';
    
    const hasPending = documents.some(d => d.status === 'pending');
    if (hasPending) return 'pending';
    
    const allApproved = documents.every(d => d.status === 'approved');
    if (allApproved && documents.length >= 2) return 'verified'; // Need at least ID + proof
    
    return 'incomplete';
  };

  return {
    documents: documents ?? [],
    isLoading,
    error,
    uploadDocument: uploadDocument.mutate,
    uploadDocumentAsync: uploadDocument.mutateAsync,
    isUploading: uploadDocument.isPending,
    deleteDocument: deleteDocument.mutate,
    isDeleting: deleteDocument.isPending,
    verificationStatus: getVerificationStatus(),
  };
};
