import { budgetStyles, type BudgetStyle } from '../../models/trip';

type BudgetStyleSelectProps = {
  id: string;
  value: BudgetStyle;
  onChange: (value: BudgetStyle) => void;
};

export function BudgetStyleSelect({ id, value, onChange }: BudgetStyleSelectProps) {
  return (
    <select
      id={id}
      className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value as BudgetStyle)}
    >
      {budgetStyles.map((style) => (
        <option key={style} value={style}>
          {style[0].toUpperCase()}
          {style.slice(1)}
        </option>
      ))}
    </select>
  );
}
