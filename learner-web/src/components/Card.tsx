export const Card = ({ children, className = "", interactive = false, ...props }: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  [key: string]: any;
}) => {
  return (
    <div className={`card ${interactive ? "card-interactive" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
};