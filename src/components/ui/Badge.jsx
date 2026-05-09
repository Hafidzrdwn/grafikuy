const Badge = ({ label, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-(--color-primary) text-(--color-light)',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
};

export default Badge;
