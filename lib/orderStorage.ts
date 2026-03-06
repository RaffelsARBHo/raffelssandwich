// lib/orderStorage.ts
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'pending-orders.json');

function readOrders(): Record<string, any> {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({}));
      return {};
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeOrders(orders: Record<string, any>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

export function storePendingOrder(orderId: string, data: {
  customerName: string;
  items: any[];
  tableNumber: string;
  branchNo: string;
}) {
  const orders = readOrders();
  orders[orderId] = { ...data, createdAt: new Date().toISOString() };
  writeOrders(orders);
  console.log('💾 Pending order stored:', orderId);
}

export function getPendingOrder(orderId: string) {
  const orders = readOrders();
  return orders[orderId] || null;
}

export function deletePendingOrder(orderId: string) {
  const orders = readOrders();
  delete orders[orderId];
  writeOrders(orders);
  console.log('🗑️ Pending order deleted:', orderId);
}