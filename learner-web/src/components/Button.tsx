export const Button = ({ children, className = "", variant = "primary", ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: string;
  [key: string]: any;
}) => {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
};