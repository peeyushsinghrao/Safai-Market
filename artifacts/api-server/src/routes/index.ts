import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import profitRouter from "./profit";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import billsRouter from "./bills";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import purchasesRouter from "./purchases";
import stockMovementsRouter from "./stock_movements";
import expensesRouter from "./expenses";
import dailyClosingsRouter from "./daily_closings";
import bundlesRouter from "./bundles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(profitRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(billsRouter);
router.use(customersRouter);
router.use(suppliersRouter);
router.use(purchasesRouter);
router.use(stockMovementsRouter);
router.use(expensesRouter);
router.use(dailyClosingsRouter);
router.use(bundlesRouter);

export default router;
