import React from "react";
import { Link } from "wouter";

export default function MoreMenu() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">More</h1>
      <div className="space-y-2 flex flex-col">
        <Link href="/suppliers" className="p-3 bg-card rounded-md shadow-sm border font-medium">Suppliers</Link>
        <Link href="/purchases" className="p-3 bg-card rounded-md shadow-sm border font-medium">Purchase Entry</Link>
        <Link href="/expenses" className="p-3 bg-card rounded-md shadow-sm border font-medium">Expenses</Link>
        <Link href="/daily-closing" className="p-3 bg-card rounded-md shadow-sm border font-medium">Daily Closing</Link>
        <Link href="/low-stock" className="p-3 bg-card rounded-md shadow-sm border font-medium">What Is Finishing</Link>
        <Link href="/stock-movements" className="p-3 bg-card rounded-md shadow-sm border font-medium">Stock Movements</Link>
      </div>
    </div>
  );
}
