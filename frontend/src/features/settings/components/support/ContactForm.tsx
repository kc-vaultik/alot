import { memo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const contactSchema = z.object({
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'account', label: 'Account Issues' },
  { value: 'redemption', label: 'Prize Redemption' },
  { value: 'feedback', label: 'Feedback & Suggestions' },
];

export const ContactForm = memo(() => {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const selectedSubject = watch('subject');

  const onSubmit = async (data: ContactFormData) => {
    try {
      // In a real app, this would send to an API
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      toast.success('Message sent successfully!');
      reset();
      
      // Reset the submitted state after 3 seconds
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <p className="text-white/90 font-medium">Message Sent!</p>
        <p className="text-white/50 text-sm mt-1">We'll get back to you within 24-48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/70 text-sm">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ''}
          disabled
          className="bg-white/5 border-white/10 text-white/50"
        />
        <p className="text-xs text-white/40">We'll respond to your account email</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-white/70 text-sm">Subject</Label>
        <Select
          value={selectedSubject}
          onValueChange={(value) => setValue('subject', value, { shouldValidate: true })}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject && (
          <p className="text-xs text-red-400">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-white/70 text-sm">Message</Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder="Describe your issue or question..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px] resize-none"
        />
        {errors.message && (
          <p className="text-xs text-red-400">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="relative w-full h-10 rounded-lg overflow-hidden font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Base gradient */}
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500" />
        {/* Hover overlay */}
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-0 hover:opacity-100 transition-opacity duration-200" />
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </span>
      </button>
    </form>
  );
});

ContactForm.displayName = 'ContactForm';
