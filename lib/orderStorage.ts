// lib/orderStorage.ts

// Node.js file system module (used to read/write files)
import fs from 'fs';

// Utility to handle file paths correctly across OS
import path from 'path';

// Define the path where orders will be stored
// process.cwd() = root of your project
const filePath = path.join(process.cwd(), 'data', 'pending-orders.json');

/**
 * Reads all pending orders from the JSON file
 * @returns Object containing all orders (key = orderId)
 */
function readOrders(): Record<string, any> {
  try {
    // If file doesn't exist, create it with empty object
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true }); // ensure folder exists
      // fs.writeFileSync(filePath, JSON.stringify({})); // create empty JSON file
      return {};
    }

    // Read file content
    const raw = fs.readFileSync(filePath, 'utf-8');

    // Parse JSON into object
    return JSON.parse(raw);
  } catch {
    // If anything fails (corrupt file, parse error), return empty object
    return {};
  }
}

/**
 * Writes all orders back to the JSON file
 * @param orders Updated orders object
 */
function writeOrders(orders: Record<string, any>) {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // Save formatted JSON (pretty printed)
  // fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

/**
 * Stores a new pending order
 * @param orderId Unique order ID
 * @param data Order details
 */
export function storePendingOrder(orderId: string, data: {
  customerName: string;
  items: any[];
  tableNumber: string;
  branchNo: string;
}) {
  // Get existing orders
  const orders = readOrders();

  // Add new order with timestamp
  orders[orderId] = {
    ...data,
    createdAt: new Date().toISOString()
  };

  // Save updated orders
  writeOrders(orders);
}

/**
 * Retrieves a pending order by ID
 * @param orderId Unique order ID
 * @returns Order data or null if not found
 */
export function getPendingOrder(orderId: string) {
  const orders = readOrders();

  // Return order if exists, otherwise null
  return orders[orderId] || null;
}

/**
 * Deletes a pending order by ID
 * @param orderId Unique order ID
 */
export function deletePendingOrder(orderId: string) {
  const orders = readOrders();

  // Remove the order
  delete orders[orderId];

  // Save updated orders
  writeOrders(orders);
}