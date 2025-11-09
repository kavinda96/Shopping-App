<?php
// ===== CORS (dev) =====
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// ===== Boot =====
require __DIR__ . '/lib/db.php';
require __DIR__ . '/vendor/autoload.php';

// Small JSON helper
function json($data, int $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

// ===== Path detection (supports /index.php/..., trailing slashes, etc.) =====
$path = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/index\.php#', '', $path); // strip "/index.php" prefix if present
$path = $path ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

// ===== Routes =====

// Auth
if ($method === 'POST' && preg_match('#^/register/?$#', $path)) { require __DIR__ . '/routes/register.php'; exit; }
if ($method === 'POST' && preg_match('#^/login/?$#',    $path)) { require __DIR__ . '/routes/login.php'; exit; }
if ($method === 'GET'  && preg_match('#^/me/?$#',       $path)) { require __DIR__ . '/routes/me.php'; exit; }


// --- Shops
if ($method === 'GET' && preg_match('#^/shops/?$#', $path)) {
  $stmt = db()->query("SELECT * FROM shops ORDER BY created_at DESC");
  json($stmt->fetchAll());
}

if ($method === 'GET' && preg_match('#^/shops/(\d+)/products/?$#', $path, $m)) {
  $shopId = (int)$m[1];
  $stmt = db()->prepare("SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY created_at DESC");
  $stmt->execute([$shopId]);
  json($stmt->fetchAll());
}

if (preg_match('#^/cart/?$#', $path)) { require __DIR__ . '/routes/cart.php'; exit; }

if ($method === 'POST' && preg_match('#^/checkout/?$#', $path)) { require __DIR__ . '/routes/checkout.php'; exit; }

if ($method === 'GET' && preg_match('#^/promo/?$#', $path)) {
  require __DIR__ . '/routes/promo.php'; exit;
}

if ($method === 'POST' && preg_match('#^/stripe/webhook/?$#', $path)) { require __DIR__ . '/routes/stripe_webhook.php'; exit; }
// Create/fetch order by Stripe PaymentIntent id
if ($method === 'GET' && preg_match('#^/(orders_by_pi|orders/by-pi)/?$#', $path)) {
  require __DIR__ . '/routes/orders_by_pi.php'; exit;
}

// Admin routes
if (preg_match('#^/admin/shops/?$#', $path))  { require __DIR__ . '/routes/admin_shops.php'; exit; }
if (preg_match('#^/admin/products/?$#', $path)) { require __DIR__ . '/routes/admin_products.php'; exit; }
if (preg_match('#^/admin/promos/?$#', $path)) { require __DIR__ . '/routes/admin_promos.php'; exit; }

if ($method === 'POST' && preg_match('#^/admin/upload/?$#', $path)) {
    require __DIR__ . '/routes/admin_upload.php';
    exit;
}



// --- Fallback
json(['error' => 'Not Found', 'path' => $path], 404);
