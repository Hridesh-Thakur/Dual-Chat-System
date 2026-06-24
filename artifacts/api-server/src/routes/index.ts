import { Router, type IRouter } from "express"; 
import healthRouter from "./health";
import authRouter from "./auth";
import coupleRouter from "./couple";
import messagesRouter from "./messages";
import moodsRouter from "./moods";
import journalRouter from "./journal";
import dailyNotesRouter from "./dailyNotes";
import memoriesRouter from "./memories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(coupleRouter);
router.use(messagesRouter);
router.use(moodsRouter);
router.use(journalRouter);
router.use(dailyNotesRouter);
router.use(memoriesRouter);

export default router;
