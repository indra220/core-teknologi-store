// src/components/CurrencyInput.tsx
'use client';

import { NumericFormat, NumericFormatProps } from 'react-number-format';
import React from 'react';

interface CurrencyInputProps extends NumericFormatProps {
  id: string;
  name: string;
}

export default function CurrencyInput({ id, name, className, ...rest }: CurrencyInputProps) {
  return (
    <NumericFormat
      id={id}
      name={name}
      className={className}
      thousandSeparator="."
      decimalSeparator=","
      prefix="Rp "
      allowNegative={false}
      decimalScale={0}
      placeholder="Rp 0"
      {...rest}
    />
  );
}