const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const leadController = require('../controllers/leadController');
const settingController = require('../controllers/settingController');
const bannerController = require('../controllers/bannerController');
const miscController = require('../controllers/miscController');
const paymentController = require('../controllers/paymentController');
const orderController = require('../controllers/orderController');
const blogController = require('../controllers/blogController');

const { auth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ── Health ──
router.get("/", (req, res) => res.json({ status: "ok", message: "Chauhaan Computers API is running 🚀", database: "MySQL" }));

// ── Auth ──
router.post("/auth/login", authController.login);
router.post("/auth/signup", authController.signup);
router.get("/auth/me", auth, authController.getMe);

// ── Products ──
router.get("/products", productController.getProducts);
router.get("/products/all", auth, requireRole("admin"), productController.getAllProducts);
router.post("/products", auth, requireRole("admin"), productController.createProduct);
router.put("/products/:id", auth, requireRole("admin"), productController.updateProduct);
router.delete("/products/:id", auth, requireRole("admin"), productController.deleteProduct);

// ── Users ──
router.get("/users", auth, requireRole("admin"), userController.getUsers);
router.post("/users", auth, requireRole("admin"), userController.createUser);
router.put("/users/:id", auth, userController.updateUser);

// ── Leads ──
router.get("/leads", auth, requireRole("admin", "telecaller"), leadController.getLeads);
router.post("/leads", auth, leadController.createLead);
router.post("/leads/bulk", auth, requireRole("admin"), leadController.createLeadsBulk);
router.put("/leads/:id", auth, requireRole("admin", "telecaller"), leadController.updateLead);
router.delete("/leads/:id", auth, requireRole("admin"), leadController.deleteLead);

// ── Settings ──
router.get("/settings/public", settingController.getPublicSettings);
router.get("/settings", auth, requireRole("admin"), settingController.getAllSettings);
router.put("/settings/:key", auth, requireRole("admin"), settingController.updateSetting);

// ── Banners ──
router.get("/banners", bannerController.getBanners);
router.get("/banners/all", auth, requireRole("admin"), bannerController.getAllBanners);
router.post("/banners", auth, requireRole("admin"), bannerController.createBanner);
router.put("/banners/:id", auth, requireRole("admin"), bannerController.updateBanner);
router.delete("/banners/:id", auth, requireRole("admin"), bannerController.deleteBanner);

// ── Misc (Calls, Remarks, Social, Loyalty, Newsletter, Messages) ──
router.get("/calls", auth, requireRole("admin", "telecaller"), miscController.getCalls);
router.post("/calls", auth, requireRole("telecaller", "admin"), miscController.createCall);

router.get("/remarks", auth, miscController.getRemarks);
router.post("/remarks", auth, miscController.createRemark);

router.get("/social-links", miscController.getSocialLinks);
router.post("/social-links", auth, requireRole("admin"), miscController.createSocialLink);
router.put("/social-links/:id", auth, requireRole("admin"), miscController.updateSocialLink);
router.delete("/social-links/:id", auth, requireRole("admin"), miscController.deleteSocialLink);

router.get("/loyalty", auth, miscController.getLoyalty);
router.get("/loyalty/transactions", auth, miscController.getLoyaltyTransactions);

router.get("/enquiries", auth, miscController.getEnquiries);

router.get("/contact-messages", auth, requireRole("admin"), miscController.getContactMessages);
router.post("/contact-messages", miscController.createContactMessage);
router.put("/contact-messages/:id/read", auth, requireRole("admin"), miscController.markContactMessageRead);
router.delete("/contact-messages/:id", auth, requireRole("admin"), miscController.deleteContactMessage);

router.get("/newsletter", auth, requireRole("admin"), miscController.getNewsletterSubscribers);
router.post("/newsletter", miscController.subscribeNewsletter);
router.delete("/newsletter/:id", auth, requireRole("admin"), miscController.deleteNewsletterSubscriber);

const paymentController = require('../controllers/paymentController');
const orderController = require('../controllers/orderController');

// ── Upload ──
router.post("/upload", auth, requireRole("admin"), upload.array("files", 10), miscController.uploadFiles);

// ── Payments & Orders ──
router.post("/orders", auth, paymentController.createOrder);
router.post("/verify-payment", auth, paymentController.verifyPayment);
router.get("/orders", auth, orderController.getOrders);
router.get("/orders/:id", auth, orderController.getOrderDetails);

// Blogs
router.get("/blogs", blogController.getBlogs);
router.get("/blogs/:slug", blogController.getBlogBySlug);
router.get("/blogs/admin/all", auth, requireRole('admin'), blogController.getAllBlogs);
router.post("/blogs", auth, requireRole('admin'), blogController.createBlog);
router.put("/blogs/:id", auth, requireRole('admin'), blogController.updateBlog);
router.delete("/blogs/:id", auth, requireRole('admin'), blogController.deleteBlog);

module.exports = router;
