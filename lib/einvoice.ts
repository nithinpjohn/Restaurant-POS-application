import { esc } from "@/lib/download"
import type { Sale, Seller } from "@/components/shift/shift-provider"

// ponytail: generic invoice structure for hand-off and testing. It is NOT a certified e-invoice format.
// Real jurisdictions each need their own schema, signing and clearance (Peppol/UBL in the EU, GST IRN in India, SDI in Italy, etc.).
const money = (c: number) => (c / 100).toFixed(2)

export function buildInvoice(sale: Sale, seller: Seller) {
  const tax = sale.taxLines.reduce((a, t) => a + t.cents, 0)
  return {
    invoiceNumber: sale.invoiceNo,
    issueDate: new Date(sale.at).toISOString(),
    currency: "USD",
    seller,
    buyer: { name: sale.table },
    orderReference: sale.orderId,
    lines: sale.items.map((it, i) => ({ id: i + 1, description: it.name, quantity: it.qty, lineAmount: money(it.cents) })),
    taxTotals: sale.taxLines.map((t) => ({ description: t.label, amount: money(t.cents) })),
    totals: {
      netAmount: money(sale.subtotal),
      taxAmount: money(tax),
      tipAmount: money(sale.tip),
      loyaltyRedeemed: money(sale.loyalty),
      payableAmount: money(sale.total),
    },
    payments: sale.payments.map((p) => ({ method: p.method, amount: money(p.cents) })),
  }
}

export function invoiceToXml(inv: ReturnType<typeof buildInvoice>) {
  const t = (name: string, v: unknown, attrs = "") => `<${name}${attrs}>${esc(v)}</${name}>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  ${t("ID", inv.invoiceNumber)}
  ${t("IssueDate", inv.issueDate)}
  ${t("DocumentCurrencyCode", inv.currency)}
  <AccountingSupplierParty>${t("Name", inv.seller.name)}${t("CompanyID", inv.seller.taxId)}${t("Address", inv.seller.address)}</AccountingSupplierParty>
  <AccountingCustomerParty>${t("Name", inv.buyer.name)}</AccountingCustomerParty>
  ${t("OrderReference", inv.orderReference)}
  <TaxTotal>${inv.taxTotals.map((x) => `<TaxSubtotal>${t("Name", x.description)}${t("TaxAmount", x.amount, ` currencyID="${inv.currency}"`)}</TaxSubtotal>`).join("")}</TaxTotal>
  <LegalMonetaryTotal>${t("TaxExclusiveAmount", inv.totals.netAmount)}${t("TaxAmount", inv.totals.taxAmount)}${t("TipAmount", inv.totals.tipAmount)}${t("PayableAmount", inv.totals.payableAmount)}</LegalMonetaryTotal>
  ${inv.lines.map((l) => `<InvoiceLine>${t("ID", l.id)}${t("Description", l.description)}${t("Quantity", l.quantity)}${t("LineExtensionAmount", l.lineAmount)}</InvoiceLine>`).join("\n  ")}
  ${inv.payments.map((p) => `<PaymentMeans>${t("Method", p.method)}${t("Amount", p.amount)}</PaymentMeans>`).join("\n  ")}
</Invoice>
`
}
