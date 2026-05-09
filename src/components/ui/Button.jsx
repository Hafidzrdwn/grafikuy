import { Loader2 } from 'lucide-react';

const Button = ({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  const variants = {
    primary: 'bg-(--color-primary) text-(--color-light) hover:bg-opacity-90 focus:ring-(--color-primary)',
    secondary: 'bg-(--color-dark) text-(--color-light) hover:bg-opacity-80 focus:ring-(--color-dark)',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-(--color-primary) hover:bg-(--color-muted) hover:bg-opacity-20 dark:hover:bg-(--color-dark)/30'
  };

  const isDisabled = disabled || loading;
  const classes = `${baseStyles} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button disabled={isDisabled} className={classes} {...props}>
      {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
