'use client';

import { NumericFormat } from 'react-number-format';

interface CurrencyInputProps {
  id: string;
  name: string;
  required?: boolean;
  className?: string;
  defaultValue?: number;
}

export default function CurrencyInput({ id, name, required, className, defaultValue }: CurrencyInputProps) {
  return (
    <NumericFormat
      id={id}
      name={name}
      required={required}
      className={className}
      thousandSeparator="."
      decimalSeparator=","
      prefix="Rp "
      allowNegative={false}
      decimalScale={0}
      defaultValue={defaultValue}
      placeholder="Rp 0"
    />
  );
}