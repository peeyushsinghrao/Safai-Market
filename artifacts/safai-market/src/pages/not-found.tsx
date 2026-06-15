import { PackageOpen } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-slate-50 p-6 pb-24 text-center font-sans">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <PackageOpen className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Aisle Not Found!</h1>
      <p className="text-[14px] font-medium text-slate-500 mb-8 max-w-[250px]">
        We looked everywhere, but couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link href="/">
        <a className="h-14 px-8 bg-primary text-white rounded-2xl font-bold text-[16px] flex items-center justify-center active-elevate shadow-sm transition-transform">
          Back to Shop
        </a>
      </Link>
    </div>
  );
}
