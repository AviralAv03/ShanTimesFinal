// Hostinger Storage Helper for Shan Times
// Uploads images and PDFs to Hostinger via PHP endpoint

const API_BASE = 'https://shantimes.in/api';

// Upload image to Hostinger
export const uploadImageToHostinger = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('type', 'image');

    const response = await fetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Image upload failed');
    }

    return data.url;
};

// Upload PDF to Hostinger
export const uploadPdfToHostinger = async (file, fileName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pdf');

    const response = await fetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'PDF upload failed');
    }

    return data.url;
};

// Delete file from Hostinger (PDF, Image, or Video)
export const deleteFileFromHostinger = async (fileUrl) => {
    try {
        const response = await fetch(`${API_BASE}/delete.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: fileUrl })
        });

        const data = await response.json();
        if (!data.success) {
            console.error('Delete error:', data.error);
        }
    } catch (e) {
        console.error('Delete request failed:', e);
    }
};

// Upload video to Hostinger
export const uploadVideoToHostinger = async (videoFile) => {
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('type', 'video');

    const response = await fetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Video upload failed');
    }

    return data.url;
};

// Alias for backward compatibility
export const deletePdfFromHostinger = deleteFileFromHostinger;

