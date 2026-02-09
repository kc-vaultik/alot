import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { VerificationStatus } from '../kyc/VerificationStatus';
import { DocumentCard } from '../kyc/DocumentCard';
import { DocumentUploader } from '../kyc/DocumentUploader';
import { useKYCDocuments, DocumentType } from '../../hooks/useKYCDocuments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REQUIRED_DOCUMENTS: { type: DocumentType; required: boolean }[] = [
  { type: 'government_id', required: true },
  { type: 'proof_of_address', required: true },
  { type: 'selfie', required: false },
];

export const DocumentKYCSection = memo(() => {
  const { 
    documents, 
    isLoading, 
    uploadDocumentAsync, 
    isUploading,
    deleteDocument,
    isDeleting,
    verificationStatus,
  } = useKYCDocuments();

  const [expandedUploader, setExpandedUploader] = useState<DocumentType | null>(null);

  const handleUpload = async (documentType: DocumentType, file: File) => {
    await uploadDocumentAsync({ documentType, file });
    setExpandedUploader(null);
  };

  const getDocumentByType = (type: DocumentType) => {
    return documents.find(d => d.document_type === type);
  };

  const hasDocument = (type: DocumentType) => {
    return documents.some(d => d.document_type === type);
  };

  // Loading state
  if (isLoading) {
    return (
      <SettingsLayout title="Document & KYC">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Document & KYC">
      <div className="space-y-6">
        {/* Verification Status Banner */}
        <VerificationStatus status={verificationStatus} />

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-400 font-medium">Why verify your identity?</p>
            <p className="text-white/50 mt-1">
              Identity verification helps protect your account and enables higher transaction limits.
              All documents are encrypted and securely stored.
            </p>
          </div>
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <SettingsSection
            title="Uploaded Documents"
            description="Your submitted verification documents"
          >
            <div className="space-y-3">
              <AnimatePresence>
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={deleteDocument}
                    isDeleting={isDeleting}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SettingsSection>
        )}

        {/* Upload New Documents */}
        <SettingsSection
          title="Upload Documents"
          description="Submit required documents to verify your identity"
        >
          <div className="space-y-4">
            {REQUIRED_DOCUMENTS.map(({ type, required }) => {
              const existingDoc = getDocumentByType(type);
              const isExpanded = expandedUploader === type;
              const canUpload = !existingDoc || existingDoc.status === 'rejected';

              return (
                <div
                  key={type}
                  className={cn(
                    'rounded-xl border overflow-hidden transition-[border-color,background-color] duration-200',
                    isExpanded ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10'
                  )}
                >
                  {/* Header - Clickable to expand */}
                  <button
                    onClick={() => canUpload && setExpandedUploader(isExpanded ? null : type)}
                    disabled={!canUpload}
                    className={cn(
                      'w-full p-4 flex items-center justify-between',
                      'hover:bg-white/5 transition-colors',
                      !canUpload && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        existingDoc?.status === 'approved' 
                          ? 'bg-green-500/10' 
                          : existingDoc?.status === 'pending'
                            ? 'bg-blue-500/10'
                            : 'bg-white/5'
                      )}>
                        <FileText className={cn(
                          'w-5 h-5',
                          existingDoc?.status === 'approved'
                            ? 'text-green-400'
                            : existingDoc?.status === 'pending'
                              ? 'text-blue-400'
                              : 'text-white/50'
                        )} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">
                          {type === 'government_id' && 'Government ID'}
                          {type === 'proof_of_address' && 'Proof of Address'}
                          {type === 'selfie' && 'Selfie Verification'}
                          {required && <span className="text-red-400 ml-1">*</span>}
                        </p>
                        <p className="text-white/40 text-xs">
                          {existingDoc 
                            ? existingDoc.status === 'approved' 
                              ? 'Verified' 
                              : existingDoc.status === 'pending' 
                                ? 'Under review'
                                : 'Rejected - please re-upload'
                            : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                    {canUpload && (
                      isExpanded 
                        ? <ChevronUp className="w-5 h-5 text-white/30" />
                        : <ChevronDown className="w-5 h-5 text-white/30" />
                    )}
                  </button>

                  {/* Expanded Upload Area */}
                  <AnimatePresence>
                    {isExpanded && canUpload && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-white/5">
                          <DocumentUploader
                            documentType={type}
                            onUpload={(file) => handleUpload(type, file)}
                            isUploading={isUploading}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="text-white/30 text-xs mt-4">
            <span className="text-red-400">*</span> Required documents
          </p>
        </SettingsSection>
      </div>
    </SettingsLayout>
  );
});

DocumentKYCSection.displayName = 'DocumentKYCSection';
