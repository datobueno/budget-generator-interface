type BudgetTableColGroupProps = {
  widths: {
    action: number;
    concept: number;
    quantity: number;
    unitPrice: number;
    total: number;
  };
};

export function BudgetTableColGroup({ widths }: BudgetTableColGroupProps) {
  return (
    <colgroup>
      {widths.action > 0 ? <col style={{ width: `${widths.action}px` }} /> : null}
      <col style={{ width: `${widths.concept}px` }} />
      <col style={{ width: `${widths.quantity}px` }} />
      <col style={{ width: `${widths.unitPrice}px` }} />
      <col style={{ width: `${widths.total}px` }} />
    </colgroup>
  );
}
