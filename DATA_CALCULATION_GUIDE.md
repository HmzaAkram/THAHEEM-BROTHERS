# Data Calculation Guide - Thaheem Brothers

This document explains how totals and balances are calculated across the different pages of the application.

## 1. Dashboard

The Dashboard provides an overall financial summary of the business.

*   **Total Billed**:
    *   Sum of `Grand Total` of all Bills (excluding 'Draft' status).
    *   Plus: Sum of `Opening Balance` of all Companies (only when 'Overall Stats' filter is selected).
*   **Total Collected**:
    *   Sum of `Advance Payment` from all Bills.
    *   Plus: Sum of `Amount` and `Adjustment` from all Payment records.
*   **Outstanding Balance**:
    *   `Total Billed` minus `Total Collected`.
*   **New/Total Companies**:
    *   Count of companies registered within the selected time period.

---

## 2. Bills Page

The Bills page shows individual job invoices and their cumulative totals.

*   **Individual Bill Calculation**:
    *   `Sub Total`: Sum of all items added to the bill.
    *   `Sales Tax`: `(SBR Sales Tax Input Amount) × (Tax Rate / 100)`.
    *   `Grand Total`: `Sub Total + Service Charges + Sales Tax`.
    *   *Note: `Advance Payment` is NOT deducted from the `Grand Total` itself; it is treated as a credit against the bill.*
*   **Table Totals**:
    *   **Billed**: Sum of `Grand Total` for all filtered bills.
    *   **Paid**: Sum of `Paid Amount` (includes Advance + linked Payments + Adjustments).
    *   **Balance**: `Sum(Opening Balance of companies in filter) + (Total Billed - Total Paid)`.

---

## 3. Payments Page

The Payments page tracks all incoming funds and their application to bills or company balances.

*   **Total Bill**:
    *   Sum of `Grand Total` for all bills within the filtered period.
    *   Plus: Sum of `Opening Balance` for all filtered companies.
*   **Collected (Overall Received)**:
    *   Sum of `Advance Payment` from all filtered bills.
    *   Plus: Sum of `Amount` and `Adjustment` from all filtered payment records.
*   **Total Balance**:
    *   `Total Bill - Collected (Overall Received)`.
*   **Individual Payment**:
    *   `Total Received = Payment Amount + Adjustment`.

---

## 4. Companies Page

The Companies page manages client profiles and their overall standing.

*   **Amount (Total Billed)**: Sum of `Grand Total` for all bills associated with the company.
*   **Paid (Total Collected)**:
    *   Sum of `Advance Payment` from the company's bills.
    *   Plus: Sum of `Amount` and `Adjustment` from the company's payments.
*   **Balance**:
    *   `(Total Billed + Company Opening Balance) - Total Collected`.
*   **Bottom Summary**:
    *   **Total Outstanding**: Sum of balances for all filtered companies.
    *   **Total Collected**: Sum of all payments received within the filtered period.

---

## 5. Company Ledger (Admin Ledger)

The Ledger provides a chronological history of transactions for a specific company.

*   **Debit (Increase Balance)**:
    *   Generated when a Bill is created (Amount = `Grand Total`).
    *   Initial `Opening Balance` entry (if set during company creation).
*   **Credit (Decrease Balance)**:
    *   Generated for `Advance Payment` on a bill.
    *   Generated for every Payment record (includes `Amount` + `Adjustment`).
*   **Running Balance**:
    *   Starts from the `Opening Balance`.
    *   `Balance = (Previous Balance) + Debit - Credit`.
*   **Remaining Opening Balance**:
    *   Calculated as `Initial Opening Balance - Total Unlinked Payments (Advances)`. This shows how much of the original opening balance is still outstanding.

---

## 6. Reports Page

Reports provide various views of the financial data over time.

*   **Overall Summary Report**:
    *   **Total Billed (Incl. OB)**: `Sum(Grand Total) + Opening Balance`.
    *   **Paid Amount**: `Sum(Advance Payment) + Sum(Payment Amount + Adjustment)`.
    *   **Balance**: `Total Billed - Paid Amount`.
*   **Remaining Balance Report**:
    *   Analyzes age of debt (Overdue status) based on a 30-day grace period from the bill date.
    *   `Total Debit` and `Received` follow the same logic as the Companies page.

---

## Summary of Key Terms

| Term | Included Components |
| :--- | :--- |
| **Billed / Debit** | Gross Bill (`Sub Total` + `Service Charges` + `Sales Tax`) + `Opening Balance` |
| **Collected / Credit** | `Advance Payment` + `Payment Amount` + `Adjustment` |
| **Balance** | `Total Billed` - `Total Collected` |
| **Adjustment** | Any manual discount or balance correction applied during payment recording. |
