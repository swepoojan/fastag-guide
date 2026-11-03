export const inr = (n: number) =>
  '₹' + (Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

export const range = (lo: number, hi: number, joiner: string) => (lo === hi ? inr(lo) : `${inr(lo)}${joiner}${inr(hi)}`)
