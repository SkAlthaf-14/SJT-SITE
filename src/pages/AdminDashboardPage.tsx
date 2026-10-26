import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  MessageSquare,
  Star,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  X,
  Clock,
  Flag,
  RotateCcw,
  Copy,
  ShieldAlert,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { OrderDetails, OrderStatus } from '../types';
import {
  subscribeToAdminDashboard,
  updateAdminOrderStatus,
  adminVerifyPayment,
  adminUnverifyPayment,
  adminRejectPayment,
  adminFlagPayment,
  adminEditPaymentMetadata,
  adminUpdateFulfillmentAndTracking,
  updateAdminContactStatus,
  deleteAdminContact,
  updateAdminReviewStatus,
  deleteAdminReview,
  calculateRealKPIs,
  RealCustomer,
  RealPaymentRecord,
  RealContactInquiry,
  RealReviewItem,
  AdminKPISummary,
} from '../services/adminData';
import { formatDisplayOrderId, updateLocalOrderCache } from '../services/orders';
import {
  FirestoreProduct,
  saveProduct,
  updateProductStock,
  toggleProductStatus,
  deleteProduct,
  uploadProductImage,
  seedCatalogueToFirestoreIfEmpty,
} from '../services/productsService';
import {
  downloadExcelSheetCSV,
  syncToMicrosoftGraph,
  ExcelWorkbookData,
} from '../services/excelSync';
import { SITE_CONFIG } from '../data/siteConfig';

interface AdminDashboardPageProps {
  initialTab?: 'overview' | 'orders' | 'customers' | 'products' | 'payments' | 'contacts' | 'reviews' | 'analytics' | 'excel';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ initialTab = 'overview' }) => {
  const { navigateTo } = useNavigation();
  const { user, loading, isAdmin, logoutUser, refreshAdminClaim } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'customers' | 'products' | 'payments' | 'contacts' | 'reviews' | 'analytics' | 'excel'
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);


  // Real-time datasets state (ZERO demo data)
  const [customers, setCustomers] = useState<RealCustomer[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [payments, setPayments] = useState<RealPaymentRecord[]>([]);
  const [contacts, setContacts] = useState<RealContactInquiry[]>([]);
  const [reviews, setReviews] = useState<RealReviewItem[]>([]);

  // Computed Real KPIs
  const kpis: AdminKPISummary = useMemo(() => {
    return calculateRealKPIs(customers, orders, products, reviews, contacts);
  }, [customers, orders, products, reviews, contacts]);

  // Loading & sync states
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Customer Directory Sorting, Filtering & Pagination state
  const [customerSortColumn, setCustomerSortColumn] = useState<
    'customerId' | 'name' | 'email' | 'phone' | 'role' | 'authProvider' | 'status' | 'createdAt' | 'lastLogin'
  >('createdAt');
  const [customerSortDirection, setCustomerSortDirection] = useState<'asc' | 'desc'>('desc');
  const [customerRoleFilter, setCustomerRoleFilter] = useState<'All' | 'customer' | 'admin'>('All');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'All' | 'active' | 'inactive'>('All');
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [customerPageSize, setCustomerPageSize] = useState<number>(10);

  // Order inspection modal & Tracking state
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('');
  const [courierTrackingIdInput, setCourierTrackingIdInput] = useState('');
  const [courierTrackingUrlInput, setCourierTrackingUrlInput] = useState('');
  const [fulfillmentStatusInput, setFulfillmentStatusInput] = useState<OrderStatus>('Processing');
  const [rejectionModalOrder, setRejectionModalOrder] = useState<OrderDetails | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [processingOrderIds, setProcessingOrderIds] = useState<Set<string>>(new Set());

  // Advanced Payment Verification Modals & State
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<string>('All');
  const [unverifyModalOrder, setUnverifyModalOrder] = useState<OrderDetails | null>(null);
  const [unverifyReasonText, setUnverifyReasonText] = useState('');
  const [isUnverifying, setIsUnverifying] = useState(false);

  const [flagModalOrder, setFlagModalOrder] = useState<OrderDetails | null>(null);
  const [flagReasonText, setFlagReasonText] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);

  const [editMetaModalOrder, setEditMetaModalOrder] = useState<OrderDetails | null>(null);
  const [editMetaField, setEditMetaField] = useState<'utrNumber' | 'verificationNotes' | 'assignedStaff' | 'amountReceived'>('utrNumber');
  const [editMetaNewValue, setEditMetaNewValue] = useState('');
  const [editMetaReason, setEditMetaReason] = useState('');
  const [isEditingMeta, setIsEditingMeta] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setCourierNameInput(selectedOrder.courierName || '');
      setCourierTrackingIdInput(selectedOrder.courierTrackingId || '');
      setCourierTrackingUrlInput(selectedOrder.courierTrackingUrl || '');
      setFulfillmentStatusInput(selectedOrder.orderStatus || 'Confirmed');
    }
  }, [selectedOrder]);

  // Product Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<FirestoreProduct> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSeedingCatalogue, setIsSeedingCatalogue] = useState(false);

  // Confirm delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'product' | 'contact' | 'review';
    id: string;
    title: string;
  } | null>(null);

  // Excel export status
  const [isSyncingExcel, setIsSyncingExcel] = useState(false);
  const [excelSyncStatus, setExcelSyncStatus] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);


  const showFlash = (text: string, type: 'success' | 'error' = 'success') => {
    setFlashMessage({ text, type });
    setTimeout(() => setFlashMessage(null), 3500);
  };

  // 1. SETUP REAL-TIME FIRESTORE LISTENERS
  useEffect(() => {
    if (!isAdmin) return;

    setIsFirestoreLoading(true);
    const subscription = subscribeToAdminDashboard({
      onCustomersUpdate: (data) => {
        setCustomers(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onOrdersUpdate: (data) => {
        setOrders(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onProductsUpdate: (data) => {
        setProducts(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onPaymentsUpdate: (data) => {
        setPayments(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onContactsUpdate: (data) => {
        setContacts(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onReviewsUpdate: (data) => {
        setReviews(data);
        setIsFirestoreLoading(false);
        setLastRefreshedAt(new Date());
      },
      onError: (err) => {
        console.error('[Admin Portal] Firestore sync error:', err);
        setIsFirestoreLoading(false);
      },
    });

    return () => {
      subscription.unsubscribeAll();
    };
  }, [isAdmin]);

  // Redirect unauthenticated visitors to /admin/login
  useEffect(() => {
    if (!loading && !user) {
      navigateTo('admin-login');
    }
  }, [loading, user, navigateTo]);

  // Deny access if normal customer attempts to open Admin
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      let isCancelled = false;
      if (refreshAdminClaim) {
        refreshAdminClaim().then((granted) => {
          if (granted || isCancelled) return;
          const timer = setTimeout(() => {
            if (!isCancelled) navigateTo('home');
          }, 3000);
          return () => clearTimeout(timer);
        });
      } else {
        const timer = setTimeout(() => {
          navigateTo('home');
        }, 3000);
        return () => clearTimeout(timer);
      }
      return () => {
        isCancelled = true;
      };
    }
  }, [loading, user, isAdmin, navigateTo, refreshAdminClaim]);


  const handleLogout = async () => {
    await logoutUser();
    navigateTo('home');
  };

  // --- ORDER & PAYMENT MANAGEMENT ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      showFlash(`Order #${orderId} marked as ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId || o.displayId?.includes(orderId) || String(o.orderNumber) === orderId
            ? { ...o, orderStatus: newStatus }
            : o
        )
      );
    } catch (err: any) {
      showFlash(err?.message || 'Failed to update order status in Firestore.', 'error');
    }
  };

  const handleVerifyPayment = async (orderRefInput: string, orderObj?: OrderDetails) => {
    const targetKey = orderObj?.firestoreDocId || orderObj?.orderId || orderRefInput;
    if (processingOrderIds.has(targetKey)) return;
    setProcessingOrderIds((prev) => new Set(prev).add(targetKey));
    setIsVerifyingPayment(true);
    try {
      const isCod = Boolean(
        orderObj?.paymentMethod?.toLowerCase().includes('cash on delivery') ||
        orderObj?.paymentMethod?.toLowerCase().includes('cod')
      );
      const defaultNotes = isCod
        ? 'Cash on delivery payment collected and verified by administrator.'
        : 'Verified by administrator against PhonePe / Bank Statement';

      const res = await adminVerifyPayment(
        targetKey,
        defaultNotes,
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message, 'success');
        setOrders((prev) =>
          prev.map((o) => {
            const matches =
              (orderObj?.firestoreDocId && o.firestoreDocId === orderObj.firestoreDocId) ||
              o.firestoreDocId === targetKey ||
              o.orderId === targetKey ||
              o.orderId === orderObj?.orderId ||
              o.displayId?.includes(targetKey) ||
              String(o.orderNumber) === targetKey ||
              String(o.orderNumber) === String(orderObj?.orderNumber);
            if (matches) {
              const currentOrderStatus = (o.orderStatus || '').toLowerCase();
              const nextOrderStatus =
                currentOrderStatus === 'pending' || currentOrderStatus === 'received' || currentOrderStatus === 'awaiting_payment'
                  ? 'Confirmed'
                  : o.orderStatus;
              const updatedOrder: OrderDetails = {
                ...o,
                paymentStatus: 'Payment Approved',
                paymentVerificationStatus: 'paid',
                paymentVerifiedBy: user?.email || 'Administrator',
                paymentVerifiedAt: new Date().toISOString(),
                orderStatus: nextOrderStatus as OrderStatus,
              };
              updateLocalOrderCache(updatedOrder);
              return updatedOrder;
            }
            return o;
          })
        );
        if (selectedOrder) {
          const matches =
            (orderObj?.firestoreDocId && selectedOrder.firestoreDocId === orderObj.firestoreDocId) ||
            selectedOrder.firestoreDocId === targetKey ||
            selectedOrder.orderId === targetKey ||
            selectedOrder.orderId === orderObj?.orderId ||
            selectedOrder.displayId?.includes(targetKey) ||
            String(selectedOrder.orderNumber) === targetKey;
          if (matches) {
            const currentOrderStatus = (selectedOrder.orderStatus || '').toLowerCase();
            const nextOrderStatus =
              currentOrderStatus === 'pending' || currentOrderStatus === 'received' || currentOrderStatus === 'awaiting_payment'
                ? 'Confirmed'
                : selectedOrder.orderStatus;
            const updatedSelected: OrderDetails = {
              ...selectedOrder,
              paymentStatus: 'Payment Approved',
              paymentVerificationStatus: 'paid',
              paymentVerifiedBy: user?.email || 'Administrator',
              paymentVerifiedAt: new Date().toISOString(),
              orderStatus: nextOrderStatus as OrderStatus,
            };
            setSelectedOrder(updatedSelected);
            updateLocalOrderCache(updatedSelected);
          }
        }
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      console.error('[Admin Verify Error]:', err);
      showFlash(err?.message || 'Failed to verify payment.', 'error');
    } finally {
      setIsVerifyingPayment(false);
      setProcessingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(targetKey);
        return next;
      });
    }
  };

  const handleOpenRejectModal = (order: OrderDetails) => {
    setRejectionModalOrder(order);
    setRejectionReasonText('Transaction reference not found in merchant bank account statement.');
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectionModalOrder) return;
    const cleanReason = rejectionReasonText.trim();
    if (!cleanReason) {
      showFlash('Please specify a mandatory rejection reason.', 'error');
      return;
    }
    const targetKey = rejectionModalOrder.firestoreDocId || rejectionModalOrder.orderId;
    if (processingOrderIds.has(targetKey) || isRejecting) return;
    setProcessingOrderIds((prev) => new Set(prev).add(targetKey));
    setIsRejecting(true);
    try {
      const res = await adminRejectPayment(
        targetKey,
        cleanReason,
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message, 'success');
        setOrders((prev) =>
          prev.map((o) => {
            const matches =
              (rejectionModalOrder.firestoreDocId && o.firestoreDocId === rejectionModalOrder.firestoreDocId) ||
              o.firestoreDocId === targetKey ||
              o.orderId === targetKey ||
              o.orderId === rejectionModalOrder.orderId ||
              o.displayId?.includes(targetKey) ||
              String(o.orderNumber) === targetKey;
            if (matches) {
              const updatedOrder: OrderDetails = {
                ...o,
                paymentStatus: 'Payment Rejected',
                paymentVerificationStatus: 'rejected',
                paymentRejectionReason: cleanReason,
              };
              updateLocalOrderCache(updatedOrder);
              return updatedOrder;
            }
            return o;
          })
        );
        if (selectedOrder) {
          const matches =
            (rejectionModalOrder.firestoreDocId && selectedOrder.firestoreDocId === rejectionModalOrder.firestoreDocId) ||
            selectedOrder.firestoreDocId === targetKey ||
            selectedOrder.orderId === targetKey ||
            selectedOrder.orderId === rejectionModalOrder.orderId ||
            selectedOrder.displayId?.includes(targetKey) ||
            String(selectedOrder.orderNumber) === targetKey;
          if (matches) {
            const updatedSelected: OrderDetails = {
              ...selectedOrder,
              paymentStatus: 'Payment Rejected',
              paymentVerificationStatus: 'rejected',
              paymentRejectionReason: cleanReason,
            };
            setSelectedOrder(updatedSelected);
            updateLocalOrderCache(updatedSelected);
          }
        }
        setRejectionModalOrder(null);
        setRejectionReasonText('');
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      console.error('[Admin Reject Error]:', err);
      showFlash(err?.message || 'Failed to reject payment.', 'error');
    } finally {
      setIsRejecting(false);
      setProcessingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(targetKey);
        return next;
      });
    }
  };

  const handleConfirmUnverifyPayment = async () => {
    if (!unverifyModalOrder) return;
    const cleanReason = unverifyReasonText.trim();
    if (!cleanReason) {
      showFlash('Please specify a mandatory reason to unverify payment.', 'error');
      return;
    }
    const targetKey = unverifyModalOrder.firestoreDocId || unverifyModalOrder.orderId;
    setIsUnverifying(true);
    try {
      const res = await adminUnverifyPayment(
        targetKey,
        cleanReason,
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message, 'success');
        setOrders((prev) =>
          prev.map((o) => {
            const matches =
              (unverifyModalOrder.firestoreDocId && o.firestoreDocId === unverifyModalOrder.firestoreDocId) ||
              o.firestoreDocId === targetKey ||
              o.orderId === targetKey ||
              o.orderId === unverifyModalOrder.orderId ||
              o.displayId?.includes(targetKey) ||
              String(o.orderNumber) === targetKey;
            if (matches) {
              const updatedOrder: OrderDetails = {
                ...o,
                paymentStatus: 'pending_verification',
                paymentVerificationStatus: 'verification_pending',
                orderStatus: 'payment_review' as OrderStatus,
              };
              updateLocalOrderCache(updatedOrder);
              return updatedOrder;
            }
            return o;
          })
        );
        if (selectedOrder) {
          const matches =
            (unverifyModalOrder.firestoreDocId && selectedOrder.firestoreDocId === unverifyModalOrder.firestoreDocId) ||
            selectedOrder.firestoreDocId === targetKey ||
            selectedOrder.orderId === targetKey ||
            selectedOrder.orderId === unverifyModalOrder.orderId ||
            selectedOrder.displayId?.includes(targetKey) ||
            String(selectedOrder.orderNumber) === targetKey;
          if (matches) {
            const updatedSelected: OrderDetails = {
              ...selectedOrder,
              paymentStatus: 'pending_verification',
              paymentVerificationStatus: 'verification_pending',
              orderStatus: 'payment_review' as OrderStatus,
            };
            setSelectedOrder(updatedSelected);
            updateLocalOrderCache(updatedSelected);
          }
        }
        setUnverifyModalOrder(null);
        setUnverifyReasonText('');
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      showFlash(err?.message || 'Failed to unverify payment.', 'error');
    } finally {
      setIsUnverifying(false);
    }
  };

  const handleConfirmFlagPayment = async () => {
    if (!flagModalOrder || !flagReasonText.trim()) {
      showFlash('Please provide a reason for flagging this transaction.', 'error');
      return;
    }
    setIsFlagging(true);
    try {
      const res = await adminFlagPayment(
        flagModalOrder.orderId,
        flagReasonText,
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message);
        if (selectedOrder && (selectedOrder.orderId === flagModalOrder.orderId || selectedOrder.displayId?.includes(flagModalOrder.orderId))) {
          setSelectedOrder({
            ...selectedOrder,
            isFlagged: true,
            flagReason: flagReasonText,
            paymentVerificationStatus: 'under_review',
          });
        }
        setFlagModalOrder(null);
        setFlagReasonText('');
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      showFlash(err?.message || 'Failed to flag payment.', 'error');
    } finally {
      setIsFlagging(false);
    }
  };

  const handleConfirmEditMetadata = async () => {
    if (!editMetaModalOrder || !editMetaReason.trim()) {
      showFlash('A mandatory audit reason is required.', 'error');
      return;
    }
    setIsEditingMeta(true);
    try {
      const res = await adminEditPaymentMetadata(
        editMetaModalOrder.orderId,
        editMetaField,
        editMetaNewValue,
        editMetaReason,
        user?.uid || 'admin',
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message);
        setEditMetaModalOrder(null);
        setEditMetaNewValue('');
        setEditMetaReason('');
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      showFlash(err?.message || 'Failed to update metadata.', 'error');
    } finally {
      setIsEditingMeta(false);
    }
  };

  const handleSaveFulfillmentAndTracking = async (orderId: string) => {
    setIsUpdatingTracking(true);
    try {
      const res = await adminUpdateFulfillmentAndTracking(
        orderId,
        fulfillmentStatusInput,
        {
          courierName: courierNameInput,
          courierTrackingId: courierTrackingIdInput,
          courierTrackingUrl: courierTrackingUrlInput,
        },
        user?.email || 'Administrator'
      );
      if (res.success) {
        showFlash(res.message);
        if (selectedOrder && (selectedOrder.orderId === orderId || selectedOrder.displayId?.includes(orderId))) {
          setSelectedOrder({
            ...selectedOrder,
            orderStatus: fulfillmentStatusInput,
            courierName: courierNameInput,
            courierTrackingId: courierTrackingIdInput,
            courierTrackingUrl: courierTrackingUrlInput,
          });
        }
      } else {
        showFlash(res.message, 'error');
      }
    } catch (err: any) {
      showFlash(err?.message || 'Failed to update fulfillment & tracking.', 'error');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  // --- PRODUCT MANAGEMENT ---
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      category: 'Coffee Powder',
      tagline: '',
      description: '',
      price: 450,
      stock: 50,
      status: 'active',
      images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'],
      weights: ['250g', '500g'],
      strength: 'Medium',
      roastLevel: 'Medium Dark',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: FirestoreProduct) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) {
      showFlash('Please specify product name.', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      await saveProduct(editingProduct as any);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      showFlash(`Product "${editingProduct.name}" saved to Firestore successfully.`);
    } catch (err: any) {
      showFlash(err?.message || 'Failed to save product in Firestore.', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleInlineStockUpdate = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await updateProductStock(id, newStock);
      showFlash(`Stock updated to ${newStock} units`);
    } catch (err: any) {
      showFlash(err?.message || 'Could not update stock.', 'error');
    }
  };

  const handleToggleProductStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleProductStatus(id, nextStatus);
      showFlash(`Product status changed to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      showFlash(err?.message || 'Could not update product status.', 'error');
    }
  };

  const handleSeedCatalogue = async () => {
    setIsSeedingCatalogue(true);
    try {
      const count = await seedCatalogueToFirestoreIfEmpty();
      showFlash(`Seeded ${count} roastery products into live Firestore catalogue.`);
    } catch (err: any) {
      showFlash('Failed to seed products: ' + err?.message, 'error');
    } finally {
      setIsSeedingCatalogue(false);
    }
  };

  // --- CONTACTS MANAGEMENT ---
  const handleUpdateContactStatus = async (id: string, status: 'new' | 'read' | 'replied' | 'closed') => {
    try {
      await updateAdminContactStatus(id, status);
      showFlash(`Message marked as ${status.toUpperCase()}`);
    } catch (err: any) {
      showFlash(err?.message || 'Failed to update contact message status.', 'error');
    }
  };

  // --- REVIEWS MANAGEMENT ---
  const handleUpdateReviewStatus = async (id: string, status: 'approved' | 'rejected' | 'hidden' | 'pending') => {
    try {
      await updateAdminReviewStatus(id, status);
      showFlash(`Review marked as ${status.toUpperCase()}`);
    } catch (err: any) {
      showFlash(err?.message || 'Failed to update review status.', 'error');
    }
  };

  // --- CONFIRMED DELETION ---
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'product') {
        await deleteProduct(deleteConfirm.id);
        showFlash('Product deleted from Firestore.');
      } else if (deleteConfirm.type === 'contact') {
        await deleteAdminContact(deleteConfirm.id);
        showFlash('Inquiry removed from Firestore.');
      } else if (deleteConfirm.type === 'review') {
        await deleteAdminReview(deleteConfirm.id);
        showFlash('Review removed from Firestore.');
      }
    } catch (err: any) {
      showFlash(err?.message || 'Failed to delete record.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // --- INTEGRATION TESTS & EXPORTS ---
  const handleTriggerExcelSync = async () => {
    setIsSyncingExcel(true);
    setExcelSyncStatus('Connecting to Microsoft Graph API...');
    const result = await syncToMicrosoftGraph();
    setIsSyncingExcel(false);
    setExcelSyncStatus(`${result.message} [Timestamp: ${result.timestamp}]`);
  };


  // --- FILTERED DATASETS ---
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      const matchesStatus = orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const cleanQ = q.replace(/^order\s*#/i, '').replace(/^#/, '').trim();
      const matchesSearch =
        o.orderId.toLowerCase().includes(q) ||
        (o.orderNumber && String(o.orderNumber).includes(cleanQ)) ||
        (o.displayId && o.displayId.toLowerCase().includes(q)) ||
        (o.utrNumber && o.utrNumber.toLowerCase().includes(q)) ||
        o.customer?.fullName?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.customer?.phone?.toLowerCase().includes(q) ||
        o.customer?.city?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    // Stable sort descending: newest-first by creation timestamp, with numeric orderNumber tie-breaker
    return [...list].sort((a, b) => {
      const timeA = a.createdAtTimestamp ?? new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAtTimestamp ?? new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      const numA = a.orderNumber ?? (parseInt(String(a.orderId).replace(/\D/g, ''), 10) || 0);
      const numB = b.orderNumber ?? (parseInt(String(b.orderId).replace(/\D/g, ''), 10) || 0);
      return numB - numA;
    });
  }, [orders, orderStatusFilter, searchQuery]);

  // Customer Directory Sorting & Filtering
  const filteredAndSortedCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter by search query, role, and status
    const filtered = customers.filter((c) => {
      // Role filter
      if (customerRoleFilter !== 'All') {
        if ((c.role || 'customer').toLowerCase() !== customerRoleFilter.toLowerCase()) return false;
      }
      // Status filter
      if (customerStatusFilter !== 'All') {
        if ((c.status || 'active').toLowerCase() !== customerStatusFilter.toLowerCase()) return false;
      }
      // Search query
      if (!q) return true;
      return (
        c.customerId.toLowerCase().includes(q) ||
        (c.customerId.startsWith('#') && c.customerId.slice(1).includes(q)) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });

    // 2. Sort across complete dataset before pagination
    return [...filtered].sort((a, b) => {
      let cmp = 0;

      switch (customerSortColumn) {
        case 'customerId': {
          const numA = parseInt(a.customerId.replace(/\D/g, ''), 10);
          const numB = parseInt(b.customerId.replace(/\D/g, ''), 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            cmp = numA - numB;
          } else {
            cmp = a.customerId.localeCompare(b.customerId, undefined, { numeric: true, sensitivity: 'base' });
          }
          break;
        }
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '', undefined, { sensitivity: 'base' });
          break;
        case 'phone':
          cmp = (a.phone || '').localeCompare(b.phone || '', undefined, { numeric: true });
          break;
        case 'role':
          cmp = (a.role || '').localeCompare(b.role || '');
          break;
        case 'authProvider':
          cmp = (a.authProvider || '').localeCompare(b.authProvider || '');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '');
          break;
        case 'createdAt': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
          break;
        }
        case 'lastLogin': {
          const timeA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const timeB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          cmp = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
          break;
        }
      }

      // Apply sort direction
      if (cmp !== 0) {
        return customerSortDirection === 'asc' ? cmp : -cmp;
      }

      // Deterministic secondary tie-breaker: numeric customerId then UID so order never jumps
      const tieNumA = parseInt(a.customerId.replace(/\D/g, ''), 10) || 0;
      const tieNumB = parseInt(b.customerId.replace(/\D/g, ''), 10) || 0;
      if (tieNumA !== tieNumB) {
        return tieNumA - tieNumB;
      }
      return (a.uid || '').localeCompare(b.uid || '');
    });
  }, [customers, searchQuery, customerRoleFilter, customerStatusFilter, customerSortColumn, customerSortDirection]);

  // Backward compatibility alias
  const filteredCustomers = filteredAndSortedCustomers;

  // Pagination for Customers
  const totalCustomerCount = filteredAndSortedCustomers.length;
  const totalCustomerPages = customerPageSize === -1 ? 1 : Math.max(1, Math.ceil(totalCustomerCount / customerPageSize));
  const validCustomerPage = Math.min(Math.max(1, customerPage), totalCustomerPages);

  const paginatedCustomers = useMemo(() => {
    if (customerPageSize === -1) return filteredAndSortedCustomers;
    const startIdx = (validCustomerPage - 1) * customerPageSize;
    return filteredAndSortedCustomers.slice(startIdx, startIdx + customerPageSize);
  }, [filteredAndSortedCustomers, validCustomerPage, customerPageSize]);

  const handleCustomerSort = (column: typeof customerSortColumn) => {
    if (customerSortColumn === column) {
      setCustomerSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCustomerSortColumn(column);
      setCustomerSortDirection(column === 'createdAt' || column === 'lastLogin' ? 'desc' : 'asc');
    }
    setCustomerPage(1);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, productCategoryFilter, searchQuery]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return payments.filter((p) => {
      const matchingOrder = orders.find(
        (o) =>
          o.orderId === p.orderId ||
          o.displayId?.includes(p.orderId) ||
          (o.orderNumber && String(o.orderNumber) === p.orderId.replace('order_', ''))
      );

      // Status filter
      if (paymentFilterStatus !== 'All') {
        const v = (matchingOrder?.paymentVerificationStatus || p.status || '').toLowerCase();
        if (paymentFilterStatus === 'Awaiting Verification' && !v.includes('pending') && !v.includes('submitted')) return false;
        if (paymentFilterStatus === 'Verified' && v !== 'paid' && v !== 'confirmed') return false;
        if (paymentFilterStatus === 'Rejected' && v !== 'rejected' && v !== 'failed') return false;
        if (paymentFilterStatus === 'Flagged' && !matchingOrder?.isFlagged && v !== 'under_review') return false;
      }

      if (!q) return true;
      return (
        p.paymentId.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q.replace(/^#/, '')) ||
        (matchingOrder?.orderNumber && String(matchingOrder.orderNumber).includes(q.replace(/^#/, ''))) ||
        p.customerName.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q) ||
        (matchingOrder?.utrNumber && matchingOrder.utrNumber.toLowerCase().includes(q)) ||
        (matchingOrder?.customer?.email && matchingOrder.customer.email.toLowerCase().includes(q)) ||
        (matchingOrder?.customer?.phone && matchingOrder.customer.phone.includes(q)) ||
        (matchingOrder?.assignedStaff && matchingOrder.assignedStaff.toLowerCase().includes(q))
      );
    });
  }, [payments, orders, searchQuery, paymentFilterStatus]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  // Analytics Aggregations (100% Real Firestore Data)
  const analyticsData = useMemo(() => {
    // 1. Orders & Revenue Over Time (grouped by date)
    const timelineMap: Record<string, { date: string; orders: number; revenue: number }> = {};
    orders.forEach((o) => {
      const dateKey = o.createdAt ? o.createdAt.split('T')[0] : 'Recent';
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, orders: 0, revenue: 0 };
      }
      timelineMap[dateKey].orders += 1;
      timelineMap[dateKey].revenue += Number(o.total) || 0;
    });
    const ordersOverTime = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Top Products (by quantity and revenue)
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const name = item.product?.name || 'Coffee Item';
          if (!productStats[name]) {
            productStats[name] = { name, quantity: 0, revenue: 0 };
          }
          productStats[name].quantity += Number(item.quantity) || 1;
          productStats[name].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        });
      }
    });
    const topProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // 3. Customer Growth (grouped by registration month)
    const customerGrowthMap: Record<string, number> = {};
    customers.forEach((c) => {
      const monthKey = c.createdAt ? c.createdAt.slice(0, 7) : 'Recent';
      customerGrowthMap[monthKey] = (customerGrowthMap[monthKey] || 0) + 1;
    });
    const customerGrowth = Object.entries(customerGrowthMap).map(([month, count]) => ({ month, count }));

    // 4. Product Inventory by Category
    const categoryInventory: Record<string, { total: number; stock: number; lowStock: number }> = {};
    products.forEach((p) => {
      const cat = p.category || 'Other';
      if (!categoryInventory[cat]) {
        categoryInventory[cat] = { total: 0, stock: 0, lowStock: 0 };
      }
      categoryInventory[cat].total += 1;
      categoryInventory[cat].stock += Number(p.stock) || 0;
      if (p.stock > 0 && p.stock <= 10) categoryInventory[cat].lowStock += 1;
    });
    const inventoryBreakdown = Object.entries(categoryInventory).map(([category, stats]) => ({
      category,
      ...stats,
    }));

    return {
      ordersOverTime,
      topProducts,
      customerGrowth,
      inventoryBreakdown,
    };
  }, [orders, customers, products]);

  // 1. LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-[#F7F2EA] px-4 py-12">
        <div className="w-12 h-12 rounded-full border-3 border-[#C49A5A] border-t-transparent animate-spin mb-4" />
        <span className="text-xs font-serif font-bold text-[#201814] tracking-widest uppercase">
          SJT FARMS
        </span>
        <p className="text-xs text-[#8A796E] mt-1 animate-pulse">
          Verifying administrative credentials with Cloud Firestore...
        </p>
      </div>
    );
  }

  // 2. UNAUTHENTICATED SCREEN
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F2EA] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E4D8C8] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#24150F] flex items-center justify-center text-[#DFBF82] mx-auto border border-[#C49A5A]/30">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#A37936] uppercase tracking-[0.25em] block mb-1">
              Restricted Area
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
              SJT Admin Portal
            </h1>
            <p className="text-xs text-[#6B5B52] mt-1.5">
              Authorized personnel only. Please sign in with your SJT FARMS administrator account.
            </p>
          </div>

          <button
            onClick={() => navigateTo('admin-login')}
            className="w-full py-3.5 bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In to Admin Portal</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-[#6B5B52] hover:text-[#201814] underline block mx-auto cursor-pointer"
          >
            ← Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // 3. UNAUTHORIZED CUSTOMER SCREEN
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F2EA] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.25em] block mb-1">
              Access Denied
            </span>
            <h1 className="font-serif text-2xl font-extrabold text-[#201814]">
              Administrator Privileges Required
            </h1>
            <p className="text-xs text-[#6B5B52] mt-2">
              You are signed in as <strong>{user.email}</strong>, which is a customer account.
            </p>
            <p className="text-[11px] text-[#A37936] mt-1">
              Redirecting you to the storefront in 3 seconds...
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-3 bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Return to Storefront Now
            </button>
            <button
              onClick={() => navigateTo('dashboard')}
              className="w-full py-2.5 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#201814] rounded-xl text-xs font-semibold border border-[#E4D8C8] transition-colors cursor-pointer"
            >
              Go to Customer Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED REAL PRODUCTION ADMIN PORTAL ---
  return (
    <div className="min-h-screen bg-[#F7F2EA] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* TOP CONSOLE HEADER WITH ADMIN PROFILE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE2D2] text-[#24150F] text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className={`w-2 h-2 rounded-full ${isFirestoreLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-600 animate-pulse'}`} />
              <span>SJT FARMS PRODUCTION ADMIN • {isFirestoreLoading ? 'SYNCING FIRESTORE...' : 'LIVE FIRESTORE STREAM'}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
              Executive Roastery Dashboard
            </h1>
            <p className="text-xs text-[#6B5B52] mt-0.5">
              100% Real data from Cloud Firestore. No demo data, zero mock metrics.
            </p>
          </div>

          {/* ADMIN PROFILE CARD & ACTIONS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-[#F7F2EA] px-3.5 py-2 rounded-2xl border border-[#E4D8C8]">
              <div className="w-8 h-8 rounded-full bg-[#24150F] text-[#DFBF82] font-bold text-xs flex items-center justify-center border border-[#C49A5A]/30">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-[#201814] block leading-tight">{user.name || 'Administrator'}</span>
                <span className="text-[10px] text-[#A37936] block font-mono">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('excel')}
              className="px-4 py-2.5 bg-[#170C08] text-[#DFBF82] hover:bg-[#342017] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C49A5A]" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* FIXED FLOATING TOAST NOTIFICATION (ALWAYS IN VIEWPORT) */}
        {flashMessage && (
          <div className="fixed top-5 right-5 z-50 max-w-md animate-slideDown shadow-2xl">
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
                flashMessage.type === 'error'
                  ? 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-900/10'
                  : 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-900/10'
              } backdrop-blur-md`}
            >
              {flashMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <span className="leading-snug flex-1">{flashMessage.text}</span>
              <button
                onClick={() => setFlashMessage(null)}
                className="p-1 rounded-lg hover:bg-black/5 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* INLINE FLASH NOTIFICATION BANNER */}
        {flashMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
              flashMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {flashMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{flashMessage.text}</span>
          </div>
        )}

        {/* 12 REAL KPI METRIC CARDS (ZERO FAKE STATS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
              {kpis.totalCustomers}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Live Firestore Users</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
              {kpis.totalOrders}
            </span>
            <span className="text-[10px] text-[#A37936] font-semibold mt-1 block">Authentic Orders</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold mt-1 block">Live Order Sum</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Pending Orders
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700 block mt-1">
              {kpis.pendingOrders}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold mt-1 block">Awaiting Confirmation</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Processing / Transit
            </span>
            <span className="font-serif text-2xl font-bold text-blue-700 block mt-1">
              {kpis.processingOrders}
            </span>
            <span className="text-[10px] text-blue-800 font-semibold mt-1 block">Roasting & Dispatched</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Delivered Orders
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">
              {kpis.deliveredOrders}
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold mt-1 block">Completed</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Cancelled Orders
            </span>
            <span className="font-serif text-2xl font-bold text-rose-700 block mt-1">
              {kpis.cancelledOrders}
            </span>
            <span className="text-[10px] text-rose-800 font-semibold mt-1 block">Voided</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Total Products
            </span>
            <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
              {kpis.totalProducts}
            </span>
            <span className="text-[10px] text-[#A37936] font-semibold mt-1 block">Active In Catalogue</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Low Stock Items
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700 block mt-1">
              {kpis.lowStockProducts}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold mt-1 block">≤ 10 Units Left</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Out of Stock
            </span>
            <span className="font-serif text-2xl font-bold text-rose-700 block mt-1">
              {kpis.outOfStockProducts}
            </span>
            <span className="text-[10px] text-rose-800 font-semibold mt-1 block">0 Units</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              Pending Reviews
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700 block mt-1">
              {kpis.pendingReviews}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold mt-1 block">Awaiting Moderation</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E4D8C8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
              New Messages
            </span>
            <span className="font-serif text-2xl font-bold text-indigo-700 block mt-1">
              {kpis.newContactMessages}
            </span>
            <span className="text-[10px] text-indigo-800 font-semibold mt-1 block">Unread Inquiries</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E4D8C8] no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'contacts', label: `Inquiries (${contacts.length})`, icon: MessageSquare },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'excel', label: 'Data Export (.CSV)', icon: FileSpreadsheet },


          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#24150F] text-[#DFBF82] shadow-sm'
                    : 'bg-white text-[#201814] hover:bg-[#EDE2D2] border border-[#E4D8C8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#201814]">
                    Recent Customer Orders
                  </h3>
                  <p className="text-xs text-[#6B5B52]">
                    Live stream from Cloud Firestore `orders` collection
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#A37936] font-bold hover:underline"
                >
                  View All ({orders.length}) →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                  No orders yet. When customers check out on the website, authentic orders appear here in real time.
                </div>
              ) : (
                <div className="divide-y divide-[#E4D8C8]/60 overflow-x-auto">
                  {orders.slice(0, 6).map((o) => (
                    <div key={o.orderId} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#24150F]">
                          {formatDisplayOrderId(o.orderNumber || o.orderId)}
                        </span>
                        <p className="text-[#6B5B52]">{o.customer?.fullName} • {o.customer?.city || 'India'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[#201814]">₹{o.total}</span>
                        <p className="text-[10px] text-[#948277]">{(o.paymentMethod || 'COD').split('(')[0]}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EDE2D2] text-[#24150F]">
                        {o.orderStatus || 'Confirmed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS & NOTIFICATIONS */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#201814]">
                  Operational Center
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] text-[#948277] uppercase font-bold block">Live Database</span>
                    <span className="font-bold text-emerald-800">Google Cloud Firestore (Active)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] text-[#948277] uppercase font-bold block">Notification Email</span>
                    <span className="font-bold text-[#201814]">{SITE_CONFIG.contact.businessNotificationEmail}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] text-[#948277] uppercase font-bold block">Last Stream Update</span>
                    <span className="font-mono text-[11px] text-[#24150F]">
                      {lastRefreshedAt.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('products')}
                    className="w-full py-2.5 bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Manage Products</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('excel')}
                    className="w-full py-2.5 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#201814] rounded-xl text-xs font-semibold border border-[#E4D8C8] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                    <span>Export Real-Time Data (.CSV)</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS (100% REAL) */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201814]">
                  Real Customer Orders ({filteredOrders.length}{filteredOrders.length !== orders.length ? ` of ${orders.length}` : ''})
                </h3>
                <p className="text-xs text-[#6B5B52]">
                  Live customer orders from Firestore. Change roasting and courier delivery statuses instantly.
                </p>
              </div>

              <button
                onClick={() => downloadExcelSheetCSV('orders', filteredOrders, customers, contacts, reviews)}
                className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                <span>Export Orders (.csv)</span>
              </button>
            </div>

            {/* SEARCH & STATUS FILTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#948277] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, Email, City..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B5B52] whitespace-nowrap">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="text-xs p-2 rounded-xl border border-[#E4D8C8] bg-white text-[#24150F] font-semibold"
                >
                  <option value="All">All ({orders.length})</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                {orders.length === 0 ? 'No orders yet' : 'No orders match your filter.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#E4D8C8] text-[#948277] font-semibold uppercase text-[10px]">
                      <th className="py-3 px-2">Order ID</th>
                      <th className="py-3 px-2">Customer</th>
                      <th className="py-3 px-2">Items & Sizes</th>
                      <th className="py-3 px-2">Total</th>
                      <th className="py-3 px-2">Payment & UTR</th>
                      <th className="py-3 px-2">Fulfillment & Tracking</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4D8C8]/60">
                    {filteredOrders.map((o) => {
                      const isPaid =
                        o.paymentStatus === 'Payment Approved' ||
                        o.paymentStatus === 'Payment Confirmed' ||
                        o.paymentStatus === 'payment_approved' ||
                        o.paymentStatus === 'Paid' ||
                        o.paymentStatus === 'paid' ||
                        o.paymentVerificationStatus === 'paid' ||
                        o.paymentVerificationStatus === 'confirmed';
                      const isRejected =
                        o.paymentStatus === 'Payment Rejected' ||
                        o.paymentStatus === 'payment_rejected' ||
                        o.paymentStatus === 'failed' ||
                        o.paymentVerificationStatus === 'rejected';
                      const isPendingVerify =
                        !isPaid &&
                        !isRejected &&
                        (o.paymentStatus === 'Verification Pending' ||
                          o.paymentStatus === 'payment_pending_verification' ||
                          o.paymentStatus === 'Payment Details Submitted' ||
                          o.paymentVerificationStatus === 'verification_pending' ||
                          o.paymentVerificationStatus === 'details_submitted' ||
                          Boolean(o.utrNumber));

                      const isCod = Boolean(
                        o.paymentMethod?.toLowerCase().includes('cash on delivery') ||
                        o.paymentMethod?.toLowerCase().includes('cod')
                      );

                      const rowKey = o.firestoreDocId || o.orderId;
                      const isRowProcessing = processingOrderIds.has(rowKey) || processingOrderIds.has(o.orderId);

                      return (
                        <tr key={rowKey} className="hover:bg-[#F7F2EA]/50">
                          <td className="py-3.5 px-2 font-mono font-bold text-[#24150F]">
                            {formatDisplayOrderId(o.orderNumber || o.orderId)}
                            <span className="block text-[10px] text-[#948277] font-normal font-sans">
                              {o.createdAt?.split('T')[0] || 'Recent'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <p className="font-semibold text-[#201814]">{o.customer?.fullName}</p>
                            <p className="text-[10px] text-[#6B5B52] truncate max-w-[150px]">{o.customer?.email}</p>
                            <p className="text-[10px] text-[#6B5B52]">{o.customer?.phone}</p>
                          </td>
                          <td className="py-3.5 px-2 max-w-xs">
                            {o.items?.map((it, idx) => (
                              <div key={idx} className="truncate text-[11px] text-[#24150F]">
                                • {it.product?.name} ({it.selectedWeight} × {it.quantity})
                              </div>
                            ))}
                          </td>
                          <td className="py-3.5 px-2 font-serif font-bold text-[#24150F]">
                            ₹{o.total}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="text-[10px] font-semibold block text-[#201814]">
                              {(o.paymentMethod || 'UPI / PhonePe').split('(')[0]}
                            </span>
                            {o.utrNumber && (
                              <div className="font-mono text-[9px] text-[#24150F] bg-white px-1.5 py-0.5 rounded border border-[#E4D8C8] inline-block my-0.5">
                                UTR: <strong>{o.utrNumber}</strong>
                              </div>
                            )}
                            <div>
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Payment Approved</span>
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                                  <X className="w-2.5 h-2.5" />
                                  <span>Payment Rejected</span>
                                </span>
                              ) : isPendingVerify ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  Verification Pending
                                </span>
                              ) : isCod ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  Cash on Delivery
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700">
                                  Awaiting Payment
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <select
                              value={o.orderStatus || 'Confirmed'}
                              onChange={(e) => handleUpdateOrderStatus(rowKey, e.target.value as OrderStatus)}
                              className="text-xs p-1.5 rounded-lg border border-[#E4D8C8] bg-white text-[#24150F] font-medium cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            {o.courierTrackingId && (
                              <p className="text-[10px] text-[#6B5B52] font-mono mt-0.5 truncate max-w-[130px]">
                                {o.courierName ? `${o.courierName}: ` : ''}{o.courierTrackingId}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              {!isPaid ? (
                                <>
                                  <button
                                    onClick={() => handleVerifyPayment(rowKey, o)}
                                    disabled={isRowProcessing}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isCod ? "Confirm Cash on Delivery Received" : "Verify & Approve Payment against Bank Statement"}
                                  >
                                    {isRowProcessing ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(o)}
                                    disabled={isRowProcessing}
                                    className="p-1.5 text-rose-700 hover:bg-rose-50 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Reject Payment (Audit Required)"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setUnverifyModalOrder(o)}
                                  disabled={isRowProcessing}
                                  className="p-1.5 text-amber-700 hover:bg-amber-50 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Correct / Unverify Payment (Audit Required)"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="p-1.5 text-[#24150F] hover:text-[#C49A5A] rounded hover:bg-[#EDE2D2] cursor-pointer"
                                title="Inspect order details & edit courier tracking"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMERS (100% REAL) */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201814]">
                  Registered Customers Directory ({customers.length})
                </h3>
                <p className="text-xs text-[#6B5B52]">
                  Real users from Firestore `users` collection. Internal unique ID is Firebase UID.
                </p>
              </div>
              <button
                onClick={() => downloadExcelSheetCSV('customers', orders, filteredAndSortedCustomers, contacts, reviews)}
                className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
                title="Export currently filtered and sorted customers to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                <span>Export Customers ({filteredAndSortedCustomers.length}) (.csv)</span>
              </button>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#948277] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Email, Phone, City..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomerPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCustomerPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#948277] hover:text-[#201814] p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role filter */}
                <div className="flex items-center gap-1.5 bg-[#F7F2EA] px-2.5 py-1.5 rounded-xl border border-[#E4D8C8] text-xs">
                  <Filter className="w-3 h-3 text-[#948277]" />
                  <span className="text-[10px] uppercase font-bold text-[#948277]">Role:</span>
                  <select
                    value={customerRoleFilter}
                    onChange={(e) => {
                      setCustomerRoleFilter(e.target.value as any);
                      setCustomerPage(1);
                    }}
                    className="bg-transparent font-medium text-[#201814] text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5 bg-[#F7F2EA] px-2.5 py-1.5 rounded-xl border border-[#E4D8C8] text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#948277]">Status:</span>
                  <select
                    value={customerStatusFilter}
                    onChange={(e) => {
                      setCustomerStatusFilter(e.target.value as any);
                      setCustomerPage(1);
                    }}
                    className="bg-transparent font-medium text-[#201814] text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Page size */}
                <div className="flex items-center gap-1.5 bg-[#F7F2EA] px-2.5 py-1.5 rounded-xl border border-[#E4D8C8] text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#948277]">Show:</span>
                  <select
                    value={customerPageSize}
                    onChange={(e) => {
                      setCustomerPageSize(Number(e.target.value));
                      setCustomerPage(1);
                    }}
                    className="bg-transparent font-medium text-[#201814] text-xs focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={-1}>All ({totalCustomerCount})</option>
                  </select>
                </div>
              </div>
            </div>

            {totalCustomerCount === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                {customers.length === 0 ? 'No registered customers found in Firestore.' : 'No customers match your active search and filter criteria.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-[#E4D8C8]">
                  <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                    <thead>
                      <tr className="border-b border-[#E4D8C8] text-[#948277] font-semibold uppercase text-[10px] bg-[#FAF7F2]">
                        <th
                          onClick={() => handleCustomerSort('customerId')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'customerId' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Customer ID</span>
                            {customerSortColumn === 'customerId' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('name')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'name' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Name & Email</span>
                            {customerSortColumn === 'name' || customerSortColumn === 'email' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('phone')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'phone' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Phone</span>
                            {customerSortColumn === 'phone' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('role')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'role' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Role</span>
                            {customerSortColumn === 'role' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('authProvider')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'authProvider' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Provider</span>
                            {customerSortColumn === 'authProvider' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('status')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'status' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            {customerSortColumn === 'status' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('createdAt')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'createdAt' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Created At</span>
                            {customerSortColumn === 'createdAt' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleCustomerSort('lastLogin')}
                          className="py-3 px-3 cursor-pointer hover:bg-[#F0EBE3] transition-colors select-none"
                          aria-sort={customerSortColumn === 'lastLogin' ? (customerSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Last Login</span>
                            {customerSortColumn === 'lastLogin' ? (
                              customerSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A37936]" /> : <ArrowDown className="w-3 h-3 text-[#A37936]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4D8C8]/60 bg-white">
                      {paginatedCustomers.map((c) => (
                        <tr key={c.uid || c.customerId} className="hover:bg-[#F7F2EA]/60 transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-[#24150F]">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#F4EDE2] border border-[#E4D8C8]">
                              #{c.customerId}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-[#201814] truncate max-w-[220px]" title={c.name}>
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[#6B5B52] truncate max-w-[220px]" title={c.email}>
                              {c.email}
                            </p>
                            {c.city && (
                              <p className="text-[9px] text-[#948277] truncate max-w-[220px]">
                                📍 {c.city}{c.state ? `, ${c.state}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[11px] text-[#6B5B52]">
                            {c.phone ? <span>{c.phone}</span> : <span className="text-[#B5A599] italic">—</span>}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                c.role === 'admin'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {c.role || 'customer'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-[#6B5B52] capitalize">
                            <span className="inline-flex items-center gap-1">
                              {c.authProvider === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                c.status === 'inactive'
                                  ? 'bg-neutral-100 text-neutral-600 border-neutral-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {c.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-[#6B5B52] text-[11px]" title={c.createdAt || 'N/A'}>
                            {c.createdAt ? (
                              <span>{c.createdAt.split('T')[0]}</span>
                            ) : (
                              <span className="text-[#B5A599] italic">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[#6B5B52] text-[11px]" title={c.lastLogin || 'N/A'}>
                            {c.lastLogin ? (
                              <span>{c.lastLogin.split('T')[0]}</span>
                            ) : (
                              <span className="text-[#B5A599] italic">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#6B5B52]">
                  <div>
                    <span>
                      Showing <strong>{totalCustomerCount === 0 ? 0 : (validCustomerPage - 1) * (customerPageSize === -1 ? totalCustomerCount : customerPageSize) + 1}</strong>
                      –<strong>{customerPageSize === -1 ? totalCustomerCount : Math.min(validCustomerPage * customerPageSize, totalCustomerCount)}</strong> of <strong>{totalCustomerCount}</strong> customers
                      {totalCustomerCount !== customers.length && (
                        <span className="text-[#948277] ml-1">(filtered from {customers.length} total)</span>
                      )}
                    </span>
                  </div>

                  {totalCustomerPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={validCustomerPage <= 1}
                        onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-[#E4D8C8] bg-white hover:bg-[#F7F2EA] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#24150F]" />
                      </button>

                      {Array.from({ length: totalCustomerPages }, (_, i) => i + 1)
                        .filter((pageNum) => {
                          return (
                            pageNum === 1 ||
                            pageNum === totalCustomerPages ||
                            Math.abs(pageNum - validCustomerPage) <= 1
                          );
                        })
                        .map((pageNum, idx, arr) => {
                          const prev = arr[idx - 1];
                          const hasGap = prev && pageNum - prev > 1;
                          return (
                            <React.Fragment key={pageNum}>
                              {hasGap && <span className="px-1 text-[#948277]">…</span>}
                              <button
                                type="button"
                                onClick={() => setCustomerPage(pageNum)}
                                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  validCustomerPage === pageNum
                                    ? 'bg-[#24150F] text-[#DFBF82] border-[#24150F]'
                                    : 'bg-white hover:bg-[#F7F2EA] text-[#24150F] border-[#E4D8C8]'
                                }`}
                              >
                                {pageNum}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        type="button"
                        disabled={validCustomerPage >= totalCustomerPages}
                        onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
                        className="p-1.5 rounded-lg border border-[#E4D8C8] bg-white hover:bg-[#F7F2EA] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4 text-[#24150F]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRODUCTS (100% REAL FIRESTORE) */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201814]">
                  Product Catalogue ({products.length})
                </h3>
                <p className="text-xs text-[#6B5B52]">
                  Live inventory and prices stored directly in Cloud Firestore. Changes sync immediately to the customer storefront.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {products.length === 0 && (
                  <button
                    onClick={handleSeedCatalogue}
                    disabled={isSeedingCatalogue}
                    className="px-3.5 py-2 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSeedingCatalogue ? 'Importing...' : 'Seed Roastery Catalogue'}
                  </button>
                )}

                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>

                <button
                  onClick={() => downloadExcelSheetCSV('products', orders, customers, contacts, reviews)}
                  className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                  <span>Export Products (.csv)</span>
                </button>
              </div>
            </div>

            {/* SEARCH & CATEGORY FILTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#948277] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by Name, Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B5B52] whitespace-nowrap">Category:</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-[#E4D8C8] bg-white text-[#24150F] font-semibold"
                >
                  <option value="All">All Categories</option>
                  <option value="Coffee Powder">Coffee Powder</option>
                  <option value="Filter Coffee">Filter Coffee</option>
                  <option value="Specialty">Specialty</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8] space-y-3">
                <p>No products available</p>
                {products.length === 0 && (
                  <button
                    onClick={handleSeedCatalogue}
                    disabled={isSeedingCatalogue}
                    className="px-4 py-2 bg-[#24150F] text-[#DFBF82] rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Initialize Firestore Products Collection</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#E4D8C8] text-[#948277] font-semibold uppercase text-[10px]">
                      <th className="py-3 px-2">Product</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Price (₹)</th>
                      <th className="py-3 px-2">Stock Control</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Updated Date</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4D8C8]/60">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F7F2EA]/50">
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3">
                            {(p as any).jarImages?.['100g'] || (p as any).jarImages?.['50g'] || (p.images && p.images[0]) ? (
                              <img
                                src={(p as any).jarImages?.['100g'] || (p as any).jarImages?.['50g'] || p.images[0]}
                                alt={p.name}
                                className="w-11 h-11 object-contain p-0.5 rounded-lg border border-[#E4D8C8] bg-white shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-[#EDE2D2] rounded-lg flex items-center justify-center text-[#24150F] shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-serif font-bold text-[#201814]">{p.name}</p>
                              <p className="text-[10px] text-[#6B5B52] truncate max-w-xs">{p.tagline}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {(p as any).verifiedBlendRatio && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {(p as any).verifiedBlendRatio}
                                  </span>
                                )}
                                {(p as any).flaggedNotice && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    ⚠️ Flagged formulation
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-[#6B5B52]">{p.category}</td>
                        <td className="py-3.5 px-2">
                          <span className="font-serif font-bold text-[#24150F] text-xs">₹{p.price}</span>
                          {p.weights && p.weights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.weights.map((w) => (
                                <span key={w} className="px-1.5 py-0.5 rounded bg-[#EDE2D2] text-[#24150F] text-[9px] font-mono font-bold">
                                  {w}: ₹{(p as any).weightPrices?.[w] ?? p.price}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="inline-flex items-center gap-1.5 bg-[#F7F2EA] px-2 py-1 rounded-lg border border-[#E4D8C8]">
                            <button
                              onClick={() => handleInlineStockUpdate(p.id, p.stock, -5)}
                              className="w-5 h-5 rounded bg-white hover:bg-neutral-200 text-[#201814] font-bold text-xs flex items-center justify-center cursor-pointer"
                              title="Decrease stock by 5"
                            >
                              -
                            </button>
                            <span className={`font-mono font-bold text-xs min-w-[36px] text-center ${
                              p.stock === 0 ? 'text-rose-600' : p.stock <= 10 ? 'text-amber-600' : 'text-[#201814]'
                            }`}>
                              {p.stock}
                            </span>
                            <button
                              onClick={() => handleInlineStockUpdate(p.id, p.stock, 5)}
                              className="w-5 h-5 rounded bg-white hover:bg-neutral-200 text-[#201814] font-bold text-xs flex items-center justify-center cursor-pointer"
                              title="Increase stock by 5"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <button
                            onClick={() => handleToggleProductStatus(p.id, p.status)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              p.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            }`}
                          >
                            {p.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-2 text-[#948277] text-[10px]">
                          {p.updatedAt ? p.updatedAt.split('T')[0] : p.createdAt ? p.createdAt.split('T')[0] : 'Recent'}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-[#24150F] hover:text-[#C49A5A] rounded hover:bg-[#EDE2D2] cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'product',
                                  id: p.id,
                                  title: `Product "${p.name}"`,
                                })
                              }
                              className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PAYMENTS (ADVANCED VERIFICATION & LEDGER) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* 1. PAYMENT OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Awaiting Verification
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-amber-900 mt-1 block">
                  {kpis.paymentsAwaitingVerification}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Needs bank reconciliation</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Verified Payments
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-900 mt-1 block">
                  {kpis.verifiedPayments}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Reconciled in bank</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Rejected Payments
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-rose-900 mt-1 block">
                  {kpis.rejectedPayments}
                </span>
                <span className="text-[10px] text-rose-700 font-medium">UTR not found / failed</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-xs">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  Flagged / Suspicious
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-purple-900 mt-1 block">
                  {kpis.flaggedUtrs}
                </span>
                <span className="text-[10px] text-purple-700 font-medium">Duplicate UTR investigation</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E4D8C8] shadow-xs">
                <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
                  Pending Payment Value
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-[#24150F] mt-1 block">
                  ₹{kpis.totalPendingPaymentValue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#6B5B52] font-medium">Uncollected revenue</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E4D8C8] shadow-xs">
                <span className="text-[10px] font-bold text-[#948277] uppercase tracking-wider block">
                  Verified Payment Value
                </span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 mt-1 block">
                  ₹{kpis.totalVerifiedPaymentValue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Verified bank credits</span>
              </div>
            </div>

            {/* 2. TRANSACTIONS TABLE CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#201814]">
                    Payment Verification Ledger ({filteredPayments.length})
                  </h3>
                  <p className="text-xs text-[#6B5B52]">
                    Review submitted UTRs against PhonePe / bank statements. Entering a UTR is never treated as proof of payment.
                  </p>
                </div>
                <button
                  onClick={() => downloadExcelSheetCSV('payments', filteredOrders, customers, contacts, reviews)}
                  className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                  <span>Export Payments (.csv)</span>
                </button>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#948277] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, UTR, Customer, Phone, Staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#6B5B52] shrink-0">Filter Status:</span>
                  <select
                    value={paymentFilterStatus}
                    onChange={(e) => setPaymentFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs font-semibold text-[#201814] focus:outline-none focus:border-[#C49A5A] cursor-pointer"
                  >
                    <option value="All">All Transactions</option>
                    <option value="Awaiting Verification">Awaiting Verification</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Rejected">Rejected Only</option>
                    <option value="Flagged">Flagged / Under Review</option>
                  </select>
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                  {payments.length === 0 ? 'No payments found' : 'No payments match your search filter.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[920px]">
                    <thead>
                      <tr className="border-b border-[#E4D8C8] text-[#948277] font-semibold uppercase text-[10px]">
                        <th className="py-3 px-2">Order #</th>
                        <th className="py-3 px-2">Customer & Contact</th>
                        <th className="py-3 px-2">Method</th>
                        <th className="py-3 px-2">UTR Reference</th>
                        <th className="py-3 px-2">Amount (Exp / Rec)</th>
                        <th className="py-3 px-2">Payment Status</th>
                        <th className="py-3 px-2">Order State</th>
                        <th className="py-3 px-2">Assigned Staff</th>
                        <th className="py-3 px-2 text-right">Verification Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4D8C8]/60">
                      {filteredPayments.map((p) => {
                        const matchingOrder = orders.find(
                          (o) =>
                            o.orderId === p.orderId ||
                            o.displayId?.includes(p.orderId) ||
                            (o.orderNumber && String(o.orderNumber) === p.orderId.replace('order_', ''))
                        );

                        const isVerified =
                          p.status === 'confirmed' ||
                          p.paymentStatus.includes('Paid') ||
                          matchingOrder?.paymentVerificationStatus === 'paid';

                        const isRejected =
                          p.status === 'rejected' ||
                          matchingOrder?.paymentVerificationStatus === 'rejected';

                        const isFlagged =
                          Boolean(matchingOrder?.isFlagged) ||
                          matchingOrder?.paymentVerificationStatus === 'under_review';

                        return (
                          <tr key={p.paymentId} className="hover:bg-[#F7F2EA]/50 transition-colors">
                            {/* Order ID */}
                            <td className="py-3 px-2 font-mono font-bold text-[#24150F]">
                              {formatDisplayOrderId(p.orderId)}
                              <span className="block text-[10px] text-[#948277] font-normal font-sans">
                                {p.createdAt ? p.createdAt.split('T')[0] : 'Recent'}
                              </span>
                            </td>

                            {/* Customer & Contact */}
                            <td className="py-3 px-2">
                              <p className="font-semibold text-[#201814]">{p.customerName}</p>
                              {matchingOrder?.customer && (
                                <p className="text-[10px] text-[#6B5B52]">
                                  {matchingOrder.customer.phone} • {matchingOrder.customer.email}
                                </p>
                              )}
                            </td>

                            {/* Payment Method */}
                            <td className="py-3 px-2 text-[#6B5B52]">
                              <span className="px-2 py-0.5 rounded-md bg-[#F7F2EA] border border-[#E4D8C8] text-[10px] font-medium">
                                {p.paymentMethod || 'UPI / PhonePe'}
                              </span>
                            </td>

                            {/* UTR Reference */}
                            <td className="py-3 px-2 font-mono text-xs">
                              {p.transactionReference ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#24150F] bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {p.transactionReference}
                                  </span>
                                  <button
                                    onClick={() => navigator.clipboard?.writeText(p.transactionReference)}
                                    className="p-1 hover:text-[#24150F] text-[#948277] cursor-pointer"
                                    title="Copy UTR"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[#948277] italic">No UTR submitted</span>
                              )}
                            </td>

                            {/* Amount Expected vs Received */}
                            <td className="py-3 px-2 font-serif">
                              <span className="font-bold text-[#201814]">₹{p.amount}</span>
                              {matchingOrder?.amountReceived !== undefined && (
                                <span className="block text-[10px] text-emerald-700 font-sans">
                                  Rec: ₹{matchingOrder.amountReceived}
                                </span>
                              )}
                            </td>

                            {/* Payment Status Badges */}
                            <td className="py-3 px-2">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isVerified
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isRejected
                                      ? 'bg-rose-100 text-rose-800'
                                      : isFlagged
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isVerified ? 'Verified' : isRejected ? 'Rejected' : isFlagged ? 'Under Review' : 'Awaiting Check'}
                                </span>
                                {isFlagged && (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    <span>Flagged</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Order Status */}
                            <td className="py-3 px-2 text-[11px] font-semibold text-[#24150F]">
                              {matchingOrder?.orderStatus || 'received'}
                            </td>

                            {/* Staff Assigned */}
                            <td className="py-3 px-2 text-[11px] text-[#6B5B52]">
                              {matchingOrder?.assignedStaff || 'Unassigned'}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isVerified && (
                                  <button
                                    onClick={() => handleVerifyPayment(matchingOrder?.firestoreDocId || p.orderId, matchingOrder || undefined)}
                                    disabled={processingOrderIds.has(matchingOrder?.firestoreDocId || p.orderId) || processingOrderIds.has(p.orderId)}
                                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                    title="Confirm payment after bank verification"
                                  >
                                    {(processingOrderIds.has(matchingOrder?.firestoreDocId || p.orderId) || processingOrderIds.has(p.orderId)) && (
                                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                                    )}
                                    <span>{(processingOrderIds.has(matchingOrder?.firestoreDocId || p.orderId) || processingOrderIds.has(p.orderId)) ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                )}

                                {isVerified && (
                                  <button
                                    onClick={() => matchingOrder && setUnverifyModalOrder(matchingOrder)}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Unverify payment (reason required)"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Unverify</span>
                                  </button>
                                )}

                                {!isRejected && !isVerified && (
                                  <button
                                    onClick={() => matchingOrder && handleOpenRejectModal(matchingOrder)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Reject payment with reason"
                                  >
                                    Reject
                                  </button>
                                )}

                                <button
                                  onClick={() => matchingOrder && setFlagModalOrder(matchingOrder)}
                                  className="p-1 hover:bg-[#F7F2EA] text-purple-700 rounded-lg border border-purple-200 cursor-pointer"
                                  title="Flag for fraud / duplicate investigation"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => matchingOrder && setEditMetaModalOrder(matchingOrder)}
                                  className="p-1 hover:bg-[#F7F2EA] text-[#6B5B52] rounded-lg border border-[#E4D8C8] cursor-pointer"
                                  title="Edit payment metadata with audit log"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {matchingOrder && (
                                  <button
                                    onClick={() => setSelectedOrder(matchingOrder)}
                                    className="p-1 hover:bg-[#F7F2EA] text-[#24150F] rounded-lg border border-[#E4D8C8] cursor-pointer"
                                    title="View full order inspection & timeline"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CONTACTS (100% REAL) */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201814]">
                  Concierge Inquiries ({contacts.length})
                </h3>
                <p className="text-xs text-[#6B5B52]">
                  Direct inquiries submitted by customers via Contact forms, forwarded to <strong className="text-[#201814]">{SITE_CONFIG.contact.businessNotificationEmail}</strong>.
                </p>
              </div>
              <button
                onClick={() => downloadExcelSheetCSV('contacts', orders, customers, contacts, reviews)}
                className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                <span>Export Contacts (.csv)</span>
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                {contacts.length === 0 ? 'No contact messages' : 'No messages match your search.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-[#201814] text-sm">{c.name}</span>
                        <span className="text-[#6B5B52] ml-2 font-mono">({c.email}) {c.phone ? `• ${c.phone}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'new'
                            ? 'bg-indigo-100 text-indigo-800'
                            : c.status === 'read'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-[#948277] text-[10px]">{c.createdAt?.split('T')[0] || 'Recently'}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-[#A37936] uppercase tracking-wider block">
                      Topic: {c.topic || 'General Inquiry'}
                    </span>

                    <p className="text-xs text-[#201814] bg-white p-3.5 rounded-xl border border-[#E4D8C8]/60 leading-relaxed">
                      "{c.message}"
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {c.status !== 'read' && (
                          <button
                            onClick={() => handleUpdateContactStatus(c.id, 'read')}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-[#201814] border border-[#E4D8C8] rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        {c.status !== 'replied' && (
                          <button
                            onClick={() => handleUpdateContactStatus(c.id, 'replied')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Replied
                          </button>
                        )}
                        {c.status !== 'closed' && (
                          <button
                            onClick={() => handleUpdateContactStatus(c.id, 'closed')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Closed
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'contact',
                            id: c.id,
                            title: `Inquiry from ${c.name}`,
                          })
                        }
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REVIEWS (100% REAL) */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#201814]">
                  Customer Reviews ({reviews.length})
                </h3>
                <p className="text-xs text-[#6B5B52]">
                  Authentic reviews submitted by coffee patrons. Approve, hide, or remove reviews.
                </p>
              </div>
              <button
                onClick={() => downloadExcelSheetCSV('reviews', orders, customers, contacts, reviews)}
                className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] border border-[#E4D8C8] text-[#24150F] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                <span>Export Reviews (.csv)</span>
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8]">
                No reviews yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#201814]">{rev.author}</span>
                      <span className="text-amber-700 font-bold">★ {rev.rating}/5</span>
                    </div>

                    <p className="text-[#6B5B52] leading-relaxed">"{rev.comment}"</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E4D8C8]/60">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rev.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rev.status === 'hidden'
                            ? 'bg-neutral-200 text-neutral-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rev.status}
                        </span>
                        <span className="text-[10px] text-[#948277]">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {rev.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateReviewStatus(rev.id, 'approved')}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {rev.status !== 'hidden' && (
                          <button
                            onClick={() => handleUpdateReviewStatus(rev.id, 'hidden')}
                            className="px-2 py-1 bg-neutral-200 text-neutral-800 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'review',
                              id: rev.id,
                              title: `Review by ${rev.author}`,
                            })
                          }
                          className="text-rose-600 hover:text-rose-800 text-[10px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: ANALYTICS (100% REAL DATA CALCULATIONS) */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E4D8C8] shadow-sm space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>EXECUTIVE ANALYTICS</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                Roastery Performance & Sales Trends
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] mt-1.5 max-w-2xl leading-relaxed">
                Aggregated in real time from live orders and customer profiles.
              </p>
            </div>

            {orders.length === 0 && customers.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6B5B52] bg-[#F7F2EA] rounded-3xl border border-[#E4D8C8]">
                No data available yet
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. EXECUTIVE KPI METRICS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] font-bold text-[#948277] uppercase block">Gross Volume</span>
                    <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
                      ₹{kpis.totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">From {orders.length} real orders</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] font-bold text-[#948277] uppercase block">Average Order Value (AOV)</span>
                    <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
                      ₹{orders.length > 0 ? Math.round(kpis.totalRevenue / orders.length).toLocaleString('en-IN') : 0}
                    </span>
                    <span className="text-[10px] text-[#A37936] font-semibold block mt-1">Per transaction</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] font-bold text-[#948277] uppercase block">Fulfilment Rate</span>
                    <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">
                      {orders.length > 0 ? Math.round((kpis.deliveredOrders / orders.length) * 100) : 0}%
                    </span>
                    <span className="text-[10px] text-emerald-800 font-semibold block mt-1">{kpis.deliveredOrders} delivered</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8]">
                    <span className="text-[10px] font-bold text-[#948277] uppercase block">Customer Directory</span>
                    <span className="font-serif text-2xl font-bold text-[#201814] block mt-1">
                      {customers.length}
                    </span>
                    <span className="text-[10px] text-[#6B5B52] font-semibold block mt-1">Firestore accounts</span>
                  </div>
                </div>

                {/* 2. ORDERS & REVENUE OVER TIME */}
                <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-[#201814]">Orders & Revenue Over Time</h4>
                    <span className="text-[10px] text-[#948277] font-semibold uppercase">Daily Timeline</span>
                  </div>
                  {analyticsData.ordersOverTime.length === 0 ? (
                    <p className="text-xs text-[#6B5B52]">No data available yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E4D8C8] text-[#948277] font-semibold text-[10px] uppercase">
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Orders Count</th>
                            <th className="py-2 px-3 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4D8C8]/60">
                          {analyticsData.ordersOverTime.map((t) => (
                            <tr key={t.date} className="hover:bg-white/60">
                              <td className="py-2.5 px-3 font-mono font-medium text-[#201814]">{t.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-[#201814]">{t.orders} order(s)</td>
                              <td className="py-2.5 px-3 text-right font-serif font-bold text-[#24150F]">₹{t.revenue.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. TOP PRODUCTS & ORDER STATUS DISTRIBUTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TOP PRODUCTS */}
                  <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                    <h4 className="font-serif text-sm font-bold text-[#201814]">Top Selling Products</h4>
                    {analyticsData.topProducts.length === 0 ? (
                      <p className="text-xs text-[#6B5B52]">No data available yet</p>
                    ) : (
                      <div className="space-y-2.5">
                        {analyticsData.topProducts.map((p, idx) => (
                          <div key={p.name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E4D8C8]">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#24150F] text-[#DFBF82] text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-xs text-[#201814]">{p.name}</p>
                                <p className="text-[10px] text-[#6B5B52]">{p.quantity} units sold</p>
                              </div>
                            </div>
                            <span className="font-serif font-bold text-xs text-[#24150F]">₹{p.revenue.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ORDER STATUS DISTRIBUTION */}
                  <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                    <h4 className="font-serif text-sm font-bold text-[#201814]">Order Status Distribution</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-[#E4D8C8]">
                        <span className="text-[10px] text-amber-700 font-bold block uppercase">Pending</span>
                        <span className="text-xl font-bold text-[#201814]">{kpis.pendingOrders}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E4D8C8]">
                        <span className="text-[10px] text-blue-700 font-bold block uppercase">In Transit / Roasting</span>
                        <span className="text-xl font-bold text-[#201814]">{kpis.processingOrders}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E4D8C8]">
                        <span className="text-[10px] text-emerald-700 font-bold block uppercase">Delivered</span>
                        <span className="text-xl font-bold text-[#201814]">{kpis.deliveredOrders}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#E4D8C8]">
                        <span className="text-[10px] text-rose-700 font-bold block uppercase">Cancelled</span>
                        <span className="text-xl font-bold text-[#201814]">{kpis.cancelledOrders}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. CUSTOMER GROWTH & PRODUCT INVENTORY BREAKDOWN */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CUSTOMER GROWTH */}
                  <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                    <h4 className="font-serif text-sm font-bold text-[#201814]">Customer Growth</h4>
                    {analyticsData.customerGrowth.length === 0 ? (
                      <p className="text-xs text-[#6B5B52]">No data available yet</p>
                    ) : (
                      <div className="space-y-2">
                        {analyticsData.customerGrowth.map((g) => (
                          <div key={g.month} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E4D8C8] text-xs">
                            <span className="font-mono text-[#201814]">{g.month}</span>
                            <span className="font-bold text-emerald-700">+{g.count} registered</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PRODUCT INVENTORY */}
                  <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
                    <h4 className="font-serif text-sm font-bold text-[#201814]">Product Inventory Breakdown</h4>
                    {analyticsData.inventoryBreakdown.length === 0 ? (
                      <p className="text-xs text-[#6B5B52]">No data available yet</p>
                    ) : (
                      <div className="space-y-2">
                        {analyticsData.inventoryBreakdown.map((cat) => (
                          <div key={cat.category} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E4D8C8] text-xs">
                            <div>
                              <span className="font-bold text-[#201814] block">{cat.category}</span>
                              <span className="text-[10px] text-[#6B5B52]">{cat.total} products ({cat.stock} units total)</span>
                            </div>
                            {cat.lowStock > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {cat.lowStock} Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                In Stock
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: MICROSOFT EXCEL INTEGRATION & EXPORT CENTER */}
        {activeTab === 'excel' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E4D8C8] shadow-sm space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>MICROSOFT EXCEL 365 WORKBOOK ARCHITECTURE</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                Excel Data Management & Export Center
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] mt-1.5 max-w-2xl leading-relaxed">
                Export real live customer records, placed orders, and payment transactions formatted to open natively in Microsoft Excel.
              </p>
            </div>

            {/* FIRESTORE REAL-TIME BACKEND STATUS CARD */}
            <div className="p-6 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-serif text-lg font-bold text-[#201814]">
                  Cloud Firestore Real-time Engine (Production Active)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-emerald-50 text-emerald-800 border-emerald-200">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-xs text-[#6B5B52]">
                All customer accounts, catalogue items, orders, transactions, inquiries, and reviews are stored securely in Google Cloud Firestore with real-time bidirectional synchronization.
              </p>
            </div>


            {/* SYNC TRIGGER CARD */}
            <div className="p-6 rounded-2xl bg-[#170C08] text-white border border-[#342017] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Microsoft Graph API Cloud Sync
                  </h3>
                  <p className="text-xs text-[#EDE2D2]/80 mt-1">
                    Triggers server-side workbook synchronization using private environment credentials.
                  </p>
                </div>
                <button
                  onClick={handleTriggerExcelSync}
                  disabled={isSyncingExcel}
                  className="px-6 py-3 bg-[#C49A5A] text-[#170C08] hover:bg-[#DFBF82] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingExcel ? 'animate-spin' : ''}`} />
                  <span>{isSyncingExcel ? 'Syncing...' : 'Sync to Excel Online'}</span>
                </button>
              </div>

              {excelSyncStatus && (
                <div className="p-3 bg-[#342017] rounded-xl text-xs text-[#DFBF82] font-mono border border-[#C49A5A]/30">
                  {excelSyncStatus}
                </div>
              )}
            </div>

            {/* 6 INDIVIDUAL REAL SHEET DOWNLOAD BUTTONS */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#201814]">
                Download Live Excel Sheets (.CSV)
              </h3>
              <p className="text-xs text-[#6B5B52]">
                Instant offline Excel exports formatted with real data from Cloud Firestore:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {[
                  {
                    sheet: 'customers',
                    title: `Sheet 1: CUSTOMERS (${customers.length})`,
                    desc: 'Real customer IDs, names, emails, phones, and addresses from Firestore.',
                  },
                  {
                    sheet: 'orders',
                    title: `Sheet 2: ORDERS (${orders.length})`,
                    desc: 'Real placed customer orders, items, amounts, dates, and roasting status.',
                  },
                  {
                    sheet: 'payments',
                    title: `Sheet 3: PAYMENTS (${payments.length})`,
                    desc: 'Real payment ledger derived from authentic storefront orders.',
                  },
                  {
                    sheet: 'products',
                    title: `Sheet 4: PRODUCTS (${products.length})`,
                    desc: 'Live coffee catalogue with prices, weights, categories, and stock.',
                  },
                  {
                    sheet: 'contacts',
                    title: `Sheet 5: CONTACTS (${contacts.length})`,
                    desc: 'Real concierge inquiries submitted by customers.',
                  },
                  {
                    sheet: 'reviews',
                    title: `Sheet 6: REVIEWS (${reviews.length})`,
                    desc: 'Authentic customer ratings, reviews, and feedback.',
                  },
                ].map((item) => (
                  <div
                    key={item.sheet}
                    className="p-5 rounded-2xl bg-[#F7F2EA] border border-[#E4D8C8] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-[#201814]">{item.title}</h4>
                      <p className="text-[10px] text-[#6B5B52] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        downloadExcelSheetCSV(
                          item.sheet as keyof ExcelWorkbookData,
                          orders,
                          customers,
                          contacts,
                          reviews
                        )
                      }
                      className="w-full py-2 bg-white hover:bg-[#24150F] hover:text-[#DFBF82] text-[#201814] border border-[#E4D8C8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C49A5A]" />
                      <span>Download {item.sheet.toUpperCase()}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDER INSPECTION MODAL */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-2xl space-y-5 animate-fadeIn my-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3.5">
                <div>
                  <span className="text-[10px] text-[#948277] uppercase font-bold tracking-wider block">
                    Order Inspection & Fulfillment Management
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="font-mono text-xl font-bold text-[#24150F]">
                      {formatDisplayOrderId(selectedOrder.orderNumber || selectedOrder.orderId)}
                    </h3>
                    <span className="text-xs text-[#6B5B52] bg-[#F7F2EA] px-2.5 py-0.5 rounded-full border border-[#E4D8C8]">
                      {selectedOrder.createdAt}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl hover:bg-[#F7F2EA] text-[#6B5B52] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer and Shipping Details */}
              <div className="p-4 bg-[#F7F2EA] rounded-2xl space-y-1 text-xs border border-[#E4D8C8]">
                <span className="text-[10px] text-[#948277] font-bold uppercase tracking-wider block">
                  Customer & Shipping Destination
                </span>
                <p className="font-bold text-sm text-[#201814]">{selectedOrder.customer?.fullName}</p>
                <p className="text-[#6B5B52]">
                  {selectedOrder.customer?.email} • {selectedOrder.customer?.phone}
                </p>
                <p className="text-[#6B5B52] pt-1">
                  <strong>Delivery Address:</strong> {selectedOrder.customer?.address}, {selectedOrder.customer?.city}, {selectedOrder.customer?.state} - {selectedOrder.customer?.pincode}
                </p>
              </div>

              {/* Items & Variants in Roast Batch */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-[#948277] font-bold uppercase tracking-wider block">
                  Products in Roast Batch ({selectedOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-[#E4D8C8]/60 bg-[#FCFAF6] rounded-xl border border-[#E4D8C8] p-3 space-y-2">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center pt-2 first:pt-0">
                      <div>
                        <span className="font-bold text-[#201814]">{it.product?.name}</span>
                        <span className="text-[11px] text-[#A37936] block font-semibold">
                          Variant / Jar Size: {it.selectedWeight} × {it.quantity}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-[#24150F]">
                        ₹{it.price * it.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 font-bold text-sm border-t border-[#E4D8C8]">
                    <span>Total Order Value:</span>
                    <span className="font-serif text-lg text-[#24150F]">₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT VERIFICATION SECTION */}
              {(() => {
                const isCodOrder = Boolean(
                  selectedOrder.paymentMethod?.toLowerCase().includes('cash on delivery') ||
                  selectedOrder.paymentMethod?.toLowerCase().includes('cod')
                );
                const isPaymentApproved =
                  selectedOrder.paymentVerificationStatus === 'paid' ||
                  selectedOrder.paymentVerificationStatus === 'confirmed' ||
                  selectedOrder.paymentStatus === 'Payment Approved' ||
                  selectedOrder.paymentStatus === 'payment_approved' ||
                  selectedOrder.paymentStatus === 'Payment Confirmed' ||
                  selectedOrder.paymentStatus === 'Paid';
                const isPaymentRejected =
                  selectedOrder.paymentVerificationStatus === 'rejected' ||
                  selectedOrder.paymentStatus === 'Payment Rejected' ||
                  selectedOrder.paymentStatus === 'payment_rejected' ||
                  selectedOrder.paymentStatus === 'failed';

                return (
                  <div className="p-4 rounded-2xl border-2 border-[#D7AD36]/50 bg-[#FCFAF6] space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5f259f]" />
                        <span className="font-bold text-sm text-[#24150F]">
                          Payment & UTR Verification
                        </span>
                      </div>
                      <span className="font-semibold text-[#6B5B52]">
                        Method: {selectedOrder.paymentMethod}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-[#948277] uppercase font-bold block">
                          Customer UTR / Reference No.
                        </span>
                        {selectedOrder.utrNumber ? (
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-white px-2.5 py-1 rounded-lg border border-[#E4D8C8] font-mono font-bold text-[#24150F] text-xs">
                              {selectedOrder.utrNumber}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(selectedOrder.utrNumber || '');
                                showFlash('UTR copied to clipboard');
                              }}
                              className="text-[11px] text-[#A37936] hover:underline cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        ) : isCodOrder ? (
                          <span className="text-[11px] text-[#948277] italic mt-1 block">
                            No UTR required (Cash on Delivery)
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#948277] italic mt-1 block">
                            No UTR number submitted yet
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-[#948277] uppercase font-bold block">
                          Verification Status
                        </span>
                        <div className="mt-1">
                          {isPaymentApproved ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Payment Approved & Verified</span>
                              </span>
                              {(selectedOrder.paymentVerifiedBy || selectedOrder.paymentVerifiedAt) && (
                                <p className="text-[10px] text-emerald-700">
                                  {selectedOrder.paymentVerifiedBy ? `Confirmed by: ${selectedOrder.paymentVerifiedBy}` : 'Confirmed by Administrator'}
                                  {selectedOrder.paymentVerifiedAt ? ` • ${new Date(selectedOrder.paymentVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                                </p>
                              )}
                            </div>
                          ) : isPaymentRejected ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                <X className="w-3.5 h-3.5" />
                                <span>Payment Rejected</span>
                              </span>
                              {selectedOrder.paymentRejectionReason && (
                                <p className="text-[10px] text-rose-700">
                                  Reason: {selectedOrder.paymentRejectionReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Verification Pending</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Verification Actions */}
                    <div className="pt-2 flex flex-wrap gap-2 border-t border-[#E4D8C8]">
                      {!isPaymentApproved ? (
                        <>
                          <button
                            type="button"
                            disabled={isVerifyingPayment || processingOrderIds.has(selectedOrder.firestoreDocId || selectedOrder.orderId) || processingOrderIds.has(selectedOrder.orderId)}
                            onClick={() => handleVerifyPayment(selectedOrder.firestoreDocId || selectedOrder.orderId, selectedOrder)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            {isVerifyingPayment ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{isVerifyingPayment ? 'Verifying...' : 'Verify Payment (Confirm Received)'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isVerifyingPayment || processingOrderIds.has(selectedOrder.firestoreDocId || selectedOrder.orderId) || processingOrderIds.has(selectedOrder.orderId)}
                            onClick={() => handleOpenRejectModal(selectedOrder)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject Payment</span>
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              Payment verified against merchant bank statement. Authorized by {selectedOrder.paymentVerifiedBy || 'Administrator'}.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUnverifyModalOrder(selectedOrder)}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1 transition-colors"
                            title="Correct or Unverify Payment (Audit Required)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Correct / Unverify</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* FULFILLMENT & COURIER TRACKING FORM */}
              <div className="p-4 rounded-2xl border border-[#E4D8C8] bg-white space-y-3 text-xs">
                <span className="text-[10px] text-[#948277] font-bold uppercase tracking-wider block">
                  Courier Dispatch & Fulfillment Controls
                </span>

                {/* Prepayment Verification Safeguard Banner */}
                {!(
                  selectedOrder.paymentMethod?.toLowerCase().includes('cash on delivery') ||
                  selectedOrder.paymentMethod?.toLowerCase().includes('cod')
                ) &&
                  selectedOrder.paymentVerificationStatus !== 'confirmed' &&
                  selectedOrder.paymentVerificationStatus !== 'paid' &&
                  selectedOrder.paymentStatus !== 'Payment Confirmed' &&
                  selectedOrder.paymentStatus !== 'Payment Approved' &&
                  selectedOrder.paymentStatus !== 'payment_approved' &&
                  selectedOrder.paymentStatus !== 'Paid' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Prepayment Required:</strong> Packing and shipping are blocked until payment is verified against merchant bank statements. Please verify payment above before changing fulfillment to Packed or Shipped.
                      </span>
                    </div>
                  )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#201814] mb-1">
                      Fulfillment Status:
                    </label>
                    <select
                      value={fulfillmentStatusInput}
                      onChange={(e) => setFulfillmentStatusInput(e.target.value as OrderStatus)}
                      className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs font-semibold text-[#201814]"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing (Roasting Batch)</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#201814] mb-1">
                      Courier Name:
                    </label>
                    <input
                      type="text"
                      value={courierNameInput}
                      onChange={(e) => setCourierNameInput(e.target.value)}
                      placeholder="e.g. Delhivery, Blue Dart, DTDC"
                      className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#201814] mb-1">
                      Courier Tracking / AWB ID:
                    </label>
                    <input
                      type="text"
                      value={courierTrackingIdInput}
                      onChange={(e) => setCourierTrackingIdInput(e.target.value)}
                      placeholder="e.g. DL94821034"
                      className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs font-mono text-[#201814]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#201814] mb-1">
                      External Tracking URL:
                    </label>
                    <input
                      type="url"
                      value={courierTrackingUrlInput}
                      onChange={(e) => setCourierTrackingUrlInput(e.target.value)}
                      placeholder="https://www.delhivery.com/track/package/..."
                      className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isUpdatingTracking}
                    onClick={() => handleSaveFulfillmentAndTracking(selectedOrder.orderId)}
                    className="px-4 py-2.5 bg-[#24150F] hover:bg-[#342017] text-[#DFBF82] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C49A5A]" />
                    <span>{isUpdatingTracking ? 'Saving...' : 'Save Courier & Fulfillment Details'}</span>
                  </button>
                </div>
              </div>

              {/* AUDIT TRAIL & STATUS HISTORY */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="p-4 rounded-2xl border border-[#E4D8C8] bg-[#F7F2EA]/60 space-y-2.5 text-xs">
                  <span className="text-[10px] text-[#948277] font-bold uppercase tracking-wider block">
                    Audit Trail & Verification Log ({selectedOrder.statusHistory.length} events)
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.statusHistory.map((hist, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-[#E4D8C8] text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[#201814]">{hist.status}</strong>
                          <span className="text-[10px] text-[#948277] font-mono">
                            {new Date(hist.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#6B5B52]">
                          Actor: <strong className="text-[#201814]">{hist.actor}</strong>
                          {hist.note && <span> • {hist.note}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENT REJECTION MODAL */}
        {rejectionModalOrder && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setRejectionModalOrder(null)}
          >
            <div
              className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#E4D8C8] shadow-2xl space-y-4 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#201814]">
                  Reject Payment for {formatDisplayOrderId(rejectionModalOrder.orderNumber || rejectionModalOrder.orderId)}
                </h3>
                <button
                  onClick={() => setRejectionModalOrder(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-[#6B5B52]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Transaction details card */}
                <div className="p-3 bg-[#F7F2EA] rounded-xl border border-[#E4D8C8] space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-[#201814]">
                    <span className="text-[#6B5B52]">Order Reference:</span>
                    <span className="font-mono font-bold">{formatDisplayOrderId(rejectionModalOrder.orderNumber || rejectionModalOrder.orderId)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#201814]">
                    <span className="text-[#6B5B52]">Payable Amount:</span>
                    <span className="font-bold text-[#201814]">₹{rejectionModalOrder.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#201814]">
                    <span className="text-[#6B5B52]">Customer Name:</span>
                    <span className="font-medium text-[#201814] truncate max-w-[200px]">{rejectionModalOrder.customer?.fullName || 'Valued Customer'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#201814]">
                    <span className="text-[#6B5B52]">Submitted UTR:</span>
                    {rejectionModalOrder.utrNumber ? (
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {rejectionModalOrder.utrNumber}
                      </span>
                    ) : (
                      <span className="text-[#948277] italic">No UTR submitted</span>
                    )}
                  </div>
                </div>

                <p className="text-[#6B5B52]">
                  Specify the mandatory audit reason why this payment cannot be confirmed. This reason is permanently recorded in the immutable audit trail and displayed on the customer tracking view.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="e.g. Transaction reference not found in PhonePe / HDFC merchant statement..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4D8C8]">
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={() => setRejectionModalOrder(null)}
                  className="px-3.5 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#24150F] rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRejecting || !rejectionReasonText.trim()}
                  onClick={handleConfirmRejectPayment}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span>Confirm Rejection</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT UNVERIFY MODAL */}
        {unverifyModalOrder && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setUnverifyModalOrder(null)}
          >
            <div
              className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#E4D8C8] shadow-2xl space-y-4 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#201814] flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>Unverify Payment ({formatDisplayOrderId(unverifyModalOrder.orderNumber || unverifyModalOrder.orderId)})</span>
                </h3>
                <button
                  onClick={() => setUnverifyModalOrder(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-[#6B5B52]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Warning:</strong> Unverifying this transaction will revert the payment status to <em>Pending Verification</em>, order state to <em>Payment Review</em>, and block dispatch until re-reviewed.
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Mandatory Reason for Unverifying *
                  </label>
                  <textarea
                    rows={3}
                    value={unverifyReasonText}
                    onChange={(e) => setUnverifyReasonText(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="e.g. Bank chargeback / credit reversal detected in merchant statement..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4D8C8]">
                <button
                  type="button"
                  onClick={() => setUnverifyModalOrder(null)}
                  className="px-3.5 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#24150F] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUnverifying || !unverifyReasonText.trim()}
                  onClick={handleConfirmUnverifyPayment}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isUnverifying ? 'Unverifying...' : 'Confirm Unverification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLAG FOR INVESTIGATION MODAL */}
        {flagModalOrder && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setFlagModalOrder(null)}
          >
            <div
              className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#E4D8C8] shadow-2xl space-y-4 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#201814] flex items-center gap-2">
                  <Flag className="w-5 h-5 text-purple-700" />
                  <span>Flag for Investigation</span>
                </h3>
                <button
                  onClick={() => setFlagModalOrder(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-[#6B5B52]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[#6B5B52]">
                  Flagging this transaction marks it as <em>Under Review</em> for fraud, duplicate UTR usage across orders, or mismatched amounts.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Investigation Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={flagReasonText}
                    onChange={(e) => setFlagReasonText(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="e.g. Duplicate UTR detected, customer reference does not match credited amount..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4D8C8]">
                <button
                  type="button"
                  onClick={() => setFlagModalOrder(null)}
                  className="px-3.5 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#24150F] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isFlagging || !flagReasonText.trim()}
                  onClick={handleConfirmFlagPayment}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isFlagging ? 'Flagging...' : 'Confirm Flag'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PAYMENT METADATA MODAL */}
        {editMetaModalOrder && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setEditMetaModalOrder(null)}
          >
            <div
              className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#E4D8C8] shadow-2xl space-y-4 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#201814] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#C49A5A]" />
                  <span>Edit Payment Metadata</span>
                </h3>
                <button
                  onClick={() => setEditMetaModalOrder(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-[#6B5B52]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[11px] text-[#6B5B52]">
                  All modifications are recorded permanently in an immutable audit log including old value, new value, admin UID, and justification.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Field to Edit *
                  </label>
                  <select
                    value={editMetaField}
                    onChange={(e) => {
                      const f = e.target.value as any;
                      setEditMetaField(f);
                      if (editMetaModalOrder) {
                        setEditMetaNewValue(String(editMetaModalOrder[f as keyof OrderDetails] || ''));
                      }
                    }}
                    className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs font-semibold text-[#201814]"
                  >
                    <option value="utrNumber">UTR Transaction Reference</option>
                    <option value="assignedStaff">Assigned Fulfillment Staff</option>
                    <option value="amountReceived">Amount Received (Reconciled INR)</option>
                    <option value="verificationNotes">Verification Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    New Value *
                  </label>
                  <input
                    type="text"
                    value={editMetaNewValue}
                    onChange={(e) => setEditMetaNewValue(e.target.value)}
                    placeholder="Enter updated value..."
                    className="w-full p-2 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Audit Justification / Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={editMetaReason}
                    onChange={(e) => setEditMetaReason(e.target.value)}
                    placeholder="e.g. Corrected typo in UTR reference per customer bank screenshot..."
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4D8C8]">
                <button
                  type="button"
                  onClick={() => setEditMetaModalOrder(null)}
                  className="px-3.5 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#24150F] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isEditingMeta || !editMetaReason.trim() || !editMetaNewValue.trim()}
                  onClick={handleConfirmEditMetadata}
                  className="px-4 py-2 bg-[#24150F] hover:bg-[#3B2314] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEditingMeta ? 'Saving...' : 'Save & Record Audit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT ADD / EDIT MODAL */}
        {isProductModalOpen && editingProduct && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setIsProductModalOpen(false)}
          >
            <div
              className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-2xl space-y-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#E4D8C8] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#201814]">
                  {editingProduct.id ? 'Edit Product' : 'Add New Product to Firestore'}
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-[#6B5B52] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="e.g. SJT Signature Roast"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Category</label>
                    <select
                      value={editingProduct.category || 'Coffee Powder'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                      className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    >
                      <option value="Coffee Powder">Coffee Powder</option>
                      <option value="Filter Coffee">Filter Coffee</option>
                      <option value="Specialty">Specialty</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Status</label>
                    <select
                      value={editingProduct.status || 'active'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                      className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Deactivated)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingProduct.price ?? 450}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Stock (Units)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingProduct.stock ?? 50}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    />
                  </div>
                </div>

                {/* VARIANT WEIGHT PRICING */}
                <div className="p-3 bg-[#F7F2EA] rounded-2xl border border-[#E4D8C8] space-y-2">
                  <span className="block text-[10px] font-bold text-[#948277] uppercase tracking-wider">
                    Variant Weight Pricing (₹)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['50g', '100g', '250g'].map((w) => (
                      <div key={w}>
                        <label className="block text-[9px] font-mono font-bold text-[#201814] mb-0.5">{w}</label>
                        <input
                          type="number"
                          min={0}
                          value={(editingProduct as any).weightPrices?.[w] ?? ''}
                          placeholder={String(editingProduct.price || 0)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              weightPrices: {
                                ...((editingProduct as any).weightPrices || {}),
                                [w]: val,
                              },
                            } as any);
                          }}
                          className="w-full p-2 bg-white border border-[#E4D8C8] rounded-lg text-xs font-mono text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">
                    Verified Blend Formulation
                  </label>
                  <input
                    type="text"
                    value={(editingProduct as any).verifiedBlendRatio || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, verifiedBlendRatio: e.target.value } as any)}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="e.g. 100% Arabica Coffee | Zero Chicory"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProduct.tagline || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="Short description or tagline"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                    placeholder="Detailed coffee and roastery description"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#948277] uppercase mb-1">Product Image</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={editingProduct.imageUrl || editingProduct.images?.[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value, images: [e.target.value] })}
                      className="w-full p-2.5 bg-[#F7F2EA] border border-[#E4D8C8] rounded-xl text-xs text-[#201814] focus:outline-none focus:border-[#C49A5A]"
                      placeholder="Image URL (e.g. https://...)"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6B5B52]">Or upload to Firebase Storage:</span>
                      <label className="cursor-pointer px-3 py-1 bg-[#24150F] text-[#DFBF82] rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#342017]">
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingImage(true);
                            try {
                              const url = await uploadProductImage(file);
                              setEditingProduct((prev) => (prev ? { ...prev, imageUrl: url, images: [url] } : prev));
                              showFlash('Image uploaded to Firebase Storage!');
                            } catch (err: any) {
                              showFlash(err?.message || 'Failed to upload image', 'error');
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4D8C8]">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E4D8C8] bg-white text-[#201814] hover:bg-neutral-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 rounded-xl bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isSavingProduct ? 'Saving...' : 'Save to Firestore'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 bg-[#24150F]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="max-w-sm w-full bg-white rounded-3xl p-6 border border-[#E4D8C8] shadow-2xl text-center space-y-4 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-[#201814]">Confirm Deletion</h4>
                <p className="text-xs text-[#6B5B52] mt-1">
                  Are you sure you want to permanently delete <strong>{deleteConfirm.title}</strong> from Firestore? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 bg-[#F7F2EA] hover:bg-[#EDE2D2] text-[#201814] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
