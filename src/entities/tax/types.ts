export type InvoiceTaxLine = {
  id: string;
  taxCode: string;
  query: string;
  rate: number | null;
};

export type InvoiceTaxOption = {
  code: string;
  label: string;
  region: string;
  defaultRate: number | null;
};
