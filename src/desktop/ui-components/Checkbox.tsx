type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
};

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 accent-crimson cursor-pointer flex-shrink-0"
    />
  );
}
