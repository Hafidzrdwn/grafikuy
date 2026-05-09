const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-[#1a365d] border border-(--color-muted) dark:border-[#3F72AF]/30 rounded-xl p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export default Card;
