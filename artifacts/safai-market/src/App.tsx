import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "./components/layout";
import { AuthProvider } from "./components/auth-provider";
import { AuthGuard } from "./components/auth-guard";

import Home from "./pages/home";
import ProductsList from "./pages/products/index";
import ProductNew from "./pages/products/new";
import ProductDetail from "./pages/products/detail";
import ProductEdit from "./pages/products/edit";
import Billing from "./pages/billing/index";
import CustomersList from "./pages/customers/index";
import CustomerNew from "./pages/customers/new";
import CustomerDetail from "./pages/customers/detail";
import CustomerEdit from "./pages/customers/edit";
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
import BillDetail from "./pages/bills/detail";
import StoreSettings from "./pages/settings/store";
import DevicesPage from "./pages/settings/devices";
import BillSettings from "./pages/settings/bill-settings";
import ProductVariants from "./pages/products/variants";
import BarcodeLabelPage from "./pages/products/barcode-label";
import BundlesList from "./pages/bundles/index";
import BundleNew from "./pages/bundles/new";
import BundleDetail from "./pages/bundles/detail";
import ExportPage from "./pages/settings/export";
import SyncCenter from "./pages/settings/sync-center";

import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import Onboarding from "./pages/auth/onboarding";

const queryClient = new QueryClient();

const HomePage = () => <Layout><Home /></Layout>;
const ProductsListPage = () => <Layout><ProductsList /></Layout>;
const ProductNewPage = () => <Layout><ProductNew /></Layout>;
const ProductDetailPage = () => <Layout><ProductDetail /></Layout>;
const ProductEditPage = () => <Layout><ProductEdit /></Layout>;
const BillingPage = () => <Layout><Billing /></Layout>;
const CustomersListPage = () => <Layout><CustomersList /></Layout>;
const CustomerNewPage = () => <Layout><CustomerNew /></Layout>;
const CustomerDetailPage = () => <Layout><CustomerDetail /></Layout>;
const CustomerEditPage = () => <Layout><CustomerEdit /></Layout>;
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
const BillDetailPage = () => <BillDetail />;
const StoreSettingsPage = () => <Layout><StoreSettings /></Layout>;
const BundlesListPage = () => <Layout><BundlesList /></Layout>;
const BundleNewPage = () => <Layout><BundleNew /></Layout>;
const BundleDetailPage = () => <Layout><BundleDetail /></Layout>;
const BarcodeLabelRoute = () => <Layout><BarcodeLabelPage /></Layout>;
const ExportPageRoute = () => <Layout><ExportPage /></Layout>;
const SyncCenterRoute = () => <Layout><SyncCenter /></Layout>;
const NotFoundPage = () => <Layout><NotFound /></Layout>;

function Router() {
  return (
    <Switch>
      {/* Auth routes — public */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/onboarding" component={Onboarding} />

      {/* App routes — protected by AuthGuard */}
      <Route path="/" component={HomePage} />

      <Route path="/products" component={ProductsListPage} />
      <Route path="/products/new" component={ProductNewPage} />
      <Route path="/products/:id/barcode-label" component={BarcodeLabelRoute} />
      <Route path="/products/:id/edit" component={ProductEditPage} />
      <Route path="/products/:id" component={ProductDetailPage} />


      <Route path="/billing" component={BillingPage} />

      <Route path="/customers" component={CustomersListPage} />
      <Route path="/customers/new" component={CustomerNewPage} />
      <Route path="/customers/:id/edit" component={CustomerEditPage} />
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

      <Route path="/settings/store" component={StoreSettingsPage} />
      <Route path="/settings/bill-settings" component={() => <Layout><BillSettings /></Layout>} />
      <Route path="/settings/devices" component={() => <Layout><DevicesPage /></Layout>} />
      <Route path="/products/:id/variants" component={() => <Layout><ProductVariants /></Layout>} />

      <Route path="/more" component={MoreMenuPage} />
      <Route path="/profit" component={ProfitReportsPage} />
      <Route path="/bills" component={BillsHistoryPage} />
      <Route path="/bills/:id" component={BillDetailPage} />
      <Route path="/bundles" component={BundlesListPage} />
      <Route path="/bundles/new" component={BundleNewPage} />
      <Route path="/bundles/:id" component={BundleDetailPage} />

      <Route path="/settings/export" component={ExportPageRoute} />
      <Route path="/settings/sync-center" component={SyncCenterRoute} />

      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AuthGuard>
              <Router />
            </AuthGuard>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
