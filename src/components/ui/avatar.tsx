import { initials } from "@/lib/utils";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-700 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name || "?")}
    </div>
  );
}
