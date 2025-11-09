<?php
// /routes/admin_upload.php
require_once __DIR__ . '/../lib/auth.php';
require_admin(); // only admin can upload files

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$allowed = ["jpg", "jpeg", "png", "webp"];

if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid file type"]);
    exit;
}

$uploadDir = __DIR__ . "/../uploads/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$newName = uniqid("img_", true) . "." . $ext;
$dest = $uploadDir . $newName;

if (!move_uploaded_file($file["tmp_name"], $dest)) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save file"]);
    exit;
}

$fullUrl = "http://api.test/uploads/" . $newName;

echo json_encode([
    "url" => $fullUrl,
    "filename" => $newName
]);
exit;
