type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, disabled }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-4 h-4 accent-crimson flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    />
  );
}
