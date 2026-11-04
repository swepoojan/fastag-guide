// Where each FASTag fee comes from and how to read it from the page.
// Figures are for a car / jeep / van (NPCI vehicle class 4).
//
// Two reading modes:
//   fields: a label (e.g. "Joining fee") followed by an amount with ₹ / Rs / INR.
//   rows:   a fee table. Find the header row naming the columns, then the vehicle row
//           under it, then read that row's cells in order (null = skip that cell).
//
// Toll pass prices are not scraped: they are fixed by government notification for the
// tax year (see src/data/rates.json → passes.validUntil).

const CAR_ROW = /car\s*\/\s*jeep\s*\/\s*van/i

export const sources = {
  providers: {
    hdfc: {
      // "FASTag Issuance fee (One time) ₹100" … "NPCI Vehicle Class | Security Deposit | Minimum Balance"
      // "Class 4 | Car / Jeep / Van / Tata ace … | ₹200 | NIL"
      url: 'https://v.hdfc.bank.in/htdocs/common/fastag/feescharges.html',
      fields: { issuanceFee: { labels: [/\bissuance\s*fee/i], anchor: null } },
      rows: [{ header: /security\s*deposit[\s|]*minimum\s*balance/i, anchor: /class\s*4\b/i, cells: ['securityDeposit', 'minBalance'], allowNil: ['minBalance'] }],
    },
    icici: {
      // "Tag Joining Fee* ₹99.12" … "Tag Class | Description | Security Deposit (in ₹) | Threshold amount (in ₹)"
      // "4 | TATA Ace and similar mini Light Commercial Vehicle | 200 | 100"
      url: 'https://www.icici.bank.in/personal-banking/payments/fastag/fees-and-charges',
      fields: { issuanceFee: { labels: [/joining\s*fee/i], anchor: null } },
      rows: [{ header: /security\s*deposit[^|]{0,12}[\s|]*threshold/i, anchor: /(?:^|[\s|])4\s*\|?\s*(?=[a-z])/i, cells: ['securityDeposit', 'minBalance'] }],
    },
    axis: {
      // "issuance fee of INR 100" "Refundable security deposit of INR 200" "minimum INR 100"
      url: 'https://application.axis.bank.in/webforms/axis-support/sub-issues/Cards-fastag-applyforfastag-7.aspx',
      fields: {
        issuanceFee: { labels: [/\bissuance\s*fee/i, /tag\s*cost/i] },
        securityDeposit: { labels: [/security\s*deposit/i] },
        minBalance: { labels: [/initial\s*(?:wallet\s*)?(?:top[\s-]*up|recharge)/i, /minimum\s*balance/i], allowNil: true },
      },
    },
    sbi: {
      // "Vehicle Class No. | Particulars | Tag Cost | Security Amount (Refundable) | Minimum Balance | Total"
      // "4 | Car / Jeep / Van/ Tata Ace … | 100 | 200 | 100(First Time Issuance Top up only) | 400"
      url: 'https://sbi.bank.in/web/personal-banking/digital/sbi-fastag',
      rows: [{ header: /tag\s*cost[\s|]*security\s*amount[^|]{0,20}[\s|]*minimum\s*balance/i, anchor: CAR_ROW, cells: ['issuanceFee', 'securityDeposit', 'minBalance'] }],
    },
    idfc: {
      // "FASTag Joining Fee | ₹100(Inclusive of GST)"
      // "Vehicle Description | Tag Class | Security Deposit (₹) | Minimum Balance/Initial Recharge (₹)"
      // "Car/Jeep/Van/Mini Light Commercial Vehicle | 4 | 200 | 100"
      url: 'https://www.idfcfirst.bank.in/personal-banking/fastag/fees-and-charges',
      fields: { issuanceFee: { labels: [/joining\s*fee/i], anchor: null } },
      rows: [{ header: /security\s*deposit[^|]{0,8}[\s|]*minimum\s*balance/i, anchor: CAR_ROW, cells: [null, 'securityDeposit', 'minBalance'] }],
    },
    airtel: {
      // "Tag Cost: Rs.100" "Refundable Security Deposit: Rs. 200" "Minimum Balance: Rs. 150"
      url: 'https://www.airtel.in/fastag-faq/',
      fields: {
        issuanceFee: { labels: [/tag\s*cost/i, /\bissuance\s*fee/i] },
        securityDeposit: { labels: [/security\s*deposit/i] },
        minBalance: { labels: [/minimum\s*balance/i], allowNil: true },
      },
    },
  },
}
