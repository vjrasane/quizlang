interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ActionButton({ children, className, ...props }: Props) {
  return (
    <button
      className={`w-full px-6 py-2.5 sm:py-2 bg-accent text-bg-0 font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
