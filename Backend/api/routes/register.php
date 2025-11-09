<?php
require_once __DIR__ . '/../lib/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$name || !$email || !$password) {
  http_response_code(400);
  echo json_encode(['error' => 'All fields are required']);
  exit;
}

// Check duplicate email
$stmt = db()->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
  http_response_code(400);
  echo json_encode(['error' => 'Email already registered']);
  exit;
}

// Hash password and insert
$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = db()->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
$stmt->execute([$name, $email, $hash]);

echo json_encode(['success' => true, 'message' => 'Registration successful']);
exit;
