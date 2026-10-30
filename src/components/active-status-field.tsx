import { FormField } from "@/components/form-fields"
import { Switch } from "@/components/ui/switch"

export function ActiveField({
  checked,
  onChange,
  onBlur,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  onBlur: () => void
}) {
  return (
    <FormField id="is_active" label="Status Aktif">
      <div className="flex min-h-10 items-center gap-3">
        <Switch
          id="is_active"
          checked={checked}
          onCheckedChange={onChange}
          onBlur={onBlur}
        />
        <span className="text-sm">{checked ? "Aktif" : "Tidak aktif"}</span>
      </div>
    </FormField>
  )
}

export function ActiveStatusFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      Status
      <select
        className="h-10 rounded-lg border bg-background px-3"
        aria-label="Filter status"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Semua</option>
        <option value="1">Aktif</option>
        <option value="0">Tidak aktif</option>
      </select>
    </label>
  )
}
