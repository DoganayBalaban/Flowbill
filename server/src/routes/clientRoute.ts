import express from "express";
import {
  disableClientPortal,
  enableClientPortal,
  sendPortalMagicLink,
} from "../controllers/clientPortalController";
import {
  createClient,
  deleteClient,
  getAllClients,
  getClientById,
  getClientInvoices,
  getClientProjects,
  getClientRevenue,
  getClientStats,
  getClientTimeEntries,
  updateClient,
} from "../controllers/clientControllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @openapi
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [created_at, name, company, hourly_rate] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated client list
 *   post:
 *     tags: [Clients]
 *     summary: Create a client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               company: { type: string }
 *               hourly_rate: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Client created
 */
router.get("/", protect, getAllClients);
router.post("/", protect, createClient);

/**
 * @openapi
 * /api/clients/{id}/projects:
 *   get:
 *     tags: [Clients]
 *     summary: Get projects for a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client projects
 * /api/clients/{id}/invoices:
 *   get:
 *     tags: [Clients]
 *     summary: Get invoices for a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client invoices
 * /api/clients/{id}/revenue:
 *   get:
 *     tags: [Clients]
 *     summary: Get revenue data for a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client revenue data
 * /api/clients/{id}/stats:
 *   get:
 *     tags: [Clients]
 *     summary: Get stats for a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client stats
 * /api/clients/{id}/time-entries:
 *   get:
 *     tags: [Clients]
 *     summary: Get time entries for a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client time entries
 */
router.get("/:id/projects", protect, getClientProjects);
router.get("/:id/invoices", protect, getClientInvoices);
router.get("/:id/revenue", protect, getClientRevenue);
router.get("/:id/stats", protect, getClientStats);
router.get("/:id/time-entries", protect, getClientTimeEntries);

/**
 * @openapi
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get a client by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client data
 *       404:
 *         description: Client not found
 *   patch:
 *     tags: [Clients]
 *     summary: Update a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               company: { type: string }
 *               hourly_rate: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Client updated
 *   delete:
 *     tags: [Clients]
 *     summary: Delete a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Client deleted
 */
router.get("/:id", protect, getClientById);
router.patch("/:id", protect, updateClient);
router.delete("/:id", protect, deleteClient);

router.post("/:id/portal/enable", protect, enableClientPortal);
router.post("/:id/portal/disable", protect, disableClientPortal);
router.post("/:id/portal/send-link", protect, sendPortalMagicLink);

export default router;
