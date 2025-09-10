// src/components/CurrencyInput.tsx
'use client';

import { NumericFormat, NumericFormatProps } from 'react-number-format';
import React from 'react';

// Gabungkan props bawaan dengan props custom kita
interface CurrencyInputProps extends NumericFormatProps {
  id: string;
  name: string;
}

export default function CurrencyInput(props: CurrencyInputProps) {
  const { id, name, className, ...rest } = props;

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
      {...rest} // <-- Kunci perbaikan: teruskan semua props lainnya, termasuk onChange
    />
  );
}