import React, { lazy, Suspense } from "react";
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
import CheckoutReview from "./pages/billing/checkout/review";
import CheckoutPayment from "./pages/billing/checkout/payment";
import CheckoutSuccess from "./pages/billing/checkout/success";
import CustomersList from "./pages/customers/index";
import CustomerNew from "./pages/customers/new";
import CustomerDetail from "./pages/customers/detail";
import CustomerEdit from "./pages/customers/edit";
import SuppliersList from "./pages/suppliers/index";
import SupplierNew from "./pages/suppliers/new";
import SupplierDetail from "./pages/suppliers/detail";
import PurchasesList from "./pages/purchases/index";
import PurchaseNew from "./pages/purchases/new";
import PurchaseEdit from "./pages/purchases/edit";
import PurchaseDetail from "./pages/purchases/detail";
import ExpensesList from "./pages/expenses/index";
import ExpenseNew from "./pages/expenses/new";
import DailyClosing from "./pages/daily-closing/index";
import LowStock from "./pages/low-stock/index";
import StockMovements from "./pages/stock-movements/index";
import MoreMenu from "./pages/more/index";
import ProfitReports from "./pages/profit/index";
import SalesReport from "./pages/reports/sales";
import BillsHistory from "./pages/bills/index";
import BillDetail from "./pages/bills/detail";
const StoreSettings = lazy(() => import("@/pages/settings/store"));
const BillSettings = lazy(() => import("@/pages/settings/bill-settings"));
const DeviceCenter = lazy(() => import("@/pages/settings/devices"));
const ExportData = lazy(() => import("@/pages/settings/export"));
const SyncCenter = lazy(() => import("@/pages/settings/sync-center"));
const ShopMembers = lazy(() => import("@/pages/settings/members"));
import ProductVariants from "./pages/products/variants";
import BarcodeLabelPage from "./pages/products/barcode-label";
import BundlesList from "./pages/bundles/index";
import BundleNew from "./pages/bundles/new";
import BundleDetail from "./pages/bundles/detail";
import ReceiveStock from "./pages/stock/receive";

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
const CheckoutReviewPage = () => <Layout><CheckoutReview /></Layout>;
const CheckoutPaymentPage = () => <Layout><CheckoutPayment /></Layout>;
const CheckoutSuccessPage = () => <CheckoutSuccess />;
const CustomersListPage = () => <Layout><CustomersList /></Layout>;
const CustomerNewPage = () => <Layout><CustomerNew /></Layout>;
const CustomerDetailPage = () => <Layout><CustomerDetail /></Layout>;
const CustomerEditPage = () => <Layout><CustomerEdit /></Layout>;
const SuppliersListPage = () => <Layout><SuppliersList /></Layout>;
const SupplierNewPage = () => <Layout><SupplierNew /></Layout>;
const SupplierDetailPage = () => <Layout><SupplierDetail /></Layout>;
const PurchasesListPage = () => <Layout><PurchasesList /></Layout>;
const PurchaseNewPage = () => <Layout><PurchaseNew /></Layout>;
const PurchaseEditPage = () => <Layout><PurchaseEdit /></Layout>;
const PurchaseDetailPage = () => <Layout><PurchaseDetail /></Layout>;
const ExpensesListPage = () => <Layout><ExpensesList /></Layout>;
const ExpenseNewPage = () => <Layout><ExpenseNew /></Layout>;
const DailyClosingPage = () => <Layout><DailyClosing /></Layout>;
const LowStockPage = () => <Layout><LowStock /></Layout>;
const StockMovementsPage = () => <Layout><StockMovements /></Layout>;
const MoreMenuPage = () => <Layout><MoreMenu /></Layout>;
const ProfitReportsPage = () => <Layout><ProfitReports /></Layout>;
const SalesReportPage = () => <Layout><SalesReport /></Layout>;
const BillsHistoryPage = () => <Layout><BillsHistory /></Layout>;
const BillDetailPage = () => <BillDetail />;
const StoreSettingsPage = () => <Layout><Suspense fallback={null}><StoreSettings /></Suspense></Layout>;
const BundlesListPage = () => <Layout><BundlesList /></Layout>;
const BundleNewPage = () => <Layout><BundleNew /></Layout>;
const BundleDetailPage = () => <Layout><BundleDetail /></Layout>;
const BarcodeLabelRoute = () => <Layout><BarcodeLabelPage /></Layout>;
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


      <Route path="/billing/checkout/review" component={CheckoutReviewPage} />
      <Route path="/billing/checkout/payment" component={CheckoutPaymentPage} />
      <Route path="/billing/checkout/success" component={CheckoutSuccessPage} />
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
      <Route path="/purchases/:id/edit" component={PurchaseEditPage} />
      <Route path="/purchases/:id" component={PurchaseDetailPage} />

      <Route path="/expenses" component={ExpensesListPage} />
      <Route path="/expenses/new" component={ExpenseNewPage} />

      <Route path="/daily-closing" component={DailyClosingPage} />
      <Route path="/low-stock" component={LowStockPage} />
      <Route path="/stock-movements" component={StockMovementsPage} />

      <Route path="/settings/store" component={StoreSettingsPage} />
      <Route path="/settings/bill-settings" component={() => <Layout><Suspense fallback={null}><BillSettings /></Suspense></Layout>} />
      <Route path="/settings/devices" component={() => <Layout><Suspense fallback={null}><DeviceCenter /></Suspense></Layout>} />
      <Route path="/products/:id/variants" component={() => <Layout><ProductVariants /></Layout>} />

      <Route path="/more" component={MoreMenuPage} />
      <Route path="/profit" component={ProfitReportsPage} />
      <Route path="/reports/sales" component={SalesReportPage} />
      <Route path="/bills" component={BillsHistoryPage} />
      <Route path="/bills/:id" component={BillDetailPage} />
      <Route path="/bundles" component={BundlesListPage} />
      <Route path="/bundles/new" component={BundleNewPage} />
      <Route path="/bundles/:id" component={BundleDetailPage} />

      <Route path="/settings/export" component={() => <Layout><Suspense fallback={null}><ExportData /></Suspense></Layout>} />
      <Route path="/settings/sync-center" component={() => <Layout><Suspense fallback={null}><SyncCenter /></Suspense></Layout>} />
      <Route path="/settings/members" component={() => <Layout><Suspense fallback={null}><ShopMembers /></Suspense></Layout>} />
      <Route path="/stock/receive" component={() => <Layout><ReceiveStock /></Layout>} />

      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  React.useEffect(() => {
    window.localStorage.setItem('safai-auth', JSON.stringify({
      state: {
        session: { user: { id: '1' }, access_token: '123' },
        shop: { id: 1, name: 'Kirana Junction', ownerId: '1' }
      },
      version: 0
    }));
  }, []);
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
