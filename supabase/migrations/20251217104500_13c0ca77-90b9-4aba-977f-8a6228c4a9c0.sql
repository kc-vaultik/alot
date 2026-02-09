-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'gift_received', 'swap_offer', 'swap_completed', 'gift_claimed'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on gift transfer creation
CREATE OR REPLACE FUNCTION public.notify_on_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_product_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only create notification if there's a recipient
  IF NEW.to_user_id IS NOT NULL THEN
    -- Get sender's display name
    SELECT COALESCE(display_name, username) INTO v_sender_name
    FROM collector_profiles
    WHERE user_id = NEW.from_user_id;
    
    -- Get product name from the reveal
    SELECT pc.name INTO v_product_name
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.id = NEW.reveal_id;
    
    IF NEW.transfer_type = 'GIFT' THEN
      v_notification_title := 'You received a gift!';
      v_notification_message := COALESCE(v_sender_name, 'A collector') || ' sent you a ' || COALESCE(v_product_name, 'mystery card') || '.';
    ELSIF NEW.transfer_type = 'SWAP' THEN
      v_notification_title := 'New swap offer';
      v_notification_message := COALESCE(v_sender_name, 'A collector') || ' wants to swap their ' || COALESCE(v_product_name, 'card') || ' with you.';
    END IF;
    
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.to_user_id,
      CASE WHEN NEW.transfer_type = 'GIFT' THEN 'gift_received' ELSE 'swap_offer' END,
      v_notification_title,
      v_notification_message,
      jsonb_build_object(
        'transfer_id', NEW.id,
        'from_user_id', NEW.from_user_id,
        'claim_token', NEW.claim_token,
        'product_name', v_product_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on card_transfers
CREATE TRIGGER on_transfer_created
  AFTER INSERT ON public.card_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_transfer();

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET read = true
  WHERE id = p_notification_id AND user_id = auth.uid();
$$;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
$$;