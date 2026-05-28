import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import Home from "./pages/home";
import ProductsList from "./pages/products/index";
import ProductNew from "./pages/products/new";
import ProductDetail from "./pages/products/detail";
import Billing from "./pages/billing/index";
import CustomersList from "./pages/customers/index";
import CustomerNew from "./pages/customers/new";
import CustomerDetail from "./pages/customers/detail";
import SuppliersList from "./pages/suppliers/index";
import SupplierNew from "./pages/suppliers/new";
import SupplierDetail from "./pages/suppliers/detail";
import PurchasesList from "./pages/purchases/index";
import PurchaseNew from "./pages/purchases/new";
import ExpensesList from "./pages/expenses/index";
import ExpenseNew from "./pages/expenses/new";
import DailyClosing from "./pages/daily-closing/index";
import LowStock from "./pages/low-stock/index";
import StockMovements from "./pages/stock-movements/index";
import MoreMenu from "./pages/more/index";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      
      <Route path="/products" component={() => <Layout><ProductsList /></Layout>} />
      <Route path="/products/new" component={() => <Layout><ProductNew /></Layout>} />
      <Route path="/products/:id" component={() => <Layout><ProductDetail /></Layout>} />
      
      <Route path="/billing" component={() => <Layout><Billing /></Layout>} />
      
      <Route path="/customers" component={() => <Layout><CustomersList /></Layout>} />
      <Route path="/customers/new" component={() => <Layout><CustomerNew /></Layout>} />
      <Route path="/customers/:id" component={() => <Layout><CustomerDetail /></Layout>} />
      
      <Route path="/suppliers" component={() => <Layout><SuppliersList /></Layout>} />
      <Route path="/suppliers/new" component={() => <Layout><SupplierNew /></Layout>} />
      <Route path="/suppliers/:id" component={() => <Layout><SupplierDetail /></Layout>} />
      
      <Route path="/purchases" component={() => <Layout><PurchasesList /></Layout>} />
      <Route path="/purchases/new" component={() => <Layout><PurchaseNew /></Layout>} />
      
      <Route path="/expenses" component={() => <Layout><ExpensesList /></Layout>} />
      <Route path="/expenses/new" component={() => <Layout><ExpenseNew /></Layout>} />
      
      <Route path="/daily-closing" component={() => <Layout><DailyClosing /></Layout>} />
      <Route path="/low-stock" component={() => <Layout><LowStock /></Layout>} />
      <Route path="/stock-movements" component={() => <Layout><StockMovements /></Layout>} />
      
      <Route path="/more" component={() => <Layout><MoreMenu /></Layout>} />
      
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
