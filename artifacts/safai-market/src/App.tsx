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
import ProfitReports from "./pages/profit/index";
import BillsHistory from "./pages/bills/index";

const queryClient = new QueryClient();

const HomePage = () => <Layout><Home /></Layout>;
const ProductsListPage = () => <Layout><ProductsList /></Layout>;
const ProductNewPage = () => <Layout><ProductNew /></Layout>;
const ProductDetailPage = () => <Layout><ProductDetail /></Layout>;
const BillingPage = () => <Layout><Billing /></Layout>;
const CustomersListPage = () => <Layout><CustomersList /></Layout>;
const CustomerNewPage = () => <Layout><CustomerNew /></Layout>;
const CustomerDetailPage = () => <Layout><CustomerDetail /></Layout>;
const SuppliersListPage = () => <Layout><SuppliersList /></Layout>;
const SupplierNewPage = () => <Layout><SupplierNew /></Layout>;
const SupplierDetailPage = () => <Layout><SupplierDetail /></Layout>;
const PurchasesListPage = () => <Layout><PurchasesList /></Layout>;
const PurchaseNewPage = () => <Layout><PurchaseNew /></Layout>;
const ExpensesListPage = () => <Layout><ExpensesList /></Layout>;
const ExpenseNewPage = () => <Layout><ExpenseNew /></Layout>;
const DailyClosingPage = () => <Layout><DailyClosing /></Layout>;
const LowStockPage = () => <Layout><LowStock /></Layout>;
const StockMovementsPage = () => <Layout><StockMovements /></Layout>;
const MoreMenuPage = () => <Layout><MoreMenu /></Layout>;
const ProfitReportsPage = () => <Layout><ProfitReports /></Layout>;
const BillsHistoryPage = () => <Layout><BillsHistory /></Layout>;
const NotFoundPage = () => <Layout><NotFound /></Layout>;

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />

      <Route path="/products" component={ProductsListPage} />
      <Route path="/products/new" component={ProductNewPage} />
      <Route path="/products/:id" component={ProductDetailPage} />

      <Route path="/billing" component={BillingPage} />

      <Route path="/customers" component={CustomersListPage} />
      <Route path="/customers/new" component={CustomerNewPage} />
      <Route path="/customers/:id" component={CustomerDetailPage} />

      <Route path="/suppliers" component={SuppliersListPage} />
      <Route path="/suppliers/new" component={SupplierNewPage} />
      <Route path="/suppliers/:id" component={SupplierDetailPage} />

      <Route path="/purchases" component={PurchasesListPage} />
      <Route path="/purchases/new" component={PurchaseNewPage} />

      <Route path="/expenses" component={ExpensesListPage} />
      <Route path="/expenses/new" component={ExpenseNewPage} />

      <Route path="/daily-closing" component={DailyClosingPage} />
      <Route path="/low-stock" component={LowStockPage} />
      <Route path="/stock-movements" component={StockMovementsPage} />

      <Route path="/more" component={MoreMenuPage} />
      <Route path="/profit" component={ProfitReportsPage} />
      <Route path="/bills" component={BillsHistoryPage} />

      <Route component={NotFoundPage} />
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
