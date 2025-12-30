<?php
// Hostinger File Upload API for Shan Times
// Place this file in: public_html/api/upload.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Configuration
$baseUrl = 'https://shantimes.in';
$uploadDirs = [
    'image' => '../uploads/images/',
    'pdf' => '../uploads/epapers/',
    'video' => '../uploads/videos/'
];

// Allowed file types
$allowedTypes = [
    'image' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'pdf' => ['application/pdf'],
    'video' => ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
];

// Max file sizes (in bytes)
$maxSizes = [
    'image' => 5 * 1024 * 1024,   // 5MB
    'pdf' => 50 * 1024 * 1024,    // 50MB
    'video' => 100 * 1024 * 1024  // 100MB
];

try {
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    $file = $_FILES['file'];
    $fileType = $_POST['type'] ?? 'image'; // 'image', 'pdf', or 'video'

    // Validate file type category
    if (!in_array($fileType, ['image', 'pdf', 'video'])) {
        throw new Exception('Invalid file type category');
    }

    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes[$fileType])) {
        throw new Exception('File type not allowed: ' . $mimeType);
    }

    // Check file size
    if ($file['size'] > $maxSizes[$fileType]) {
        throw new Exception('File too large. Maximum size: ' . ($maxSizes[$fileType] / 1024 / 1024) . 'MB');
    }

    // Create upload directory if it doesn't exist
    $uploadDir = $uploadDirs[$fileType];
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = time() . '_' . uniqid() . '.' . $extension;
    $targetPath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save file');
    }

    // Generate public URL
    $relativePath = str_replace('../', '', $targetPath);
    $publicUrl = $baseUrl . '/' . $relativePath;

    // Return success response
    echo json_encode([
        'success' => true,
        'url' => $publicUrl,
        'filename' => $filename
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
