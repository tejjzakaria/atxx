import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Column layout (0-indexed): A=0 … K=10
const COL = {
  orderNumber:     0,
  date:            1,
  customerName:    2,
  customerPhone:   3,
  customerAddress: 4,
  items:           5,
  subtotal:        6,
  savings:         7,
  total:           8,
  status:          9,
  paymentMethod:   10,
};

const HEADERS = [
  "Order #", "Date", "Customer Name", "Phone", "Address",
  "Items", "Subtotal", "Savings", "Total", "Status", "Payment Method",
];

function getAuth() {
  const client_email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const private_key  = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!client_email || !private_key) throw new Error("Google Sheets credentials not configured");

  return new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: SCOPES,
  });
}

function formatItems(items: Array<{ productName: string; quantity: number; price: number }>) {
  return items.map(i => `${i.productName} x${i.quantity} (${i.price})`).join(", ");
}

/** Ensure a header row exists; returns the sheets client. */
async function ensureHeader(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A1:K1",
  });
  if (!res.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "A1:K1",
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

/** Append a new order row to the sheet. */
export async function appendOrderRow(spreadsheetId: string, order: {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  subtotal: number;
  savings: number;
  total: number;
  status: string;
  paymentMethod: string;
}) {
  const auth   = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await ensureHeader(sheets, spreadsheetId);

  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const row = new Array(11).fill("");
  row[COL.orderNumber]     = order.orderNumber;
  row[COL.date]            = date;
  row[COL.customerName]    = order.customerName;
  row[COL.customerPhone]   = order.customerPhone;
  row[COL.customerAddress] = order.customerAddress;
  row[COL.items]           = formatItems(order.items);
  row[COL.subtotal]        = order.subtotal;
  row[COL.savings]         = order.savings;
  row[COL.total]           = order.total;
  row[COL.status]          = order.status;
  row[COL.paymentMethod]   = order.paymentMethod;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "A:K",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

/** Find the row with the given order number and update its status cell. */
export async function updateOrderStatus(spreadsheetId: string, orderNumber: string, newStatus: string) {
  const auth   = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Get all values in the Order # column (A)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A:A",
  });

  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === orderNumber);
  if (rowIndex === -1) return; // not found, nothing to update

  const statusCell = `J${rowIndex + 1}`; // column J = status, 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: statusCell,
    valueInputOption: "RAW",
    requestBody: { values: [[newStatus]] },
  });
}
