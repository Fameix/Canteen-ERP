"use client"

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import type { Category } from "@/lib/types"

export interface ProductFormValues {
  name: string
  tamilName: string
  categoryId: string
  priceRupees: string
  isAvailable: boolean
}

export function ProductFields({
  value,
  onChange,
  categories,
}: {
  value: ProductFormValues
  onChange: (patch: Partial<ProductFormValues>) => void
  categories: Category[]
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="product-name">Product name</FieldLabel>
        <Input
          id="product-name"
          placeholder="e.g. Masala Dosa"
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="product-tamil">Tamil name (optional)</FieldLabel>
        <Input
          id="product-tamil"
          value={value.tamilName}
          onChange={(event) => onChange({ tamilName: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="product-category">Category</FieldLabel>
        <NativeSelect
          id="product-category"
          className="w-full"
          value={value.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
        >
          <NativeSelectOption value="">Select category</NativeSelectOption>
          {categories
            .filter((category) => category.active)
            .map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel htmlFor="product-price">Price (INR)</FieldLabel>
        <Input
          id="product-price"
          type="number"
          min="0.50"
          step="0.50"
          placeholder="e.g. 50"
          value={value.priceRupees}
          onChange={(event) => onChange({ priceRupees: event.target.value })}
        />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="product-available">
            Available for billing
          </FieldLabel>
          <FieldDescription>
            Show this product when creating a bill.
          </FieldDescription>
        </FieldContent>
        <Switch
          id="product-available"
          checked={value.isAvailable}
          onCheckedChange={(checked) => onChange({ isAvailable: checked })}
        />
      </Field>
    </FieldGroup>
  )
}
