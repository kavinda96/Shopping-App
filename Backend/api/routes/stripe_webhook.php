<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');

$payload = @file_get_contents('php://input');
$sig     = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpointSecret = getenv('STRIPE_WEBHOOK_SECRET') ?: '';

try {
  if ($endpointSecret) {
    $event = \Stripe\Webhook::constructEvent($payload, $sig, $endpointSecret);
  } else {
    // Not recommended for prod, but lets you test without webhook secret
    $event = json_decode($payload, true);
  }
} catch (\UnexpectedValueException $e) {
  http_response_code(400); echo json_encode(['error'=>'Invalid payload']); exit;
} catch (\Stripe\Exception\SignatureVerificationException $e) {
  http_response_code(400); echo json_encode(['error'=>'Bad signature']); exit;
}

$type = $endpointSecret ? $event->type : ($event['type'] ?? '');

if ($type === 'payment_intent.succeeded') {
  $pi = $endpointSecret ? $event->data->object : $event['data']['object'];
  $piId     = $pi['id'] ?? $pi->id;
  $amount   = $pi['amount'] ?? $pi->amount;
  $currency = $pi['currency'] ?? $pi->currency;
  $userId   = (int)(($pi['metadata']['user_id'] ?? $pi->metadata->user_id) ?: 0);

  if ($userId <= 0) { http_response_code(200); echo json_encode(['skipped'=>'no user_id']); exit; }

  $pdo = db();
  $pdo->beginTransaction();
  try {
    // Avoid duplicates
    $chk = $pdo->prepare("SELECT id FROM invoices WHERE stripe_pi_id = ?");
    $chk->execute([$piId]);
    $existing = $chk->fetchColumn();
    if ($existing) {
      $pdo->commit();
      http_response_code(200); echo json_encode(['ok'=>'already created']); exit;
    }

    // Create invoice
    $ins = $pdo->prepare("INSERT INTO invoices (user_id, stripe_pi_id, amount_cents, currency, status) VALUES (?,?,?,?, 'succeeded')");
    $ins->execute([$userId, $piId, (int)$amount, (string)$currency]);
    $invoiceId = (int)$pdo->lastInsertId();

    // Copy cart -> invoice_items
    $rows = $pdo->prepare("SELECT ci.qty, p.id AS product_id, p.name, p.price_cents
                           FROM cart_items ci
                           JOIN products p ON p.id = ci.product_id
                           WHERE ci.user_id = ?");
    $rows->execute([$userId]);
    $items = $rows->fetchAll();

    if ($items) {
      $it = $pdo->prepare("INSERT INTO invoice_items (invoice_id, product_id, name, price_cents, qty)
                           VALUES (?,?,?,?,?)");
      foreach ($items as $r) {
        $it->execute([$invoiceId, (int)$r['product_id'], (string)$r['name'], (int)$r['price_cents'], (int)$r['qty']]);
      }
    }

    // Clear cart
    $del = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
    $del->execute([$userId]);

    $pdo->commit();
    http_response_code(200); echo json_encode(['ok'=>true, 'invoice_id'=>$invoiceId]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500); echo json_encode(['error'=>$e->getMessage()]);
  }
  exit;
}

http_response_code(200);
echo json_encode(['received'=>true, 'type'=>$type]);
