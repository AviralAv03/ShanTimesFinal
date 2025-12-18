import { createClient } from '@supabase/supabase-js';

// Supabase configuration for ShanTimesStorage
const supabaseUrl = 'https://lzpvkbkxcclpwthiihsc.supabase.co';
const supabaseAnonKey = 'sb_publishable_ohj3NspCERoN352ESGH9GQ_kzB97FtX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload PDF to Supabase Storage
export const uploadPdfToSupabase = async (file, fileName) => {
    const { data, error } = await supabase.storage
        .from('epapers') // bucket name
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('epapers')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
};

// Helper function to delete PDF from Supabase Storage
export const deletePdfFromSupabase = async (fileName) => {
    const { error } = await supabase.storage
        .from('epapers')
        .remove([fileName]);

    if (error) {
        console.error('Delete error:', error.message);
    }
};
