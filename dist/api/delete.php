<?php
// Hostinger File Delete API for Shan Times
// Place this file in: public_html/api/delete.php

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

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['url'])) {
        throw new Exception('URL is required');
    }

    $url = $input['url'];
    $baseUrl = 'https://shantimes.in/';
    
    // Extract relative path from URL
    if (strpos($url, $baseUrl) !== 0) {
        throw new Exception('Invalid URL');
    }

    $relativePath = str_replace($baseUrl, '', $url);
    $filePath = '../' . $relativePath;

    // Security check - only allow deleting from uploads directory
    if (strpos($relativePath, 'uploads/') !== 0) {
        throw new Exception('Cannot delete files outside uploads directory');
    }

    // Check if file exists and delete
    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            echo json_encode(['success' => true, 'message' => 'File deleted']);
        } else {
            throw new Exception('Failed to delete file');
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'File not found (already deleted)']);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
