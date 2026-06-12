-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company notifications" 
    ON public.notifications FOR SELECT 
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their company notifications" 
    ON public.notifications FOR UPDATE 
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert their company notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));
