import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-neutral-200">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}
export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-neutral-100 text-neutral-700">{children}</thead>;
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-medium", className)} {...props} />;
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}
export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-t border-neutral-200 hover:bg-primary-100/40", className)} {...props} />;
}
